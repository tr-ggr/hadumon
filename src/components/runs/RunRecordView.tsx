"use client";

import { useState, type ReactNode } from "react";

import { CatCard } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { RelicIcon } from "~/components/RelicIcon";
import { RivalSprite } from "~/components/RivalSprite";
import { tiebreakText } from "~/components/run/describe";
import { MatchCoins } from "~/components/run/MatchCoins";
import { RelicTile } from "~/components/run/pieces";
import { COIN_COLOR } from "~/components/sprites/palettes";
import { Board, BoardSkeleton, TableButton, TableLink } from "~/components/ui";
import { getCat, ROW_LABELS, ROWS } from "~/server/game/cats";
import { difficultyOf } from "~/server/game/difficulty";
import { getGoal } from "~/server/game/goals";
import type { ScoreBreakdown } from "~/server/game/match";
import { getRelic } from "~/server/game/relics";
import { GAUNTLET, getRival } from "~/server/game/rival";
import type { FinalBoard } from "~/server/game/run";
import type { RunRecordMatch } from "~/server/game/runRecord";
import { api, type RouterOutputs } from "~/trpc/react";

import { RoomFrame } from "./RoomFrame";
import { PlayerTag } from "./RunRow";
import { duration, ENDING_TAG, outcomeText, plural } from "./runText";
import { When } from "./When";

type Record = RouterOutputs["run"]["record"];

/** Said where an older run kept less than this page shows. */
const NOT_KEPT = "Runs from before this page existed did not keep this.";

/**
 * Everything a finished run did, at `/runs/<id>`: how it ended, every match
 * with both score sheets, the round goals and both boards as they were
 * left, the deck it was built with and what the rivals took and gave back,
 * the relics it picked up, and what it unlocked and achieved. Anyone may
 * read it if its player shows their runs; only its player sees its coins.
 */
export function RunRecordView({
  id,
  signedIn,
}: {
  id: string;
  signedIn: boolean;
}) {
  const record = api.run.record.useQuery(
    { id },
    {
      retry: (count, error) => error.data?.code !== "NOT_FOUND" && count < 1,
    },
  );

  if (record.isPending) {
    return (
      <RoomFrame title="Run summary">
        <BoardSkeleton title="The run" lines={3} />
        <BoardSkeleton title="Matches" lines={6} />
      </RoomFrame>
    );
  }
  if (record.error) {
    const missing = record.error.data?.code === "NOT_FOUND";
    return (
      <RoomFrame title="Run summary">
        <Board title={missing ? "No such run" : "The record would not open"}>
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="text-sm">
              {missing
                ? "There is no run to show here. It may still be in play, or its player keeps their runs to themselves."
                : record.error.message}
            </p>
            {missing ? (
              <TableLink href={signedIn ? "/runs" : "/"} size="md">
                {signedIn ? "Your runs" : "HaduMon"}
              </TableLink>
            ) : (
              <TableButton
                size="md"
                disabled={record.isFetching}
                onClick={() => void record.refetch()}
              >
                {record.isFetching ? "Trying…" : "Try again"}
              </TableButton>
            )}
          </div>
        </Board>
      </RoomFrame>
    );
  }

  const run = record.data;
  const you = run.isOwner ? "You" : run.player.name;
  return (
    <RoomFrame
      title="Run summary"
      lead={
        signedIn ? (
          <TableLink
            href={run.isOwner ? "/runs" : `/players/${run.player.handle}/runs`}
            size="sm"
          >
            {run.isOwner ? "Your runs" : `${run.player.name}'s runs`}
          </TableLink>
        ) : null
      }
    >
      <Overview run={run} />
      <Board title="Matches">
        {run.matches.length === 0 ? (
          <p className="text-ink-soft">
            Given up before the first match was finished.
          </p>
        ) : (
          <ol className="flex flex-col gap-5">
            {run.matches.map((match) => (
              <MatchCard key={match.index} match={match} you={you} />
            ))}
          </ol>
        )}
      </Board>
      <DeckBoard run={run} />
      <RelicsBoard run={run} />
      <PrizesBoard run={run} />
    </RoomFrame>
  );
}

function Overview({ run }: { run: Record }) {
  const tier = difficultyOf(run.difficulty);
  const took = duration(run.startedAt, run.endedAt);
  return (
    <Board title="The run">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <PlayerTag player={run.player} size={48} />
          <span className="font-bold">{tier.name}</span>
          <span
            className={`border-ink border-2 px-1.5 text-xs leading-5 font-black ${ENDING_TAG[run.outcome]}`}
          >
            {outcomeText({ status: run.outcome, matchesWon: run.matchesWon })}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Fact label="Run score" value={String(run.score)} />
          <Fact
            label="Matches won"
            value={`${run.matchesWon} / ${GAUNTLET.length}`}
          />
          {run.coins !== null ? (
            <Fact
              label="Coins paid"
              value={String(run.coins)}
              icon={<PixelIcon name="coin" size={16} fill={COIN_COLOR} />}
            />
          ) : null}
          <Fact
            label="Relics held"
            value={run.relics ? String(run.relics.length) : "–"}
          />
        </dl>
        <p className="text-ink-soft text-sm">
          Started <When date={run.startedAt} time />
          {run.endedAt ? (
            <>
              , ended <When date={run.endedAt} time />
            </>
          ) : null}
          {took ? `, ${took} in all.` : "."} Rivals played at levels{" "}
          {tier.rank + 1} to {tier.rank + GAUNTLET.length}.
        </p>
      </div>
    </Board>
  );
}

function Fact({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-ink-soft mt-1 text-xs font-bold">{label}</dt>
      <dd className="text-print inline-flex items-center gap-1.5 text-3xl tabular-nums">
        {icon}
        {value}
      </dd>
    </div>
  );
}

function MatchCard({ match, you }: { match: RunRecordMatch; you: string }) {
  const rival = getRival(match.rivalId);
  const detail = match.detail;
  const settled = detail ? tiebreakText(detail.tiebreak) : null;
  const [boards, setBoards] = useState(false);

  return (
    <li className="piece piece-card border-ink text-ink flex flex-col gap-4 border-2 bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <RivalSprite rivalId={match.rivalId} size={48} decorative />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-print text-xl">
            {match.index + 1}. {rival.name}
            {rival.boss ? (
              <span className="border-ink bg-ink text-cream ml-2 border px-1 align-middle font-sans text-[11px] leading-4 font-black">
                Boss
              </span>
            ) : null}
          </h3>
          <p className="text-sm">
            <span
              className={`border-ink mr-1.5 border-2 px-1 font-black tabular-nums ${match.won ? "bg-lime" : "bg-coral"}`}
            >
              {match.won ? "Won" : "Lost"} {match.player} to {match.rival}
            </span>
            Level {match.level + 1}. {plural(match.goalsWon, "round goal")} of{" "}
            {match.goals} taken.
            {settled ? ` ${settled}` : ""}
          </p>
        </div>
        {match.coins !== null && match.factor !== null ? (
          <MatchCoins
            record={{ coins: match.coins, factor: match.factor }}
            floor={match.index + 1}
          />
        ) : null}
      </div>

      {detail ? (
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <Sheets
            you={you}
            rival={rival.name}
            player={detail.breakdown.player}
            rivalScore={detail.breakdown.rival}
          />
          <ol className="space-y-1.5">
            {detail.goalResults.map((goal, round) => (
              <li key={round} className="text-sm leading-snug">
                <span className="font-bold">
                  Round {round + 1}, {getGoal(goal.goalId).name}:
                </span>{" "}
                {you} {goal.player}, {rival.name} {goal.rival}. Points: {you}{" "}
                {goal.playerPoints}, {rival.name} {goal.rivalPoints}.
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-ink-soft text-sm">
          How it was scored: {NOT_KEPT.toLowerCase()}
        </p>
      )}

      {detail ? (
        <div className="flex flex-col items-start gap-3">
          <TableButton
            variant="secondary"
            aria-expanded={boards}
            onClick={() => setBoards((open) => !open)}
          >
            {boards ? "Hide the boards" : "Show both boards"}
          </TableButton>
          {boards ? (
            <div className="grid w-full gap-4 md:grid-cols-2">
              <BoardLeft
                title={you === "You" ? "Your board" : `${you}'s board`}
                board={detail.boards.player}
                relics={detail.relics.player}
                tag="bg-lime"
              />
              <BoardLeft
                title={`${rival.name}'s board`}
                board={detail.boards.rival}
                relics={detail.relics.rival}
                tag="bg-coral"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {match.reward ? <RewardLine reward={match.reward} /> : null}
    </li>
  );
}

const SHEET_LINES = [
  ["cats", "Cats"],
  ["yarn", "Yarn"],
  ["cached", "Cached"],
  ["tucked", "Tucked"],
  ["goals", "Goals"],
  ["relics", "Relics"],
] as const;

function Sheets({
  you,
  rival,
  player,
  rivalScore,
}: {
  you: string;
  rival: string;
  player: ScoreBreakdown;
  rivalScore: ScoreBreakdown;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-ink border-b-2 text-left text-xs">
          <th scope="col" className="py-1 pr-2 font-bold">
            <span className="sr-only">Line</span>
          </th>
          <th scope="col" className="px-2 py-1 text-right">
            <span className="border-ink bg-lime inline-block max-w-[9rem] truncate border-2 px-1 align-bottom leading-5 font-black">
              {you}
            </span>
          </th>
          <th scope="col" className="py-1 pl-2 text-right">
            <span className="border-ink bg-coral inline-block max-w-[9rem] truncate border-2 px-1 align-bottom leading-5 font-black">
              {rival}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {SHEET_LINES.map(([key, label]) => (
          <tr key={key} className="border-b border-black/10">
            <th scope="row" className="py-1 pr-2 text-left font-semibold">
              {label}
            </th>
            <td className="px-2 py-1 text-right tabular-nums">{player[key]}</td>
            <td className="py-1 pl-2 text-right tabular-nums">
              {rivalScore[key]}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" className="py-1 pr-2 text-left font-black">
            Total
          </th>
          <td className="text-print px-2 py-1 text-right text-xl tabular-nums">
            {player.total}
          </td>
          <td className="text-print py-1 pl-2 text-right text-xl tabular-nums">
            {rivalScore.total}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

/** One side's board as the match left it: a lane to a row, then its relics. */
function BoardLeft({
  title,
  board,
  relics,
  tag,
}: {
  title: string;
  board: FinalBoard;
  relics: readonly string[];
  tag: string;
}) {
  return (
    <section className="mat flex flex-col gap-2 p-3">
      <h4
        className={`border-ink w-fit border-2 px-1 text-xs leading-5 font-black ${tag}`}
      >
        {title}
      </h4>
      {ROWS.map((row) => (
        <div key={row} className="flex items-center gap-2">
          <span className="text-ink w-12 shrink-0 text-[11px] font-bold">
            {ROW_LABELS[row]}
          </span>
          {board[row].length === 0 ? (
            <span className="text-ink-soft text-xs">Empty</span>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {board[row].map((placed, col) => {
                const cat = getCat(placed.catId);
                const extras = [
                  placed.yarn > 0 ? plural(placed.yarn, "yarn", "yarn") : null,
                  placed.cached > 0 ? `${placed.cached} cached` : null,
                  placed.tucked > 0 ? `${placed.tucked} tucked` : null,
                ].filter(Boolean);
                return (
                  <li
                    key={col}
                    title={[cat.name, ...extras].join(", ")}
                    className="border-ink relative border-2 bg-white"
                  >
                    <PixelSprite
                      catId={placed.catId}
                      size={32}
                      label={[cat.name, ...extras].join(", ")}
                    />
                    {placed.yarn + placed.cached + placed.tucked > 0 ? (
                      <span
                        aria-hidden
                        className="border-ink bg-cream absolute -right-1.5 -bottom-1.5 border px-0.5 text-[10px] leading-3 font-black tabular-nums"
                      >
                        +{placed.yarn + placed.cached + placed.tucked}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-ink w-12 shrink-0 text-[11px] font-bold">
          Relics
        </span>
        {relics.length === 0 ? (
          <span className="text-ink-soft text-xs">None</span>
        ) : (
          relics.map((relicId) => (
            <span key={relicId} title={getRelic(relicId).name}>
              <RelicIcon relicId={relicId} size={32} />
            </span>
          ))
        )}
      </div>
    </section>
  );
}

function RewardLine({
  reward,
}: {
  reward: NonNullable<RunRecordMatch["reward"]>;
}) {
  const parts = [
    reward.reclaim ? `took back ${getCat(reward.reclaim).name}` : null,
    reward.relic ? `took the ${getRelic(reward.relic).name}` : null,
    reward.trim ? `trimmed ${getCat(reward.trim).name}` : null,
  ].filter((part): part is string => part !== null);
  const text =
    parts.length === 0
      ? "Took nothing from the reward."
      : `After it: ${parts.join(", ")}.`;
  return (
    <p className="border-ink/15 border-t-2 border-dashed pt-3 text-sm font-semibold">
      {text}
    </p>
  );
}

/** Cards grouped by cat, a face and a count each, in the order given. */
function CatFaces({ cards }: { cards: readonly string[] }) {
  const counts = new Map<string, number>();
  for (const id of cards) counts.set(id, (counts.get(id) ?? 0) + 1);
  return (
    <ul className="flex flex-wrap gap-2">
      {[...counts].map(([catId, n]) => {
        const name = getCat(catId).name;
        return (
          <li
            key={catId}
            title={n > 1 ? `${name} ×${n}` : name}
            className="border-ink relative border-2 bg-white"
          >
            <PixelSprite
              catId={catId}
              size={32}
              label={n > 1 ? `${name}, ${n} copies` : name}
            />
            {n > 1 ? (
              <span
                aria-hidden
                className="border-ink bg-cream absolute -right-1.5 -bottom-1.5 border px-0.5 text-[10px] leading-3 font-black tabular-nums"
              >
                ×{n}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function DeckPart({
  label,
  cards,
  none,
}: {
  label: string;
  cards: readonly string[];
  none: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-black">
        {label}{" "}
        <span className="text-ink-soft font-bold tabular-nums">
          ({cards.length})
        </span>
      </h3>
      {cards.length === 0 ? (
        <p className="text-ink-soft text-sm">{none}</p>
      ) : (
        <CatFaces cards={cards} />
      )}
    </div>
  );
}

function DeckBoard({ run }: { run: Record }) {
  if (!run.built || !run.finalDeck) {
    return (
      <Board title="Deck">
        <p className="text-ink-soft">{NOT_KEPT}</p>
      </Board>
    );
  }
  const reclaimed = run.matches.flatMap((m) =>
    m.reward?.reclaim ? [m.reward.reclaim] : [],
  );
  const trimmed = run.matches.flatMap((m) =>
    m.reward?.trim ? [m.reward.trim] : [],
  );
  return (
    <Board title="Deck">
      <div className="flex flex-col gap-5">
        <DeckPart label="As it was built" cards={run.built} none="Empty." />
        {run.stolenAtStart ? (
          <DeckPart
            label="Stolen as the run began"
            cards={run.stolenAtStart}
            none="Nothing."
          />
        ) : null}
        <DeckPart
          label="Taken back"
          cards={reclaimed}
          none="Nothing came back."
        />
        <DeckPart
          label="Still with the rivals"
          cards={run.stolenLeft ?? []}
          none="Every card came home."
        />
        {trimmed.length > 0 ? (
          <DeckPart label="Trimmed" cards={trimmed} none="None." />
        ) : null}
        <DeckPart label="At the end" cards={run.finalDeck} none="Empty." />
      </div>
    </Board>
  );
}

function RelicsBoard({ run }: { run: Record }) {
  if (!run.relics || !run.chest) {
    return (
      <Board title="Relics">
        <p className="text-ink-soft">{NOT_KEPT}</p>
      </Board>
    );
  }
  const afterMatch = new Map(
    run.matches.flatMap((m) =>
      m.reward?.relic ? [[m.reward.relic, m.index + 1] as const] : [],
    ),
  );
  return (
    <Board title="Relics">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-black">The chest held</h3>
          <ul className="flex flex-wrap gap-2">
            {run.chest.map((relicId) => {
              const taken = relicId === run.chestPick;
              return (
                <li
                  key={relicId}
                  className={`piece border-ink flex items-center gap-2 border-2 px-2 py-1 text-sm ${taken ? "bg-lime" : "bg-white"}`}
                >
                  <RelicIcon relicId={relicId} size={32} />
                  <span className="font-bold">{getRelic(relicId).name}</span>
                  {taken ? (
                    <span className="text-xs font-black">Taken</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-black">Held, in the order taken</h3>
          {run.relics.length === 0 ? (
            <p className="text-ink-soft text-sm">None.</p>
          ) : (
            <ol className="grid gap-2.5 md:grid-cols-2">
              {run.relics.map((relicId) => (
                <li key={relicId} className="flex flex-col gap-1">
                  <span className="text-ink-soft text-[11px] font-bold">
                    {relicId === run.chestPick
                      ? "From the chest"
                      : afterMatch.has(relicId)
                        ? `After match ${afterMatch.get(relicId)}`
                        : "Taken"}
                  </span>
                  <RelicTile relicId={relicId} className="h-full" />
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Board>
  );
}

function PrizesBoard({ run }: { run: Record }) {
  if (run.unlocks.length === 0 && run.achievements.length === 0) {
    return (
      <Board title="Prizes">
        <p className="text-ink-soft">
          Nothing unlocked or achieved for the first time on this run.
        </p>
      </Board>
    );
  }
  return (
    <Board title="Prizes">
      <div className="flex flex-col gap-5">
        {run.unlocks.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-black">Unlocked</h3>
            <ul className="grid gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {run.unlocks.map((unlock) => (
                <li key={`${unlock.kind}:${unlock.key}`}>
                  {unlock.kind === "cat" ? (
                    <CatCard catId={unlock.key} className="h-full" />
                  ) : (
                    <RelicTile relicId={unlock.key} className="h-full" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {run.achievements.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-black">Achieved</h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {run.achievements.map((a) => (
                <li
                  key={a.key}
                  className="piece border-ink flex gap-3 border-2 bg-white p-3"
                >
                  <PixelIcon name="medal" size={32} fill={COIN_COLOR} />
                  <div className="min-w-0">
                    <p className="text-sm font-black">{a.name}</p>
                    <p className="text-xs">{a.hint}</p>
                    <p className="text-ink-soft mt-1 inline-flex items-center gap-1 text-[11px] font-bold tabular-nums">
                      <PixelIcon name="coin" size={8} fill={COIN_COLOR} />
                      {plural(a.coins, "coin")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Board>
  );
}
