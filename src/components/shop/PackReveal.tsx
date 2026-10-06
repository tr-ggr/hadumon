"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

import { CatCard } from "~/components/cats/CatCard";
import { habitatsLabel } from "~/components/cats/Habitats";
import { PixelIcon } from "~/components/PixelIcon";
import { InfoButton } from "~/components/run/CatPick";
import { placed, prefersCalm } from "~/components/run/fx/dom";
import { COIN_COLOR, RARITY_PALETTES } from "~/components/sprites/palettes";
import { getCat, RARITY_LABELS, type Rarity } from "~/server/game/cats";
import { getCosmetic } from "~/server/game/cosmetics";

import { coins } from "./copy";
import { flyOut, turnedOver } from "./fx";
import { Fire, fireStyle } from "./PackWrapper";
import { PieceTile } from "./PieceTile";
import { pulled, pullNote, rarityOf, tell, type Reveal } from "./reveal";

export interface PackRevealProps {
  reveal: Reveal;
  /** A face-down card was pressed. */
  onTurn: (index: number) => void;
  /** Opens a turned cat's full card. */
  onDetail: (catId: string) => void;
  /** A cosmetic's drawing, by id, once the drawings exist. */
  pieceDrawing?: (cosmeticId: string) => ReactNode;
}

/**
 * How far down the board the middle of the pack was while it was opened:
 * where its cards fly out from.
 */
const PACK_MIDDLE = 152;

/** How far a card's fire stands over its top edge, by what it gives away. */
const TELL_PX: Partial<Record<Rarity, number>> = {
  rare: 8,
  epic: 12,
  legendary: 16,
};

/**
 * What came out of a pack, on the board: its cards face down, each a button
 * that turns it over. If the wrapper was played to its end they fly here
 * from where the pack stood; skipped, they are simply dealt.
 *
 * A card that is rare or better gives it away while it is face down, by a
 * row of fire in its rarity's colour behind its top edge. Turned, any card
 * is crossed by a band in its rarity's tone; a rare one throws sparks, and
 * an epic or a legendary comes forward and is held there.
 *
 * Nothing here keeps time or state: `reveal` says which cards are up, and
 * every move is a change of that. Rendering this again, as a refetch does,
 * plays nothing.
 */
export function PackReveal({
  reveal,
  onTurn,
  onDetail,
  pieceDrawing,
}: PackRevealProps) {
  const total = pulled(reveal.result);
  const list = useRef<HTMLUListElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);

  // The cards leave the pack once, as the board they lie on is laid.
  const { id, flown, pace } = reveal;
  useLayoutEffect(() => {
    if (!flown || pace === "calm" || !list.current || prefersCalm()) return;
    const board = placed(list.current);
    flyOut(
      cards.current,
      { x: board.left + board.width / 2, y: board.top + PACK_MIDDLE },
      pace,
    );
  }, [id, flown, pace]);

  // A card turned from the rail may be under it, or off the screen: it is
  // brought just clear in one cut. Its scroll margins are the lid above and
  // the rail and a phone's dock below. Then it throws what its rarity does.
  const last = reveal.last;
  const turned = last === null ? null : rarityOf(reveal, last);
  useEffect(() => {
    const card = last === null ? null : cards.current[last];
    if (!card) return;
    card.scrollIntoView({ block: "nearest" });
    if (turned) turnedOver(card, turned);
  }, [id, last, turned]);

  /** The card's own press: turn it, and leave the focus on what it became. */
  const turnHere = (index: number) => {
    const back = document.activeElement;
    onTurn(index);
    // The back goes when the card is edge-on, and only then can what is
    // under it take the focus: wait for it to show, a frame at a time, and
    // give up if the focus has been taken somewhere else meanwhile.
    const until = performance.now() + SWAP_MS * 4;
    const hand = () => {
      const now = document.activeElement;
      if (now !== back && now !== document.body) return;
      const face =
        cards.current[index]?.querySelector<HTMLElement>("[data-face]");
      if (!face) return;
      if (getComputedStyle(face).visibility !== "visible") {
        if (performance.now() < until) requestAnimationFrame(hand);
        return;
      }
      (face.querySelector<HTMLElement>("button") ?? face).focus();
    };
    requestAnimationFrame(hand);
  };

  return (
    <ul
      ref={list}
      aria-label="What came out of the pack"
      data-count={total}
      className="pull-row flex min-h-[332px] flex-wrap content-center justify-center gap-x-3 gap-y-4 py-2"
    >
      {Array.from({ length: total }, (_, index) => {
        const up = reveal.up[index] === true;
        // A card turned here keeps its turn: the class is put on once, so
        // rendering the list again plays nothing. One that was up from the
        // start (reduced motion) never had a turn to play.
        const turnedHere = up && reveal.last !== null;
        const rarity = rarityOf(reveal, index) ?? "common";
        return (
          <li
            key={index}
            ref={(node) => {
              cards.current[index] = node;
            }}
            // Cards that flew here have landed already: only dealt ones land.
            className={`relative flex max-w-[168px] min-w-0 grow basis-[130px] scroll-mt-20 scroll-mb-52 flex-col gap-3 ${flown ? "" : "deal"}`}
            style={
              {
                "--i": index,
                // How far from the middle of the row it lies.
                "--out": Math.abs(index - (total - 1) / 2),
              } as CSSProperties
            }
          >
            <div
              className={`relative grid flex-1 bg-transparent! ${turnedHere ? "anim-flip" : ""}`}
            >
              <div
                className={`relative isolate ${LAYER} ${up ? "invisible" : "visible"}`}
              >
                <CardBack
                  index={index}
                  total={total}
                  kind={reveal.result.kind}
                  tell={tell(reveal, index)}
                  disabled={up}
                  onTurn={() => turnHere(index)}
                />
              </div>
              <div
                data-face
                tabIndex={reveal.result.kind === "cats" ? undefined : -1}
                inert={!up}
                className={`relative ${LAYER} ${up ? "visible" : "invisible"}`}
              >
                {reveal.result.kind === "cats" ? (
                  <CatFace
                    catId={reveal.result.cats[index]?.catId ?? ""}
                    onDetail={onDetail}
                  />
                ) : (
                  <PieceTile
                    cosmeticId={reveal.result.pieces[index] ?? ""}
                    drawing={pieceDrawing?.(reveal.result.pieces[index] ?? "")}
                    layout="card"
                    className="min-h-[216px]"
                  />
                )}
              </div>
              {/* The band that crosses a card as it turns, in its rarity. */}
              <span
                className={`card-shimmer is-band ${turnedHere ? "opacity-100! before:animate-[pack-shine_520ms_linear_190ms_both]" : ""}`}
                style={
                  {
                    "--tone": `color-mix(in srgb, ${RARITY_PALETTES[rarity].outline} 64%, transparent)`,
                  } as CSSProperties
                }
              />
            </div>
            <PullTag reveal={reveal} index={index} up={up} />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * When a turning card is edge-on, in milliseconds: half of the flip's 380.
 * The back and the face change places then, by `visibility` alone, which
 * takes this long to change and no time to do it.
 */
const SWAP_MS = 190;
/** Both sides of a card lie in the one cell and swap when it is edge-on. */
const LAYER =
  "col-start-1 row-start-1 grid min-w-0 duration-0 motion-safe:transition-[visibility] motion-safe:delay-190";

/**
 * A card face down: the cobalt back of the player's own deck, with its paw.
 * It is the control that turns the card, and it goes when the card is up,
 * halfway through the turn, when the card is edge-on. One that is rare or
 * better has fire behind its top edge (`tell`), taller the rarer it is, and
 * says so to a screen reader too.
 */
function CardBack({
  index,
  total,
  kind,
  tell,
  disabled,
  onTurn,
}: {
  index: number;
  total: number;
  kind: "cats" | "cosmetics";
  tell: Rarity | null;
  disabled: boolean;
  onTurn: () => void;
}) {
  const told = tell ? `, ${RARITY_LABELS[tell].toLowerCase()}` : "";
  return (
    <>
      {tell ? (
        <Fire
          className="card-tell"
          style={
            {
              ...fireStyle(
                RARITY_PALETTES[tell].outline,
                RARITY_PALETTES[tell].glow,
              ),
              "--tell": `${TELL_PX[tell] ?? 0}px`,
            } as CSSProperties
          }
        />
      ) : null}
      <CardBackButton
        label={`Turn over ${kind === "cats" ? "card" : "piece"} ${index + 1} of ${total}${told}`}
        disabled={disabled}
        onTurn={onTurn}
      />
    </>
  );
}

function CardBackButton({
  label,
  disabled,
  onTurn,
}: {
  label: string;
  disabled: boolean;
  onTurn: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTurn}
      disabled={disabled}
      aria-label={label}
      className="piece piece-card liftable border-ink bg-cobalt grid min-h-[216px] place-items-center rounded-lg border-2 p-2"
    >
      <span className="border-cobalt-dark grid h-full w-full place-items-center rounded-sm border-2">
        <PixelIcon name="paw" size={32} ink="#ffffff" />
      </span>
    </button>
  );
}

/** A turned cat: the card a hand holds, with the way to its full card. */
function CatFace({
  catId,
  onDetail,
}: {
  catId: string;
  onDetail: (catId: string) => void;
}) {
  const cat = getCat(catId);
  return (
    <>
      <CatCard
        catId={catId}
        variant="hand"
        className="h-full min-h-[216px] pb-6"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 px-1.5 pb-1">
        <span className="sr-only">{habitatsLabel(cat.rows)}.</span>
        <InfoButton
          name={cat.name}
          onClick={() => onDetail(catId)}
          className="leading-4"
        />
      </div>
    </>
  );
}

/**
 * What became of one thing that came out, on a tag under it: new, a further
 * copy, or one there was no room for and the coins it paid back. A tag keeps
 * its line while the card is face down, so turning a card moves nothing.
 */
function PullTag({
  reveal,
  index,
  up,
}: {
  reveal: Reveal;
  index: number;
  up: boolean;
}) {
  const note = pullNote(reveal, index);
  const piece =
    reveal.result.kind === "cosmetics" ? reveal.result.pieces[index] : null;
  if (!up) {
    return <p aria-hidden className="h-11 text-[11px] leading-[18px]" />;
  }
  if (piece !== null && piece !== undefined) {
    return (
      <p className="h-11 text-center text-[11px] leading-[18px] font-bold motion-safe:animate-[piece-land_240ms_var(--ease-out)_190ms_both]">
        <span className="border-ink bg-lime border-2 px-1 font-black">New</span>
        <span className="sr-only"> {getCosmetic(piece).name}</span>
      </p>
    );
  }
  if (!note) return null;
  return (
    <p className="text-ink h-11 text-center text-[11px] leading-[18px] font-bold tabular-nums motion-safe:animate-[piece-land_240ms_var(--ease-out)_190ms_both]">
      {note.fresh ? (
        <span className="border-ink bg-lime border-2 px-1 font-black">New</span>
      ) : (
        <span>{note.text}</span>
      )}
      {note.refund > 0 ? (
        <span className="border-ink ml-1 inline-flex items-center gap-1 border-2 bg-white px-1 align-middle font-black whitespace-nowrap">
          <PixelIcon name="coin" size={16} fill={COIN_COLOR} />
          {coins(note.refund)} back
        </span>
      ) : null}
    </p>
  );
}
