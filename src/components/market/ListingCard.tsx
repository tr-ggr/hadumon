"use client";

import type { ReactNode } from "react";

import { CreatureCard } from "~/components/ui";
import type { RouterOutputs } from "~/trpc/react";

export type Listing = RouterOutputs["market"]["browse"]["items"][number];

export interface ListingCardProps {
  listing: Listing;
  /** Shown under the price row — usually a Buy / Cancel button. */
  action?: ReactNode;
  /** Hide the seller line on boards where every listing is yours. */
  showSeller?: boolean;
}

const STATUS_TONE: Record<string, string> = {
  active: "text-mint",
  sold: "text-sky",
  cancelled: "text-ink-dim",
};

export function ListingCard({
  listing,
  action,
  showSeller = true,
}: ListingCardProps) {
  return (
    <CreatureCard
      creature={{ ...listing.creature, status: undefined }}
      spriteSize={64}
      footer={
        <div className="border-edge mt-1 w-full space-y-1 border-t-2 pt-1">
          <p className="text-pixel text-gold text-[9px] tabular-nums">
            {listing.price.toLocaleString()}
            <span className="text-ink-dim ml-1 text-[7px]">GOLD</span>
          </p>
          {showSeller ? (
            <p className="text-ink-dim truncate text-base">
              by {listing.seller.displayName}
            </p>
          ) : (
            <p
              className={`text-pixel text-[7px] uppercase ${STATUS_TONE[listing.status] ?? ""}`}
            >
              {listing.status}
              {listing.status === "sold" && listing.buyer
                ? ` → ${listing.buyer.displayName}`
                : ""}
            </p>
          )}
          {action}
        </div>
      }
    />
  );
}
