"use client";

import { useState } from "react";

import { Button, CreatureCard, Panel, useToast } from "~/components/ui";
import {
  MAX_PRICE,
  MIN_PRICE,
  sellerProceeds,
  suggestedPrice,
} from "~/server/game/market";
import { api } from "~/trpc/react";
import { ConfirmDialog } from "./ConfirmDialog";
import { ListingCard } from "./ListingCard";

export function MyListingsTab() {
  const utils = api.useUtils();
  const notify = useToast();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const listable = api.market.listableCreatures.useQuery(undefined, {
    retry: false,
  });
  const mine = api.market.myListings.useQuery(undefined, { retry: false });

  const selected =
    listable.data?.creatures.find((c) => c.id === selectedId) ?? null;
  const priceValue = Number.parseInt(price, 10);
  const priceValid =
    Number.isInteger(priceValue) &&
    priceValue >= MIN_PRICE &&
    priceValue <= MAX_PRICE;

  const reset = () => {
    setPickerOpen(false);
    setSelectedId(null);
    setPrice("");
  };

  const createListing = api.market.list.useMutation({
    onSuccess: async (result) => {
      notify(
        `Listed for ${result.price.toLocaleString()} gold — you receive ${result.proceeds.toLocaleString()}`,
      );
      reset();
      await Promise.all([
        utils.market.invalidate(),
        utils.auth.me.invalidate(),
        utils.creatures.invalidate(),
      ]);
    },
    onError: (error) => notify(error.message, "error"),
  });

  const cancel = api.market.cancel.useMutation({
    onSuccess: async () => {
      notify("Listing withdrawn — your cat is back home");
      setCancelling(null);
      await Promise.all([
        utils.market.invalidate(),
        utils.auth.me.invalidate(),
        utils.creatures.invalidate(),
      ]);
    },
    onError: (error) => {
      setCancelling(null);
      notify(error.message, "error");
    },
  });

  const listings = mine.data ?? [];
  const active = listings.filter((l) => l.status === "active");
  const resolved = listings.filter((l) => l.status !== "active");
  const cancelTarget = listings.find((l) => l.id === cancelling) ?? null;

  return (
    <div className="space-y-4">
      <Panel
        title="Sell a cat"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPickerOpen((open) => !open)}
          >
            {pickerOpen ? "Close" : "List a cat"}
          </Button>
        }
      >
        {!pickerOpen ? (
          <p className="text-ink-dim text-lg">
            Put an idle cat on the board for gold. The market keeps 5%; you
            always keep at least one cat.
          </p>
        ) : listable.isLoading ? (
          <p className="text-ink-dim text-lg">Checking the cattery…</p>
        ) : !listable.data || listable.data.creatures.length === 0 ? (
          <p className="text-ink-dim text-lg">
            No idle cats to sell right now.
          </p>
        ) : !listable.data.canOfferAny ? (
          <p className="text-pink text-lg">
            You must keep at least one cat — summon another first.
          </p>
        ) : (
          <div className="space-y-3">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {listable.data.creatures.map((creature) => (
                <li key={creature.id}>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      setSelectedId(creature.id);
                      setPrice(
                        String(
                          suggestedPrice(
                            creature.species.rarity,
                            creature.level,
                          ),
                        ),
                      );
                    }}
                  >
                    <CreatureCard
                      creature={creature}
                      spriteSize={56}
                      selected={selectedId === creature.id}
                    />
                  </button>
                </li>
              ))}
            </ul>

            {selected ? (
              <div className="panel-flat space-y-2 p-3">
                <p className="text-ink text-lg">
                  Selling <span className="text-gold">{selected.name}</span> (Lv{" "}
                  {selected.level})
                </p>
                <label className="block space-y-1">
                  <span className="text-pixel text-ink-dim text-[8px] uppercase">
                    Price in gold
                  </span>
                  <input
                    inputMode="numeric"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value.replace(/\D/g, "").slice(0, 7))
                    }
                    className="border-edge bg-navy-deep text-gold focus:border-gold w-full border-2 px-2 py-1 text-xl tabular-nums outline-none"
                  />
                </label>
                <p className="text-ink-dim text-base">
                  {priceValid ? (
                    <>
                      Market fee 5% ·{" "}
                      <span className="text-mint">
                        You receive{" "}
                        {sellerProceeds(priceValue).toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-pink">
                      Enter a price between {MIN_PRICE} and{" "}
                      {MAX_PRICE.toLocaleString()} gold
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      createListing.mutate({
                        creatureId: selected.id,
                        price: priceValue,
                      })
                    }
                    disabled={!priceValid || createListing.isPending}
                  >
                    {createListing.isPending ? "Listing…" : "List for sale"}
                  </Button>
                  <Button variant="ghost" onClick={reset}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Panel>

      <Panel title="Active listings">
        {mine.isLoading ? (
          <p className="text-ink-dim text-lg">Loading…</p>
        ) : active.length === 0 ? (
          <p className="text-ink-dim text-lg">Nothing of yours is for sale.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {active.map((listing) => (
              <li key={listing.id}>
                <ListingCard
                  listing={listing}
                  showSeller={false}
                  action={
                    <Button
                      size="sm"
                      variant="danger"
                      className="w-full"
                      onClick={() => setCancelling(listing.id)}
                    >
                      Cancel
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {resolved.length > 0 ? (
        <Panel title="History">
          <ul className="space-y-1">
            {resolved.map((listing) => (
              <li
                key={listing.id}
                className="border-edge/60 flex items-baseline justify-between gap-2 border-b pb-1 text-base last:border-0"
              >
                <span className="text-ink truncate">
                  {listing.creature.name}
                </span>
                <span className="text-ink-dim shrink-0">
                  {listing.status === "sold" ? (
                    <>
                      <span className="text-mint">
                        +{listing.proceeds.toLocaleString()} g
                      </span>{" "}
                      {listing.buyer ? `→ ${listing.buyer.displayName}` : ""}
                    </>
                  ) : (
                    "withdrawn"
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {cancelTarget ? (
        <ConfirmDialog
          title="Withdraw listing?"
          confirmLabel="Withdraw"
          busy={cancel.isPending}
          onCancel={() => setCancelling(null)}
          onConfirm={() => cancel.mutate({ listingId: cancelTarget.id })}
        >
          <p className="text-ink-dim text-lg">
            <span className="text-ink">{cancelTarget.creature.name}</span> comes
            off the board and goes back to idle.
          </p>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
