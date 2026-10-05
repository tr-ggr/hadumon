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

export interface MatchState {
  seed: string;
  step: number;
  rivalId: string;
  relics: string[];
  mods: Mods;
  phase: MatchPhase;
  round: number;
  turnsLeft: number;
  board: Board;
  hand: string[];
  deck: string[];
  discard: string[];
  tray: string[];
  /** The cats dealt at setup; empty once the player has kept. */
  setup: string[];
  essence: EssencePool;
  feeder: Essence[];
  /** One goal id per round. */
  goals: string[];
  goalResults: GoalResult[];
  rival: RivalState;
  /** Powers still to fire in the current activation. */
  queue: SlotRef[];
  pending: Pending | null;
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
  /** Indices into `feeder` of the dice to take. */
  | { type: "hunt"; dice: number[] }
  /** One entry per yarn laid; a slot may repeat. */
  | { type: "den"; targets: SlotRef[] }
  /** Each pick is a tray index or the top of the deck. */
  | { type: "prowl"; picks: ("deck" | number)[] }
  /** Free: reroll the feeder when every die shows the same face. */
  | { type: "reroll" }
  /** Answer a pending choice. `null` declines. */
  | { type: "resolve"; choice: number | null };

export type MatchEvent =
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
  /** A cat's essence handing over its treats at the end of a turn. */
  | { type: "aura"; catId: string; row: Row; col: number }
  | { type: "feeder"; faces: Essence[] }
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

interface Ctx {
  s: MatchState;
  rng: Rng;
  events: MatchEvent[];
}

export interface MatchConfig {
  seed: string;
  /** Cat ids; shuffled here. Needs at least 8 cards. */
  deck: readonly string[];
  relics: readonly string[];
  rivalId: string;
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
  return {
    seed: config.seed,
    step: 0,
    rivalId: config.rivalId,
    relics: [...config.relics],
    mods: combineMods(config.relics),
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
      yarn: 0,
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

/** One kind of essence, summed over the cats on the board. */
export function auraTotal(board: Board, kind: Aura["kind"]): number {
  return placedCats(board).reduce((sum, placed) => {
    const aura = getCat(placed.catId).aura;
    return aura?.kind === kind ? sum + aura.n : sum;
  }, 0);
}

/** How many dice, yarn or cats activating `row` gives right now. */
export function rowReward(state: MatchState, row: Row): number {
  const base = ROW_REWARD[row][state.board[row].length] ?? 0;
  const bonus = {
    hunt: state.mods.huntBonus,
    den: state.mods.denBonus,
    prowl: state.mods.prowlBonus,
  }[row];
  return base + bonus + auraTotal(state.board, "reward");
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

export function canPlay(state: MatchState, hand: number, row: Row): boolean {
  const catId = state.hand[hand];
  if (!catId) return false;
  const cat = getCat(catId);
  const line = state.board[row];
  return (
    cat.rows.includes(row) &&
    line.length < SLOTS &&
    swapOffer(
      state.essence,
      playCost(catId, auraTotal(state.board, "discount")),
    ) !== null &&
    totalYarn(state.board) >= columnYarnCost(state.mods, line.length)
  );
}

export function canReroll(state: MatchState): boolean {
  const first = state.feeder[0];
  return (
    state.phase === "turn" &&
    first !== undefined &&
    state.feeder.every((face) => face === first)
  );
}

/** Where `n` yarn goes when the player does not choose: board order, to capacity. */
export function autoYarnTargets(state: MatchState, n: number): SlotRef[] {
  const targets: SlotRef[] = [];
  for (const row of ROWS) {
    state.board[row].forEach((placed, col) => {
      let room = getCat(placed.catId).yarnCap - placed.yarn;
      while (room > 0 && targets.length < n) {
        targets.push({ row, col });
        room -= 1;
      }
    });
  }
  return targets;
}

/** How many cats a Prowl must pick right now. */
export function prowlPickCount(state: MatchState): number {
  const available =
    state.tray.length + state.deck.length + state.discard.length;
  return Math.min(rowReward(state, "prowl"), available);
}

export function rivalBankValue(state: MatchState): number {
  return Math.max(
    1,
    getRival(state.rivalId).bankPoints + state.mods.rivalBankDelta,
  );
}

export function playerScore(state: MatchState): ScoreBreakdown {
  const placed = placedCats(state.board);
  const cats = placed.reduce((sum, p) => sum + getCat(p.catId).points, 0);
  const yarn = placed.reduce((sum, p) => sum + p.yarn, 0);
  const cached = placed.reduce((sum, p) => sum + p.cached, 0);
  const tucked = placed.reduce((sum, p) => sum + p.tucked, 0);
  const goals = state.goalResults.reduce((sum, g) => sum + g.playerPoints, 0);
  const relics = state.relics.reduce(
    (sum, id) => sum + relicScore(id, state.board),
    0,
  );
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
  const { s } = ctx;
  if (s.deck.length === 0) {
    if (s.discard.length === 0) return null;
    s.deck = ctx.rng.shuffle(s.discard);
    s.discard = [];
  }
  return s.deck.shift() ?? null;
}

function refillTray(ctx: Ctx): void {
  while (ctx.s.tray.length < TRAY_SIZE) {
    const card = drawCard(ctx);
    if (card === null) return;
    ctx.s.tray.push(card);
  }
}

function rollFeeder(ctx: Ctx): void {
  ctx.s.feeder = rollDice(ctx.rng);
  ctx.events.push({ type: "feeder", faces: [...ctx.s.feeder] });
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
 * Runs one power. Choice effects open a pending choice during the player's
 * own turn and are skipped anywhere else (no catalogue cat pairs them with a
 * between-turns or end-of-round timing).
 */
function firePower(
  ctx: Ctx,
  slot: SlotRef,
  effect: Effect,
  allowChoice: boolean,
): void {
  const { s } = ctx;
  const placed = s.board[slot.row][slot.col];
  if (!placed) return;
  const cat = getCat(placed.catId);
  ctx.events.push({
    type: "power",
    catId: cat.id,
    row: slot.row,
    col: slot.col,
    effect: effect.kind,
  });

  switch (effect.kind) {
    case "essence":
      s.essence[effect.element] += effect.n;
      return;
    case "wild":
      s.essence.wild += effect.n;
      return;
    case "yarnSelf":
      addYarn(placed, effect.n);
      return;
    case "yarnRow":
      for (const other of s.board[slot.row]) addYarn(other, effect.n);
      return;
    case "draw":
      for (let i = 0; i < effect.n; i++) {
        const card = drawCard(ctx);
        if (card !== null) s.hand.push(card);
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
      else s.discard.push(card);
      return;
    }
    case "tuckHand":
      if (allowChoice && s.hand.length > 0) {
        s.pending = { kind: "tuckHand", slot, draw: effect.draw };
      }
      return;
    case "trade":
      if (allowChoice && placed.yarn > 0) {
        s.pending = { kind: "trade", slot };
      }
      return;
    case "encore":
      // Queued behind what is still to fire, so the row finishes its first
      // pass before the second. Another encore is left out, or two would
      // set each other off for ever.
      for (let col = s.board[slot.row].length - 1; col >= 0; col--) {
        const other = s.board[slot.row][col];
        const power = other ? getCat(other.catId).power : null;
        if (
          col !== slot.col &&
          power?.timing === "activated" &&
          power.effect.kind !== "encore"
        ) {
          s.queue.push({ row: slot.row, col });
        }
      }
      return;
  }
}

function fireTimed(
  ctx: Ctx,
  matches: (cat: ReturnType<typeof getCat>) => boolean,
): void {
  for (const row of ROWS) {
    ctx.s.board[row].forEach((placed, col) => {
      const cat = getCat(placed.catId);
      if (cat.power && matches(cat)) {
        firePower(ctx, { row, col }, cat.power.effect, false);
      }
    });
  }
}

function drain(ctx: Ctx): void {
  const { s } = ctx;
  while (!s.pending) {
    const slot = s.queue.shift();
    if (!slot) return;
    const placed = s.board[slot.row][slot.col];
    const power = placed ? getCat(placed.catId).power : null;
    if (power) firePower(ctx, slot, power.effect, true);
  }
}

/* --------------------------------------------------------- turn pieces */

function keep(ctx: Ctx, action: Extract<Action, { type: "keep" }>): void {
  const { s } = ctx;
  if (!isIndexList(action.cats, s.setup.length))
    fail("Those are not cats you were dealt.");
  const essenceOk =
    new Set(action.essence).size === action.essence.length &&
    action.essence.every((e) => (ELEMENTS as readonly string[]).includes(e));
  if (!essenceOk) fail("Keep at most one of each food.");
  if (action.cats.length + action.essence.length !== SETUP_KEEP) {
    fail(`Keep exactly ${SETUP_KEEP} cats and food in total.`);
  }

  s.setup.forEach((catId, i) => {
    (action.cats.includes(i) ? s.hand : s.discard).push(catId);
  });
  s.setup = [];
  for (const element of action.essence) s.essence[element] += 1;
  s.essence.wild += s.mods.startWild;
  s.phase = "turn";
  s.round = 0;
  s.turnsLeft = ROUND_TURNS[0] + s.mods.extraTurns;
  ctx.events.push({
    type: "kept",
    cats: action.cats.length,
    essence: action.essence.length,
  });
}

function activate(ctx: Ctx, row: Row, reward: number): void {
  const { s } = ctx;
  ctx.events.push({ type: "activated", row, reward });
  for (let col = s.board[row].length - 1; col >= 0; col--) {
    const placed = s.board[row][col];
    if (placed && getCat(placed.catId).power?.timing === "activated") {
      s.queue.push({ row, col });
    }
  }
}

function play(ctx: Ctx, action: Extract<Action, { type: "play" }>): void {
  const { s } = ctx;
  const catId = s.hand[action.hand];
  if (!catId) fail("That cat is not in your hand.");
  if (!ROWS.includes(action.row)) fail("That is not a row.");
  const cat = getCat(catId);
  const line = s.board[action.row];
  if (!cat.rows.includes(action.row))
    fail(`${cat.name} cannot live in that row.`);
  if (line.length >= SLOTS) fail("That row is full.");
  const discount = auraTotal(s.board, "discount");
  const offer = swapOffer(s.essence, playCost(catId, discount));
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
  const paid = playPayment(s.essence, s.hand, action.hand, swap, discount);
  if (!paid) fail(`Give up only food ${cat.name} does not need.`);
  const col = line.length;
  const yarn = columnYarnCost(s.mods, col);
  if (totalYarn(s.board) < yarn) fail(`That column costs ${yarn} yarn.`);

  s.essence = paid;
  spendYarn(s.board, yarn);
  s.hand.splice(action.hand, 1);
  line.push({ catId, yarn: 0, cached: 0, tucked: 0, under: [] });
  ctx.events.push({ type: "played", catId, row: action.row, col });
  if (cat.power?.timing === "played") s.queue.push({ row: action.row, col });
}

function hunt(ctx: Ctx, action: Extract<Action, { type: "hunt" }>): void {
  const { s } = ctx;
  const reward = rowReward(s, "hunt");
  const take = Math.min(reward, s.feeder.length);
  if (
    !isIndexList(action.dice, s.feeder.length) ||
    action.dice.length !== take
  ) {
    fail(`Take exactly ${take} dice from the feeder.`);
  }
  for (const index of [...action.dice].sort((a, b) => b - a)) {
    const [face] = s.feeder.splice(index, 1);
    if (face) s.essence[face] += 1;
  }
  if (s.feeder.length === 0) rollFeeder(ctx);
  activate(ctx, "hunt", reward);
}

function den(ctx: Ctx, action: Extract<Action, { type: "den" }>): void {
  const { s } = ctx;
  const reward = rowReward(s, "den");
  if (action.targets.length > reward) fail(`The Den lays ${reward} yarn.`);
  for (const target of action.targets) {
    const placed = ROWS.includes(target.row)
      ? s.board[target.row][target.col]
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
  const { s } = ctx;
  const reward = rowReward(s, "prowl");
  const want = prowlPickCount(s);
  const trayPicks = action.picks.filter((p): p is number => p !== "deck");
  const deckPicks = action.picks.length - trayPicks.length;
  if (
    action.picks.length !== want ||
    !isIndexList(trayPicks, s.tray.length) ||
    deckPicks > s.deck.length + s.discard.length
  ) {
    fail(`Pick exactly ${want} cats from the tray or the deck.`);
  }
  for (const index of [...trayPicks].sort((a, b) => b - a)) {
    const [card] = s.tray.splice(index, 1);
    if (card) s.hand.push(card);
  }
  for (let i = 0; i < deckPicks; i++) {
    const card = drawCard(ctx);
    if (card !== null) s.hand.push(card);
  }
  activate(ctx, "prowl", reward);
}

function resolve(ctx: Ctx, choice: number | null): void {
  const { s } = ctx;
  const pending = s.pending;
  if (!pending) fail("Nothing is waiting on a choice.");
  const placed = s.board[pending.slot.row][pending.slot.col];
  s.pending = null;
  if (choice === null || !placed) return;

  if (pending.kind === "tuckHand") {
    if (!isIndexList([choice], s.hand.length))
      fail("That cat is not in your hand.");
    const [card] = s.hand.splice(choice, 1);
    if (card) tuck(placed, card);
    for (let i = 0; i < pending.draw; i++) {
      const card = drawCard(ctx);
      if (card !== null) s.hand.push(card);
    }
    return;
  }
  if (choice !== 1) fail("Answer 1 to trade, or decline.");
  if (placed.yarn > 0) {
    placed.yarn -= 1;
    s.essence.wild += 1;
  }
}

function rivalTurn(ctx: Ctx): void {
  const { s } = ctx;
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
  ctx.events.push({ type: "rival", action: card, removed });
  if (s.feeder.length === 0) rollFeeder(ctx);
  refillTray(ctx);

  fireTimed(
    ctx,
    (cat) =>
      cat.power?.timing === "between" &&
      (cat.power.on === "any" || cat.power.on === card),
  );
}

function endRound(ctx: Ctx): void {
  const { s } = ctx;
  fireTimed(ctx, (cat) => cat.power?.timing === "roundEnd");

  const result = goalStanding(s);
  if (result) {
    s.goalResults.push(result);
    s.rival.goalPoints += result.rivalPoints;
    ctx.events.push({ type: "goal", round: s.round, ...result });
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
  ctx.events.push({
    type: "over",
    won: s.result.won,
    player: player.total,
    rival,
  });
}

/** The essences that pay out at the end of each of the player's turns. */
function fireAuras(ctx: Ctx): void {
  const { s } = ctx;
  for (const row of ROWS) {
    s.board[row].forEach((placed, col) => {
      const aura = getCat(placed.catId).aura;
      if (aura?.kind !== "treat") return;
      s.essence.wild += aura.n;
      ctx.events.push({ type: "aura", catId: placed.catId, row, col });
    });
  }
}

/** Finishes the action: fire queued powers, then hand the turn to the rival. */
function settle(ctx: Ctx): void {
  const { s } = ctx;
  drain(ctx);
  if (s.pending) {
    s.phase = "pending";
    return;
  }
  s.phase = "turn";
  fireAuras(ctx);
  refillTray(ctx);
  s.turnsLeft -= 1;
  rivalTurn(ctx);
  if (s.turnsLeft <= 0) endRound(ctx);
}

export function applyAction(state: MatchState, action: Action): ActionResult {
  const s = structuredClone(state);
  s.step += 1;
  const ctx: Ctx = { s, rng: createRng(`${s.seed}:${s.step}`), events: [] };

  if (s.phase === "over") fail("The match is over.");
  if (s.phase === "setup") {
    if (action.type !== "keep") fail("Choose what to keep first.");
    keep(ctx, action);
    return { state: s, events: ctx.events };
  }
  if (s.phase === "pending") {
    if (action.type !== "resolve") fail("Answer the pending choice first.");
    resolve(ctx, action.choice);
    settle(ctx);
    return { state: s, events: ctx.events };
  }

  switch (action.type) {
    case "reroll":
      if (!canReroll(s))
        fail("Reroll only when every die shows the same face.");
      rollFeeder(ctx);
      return { state: s, events: ctx.events };
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
  settle(ctx);
  return { state: s, events: ctx.events };
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
 * The actions available now. Complete for every action type except Den, which
 * is listed once with automatic yarn placement; any placement that respects
 * capacity is also legal. A play that is short is listed once with the
 * default swap; any other spare essence may be given up instead.
 */
export function legalActions(state: MatchState): Action[] {
  if (state.phase === "over") return [];

  if (state.phase === "setup") {
    const cats = state.setup.length;
    return combinations(cats + ELEMENTS.length, SETUP_KEEP).map((combo) => ({
      type: "keep",
      cats: combo.filter((i) => i < cats),
      essence: combo
        .filter((i) => i >= cats)
        .map((i) => ELEMENTS[i - cats])
        .filter((e): e is Element => e !== undefined),
    }));
  }

  if (state.phase === "pending") {
    const pending = state.pending;
    if (!pending) return [];
    const choices: (number | null)[] =
      pending.kind === "trade" ? [null, 1] : [null, ...state.hand.keys()];
    return choices.map((choice) => ({ type: "resolve", choice }));
  }

  const actions: Action[] = [];
  if (canReroll(state)) actions.push({ type: "reroll" });

  const seen = new Set<string>();
  state.hand.forEach((catId, hand) => {
    if (seen.has(catId)) return;
    seen.add(catId);
    const swap = defaultSwap(
      state.essence,
      state.hand,
      hand,
      auraTotal(state.board, "discount"),
    );
    for (const row of ROWS) {
      if (!canPlay(state, hand, row)) continue;
      actions.push(
        swap.length > 0
          ? { type: "play", hand, row, swap }
          : { type: "play", hand, row },
      );
    }
  });

  const take = Math.min(rowReward(state, "hunt"), state.feeder.length);
  for (const dice of combinations(state.feeder.length, take)) {
    actions.push({ type: "hunt", dice });
  }

  actions.push({
    type: "den",
    targets: autoYarnTargets(state, rowReward(state, "den")),
  });

  const want = prowlPickCount(state);
  const deckAvailable = state.deck.length + state.discard.length;
  for (
    let fromTray = 0;
    fromTray <= Math.min(want, state.tray.length);
    fromTray++
  ) {
    const fromDeck = want - fromTray;
    if (fromDeck > deckAvailable) continue;
    for (const combo of combinations(state.tray.length, fromTray)) {
      actions.push({
        type: "prowl",
        picks: [
          ...combo,
          ...Array.from({ length: fromDeck }, () => "deck" as const),
        ],
      });
    }
  }
  return actions;
}
