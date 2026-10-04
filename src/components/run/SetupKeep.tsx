"use client";

import { useState } from "react";

import { EssencePip } from "~/components/cats/CatCard";
import { Button, Panel } from "~/components/ui";
import { ELEMENT_LABELS, ELEMENTS, type Element } from "~/server/game/elements";
import { ROUND_TURNS, SETUP_KEEP, type Action } from "~/server/game/match";
import type { MatchView, RunView } from "~/server/game/view";

import { CatDetail, CatPick } from "./CatPick";
import { Dock } from "./Dock";
import { Die, GoalList, Label, RelicList, RivalIntro } from "./pieces";

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((other) => other !== item)
    : [...list, item];
}

export interface SetupKeepProps {
  run: RunView;
  match: MatchView;
  busy: boolean;
  onAct: (action: Action) => void;
}

/** Before the first turn: meet the rival and keep 5 of the 10 things dealt. */
export function SetupKeep({ run, match, busy, onAct }: SetupKeepProps) {
  const [cats, setCats] = useState<number[]>([]);
  const [essence, setEssence] = useState<Element[]>([]);
  const [detail, setDetail] = useState<string | null>(null);

  const chosen = cats.length + essence.length;
  const ready = chosen === SETUP_KEEP;
  const firstRound = ROUND_TURNS[0] + match.mods.extraTurns;

  return (
    <div className="space-y-3">
      <Panel bodyClassName="space-y-3">
        <RivalIntro
          rivalId={match.rivalId}
          matchIndex={run.matchIndex}
          matches={run.gauntlet.length}
        />
        <p className="text-ink-soft text-sm">
          Three rounds of {firstRound}, {ROUND_TURNS[1]} and {ROUND_TURNS[2]}{" "}
          turns. The rival flips one card after each of your turns. Score more
          than the rival to win.
        </p>
      </Panel>

      <Panel title={`Keep ${SETUP_KEEP}`} bodyClassName="space-y-4">
        <p className="text-ink text-sm">
          You were dealt five cats and one essence of each element. Keep any{" "}
          {SETUP_KEEP} in total. Cats cost essence to play, so a hand of five
          cats is a hand you cannot afford.
        </p>

        <div>
          <Label>Cats</Label>
          <ul className="mt-1.5 grid gap-2 p-1 sm:grid-cols-2 lg:grid-cols-3">
            {match.setup.map((catId, index) => (
              <li key={`${index}-${catId}`}>
                <CatPick
                  catId={catId}
                  verb="Keep"
                  selected={cats.includes(index)}
                  disabled={busy}
                  onSelect={() => setCats((prev) => toggle(prev, index))}
                  onDetail={() => setDetail(catId)}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Label>Essence</Label>
          <ul className="mt-1.5 grid grid-cols-5 gap-1.5 p-1">
            {ELEMENTS.map((element) => {
              const kept = essence.includes(element);
              return (
                <li key={element}>
                  <button
                    type="button"
                    disabled={busy}
                    aria-pressed={kept}
                    aria-label={`Keep ${ELEMENT_LABELS[element]} essence`}
                    onClick={() => setEssence((prev) => toggle(prev, element))}
                    className={`border-ink text-ink flex min-h-14 w-full flex-col items-center justify-center gap-1 border-2 px-1 py-1.5 ${kept ? "ring-cobalt bg-lime ring-4" : "hover:bg-sky-soft bg-white"}`}
                  >
                    <EssencePip kind={element} size={22} />
                    <span className="text-[11px] leading-none font-bold">
                      {ELEMENT_LABELS[element]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </Panel>

      <Panel title="On the table" bodyClassName="space-y-4">
        <div>
          <Label>Goals</Label>
          <div className="mt-1">
            <GoalList goalIds={match.goals} />
          </div>
        </div>
        <div>
          <Label>Feeder</Label>
          <ul className="mt-1.5 grid max-w-sm grid-cols-5 gap-1.5">
            {match.feeder.map((face, index) => (
              <li key={index}>
                <Die face={face} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Label>Tray</Label>
          <ul className="mt-1.5 grid gap-2 sm:grid-cols-3">
            {match.tray.map((catId, index) => (
              <li key={`${index}-${catId}`}>
                <CatPick
                  catId={catId}
                  onDetail={() => setDetail(catId)}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Label>Your relics</Label>
          <div className="mt-1">
            <RelicList relicIds={run.relics} />
          </div>
        </div>
      </Panel>

      <Dock className="sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink hidden text-sm sm:block" aria-live="polite">
          {chosen} of {SETUP_KEEP} chosen: {cats.length}{" "}
          {cats.length === 1 ? "cat" : "cats"}, {essence.length} essence.
          {chosen > SETUP_KEEP ? " That is too many." : ""}
        </p>
        <Button
          disabled={busy || !ready}
          onClick={() =>
            onAct({
              type: "keep",
              cats: [...cats].sort((a, b) => a - b),
              essence,
            })
          }
        >
          {busy
            ? "Starting…"
            : ready
              ? `Keep these ${SETUP_KEEP}`
              : `Keep ${SETUP_KEEP} (${chosen} chosen)`}
        </Button>
      </Dock>

      <CatDetail catId={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
