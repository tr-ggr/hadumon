"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { CatDetail } from "~/components/run/CatPick";
import { prefersCalm } from "~/components/run/fx/dom";
import {
  Board,
  KeyHint,
  TableButton,
  TableLink,
  useToast,
} from "~/components/ui";
import type { Owned } from "~/server/game/collection";
import { ELEMENT_LABELS } from "~/server/game/elements";
import {
  packCats,
  packPieces,
  PACK_LIST,
  PACKS,
  type Pack,
} from "~/server/game/packs";
import { api, type RouterOutputs } from "~/trpc/react";

import { leftToFind, packPhrase, shelfSentence, standing } from "./copy";
import { PackContents } from "./PackContents";
import { PackOpening, paceStyle } from "./PackOpening";
import { PackReveal } from "./PackReveal";
import { PackShelf, packTabId, type ShelfItem } from "./PackShelf";
import { packHolds } from "./packs";
import {
  allUp,
  DEAL_MS,
  heldBack,
  PICK_MS,
  pulled,
  revealSentence,
} from "./reveal";
import { useOpenPack } from "./useOpenPack";
import { useReveal } from "./useReveal";

type Shelf = RouterOutputs["shop"]["packs"];

export interface ShopProps {
  /** The balance and every pack's price, as the server has them. */
  shelf: Shelf;
  /** The cats the account holds, by id; `null` while that is not known. */
  owned: Owned | null;
  /** The cosmetics the account has gained; `null` while that is not known. */
  gained: readonly string[] | null;
  /** The balance the lid is showing, from the profile; `null` if it shows none. */
  lidCoins: number | null;
  /** A cosmetic's drawing, by id, once the drawings exist. */
  pieceDrawing?: (cosmeticId: string) => ReactNode;
}

/**
 * The shop: a shelf of packs and, when one is bought, its opening. The two
 * share one board and one rail. On the shelf the rail says what the pack in
 * the middle costs and holds the one confirm; while a pack is open it says
 * what came out and holds the cut, and then the turn.
 *
 * From the press that buys a pack until its cards are out, the board above
 * the rail is a darkened stage (`.pack-room`): an ink wash comes down over
 * the shelf, and the pack is opened on top of it (`PackOpening`), where it
 * stood. The first pack of a visit is opened in full and every one after it
 * cut short.
 *
 * The opening is state of its own (`useReveal`), not something read off a
 * query, so the shelf being fetched again under it changes nothing it shows.
 */
export function Shop({
  shelf,
  owned,
  gained,
  lidCoins,
  pieceDrawing,
}: ShopProps) {
  const idBase = useId();
  const panelId = `${idBase}-panel`;
  const notify = useToast();

  const [shown, setShown] = useState<string>(PACK_LIST[0]?.id ?? "");
  const [looking, setLooking] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  /** Why the last press opened nothing; gone at the next press or pack. */
  const [refusal, setRefusal] = useState<string | null>(null);

  const { reveal, start, turnCard, step, skip, turnAll, close } = useReveal();
  /** How many packs this visit has opened: the first is opened in full. */
  const opened = useRef(0);
  /**
   * The pack that has been picked off the shelf and not yet opened or
   * refused: from the press, through the request, until its reveal starts.
   */
  const [picked, setPicked] = useState<string | null>(null);
  const pressedAt = useRef(0);
  const starting = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(starting.current), []);
  /** Whether the stage has been dark at all: only then is there a wash to lift. */
  const [washed, setWashed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const confirmId = `${idBase}-confirm`;
  /** Set when a reveal is put away, so the focus goes back to the confirm. */
  const [putAway, setPutAway] = useState(false);

  const { open, pending } = useOpenPack({
    onOpened: useCallback(
      (requestId, pack, before) => {
        setRefusal(null);
        if (pack.replayed) {
          notify("That pack was already open. Nothing more was spent.");
        }
        const begin = () => {
          const pace = opened.current === 0 ? "full" : "short";
          opened.current += 1;
          setPicked(null);
          start(requestId, pack.result, before, pace);
        };
        // However fast the shop answers, the other packs are given the time
        // to drop away first. With reduced motion nothing drops.
        const wait = prefersCalm()
          ? 0
          : PICK_MS - (performance.now() - pressedAt.current);
        clearTimeout(starting.current);
        if (wait > 0) starting.current = setTimeout(begin, wait);
        else begin();
      },
      [notify, start],
    ),
    onRefused: useCallback(
      (sentence: string) => {
        setPicked(null);
        setRefusal(sentence);
        notify(sentence, "error");
      },
      [notify],
    ),
  });

  const items = useMemo<ShelfItem[]>(
    () =>
      PACK_LIST.map((pack) => {
        const row = shelf.packs.find((entry) => entry.id === pack.id);
        const left = row?.left ?? null;
        return {
          pack,
          price: row?.price ?? 0,
          holds: packHolds(pack, left),
          spent: left !== null && left <= 0,
        };
      }),
    [shelf.packs],
  );

  // The pack the board is about: the one being opened, else the one shown.
  const pack: Pack | undefined = PACKS[reveal?.result.packId ?? shown];
  const row = shelf.packs.find((entry) => entry.id === pack?.id);
  const price = row?.price ?? 0;
  const left = row?.left ?? null;
  // A refund is the purse's once its card is up, and not before.
  const balance = shelf.coins - (reveal ? heldBack(reveal) : 0);
  const state = standing(price, left, balance);
  const done = reveal ? allUp(reveal) : false;
  /** The pack on the darkened stage: picked, or being opened. */
  const staged = reveal
    ? reveal.phase === "dealt"
      ? null
      : reveal.phase
    : picked !== null
      ? "picked"
      : null;
  if (staged !== null && !washed) setWashed(true);
  const busy = pending || picked !== null;

  // The lid shows the same purse, read from the profile. While a refund is
  // held back for a card not yet turned, the lid is held back with it.
  const utils = api.useUtils();
  const lidTarget = reveal ? balance : null;
  useEffect(() => {
    if (lidTarget === null || lidCoins === null || lidCoins === lidTarget) {
      return;
    }
    utils.profile.get.setData(undefined, (profile) =>
      profile ? { ...profile, coins: lidTarget } : profile,
    );
  }, [utils, lidTarget, lidCoins]);

  // A pack being opened is announced by its heading taking the focus.
  const revealId = reveal?.id ?? null;
  useEffect(() => {
    if (revealId !== null) heading.current?.focus({ preventScroll: true });
  }, [revealId]);

  // Back on the shelf, the confirm is where the last press was.
  useEffect(() => {
    if (!putAway || revealId !== null) return;
    setPutAway(false);
    document.getElementById(confirmId)?.focus({ preventScroll: true });
  }, [putAway, revealId, confirmId]);

  // Enter or Space turns the next card from anywhere that is not a control
  // of its own, so the cards can be gone through on one key.
  useEffect(() => {
    if (revealId === null || done) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.defaultPrevented || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          "button, a, input, select, textarea, summary, [role='dialog']",
        )
      ) {
        return;
      }
      event.preventDefault();
      step();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [revealId, done, step]);

  if (!pack) return null;

  const show = (packId: string) => {
    setRefusal(null);
    setShown(packId);
  };

  const sentence = reveal
    ? revealSentence(reveal, balance)
    : busy
      ? `Opening ${packPhrase(pack)}.`
      : (refusal ?? shelfSentence(pack, price, left, balance));

  return (
    <>
      <ShopHeader />
      <Board>
        <div
          data-shop
          className="pack-room"
          data-staged={staged ?? undefined}
          style={
            {
              ...paceStyle(reveal?.pace ?? "full"),
              // The wash lifts as the cards land, and at once if they did not fly.
              "--lift-wait": `${reveal?.flown && reveal.pace !== "calm" ? DEAL_MS[reveal.pace].fly : 0}ms`,
            } as CSSProperties
          }
        >
          <div className="mb-1">
            <h2
              ref={heading}
              tabIndex={-1}
              className="text-print text-3xl outline-offset-4"
            >
              {pack.name}
            </h2>
            <p className="mt-1 max-w-[65ch] text-sm">{pack.text}</p>
          </div>

          <div className="relative">
            {staged !== null ? (
              <PackOpening
                packId={pack.id}
                holds={
                  reveal
                    ? pulled(reveal.result)
                    : (items.find((item) => item.pack.id === pack.id)?.holds ??
                      0)
                }
                phase={staged}
                pace={reveal?.pace ?? "full"}
                onCut={step}
              />
            ) : null}
            {!reveal ? (
              <>
                <PackShelf
                  items={items}
                  shown={shown}
                  onShow={show}
                  onLook={setLooking}
                  idBase={idBase}
                  panelId={panelId}
                  picked={picked !== null}
                />
                <div
                  role="tabpanel"
                  id={panelId}
                  aria-labelledby={packTabId(idBase, pack.id)}
                  inert={picked !== null}
                  className="mt-4 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <p className="min-w-0 text-sm font-semibold tabular-nums">
                      <Holding pack={pack} left={left} owned={owned} />
                    </p>
                    <TableButton
                      variant="secondary"
                      onClick={() => setLooking(pack.id)}
                    >
                      What is in it
                    </TableButton>
                  </div>
                  {/* Why a pack cannot be opened is the rail's to say. An
                      empty purse also gets the way to fill it. */}
                  {!state.can && state.reason === "short" && balance <= 0 ? (
                    <div className="border-ink/40 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-2 border-dashed px-3 py-2.5">
                      <p className="text-sm">
                        No coins yet. A run is where they come from.
                      </p>
                      <TableLink href="/run" size="sm">
                        Play a run
                      </TableLink>
                    </div>
                  ) : null}
                  <p className="text-ink-soft max-w-[65ch] text-xs">
                    Coins are won at the table and nowhere else. Nothing here is
                    sold for money.
                  </p>
                </div>
              </>
            ) : reveal.phase === "dealt" ? (
              <PackReveal
                reveal={reveal}
                onTurn={turnCard}
                onDetail={setDetail}
                pieceDrawing={pieceDrawing}
              />
            ) : (
              // The room the pack is opened in, where the shelf was.
              <div aria-hidden className="h-[332px]" />
            )}
          </div>

          {/* The dark that comes down on the stage, and the light a pack
              goes up in. Neither is there with reduced motion. */}
          <span
            aria-hidden
            className="pack-wash"
            data-wash={staged !== null ? "on" : washed ? "off" : undefined}
          />
          <span aria-hidden className="pack-flash" />
          <div aria-hidden data-fx-layer className="fx-layer" />
        </div>

        {/* The board's own edge: it stays at the foot of the window while
            the board runs under it, clear of a phone's dock. */}
        <div className="rail sticky bottom-(--dock-h) z-20 -mx-4 -mb-4 flex flex-col gap-2 px-4 py-2.5 sm:-mx-5 sm:-mb-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p
            aria-live="polite"
            className="text-ink min-w-0 text-sm font-semibold tabular-nums"
          >
            {sentence}
          </p>
          <div className="flex gap-2 sm:shrink-0">
            {!reveal ? (
              <TableButton
                id={confirmId}
                size="md"
                disabled={busy || !state.can}
                onClick={() => {
                  setRefusal(null);
                  pressedAt.current = performance.now();
                  if (open(pack.id)) setPicked(pack.id);
                }}
                className="flex-1 sm:flex-none"
              >
                {busy ? "Opening…" : "Open pack"}
              </TableButton>
            ) : reveal.phase === "ready" ? (
              <>
                <TableButton variant="secondary" size="md" onClick={skip}>
                  Skip
                </TableButton>
                <TableButton
                  size="md"
                  onClick={step}
                  className="flex-1 sm:flex-none"
                >
                  Cut it open
                  <KeyHint>Enter</KeyHint>
                </TableButton>
              </>
            ) : reveal.phase !== "dealt" ? (
              <TableButton
                variant="secondary"
                size="md"
                onClick={skip}
                className="flex-1 sm:flex-none"
              >
                Skip
              </TableButton>
            ) : !done ? (
              <>
                <TableButton
                  variant="secondary"
                  size="md"
                  disabled={reveal.turningAll}
                  onClick={turnAll}
                >
                  Turn them all
                </TableButton>
                <TableButton
                  size="md"
                  disabled={reveal.turningAll}
                  onClick={step}
                  className="flex-1 sm:flex-none"
                >
                  {reveal.result.kind === "cats"
                    ? "Turn a card"
                    : "Turn a piece"}
                  <KeyHint>Enter</KeyHint>
                </TableButton>
              </>
            ) : (
              <>
                {reveal.result.kind === "cats" ? (
                  <TableLink href="/deck">Build your deck</TableLink>
                ) : (
                  <TableLink href="/profile">Try them on</TableLink>
                )}
                <TableButton
                  size="md"
                  onClick={() => {
                    setPutAway(true);
                    close();
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Open another
                </TableButton>
              </>
            )}
          </div>
        </div>
      </Board>

      <PackContents
        packId={looking}
        owned={owned}
        gained={gained}
        left={shelf.packs.find((entry) => entry.id === looking)?.left ?? null}
        pieceDrawing={pieceDrawing}
        onClose={() => setLooking(null)}
      />
      <CatDetail catId={detail} onClose={() => setDetail(null)} />
    </>
  );
}

/** What a pack has in it for this account, in a sentence. */
function Holding({
  pack,
  left,
  owned,
}: {
  pack: Pack;
  left: number | null;
  owned: Owned | null;
}) {
  if (pack.kind === "cosmetics") {
    const total = packPieces(pack).length;
    return <>{leftToFind(left ?? total, total)}</>;
  }
  const cats = packCats(pack);
  const found = owned ? cats.filter((id) => (owned[id] ?? 0) > 0).length : null;
  return (
    <>
      {cats.length} {ELEMENT_LABELS[pack.element]} cats can come out of it.
      {found === null ? null : ` You have found ${found}.`}
    </>
  );
}

/** The head of the page: its name on a plate, as the codex has its own. */
export function ShopHeader() {
  return (
    <header className="flex">
      <h1 className="piece border-ink bg-cream text-print border-2 px-3.5 py-2 text-3xl sm:px-5 sm:text-[40px]">
        Shop
      </h1>
    </header>
  );
}
