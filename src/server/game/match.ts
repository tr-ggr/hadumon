/**
 * The match engine: one game against one rival.
 *
 * A match is a state machine over plain JSON. `applyAction` never mutates its
 * input; it returns the next state plus the events that happened, in order,
 * for the client to animate. All randomness comes from an RNG seeded by
 * `${seed}:${step}`, so a state and an action always give the same result.
 *
 * Phases
 *   setup    the player keeps 5 of the 5 cats and 5 essence they were dealt
 *   turn     the player takes one action (reroll is free)
 *   pending  a power is waiting on a player choice
 *   over     the result is final
 *
 * After every player turn the rival flips one card. After the last turn of a
 * round, end-of-round powers fire and the round's goal is scored.
 */

import {
  getCat,
  playCost,
  ROWS,
  type Aura,
  type CostPip,
  type Effect,
  type RivalAction,
  type Row,
} from "./cats";
import { difficultyOf, type DifficultyId } from "./difficulty";
import { ELEMENTS, type Element } from "./elements";
import { GOAL_IDS, getGoal } from "./goals";
import { combineMods, relicScore, type Mods } from "./relics";
import { getRival } from "./rival";
import { createRng, type Rng } from "./rng";

export const SLOTS = 4;
export const ROUND_TURNS = [5, 4, 3] as const;
/** Yarn spent to play a cat into column 1–4 of any row. */
export const COLUMN_YARN_COST = [0, 1, 1, 2] as const;
/** Base reward of a row by the number of cats in it (0–4). */
export const ROW_REWARD: Record<Row, readonly number[]> = {
  hunt: [1, 1, 2, 2, 3],
  den: [2, 2, 3, 3, 4],
  prowl: [1, 1, 2, 2, 3],
};
/**
 * A row offers its trade while it holds exactly this many cats: the second
 * and fourth columns of a Wingspan mat.
 */
export const TRADE_CATS: readonly number[] = [1, 3];
export const FEEDER_DICE = 5;
export const TRAY_SIZE = 3;
export const SETUP_CATS = 5;
export const SETUP_KEEP = 5;
export const GOAL_WIN_POINTS = [4, 5, 6] as const;
export const GOAL_LOSE_POINTS = [1, 2, 3] as const;

export type Essence = Element | "wild";
export const ESSENCES: readonly Essence[] = [...ELEMENTS, "wild"];
export type EssencePool = Record<Essence, number>;

export interface PlacedCat {
  catId: string;
  yarn: number;
  cached: number;
  tucked: number;
  /**
   * The cats tucked under this one, oldest first. A match saved before tucks
   * were recorded has the count without the cards, so this can be shorter than
   * `tucked`, or missing.
   */
  under?: string[];
}

export type Board = Record<Row, PlacedCat[]>;

export interface SlotRef {
  row: Row;
  col: number;
}

export type Pending =
  | { kind: "tuckHand"; slot: SlotRef; draw: number }
  | { kind: "trade"; slot: SlotRef };

export interface GoalResult {
  goalId: string;
  player: number;
  rival: number;
  playerPoints: number;
  rivalPoints: number;
}

export interface ScoreBreakdown {
  cats: number;
  yarn: number;
  cached: number;
  tucked: number;
  goals: number;
  relics: number;
  total: number;
}

export interface MatchResult {
  player: ScoreBreakdown;
  rival: number;
  won: boolean;
}

export interface RivalState {
  deck: RivalAction[];
  discard: RivalAction[];
  banked: number;
  yarn: number;
  /** Goal pushes made this round. */
  pushes: number;
  goalPoints: number;
  last: RivalAction | null;
}

export type MatchPhase = "setup" | "turn" | "pending" | "over";

export const SIDES = ["player", "rival"] as const;
export type SideId = (typeof SIDES)[number];

export function otherSide(who: SideId): SideId {
  return who === "player" ? "rival" : "player";
}

/** Everything one seat at the table owns. */
export interface Side {
  relics: string[];
  mods: Mods;
  /** Turns this seat still has in the current round. */
  turnsLeft: number;
  board: Board;
  hand: string[];
  deck: string[];
  discard: string[];
  tray: string[];
  /** The cats dealt at setup; empty once they have been kept. */
  setup: string[];
  essence: EssencePool;
}

/** What the seats at a table share. */
export interface Table {
  phase: MatchPhase;
  round: number;
  feeder: Essence[];
  /** One goal id per round. */
  goals: string[];
  goalResults: GoalResult[];
  /** Powers still to fire in the current activation. */
  queue: SlotRef[];
  pending: Pending | null;
}

/**
 * A match against the scripted rival: one seat and its table laid flat, plus
 * the rival's card deck and counters.
 */
export interface MatchState extends Side, Table {
  seed: string;
  step: number;
  rivalId: string;
  rival: RivalState;
  result: MatchResult | null;
}

export type Action =
  /** Setup: indices into `setup` to keep, plus the essence to keep. */
  | { type: "keep"; cats: number[]; essence: Element[] }
  /**
   * `swap` is the essence given up for pips the pool cannot pay: two for each
   * pip short, and none when nothing is short.
   */
  | { type: "play"; hand: number; row: Row; swap?: Essence[] }
  /**
   * Indices into `feeder` of the dice to take. `trade` is the hand card
   * discarded for one die more.
   */
  | { type: "hunt"; dice: number[]; trade?: number }
  /**
   * One entry per yarn laid; a slot may repeat. `trade` is the food spent
   * for one yarn more.
   */
  | { type: "den"; targets: SlotRef[]; trade?: Essence }
  /**
   * Each pick is a tray index or the top of the deck. `trade` is the cat
   * that gives up a yarn for one cat more.
   */
  | { type: "prowl"; picks: ("deck" | number)[]; trade?: SlotRef }
  /** Free: reroll the feeder when every die shows the same face. */
  | { type: "reroll" }
  /** Answer a pending choice. `null` declines. */
  | { type: "resolve"; choice: number | null };

/** What a seat's own turn can set off. */
export type TurnEvent =
  | { type: "kept"; cats: number; essence: number }
  | { type: "played"; catId: string; row: Row; col: number }
  | { type: "activated"; row: Row; reward: number }
  | {
      type: "power";
      catId: string;
      row: Row;
      col: number;
      effect: Effect["kind"];
    }
  /** A legendary's relic handing over its treats at the end of a turn. */
  | { type: "aura"; catId: string; row: Row; col: number }
  | { type: "feeder"; faces: Essence[] };

export type MatchEvent =
  | TurnEvent
  | { type: "rival"; action: RivalAction; removed: string[] }
  | ({ type: "goal"; round: number } & GoalResult)
  | { type: "over"; won: boolean; player: number; rival: number };

export interface ActionResult {
  state: MatchState;
  events: MatchEvent[];
}

export class IllegalAction extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllegalAction";
  }
}

function fail(message: string): never {
  throw new IllegalAction(message);
}

/**
 * One action being applied: the table, the seat acting on it, and where its
 * events go. The turn pieces below know a seat and a table and nothing of who
 * else is sitting there.
 */
interface Ctx {
  t: Table;
  side: Side;
  rng: Rng;
  emit: (event: TurnEvent) => void;
  /** Called after the feeder has been rolled again. */
  onRoll?: () => void;
}

export interface MatchConfig {
  seed: string;
  /** Cat ids; shuffled here. Needs at least 8 cards. */
  deck: readonly string[];
  relics: readonly string[];
  rivalId: string;
  /** The run's tier; its mods are laid over the relics'. Kitten if left out. */
  difficulty?: DifficultyId;
}

export function emptyPool(): EssencePool {
  return { flame: 0, mist: 0, volt: 0, thorn: 0, shade: 0, wild: 0 };
}

function rollDice(rng: Rng): Essence[] {
  return Array.from({ length: FEEDER_DICE }, () => rng.pick(ESSENCES));
}

export function createMatch(config: MatchConfig): MatchState {
  const rng = createRng(`${config.seed}:0`);
  const deck = rng.shuffle(config.deck);
  const setup = deck.splice(0, SETUP_CATS);
  const tray = deck.splice(0, TRAY_SIZE);
  const mods = combineMods(config.relics, difficultyOf(config.difficulty).mods);
  return {
    seed: config.seed,
    step: 0,
    rivalId: config.rivalId,
    relics: [...config.relics],
    mods,
    phase: "setup",
    round: 0,
    turnsLeft: 0,
    board: { hunt: [], den: [], prowl: [] },
    hand: [],
    deck,
    discard: [],
    tray,
    setup,
    essence: emptyPool(),
    feeder: rollDice(rng),
    goals: rng.shuffle(GOAL_IDS).slice(0, ROUND_TURNS.length),
    goalResults: [],
    rival: {
      deck: rng.shuffle(getRival(config.rivalId).deck),
      discard: [],
      banked: 0,
      yarn: mods.rivalStartYarn,
      pushes: 0,
      goalPoints: 0,
      last: null,
    },
    queue: [],
    pending: null,
    result: null,
  };
}

/* ------------------------------------------------------------- queries */

export function placedCats(board: Board): PlacedCat[] {
  return ROWS.flatMap((row) => board[row]);
}

export function totalYarn(board: Board): number {
  return placedCats(board).reduce((sum, placed) => sum + placed.yarn, 0);
}

/** One kind of legendary's relic, summed over the cats on the board. */
export function auraTotal(board: Board, kind: Aura["kind"]): number {
  return placedCats(board).reduce((sum, placed) => {
    const aura = getCat(placed.catId).aura;
    return aura?.kind === kind ? sum + aura.n : sum;
  }, 0);
}

/** How many dice, yarn or cats activating `row` gives a seat right now. */
export function rowReward(
  side: Pick<Side, "board" | "mods">,
  row: Row,
): number {
  const base = ROW_REWARD[row][side.board[row].length] ?? 0;
  const bonus = {
    hunt: side.mods.huntBonus,
    den: side.mods.denBonus,
    prowl: side.mods.prowlBonus,
  }[row];
  return base + bonus + auraTotal(side.board, "reward");
}

export function columnYarnCost(mods: Mods, col: number): number {
  return Math.max(0, (COLUMN_YARN_COST[col] ?? 0) - mods.yarnDiscount);
}

/**
 * Pays a cost from a pool, or returns `null` if it cannot be paid. Element
 * pips take that element, then wild. `any` pips take the element with the
 * most to spare after `reserve` is set aside, and use wild last.
 */
export function payCost(
  pool: EssencePool,
  cost: readonly CostPip[],
  reserve: Partial<Record<Element, number>> = {},
): EssencePool | null {
  const next = { ...pool };
  for (const pip of cost) {
    if (pip === "any") continue;
    if (next[pip] > 0) next[pip] -= 1;
    else if (next.wild > 0) next.wild -= 1;
    else return null;
  }
  const spare = (element: Element) => next[element] - (reserve[element] ?? 0);
  for (const pip of cost) {
    if (pip !== "any") continue;
    let best: Essence | null = null;
    for (const element of ELEMENTS) {
      if (
        next[element] > 0 &&
        (best === null || spare(element) > spare(best))
      ) {
        best = element;
      }
    }
    if (best === null && next.wild > 0) best = "wild";
    if (best === null) return null;
    next[best] -= 1;
  }
  return next;
}

export interface SwapOffer {
  /** The element pips that neither their element nor wild can pay. */
  short: Element[];
  /** What is left once every pip that can be paid in kind has been. */
  spare: EssencePool;
}

/**
 * How a cost stands against a pool. Any two essence pay for one element pip
 * the pool is short of, so a cost is within reach when the spare essence
 * covers two for each pip short and one for each `any` pip. `null` if it is
 * out of reach even so.
 */
export function swapOffer(
  pool: EssencePool,
  cost: readonly CostPip[],
): SwapOffer | null {
  const spare = { ...pool };
  const short: Element[] = [];
  let any = 0;
  for (const pip of cost) {
    if (pip === "any") any += 1;
    else if (spare[pip] > 0) spare[pip] -= 1;
    else if (spare.wild > 0) spare.wild -= 1;
    else short.push(pip);
  }
  const left = ESSENCES.reduce((sum, kind) => sum + spare[kind], 0);
  return left >= 2 * short.length + any ? { short, spare } : null;
}

/** The element pips the rest of the hand will need, by element. */
function handReserve(
  hand: readonly string[],
  index: number,
  discount: number,
): Partial<Record<Element, number>> {
  const reserve: Partial<Record<Element, number>> = {};
  hand.forEach((other, i) => {
    if (i === index) return;
    for (const pip of playCost(other, discount)) {
      if (pip !== "any") reserve[pip] = (reserve[pip] ?? 0) + 1;
    }
  });
  return reserve;
}

/**
 * What playing `hand[index]` leaves in the pool, or `null` if it cannot be
 * paid. `any` pips avoid essence the rest of the hand needs by element, so
 * paying for one cat does not strand another. `swap` must be exactly two
 * spare essence for each pip short. `discount` is the board's, see `auraTotal`.
 */
export function playPayment(
  pool: EssencePool,
  hand: readonly string[],
  index: number,
  swap: readonly Essence[] = [],
  discount = 0,
): EssencePool | null {
  const catId = hand[index];
  if (!catId) return null;
  const cost = playCost(catId, discount);
  const offer = swapOffer(pool, cost);
  if (!offer || swap.length !== 2 * offer.short.length) return null;
  const next = { ...pool };
  const spare = { ...offer.spare };
  for (const kind of swap) {
    if (!(spare[kind] > 0)) return null;
    spare[kind] -= 1;
    next[kind] -= 1;
  }
  // Each pair given up stands in for one pip, the way wild would.
  next.wild += offer.short.length;
  return payCost(next, cost, handReserve(hand, index, discount));
}

/**
 * The swap made when nobody chooses: the spare essence the rest of the hand
 * needs least. Empty when nothing is short or the cost is out of reach.
 */
export function defaultSwap(
  pool: EssencePool,
  hand: readonly string[],
  index: number,
  discount = 0,
): Essence[] {
  const catId = hand[index];
  const offer = catId ? swapOffer(pool, playCost(catId, discount)) : null;
  if (!offer) return [];
  const reserve: Partial<Record<Essence, number>> = handReserve(
    hand,
    index,
    discount,
  );
  const spare = { ...offer.spare };
  const free = (kind: Essence) => spare[kind] - (reserve[kind] ?? 0);
  const swap: Essence[] = [];
  for (let i = 0; i < 2 * offer.short.length; i++) {
    let best: Essence | null = null;
    for (const kind of ESSENCES) {
      if (spare[kind] > 0 && (best === null || free(kind) > free(best))) {
        best = kind;
      }
    }
    if (best === null) return [];
    spare[best] -= 1;
    swap.push(best);
  }
  return swap;
}

export function canPlay(
  side: Pick<Side, "board" | "hand" | "essence" | "mods">,
  hand: number,
  row: Row,
): boolean {
  const catId = side.hand[hand];
  if (!catId) return false;
  const cat = getCat(catId);
  const line = side.board[row];
  return (
    cat.rows.includes(row) &&
    line.length < SLOTS &&
    swapOffer(
      side.essence,
      playCost(catId, auraTotal(side.board, "discount")),
    ) !== null &&
    totalYarn(side.board) >= columnYarnCost(side.mods, line.length)
  );
}

export function canReroll(table: Pick<Table, "phase" | "feeder">): boolean {
  const first = table.feeder[0];
  return (
    table.phase === "turn" &&
    first !== undefined &&
    table.feeder.every((face) => face === first)
  );
}

/** Where `n` yarn goes when nobody chooses: board order, to capacity. */
export function autoYarnTargets(
  side: Pick<Side, "board">,
  n: number,
): SlotRef[] {
  const targets: SlotRef[] = [];
  for (const row of ROWS) {
    side.board[row].forEach((placed, col) => {
      let room = getCat(placed.catId).yarnCap - placed.yarn;
      while (room > 0 && targets.length < n) {
        targets.push({ row, col });
        room -= 1;
      }
    });
  }
  return targets;
}

/** How many cats a seat's Prowl must pick right now. */
export function prowlPickCount(
  side: Pick<Side, "board" | "mods" | "tray" | "deck" | "discard">,
): number {
  const available = side.tray.length + side.deck.length + side.discard.length;
  return Math.min(rowReward(side, "prowl"), available);
}

/** Total yarn the board could still take. */
export function boardYarnRoom(board: Board): number {
  return placedCats(board).reduce(
    (sum, placed) =>
      sum + Math.max(0, getCat(placed.catId).yarnCap - placed.yarn),
    0,
  );
}

/** True while `row` holds a number of cats that opens its trade. */
export function tradeOpen(board: Board, row: Row): boolean {
  return TRADE_CATS.includes(board[row].length);
}

/**
 * True when a seat could make `row`'s trade on its turn: the row offers it,
 * there is something to pay with, and the extra it buys can actually be
 * taken. Nobody pays for nothing.
 *
 *   hunt   discard 1 cat from hand, take 1 extra die
 *   den    spend 1 food, lay 1 extra yarn
 *   prowl  spend 1 yarn from a cat, take 1 extra cat
 */
export function tradeOffered(
  side: Side,
  feeder: readonly Essence[],
  row: Row,
): boolean {
  if (!tradeOpen(side.board, row)) return false;
  const reward = rowReward(side, row);
  switch (row) {
    case "hunt":
      return side.hand.length > 0 && feeder.length > reward;
    case "den":
      return (
        ESSENCES.some((kind) => side.essence[kind] > 0) &&
        boardYarnRoom(side.board) > reward
      );
    case "prowl":
      return (
        totalYarn(side.board) > 0 &&
        side.tray.length + side.deck.length + side.discard.length > reward
      );
  }
}

/** True when `row`'s trade can be made right now. */
export function canTrade(state: MatchState, row: Row): boolean {
  return state.phase === "turn" && tradeOffered(state, state.feeder, row);
}

/**
 * The food a Den trade spends when nobody chooses: what the hand needs
 * least, and a Treat only when there is nothing else.
 */
export function spareFood(
  side: Pick<Side, "board" | "hand" | "essence">,
): Essence | null {
  const reserve: Partial<Record<Essence, number>> = handReserve(
    side.hand,
    -1,
    auraTotal(side.board, "discount"),
  );
  const free = (kind: Essence) => side.essence[kind] - (reserve[kind] ?? 0);
  let best: Essence | null = null;
  for (const kind of ELEMENTS) {
    if (side.essence[kind] > 0 && (best === null || free(kind) > free(best))) {
      best = kind;
    }
  }
  return best ?? (side.essence.wild > 0 ? "wild" : null);
}

/** The cat a Prowl trade takes its yarn from when nobody chooses: the richest. */
export function richestSlot(board: Board): SlotRef | null {
  let best: SlotRef | null = null;
  let most = 0;
  for (const row of ROWS) {
    board[row].forEach((placed, col) => {
      if (placed.yarn > most) {
        most = placed.yarn;
        best = { row, col };
      }
    });
  }
  return best;
}

export function rivalBankValue(state: MatchState): number {
  return Math.max(
    1,
    getRival(state.rivalId).bankPoints + state.mods.rivalBankDelta,
  );
}

/**
 * What a board scores. It takes the three things a score is made of and not
 * the whole state, so the client can score a board it has rebuilt. `who` says
 * whose share of the goal points to count.
 */
export function scoreBoard(
  board: Board,
  goalResults: readonly GoalResult[],
  relicIds: readonly string[],
  who: SideId = "player",
): ScoreBreakdown {
  const placed = placedCats(board);
  const cats = placed.reduce((sum, p) => sum + getCat(p.catId).points, 0);
  const yarn = placed.reduce((sum, p) => sum + p.yarn, 0);
  const cached = placed.reduce((sum, p) => sum + p.cached, 0);
  const tucked = placed.reduce((sum, p) => sum + p.tucked, 0);
  const goals = goalResults.reduce(
    (sum, g) => sum + (who === "player" ? g.playerPoints : g.rivalPoints),
    0,
  );
  const relics = relicIds.reduce((sum, id) => sum + relicScore(id, board), 0);
  return {
    cats,
    yarn,
    cached,
    tucked,
    goals,
    relics,
    total: cats + yarn + cached + tucked + goals + relics,
  };
}

export function playerScore(state: MatchState): ScoreBreakdown {
  return scoreBoard(state.board, state.goalResults, state.relics);
}

export function rivalScore(state: MatchState): number {
  const { banked, yarn, goalPoints } = state.rival;
  return banked * rivalBankValue(state) + yarn + goalPoints;
}

/**
 * The current round's goal as it would score right now: the player's count
 * against the rival's tally (par, plus its edge, plus this round's pushes).
 * A player with nothing towards the goal scores nothing.
 */
export function goalStanding(state: MatchState): GoalResult | null {
  const goalId = state.goals[state.round];
  if (!goalId || state.phase === "over") return null;
  const goal = getGoal(goalId);
  const base = goal.count(state);
  const player = base > 0 ? base + state.mods.goalBonus : 0;
  const rival =
    (goal.par[state.round] ?? 0) +
    getRival(state.rivalId).goalEdge +
    state.rival.pushes;
  const win = GOAL_WIN_POINTS[state.round] ?? 0;
  const lose = GOAL_LOSE_POINTS[state.round] ?? 0;
  const split = Math.floor((win + lose) / 2);
  return {
    goalId,
    player,
    rival,
    playerPoints:
      player === 0 ? 0 : player > rival ? win : player < rival ? lose : split,
    rivalPoints: player > rival ? lose : player < rival ? win : split,
  };
}

/* ------------------------------------------------------------- helpers */

function isIndexList(values: readonly number[], length: number): boolean {
  return (
    new Set(values).size === values.length &&
    values.every((v) => Number.isInteger(v) && v >= 0 && v < length)
  );
}

function drawCard(ctx: Ctx): string | null {
  const { side } = ctx;
  if (side.deck.length === 0) {
    if (side.discard.length === 0) return null;
    side.deck = ctx.rng.shuffle(side.discard);
    side.discard = [];
  }
  return side.deck.shift() ?? null;
}

function refillTray(ctx: Ctx): void {
  while (ctx.side.tray.length < TRAY_SIZE) {
    const card = drawCard(ctx);
    if (card === null) return;
    ctx.side.tray.push(card);
  }
}

function rollFeeder(ctx: Ctx): void {
  ctx.t.feeder = rollDice(ctx.rng);
  ctx.emit({ type: "feeder", faces: [...ctx.t.feeder] });
  ctx.onRoll?.();
}

function spendYarn(board: Board, n: number): void {
  for (let i = 0; i < n; i++) {
    const richest = placedCats(board).reduce<PlacedCat | null>(
      (best, placed) => (placed.yarn > (best?.yarn ?? 0) ? placed : best),
      null,
    );
    if (richest) richest.yarn -= 1;
  }
}

function addYarn(placed: PlacedCat, n: number): void {
  const cap = getCat(placed.catId).yarnCap;
  placed.yarn = Math.min(cap, placed.yarn + n);
}

/** Tucks a cat under another: a point, and the card kept to be looked at. */
function tuck(placed: PlacedCat, catId: string): void {
  placed.tucked += 1;
  (placed.under ??= []).push(catId);
}

/* -------------------------------------------------------------- powers */

/**
 * Runs one power of the seat's. Choice effects open a pending choice during
 * the seat's own turn and are skipped anywhere else (no catalogue cat pairs
 * them with a between-turns or end-of-round timing).
 */
function firePower(
  ctx: Ctx,
  slot: SlotRef,
  effect: Effect,
  allowChoice: boolean,
): void {
  const { t, side } = ctx;
  const placed = side.board[slot.row][slot.col];
  if (!placed) return;
  const cat = getCat(placed.catId);
  ctx.emit({
    type: "power",
    catId: cat.id,
    row: slot.row,
    col: slot.col,
    effect: effect.kind,
  });

  switch (effect.kind) {
    case "essence":
      side.essence[effect.element] += effect.n;
      return;
    case "wild":
      side.essence.wild += effect.n;
      return;
    case "yarnSelf":
      addYarn(placed, effect.n);
      return;
    case "yarnRow":
      for (const other of side.board[slot.row]) addYarn(other, effect.n);
      return;
    case "draw":
      for (let i = 0; i < effect.n; i++) {
        const card = drawCard(ctx);
        if (card !== null) side.hand.push(card);
      }
      return;
    case "cache":
      placed.cached += effect.n;
      return;
    case "tuckDeck":
      for (let i = 0; i < effect.n; i++) {
        const card = drawCard(ctx);
        if (card !== null) tuck(placed, card);
      }
      return;
    case "pounce": {
      const card = drawCard(ctx);
      if (card === null) return;
      if (getCat(card).points <= effect.maxPoints) tuck(placed, card);
      else side.discard.push(card);
      return;
    }
    case "tuckHand":
      if (allowChoice && side.hand.length > 0) {
        t.pending = { kind: "tuckHand", slot, draw: effect.draw };
      }
      return;
    case "trade":
      if (allowChoice && placed.yarn > 0) {
        t.pending = { kind: "trade", slot };
      }
      return;
    case "encore":
      // Queued behind what is still to fire, so the row finishes its first
      // pass before the second. Another encore is left out, or two would
      // set each other off for ever.
      for (let col = side.board[slot.row].length - 1; col >= 0; col--) {
        const other = side.board[slot.row][col];
        const power = other ? getCat(other.catId).power : null;
        if (
          col !== slot.col &&
          power?.timing === "activated" &&
          power.effect.kind !== "encore"
        ) {
          t.queue.push({ row: slot.row, col });
        }
      }
      return;
  }
}

/** Fires every power of the seat's that `matches`, in board order. */
function fireTimed(
  ctx: Ctx,
  matches: (cat: ReturnType<typeof getCat>) => boolean,
): void {
  for (const row of ROWS) {
    ctx.side.board[row].forEach((placed, col) => {
      const cat = getCat(placed.catId);
      if (cat.power && matches(cat)) {
        firePower(ctx, { row, col }, cat.power.effect, false);
      }
    });
  }
}

function drain(ctx: Ctx): void {
  const { t, side } = ctx;
  while (!t.pending) {
    const slot = t.queue.shift();
    if (!slot) return;
    const placed = side.board[slot.row][slot.col];
    const power = placed ? getCat(placed.catId).power : null;
    if (power) firePower(ctx, slot, power.effect, true);
  }
}

/* --------------------------------------------------------- turn pieces */

/**
 * Setup: the seat keeps cats and food and starts with its relics' Treats.
 * Starting the first round is left to whoever runs the table.
 */
function keep(ctx: Ctx, action: Extract<Action, { type: "keep" }>): void {
  const { side } = ctx;
  if (!isIndexList(action.cats, side.setup.length))
    fail("Those are not cats you were dealt.");
  const essenceOk =
    new Set(action.essence).size === action.essence.length &&
    action.essence.every((e) => (ELEMENTS as readonly string[]).includes(e));
  if (!essenceOk) fail("Keep at most one of each food.");
  if (action.cats.length + action.essence.length !== SETUP_KEEP) {
    fail(`Keep exactly ${SETUP_KEEP} cats and food in total.`);
  }

  side.setup.forEach((catId, i) => {
    (action.cats.includes(i) ? side.hand : side.discard).push(catId);
  });
  side.setup = [];
  for (const element of action.essence) side.essence[element] += 1;
  side.essence.wild += side.mods.startWild;
  ctx.emit({
    type: "kept",
    cats: action.cats.length,
    essence: action.essence.length,
  });
}

function activate(ctx: Ctx, row: Row, reward: number): void {
  const { t, side } = ctx;
  ctx.emit({ type: "activated", row, reward });
  for (let col = side.board[row].length - 1; col >= 0; col--) {
    const placed = side.board[row][col];
    if (placed && getCat(placed.catId).power?.timing === "activated") {
      t.queue.push({ row, col });
    }
  }
}

function play(ctx: Ctx, action: Extract<Action, { type: "play" }>): void {
  const { t, side } = ctx;
  const catId = side.hand[action.hand];
  if (!catId) fail("That cat is not in your hand.");
  if (!ROWS.includes(action.row)) fail("That is not a row.");
  const cat = getCat(catId);
  const line = side.board[action.row];
  if (!cat.rows.includes(action.row))
    fail(`${cat.name} cannot live in that row.`);
  if (line.length >= SLOTS) fail("That row is full.");
  const discount = auraTotal(side.board, "discount");
  const offer = swapOffer(side.essence, playCost(catId, discount));
  if (!offer) fail(`Not enough food for ${cat.name}.`);
  const swap = action.swap ?? [];
  const owed = 2 * offer.short.length;
  if (swap.length !== owed) {
    fail(
      owed === 0
        ? `${cat.name} is paid for in full; nothing needs swapping.`
        : `${cat.name} is ${offer.short.length} food short: give up ${owed} food in its place.`,
    );
  }
  const paid = playPayment(
    side.essence,
    side.hand,
    action.hand,
    swap,
    discount,
  );
  if (!paid) fail(`Give up only food ${cat.name} does not need.`);
  const col = line.length;
  const yarn = columnYarnCost(side.mods, col);
  if (totalYarn(side.board) < yarn) fail(`That column costs ${yarn} yarn.`);

  side.essence = paid;
  spendYarn(side.board, yarn);
  side.hand.splice(action.hand, 1);
  line.push({ catId, yarn: 0, cached: 0, tucked: 0, under: [] });
  ctx.emit({ type: "played", catId, row: action.row, col });
  if (cat.power?.timing === "played") t.queue.push({ row: action.row, col });
}

function hunt(ctx: Ctx, action: Extract<Action, { type: "hunt" }>): void {
  const { t, side } = ctx;
  const reward = rowReward(side, "hunt");
  const trade = action.trade;
  if (trade !== undefined) {
    if (!tradeOffered(side, t.feeder, "hunt"))
      fail("The Hunt has no trade to make right now.");
    if (!isIndexList([trade], side.hand.length))
      fail("That cat is not in your hand.");
  }
  const take =
    trade !== undefined ? reward + 1 : Math.min(reward, t.feeder.length);
  if (
    !isIndexList(action.dice, t.feeder.length) ||
    action.dice.length !== take
  ) {
    fail(`Take exactly ${take} dice from the feeder.`);
  }
  if (trade !== undefined) side.discard.push(...side.hand.splice(trade, 1));
  for (const index of [...action.dice].sort((a, b) => b - a)) {
    const [face] = t.feeder.splice(index, 1);
    if (face) side.essence[face] += 1;
  }
  if (t.feeder.length === 0) rollFeeder(ctx);
  activate(ctx, "hunt", reward);
}

function den(ctx: Ctx, action: Extract<Action, { type: "den" }>): void {
  const { t, side } = ctx;
  const reward = rowReward(side, "den");
  const trade = action.trade;
  if (trade !== undefined) {
    if (!tradeOffered(side, t.feeder, "den"))
      fail("The Den has no trade to make right now.");
    if (!ESSENCES.includes(trade) || side.essence[trade] <= 0)
      fail("You do not hold that food.");
    if (action.targets.length !== reward + 1)
      fail(`A trade lays all ${reward + 1} yarn, or it is not made.`);
    side.essence[trade] -= 1;
  }
  if (action.targets.length > reward + (trade !== undefined ? 1 : 0))
    fail(`The Den lays ${reward} yarn.`);
  for (const target of action.targets) {
    const placed = ROWS.includes(target.row)
      ? side.board[target.row][target.col]
      : undefined;
    if (!placed) fail("There is no cat in that slot.");
    if (placed.yarn >= getCat(placed.catId).yarnCap) {
      fail(`${getCat(placed.catId).name} cannot hold more yarn.`);
    }
    placed.yarn += 1;
  }
  activate(ctx, "den", reward);
}

function prowl(ctx: Ctx, action: Extract<Action, { type: "prowl" }>): void {
  const { t, side } = ctx;
  const reward = rowReward(side, "prowl");
  const trade = action.trade;
  let want = prowlPickCount(side);
  if (trade !== undefined) {
    if (!tradeOffered(side, t.feeder, "prowl"))
      fail("The Prowl has no trade to make right now.");
    const payer = ROWS.includes(trade.row)
      ? side.board[trade.row][trade.col]
      : undefined;
    if (!payer || payer.yarn <= 0) fail("That cat holds no yarn to spend.");
    payer.yarn -= 1;
    want += 1;
  }
  const trayPicks = action.picks.filter((p): p is number => p !== "deck");
  const deckPicks = action.picks.length - trayPicks.length;
  if (
    action.picks.length !== want ||
    !isIndexList(trayPicks, side.tray.length) ||
    deckPicks > side.deck.length + side.discard.length
  ) {
    fail(`Pick exactly ${want} cats from the tray or the deck.`);
  }
  for (const index of [...trayPicks].sort((a, b) => b - a)) {
    const [card] = side.tray.splice(index, 1);
    if (card) side.hand.push(card);
  }
  for (let i = 0; i < deckPicks; i++) {
    const card = drawCard(ctx);
    if (card !== null) side.hand.push(card);
  }
  activate(ctx, "prowl", reward);
}

function resolve(ctx: Ctx, choice: number | null): void {
  const { t, side } = ctx;
  const pending = t.pending;
  if (!pending) fail("Nothing is waiting on a choice.");
  const placed = side.board[pending.slot.row][pending.slot.col];
  t.pending = null;
  if (choice === null || !placed) return;

  if (pending.kind === "tuckHand") {
    if (!isIndexList([choice], side.hand.length))
      fail("That cat is not in your hand.");
    const [card] = side.hand.splice(choice, 1);
    if (card) tuck(placed, card);
    for (let i = 0; i < pending.draw; i++) {
      const card = drawCard(ctx);
      if (card !== null) side.hand.push(card);
    }
    return;
  }
  if (choice !== 1) fail("Answer 1 to trade, or decline.");
  if (placed.yarn > 0) {
    placed.yarn -= 1;
    side.essence.wild += 1;
  }
}

/** The legendaries' relics that pay out at the end of each of a seat's turns. */
function fireAuras(ctx: Ctx): void {
  const { side } = ctx;
  for (const row of ROWS) {
    side.board[row].forEach((placed, col) => {
      const aura = getCat(placed.catId).aura;
      if (aura?.kind !== "treat") return;
      side.essence.wild += aura.n;
      ctx.emit({ type: "aura", catId: placed.catId, row, col });
    });
  }
}

/**
 * Applies a turn action for the seat: its own move, then every power it
 * queued, as far as the first choice. A free reroll is not a turn; it
 * returns `false` and the seat is still to act.
 */
function takeTurn(ctx: Ctx, action: Action): boolean {
  switch (action.type) {
    case "reroll":
      if (!canReroll(ctx.t))
        fail("Reroll only when every die shows the same face.");
      rollFeeder(ctx);
      return false;
    case "play":
      play(ctx, action);
      break;
    case "hunt":
      hunt(ctx, action);
      break;
    case "den":
      den(ctx, action);
      break;
    case "prowl":
      prowl(ctx, action);
      break;
    default:
      fail("That action is not available right now.");
  }
  drain(ctx);
  return true;
}

/** Closes a seat's turn once nothing is left waiting on a choice. */
function endTurn(ctx: Ctx): void {
  fireAuras(ctx);
  refillTray(ctx);
  ctx.side.turnsLeft -= 1;
}

/* ------------------------------------------------- the scripted rival */

function rivalTurn(s: MatchState, ctx: Ctx, events: MatchEvent[]): void {
  const rival = getRival(s.rivalId);
  const r = s.rival;
  if (r.deck.length === 0) {
    r.deck = ctx.rng.shuffle(r.discard);
    r.discard = [];
  }
  const card = r.deck.shift();
  if (!card) return;
  r.discard.push(card);
  r.last = card;

  const removed: string[] = [];
  switch (card) {
    case "bank":
      r.banked += 1;
      break;
    case "stash":
      r.yarn += rival.stashYarn;
      break;
    case "raid":
      for (let i = 0; i < rival.raidDice && s.feeder.length > 0; i++) {
        const [face] = s.feeder.splice(ctx.rng.int(0, s.feeder.length - 1), 1);
        if (face) removed.push(face);
      }
      break;
    case "burn":
      for (let i = 0; i < rival.burnCards && s.tray.length > 0; i++) {
        const best = s.tray.reduce(
          (top, catId, index) =>
            getCat(catId).points > getCat(s.tray[top] ?? catId).points
              ? index
              : top,
          0,
        );
        const [burned] = s.tray.splice(best, 1);
        if (burned) {
          s.discard.push(burned);
          removed.push(burned);
        }
      }
      break;
    case "push":
      r.pushes += 1;
      break;
  }
  events.push({ type: "rival", action: card, removed });
  if (s.feeder.length === 0) rollFeeder(ctx);
  refillTray(ctx);

  fireTimed(
    ctx,
    (cat) =>
      cat.power?.timing === "between" &&
      (cat.power.on === "any" || cat.power.on === card),
  );
}

function endRound(s: MatchState, ctx: Ctx, events: MatchEvent[]): void {
  fireTimed(ctx, (cat) => cat.power?.timing === "roundEnd");

  const result = goalStanding(s);
  if (result) {
    s.goalResults.push(result);
    s.rival.goalPoints += result.rivalPoints;
    events.push({ type: "goal", round: s.round, ...result });
  }
  s.rival.pushes = 0;

  s.round += 1;
  const turns = ROUND_TURNS[s.round];
  if (turns !== undefined) {
    s.turnsLeft = turns;
    return;
  }
  const player = playerScore(s);
  const rival = rivalScore(s);
  s.phase = "over";
  s.result = { player, rival, won: player.total > rival };
  events.push({
    type: "over",
    won: s.result.won,
    player: player.total,
    rival,
  });
}

/** Finishes the action: once no choice is pending, hand the turn to the rival. */
function settle(s: MatchState, ctx: Ctx, events: MatchEvent[]): void {
  if (s.pending) {
    s.phase = "pending";
    return;
  }
  s.phase = "turn";
  endTurn(ctx);
  rivalTurn(s, ctx, events);
  if (s.turnsLeft <= 0) endRound(s, ctx, events);
}

export function applyAction(state: MatchState, action: Action): ActionResult {
  const s = structuredClone(state);
  s.step += 1;
  const events: MatchEvent[] = [];
  // The one seat and its table are the same object here.
  const ctx: Ctx = {
    t: s,
    side: s,
    rng: createRng(`${s.seed}:${s.step}`),
    emit: (event) => events.push(event),
  };

  if (s.phase === "over") fail("The match is over.");
  if (s.phase === "setup") {
    if (action.type !== "keep") fail("Choose what to keep first.");
    keep(ctx, action);
    s.phase = "turn";
    s.round = 0;
    s.turnsLeft = ROUND_TURNS[0] + s.mods.extraTurns;
    return { state: s, events };
  }
  if (s.phase === "pending") {
    if (action.type !== "resolve") fail("Answer the pending choice first.");
    resolve(ctx, action.choice);
    drain(ctx);
    settle(s, ctx, events);
    return { state: s, events };
  }
  if (takeTurn(ctx, action)) settle(s, ctx, events);
  return { state: s, events };
}

/* ------------------------------------------------------- legal actions */

/** Every way to choose `k` of the indices `0..n-1`. */
export function combinations(n: number, k: number): number[][] {
  if (k === 0) return [[]];
  if (k > n) return [];
  const out: number[][] = [];
  const walk = (start: number, picked: number[]) => {
    if (picked.length === k) {
      out.push([...picked]);
      return;
    }
    for (let i = start; i < n; i++) walk(i + 1, [...picked, i]);
  };
  walk(0, []);
  return out;
}

/**
 * The actions a seat has on a table. Complete for every action type except
 * Den, which is listed once with automatic yarn placement; any placement that
 * respects capacity is also legal. A play that is short is listed once with
 * the default swap; any other spare essence may be given up instead.
 *
 * A row's trade is listed with every way to take what it buys. The Hunt's is
 * listed for each different cat that could be discarded; the Den's and the
 * Prowl's are listed with one way to pay (`spareFood`, `richestSlot`), and any
 * other food held, or any other cat holding yarn, may pay instead.
 */
export function seatActions(
  table: Pick<Table, "phase" | "pending" | "feeder">,
  side: Side,
): Action[] {
  if (table.phase === "over") return [];

  if (table.phase === "setup") {
    const cats = side.setup.length;
    return combinations(cats + ELEMENTS.length, SETUP_KEEP).map((combo) => ({
      type: "keep",
      cats: combo.filter((i) => i < cats),
      essence: combo
        .filter((i) => i >= cats)
        .map((i) => ELEMENTS[i - cats])
        .filter((e): e is Element => e !== undefined),
    }));
  }

  if (table.phase === "pending") {
    const pending = table.pending;
    if (!pending) return [];
    const choices: (number | null)[] =
      pending.kind === "trade" ? [null, 1] : [null, ...side.hand.keys()];
    return choices.map((choice) => ({ type: "resolve", choice }));
  }

  const actions: Action[] = [];
  if (canReroll(table)) actions.push({ type: "reroll" });

  const seen = new Set<string>();
  side.hand.forEach((catId, hand) => {
    if (seen.has(catId)) return;
    seen.add(catId);
    const swap = defaultSwap(
      side.essence,
      side.hand,
      hand,
      auraTotal(side.board, "discount"),
    );
    for (const row of ROWS) {
      if (!canPlay(side, hand, row)) continue;
      actions.push(
        swap.length > 0
          ? { type: "play", hand, row, swap }
          : { type: "play", hand, row },
      );
    }
  });

  const take = Math.min(rowReward(side, "hunt"), table.feeder.length);
  for (const dice of combinations(table.feeder.length, take)) {
    actions.push({ type: "hunt", dice });
  }
  if (tradeOffered(side, table.feeder, "hunt")) {
    const discards = side.hand.flatMap((catId, hand) =>
      side.hand.indexOf(catId) === hand ? [hand] : [],
    );
    for (const dice of combinations(table.feeder.length, take + 1)) {
      for (const trade of discards) actions.push({ type: "hunt", dice, trade });
    }
  }

  const yarn = rowReward(side, "den");
  actions.push({ type: "den", targets: autoYarnTargets(side, yarn) });
  const food = tradeOffered(side, table.feeder, "den") ? spareFood(side) : null;
  if (food !== null) {
    actions.push({
      type: "den",
      targets: autoYarnTargets(side, yarn + 1),
      trade: food,
    });
  }

  const prowls = (want: number, trade?: SlotRef) => {
    const deckAvailable = side.deck.length + side.discard.length;
    for (
      let fromTray = 0;
      fromTray <= Math.min(want, side.tray.length);
      fromTray++
    ) {
      const fromDeck = want - fromTray;
      if (fromDeck > deckAvailable) continue;
      for (const combo of combinations(side.tray.length, fromTray)) {
        const picks = [
          ...combo,
          ...Array.from({ length: fromDeck }, () => "deck" as const),
        ];
        actions.push(
          trade ? { type: "prowl", picks, trade } : { type: "prowl", picks },
        );
      }
    }
  };
  const want = prowlPickCount(side);
  prowls(want);
  const payer = tradeOffered(side, table.feeder, "prowl")
    ? richestSlot(side.board)
    : null;
  if (payer) prowls(want + 1, payer);
  return actions;
}

/** The actions available now in a match against the scripted rival. */
export function legalActions(state: MatchState): Action[] {
  return seatActions(state, state);
}

/* ------------------------------------------------------ the two seats */

/*
 * The same game with a second seat in place of the scripted rival. Both
 * sides own a board, a hand, a deck, a tray and food, share the feeder and
 * the round goals, and take the same actions under the same rules. The
 * reducer applies one action for whoever is to act and knows nothing of what
 * decides it: a person, a bot or a test.
 *
 *   setup    the rival keeps its opening hand, then the player keeps theirs
 *   turn     the seats alternate, the round's leader first; each takes 5, 4
 *            and 3 turns in the three rounds, and the lead changes hands
 *            every round, the player leading the first
 *   pending  a power of the acting seat is waiting on its choice
 *   over     the result is final
 *
 * After a seat's turn the other seat's "between turns" powers react to what
 * it did. After the last turn of a round, end-of-round powers fire on both
 * boards and the goal is scored on both sides' real counts.
 */

/**
 * What a seat did, as far as the other seat may see: the cats it drew from
 * its deck and the cat it tucked from its hand stay face down.
 */
export type Move =
  | { type: "play"; catId: string; row: Row; col: number }
  | { type: "hunt"; faces: Essence[]; discarded: string | null }
  | { type: "den"; targets: SlotRef[]; spent: Essence | null }
  | { type: "prowl"; tray: string[]; deck: number; payer: SlotRef | null }
  | { type: "reroll" }
  | { type: "resolve"; kind: Pending["kind"]; slot: SlotRef; took: boolean };

/** A move that is a seat's whole turn. */
export type TurnMove = Exclude<Move, { type: "reroll" | "resolve" }>;

export type DuelEvent =
  | (Exclude<TurnEvent, { type: "feeder" }> & { side: SideId })
  | { type: "move"; side: SideId; move: Move }
  | { type: "feeder"; faces: Essence[] }
  /** A relic paying out Treats because the feeder was rolled again. */
  | { type: "refill"; side: SideId; treats: number }
  | ({ type: "goal"; round: number } & GoalResult)
  | { type: "over"; won: boolean; player: number; rival: number };

export interface DuelResult {
  player: ScoreBreakdown;
  rival: ScoreBreakdown;
  won: boolean;
}

export interface DuelState extends Table {
  v: 2;
  seed: string;
  step: number;
  rivalId: string;
  /** How well the rival plays, 0 the least. The reducer never reads it. */
  level: number;
  sides: Record<SideId, Side>;
  /** Whose action is awaited. */
  active: SideId;
  /** Who takes the first turn of the current round. */
  lead: SideId;
  /** The last whole turn each seat took. */
  last: Record<SideId, TurnMove | null>;
  result: DuelResult | null;
}

export interface SeatConfig {
  /** Cat ids; shuffled here. Needs at least 8 cards. */
  deck: readonly string[];
  relics: readonly string[];
}

export interface DuelConfig {
  seed: string;
  rivalId: string;
  level: number;
  player: SeatConfig;
  rival: SeatConfig;
}

export interface DuelActionResult {
  state: DuelState;
  events: DuelEvent[];
}

function dealSeat(config: SeatConfig, rng: Rng): Side {
  const deck = rng.shuffle(config.deck);
  const setup = deck.splice(0, SETUP_CATS);
  const tray = deck.splice(0, TRAY_SIZE);
  return {
    relics: [...config.relics],
    mods: combineMods(config.relics),
    turnsLeft: 0,
    board: { hunt: [], den: [], prowl: [] },
    hand: [],
    deck,
    discard: [],
    tray,
    setup,
    essence: emptyPool(),
  };
}

export function createDuel(config: DuelConfig): DuelState {
  const rng = createRng(`${config.seed}:0`);
  return {
    v: 2,
    seed: config.seed,
    step: 0,
    rivalId: config.rivalId,
    level: config.level,
    phase: "setup",
    round: 0,
    feeder: rollDice(rng),
    goals: rng.shuffle(GOAL_IDS).slice(0, ROUND_TURNS.length),
    goalResults: [],
    // Each seat is dealt from its own stream, so one deck never moves the other.
    sides: {
      player: dealSeat(config.player, createRng(`${config.seed}:deal:player`)),
      rival: dealSeat(config.rival, createRng(`${config.seed}:deal:rival`)),
    },
    // The rival keeps first, so it cannot answer what the player keeps.
    active: "rival",
    lead: "player",
    last: { player: null, rival: null },
    queue: [],
    pending: null,
    result: null,
  };
}

/** The seat whose action is awaited. */
export function activeSide(state: DuelState): Side {
  return state.sides[state.active];
}

export function duelScore(state: DuelState, who: SideId): ScoreBreakdown {
  const side = state.sides[who];
  return scoreBoard(side.board, state.goalResults, side.relics, who);
}

/** A seat's count towards a goal: nothing, or what it has plus its relics'. */
function goalCount(side: Side, goalId: string): number {
  const base = getGoal(goalId).count(side);
  return base > 0 ? base + side.mods.goalBonus : 0;
}

/**
 * The current round's goal as it would score right now, each side's real
 * count against the other's. A side with nothing towards it scores nothing.
 */
export function duelStanding(state: DuelState): GoalResult | null {
  const goalId = state.goals[state.round];
  if (!goalId || state.phase === "over") return null;
  const player = goalCount(state.sides.player, goalId);
  const rival = goalCount(state.sides.rival, goalId);
  const win = GOAL_WIN_POINTS[state.round] ?? 0;
  const lose = GOAL_LOSE_POINTS[state.round] ?? 0;
  const split = Math.floor((win + lose) / 2);
  const points = (mine: number, theirs: number) =>
    mine === 0 ? 0 : mine > theirs ? win : mine < theirs ? lose : split;
  return {
    goalId,
    player,
    rival,
    playerPoints: points(player, rival),
    rivalPoints: points(rival, player),
  };
}

/** The rows a "between turns" power answers to, by what the old cards said. */
const REACTS_TO: Partial<Record<RivalAction | "any", TurnMove["type"]>> = {
  raid: "hunt",
  bank: "den",
  burn: "prowl",
};

/** True if a "between turns" power fires when the other seat makes `move`. */
export function reactsTo(on: RivalAction | "any", move: TurnMove["type"]) {
  return on === "any" || REACTS_TO[on] === move;
}

/** The public face of an action, read before it is applied. */
function moveOf(t: Table, side: Side, action: Action): Move | null {
  switch (action.type) {
    case "keep":
      return null;
    case "play":
      return {
        type: "play",
        catId: side.hand[action.hand] ?? "",
        row: action.row,
        col: side.board[action.row]?.length ?? 0,
      };
    case "hunt":
      return {
        type: "hunt",
        faces: action.dice.flatMap((die) => t.feeder[die] ?? []),
        discarded:
          action.trade === undefined ? null : (side.hand[action.trade] ?? null),
      };
    case "den":
      return {
        type: "den",
        targets: action.targets.map(({ row, col }) => ({ row, col })),
        spent: action.trade ?? null,
      };
    case "prowl":
      return {
        type: "prowl",
        tray: action.picks.flatMap((pick) =>
          pick === "deck" ? [] : (side.tray[pick] ?? []),
        ),
        deck: action.picks.filter((pick) => pick === "deck").length,
        payer: action.trade
          ? { row: action.trade.row, col: action.trade.col }
          : null,
      };
    case "reroll":
      return { type: "reroll" };
    case "resolve":
      return t.pending
        ? {
            type: "resolve",
            kind: t.pending.kind,
            slot: { ...t.pending.slot },
            took: action.choice !== null,
          }
        : null;
  }
}

/** A context for one seat of a duel; its events carry the seat's name. */
function seatCtx(
  s: DuelState,
  who: SideId,
  rng: Rng,
  events: DuelEvent[] | null,
): Ctx {
  return {
    t: s,
    side: s.sides[who],
    rng,
    emit: (event) => {
      if (!events) return;
      events.push(event.type === "feeder" ? event : { ...event, side: who });
    },
    // The seat that emptied the feeder is paid first.
    onRoll: () => {
      for (const id of [who, otherSide(who)]) {
        const treats = s.sides[id].mods.refillTreat;
        if (treats <= 0) continue;
        s.sides[id].essence.wild += treats;
        events?.push({ type: "refill", side: id, treats });
      }
    },
  };
}

function startRound(s: DuelState): void {
  for (const who of SIDES) {
    const side = s.sides[who];
    side.turnsLeft =
      (ROUND_TURNS[s.round] ?? 0) + (s.round === 0 ? side.mods.extraTurns : 0);
  }
  s.phase = "turn";
  s.active = s.sides[s.lead].turnsLeft > 0 ? s.lead : otherSide(s.lead);
}

function endDuelRound(s: DuelState, rng: Rng, events: DuelEvent[] | null) {
  // End-of-round powers, the round's leader first.
  for (const who of [s.lead, otherSide(s.lead)]) {
    fireTimed(
      seatCtx(s, who, rng, events),
      (cat) => cat.power?.timing === "roundEnd",
    );
  }
  const result = duelStanding(s);
  if (result) {
    s.goalResults.push(result);
    events?.push({ type: "goal", round: s.round, ...result });
  }

  s.round += 1;
  if (ROUND_TURNS[s.round] !== undefined) {
    s.lead = otherSide(s.lead);
    startRound(s);
    return;
  }
  const player = duelScore(s, "player");
  const rival = duelScore(s, "rival");
  s.phase = "over";
  s.result = { player, rival, won: player.total > rival.total };
  events?.push({
    type: "over",
    won: s.result.won,
    player: player.total,
    rival: rival.total,
  });
}

/**
 * Applies one action for the acting seat, in place. `applyDuel` is the safe
 * way in; this is for callers that own the state they pass, such as a bot
 * playing a position out. An illegal action throws and leaves the state
 * half changed. Pass `null` for `events` to skip collecting them.
 */
export function stepDuel(
  s: DuelState,
  action: Action,
  events: DuelEvent[] | null = null,
): void {
  if (s.phase === "over") fail("The match is over.");
  s.step += 1;
  const who = s.active;
  const rng = createRng(`${s.seed}:${s.step}`);
  const ctx = seatCtx(s, who, rng, events);

  if (s.phase === "setup") {
    if (action.type !== "keep") fail("Choose what to keep first.");
    keep(ctx, action);
    const other = otherSide(who);
    if (s.sides[other].setup.length > 0) s.active = other;
    else startRound(s);
    return;
  }

  const move = moveOf(s, ctx.side, action);
  if (s.phase === "pending") {
    if (action.type !== "resolve") fail("Answer the pending choice first.");
    if (move) events?.push({ type: "move", side: who, move });
    resolve(ctx, action.choice);
    drain(ctx);
  } else {
    if (action.type === "keep" || action.type === "resolve")
      fail("That action is not available right now.");
    if (move) events?.push({ type: "move", side: who, move });
    if (!takeTurn(ctx, action)) return;
    if (move && move.type !== "reroll" && move.type !== "resolve") {
      s.last[who] = move;
    }
  }
  if (s.pending) {
    s.phase = "pending";
    return;
  }
  s.phase = "turn";
  endTurn(ctx);

  // The other seat's cats that were watching for this.
  const other = otherSide(who);
  const done = s.last[who]?.type;
  if (done) {
    fireTimed(
      seatCtx(s, other, rng, events),
      (cat) => cat.power?.timing === "between" && reactsTo(cat.power.on, done),
    );
  }

  if (s.sides[other].turnsLeft > 0) s.active = other;
  else if (s.sides[who].turnsLeft <= 0) endDuelRound(s, rng, events);
}

export function applyDuel(state: DuelState, action: Action): DuelActionResult {
  const s = structuredClone(state);
  const events: DuelEvent[] = [];
  stepDuel(s, action, events);
  return { state: s, events };
}

/** The actions the acting seat has now. */
export function duelActions(state: DuelState): Action[] {
  return seatActions(state, activeSide(state));
}
