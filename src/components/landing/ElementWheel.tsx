"use client";

import { useEffect, useState } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import { Panel } from "~/components/ui";
import {
  ELEMENT_LABELS,
  elementMultiplier,
  type Element,
} from "~/server/game/elements";
import {
  ATTACKS_PER_DAY,
  MAX_TEAM_SIZE,
  RATING_TIERS,
  STARTING_RATING,
  ratingTier,
} from "~/server/game/rating";
import { speciesByElement } from "~/server/game/species";
import {
  SECTION_GAP,
  SECTION_RHYTHM,
  SECTION_SHELL,
  SectionHeading,
} from "./LandingSection";
import { useLoopWhileSeen } from "./useLoopWhileSeen";

/** The four elements on the ring, in the order the advantage flows. */
const RING: readonly Element[] = ["flame", "thorn", "volt", "mist"];
/** The one that refuses to join it. */
const OUTSIDER: Element = "shade";

/** One stop of the highlight per this many milliseconds. */
const ADVANCE_MS = 900;

interface Point {
  x: number;
  y: number;
}

const CENTRE: Point = { x: 150, y: 150 };
const RING_RADIUS = 92;
const NODE_RADIUS = 26;
const SPRITE_SIZE = 32;

/** Ring nodes clockwise from the top, so the arrows run clockwise too. */
const NODE_POINTS: readonly Point[] = [
  { x: 150, y: 58 },
  { x: 242, y: 150 },
  { x: 150, y: 242 },
  { x: 58, y: 150 },
];

/** Where each element's name sits, clear of its own circle. */
const NAME_POINTS: readonly Point[] = [
  { x: 150, y: 20 },
  { x: 242, y: 196 },
  { x: 150, y: 292 },
  { x: 58, y: 196 },
];

const SHADE_POINT: Point = { x: 312, y: 58 };

/**
 * The type chart and the ladder, side by side: the two rules a genre-literate
 * visitor will want before they commit to a squad. Every percentage on it is
 * `elementMultiplier` doing the talking.
 */
export function ElementWheel() {
  const seen = useLoopWhileSeen<HTMLElement>();
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  // The highlight only runs while the wheel is on screen and the tab is up.
  const playing = seen.active;
  useEffect(() => {
    if (!playing || reducedMotion) return;
    setStarted(true);
    const timer = setInterval(
      () => setStep((current) => (current + 1) % RING.length),
      ADVANCE_MS,
    );
    return () => clearInterval(timer);
  }, [playing, reducedMotion]);

  // Before the wheel has ever run — and always under reduced motion — every
  // arrow is lit, so the chart is complete without the animation.
  const activeIndex = reducedMotion || !started ? null : step;

  const startingTier = ratingTier(STARTING_RATING);

  return (
    <section
      ref={seen.ref}
      aria-labelledby="type-chart-heading"
      className={`${SECTION_SHELL} ${SECTION_RHYTHM} ${SECTION_GAP}`}
    >
      <SectionHeading
        titleId="type-chart-heading"
        title="Flame burns thorn. Thorn tangles volt. Volt fries mist. Mist douses flame."
        intro="Shade never joined the wheel. It hits everything a little harder and takes it back the same way."
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="panel space-y-3 p-3">
          <Wheel activeIndex={activeIndex} />
          <p className="text-ink-dim text-lg leading-snug">
            Attack along an arrow for{" "}
            <span className="text-ink tabular-nums">
              {formatDelta(elementMultiplier("flame", "thorn"))}
            </span>
            . Attack against it for{" "}
            <span className="text-ink tabular-nums">
              {formatDelta(elementMultiplier("thorn", "flame"))}
            </span>
            . Everything else lands flat.
          </p>
        </div>

        <Panel title="The ladder" className="h-full" bodyClassName="space-y-3">
          <ol className="border-edge divide-edge divide-y-2 border-2">
            {RATING_TIERS.map((tier) => (
              <li
                key={tier.label}
                className="flex items-baseline justify-between gap-3 px-2 py-2"
              >
                <span className="text-pixel text-ink text-[9px] leading-relaxed">
                  {tier.label}
                </span>
                <span className="flex items-baseline gap-2">
                  {tier.label === startingTier ? (
                    <span className="text-pixel text-pink text-[7px] uppercase">
                      You start here
                    </span>
                  ) : null}
                  <span className="text-gold text-lg tabular-nums">
                    {tier.min}+
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <ul className="text-ink-dim space-y-1 text-lg leading-snug">
            <li>
              Start at{" "}
              <span className="text-ink tabular-nums">{STARTING_RATING}</span>.
            </li>
            <li>
              <span className="text-ink tabular-nums">{ATTACKS_PER_DAY}</span>{" "}
              attacks a day.
            </li>
            <li>
              Teams of up to{" "}
              <span className="text-ink tabular-nums">{MAX_TEAM_SIZE}</span>.
            </li>
          </ul>
        </Panel>
      </div>
    </section>
  );
}

interface WheelProps {
  /** Index into {@link RING} of the lit arrow, or `null` to light them all. */
  activeIndex: number | null;
}

function Wheel({ activeIndex }: WheelProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 360 330"
      className="block h-auto w-full"
      aria-label="Element advantage wheel"
    >
      <title>Element advantage wheel</title>
      <desc>{describeWheel()}</desc>

      <defs>
        {RING.map((element) => (
          <marker
            key={element}
            id={`wheel-head-${element}`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M1,1 L11,6 L1,11 Z"
              fill={ELEMENT_PALETTES[element]["1"]}
            />
          </marker>
        ))}
      </defs>

      {/* The ring the four of them stand on. */}
      <circle
        cx={CENTRE.x}
        cy={CENTRE.y}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={2}
        strokeDasharray="4 6"
        style={{ stroke: "var(--color-edge)" }}
      />

      {RING.map((attacker, index) => {
        const defender = RING[(index + 1) % RING.length] ?? attacker;
        const from = NODE_POINTS[index] ?? CENTRE;
        const to = NODE_POINTS[(index + 1) % RING.length] ?? CENTRE;
        const line = chord(from, to);
        const label = inwardOf(midpoint(from, to), 45);
        const colour = ELEMENT_PALETTES[attacker]["1"];
        const lit = activeIndex === null || activeIndex === index;

        return (
          <g
            key={attacker}
            /* One step, no tween: the highlight lands or it does not. */
            style={{
              opacity: lit ? 1 : 0.28,
              transition: "opacity 200ms steps(1, end)",
            }}
          >
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={colour}
              strokeWidth={3}
              markerEnd={`url(#wheel-head-${attacker})`}
            />
            <text
              x={label.x}
              y={label.y}
              className="text-pixel"
              fontSize={8}
              textAnchor="middle"
              fill={colour}
            >
              {formatDelta(elementMultiplier(attacker, defender))}
            </text>
          </g>
        );
      })}

      {RING.map((element, index) => (
        <ElementNode
          key={element}
          element={element}
          at={NODE_POINTS[index] ?? CENTRE}
          nameAt={NAME_POINTS[index] ?? CENTRE}
        />
      ))}

      {/* Shade, kept outside the ring on purpose. */}
      <line
        x1={289}
        y1={71}
        x2={253}
        y2={92}
        strokeWidth={2}
        strokeDasharray="4 6"
        style={{ stroke: "var(--color-edge)" }}
      />
      <ElementNode
        element={OUTSIDER}
        at={SHADE_POINT}
        nameAt={{ x: SHADE_POINT.x, y: SHADE_POINT.y + 46 }}
      />
      <text
        x={SHADE_POINT.x}
        y={SHADE_POINT.y + 68}
        className="text-pixel"
        fontSize={8}
        textAnchor="middle"
        fill={ELEMENT_PALETTES[OUTSIDER]["1"]}
      >
        {formatDelta(elementMultiplier(OUTSIDER, "flame"))} dealt
      </text>
      <text
        x={SHADE_POINT.x}
        y={SHADE_POINT.y + 84}
        className="text-pixel"
        fontSize={8}
        textAnchor="middle"
        fill={ELEMENT_PALETTES[OUTSIDER]["1"]}
      >
        and taken
      </text>
    </svg>
  );
}

interface ElementNodeProps {
  element: Element;
  at: Point;
  nameAt: Point;
}

function ElementNode({ element, at, nameAt }: ElementNodeProps) {
  const colour = ELEMENT_PALETTES[element]["1"];
  const representative = speciesByElement(element)[0];

  return (
    <g>
      <circle
        cx={at.x}
        cy={at.y}
        r={NODE_RADIUS}
        stroke={colour}
        strokeWidth={3}
        style={{ fill: "var(--color-navy-deep)" }}
      />
      {representative ? (
        <g
          transform={`translate(${at.x - SPRITE_SIZE / 2} ${at.y - SPRITE_SIZE / 2})`}
        >
          <PixelSprite speciesId={representative.id} size={SPRITE_SIZE} />
        </g>
      ) : null}
      <text
        x={nameAt.x}
        y={nameAt.y}
        className="text-pixel"
        fontSize={9}
        textAnchor="middle"
        fill={colour}
      >
        {ELEMENT_LABELS[element]}
      </text>
    </g>
  );
}

/** Trims a line between two node centres back to their edges. */
function chord(from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const gap = NODE_RADIUS + 6;

  return {
    x1: from.x + ux * gap,
    y1: from.y + uy * gap,
    x2: to.x - ux * (gap + 6),
    y2: to.y - uy * (gap + 6),
  };
}

function midpoint(from: Point, to: Point): Point {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

/** Pulls a point towards the middle of the wheel, onto a radius of `radius`. */
function inwardOf(point: Point, radius: number): Point {
  const dx = point.x - CENTRE.x;
  const dy = point.y - CENTRE.y;
  const length = Math.hypot(dx, dy) || 1;

  return {
    x: CENTRE.x + (dx / length) * radius,
    y: CENTRE.y + (dy / length) * radius + 3,
  };
}

/** `1.25` → `+25%`, `0.75` → `−25%`. Never typed by hand. */
function formatDelta(multiplier: number): string {
  const percent = Math.round((multiplier - 1) * 100);
  if (percent === 0) return "±0%";
  return `${percent > 0 ? "+" : "−"}${Math.abs(percent)}%`;
}

/** The same chart, spelled out for anyone who cannot see it. */
function describeWheel(): string {
  const ring = RING.map((attacker, index) => {
    const defender = RING[(index + 1) % RING.length] ?? attacker;
    return `${ELEMENT_LABELS[attacker]} hits ${ELEMENT_LABELS[defender]} for ${formatDelta(
      elementMultiplier(attacker, defender),
    )}, and ${ELEMENT_LABELS[defender]} hits back for ${formatDelta(
      elementMultiplier(defender, attacker),
    )}`;
  }).join(". ");

  return `${ring}. ${ELEMENT_LABELS[OUTSIDER]} sits outside the ring: ${formatDelta(
    elementMultiplier(OUTSIDER, "flame"),
  )} dealt to every other element and ${formatDelta(
    elementMultiplier("flame", OUTSIDER),
  )} taken from them.`;
}
