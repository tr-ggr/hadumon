"use client";

import type { CSSProperties } from "react";

import { CatCard } from "~/components/cats/CatCard";
import { Habitats } from "~/components/cats/Habitats";
import { getCat } from "~/server/game/cats";
import { auraTotal } from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { InfoButton } from "./CatPick";
import { plural } from "./describe";
import { lean, settle } from "./fx/lean";
import { fanLayout } from "./hand";
import { KeyHint } from "./pieces";
import { PLAY_BLOCK_LABELS, playBlock, type Mode } from "./turn";

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
  // A cat is chosen to be tucked, or discarded for the Hunt's trade.
  const tucking =
    mode.kind === "tuck" || (mode.kind === "hunt" && match.trades.hunt);
  const chosen =
    mode.kind === "play" || mode.kind === "tuck"
      ? mode.hand
      : mode.kind === "hunt"
        ? mode.trade
        : null;
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
          match.phase === "turn" && !selected && !tucking
            ? playBlock(match, index)
            : null;
        return (
          <li
            key={`${index}-${catId}`}
            data-hand={index}
            className={selected ? "is-raised" : undefined}
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
              {selected || block ? (
                <span className="text-ink-soft min-w-0 truncate text-[11px] font-bold">
                  {selected ? (
                    <span className="text-cobalt">Chosen</span>
                  ) : block ? (
                    PLAY_BLOCK_LABELS[block]
                  ) : null}
                </span>
              ) : (
                <Habitats rows={cat.rows} className="justify-end" />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
