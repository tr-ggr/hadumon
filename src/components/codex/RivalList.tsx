import { RivalSprite } from "~/components/RivalSprite";
import { Label } from "~/components/ui";
import {
  DIFFICULTY_LIST,
  LEVEL_COUNT,
  rivalLevel,
} from "~/server/game/difficulty";
import { ELEMENT_LABELS } from "~/server/game/elements";
import { getRelic } from "~/server/game/relics";
import { getRival } from "~/server/game/rival";
import { RIVAL_DECK, rivalRelics } from "~/server/game/rivalDecks";
import { CLANS } from "~/server/game/clans";

/** One rival and its deck. A rival is never locked. */
export function RivalCard({
  rivalId,
  match,
}: {
  rivalId: string;
  /** Which match of a run meets it, from 1. */
  match: number;
}) {
  const rival = getRival(rivalId);
  return (
    <article className="piece piece-card border-ink text-ink flex flex-col gap-2.5 border-2 bg-white p-3">
      <div className="flex items-end gap-3">
        <RivalSprite
          rivalId={rivalId}
          size={48}
          decorative
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <Label>Match {match}</Label>
          <div className="border-ink bg-coral mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-2 px-2.5 py-1">
            <h3 className="text-print text-xl break-words">{rival.name}</h3>
            {rival.boss ? (
              <span className="border-ink bg-ink text-cream border px-1 text-[11px] leading-4 font-black">
                Boss
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-sm italic">{rival.flavor}</p>
      <p className="text-sm font-bold">{rival.trait}</p>

      <table className="border-ink w-full border-t-2 text-left text-xs">
        <caption className="sr-only">
          {rival.name}: the level it plays at on each tier
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Tier</th>
            <th scope="col">Level</th>
          </tr>
        </thead>
        <tbody>
          {DIFFICULTY_LIST.map((tier) => (
            <tr
              key={tier.id}
              className="border-ink/15 border-b-2 border-dashed align-top"
            >
              <th scope="row" className="w-16 py-1.5 pr-2 font-extrabold">
                {tier.name}
              </th>
              <td className="py-1.5 leading-snug tabular-nums">
                Plays at level {rivalLevel(match - 1, tier.id) + 1} of{" "}
                {LEVEL_COUNT}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs leading-snug">
        A {CLANS[rival.theme].name} deck of {RIVAL_DECK - 1 + match} cards,{" "}
        {ELEMENT_LABELS[rival.theme]} cats first, drawn from the cats you own
        and as rare as the deck you built. Holds the{" "}
        {rivalRelics(rivalId)
          .map((id) => getRelic(id).name)
          .join(" and ")}{" "}
        and no other relic. No head start.
      </p>
    </article>
  );
}
