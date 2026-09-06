"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Panel, CreatureCard } from "~/components/ui";
import { ELEMENT_LABELS, ELEMENTS, type Element } from "~/server/game/elements";
import { RARITIES, RARITY_LABELS, type Rarity } from "~/server/game/species";
import { api } from "~/trpc/react";

const STATUSES = ["idle", "expedition", "listed", "trading"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_LABELS: Record<Status, string> = {
  idle: "Idle",
  expedition: "On expedition",
  listed: "Listed",
  trading: "In trade",
};

const SORTS = ["power", "level", "rarity", "newest"] as const;
type Sort = (typeof SORTS)[number];

const SORT_LABELS: Record<Sort, string> = {
  power: "Power",
  level: "Level",
  rarity: "Rarity",
  newest: "Newest",
};

const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export function CollectionGrid() {
  const creatures = api.creatures.list.useQuery(undefined, { retry: false });

  const [element, setElement] = useState<Element | "all">("all");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [sort, setSort] = useState<Sort>("power");

  const rows = useMemo(() => {
    const list = (creatures.data ?? []).filter(
      (c) =>
        (element === "all" || c.species.element === element) &&
        (rarity === "all" || c.species.rarity === rarity) &&
        (status === "all" || c.status === status),
    );

    return list.sort((a, b) => {
      switch (sort) {
        case "level":
          return b.level - a.level || b.power - a.power;
        case "rarity":
          return (
            RARITY_ORDER[b.species.rarity] - RARITY_ORDER[a.species.rarity] ||
            b.power - a.power
          );
        case "newest":
          return b.obtainedAt.getTime() - a.obtainedAt.getTime();
        default:
          return b.power - a.power;
      }
    });
  }, [creatures.data, element, rarity, status, sort]);

  return (
    <div className="space-y-4">
      <Panel
        title="Collection"
        action={
          <span className="text-pixel text-[8px] text-ink-dim">
            {rows.length}/{creatures.data?.length ?? 0}
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select
            label="Element"
            value={element}
            onChange={(v) => setElement(v as Element | "all")}
            options={[
              ["all", "All"],
              ...ELEMENTS.map((e) => [e, ELEMENT_LABELS[e]] as const),
            ]}
          />
          <Select
            label="Rarity"
            value={rarity}
            onChange={(v) => setRarity(v as Rarity | "all")}
            options={[
              ["all", "All"],
              ...RARITIES.map((r) => [r, RARITY_LABELS[r]] as const),
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as Status | "all")}
            options={[
              ["all", "All"],
              ...STATUSES.map((s) => [s, STATUS_LABELS[s]] as const),
            ]}
          />
          <Select
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            options={SORTS.map((s) => [s, SORT_LABELS[s]] as const)}
          />
        </div>
      </Panel>

      {creatures.isLoading ? (
        <Panel>
          <p className="text-lg text-ink-dim">Rounding up the cats…</p>
        </Panel>
      ) : rows.length === 0 ? (
        <Panel>
          <p className="text-lg text-ink-dim">
            Nothing matches those filters.{" "}
            <Link href="/summon" className="text-mint underline">
              Summon more cats
            </Link>
            .
          </p>
        </Panel>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((creature) => (
            <li key={creature.id}>
              <Link href={`/collection/${creature.id}`} className="block">
                <CreatureCard creature={creature} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="block space-y-1">
      <span className="text-pixel text-[8px] text-ink-dim uppercase">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-edge bg-navy-deep px-1 py-1 text-base text-ink outline-none focus:border-gold"
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
