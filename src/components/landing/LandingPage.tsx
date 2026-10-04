import Link from "next/link";
import type { ReactNode } from "react";

import { CatCard } from "~/components/cats/CatCard";
import { PixelSprite } from "~/components/PixelSprite";
import { ButtonLink } from "~/components/ui";
import { CAT_LIST, RIVAL_ACTIONS, type RivalAction } from "~/server/game/cats";
import { ELEMENTS } from "~/server/game/elements";
import { ROUND_TURNS, SLOTS } from "~/server/game/match";
import { getRelic, RELIC_LIST } from "~/server/game/relics";
import { GAUNTLET, getRival, type Rival } from "~/server/game/rival";
import { CLAN_LIST, REWARD_CATS, starterDeck } from "~/server/game/run";
import { HuntDemo } from "./HuntDemo";

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

function word(n: number, capital = false): string {
  const text = WORDS[n] ?? String(n);
  return capital ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

const TURNS = ROUND_TURNS.reduce<number>((sum, turns) => sum + turns, 0);
const FIRST_CLAN = CLAN_LIST[0];
/** An example of what a win offers; real offers are drawn from your unlocks. */
const EXAMPLE_OFFER = ["mistpaw", "burrfang", "gloomtail"].slice(
  0,
  REWARD_CATS,
);
/** The first clan's own relic, then two a win could offer. */
const EXAMPLE_RELICS = [
  FIRST_CLAN?.relicId ?? "ember-charm",
  "ball-of-twine",
  "soft-landing",
];

const CARD_NAMES: Record<RivalAction, string> = {
  bank: "Bank",
  stash: "Stash",
  raid: "Raid",
  burn: "Burn",
  push: "Push",
};

function cardRules(rival: Rival): Record<RivalAction, string> {
  return {
    bank: `Banks a cat worth ${rival.bankPoints}`,
    stash: `Stashes ${rival.stashYarn} yarn`,
    raid: `Takes ${rival.raidDice} ${rival.raidDice === 1 ? "die" : "dice"} from the feeder`,
    burn: `Discards ${rival.burnCards} of your tray cards`,
    push: "Adds 1 to its side of the round goal",
  };
}

/** The rival's ten-card deck: how many of each card, and what one does. */
function RivalDeck({ rival }: { rival: Rival }) {
  const rules = cardRules(rival);
  const kinds = RIVAL_ACTIONS.filter((action) => rival.deck.includes(action));
  return (
    <dl className="text-ink grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-sm">
      {kinds.map((action) => (
        <div key={action} className="contents">
          <dt className="border-ink border-2 bg-white px-1.5 text-xs leading-5 font-black tabular-nums">
            {rival.deck.filter((card) => card === action).length}×{" "}
            {CARD_NAMES[action]}
          </dt>
          <dd>{rules[action]}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One step of the ladder: a marker on the track and its content beside it. */
function Step({
  marker,
  last = false,
  children,
}: {
  marker: ReactNode;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="group grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-x-6">
      <div className="flex flex-col items-center">
        {marker}
        {last ? null : <span className="bg-ink w-0.5 flex-1" aria-hidden />}
      </div>
      <div className={last ? "min-w-0" : "min-w-0 pb-10 sm:pb-14"}>
        {children}
      </div>
    </li>
  );
}

/** Coral while the rival stands; lime once the visitor has beaten its round. */
function RivalMarker({ n, boss }: { n: number; boss: boolean }) {
  return (
    <span
      className={`text-pixel border-ink bg-coral text-ink group-has-[[data-won=true]]:bg-lime grid shrink-0 place-items-center border-2 tabular-nums transition-colors duration-700 ${boss ? "h-10 w-10 text-2xl sm:h-14 sm:w-14 sm:text-4xl" : "h-8 w-8 text-lg sm:h-10 sm:w-10 sm:text-xl"}`}
    >
      {n}
    </span>
  );
}

function GainMarker() {
  return (
    <span
      className="border-ink bg-lime grid h-6 w-6 shrink-0 place-items-center border-2"
      aria-hidden
    >
      <svg
        viewBox="0 0 5 5"
        width="10"
        height="10"
        shapeRendering="crispEdges"
        className="fill-ink"
      >
        <rect x="2" y="0" width="1" height="5" />
        <rect x="0" y="2" width="5" height="1" />
      </svg>
    </span>
  );
}

/** Sits on its own line under the name, so both bosses set it the same way. */
function BossTag() {
  return (
    <p className="text-pixel border-ink bg-coral text-ink mt-2 inline-block border-2 px-2 text-sm leading-6 sm:text-base sm:leading-7">
      Boss
    </p>
  );
}

/** A rival as a piece on the table: who it is on the left, its deck on the right. */
function RivalRung({
  index,
  last = false,
  children,
}: {
  index: number;
  last?: boolean;
  children?: ReactNode;
}) {
  const rival = getRival(GAUNTLET[index] ?? "");
  return (
    <Step marker={<RivalMarker n={index + 1} boss={rival.boss} />} last={last}>
      <article className="border-ink bg-cream grid gap-x-8 gap-y-4 border-2 p-3 sm:p-5 md:grid-cols-2">
        <div className="min-w-0">
          <h2
            className={`text-pixel text-ink ${rival.boss ? "text-4xl sm:text-6xl" : "text-2xl sm:text-3xl"}`}
          >
            {rival.name}
          </h2>
          {rival.boss ? <BossTag /> : null}
          <p className="text-ink-soft mt-2 text-base sm:text-lg">
            {rival.flavor}
          </p>
          {rival.trait ? (
            <p className="text-ink mt-2 text-base font-bold">{rival.trait}</p>
          ) : null}
        </div>
        <RivalDeck rival={rival} />
      </article>
      {children ? <div className="mt-6">{children}</div> : null}
    </Step>
  );
}

function Gain({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Step marker={<GainMarker />}>
      <h2 className="text-pixel text-ink text-xl sm:text-2xl">{title}</h2>
      <div className="mt-3">{children}</div>
    </Step>
  );
}

/**
 * The public page at `/` for signed-out visitors: the six rivals of a run as
 * a ladder, with the first one playable. Every number is read from the game.
 */
export function LandingPage() {
  const rivals = GAUNTLET.length;
  const deckSize = starterDeck(FIRST_CLAN?.id ?? "flame").length;
  const first = getRival(GAUNTLET[0] ?? "");

  return (
    <div className="bg-cream text-ink min-h-dvh">
      <header className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-pixel text-ink text-2xl">
          Hadu<span className="text-coral">Mon</span>
        </Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          <ButtonLink href="/login" variant="secondary" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" variant="secondary" size="sm">
            Sign up
          </ButtonLink>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1080px] px-4 pb-20 sm:px-6">
        <div className="pt-2 pb-6 sm:pt-8 sm:pb-12">
          <h1 className="text-pixel text-ink text-4xl text-balance sm:text-7xl">
            {word(rivals, true)} rivals. {word(TURNS, true)} turns each.
          </h1>
          <p className="text-ink mt-3 max-w-[62ch] text-base sm:mt-4 sm:text-xl">
            HaduMon is a roguelike engine-builder about cats. Play cats into
            three rows. Activate a row and every power in it fires, right to
            left. Outscore the rival after {word(TURNS)} turns or the run ends
            there.
          </p>
        </div>

        <ol>
          <Step marker={<RivalMarker n={1} boss={first.boss} />}>
            <h2 className="text-pixel text-ink text-2xl sm:text-3xl">
              {first.name}
            </h2>
            <p className="text-ink-soft mt-2 mb-4 text-base sm:text-lg">
              {first.flavor}
            </p>
            <HuntDemo />
            <div className="border-ink bg-cream mt-6 grid gap-x-8 gap-y-3 border-2 p-3 sm:p-5 md:grid-cols-2">
              <p className="text-ink text-base">
                {first.name} plays from a deck of {first.deck.length} cards and
                flips one after each of your turns. You can always see what is
                left in it.
              </p>
              <RivalDeck rival={first} />
            </div>
          </Step>

          <Gain title="Win, and a cat joins your deck">
            <p className="text-ink max-w-prose text-base">
              You start with a clan&apos;s {deckSize} cards. After every win you
              are offered {word(REWARD_CATS)} cats and may keep one, or none: a
              smaller deck finds its best cats more often.
            </p>
            <p className="text-ink-soft mt-4 text-sm font-bold">
              An example offer
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {EXAMPLE_OFFER.map((catId) => (
                <li key={catId}>
                  <CatCard catId={catId} className="h-full" />
                </li>
              ))}
            </ul>
            <p className="text-ink-soft mt-5 text-sm font-bold">
              All {CAT_LIST.length} cats, across {word(ELEMENTS.length)}{" "}
              elements. Each one does exactly what its card says.
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-1 gap-y-2">
              {ELEMENTS.flatMap((element) =>
                CAT_LIST.filter((cat) => cat.element === element),
              ).map((cat) => (
                <li key={cat.id}>
                  <PixelSprite catId={cat.id} size={48} label={cat.name} />
                </li>
              ))}
            </ul>
          </Gain>

          <RivalRung index={1} />
          <RivalRung index={2} />

          <Gain title="Every other win, a relic too">
            <p className="text-ink max-w-prose text-base">
              A relic changes one rule or adds points for the rest of the run.
              Your clan gives you the first.
            </p>
            <p className="text-ink-soft mt-4 text-sm font-bold">
              Three of the {RELIC_LIST.length} relics. The first is the{" "}
              {FIRST_CLAN?.name}&apos;s own.
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {EXAMPLE_RELICS.map((id) => {
                const relic = getRelic(id);
                return (
                  <li
                    key={id}
                    className="border-ink bg-cream text-ink border-2 p-3"
                  >
                    <p className="text-pixel text-base">{relic.name}</p>
                    <p className="mt-1 text-sm leading-snug">{relic.text}</p>
                  </li>
                );
              })}
            </ul>
          </Gain>

          <RivalRung index={3} />
          <RivalRung index={4} />

          <Gain title="The board resets. The deck does not">
            <p className="text-ink max-w-prose text-base">
              Every match starts from {word(SLOTS * 3)} empty slots. Your deck
              and relics carry through all {word(rivals)} rivals. Lose once and
              the run is over; what it unlocked for the next one is yours to
              keep.
            </p>
          </Gain>

          <RivalRung index={5} last>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ButtonLink href="/signup" size="lg">
                Start a run
              </ButtonLink>
              <p className="text-ink max-w-prose text-base">
                Free. There is no currency, no shop and nothing to install.
              </p>
            </div>
          </RivalRung>
        </ol>
      </main>

      <footer className="border-ink/10 border-t">
        <div className="text-ink-soft mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm sm:px-6">
          <p>HaduMon. Small cats, short matches.</p>
          <Link href="/login" className="text-cobalt-dark font-bold underline">
            Log in
          </Link>
        </div>
      </footer>
    </div>
  );
}
