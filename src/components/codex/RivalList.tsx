import { RIVAL_ACTIONS, type RivalAction } from "~/server/game/cats";
import { GAUNTLET, getRival, type Rival } from "~/server/game/rival";

const ACTION_LABELS: Record<RivalAction, string> = {
  bank: "Bank",
  stash: "Stash",
  raid: "Raid",
  burn: "Burn",
  push: "Push",
};

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** What one flip of each action card does, in this rival's numbers. */
function actionText(rival: Rival, action: RivalAction): string {
  switch (action) {
    case "bank":
      return `Banks a cat worth ${plural(rival.bankPoints, "point", "points")}`;
    case "stash":
      return `Gains ${rival.stashYarn} yarn, a point each`;
    case "raid":
      return `Takes ${plural(rival.raidDice, "die", "dice")} from the feeder`;
    case "burn":
      return `Discards ${plural(rival.burnCards, "tray cat", "tray cats")}`;
    case "push":
      return "Adds 1 to its goal tally";
  }
}

function RivalCard({ rivalId, match }: { rivalId: string; match: number }) {
  const rival = getRival(rivalId);
  return (
    <li className="border-ink bg-cream text-ink flex flex-col gap-2 border-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-ink-soft text-xs font-bold tracking-wide uppercase">
            Match {match}
          </p>
          <h3 className="text-pixel text-base leading-tight break-words">
            {rival.name}
          </h3>
        </div>
        {rival.boss ? (
          <span className="text-pixel bg-ink text-cream shrink-0 px-2 py-0.5 text-xs uppercase">
            Boss
          </span>
        ) : null}
      </div>

      <p className="text-ink-soft text-sm italic">{rival.flavor}</p>
      <p className="text-sm">{rival.trait ?? "No tricks. Just the deck."}</p>

      <table className="border-ink/20 w-full border-t text-left text-xs">
        <caption className="sr-only">
          {rival.name}: action cards, how many are in the deck, and what each
          does
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Card</th>
            <th scope="col">In deck</th>
            <th scope="col">Effect</th>
          </tr>
        </thead>
        <tbody>
          {RIVAL_ACTIONS.map((action) => {
            const count = rival.deck.filter((card) => card === action).length;
            return (
              <tr
                key={action}
                className={`border-ink/10 border-b align-top ${count === 0 ? "text-ink-soft" : ""}`}
              >
                <th scope="row" className="w-14 py-1.5 pr-2 font-extrabold">
                  {ACTION_LABELS[action]}
                </th>
                <td className="w-12 py-1.5 pr-2 whitespace-nowrap tabular-nums">
                  {count === 0 ? "none" : `×${count}`}
                </td>
                <td className="py-1.5 leading-snug">
                  {actionText(rival, action)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-xs">
        {rival.goalEdge > 0
          ? `Head start on every round goal: ${rival.goalEdge}.`
          : "No head start on round goals."}
      </p>
    </li>
  );
}

/** All six rivals in the order a run meets them. They are never locked. */
export function RivalList() {
  return (
    <ol className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {GAUNTLET.map((rivalId, index) => (
        <RivalCard key={rivalId} rivalId={rivalId} match={index + 1} />
      ))}
    </ol>
  );
}
