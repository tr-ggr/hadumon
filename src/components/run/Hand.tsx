"use client";

import type { CSSProperties, PointerEvent } from "react";

import { CatCard } from "~/components/cats/CatCard";
import { getCat } from "~/server/game/cats";
import { auraTotal } from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { InfoButton } from "./CatPick";
import { plural } from "./describe";
import { hasFinePointer, prefersCalm } from "./fx/dom";
import { fanLayout } from "./hand";
import { KeyHint } from "./pieces";
import { playSound } from "./sfx/engine";
import { PLAY_BLOCK_LABELS, playBlock, rowsLabel, type Mode } from "./turn";

/** How far a raised card leans toward the pointer, in degrees. */
const LEAN = 5;

/**
 * Leans a card toward a mouse held over it. The two angles are written
 * straight onto the card as CSS variables, so the pointer moving costs no
 * render. Touch and reduced motion leave the card flat.
 */
function lean(event: PointerEvent<HTMLLIElement>): void {
  if (event.pointerType !== "mouse" || prefersCalm()) return;
  const card = event.currentTarget;
  const box = card.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width - 0.5;
  const y = (event.clientY - box.top) / box.height - 0.5;
  const clamp = (n: number) => Math.max(-0.5, Math.min(0.5, n));
  card.style.setProperty("--lean-y", (clamp(x) * 2 * LEAN).toFixed(2));
  card.style.setProperty("--lean-x", (clamp(y) * -2 * LEAN).toFixed(2));
}

function settle(event: PointerEvent<HTMLLIElement>): void {
  event.currentTarget.style.removeProperty("--lean-x");
  event.currentTarget.style.removeProperty("--lean-y");
}

/** A card turning up under the pointer as it sweeps the fan. */
function turnUp(event: PointerEvent<HTMLLIElement>): void {
  if (event.pointerType === "mouse" && hasFinePointer()) playSound("hover");
}

export interface HandProps {
  match: MatchView;
  mode: Mode;
  busy: boolean;
  onHandCard: (index: number) => void;
  onDetail: (catId: string) => void;
  className?: string;
}

/**
 * The hand, held as a fan along the player's edge of the table. A card at
 * rest leans with the arc and hangs under the edge of the screen; hovered,
 * focused or chosen it stands upright with its whole face showing, and
 * leans a little toward a mouse held over it. Where each card sits comes
 * from `fanLayout`; the stylesheet does the rest.
 */
export function Hand({
  match,
  mode,
  busy,
  onHandCard,
  onDetail,
  className = "",
}: HandProps) {
  const tucking = mode.kind === "tuck";
  const chosen =
    mode.kind === "play" || mode.kind === "tuck" ? mode.hand : null;
  const count = match.hand.length;

  if (count === 0) {
    return (
      <p
        className={`hand-fan text-ink-soft grid place-items-center px-3 text-center text-sm font-semibold ${className}`}
      >
        Your hand is empty. The Prowl draws more.
      </p>
    );
  }

  const fan = fanLayout(count);
  const discount = auraTotal(match.board, "discount");
  return (
    <ul
      aria-label={`Your hand, ${plural(count, "cat")}`}
      className={`hand-fan ${chosen === null ? "" : "is-held"} ${className}`}
      style={
        {
          "--gaps": Math.max(1, count - 1),
          "--last": count - 1,
        } as CSSProperties
      }
    >
      {match.hand.map((catId, index) => {
        const place = fan[index];
        const cat = getCat(catId);
        const selected = chosen === index;
        // A card that cannot be played stays a choice, so the prompt can say why.
        const block =
          match.phase === "turn" && !selected ? playBlock(match, index) : null;
        return (
          <li
            key={`${index}-${catId}`}
            data-hand={index}
            className={selected ? "is-raised" : undefined}
            onPointerEnter={busy ? undefined : turnUp}
            onPointerMove={lean}
            onPointerLeave={settle}
            style={
              {
                "--i": index,
                "--t": place?.t ?? 0,
                "--tilt": place?.tilt ?? 0,
                "--drop": place?.drop ?? 0,
              } as CSSProperties
            }
          >
            <button
              type="button"
              onClick={() => onHandCard(index)}
              disabled={busy || match.phase === "over"}
              aria-pressed={selected}
              aria-label={`${tucking ? "Choose" : "Play"} ${cat.name}`}
              className="hand-pick block h-full w-full text-left disabled:cursor-not-allowed"
            >
              <CatCard
                catId={catId}
                variant="hand"
                discount={discount}
                className={`hand-face h-full w-full ${selected ? "is-chosen" : tucking && !busy ? "is-open" : ""}`}
              />
            </button>
            {block ? <span aria-hidden className="hand-wash" /> : null}
            {index < 9 ? (
              <KeyHint className="pointer-events-none absolute -top-2.5 left-2">
                {index + 1}
              </KeyHint>
            ) : null}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-1.5 pb-1.5">
              <InfoButton name={cat.name} onClick={() => onDetail(catId)} />
              <span className="text-ink-soft min-w-0 truncate text-[11px] font-bold">
                {selected ? (
                  <span className="text-cobalt">Chosen</span>
                ) : block ? (
                  PLAY_BLOCK_LABELS[block]
                ) : (
                  rowsLabel(cat.rows)
                )}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
