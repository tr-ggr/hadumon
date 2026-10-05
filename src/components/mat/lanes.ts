import type { IconName } from "~/components/sprites/icons";
import { plural } from "~/components/run/describe";
import type { Row } from "~/server/game/cats";
import { ROW_REWARD } from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

/** A lane's trade spot: one of something paid, for one more of what the lane gives. */
export interface LaneTrade {
  pay: IconName;
  gain: IconName;
  /** The trade as the rest of a sentence: "spend 1 food for 1 more yarn". */
  text: string;
}

export interface Lane {
  /** The thing the lane's reward is counted in. */
  unit: IconName;
  one: string;
  many: string;
  /** The key that activates the lane. */
  key: string;
  /** What activating the lane says it gives, for a count. */
  gives: (n: number) => string;
  /** Where that comes from or goes, printed under it. */
  sub: string;
  /** What the lane's reward is, in a sentence that takes two counts. */
  pays: (empty: string, full: string) => string;
  trade: LaneTrade;
}

/** The three lanes of a mat, as every mat in the app prints them. */
export const LANES: Record<Row, Lane> = {
  hunt: {
    unit: "die",
    one: "die",
    many: "dice",
    key: "H",
    gives: (n) => `Take ${plural(n, "die", "dice")}`,
    sub: "from the feeder",
    pays: (empty, full) =>
      `takes food from the feeder: ${empty} from an empty row, ${full} from a full one. Food is what cats cost.`,
    trade: {
      pay: "card",
      gain: "die",
      text: "discard 1 cat from your hand for 1 more die",
    },
  },
  den: {
    unit: "yarn",
    one: "yarn",
    many: "yarn",
    key: "D",
    gives: (n) => `Lay ${n} yarn`,
    sub: "on your cats",
    pays: (empty, full) =>
      `lays yarn on your cats: ${empty} from an empty row, ${full} from a full one. Each yarn is a point, and yarn pays for a row's later spaces.`,
    trade: {
      pay: "any",
      gain: "yarn",
      text: "spend 1 food for 1 more yarn",
    },
  },
  prowl: {
    unit: "card",
    one: "cat",
    many: "cats",
    key: "P",
    gives: (n) => `Draw ${plural(n, "cat")}`,
    sub: "into your hand",
    pays: (empty, full) =>
      `draws cats into your hand: ${empty} from an empty row, ${full} from a full one. Those are the cats you play into rows.`,
    trade: {
      pay: "yarn",
      gain: "card",
      text: "spend 1 yarn from a cat for 1 more cat",
    },
  },
};

/**
 * What activating the lane gives with 0 to 4 cats in it: the engine's ladder
 * plus whatever the run's relics add right now.
 */
export function rewardLadder(match: MatchView, row: Row): number[] {
  const ladder = ROW_REWARD[row];
  const bonus = match.rewards[row] - (ladder[match.board[row].length] ?? 0);
  return ladder.map((base) => base + bonus);
}
