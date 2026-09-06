"use client";

import { useEffect } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { Button, Stat } from "~/components/ui";
import { MATERIAL_LABELS } from "~/server/game/elements";
import type { RouterOutputs } from "~/trpc/react";
import { FightLog } from "./FightLog";

export type ClaimSummaryView = RouterOutputs["adventure"]["claim"];

export interface ClaimResultsModalProps {
  summary: ClaimSummaryView;
  onClose: () => void;
}

/** Full-screen-on-mobile results sheet shown after a claim or recall. */
export function ClaimResultsModal({
  summary,
  onClose,
}: ClaimResultsModalProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { rewards } = summary;
  const nothing = summary.encounterCount === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Expedition results"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="panel max-h-[90dvh] w-full max-w-lg overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-edge bg-panel-hi sticky top-0 flex items-center justify-between gap-2 border-b-2 px-3 py-2">
          <h2 className="text-pixel text-gold text-[10px]">
            {summary.retreated
              ? "Retreat!"
              : summary.ended
                ? "Recalled"
                : "Claimed"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close results"
            className="text-pixel border-edge text-ink-dim hover:text-ink border-2 px-2 py-1 text-[8px]"
          >
            ✕
          </button>
        </header>

        <div className="space-y-3 p-3">
          {summary.retreated ? (
            <p className="border-pink bg-panel-hi text-pink border-2 p-2 text-base">
              Your squad lost three encounters in a row in {summary.zoneName}{" "}
              and retreated. Everyone is back home and idle — upgrade or re-team
              before heading out again.
            </p>
          ) : null}

          {nothing ? (
            <p className="text-ink-dim text-lg">
              Nothing had come due yet — encounters resolve once a minute.
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Encounters" value={summary.encounterCount} />
            <Stat label="Wins" value={summary.winCount} tone="mint" />
            <Stat label="Losses" value={summary.lossCount} tone="pink" />
            <Stat
              label={`${summary.zoneName} wins`}
              value={summary.zoneWins}
              tone="sky"
            />
          </div>

          <div className="panel-flat grid grid-cols-3 gap-2 p-2">
            <Stat label="Gold" value={`+${rewards.gold}`} tone="gold" />
            <Stat label="Gems" value={`+${rewards.gems}`} tone="mint" />
            <Stat
              label={MATERIAL_LABELS[rewards.materialElement]}
              value={`+${rewards.materials}`}
              tone="sky"
            />
          </div>

          {summary.xpPerCreature.length > 0 ? (
            <section>
              <h3 className="text-pixel text-ink-dim mb-1 text-[9px] uppercase">
                Squad XP
              </h3>
              <ul className="space-y-1">
                {summary.xpPerCreature.map((gain) => (
                  <li
                    key={gain.creatureId}
                    className={`panel-flat flex items-center gap-2 p-1.5 ${
                      gain.leveledUp ? "border-gold" : ""
                    }`}
                  >
                    <PixelSprite speciesId={gain.speciesId} size={32} />
                    <span className="text-pixel text-ink min-w-0 flex-1 truncate text-[8px]">
                      {gain.name}
                    </span>
                    <span className="text-mint text-base tabular-nums">
                      +{gain.xpGained} XP
                    </span>
                    {gain.leveledUp ? (
                      <span className="text-pixel border-gold text-gold border px-1 py-0.5 text-[7px]">
                        Lv {gain.levelBefore}→{gain.levelAfter}
                      </span>
                    ) : (
                      <span className="text-ink-dim text-base tabular-nums">
                        Lv {gain.levelAfter}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {summary.latestFight ? (
            <FightLog fight={summary.latestFight} />
          ) : null}

          {summary.encounters.length > 0 ? (
            <details className="panel-flat">
              <summary className="text-pixel bg-panel-hi text-gold cursor-pointer px-2 py-2 text-[9px]">
                Encounter log (last {summary.encounters.length})
              </summary>
              <ol className="max-h-56 space-y-0.5 overflow-y-auto p-2">
                {summary.encounters.map((encounter) => (
                  <li
                    key={encounter.index}
                    className="flex items-baseline justify-between gap-2 text-base leading-tight"
                  >
                    <span className={encounter.won ? "text-mint" : "text-pink"}>
                      #{encounter.index + 1} {encounter.won ? "WIN" : "LOSS"}
                    </span>
                    <span className="text-ink-dim truncate">
                      {encounter.enemies.map((e) => e.name).join(", ")}
                    </span>
                    <span className="text-gold shrink-0 tabular-nums">
                      +{encounter.gold}G
                    </span>
                  </li>
                ))}
              </ol>
            </details>
          ) : null}

          <Button className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
