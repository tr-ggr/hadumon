"use client";

import type { MatchView } from "~/server/game/view";

import { CatPick } from "./CatPick";
import { Die, KeyHint, Label, Pile, TableButton } from "./pieces";
import { deckPicks, type Mode } from "./turn";

export interface SupplyProps {
  match: MatchView;
  mode: Mode;
  busy: boolean;
  /** Dice a Hunt takes now. */
  take: number;
  /** Cats a Prowl draws now. */
  want: number;
  /** True on the step the feeder is rolled again. */
  rolling: boolean;
  onDie: (index: number) => void;
  onTrayCard: (index: number) => void;
  onDeckPicks: (delta: 1 | -1) => void;
  onReroll: () => void;
  onDetail: (catId: string) => void;
  /** Whose deck the piles are and how big it is, e.g. "Cinder Clan deck, 16 cards in all." */
  deckNote: string;
  className?: string;
}

/**
 * The middle of the table, shared with the rival: the feeder's dice in their
 * tray, the three face-up cats, and the deck and discard piles.
 */
export function Supply({
  match,
  mode,
  busy,
  take,
  want,
  rolling,
  onDie,
  onTrayCard,
  onDeckPicks,
  onReroll,
  onDetail,
  deckNote,
  className = "",
}: SupplyProps) {
  const hunting = mode.kind === "hunt";
  const prowling = mode.kind === "prowl";
  const fromDeck = prowling ? deckPicks(mode.picks) : 0;
  const deckAvailable = match.deckCount + match.discardCount;
  const full = prowling && mode.picks.length >= want;

  return (
    <section
      aria-label="Supply"
      className={`grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)] ${className}`}
    >
      <div className="flex flex-col gap-2.5">
        <div className="tray-well flex-1 px-2 pt-1.5 pb-2.5">
          <div className="flex min-h-5 items-center justify-between gap-2">
            <Label className="text-ink!">
              Feeder
              {hunting ? `, take ${take}` : ""}
            </Label>
            {match.canReroll ? (
              <TableButton
                variant="secondary"
                disabled={busy}
                onClick={onReroll}
                className="-my-1.5 min-h-7! bg-white!"
              >
                Reroll, free
              </TableButton>
            ) : null}
          </div>
          {match.feeder.length === 0 ? (
            <p className="text-ink-soft mt-1 text-sm">The feeder is empty.</p>
          ) : (
            <ul className="mt-1 grid grid-cols-5 gap-1.5">
              {match.feeder.map((face, index) => (
                <li
                  key={index}
                  data-die={index}
                  className={rolling ? "anim-roll" : ""}
                >
                  <Die
                    face={face}
                    selected={hunting && mode.dice.includes(index)}
                    disabled={busy}
                    hint={hunting ? String(index + 1) : undefined}
                    onClick={hunting ? () => onDie(index) : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3 pl-1">
          <div data-pile="deck">
            <Pile count={match.deckCount} label="Your deck" />
          </div>
          <Pile count={match.discardCount} label="Your discard" faceUp />
          {prowling ? (
            <div className="flex items-center gap-1.5">
              <StepButton
                label="Take one fewer from the deck"
                disabled={busy || fromDeck === 0}
                onClick={() => onDeckPicks(-1)}
              >
                −
              </StepButton>
              <span className="text-ink text-xs leading-tight font-bold tabular-nums">
                {fromDeck} from
                <br />
                the deck
              </span>
              <StepButton
                label="Take one more from the deck"
                disabled={busy || full || fromDeck >= deckAvailable}
                onClick={() => onDeckPicks(1)}
                hint="0"
              >
                +
              </StepButton>
            </div>
          ) : (
            <p className="text-ink-soft text-[11px] leading-tight font-semibold">
              {deckNote} The discard is shuffled back in when the deck runs out.
            </p>
          )}
        </div>
      </div>

      <div>
        {match.tray.length === 0 ? (
          <p className="tray-well text-ink-soft p-3 text-sm">
            The tray is empty.
          </p>
        ) : (
          <ul aria-label="Tray" className="grid h-full gap-3 sm:grid-cols-3">
            {match.tray.map((catId, index) => {
              const picked = prowling && mode.picks.includes(index);
              return (
                <li key={`${index}-${catId}`} data-tray={index}>
                  <CatPick
                    catId={catId}
                    verb="Draw"
                    onDetail={() => onDetail(catId)}
                    onSelect={prowling ? () => onTrayCard(index) : undefined}
                    selected={picked}
                    pickable={prowling}
                    hint={prowling ? String(index + 1) : undefined}
                    disabled={busy || (prowling && !picked && full)}
                    className="h-full"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  hint,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  hint?: string;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="piece border-ink text-ink hover:bg-sky-soft relative h-10 w-10 border-2 bg-white text-lg leading-none font-black disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
      {hint ? (
        <KeyHint className="absolute -top-1.5 -right-1.5">{hint}</KeyHint>
      ) : null}
    </button>
  );
}
