"use client";

import { ElementMark } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { ROW_ICONS } from "~/components/sprites/icons";
import { Modal } from "~/components/ui";
import { getCat, ROW_LABELS, ROWS } from "~/server/game/cats";
import { LEVEL_COUNT } from "~/server/game/difficulty";
import { ESSENCES, SLOTS } from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { plural } from "./describe";
import {
  CORAL,
  EssenceToken,
  Label,
  Pile,
  RelicTiles,
  TableButton,
  YarnTrack,
} from "./pieces";

/**
 * The rival's side of the table, opened over the player's own: its three
 * lanes with every cat on them and what each holds, its tray, its food and
 * its relic. Its hand and its deck stay face down and are counted. Nothing
 * here can be acted on; it is the same board the rival's turns are played on.
 */
export function RivalMat({
  match,
  open,
  onClose,
}: {
  match: MatchView;
  open: boolean;
  onClose: () => void;
}) {
  const rival = getRival(match.rivalId);
  const seat = match.rival;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={`${rival.name}'s board`}
      footer={
        <TableButton size="md" data-autofocus onClick={onClose}>
          Back to the table
        </TableButton>
      }
    >
      <div className="text-ink space-y-3">
        <p className="text-sm leading-snug">
          <span className="border-ink bg-coral mr-1.5 border-2 px-1 font-black">
            Level {seat.level + 1} of {LEVEL_COUNT}
          </span>
          {rival.trait} It plays by your rules, on its own deck.
        </p>

        <ol className="mat divide-sky-deep flex flex-col divide-y-2">
          {ROWS.map((row) => (
            <li
              key={row}
              className="grid items-center gap-x-3 gap-y-2 px-2 py-2 sm:grid-cols-[6.5rem_minmax(0,1fr)]"
            >
              <p className="flex items-center gap-2 text-sm font-black">
                <PixelIcon name={ROW_ICONS[row]} size={24} fill={CORAL} />
                {ROW_LABELS[row]}
              </p>
              <ul
                aria-label={`${rival.name}'s ${ROW_LABELS[row]}, ${plural(seat.board[row].length, "cat")}`}
                className="grid grid-cols-4 gap-1.5"
              >
                {Array.from({ length: SLOTS }, (_, col) => {
                  const placed = seat.board[row][col];
                  if (!placed) {
                    return (
                      <li
                        key={col}
                        aria-hidden
                        className="border-sky-deep min-h-20 border-2 border-dashed"
                      />
                    );
                  }
                  const cat = getCat(placed.catId);
                  return (
                    <li
                      key={col}
                      className="piece border-ink bg-cream relative flex min-h-20 flex-col items-center justify-center gap-1 border-2 px-0.5 py-1 text-center"
                    >
                      <span className="absolute top-0.5 left-1 flex">
                        <ElementMark element={cat.element} />
                      </span>
                      <PixelSprite catId={placed.catId} size={40} decorative />
                      <span className="w-full text-[10px] leading-tight font-black [overflow-wrap:anywhere] sm:text-[11px]">
                        {cat.name}
                      </span>
                      <YarnTrack
                        held={placed.yarn}
                        cap={cat.yarnCap}
                        owner="rival"
                        size={16}
                        className="justify-center"
                      />
                      {placed.cached > 0 || placed.tucked > 0 ? (
                        <span className="text-[11px] leading-none font-bold tabular-nums">
                          {placed.cached > 0 ? `Cached ${placed.cached}` : ""}
                          {placed.cached > 0 && placed.tucked > 0 ? " · " : ""}
                          {placed.tucked > 0 ? `Tucked ${placed.tucked}` : ""}
                        </span>
                      ) : null}
                      <span className="sr-only">
                        , {cat.points} points, {placed.yarn} of {cat.yarnCap}{" "}
                        yarn
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>

        <div className="grid gap-3 sm:grid-cols-2">
          <section aria-label={`${rival.name}'s cards`} className="space-y-2">
            <Label>Hand, deck and tray</Label>
            <div className="flex items-center gap-2.5">
              <Pile count={seat.handCount} owner="rival" label="Its hand" />
              <Pile count={seat.deckCount} owner="rival" label="Its deck" />
              <Pile
                count={seat.discardCount}
                owner="rival"
                label="Its discard"
                faceUp
              />
              <p className="text-xs leading-snug font-bold">
                {plural(seat.handCount, "cat")} in hand, face down.
                <br />
                {plural(seat.deckCount, "card")} in its deck.
              </p>
            </div>
            <p className="text-xs leading-snug">
              <span className="font-bold">Tray:</span>{" "}
              {seat.tray.length > 0
                ? seat.tray.map((id) => getCat(id).name).join(", ")
                : "empty"}
              .
            </p>
          </section>
          <section
            aria-label={`${rival.name}'s food and relic`}
            className="space-y-2"
          >
            <Label>Food</Label>
            <ul className="flex flex-wrap items-center gap-x-1 gap-y-2">
              {ESSENCES.map((kind) => (
                <EssenceToken
                  key={kind}
                  kind={kind}
                  count={seat.essence[kind]}
                />
              ))}
            </ul>
            <RelicTiles relicIds={seat.relics} />
          </section>
        </div>
      </div>
    </Modal>
  );
}
