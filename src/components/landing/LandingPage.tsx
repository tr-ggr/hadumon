import Link from "next/link";
import type { CSSProperties } from "react";

import { Nameplate, TableLink, TurnCube } from "~/components/run/pieces";
import { CAT_LIST, ROWS } from "~/server/game/cats";
import { ELEMENT_LABELS, ELEMENTS } from "~/server/game/elements";
import { ROUND_TURNS, SLOTS } from "~/server/game/match";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { DECK_SIZE, STOLEN } from "~/server/game/deck";
import { REWARD_RECLAIM } from "~/server/game/run";

import { CastShowcase } from "./CastShowcase";
import { CornerCats, CrowdCat, HeroCrowd, MarginCrowd } from "./Crowd";
import { HuntDemo } from "./HuntDemo";
import { LaneShowcase } from "./LaneShowcase";
import { RivalFan } from "./RivalFan";
import { StageFrame } from "./StageFrame";
import { word } from "./words";

/** "Flame, Mist, Volt, Thorn and Shade". */
function listWords(words: readonly string[]): string {
  if (words.length < 2) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

const TURNS = ROUND_TURNS.reduce<number>((sum, turns) => sum + turns, 0);

const HEADING = "text-print text-3xl text-balance sm:text-[40px]";
const COPY = "max-w-[58ch] text-base sm:text-lg";
const PANEL = "fold px-4 py-10 sm:px-10 sm:py-14";

/**
 * The public page at `/` for signed-out visitors, laid out like the front of
 * the game's box: a title plaque on a framed stage that plays one real round,
 * then one board folded into three panels (the cats, the rows, the rivals).
 * It is a tabletop like the run route, and every number is read from the game.
 */
export function LandingPage() {
  const rivals = GAUNTLET.length;
  const bosses = GAUNTLET.filter((id) => getRival(id).boss).length;
  const first = getRival(GAUNTLET[0] ?? "");

  return (
    // Laid straight on the app's cloth and not through `TableSurface`, which
    // also carries the signed-in ways off a run's table.
    <div className="landing text-ink flex min-h-dvh min-w-0 flex-col">
      <header className="lid on-ink bg-ink text-cream">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-3 pt-1 pb-2 sm:px-5">
          <p className="text-xs font-bold sm:text-sm">
            Free. <span className="max-sm:hidden">Nothing to install. </span>
            Nothing for sale.
          </p>
          <nav aria-label="Account" className="flex shrink-0 gap-2.5">
            <TableLink href="/login" size="sm">
              Log in
            </TableLink>
            <TableLink href="/signup" size="sm" variant="primary">
              Sign up
            </TableLink>
          </nav>
        </div>
      </header>

      <main>
        <section
          aria-label="HaduMon"
          className="sky-band hero-mat relative z-10 px-2 pt-20 sm:px-4 lg:pt-[5.25rem]"
        >
          <div className="flex flex-col items-center">
            <div className="relative z-20 -mb-6 flex flex-col items-center">
              <div className="relative">
                <CrowdCat
                  catId="hadu"
                  size={64}
                  wave={1}
                  cast={false}
                  className="right-4 bottom-full sm:right-7"
                  spriteClassName="lg:h-20 lg:w-20"
                />
                <p
                  className="piece border-ink bg-cream wordmark border-2 px-5 pt-2 pb-5 sm:px-9 sm:pt-2.5 sm:pb-6"
                  style={{ "--e": "5px" } as CSSProperties}
                >
                  Hadu<span className="text-coral">Mon</span>
                </p>
              </div>
              <h1
                className="piece border-ink bg-lime text-print relative z-10 -mt-3 border-2 px-4 py-2 text-center text-3xl sm:px-6 sm:py-2.5 sm:text-[40px]"
                style={{ "--e": "3px" } as CSSProperties}
              >
                {word(rivals, true)} rivals. <br className="sm:hidden" />
                {word(TURNS, true)} turns each.
              </h1>
            </div>

            <StageFrame className="hero-stage -mb-12" crowd={<HeroCrowd />}>
              <HuntDemo />
            </StageFrame>
          </div>
        </section>

        <div className="px-2 pt-5 pb-16 sm:px-4 sm:pb-24">
          <div className="relative mx-auto max-w-[1040px]">
            <MarginCrowd />
            <div className="board relative">
              <div className="fold flex flex-col gap-5 px-4 pt-16 pb-5 sm:px-10 sm:pb-6 md:flex-row md:items-center md:justify-between md:gap-10">
                <p className="max-w-[62ch] text-base sm:text-xl">
                  HaduMon is a roguelike engine-builder about cats. Play cats
                  into three rows. Activate a row and every power in it fires,
                  right to left. Outscore the rival after {word(TURNS)} turns or
                  the run ends there.
                </p>
                <TableLink
                  href="/signup"
                  variant="primary"
                  size="lg"
                  className="shrink-0"
                >
                  Start a run
                </TableLink>
              </div>

              <section aria-labelledby="landing-cats" className={PANEL}>
                <CastShowcase>
                  <h2 id="landing-cats" className={HEADING}>
                    {CAT_LIST.length} cats. {word(ELEMENTS.length, true)}{" "}
                    elements.
                  </h2>
                  <p className={`${COPY} mt-4`}>
                    {listWords(ELEMENTS.map((id) => ELEMENT_LABELS[id]))}, each
                    with the cat food its cats cost. A card says what a cat
                    costs, what it scores and what it does, and each one does
                    exactly what its card says. Pick any cat to read its card.
                  </p>
                </CastShowcase>
              </section>

              <section aria-labelledby="landing-rows" className={PANEL}>
                <div className="grid items-center gap-x-10 gap-y-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                  <div>
                    <h2 id="landing-rows" className={HEADING}>
                      {word(ROWS.length, true)} rows. One action a turn.
                    </h2>
                    <p className={`${COPY} mt-4`}>
                      Play a cat into a row, or activate a row. Either way it is
                      your whole turn.
                    </p>
                    <p className={`${COPY} mt-3`}>
                      Activating a row pays its reward, which grows with the
                      cats in it. Then every power in the row fires, right to
                      left. Nothing attacks anything.
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <p className="text-sm font-bold">
                        {word(ROUND_TURNS.length, true)} rounds of{" "}
                        {listWords(ROUND_TURNS.map((turns) => word(turns)))}{" "}
                        turns.
                      </p>
                      <p className="flex items-center gap-3 pb-1" aria-hidden>
                        {ROUND_TURNS.map((turns, round) => (
                          <span key={round} className="flex gap-1">
                            {Array.from({ length: turns }, (_, i) => (
                              <TurnCube key={i} spent={false} />
                            ))}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                  <StageFrame
                    className="max-lg:mt-10"
                    crowd={
                      <CrowdCat
                        catId="sparkmew"
                        size={64}
                        order={4}
                        cast={false}
                        className="bottom-full left-5"
                      />
                    }
                  >
                    <LaneShowcase />
                  </StageFrame>
                </div>
              </section>

              <section aria-labelledby="landing-rivals" className={PANEL}>
                <div className="grid items-center gap-x-10 gap-y-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                  <div className="lg:col-start-2 lg:row-start-1">
                    <h2 id="landing-rivals" className={HEADING}>
                      {word(rivals, true)} rivals. {word(bosses, true)} bosses.
                    </h2>
                    <p className={`${COPY} mt-4`}>
                      A rival sits across the table with its own cats, its own
                      deck and your rules. Nobody gets a head start: further up
                      the tower they only think further ahead, and you can open
                      their board at any time.
                    </p>
                    <p className={`${COPY} mt-3`}>
                      <strong className="font-extrabold">
                        Win, and a stolen card comes back.
                      </strong>{" "}
                      You build a deck of {word(DECK_SIZE)} cards, and the
                      rivals make off with {word(STOLEN)} of them before the
                      first match. After each win but the last you are shown{" "}
                      {word(REWARD_RECLAIM)} of the stolen cards and may take
                      one back, or none: a smaller deck finds its best cats more
                      often. Every other win, a relic too.
                    </p>
                    <p className={`${COPY} mt-3`}>
                      <strong className="font-extrabold">
                        The board resets. The deck does not.
                      </strong>{" "}
                      Every match starts from {word(SLOTS * ROWS.length)} empty
                      slots. Your deck and relics carry through all{" "}
                      {word(rivals)} rivals. Lose once and the run is over; the
                      coins it paid and what it unlocked are yours to keep.
                    </p>
                  </div>
                  <StageFrame
                    className="max-lg:mt-10 lg:col-start-1 lg:row-start-1"
                    crowd={
                      <CrowdCat
                        catId="shadewhisker"
                        size={64}
                        order={5}
                        cast={false}
                        flip
                        className="right-6 bottom-full"
                      />
                    }
                  >
                    <RivalFan />
                  </StageFrame>
                </div>
              </section>
            </div>
          </div>
        </div>

        <section
          aria-labelledby="landing-start"
          className="sky-band border-ink relative overflow-hidden border-t-2 px-4 pt-14 pb-40 text-center sm:pt-20 sm:pb-24"
        >
          <CornerCats />
          <div
            className="board relative mx-auto flex max-w-xl flex-col items-center px-5 py-8 sm:px-10 sm:py-10"
            style={{ "--board-cast": "var(--color-sky-deep)" } as CSSProperties}
          >
            <h2 id="landing-start" className={HEADING}>
              Your first rival
            </h2>
            <Nameplate
              rivalId={first.id}
              flavor
              className="mt-5 w-full max-w-sm text-left"
            />
            <TableLink
              href="/signup"
              variant="primary"
              size="lg"
              className="mt-7"
            >
              Start a run
            </TableLink>
            <p className="mt-6 text-base font-bold">
              Free, with nothing to install. The packs in the shop cost coins,
              and coins are only ever won at the table.
            </p>
          </div>
        </section>
      </main>

      <footer className="lid on-ink bg-ink text-cream">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-2 px-3 py-4 text-sm sm:px-5">
          <p>HaduMon. Small cats, short matches.</p>
          <Link
            href="/login"
            className="font-bold underline underline-offset-4"
          >
            Log in
          </Link>
        </div>
      </footer>
    </div>
  );
}
