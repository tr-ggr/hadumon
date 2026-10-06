"use client";

import { useCallback, useRef } from "react";

import type { Owned } from "~/server/game/collection";
import { api, type RouterOutputs } from "~/trpc/react";

import { NO_PRESSES, press, settle, wasAnswered } from "./request";

export type Opened = RouterOutputs["shop"]["open"];

export interface OpenPack {
  /**
   * A press on Open. Dropped while a request is on its way; otherwise sent
   * under that pack's request id, which is a new one unless the last press
   * on it was never answered. Says whether it was sent.
   */
  open: (packId: string) => boolean;
  /** True from the press until the server has answered or failed. */
  pending: boolean;
}

export interface OpenPackOptions {
  /**
   * The pack is open. `requestId` names this opening; `before` is what the
   * account held when the button was pressed, if the page knew, and is
   * `null` for a pack that had in fact been opened by an earlier try.
   */
  onOpened: (requestId: string, opened: Opened, before: Owned | null) => void;
  /** It was not opened: the sentence to show. */
  onRefused: (sentence: string) => void;
}

/** What to say when the request failed and nobody knows what became of it. */
export const NO_ANSWER =
  "The shop did not answer. Press again: the same pack is never bought twice.";

/**
 * Buys and opens a pack. One press makes one request id (`request.ts`), so a
 * double click or a retry cannot buy twice. When the pack is open the new
 * balance is written into the shelf's cache at once, and everything a pack
 * changes is fetched again: the shelf, the collection, the deck's standing,
 * the profile and the codex.
 */
export function useOpenPack({
  onOpened,
  onRefused,
}: OpenPackOptions): OpenPack {
  const utils = api.useUtils();
  /** A ref, so a second press in the same frame sees the first. */
  const presses = useRef(NO_PRESSES);

  const mutation = api.shop.open.useMutation({
    // Here and not at the call, so the cache is put right even if the page
    // has been left by the time the server answers.
    onSuccess: (opened, { packId }) => {
      utils.shop.packs.setData(undefined, (shelf) =>
        shelf
          ? {
              coins: opened.coins,
              packs: shelf.packs.map((pack) =>
                pack.id === packId &&
                pack.left !== null &&
                opened.result.kind === "cosmetics" &&
                !opened.replayed
                  ? {
                      ...pack,
                      left: Math.max(
                        0,
                        pack.left - opened.result.pieces.length,
                      ),
                    }
                  : pack,
              ),
            }
          : shelf,
      );
      // The profile holds the same balance, for the lid. It is written and
      // then read again, so the lid never shows the old one in between.
      utils.profile.get.setData(undefined, (profile) =>
        profile ? { ...profile, coins: opened.coins } : profile,
      );
      void utils.shop.packs.invalidate();
      void utils.collection.get.invalidate();
      void utils.collection.deck.invalidate();
      void utils.profile.get.invalidate();
      void utils.codex.get.invalidate();
    },
    // A refusal is often a stale balance: the shelf and the lid read it again.
    onError: () => {
      void utils.shop.packs.invalidate();
      void utils.profile.get.invalidate();
    },
  });
  const { mutate } = mutation;

  const open = useCallback(
    (packId: string) => {
      const pressed = press(presses.current, packId, () => crypto.randomUUID());
      if (pressed.requestId === null) return false;
      const requestId = pressed.requestId;
      presses.current = pressed.state;
      const before = utils.collection.get.getData() ?? null;
      mutate(
        { packId, requestId },
        {
          onSuccess: (opened) => {
            presses.current = settle(presses.current, packId, true);
            onOpened(requestId, opened, opened.replayed ? null : before);
          },
          onError: (error) => {
            const answered = wasAnswered(error.data?.httpStatus);
            presses.current = settle(presses.current, packId, answered);
            onRefused(answered ? error.message : NO_ANSWER);
          },
        },
      );
      return true;
    },
    [mutate, onOpened, onRefused, utils],
  );

  return { open, pending: mutation.isPending };
}
