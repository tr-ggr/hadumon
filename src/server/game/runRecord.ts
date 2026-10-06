/**
 * The record of a finished run, as its details page shows it: everything
 * the run did, read back from its stored state once it can no longer be
 * played. Like the run view (`view.ts`), the seed and the pool never leave
 * the server. What a run paid is only shown to the account that played it.
 *
 * A run saved by an older game kept less: its matches' scores but not how
 * they ended, nor what each reward took. Those parts come back `null`.
 */

import { difficultyOf, rivalLevel, type DifficultyId } from "./difficulty";
import {
  isCurrentRun,
  type MatchDetail,
  type RewardChoice,
  type RunOutcome,
} from "./run";
import type { Achievement } from "./achievements";
import type { Unlock } from "./unlocks";

export interface RunRecordMatch {
  /** 0 for the first rival. */
  index: number;
  rivalId: string;
  /** How well the rival played, 0 the least. */
  level: number;
  player: number;
  rival: number;
  won: boolean;
  goalsWon: number;
  goals: number;
  /** What the match paid; `null` unless the viewer played it. */
  coins: number | null;
  /** What its floor multiplied the coins by; `null` with them. */
  factor: number | null;
  /** How the match ended; `null` for a match from before it was kept. */
  detail: MatchDetail | null;
  /** What the reward after it took; `null` if there was none or it was not kept. */
  reward: RewardChoice | null;
}

export interface RunRecord {
  id: string;
  difficulty: DifficultyId;
  outcome: RunOutcome;
  startedAt: Date;
  endedAt: Date | null;
  score: number;
  matchesWon: number;
  matchesPlayed: number;
  /** What the whole run paid; `null` unless the viewer played it. */
  coins: number | null;
  /** The rival that ended a lost run. */
  endedBy: string | null;
  /** The deck as it was built, sorted; `null` for an older run. */
  built: string[] | null;
  /** The cards the rivals took at the start, sorted. */
  stolenAtStart: string[] | null;
  /** The cards the rivals still held at the end, sorted. */
  stolenLeft: string[] | null;
  /** The deck the run ended with, sorted. */
  finalDeck: string[] | null;
  /** The relics the opening chest held, and the one taken. */
  chest: string[] | null;
  chestPick: string | null;
  /** Every relic the run held, in the order it took them. */
  relics: string[] | null;
  matches: RunRecordMatch[];
  unlocks: Unlock[];
  achievements: Achievement[];
}

export interface RunRow {
  id: string;
  status: "active" | "won" | "lost" | "abandoned";
  difficulty: string;
  score: number;
  matchesWon: number;
  coins: number;
  startedAt: Date;
  endedAt: Date | null;
  state: unknown;
}

export interface RunPrizes {
  unlocks: Unlock[];
  achievements: Achievement[];
}

const sorted = (cards: readonly string[]) => [...cards].sort();

/** A record from a run this game can no longer read, kept as far as it goes. */
interface LooseRecord {
  rivalId?: unknown;
  player?: unknown;
  rival?: unknown;
  won?: unknown;
  goalsWon?: unknown;
  goals?: unknown;
  coins?: unknown;
  factor?: unknown;
  detail?: unknown;
  reward?: unknown;
}

const num = (value: unknown) => (typeof value === "number" ? value : 0);

function matchesOf(
  results: readonly LooseRecord[],
  difficulty: DifficultyId,
  owner: boolean,
  current: boolean,
): RunRecordMatch[] {
  return results.map((r, index) => {
    const detail = current && r.detail ? (r.detail as MatchDetail) : null;
    return {
      index,
      rivalId: typeof r.rivalId === "string" ? r.rivalId : "",
      level: detail?.level ?? rivalLevel(index, difficulty),
      player: num(r.player),
      rival: num(r.rival),
      won: r.won === true,
      goalsWon: num(r.goalsWon),
      goals: num(r.goals),
      coins: owner && typeof r.coins === "number" ? r.coins : null,
      factor: owner && typeof r.factor === "number" ? r.factor : null,
      detail,
      reward: current && r.reward ? (r.reward as RewardChoice) : null,
    };
  });
}

/**
 * A finished run's record for `viewer`. The caller has checked the viewer
 * may see it at all; `owner` only decides whether coins are shown.
 */
export function toRunRecord(
  row: RunRow,
  prizes: RunPrizes,
  owner: boolean,
): RunRecord {
  const difficulty = difficultyOf(row.difficulty).id;
  const outcome: RunOutcome =
    row.status === "active" ? "abandoned" : row.status;
  const base = {
    id: row.id,
    difficulty,
    outcome,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    score: row.score,
    matchesWon: row.matchesWon,
    coins: owner ? row.coins : null,
    unlocks: prizes.unlocks,
    achievements: prizes.achievements,
  };

  if (!isCurrentRun(row.state)) {
    const old = (row.state ?? {}) as { results?: unknown };
    const results = Array.isArray(old.results)
      ? (old.results as LooseRecord[])
      : [];
    const matches = matchesOf(results, difficulty, owner, false);
    return {
      ...base,
      matchesPlayed: matches.length,
      endedBy: lostTo(outcome, matches),
      built: null,
      stolenAtStart: null,
      stolenLeft: null,
      finalDeck: null,
      chest: null,
      chestPick: null,
      relics: null,
      matches,
    };
  }

  const state = row.state;
  const matches = matchesOf(state.results, difficulty, owner, true);
  const rewardsKept = state.results.every(
    (record, i) =>
      record.reward !== undefined ||
      i === state.results.length - 1 ||
      !record.won,
  );
  const reclaimed = state.results.flatMap((record) =>
    record.reward?.reclaim ? [record.reward.reclaim] : [],
  );
  const chestPick =
    state.relics[0] !== undefined && state.chest.includes(state.relics[0])
      ? state.relics[0]
      : null;
  return {
    ...base,
    matchesPlayed: matches.length,
    endedBy: lostTo(outcome, matches),
    built: sorted(state.built),
    stolenAtStart: rewardsKept ? sorted([...state.stolen, ...reclaimed]) : null,
    stolenLeft: sorted(state.stolen),
    finalDeck: sorted(state.deck),
    chest: [...state.chest],
    chestPick,
    relics: [...state.relics],
    matches,
  };
}

function lostTo(
  outcome: RunOutcome,
  matches: readonly RunRecordMatch[],
): string | null {
  if (outcome !== "lost") return null;
  const last = matches[matches.length - 1];
  return last && !last.won ? last.rivalId : null;
}
