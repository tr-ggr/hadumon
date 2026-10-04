import type { ReactNode } from "react";

import { ElementMark } from "~/components/cats/CatCard";
import { getRelic } from "~/server/game/relics";
import { CLANS, isClanId } from "~/server/game/run";
import { lockedText, type CodexEntry } from "./entries";

interface PieceProps {
  name: string;
  /** The rules text, or the unlock hint while locked. */
  text: string;
  locked: boolean;
  mark?: ReactNode;
}

/** A relic or a clan drawn as a game piece: hard-edged, like a cat card. */
function Piece({ name, text, locked, mark }: PieceProps) {
  return (
    <li
      className={`border-ink bg-cream text-ink flex flex-col gap-1.5 border-2 p-3 ${locked ? "opacity-60" : ""}`}
    >
      <p className="text-pixel flex items-center gap-2 text-sm leading-tight">
        {mark}
        <span className="min-w-0 break-words">{name}</span>
      </p>
      <p className="text-xs leading-snug">{text}</p>
    </li>
  );
}

const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";

export function RelicList({ entries }: { entries: readonly CodexEntry[] }) {
  return (
    <ul className={GRID}>
      {entries.map((entry) => {
        const relic = getRelic(entry.id);
        return (
          <Piece
            key={entry.id}
            name={relic.name}
            text={entry.unlocked ? relic.text : lockedText(entry)}
            locked={!entry.unlocked}
          />
        );
      })}
    </ul>
  );
}

export function ClanList({ entries }: { entries: readonly CodexEntry[] }) {
  return (
    <ul className={GRID}>
      {entries.filter(isClanEntry).map((entry) => {
        const clan = CLANS[entry.id];
        return (
          <Piece
            key={entry.id}
            name={clan.name}
            text={entry.unlocked ? clan.text : lockedText(entry)}
            locked={!entry.unlocked}
            mark={<ElementMark element={clan.id} />}
          />
        );
      })}
    </ul>
  );
}

function isClanEntry(
  entry: CodexEntry,
): entry is CodexEntry & { id: keyof typeof CLANS } {
  return isClanId(entry.id);
}
