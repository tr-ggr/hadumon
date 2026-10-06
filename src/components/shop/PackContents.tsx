"use client";

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { CatCard, ElementMark } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { stackEdge } from "~/components/run/packs";
import { INK } from "~/components/run/pieces";
import { playCat } from "~/components/run/sfx/engine";
import {
  ELEMENT_PALETTES,
  RARITY_PALETTES,
} from "~/components/sprites/palettes";
import { Label, Modal, TableButton } from "~/components/ui";
import { getCat, RARITIES, RARITY_LABELS } from "~/server/game/cats";
import { copyCap, type Owned } from "~/server/game/collection";
import { getCosmetic, SLOT_LABELS } from "~/server/game/cosmetics";
import { ELEMENT_LABELS } from "~/server/game/elements";
import {
  packCats,
  packPieces,
  PACKS,
  type CatPack,
  type CosmeticPack,
} from "~/server/game/packs";

import {
  catPackRule,
  copiesRule,
  leftToFind,
  oddsLines,
  packHeading,
  rarityWord,
  refundRule,
} from "./copy";
import { turned } from "./packs";
import { PieceTile } from "./PieceTile";

export interface PackContentsProps {
  /** The pack that is open to look at; `null` shuts the viewer. */
  packId: string | null;
  /** The cats the account holds, by id; `null` while that is not known. */
  owned: Owned | null;
  /** The cosmetics the account has gained; `null` while that is not known. */
  gained: readonly string[] | null;
  /** Pieces a cosmetic pack still has to find, as the shelf counts them. */
  left: number | null;
  /** A cosmetic's drawing, by id, once the drawings exist. */
  pieceDrawing?: (cosmeticId: string) => ReactNode;
  onClose: () => void;
}

/**
 * What can come out of a pack, in a dialog. A cat pack is every cat of its
 * element, by rarity, with the odds of each of its five cards in words; a
 * cosmetic pack is its pieces, by the slot they are worn in, and how many
 * are still to be found. Looking buys nothing: the way to open the pack is
 * the rail under the shelf. Rendered once, outside the row of packs, so a
 * key pressed in here is not also a key pressed on the row.
 */
export function PackContents({
  packId,
  owned,
  gained,
  left,
  pieceDrawing,
  onClose,
}: PackContentsProps) {
  const pack = packId ? (PACKS[packId] ?? null) : null;
  return (
    <Modal
      open={pack !== null}
      onClose={onClose}
      title={pack ? packHeading(pack) : ""}
      size="wide"
      className="anim-land"
    >
      {pack?.kind === "cats" ? (
        <CatPackContents
          key={pack.id}
          pack={pack}
          owned={owned}
          onClose={onClose}
        />
      ) : pack ? (
        <CosmeticPackContents
          key={pack.id}
          pack={pack}
          gained={gained}
          left={left}
          pieceDrawing={pieceDrawing}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

/**
 * The bar under a viewer's title. It stays at the top of the sheet as the
 * contents scroll under it, so the way out is always in reach.
 */
function ViewerBar({ children }: { children: ReactNode }) {
  return (
    <div className="border-ink/20 bg-cream sticky top-0 z-10 -mx-4 mt-3 flex flex-wrap items-center gap-x-2 gap-y-3 border-b px-4 pt-2 pb-3 sm:-mx-5 sm:px-5">
      {children}
    </div>
  );
}

/** How many of a cat the account holds, in words; "" if that is not known. */
function heldLine(catId: string, owned: Owned | null): string {
  if (!owned) return "";
  const held = owned[catId] ?? 0;
  return held > 0 ? `You hold ${held} of ${copyCap(catId)}.` : "None yet.";
}

type View = "all" | "one";
/** Which side the card on show came in from. */
type Came = "next" | "prev";

const CAME_CLASS: Record<Came, string> = {
  next: "card-next",
  prev: "card-prev",
};

function CatPackContents({
  pack,
  owned,
  onClose,
}: {
  pack: CatPack;
  owned: Owned | null;
  onClose: () => void;
}) {
  /** Every cat of the element, commons first, as the codex orders them. */
  const cats = useMemo(() => {
    const ids = packCats(pack);
    return RARITIES.flatMap((rarity) =>
      ids.filter((id) => getCat(id).rarity === rarity),
    );
  }, [pack]);
  const [view, setView] = useState<View>("all");
  const [at, setAt] = useState(0);
  const [came, setCame] = useState<Came | null>(null);
  const picks = useRef<(HTMLButtonElement | null)[]>([]);

  const count = cats.length;
  const catId = cats[at] ?? "";
  const cat = catId ? getCat(catId) : null;
  const found = owned ? cats.filter((id) => (owned[id] ?? 0) > 0).length : null;

  /** Turns to a card, in its own voice. */
  const go = (index: number, how: Came) => {
    const next = turned(index, 0, count);
    const id = cats[next];
    if (id === undefined || next === at) return next;
    playCat(id);
    setCame(how);
    setAt(next);
    return next;
  };
  const jump = (index: number) => go(index, index < at ? "prev" : "next");

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (view !== "one") return;
    // The strip is a radio group, so the up and down keys move along it too.
    const onStrip =
      event.target instanceof HTMLElement &&
      event.target.getAttribute("role") === "radio";
    let next: number;
    if (event.key === "ArrowRight" || (onStrip && event.key === "ArrowDown")) {
      next = go(at + 1, "next");
    } else if (
      event.key === "ArrowLeft" ||
      (onStrip && event.key === "ArrowUp")
    ) {
      next = go(at - 1, "prev");
    } else if (event.key === "Home") next = jump(0);
    else if (event.key === "End") next = jump(count - 1);
    else return;
    event.preventDefault();
    if (onStrip) picks.current[next]?.focus();
  };

  return (
    <div onKeyDown={onKeyDown}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
        <ElementMark element={pack.element} />
        <span>{ELEMENT_LABELS[pack.element]} cats.</span>
        <span>{catPackRule(count)}</span>
        {found !== null ? (
          <span className="tabular-nums">
            You have found {found} of {count}.
          </span>
        ) : null}
      </p>

      <section aria-label="The odds" className="mt-3">
        <Label>The odds, card by card</Label>
        <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm tabular-nums">
          {oddsLines().map((line) => (
            <div key={line.cards} className="contents">
              <dt className="font-black">{line.cards}</dt>
              <dd>{line.chances}.</dd>
            </div>
          ))}
        </dl>
      </section>

      <ViewerBar>
        <div
          role="group"
          aria-label="How the cats are shown"
          className="flex gap-2"
        >
          {(
            [
              ["all", "All cats"],
              ["one", "One at a time"],
            ] as const
          ).map(([id, label]) => (
            <TableButton
              key={id}
              variant={view === id ? "chosen" : "secondary"}
              aria-pressed={view === id}
              data-autofocus={view === id ? true : undefined}
              onClick={() => setView(id)}
              className={view === id ? "is-pressed" : ""}
            >
              {label}
            </TableButton>
          ))}
        </div>
        <TableButton variant="secondary" onClick={onClose} className="ml-auto">
          Close
        </TableButton>
      </ViewerBar>

      {view === "all" ? (
        <div className="mat mt-4 mb-3 space-y-4 px-0.5 pt-3 pb-4 sm:px-3">
          {RARITIES.map((rarity) => {
            const group = cats.filter((id) => getCat(id).rarity === rarity);
            if (group.length === 0) return null;
            return (
              <section key={rarity} aria-label={RARITY_LABELS[rarity]}>
                <h3 className="text-ink mb-1 px-2 text-xs font-black tabular-nums sm:px-0">
                  {RARITY_LABELS[rarity]} · {group.length}
                </h3>
                <ul className="stack-grid gap-y-5!">
                  {group.map((id) => (
                    <li key={id}>
                      <CatFace
                        catId={id}
                        held={owned ? (owned[id] ?? 0) : null}
                        onShow={() => {
                          playCat(id);
                          setCame(null);
                          setAt(cats.indexOf(id));
                          setView("one");
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {/* Every card is in the one cell, so the sheet is as tall as the
              tallest of them whichever is on show. */}
          <div className="mx-auto grid max-w-md pb-2">
            {cats.map((id, index) => (
              <div
                key={id}
                className={`col-start-1 row-start-1 ${index === at ? (came ? CAME_CLASS[came] : "") : "invisible"}`}
              >
                <CatCard catId={id} variant="full" className="h-full" />
              </div>
            ))}
          </div>

          <div className="mx-auto flex max-w-md items-center gap-3">
            <TableButton
              variant="secondary"
              size="icon"
              aria-label="Previous cat"
              onClick={() => go(at - 1, "prev")}
            >
              <PixelIcon name="chevron" size={16} ink={INK} />
            </TableButton>
            <p
              aria-live="polite"
              className="min-w-0 flex-1 text-center text-sm font-semibold tabular-nums"
            >
              {cat ? `${cat.name}, ${rarityWord(cat.rarity)}. ` : ""}
              {heldLine(catId, owned)} {at + 1} of {count}.
            </p>
            <TableButton
              variant="secondary"
              size="icon"
              aria-label="Next cat"
              onClick={() => go(at + 1, "next")}
            >
              <PixelIcon
                name="chevron"
                size={16}
                ink={INK}
                className="-scale-x-100"
              />
            </TableButton>
          </div>

          <div
            role="radiogroup"
            aria-label={`The ${count} cats in this pack`}
            className="tray-well grid grid-cols-7 gap-y-1 px-1.5 pt-2.5 pb-2 sm:grid-cols-[repeat(11,minmax(0,1fr))]"
          >
            {cats.map((id, index) => {
              const here = index === at;
              const name = getCat(id).name;
              const held = owned ? (owned[id] ?? 0) : null;
              return (
                <button
                  key={id}
                  ref={(node) => {
                    picks.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={here}
                  aria-label={`${name}. ${heldLine(id, owned)}`.trim()}
                  title={name}
                  tabIndex={here ? 0 : -1}
                  onClick={() => jump(index)}
                  className={`relative grid h-11 place-items-center border-2 ${here ? "piece border-ink bg-lime lift" : "liftable border-transparent hover:bg-white"}`}
                >
                  <PixelSprite catId={id} size={32} decorative />
                  {held !== null && held > 0 ? (
                    <span
                      aria-hidden
                      className="border-ink text-pixel absolute -top-1.5 -right-0.5 border bg-white px-0.5 text-[11px] leading-3 tabular-nums"
                    >
                      ×{held}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-ink-soft mt-4 max-w-[65ch] text-xs">
        {copiesRule()} {refundRule()}
      </p>
    </div>
  );
}

/** A stack shows the edge of this many cards under the top one, and no more. */
const MAX_UNDER = 3;

/**
 * One cat of a pack as the small portrait a deck's stacks use (96 by 128),
 * standing as tall as the copies of it the account holds, with that count
 * under it. A cat it holds none of is the same card laid flat and pale. A
 * button: it opens the full card.
 */
function CatFace({
  catId,
  held,
  onShow,
}: {
  catId: string;
  /** Copies the account holds; `null` while that is not known. */
  held: number | null;
  onShow: () => void;
}) {
  const cat = getCat(catId);
  const cap = copyCap(catId);
  const under = Math.min(MAX_UNDER, Math.max(0, (held ?? 1) - 1));
  const none = held === 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onShow}
        aria-label={`${cat.name}, ${rarityWord(cat.rarity)}. ${heldLine(catId, held === null ? null : { [catId]: held })} Show card.`.replace(
          /\s+/g,
          " ",
        )}
        className="card-stack liftable text-ink"
        style={
          {
            "--rarity": RARITY_PALETTES[cat.rarity].outline,
            "--element": ELEMENT_PALETTES[cat.element]["1"],
          } as CSSProperties
        }
      >
        {Array.from({ length: under }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className="stack-under"
            // The lowest copy first, so each one lies on the one before it.
            style={{ "--k": under - index } as CSSProperties}
          />
        ))}
        <span
          aria-hidden
          className={`piece piece-card cat-card border-ink relative flex h-32 flex-col items-center justify-between border-2 pt-1.5 pr-1 pb-1 pl-2 ${none ? "bg-cloth" : "bg-cream"}`}
          style={{ "--e": `${stackEdge(held ?? 1)}px` } as CSSProperties}
        >
          <span className="flex w-full items-center justify-between">
            <span className="text-pixel border-ink bg-lime border-2 px-1 text-xs leading-4">
              {cat.points}
            </span>
            <ElementMark element={cat.element} />
          </span>
          <PixelSprite
            catId={catId}
            size={64}
            decorative
            className={none ? "opacity-45 grayscale" : ""}
          />
          <span className="text-pixel w-full truncate text-center text-[11px] leading-tight">
            {cat.name}
          </span>
        </span>
      </button>
      {held !== null ? (
        <span
          aria-hidden
          className="text-ink text-[11px] leading-none font-bold tabular-nums"
        >
          {held > 0 ? `${held} of ${cap}` : "None yet"}
        </span>
      ) : null}
    </div>
  );
}

function CosmeticPackContents({
  pack,
  gained,
  left,
  pieceDrawing,
  onClose,
}: {
  pack: CosmeticPack;
  gained: readonly string[] | null;
  left: number | null;
  pieceDrawing?: (cosmeticId: string) => ReactNode;
  onClose: () => void;
}) {
  const pieces = useMemo(() => packPieces(pack), [pack]);
  const total = pieces.length;
  const toFind =
    left ??
    (gained ? pieces.filter((id) => !gained.includes(id)).length : null);
  return (
    <div>
      <p className="text-sm font-semibold tabular-nums">
        {pack.text} {toFind !== null ? leftToFind(toFind, total) : null}
      </p>

      <ViewerBar>
        <p className="text-ink-soft min-w-0 flex-1 text-xs font-bold">
          {total} pieces, by where they go.
        </p>
        <TableButton variant="secondary" data-autofocus onClick={onClose}>
          Close
        </TableButton>
      </ViewerBar>

      <div className="mt-4 mb-2 space-y-5">
        {pack.slots.map((slot) => {
          const group = pieces.filter((id) => getCosmetic(id).slot === slot);
          if (group.length === 0) return null;
          const have = gained
            ? group.filter((id) => gained.includes(id)).length
            : null;
          return (
            <section key={slot} aria-label={SLOT_LABELS[slot]}>
              <h3 className="text-ink mb-2 text-xs font-black tabular-nums">
                {SLOT_LABELS[slot]} ·{" "}
                {have === null
                  ? group.length
                  : `${have} of ${group.length} yours`}
              </h3>
              <ul className="grid gap-x-3 gap-y-3.5 sm:grid-cols-2">
                {group.map((id) => (
                  <li key={id}>
                    <PieceTile
                      cosmeticId={id}
                      drawing={pieceDrawing?.(id)}
                      owned={gained?.includes(id) ?? false}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
