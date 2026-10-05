import type { ReactNode } from "react";

import { RelicIcon } from "~/components/RelicIcon";
import { getRelic } from "~/server/game/relics";
import { lockedText, type CodexEntry } from "./entries";

interface PieceProps {
  name: string;
  /** The rules text, or the unlock hint while locked. */
  text: string;
  locked: boolean;
  mark?: ReactNode;
}

/** A relic as a tile on the board, like the ones a run carries. */
function Piece({ name, text, locked, mark }: PieceProps) {
  return (
    <li
      className={`piece border-ink text-ink flex flex-col gap-1.5 border-2 bg-white p-3 ${locked ? "opacity-60" : ""}`}
    >
      <p className="text-print flex items-center gap-2 text-xl">
        {mark}
        <span className="min-w-0 break-words">{name}</span>
      </p>
      <p className="text-xs leading-snug">{text}</p>
    </li>
  );
}

interface PieceListProps {
  /** One page's worth of a chapter. */
  entries: readonly CodexEntry[];
  /** The grid the page lays them out on. */
  className: string;
}

export function RelicList({ entries, className }: PieceListProps) {
  return (
    <ul className={className}>
      {entries.map((entry) => {
        const relic = getRelic(entry.id);
        return (
          <Piece
            key={entry.id}
            name={relic.name}
            text={entry.unlocked ? relic.text : lockedText(entry)}
            locked={!entry.unlocked}
            mark={
              <RelicIcon
                relicId={entry.id}
                className={entry.unlocked ? "" : "grayscale"}
              />
            }
          />
        );
      })}
    </ul>
  );
}
