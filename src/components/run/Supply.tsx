"use client";

import type { MatchView } from "~/server/game/view";

import { PixelSprite } from "~/components/PixelSprite";
import { getCat } from "~/server/game/cats";

import { CatPick, InfoButton } from "./CatPick";
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
 *
 * On a phone's table it is one narrow column, and its pieces are cut down
 * to fit: the dice are their marks alone until a Hunt makes buttons of
 * them, and a tray cat is a chip (`TrayChip`). `data-mode` says what is
 * being chosen from it, for the stylesheet.
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
      data-supply
      data-mode={hunting ? "hunt" : prowling ? "prowl" : "rest"}
      className={`fit-compact:flex fit-compact:flex-col fit-compact:gap-1.5 grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)] ${className}`}
    >
      <div className="fit-compact:gap-1.5 flex flex-col gap-2.5">
        <div className="tray-well fit-compact:flex-none fit-compact:px-1 fit-compact:pt-1 fit-compact:pb-1.5 flex-1 px-2 pt-1.5 pb-2.5">
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
            <ul className="feeder-dice mt-1 grid grid-cols-5 gap-1.5">
              {match.feeder.map((face, index) => (
                <li
                  key={index}
                  data-die={index}
                  data-face={face}
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

        <div className="fit-compact:flex-wrap fit-compact:gap-x-2 fit-compact:gap-y-1.5 flex items-center gap-3 pl-1">
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
            <p className="text-ink-soft fit-compact:hidden text-[11px] leading-tight font-semibold">
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
          <ul
            aria-label="Tray"
            className="fit-compact:flex fit-compact:h-auto fit-compact:flex-col fit-compact:gap-1 grid h-full gap-3 sm:grid-cols-3"
          >
            {match.tray.map((catId, index) => {
              const picked = prowling && mode.picks.includes(index);
              const pick = {
                catId,
                onDetail: () => onDetail(catId),
                onSelect: prowling ? () => onTrayCard(index) : undefined,
                selected: picked,
                pickable: prowling,
                disabled: busy || (prowling && !picked && full),
              };
              return (
                <li key={`${index}-${catId}`} data-tray={index}>
                  <CatPick
                    {...pick}
                    verb="Draw"
                    hint={prowling ? String(index + 1) : undefined}
                    className="fit-compact:hidden h-full"
                  />
                  <TrayChip {...pick} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/**
 * A tray cat on a phone's table, where a card has no room: its sprite, its
 * name and what it scores. The chip is the select control while a Prowl is
 * choosing; Info opens the whole card, and is a sibling of it, not inside.
 */
function TrayChip({
  catId,
  onDetail,
  onSelect,
  selected,
  pickable,
  disabled,
}: {
  catId: string;
  onDetail: () => void;
  onSelect?: () => void;
  selected: boolean;
  pickable: boolean;
  disabled: boolean;
}) {
  const cat = getCat(catId);
  const face = (
    <>
      <PixelSprite catId={catId} size={32} decorative className="shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span className="w-full truncate text-[11px] leading-tight font-black">
          {cat.name}
        </span>
        <span
          className="text-pixel border-ink bg-lime border-2 px-1 text-xs leading-4"
          aria-label={`${cat.points} points`}
        >
          {cat.points}
        </span>
      </span>
    </>
  );
  const dress = `piece border-ink text-ink flex w-full items-center gap-1 border-2 py-0.5 pr-1 pl-0.5 text-left ${selected ? "bg-lime is-chosen" : pickable && !disabled ? "bg-cream is-open" : "bg-cream"}`;
  return (
    <div className="fit-compact:block relative hidden">
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          aria-pressed={selected}
          aria-label={`Draw ${cat.name}`}
          className={`${dress} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {face}
        </button>
      ) : (
        <div className={dress}>{face}</div>
      )}
      <span className="absolute right-1 bottom-1.5 flex">
        <InfoButton name={cat.name} onClick={onDetail} className="leading-4" />
      </span>
    </div>
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
