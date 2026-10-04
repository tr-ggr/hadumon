import { Panel } from "~/components/ui";
import { getGoal } from "~/server/game/goals";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { plural } from "./describe";

function Line({
  label,
  value,
  total = false,
}: {
  label: string;
  value: number;
  total?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${total ? "border-ink text-ink mt-1 border-t-2 pt-1 font-black" : "text-ink"}`}
    >
      <dt className="text-sm">{label}</dt>
      <dd
        className={`tabular-nums ${total ? "text-pixel text-xl" : "text-sm font-bold"}`}
      >
        {value}
      </dd>
    </div>
  );
}

/** A finished match: both scores, line by line, and how each goal went. */
export function MatchResult({ match }: { match: MatchView }) {
  const result = match.result;
  if (!result) return null;
  const rival = getRival(match.rivalId);
  const { player } = result;
  const { banked, bankValue, yarn, goalPoints } = match.rival;
  const margin = Math.abs(player.total - result.rival);

  return (
    <Panel
      title={
        result.won ? `You beat ${rival.name}` : `${rival.name} takes the match`
      }
      tone={result.won ? "featured" : "default"}
      bodyClassName="space-y-4"
    >
      <p className="text-ink">
        {result.won
          ? `${player.total} to ${result.rival}. ${margin <= 3 ? "Close, and it still counts." : "Not close."}`
          : margin === 0
            ? `${result.rival} all. A tie goes to the rival.`
            : `${result.rival} to ${player.total}. Short by ${margin}.`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <dl className="border-ink bg-cream border-2 p-3">
          <p className="text-pixel text-ink mb-1 text-base">You</p>
          <Line label="Cats on the board" value={player.cats} />
          <Line label="Yarn" value={player.yarn} />
          <Line label="Cached essence" value={player.cached} />
          <Line label="Tucked cats" value={player.tucked} />
          <Line label="Goals" value={player.goals} />
          <Line label="Relics" value={player.relics} />
          <Line label="Total" value={player.total} total />
        </dl>
        <dl className="border-ink bg-cream border-2 p-3">
          <p className="text-pixel text-ink mb-1 text-base">{rival.name}</p>
          <Line
            label={`${plural(banked, "banked cat")} at ${bankValue} each`}
            value={banked * bankValue}
          />
          <Line label="Yarn" value={yarn} />
          <Line label="Goals" value={goalPoints} />
          <Line label="Total" value={result.rival} total />
        </dl>
      </div>

      <ol className="space-y-1">
        {match.goalResults.map((goal, round) => (
          <li key={round} className="text-ink text-sm leading-snug">
            <span className="font-bold">
              Round {round + 1}, {getGoal(goal.goalId).name}:
            </span>{" "}
            you {goal.player}, {rival.name} {goal.rival}. You took{" "}
            {goal.playerPoints}, {rival.name} took {goal.rivalPoints}.
          </li>
        ))}
      </ol>
    </Panel>
  );
}
