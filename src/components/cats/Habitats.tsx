import { PixelIcon } from "~/components/PixelIcon";
import { ROW_ICONS } from "~/components/sprites/icons";
import { ROW_LABELS, type Row } from "~/server/game/cats";

/** The lime the lanes' own marks are filled with. */
const LIME = "#d8ff4f";

/**
 * How wide the footer has to be before the lanes are named as well as drawn,
 * by how many there are. Narrower than this they are marks alone.
 */
const WORDS: Record<number, string> = {
  1: "@[3.25rem]:inline",
  2: "@[6.75rem]:inline",
  3: "@[10rem]:inline",
};

/** A lane's mark, as it is on the lane's own tile. The Hunt's paw is all ink. */
export function HabitatIcon({
  row,
  size = 16,
  className,
}: {
  row: Row;
  size?: number;
  className?: string;
}) {
  return (
    <PixelIcon
      name={ROW_ICONS[row]}
      size={size}
      fill={LIME}
      className={className}
    />
  );
}

function habitatsLabel(rows: readonly Row[]): string {
  const names = rows.map((row) => `the ${ROW_LABELS[row]}`);
  const last = names.pop() ?? "";
  return `Lives in ${names.length > 0 ? `${names.join(", ")} or ` : ""}${last}`;
}

/**
 * The lanes a cat can be played into, as the lanes' own marks with their
 * names beside them. Where the names will not fit (three lanes on a narrow
 * card, a card in the fan) the marks stand alone. It is read out as one
 * sentence, and takes whatever width its row has to spare.
 */
export function Habitats({
  rows,
  className = "",
}: {
  rows: readonly Row[];
  className?: string;
}) {
  const words = WORDS[rows.length] ?? "";
  return (
    <span className={`@container min-w-0 flex-1 ${className}`}>
      <span
        role="img"
        aria-label={habitatsLabel(rows)}
        className="text-ink-soft flex items-center [justify-content:inherit] gap-x-2 text-[11px] leading-4 font-bold"
      >
        {rows.map((row) => (
          <span
            key={row}
            title={ROW_LABELS[row]}
            className="flex shrink-0 items-center gap-[3px]"
          >
            <HabitatIcon row={row} />
            <span className={`hidden ${words}`}>{ROW_LABELS[row]}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
