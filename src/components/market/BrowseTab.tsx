"use client";

import { useMemo, useState } from "react";

import { Button, CardGridSkeleton, Panel, useToast } from "~/components/ui";
import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import { ELEMENT_LABELS, ELEMENTS, type Element } from "~/server/game/elements";
import { RARITIES, RARITY_LABELS, type Rarity } from "~/server/game/species";
import { api } from "~/trpc/react";
import { ConfirmDialog } from "./ConfirmDialog";
import { ListingCard, type Listing } from "./ListingCard";

const SORTS = [
  ["newest", "Newest"],
  ["priceAsc", "Price ↑"],
  ["priceDesc", "Price ↓"],
  ["power", "Power"],
] as const;

type Sort = (typeof SORTS)[number][0];

export function BrowseTab() {
  const utils = api.useUtils();
  const notify = useToast();

  const [element, setElement] = useState<Element | null>(null);
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [pending, setPending] = useState<Listing | null>(null);

  const me = api.auth.me.useQuery(undefined, { retry: false });

  const filters = useMemo(
    () => ({
      element: element ?? undefined,
      rarity: rarity === "all" ? undefined : rarity,
      minPrice: toPrice(minPrice),
      maxPrice: toPrice(maxPrice),
      sort,
      limit: 24,
    }),
    [element, rarity, minPrice, maxPrice, sort],
  );

  const board = api.market.browse.useInfiniteQuery(filters, {
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    retry: false,
  });

  const buy = api.market.buy.useMutation({
    onSuccess: async (result) => {
      setPending(null);
      notify(
        `Bought ${result.creature.name} for ${result.price.toLocaleString()} gold`,
      );
      await Promise.all([
        utils.market.invalidate(),
        utils.auth.me.invalidate(),
        utils.creatures.invalidate(),
      ]);
    },
    onError: async (error) => {
      setPending(null);
      notify(error.message, "error");
      await utils.market.browse.invalidate();
    },
  });

  const listings = board.data?.pages.flatMap((page) => page.items) ?? [];
  const gold = me.data?.wallet.gold ?? 0;
  const afterPurchase = pending ? gold - pending.price : gold;

  return (
    <div className="space-y-4">
      <Panel
        title="Browse"
        action={
          <span className="text-pixel text-ink-dim text-[8px]">
            {listings.length} listed
          </span>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            <Chip active={element === null} onClick={() => setElement(null)}>
              All
            </Chip>
            {ELEMENTS.map((value) => (
              <Chip
                key={value}
                active={element === value}
                color={ELEMENT_PALETTES[value]["1"]}
                onClick={() => setElement(element === value ? null : value)}
              >
                {ELEMENT_LABELS[value]}
              </Chip>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="Rarity">
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value as Rarity | "all")}
                className="border-edge bg-navy-deep text-ink focus:border-gold w-full border-2 px-1 py-1 text-base outline-none"
              >
                <option value="all">All</option>
                {RARITIES.map((value) => (
                  <option key={value} value={value}>
                    {RARITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sort">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="border-edge bg-navy-deep text-ink focus:border-gold w-full border-2 px-1 py-1 text-base outline-none"
              >
                {SORTS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Min gold">
              <input
                inputMode="numeric"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
                className="border-edge bg-navy-deep text-ink focus:border-gold w-full border-2 px-1 py-1 text-base outline-none"
              />
            </Field>
            <Field label="Max gold">
              <input
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
                placeholder="∞"
                className="border-edge bg-navy-deep text-ink focus:border-gold w-full border-2 px-1 py-1 text-base outline-none"
              />
            </Field>
          </div>
        </div>
      </Panel>

      {board.isLoading ? (
        <CardGridSkeleton count={6} />
      ) : listings.length === 0 ? (
        <Panel>
          <p className="text-ink-dim text-lg">
            No cats for sale match those filters. Try widening the price range.
          </p>
        </Panel>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingCard
                  listing={listing}
                  action={
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setPending(listing)}
                      disabled={buy.isPending}
                    >
                      Buy
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>

          {board.hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => void board.fetchNextPage()}
                disabled={board.isFetchingNextPage}
              >
                {board.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}

      {pending ? (
        <ConfirmDialog
          title={`Buy ${pending.creature.name}?`}
          confirmLabel={afterPurchase < 0 ? "Not enough gold" : "Buy"}
          confirmDisabled={afterPurchase < 0}
          busy={buy.isPending}
          onCancel={() => setPending(null)}
          onConfirm={() => buy.mutate({ listingId: pending.id })}
        >
          <p className="text-ink text-lg">
            Lv {pending.creature.level} {pending.creature.species.name} ·{" "}
            {pending.creature.power} PWR
          </p>
          <dl className="space-y-1 text-base">
            <Row
              label="Price"
              value={`${pending.price.toLocaleString()} g`}
              tone="text-gold"
            />
            <Row label="Your gold" value={`${gold.toLocaleString()} g`} />
            <Row
              label="After purchase"
              value={`${afterPurchase.toLocaleString()} g`}
              tone={afterPurchase < 0 ? "text-pink" : "text-mint"}
            />
            <Row label="Seller" value={pending.seller.displayName} />
          </dl>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-pixel text-ink-dim text-[8px] uppercase">{label}</dt>
      <dd className={`tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-pixel text-ink-dim text-[8px] uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-pixel border-2 px-2 py-1 text-[8px] uppercase ${
        active ? "bg-panel-hi text-ink" : "text-ink-dim hover:text-ink"
      }`}
      style={{
        borderColor: active
          ? (color ?? "var(--color-gold)")
          : "var(--color-edge)",
      }}
    >
      {children}
    </button>
  );
}

function toPrice(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
