/** A box on the screen: its top left corner and how wide it is. */
export interface Box {
  left: number;
  top: number;
  width: number;
}

/**
 * The transform that holds a dialog over the place it was taken from. It puts
 * `anchor`, a box inside `panel`, on top of `from`, at `from`'s width, with
 * one scale both ways, so nothing in the panel is stretched. Written for a
 * transform origin of `0 0`; all three boxes are measured with the panel at
 * rest.
 */
export function popTransform(from: Box, panel: Box, anchor: Box): string {
  const scale = anchor.width > 0 ? from.width / anchor.width : 1;
  const x = from.left - panel.left - (anchor.left - panel.left) * scale;
  const y = from.top - panel.top - (anchor.top - panel.top) * scale;
  return `translate(${round(x)}px, ${round(y)}px) scale(${round(scale, 4)})`;
}

function round(value: number, places = 2): number {
  const unit = 10 ** places;
  return Math.round(value * unit) / unit;
}
