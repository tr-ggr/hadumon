import { Board, Skeleton } from "~/components/ui";
import {
  cosmeticsIn,
  HADU_SLOTS,
  SLOT_LABELS,
  TABLE_SLOTS,
  type CosmeticSlot,
} from "~/server/game/cosmetics";

import { ProfileFrame } from "./Profile";

/**
 * The profile while it is fetched: the mat with a blank where the hadu will
 * stand, and both boards with a space for every piece, so nothing moves when
 * the profile comes. The slots and how many pieces each has are the game's
 * own, so they are printed at once.
 */
export function ProfileSkeleton() {
  return (
    <ProfileFrame
      aside={
        <div
          role="status"
          aria-busy="true"
          className="mat flex w-full items-center gap-2 p-3 sm:gap-6 sm:p-5 lg:flex-col lg:gap-3"
        >
          <span className="sr-only">Loading your profile…</span>
          <Skeleton className="m-8 h-32 w-32 shrink-0 lg:m-10 lg:mb-8 lg:h-40 lg:w-40" />
          <span className="flex min-w-0 flex-1 flex-col items-start gap-2.5 lg:items-center">
            <Skeleton className="h-8 w-28 max-w-full" />
            <Skeleton className="h-8 w-24 max-w-full" />
          </span>
        </div>
      }
    >
      <ShelfSkeleton title="Wardrobe" slots={HADU_SLOTS} />
      <ShelfSkeleton title="Table and tower" slots={TABLE_SLOTS} />
    </ProfileFrame>
  );
}

function ShelfSkeleton({
  title,
  slots,
}: {
  title: string;
  slots: readonly CosmeticSlot[];
}) {
  return (
    <Board title={title}>
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="divide-ink/15 mt-1 divide-y-2 divide-dashed" aria-hidden>
        {slots.map((slot) => (
          <div key={slot} className="py-4 last:pb-1">
            <p className="text-print text-xl">{SLOT_LABELS[slot]}</p>
            <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-5 xl:grid-cols-9">
              {cosmeticsIn(slot).map((cosmetic) => (
                <span
                  key={cosmetic.id}
                  className="border-ink/30 flex flex-col items-center gap-1 border-2 border-dashed px-1 pt-2 pb-1.5"
                >
                  <Skeleton className="h-[72px] w-16 max-w-full" />
                  <Skeleton className="h-3 w-12 max-w-full" />
                  <Skeleton className="h-3 w-10 max-w-full" />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Board>
  );
}
