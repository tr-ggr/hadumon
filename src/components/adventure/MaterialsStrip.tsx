import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import { ELEMENT_LABELS, ELEMENTS, type Element } from "~/server/game/elements";

export interface MaterialsStripProps {
  materials: Readonly<Record<Element, number>> | undefined;
  /** Highlights the element the current zone drops. */
  highlight?: Element;
  className?: string;
}

/** The five shard counts, one chip per element. Works down to 375px. */
export function MaterialsStrip({
  materials,
  highlight,
  className = "",
}: MaterialsStripProps) {
  return (
    <ul className={`grid grid-cols-5 gap-1 sm:gap-2 ${className}`}>
      {ELEMENTS.map((element) => {
        const palette = ELEMENT_PALETTES[element];
        const active = highlight === element;

        return (
          <li
            key={element}
            className="panel-flat flex flex-col items-center gap-0.5 px-1 py-1.5"
            style={{
              borderColor: active ? palette["1"] : undefined,
              boxShadow: active ? `0 0 6px ${palette["1"]}` : undefined,
            }}
            title={`${ELEMENT_LABELS[element]} Shard`}
          >
            <span
              aria-hidden
              className="block h-3 w-3 border"
              style={{
                backgroundColor: palette["1"],
                borderColor: palette["2"],
              }}
            />
            <span className="text-pixel text-ink-dim text-[6px] uppercase">
              {ELEMENT_LABELS[element]}
            </span>
            <span className="text-ink text-base leading-none tabular-nums">
              {materials?.[element] ?? 0}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
