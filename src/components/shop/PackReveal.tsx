"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { CatCard } from "~/components/cats/CatCard";
import { Habitats } from "~/components/cats/Habitats";
import { PixelIcon } from "~/components/PixelIcon";
import { InfoButton } from "~/components/run/CatPick";
import { COIN_COLOR } from "~/components/sprites/palettes";
import { getCat } from "~/server/game/cats";
import { getCosmetic } from "~/server/game/cosmetics";

import { coins } from "./copy";
import { OpenedPack } from "./PackWrapper";
import { ShelfStage } from "./PackShelf";
import { PieceTile } from "./PieceTile";
import { pulled, pullNote, type Reveal } from "./reveal";

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
 * A pack being opened. It stands where it stood in the middle of the shelf
 * while its top is torn off and its cards show at the mouth; then the cards
 * lie on the board face down, each a button that turns it over.
 *
 * Nothing here keeps time or state: `reveal` says how far the pack has got
 * and which cards are up, and every move is a change of that. Rendering this
 * again, as a refetch does, plays nothing.
 */
export function PackReveal({
  reveal,
  onTurn,
  onDetail,
  pieceDrawing,
}: PackRevealProps) {
  const total = pulled(reveal.result);
  const cards = useRef<(HTMLLIElement | null)[]>([]);

  // A card turned from the rail may be under it, or off the screen: it is
  // brought just clear in one cut. Its scroll margins are the lid above and
  // the rail and a phone's dock below.
  const last = reveal.last;
  useEffect(() => {
    if (last === null) return;
    cards.current[last]?.scrollIntoView({ block: "nearest" });
  }, [last]);

  if (reveal.phase !== "dealt") {
    return (
      <ShelfStage>
        <div className="pack-slot" data-slot="0">
          <OpenedPack
            packId={reveal.result.packId}
            holds={total}
            seal={reveal.phase}
          />
        </div>
      </ShelfStage>
    );
  }

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
      aria-label="What came out of the pack"
      className="flex min-h-[332px] flex-wrap content-center justify-center gap-x-3 gap-y-4 py-2"
    >
      {Array.from({ length: total }, (_, index) => {
        const up = reveal.up[index] === true;
        // A card turned here keeps its turn: the class is put on once, so
        // rendering the list again plays nothing. One that was up from the
        // start (reduced motion) never had a turn to play.
        const turnedHere = up && reveal.last !== null;
        return (
          <li
            key={index}
            ref={(node) => {
              cards.current[index] = node;
            }}
            className="deal flex max-w-[168px] min-w-0 grow basis-[130px] scroll-mt-20 scroll-mb-52 flex-col gap-3"
            style={{ "--i": index } as CSSProperties}
          >
            <div
              className={`grid flex-1 bg-transparent! ${turnedHere ? "anim-flip" : ""}`}
            >
              <div className={`${LAYER} ${up ? "invisible" : "visible"}`}>
                <CardBack
                  index={index}
                  total={total}
                  kind={reveal.result.kind}
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
 * halfway through the turn, when the card is edge-on.
 */
function CardBack({
  index,
  total,
  kind,
  disabled,
  onTurn,
}: {
  index: number;
  total: number;
  kind: "cats" | "cosmetics";
  disabled: boolean;
  onTurn: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTurn}
      disabled={disabled}
      aria-label={`Turn over ${kind === "cats" ? "card" : "piece"} ${index + 1} of ${total}`}
      className="piece piece-card liftable border-ink bg-cobalt grid min-h-[216px] place-items-center border-2 p-2"
    >
      <span className="border-cobalt-dark grid h-full w-full place-items-center border-2">
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
      <CatCard catId={catId} variant="hand" className="h-full min-h-[216px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-1.5 pb-1.5 pl-2">
        <Habitats rows={cat.rows} />
        <InfoButton name={cat.name} onClick={() => onDetail(catId)} />
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
