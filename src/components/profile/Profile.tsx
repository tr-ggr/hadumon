"use client";

import { TRPCClientError } from "@trpc/client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { HaduAvatar } from "~/components/HaduAvatar";
import { PixelIcon } from "~/components/PixelIcon";
import { playSound } from "~/components/run/sfx/engine";
import { COIN_COLOR } from "~/components/sprites/palettes";
import {
  AchievementsBoard,
  PrivacyBoard,
  RecentRunsBoard,
  ShareButton,
  StatsBoard,
} from "~/components/players/PlayerBoards";
import {
  Board,
  BoardSkeleton,
  TableButton,
  TableLink,
  useToast,
} from "~/components/ui";
import {
  cosmeticsIn,
  getCosmetic,
  HADU_SLOTS,
  SLOT_LABELS,
  TABLE_SLOTS,
  type Cosmetic,
  type CosmeticSlot,
  type Look,
} from "~/server/game/cosmetics";
import { api, type RouterOutputs } from "~/trpc/react";

import {
  changeSentence,
  lockedNote,
  lockedSentence,
  ownedCount,
  pressWears,
  refusedSentence,
  standingOf,
  wornSentence,
} from "./wardrobe";
import { WardrobeTile } from "./WardrobeTile";

type ProfileData = RouterOutputs["profile"]["get"];

/** What to tell the player when a change did not go through. */
function refusal(error: unknown): string {
  if (error instanceof TRPCClientError) {
    const data: unknown = error.data;
    const refused =
      typeof data === "object" &&
      data !== null &&
      "code" in data &&
      data.code === "FORBIDDEN";
    if (refused) return error.message;
  }
  return "The table did not answer. Try again.";
}

/** `look` without what it holds for `slot`. */
function without(look: Partial<Look>, slot: CosmeticSlot): Partial<Look> {
  const rest = { ...look };
  delete rest[slot];
  return rest;
}

/**
 * The player's profile: their hadu standing on a mat with their name and
 * coins, then everything it can wear and every skin of the table and the
 * tower, a row to a slot. A press on a piece the account has puts it on at
 * once and tells the server after; a change the server refuses comes back
 * off, and a notice says so. There is nothing to save.
 */
export function Profile({ profile }: { profile: ProfileData }) {
  const notify = useToast();
  const utils = api.useUtils();
  const equip = api.profile.equip.useMutation();
  /** What has been put on here and not yet answered for, by slot. */
  const [trying, setTrying] = useState<Partial<Look>>({});
  /** What the last press did, until the next one. */
  const [said, setSaid] = useState<string | null>(null);
  /** Changes go to the server one at a time, in the order they were made. */
  const queue = useRef<Promise<void>>(Promise.resolve());

  const { name, coins, cosmetics: gained } = profile;
  const look: Look = { ...profile.look, ...trying };

  // Once the server's look says the same, a change is no longer being tried.
  useEffect(() => {
    setTrying((now) => {
      const settled = Object.entries(now).filter(
        ([slot, id]) => profile.look[slot as CosmeticSlot] === id,
      );
      if (settled.length === 0) return now;
      return settled.reduce<Partial<Look>>(
        (rest, [slot]) => without(rest, slot as CosmeticSlot),
        now,
      );
    });
  }, [profile.look]);

  const send = async (piece: Cosmetic) => {
    try {
      const answer = await equip.mutateAsync({
        slot: piece.slot,
        cosmeticId: piece.id,
      });
      utils.profile.get.setData(undefined, answer);
    } catch (error) {
      const reason = refusal(error);
      // Back to what the server last agreed to, unless a later press has
      // already put something else in the slot.
      setTrying((now) =>
        now[piece.slot] === piece.id ? without(now, piece.slot) : now,
      );
      setSaid(refusedSentence(piece, reason));
      playSound("illegal");
      notify(reason, "error");
      // What the account has may not be what this page thought it had.
      void utils.profile.get.invalidate();
    }
  };

  const press = (cosmetic: Cosmetic) => {
    if (standingOf(cosmetic, look, gained) === "locked") {
      playSound("illegal");
      setSaid(lockedSentence(cosmetic));
      return;
    }
    const next = pressWears(cosmetic, look);
    if (next === null) {
      setSaid(`Already on: ${cosmetic.name}.`);
      return;
    }
    const piece = getCosmetic(next);
    setTrying((now) => ({ ...now, [piece.slot]: piece.id }));
    setSaid(changeSentence(piece));
    queue.current = queue.current.then(() => send(piece));
  };

  const sentence = said ?? wornSentence(look);

  return (
    <ProfileFrame
      aside={
        <>
          <Mirror name={name} coins={coins} look={look}>
            <div className="flex flex-wrap gap-2">
              <ShareButton path={`/players/${profile.handle}`} />
              <TableLink href={`/players/${profile.handle}`} size="sm">
                As others see it
              </TableLink>
            </div>
          </Mirror>
          <StatusCard className="w-full max-lg:hidden">{sentence}</StatusCard>
        </>
      }
      rail={
        <StatusCard
          className="sticky bottom-[5.75rem] z-20 mt-5 md:bottom-4 lg:hidden"
          picture={<HaduAvatar look={look} size={32} className="m-2" />}
        >
          {sentence}
        </StatusCard>
      }
    >
      <OwnRecord />
      <Shelf
        title="Wardrobe"
        intro="Press a piece to put it on. The first of a row takes it off again."
        slots={HADU_SLOTS}
        inForce="Worn"
        look={look}
        gained={gained}
        onPress={press}
      />
      <Shelf
        title="Table and tower"
        intro="How your board, your cloth, the tower and its sky are painted."
        slots={TABLE_SLOTS}
        inForce="In use"
        look={look}
        gained={gained}
        onPress={press}
      />
      <PrivacyBoard runsPublic={profile.runsPublic} />
    </ProfileFrame>
  );
}

/** The account's own record, runs and achievements, as other players see them. */
function OwnRecord() {
  // Runs end and achievements are earned on other pages: ask again here.
  const record = api.profile.record.useQuery(undefined, {
    refetchOnMount: "always",
    retry: 1,
  });

  if (record.isPending) {
    return (
      <>
        <BoardSkeleton title="Record" lines={2} />
        <BoardSkeleton title="Runs" lines={4} />
      </>
    );
  }
  if (record.error) {
    return (
      <Board title="Record">
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm">The record book would not open.</p>
          <TableButton
            variant="secondary"
            size="md"
            disabled={record.isFetching}
            onClick={() => void record.refetch()}
          >
            {record.isFetching ? "Trying…" : "Try again"}
          </TableButton>
        </div>
      </Board>
    );
  }
  const own = record.data;
  return (
    <>
      <StatsBoard stats={own.stats} />
      <RecentRunsBoard
        runs={own.recentRuns}
        allHref="/runs"
        name={own.name}
        isSelf
      />
      <AchievementsBoard held={own.achievements} />
    </>
  );
}

/**
 * The page's frame, a room in the tower: the name on a plate and the hadu
 * down the left from 1024px, where they stay put beside the boards as those
 * scroll, and above them under that. What stands on the wall and not on a
 * board casts on stone.
 */
export function ProfileFrame({
  title = "Profile",
  aside,
  rail,
  children,
}: {
  /** The page's one h1, on its cream plate. */
  title?: string;
  /** Under the page's name: the hadu on its mat. */
  aside: ReactNode;
  /**
   * Under 1024px the hadu is a screen away from its wardrobe, so a rail
   * carries it small, with the sentence. It rides above the dock.
   */
  rail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="in-room mx-auto w-full max-w-[1180px] [--cast:var(--board-cast)] [--mat-cast:var(--board-cast)]">
      <div className="grid items-start gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <header className="flex flex-col items-start gap-4 lg:sticky lg:top-[calc(var(--lid-h)+1.25rem)]">
          <h1 className="piece border-ink bg-cream text-print max-w-full border-2 px-3 py-2 text-3xl break-words sm:text-[40px]">
            {title}
          </h1>
          {aside}
        </header>
        <div className="flex min-w-0 flex-col gap-7">{children}</div>
      </div>
      {rail}
    </div>
  );
}

/**
 * The hadu, large, standing on a mat, with whose it is and what they hold.
 * Another player's hadu has their name on a white plate, since lime is the
 * viewer's own, and no coins: those are only ever shown to their owner.
 */
export function Mirror({
  name,
  coins,
  look,
  own = true,
  children,
}: {
  name: string;
  coins?: number;
  look: Look;
  /** True when it is the viewer's own hadu. */
  own?: boolean;
  /** Anything else that stands on the plate's line: a share button. */
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={own ? "Your hadu" : `${name}'s hadu`}
      className="mat flex w-full items-center gap-2 p-3 sm:gap-6 sm:p-5 lg:flex-col lg:gap-3"
    >
      {/* The margin is the air an aura stands in: a quarter of the hadu. */}
      <span className="relative m-8 shrink-0 after:absolute after:inset-x-[18.75%] after:top-full after:h-[6.25%] after:bg-[var(--cast)] after:content-[''] lg:m-10 lg:mb-8">
        <HaduAvatar
          look={look}
          size={160}
          label={`${own ? "Your" : `${name}'s`} hadu. ${wornSentence(look)}`}
          className="h-32 w-32 lg:h-40 lg:w-40"
        />
      </span>
      <div className="flex min-w-0 flex-col items-start gap-2.5 lg:items-center">
        <p
          className={`piece border-ink text-print max-w-full border-2 px-2.5 py-1 text-xl break-words ${own ? "bg-lime" : "bg-white"}`}
        >
          {name}
        </p>
        {coins !== undefined ? (
          <p className="piece border-ink inline-flex min-h-8 items-center gap-1.5 border-2 bg-white px-2 text-sm font-extrabold tabular-nums">
            <PixelIcon name="coin" size={16} fill={COIN_COLOR} />
            {coins}
            <span className="font-bold">{coins === 1 ? "coin" : "coins"}</span>
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}

/** The one sentence that says what is worn, or what the last press did. */
function StatusCard({
  picture,
  className = "",
  children,
}: {
  picture?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`piece piece-card border-ink text-ink flex items-center gap-2 border-2 bg-white px-3 py-2.5 ${className}`}
    >
      {picture}
      <p aria-live="polite" className="min-w-0 text-sm font-semibold">
        {children}
      </p>
    </div>
  );
}

/** One board of slots: the wardrobe, or the table and the tower. */
function Shelf({
  title,
  intro,
  slots,
  inForce,
  look,
  gained,
  onPress,
}: {
  title: string;
  intro: string;
  slots: readonly CosmeticSlot[];
  inForce: string;
  look: Look;
  gained: readonly string[];
  onPress: (cosmetic: Cosmetic) => void;
}) {
  const noteId = useId();
  const { owned, total } = ownedCount(slots, gained);
  const first = slots[0];

  return (
    <Board
      title={title}
      action={
        <p className="text-print text-xl tabular-nums">
          {owned} of {total}
        </p>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="max-w-[60ch] text-sm leading-snug">
          {intro}
          {owned < total && first ? (
            <>
              {" "}
              A dashed space is one you do not have.{" "}
              <span id={noteId} className="font-bold">
                {lockedNote(first)}
              </span>
            </>
          ) : null}
        </p>
        {owned < total ? (
          <TableLink href="/shop" size="sm">
            Open the shop
          </TableLink>
        ) : null}
      </div>
      <div className="divide-ink/15 mt-1 divide-y-2 divide-dashed">
        {slots.map((slot) => (
          <SlotRow
            key={slot}
            slot={slot}
            inForce={inForce}
            look={look}
            gained={gained}
            noteId={noteId}
            onPress={onPress}
          />
        ))}
      </div>
    </Board>
  );
}

/** Every piece of one slot, the free one first. */
function SlotRow({
  slot,
  inForce,
  look,
  gained,
  noteId,
  onPress,
}: {
  slot: CosmeticSlot;
  inForce: string;
  look: Look;
  gained: readonly string[];
  noteId: string;
  onPress: (cosmetic: Cosmetic) => void;
}) {
  const headingId = useId();
  const pieces = cosmeticsIn(slot);
  const { owned, total } = ownedCount([slot], gained);

  return (
    <div role="group" aria-labelledby={headingId} className="py-4 last:pb-1">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={headingId} className="text-print text-xl">
          {SLOT_LABELS[slot]}
        </h3>
        <p className="text-ink-soft text-xs font-bold tabular-nums">
          {owned} of {total}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-5 xl:grid-cols-9">
        {pieces.map((cosmetic) => (
          <WardrobeTile
            key={cosmetic.id}
            cosmetic={cosmetic}
            standing={standingOf(cosmetic, look, gained)}
            inForce={inForce}
            noteId={noteId}
            onPress={() => onPress(cosmetic)}
          />
        ))}
      </div>
    </div>
  );
}
