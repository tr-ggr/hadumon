import { IconSvg } from "./PixelIcon";
import { relicFill } from "./sprites/palettes";
import { relicGrid } from "./sprites/relics";

export interface RelicIconProps {
  relicId: string;
  /** Rendered edge length in CSS pixels; a multiple of 16 stays crisp. */
  size?: number;
  className?: string;
}

/**
 * A relic's own drawing. Decoration: the relic's name always stands beside
 * it, so it is hidden from assistive tech.
 */
export function RelicIcon({ relicId, size = 32, className }: RelicIconProps) {
  return (
    <IconSvg
      rows={relicGrid(relicId)}
      size={size}
      fill={relicFill(relicId)}
      className={className}
    />
  );
}
