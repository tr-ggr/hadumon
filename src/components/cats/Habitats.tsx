import { PixelIcon } from "~/components/PixelIcon";
import { ROW_ICONS } from "~/components/sprites/icons";
import { ROW_LABELS, type Row } from "~/server/game/cats";

/** The lime the lanes' own marks are filled with. */
const LIME = "#d8ff4f";

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

/**
 * The lanes a cat can be played into, as one sentence: what its card's tab
 * shows as marks, for where the marks are not read out or have to be said.
 */
export function habitatsLabel(rows: readonly Row[]): string {
  const names = rows.map((row) => `the ${ROW_LABELS[row]}`);
  const last = names.pop() ?? "";
  return `Lives in ${names.length > 0 ? `${names.join(", ")} or ` : ""}${last}`;
}
