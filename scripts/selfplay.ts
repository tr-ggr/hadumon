/**
 * Has the bots play each other and writes what was measured to
 * `sprints/data/15-ladder.json`: how the levels stand against one another,
 * what the first seat and a tie are worth, what each relic is worth, and how
 * whole runs go: how far, how many points, how many coins, and how often a
 * draw finds no card.
 *
 *   pnpm tsx --conditions=react-server scripts/selfplay.ts
 *   pnpm tsx --conditions=react-server scripts/selfplay.ts --only=ladder --games=100
 *
 * Every number comes from fixed seeds, so a run can be repeated. A section
 * that is not run keeps the numbers it had.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import {
  emptyTally,
  faceOff,
  playMatch,
  playGauntlet,
  type GauntletConfig,
  record,
  winRate,
  type Tally,
} from "~/server/game/bot/arena";
import { standIn } from "~/server/game/bot";
import {
  botFrom,
  LEVELS,
  PLANNED,
  type LevelSpec,
} from "~/server/game/bot/levels";
import { PLAIN } from "~/server/game/bot/styles";
import { CAT_LIST, RARITIES } from "~/server/game/cats";
import { CLANS, starterDeck } from "~/server/game/clans";
import { copyCap } from "~/server/game/collection";
import { DECK_SIZE, defaultDeck } from "~/server/game/deck";
import { DIFFICULTIES, type DifficultyId } from "~/server/game/difficulty";
import { ELEMENTS, type Element } from "~/server/game/elements";
import {
  ESSENCES,
  placedCats,
  type MatchConfig,
  type MatchState,
  type SideId,
} from "~/server/game/match";
import { payout } from "~/server/game/payout";
import { RELIC_LIST } from "~/server/game/relics";
import { themeOf } from "~/server/game/rivalDecks";
import { summarizeRun } from "~/server/game/run";
import { startingPool } from "~/server/game/unlocks";

const OUT_FILE = "sprints/data/15-ladder.json";

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value = ""] = arg.slice(2).split("=");
      return [key ?? "", value] as const;
    }),
);
const only = args.get("only")?.split(",") ?? null;
const scale = Number(args.get("games") ?? 300);
const wanted = (section: string) => only === null || only.includes(section);

const round = (n: number, places = 3) => Number(n.toFixed(places));
const elementAt = (i: number) => ELEMENTS[i % ELEMENTS.length] ?? "flame";

/** A plain match on two starter decks. */
function plain(seed: string, game: number, relics: string[] = []): MatchConfig {
  return {
    seed,
    rivalId: "",
    level: 0,
    player: { deck: starterDeck(elementAt(game)), relics },
    rival: { deck: starterDeck(elementAt(game + 2)), relics: [] },
  };
}

function report(tally: Tally) {
  return {
    games: tally.games,
    winRate: round(winRate(tally)),
    wins: tally.wins,
    ties: tally.ties,
    losses: tally.losses,
    scored: round(tally.scored, 2),
    conceded: round(tally.conceded, 2),
  };
}

/** How many pairs of matches a level is worth, the slow ones fewer. */
function pairsFor(level: number): number {
  return Math.max(20, Math.round(scale / [1, 1, 1, 1, 1, 1, 2, 6][level]!));
}

/* ------------------------------------------------------------- ladder */

/** Each level against the one below, and against the one below that. */
function climb(specs: readonly LevelSpec[], label: string) {
  const rows = [];
  const pairs: [number, number][] = [];
  for (let level = 1; level < specs.length; level++)
    pairs.push([level - 1, level]);
  for (let level = 2; level < specs.length; level++)
    pairs.push([level - 2, level]);
  for (const [lower, higher] of pairs) {
    const [low, high] = [specs[lower], specs[higher]];
    if (!low || !high) continue;
    const started = performance.now();
    const tally = faceOff(
      botFrom(high, PLAIN),
      botFrom(low, PLAIN),
      pairsFor(higher),
      `${label}-${lower}-${higher}`,
    );
    const row = {
      higher,
      lower,
      ...report(tally),
      msPerMatch: round((performance.now() - started) / tally.games, 1),
    };
    console.log(
      `${label} ${higher} v ${lower}: ${(row.winRate * 100).toFixed(1)}% over ${row.games} (${row.scored} to ${row.conceded})`,
    );
    rows.push(row);
  }
  return rows;
}

/** The level table the rivals use. */
const ladder = () => climb(LEVELS, "ladder");
/** The table as first planned, for the record of why it changed. */
const planned = () => climb(PLANNED, "planned");

/* -------------------------------------------------------------- seats */

const food = (state: MatchState, who: SideId) =>
  ESSENCES.reduce((sum, kind) => sum + state.sides[who].essence[kind], 0);
const cats = (state: MatchState, who: SideId) =>
  placedCats(state.sides[who].board).length;

/**
 * The same bot in both seats. What is left of the first seat's edge after
 * the lead has changed hands twice, how often a match is tied, and how many
 * ties each way of breaking one would still leave.
 */
function seats() {
  const rows = [];
  for (const level of [5, 6]) {
    const bot = standIn(level);
    const tally = emptyTally();
    const left = { food: 0, cats: 0, foodThenCats: 0 };
    const games = pairsFor(level) * 2;
    for (let game = 0; game < games; game++) {
      const state = playMatch(plain(`seats-${level}-${game}`, game), {
        player: bot,
        rival: bot,
      });
      record(tally, state, "player");
      const result = state.result;
      if (!result || result.player.total !== result.rival.total) continue;
      const sameFood = food(state, "player") === food(state, "rival");
      const sameCats = cats(state, "player") === cats(state, "rival");
      if (sameFood) left.food += 1;
      if (sameCats) left.cats += 1;
      if (sameFood && sameCats) left.foodThenCats += 1;
    }
    const row = {
      level,
      ...report(tally),
      playerSeatWins: round(tally.wins / tally.games),
      rivalSeatWins: round(tally.losses / tally.games),
      tieRate: round(tally.ties / tally.games),
      stillTiedAfter: {
        mostFoodLeft: round(left.food / tally.games),
        mostCats: round(left.cats / tally.games),
        foodThenCats: round(left.foodThenCats / tally.games),
      },
    };
    console.log(
      `seats, level ${level}: player seat ${(row.playerSeatWins * 100).toFixed(1)}%, rival seat ${(row.rivalSeatWins * 100).toFixed(1)}%, tied ${(row.tieRate * 100).toFixed(1)}%`,
    );
    rows.push(row);
  }
  return rows;
}

/* ------------------------------------------------------------- relics */

/**
 * What a relic is worth to the seat that holds it: the same deals played by
 * the same bot with the relic and without, at level 5. A charm is measured
 * on the deck of its own clan.
 */
function relics() {
  const bot = standIn(5);
  const games = pairsFor(5) * 2;
  const charmClan: Record<string, number> = {
    "ember-charm": 0,
    "tide-charm": 1,
    "spark-charm": 2,
    "briar-charm": 3,
    "dusk-charm": 4,
  };
  const run = (label: string, held: string[], clan: number | null) => {
    const tally = emptyTally();
    for (let game = 0; game < games; game++) {
      const config = plain(`relic-${game}`, clan ?? game, held);
      record(tally, playMatch(config, { player: bot, rival: bot }), "player");
    }
    return { label, ...report(tally) };
  };
  const rows = [];
  const bare = new Map<number | null, ReturnType<typeof run>>();
  const baseline = (clan: number | null) => {
    if (!bare.has(clan)) bare.set(clan, run("none", [], clan));
    return bare.get(clan)!;
  };
  for (const relic of RELIC_LIST) {
    const clan = charmClan[relic.id] ?? null;
    const base = baseline(clan);
    const held = run(relic.id, [relic.id], clan);
    const row = {
      relic: relic.id,
      points: round(held.scored - base.scored, 2),
      winRate: held.winRate,
      winRateWithout: base.winRate,
    };
    console.log(
      `${relic.id}: ${row.points >= 0 ? "+" : ""}${row.points} points, ${(row.winRateWithout * 100).toFixed(1)}% -> ${(row.winRate * 100).toFixed(1)}%`,
    );
    rows.push(row);
  }
  return rows;
}

/* ----------------------------------------------------------- gauntlet */

const POOLS = {
  newAccount: startingPool(),
  everything: {
    cats: CAT_LIST.map((cat) => cat.id),
    relics: RELIC_LIST.map((relic) => relic.id),
  },
};

/**
 * The richest deck an account that owns everything can build on one
 * element: its rarest cats first, each to its cap, until there are 24.
 */
function richDeck(element: Element): string[] {
  const cats = CAT_LIST.filter((cat) => cat.element === element).sort(
    (a, b) =>
      RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity) ||
      b.points - a.points ||
      a.id.localeCompare(b.id),
  );
  const deck: string[] = [];
  for (const cat of cats) {
    for (let copy = 0; copy < copyCap(cat.id); copy++) {
      if (deck.length < DECK_SIZE) deck.push(cat.id);
    }
  }
  return deck;
}

/** The deck a stand-in brings: the default one, or the richest it could build. */
function deckFor(poolName: keyof typeof POOLS, run: number): string[] {
  return poolName === "newAccount" ? defaultDeck() : richDeck(elementAt(run));
}

type WhatIf = Pick<GauntletConfig, "levelShift" | "rivalRelics">;

/** `runs` whole runs with a stand-in of `level` in the player's seat. */
function climbTower(
  poolName: keyof typeof POOLS,
  tier: DifficultyId,
  level: number,
  runs: number,
  whatIf: WhatIf = {},
) {
  const bot = standIn(level);
  let first = 0;
  let won = 0;
  let matches = 0;
  let played = 0;
  let dry = 0;
  let points = 0;
  let coins = 0;
  const reached = Array.from({ length: 7 }, () => 0);
  const best: number[] = [];
  for (let i = 0; i < runs; i++) {
    const { matches: record, run } = playGauntlet(
      {
        seed: `gauntlet-${i}`,
        deck: deckFor(poolName, i),
        pool: POOLS[poolName],
        tier,
        ...whatIf,
      },
      bot,
    );
    const wins = record.filter((match) => match.won).length;
    if (record[0]?.won) first += 1;
    if (wins === 6) won += 1;
    matches += wins;
    played += record.length;
    dry += record.reduce((sum, match) => sum + match.dry, 0);
    const summary = summarizeRun(run);
    points += summary.totalScore;
    coins += payout(summary);
    reached[wins] = (reached[wins] ?? 0) + 1;
    best.push(Math.max(0, ...record.map((match) => match.player)));
  }
  best.sort((a, b) => a - b);
  const share = (score: number) =>
    round(best.filter((b) => b >= score).length / runs);
  const row = {
    pool: poolName,
    tier,
    player: level,
    runs,
    firstMatch: round(first / runs),
    matchesWon: round(matches / runs, 2),
    runsWon: round(won / runs),
    /** How many runs ended with 0, 1, ... 6 matches won. */
    wins: reached,
    /** Points and coins a run came to, and draws a match found no card for. */
    pointsPerRun: round(points / runs, 1),
    coinsPerRun: round(coins / runs, 1),
    dryDrawsPerMatch: round(dry / Math.max(1, played), 2),
    bestScore: {
      median: best[Math.floor(runs / 2)] ?? 0,
      p90: best[Math.floor(runs * 0.9)] ?? 0,
      atLeast: Object.fromEntries(
        [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map((score) => [
          score,
          share(score),
        ]),
      ),
    },
  };
  console.log(
    `${poolName} ${tier} player ${level}: first ${(row.firstMatch * 100).toFixed(0)}%, ${row.matchesWon} matches, run won ${(row.runsWon * 100).toFixed(0)}%, best ${row.bestScore.median}/${row.bestScore.p90}, ${row.pointsPerRun} points, ${row.coinsPerRun} coins, ${row.dryDrawsPerMatch} dry draws a match`,
  );
  return row;
}

/**
 * Whole runs with a stand-in of each level in the player's seat, on each
 * tier: how often the first rival falls, how far a run gets, how often it is
 * won, and how often its best match reaches the scores two unlocks ask for.
 */
function gauntlet() {
  const rows = [];
  for (const poolName of ["newAccount", "everything"] as const) {
    for (const tier of DIFFICULTIES) {
      for (let level = 0; level < LEVELS.length; level++) {
        // A new account is measured at the levels a new player might play at.
        if (poolName === "newAccount" && ![0, 3, 5, 6].includes(level))
          continue;
        const runs = Math.max(
          30,
          Math.round(scale / [2, 2, 2, 2, 2, 2, 3, 8][level]!),
        );
        rows.push(climbTower(poolName, tier, level, runs));
      }
    }
  }
  return rows;
}

/**
 * The same runs under rules the game does not have, to show what each would
 * do to the table above: every rival two levels up, a rival with no relic at
 * all, and a rival that holds relics on the player's whole budget (its
 * charm, and one more after matches 1, 3 and 5).
 */
function whatIf() {
  const extra = ["bent-whisker", "ball-of-twine", "night-map"];
  const charm = (rivalId: string) => CLANS[themeOf(rivalId)].relicId;
  const variants: Record<string, WhatIf> = {
    twoLevelsUp: { levelShift: 2 },
    noRivalRelics: { rivalRelics: () => [] },
    rivalRelics: {
      rivalRelics: (rivalId, matchIndex) => [
        charm(rivalId),
        ...extra.slice(0, Math.ceil(matchIndex / 2)),
      ],
    },
  };
  const rows = [];
  for (const [variant, rules] of Object.entries(variants)) {
    for (const tier of DIFFICULTIES) {
      for (const level of [3, 5, 6]) {
        const runs = Math.max(30, Math.round(scale / 2.5));
        console.log(variant);
        rows.push({
          variant,
          ...climbTower("everything", tier, level, runs, rules),
        });
      }
    }
  }
  return rows;
}

/* --------------------------------------------------------------- main */

const sections: Record<string, () => unknown> = {
  ladder,
  planned,
  seats,
  relics,
  gauntlet,
  whatIf,
};
const data: Record<string, unknown> = existsSync(OUT_FILE)
  ? (JSON.parse(readFileSync(OUT_FILE, "utf8")) as Record<string, unknown>)
  : {};
for (const [name, measure] of Object.entries(sections)) {
  if (wanted(name)) data[name] = measure();
}
writeFileSync(OUT_FILE, `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${OUT_FILE}`);
