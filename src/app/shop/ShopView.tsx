"use client";

import { PieceDrawing } from "~/components/profile/PieceDrawing";
import { PackShelfSkeleton } from "~/components/shop/PackShelf";
import { Shop, ShopHeader } from "~/components/shop/Shop";
import { Board, Skeleton, TableButton } from "~/components/ui";
import { api } from "~/trpc/react";

/** A cosmetic as its picture: worn on Hadu, or a swatch of a skin. */
const drawPiece = (cosmeticId: string) => (
  <PieceDrawing cosmeticId={cosmeticId} size={48} />
);

/**
 * The shop, a room in the tower: its name on a plate above one board, on the
 * wall. Once the shelf has come it is `Shop`'s to show, whatever its queries
 * do after that: a pack being opened is never put away by a refetch.
 */
export function ShopView() {
  // Coins are won on another page, so a cached shelf is never good enough.
  const shelf = api.shop.packs.useQuery(undefined, {
    refetchOnMount: "always",
    retry: 1,
  });
  // What the account already has is a note on a pack, never a condition of
  // the shop: if either fails to come, the shelf is the shelf without it.
  const collection = api.collection.get.useQuery(undefined, { retry: 1 });
  const profile = api.profile.get.useQuery(undefined, { retry: 1 });

  return (
    <div className="in-room flex flex-col gap-5">
      {shelf.data ? (
        <Shop
          shelf={shelf.data}
          owned={collection.data ?? null}
          gained={profile.data?.cosmetics ?? null}
          lidCoins={profile.data?.coins ?? null}
          pieceDrawing={drawPiece}
        />
      ) : (
        <>
          <ShopHeader />
          {shelf.error ? (
            <Board title="The shop is shut">
              <div role="alert" className="flex flex-col items-start gap-3">
                <p className="text-sm">
                  The shelf could not be loaded: {shelf.error.message}
                </p>
                <TableButton
                  size="md"
                  disabled={shelf.isFetching}
                  onClick={() => void shelf.refetch()}
                >
                  {shelf.isFetching ? "Trying…" : "Try again"}
                </TableButton>
              </div>
            </Board>
          ) : (
            <ShelfSkeleton />
          )}
        </>
      )}
    </div>
  );
}

/** The board while the shelf is fetched: blanks in the shape of what comes. */
function ShelfSkeleton() {
  return (
    <Board>
      <div className="mb-1 space-y-2">
        <Skeleton className="h-[30px] w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <PackShelfSkeleton />
      <div className="mt-[68px] space-y-2">
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      <div className="rail -mx-4 mt-5 -mb-4 flex flex-col gap-2 px-4 py-2.5 sm:-mx-5 sm:-mb-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-12 w-full sm:w-28" />
      </div>
    </Board>
  );
}
