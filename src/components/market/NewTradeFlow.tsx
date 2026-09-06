"use client";

import { useState } from "react";

import { Button, CreatureCard, Panel, useToast } from "~/components/ui";
import { api } from "~/trpc/react";

/** Enter a username → pick their cat → pick yours → send the offer. */
export function NewTradeFlow({ onSent }: { onSent?: () => void }) {
  const utils = api.useUtils();
  const notify = useToast();

  const [usernameInput, setUsernameInput] = useState("");
  const [lookup, setLookup] = useState<string | null>(null);
  const [theirId, setTheirId] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const roster = api.market.browseUserRoster.useQuery(
    { username: lookup ?? "" },
    { enabled: lookup !== null, retry: false },
  );
  const mine = api.market.listableCreatures.useQuery(undefined, {
    retry: false,
  });

  const reset = () => {
    setLookup(null);
    setTheirId(null);
    setMyId(null);
    setMessage("");
  };

  const propose = api.market.proposeTrade.useMutation({
    onSuccess: async (result) => {
      notify(`Offer sent to ${result.receiver.displayName}`);
      setUsernameInput("");
      reset();
      onSent?.();
      await Promise.all([
        utils.market.invalidate(),
        utils.creatures.invalidate(),
      ]);
    },
    onError: (error) => notify(error.message, "error"),
  });

  const theirCats = roster.data?.creatures ?? [];
  const myCats = mine.data?.creatures ?? [];
  const ready = theirId !== null && myId !== null;

  return (
    <Panel title="New trade">
      <div className="space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = usernameInput.trim().toLowerCase();
            if (value.length > 0) {
              reset();
              setLookup(value);
            }
          }}
        >
          <label className="min-w-0 flex-1 space-y-1">
            <span className="text-pixel text-ink-dim text-[8px] uppercase">
              Trainer username
            </span>
            <input
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="whiskerbot_1"
              className="border-edge bg-navy-deep text-ink focus:border-gold w-full border-2 px-2 py-1 text-base outline-none"
            />
          </label>
          <Button
            type="submit"
            className="self-end"
            disabled={usernameInput.trim().length === 0}
          >
            Find
          </Button>
        </form>

        {lookup === null ? (
          <p className="text-ink-dim text-lg">
            Look a trainer up to see the cats they have available.
          </p>
        ) : roster.isLoading ? (
          <p className="text-ink-dim text-lg">Knocking on the door…</p>
        ) : roster.error ? (
          <p className="text-pink text-lg">{roster.error.message}</p>
        ) : theirCats.length === 0 ? (
          <p className="text-ink-dim text-lg">
            {roster.data?.trainer.displayName} has no cats available to trade.
          </p>
        ) : (
          <>
            <Step
              index={1}
              label={`Pick a cat from ${roster.data?.trainer.displayName}`}
            />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {theirCats.map((creature) => (
                <li key={creature.id}>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setTheirId(creature.id)}
                  >
                    <CreatureCard
                      creature={creature}
                      spriteSize={56}
                      selected={theirId === creature.id}
                    />
                  </button>
                </li>
              ))}
            </ul>

            {theirId ? (
              <>
                <Step index={2} label="Offer one of yours" />
                {myCats.length === 0 ? (
                  <p className="text-ink-dim text-lg">
                    You have no idle cats to offer.
                  </p>
                ) : !mine.data?.canOfferAny ? (
                  <p className="text-pink text-lg">
                    You must keep at least one cat.
                  </p>
                ) : (
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {myCats.map((creature) => (
                      <li key={creature.id}>
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => setMyId(creature.id)}
                        >
                          <CreatureCard
                            creature={creature}
                            spriteSize={56}
                            selected={myId === creature.id}
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : null}

            {ready ? (
              <div className="panel-flat space-y-2 p-3">
                <label className="block space-y-1">
                  <span className="text-pixel text-ink-dim text-[8px] uppercase">
                    Message (optional)
                  </span>
                  <input
                    value={message}
                    maxLength={140}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Fair swap?"
                    className="border-edge bg-navy-deep text-ink focus:border-gold w-full border-2 px-2 py-1 text-base outline-none"
                  />
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      propose.mutate({
                        receiverId: roster.data?.trainer.id,
                        myCreatureId: myId,
                        theirCreatureId: theirId,
                        message:
                          message.trim().length > 0
                            ? message.trim()
                            : undefined,
                      })
                    }
                    disabled={propose.isPending}
                  >
                    {propose.isPending ? "Sending…" : "Send offer"}
                  </Button>
                  <Button variant="ghost" onClick={reset}>
                    Start over
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Panel>
  );
}

function Step({ index, label }: { index: number; label: string }) {
  return (
    <p className="text-pixel text-gold text-[9px]">
      {index}. <span className="text-ink">{label}</span>
    </p>
  );
}
