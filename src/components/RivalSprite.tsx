import { getRival } from "~/server/game/rival";

import { SpriteSvg } from "./PixelSprite";
import { rivalColors } from "./sprites/palettes";
import { rivalSprite } from "./sprites/rivals";

export interface RivalSpriteProps {
  rivalId: string;
  /** Rendered edge length in CSS pixels. Defaults to 64. */
  size?: number;
  className?: string;
  /** Hides the sprite from assistive tech when it only repeats nearby text. */
  decorative?: boolean;
}

/**
 * A rival's pixel sprite, in the rival coral. Drawn exactly as a cat's is,
 * so the two sit side by side at the same pixel size.
 */
export function RivalSprite({
  rivalId,
  size = 64,
  className,
  decorative = false,
}: RivalSpriteProps) {
  const rival = getRival(rivalId);
  return (
    <SpriteSvg
      rows={rivalSprite(rivalId)}
      colors={rivalColors()}
      name={rival.name}
      label={`${rival.name} pixel sprite`}
      size={size}
      className={className}
      decorative={decorative}
    />
  );
}
