"use client";

import { useState } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { Button, Panel } from "~/components/ui";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { ConfirmDialog } from "./ConfirmDialog";
import { NewTradeFlow } from "./NewTradeFlow";
import { useToast } from "./Toast";

type Offer = RouterOutputs["market"]["incomingTrades"][number];

export function TradesTab() {
  const utils = api.useUtils();
  const notify = useToast();

  const [accepting, setAccepting] = useState<Offer | null>(null);

  const incoming = api.market.incomingTrades.useQuery(undefined, {
    retry: false,
  });
  const outgoing = api.market.outgoingTrades.useQuery(undefined, {
    retry: false,
  });
  const history = api.market.tradeHistory.useQuery(undefined, { retry: false });

  const refresh = async () => {
    await Promise.all([
      utils.market.invalidate(),
      utils.auth.me.invalidate(),
      utils.creatures.invalidate(),
    ]);
  };

  const respond = api.market.respondTrade.useMutation({
    onSuccess: async (result) => {
      setAccepting(null);
      notify(
        result.status === "accepted"
          ? `Trade accepted — ${result.received.name} joined your collection`
          : "Offer declined",
      );
      await refresh();
    },
    onError: async (error) => {
      setAccepting(null);
      notify(error.message, "error");
      await refresh();
    },
  });

  const cancelTrade = api.market.cancelTrade.useMutation({
    onSuccess: async () => {
      notify("Offer withdrawn");
      await refresh();
    },
    onError: (error) => notify(error.message, "error"),
  });

  const busy = respond.isPending || cancelTrade.isPending;

  return (
    <div className="space-y-4">
      <Panel
        title="Incoming offers"
        action={
          <span className="text-pixel text-ink-dim text-[8px]">
            {incoming.data?.length ?? 0}
          </span>
        }
      >
        {incoming.isLoading ? (
          <p className="text-ink-dim text-lg">Checking the mailbox…</p>
        ) : (incoming.data?.length ?? 0) === 0 ? (
          <p className="text-ink-dim text-lg">No one wants your cats yet.</p>
        ) : (
          <ul className="space-y-3">
            {incoming.data?.map((offer) => (
              <li key={offer.id}>
                <OfferRow offer={offer} mineSide="receiver">
                  <Button
                    size="sm"
                    onClick={() => setAccepting(offer)}
                    disabled={busy}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      respond.mutate({ offerId: offer.id, accept: false })
                    }
                    disabled={busy}
                  >
                    Decline
                  </Button>
                </OfferRow>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Sent offers">
        {(outgoing.data?.length ?? 0) === 0 ? (
          <p className="text-ink-dim text-lg">Nothing pending.</p>
        ) : (
          <ul className="space-y-3">
            {outgoing.data?.map((offer) => (
              <li key={offer.id}>
                <OfferRow offer={offer} mineSide="proposer">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => cancelTrade.mutate({ offerId: offer.id })}
                    disabled={busy}
                  >
                    Withdraw
                  </Button>
                </OfferRow>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <NewTradeFlow />

      {(history.data?.length ?? 0) > 0 ? (
        <Panel title="Trade history">
          <ul className="space-y-1">
            {history.data?.map((offer) => (
              <li
                key={offer.id}
                className="border-edge/60 flex items-baseline justify-between gap-2 border-b pb-1 text-base last:border-0"
              >
                <span className="text-ink truncate">
                  {offer.proposerCreature.name} ⇄ {offer.receiverCreature.name}
                </span>
                <span
                  className={`text-pixel shrink-0 text-[8px] uppercase ${
                    offer.status === "accepted" ? "text-mint" : "text-ink-dim"
                  }`}
                >
                  {offer.status}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {accepting ? (
        <ConfirmDialog
          title="Accept this trade?"
          confirmLabel="Accept"
          busy={respond.isPending}
          onCancel={() => setAccepting(null)}
          onConfirm={() =>
            respond.mutate({ offerId: accepting.id, accept: true })
          }
        >
          <p className="text-ink-dim text-lg">
            You give{" "}
            <span className="text-pink">{accepting.receiverCreature.name}</span>{" "}
            and receive{" "}
            <span className="text-mint">{accepting.proposerCreature.name}</span>
            . This cannot be undone.
          </p>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function OfferRow({
  offer,
  mineSide,
  children,
}: {
  offer: Offer;
  mineSide: "proposer" | "receiver";
  children: React.ReactNode;
}) {
  const theirs =
    mineSide === "receiver" ? offer.proposerCreature : offer.receiverCreature;
  const mine =
    mineSide === "receiver" ? offer.receiverCreature : offer.proposerCreature;
  const other = mineSide === "receiver" ? offer.proposer : offer.receiver;

  return (
    <div className="panel-flat space-y-2 p-2">
      <p className="text-pixel text-ink text-[9px]">
        {mineSide === "receiver" ? "From" : "To"}{" "}
        <span className="text-gold">{other.displayName}</span>
      </p>
      <div className="flex items-center justify-between gap-2">
        <Side creature={theirs} caption="You get" tone="text-mint" />
        <span aria-hidden className="text-pixel text-ink-dim text-[12px]">
          ⇄
        </span>
        <Side creature={mine} caption="You give" tone="text-pink" />
      </div>
      {offer.message ? (
        <p className="border-edge text-ink-dim border-l-2 pl-2 text-base italic">
          “{offer.message}”
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Side({
  creature,
  caption,
  tone,
}: {
  creature: Offer["proposerCreature"];
  caption: string;
  tone: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
      <span className={`text-pixel text-[7px] uppercase ${tone}`}>
        {caption}
      </span>
      <PixelSprite speciesId={creature.speciesId} size={56} />
      <span className="text-ink w-full truncate text-base">
        {creature.name}
      </span>
      <span className="text-ink-dim text-base">
        Lv {creature.level} · {creature.power} PWR
      </span>
    </div>
  );
}
