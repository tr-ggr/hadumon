# Sprint 12 — The cats, the codex, the home

Read `sprints/08-roguelike-overview.md`, `sprints/10-engine.md` and `PRODUCT.md` first.

## You own

`src/components/sprites/**`, `src/app/codex/**`, `src/components/codex/**`, `src/app/HomeDashboard.tsx`. Nothing else. Do not edit the engine, the routers, `src/components/cats/**`, `src/components/ui/**`, `src/components/PixelSprite.tsx`, `src/app/run/**` or `src/components/run/**`.

## 1. Draw the other 20 cats

`src/components/sprites/cats.ts` holds a 16x16 base sprite and a patch list per cat. Five cats are drawn (Flameclaw, Mistpaw, Voltwhisk, Thornkit, Nyxaroth) and the user approved that look: chibi, front-facing, near-black outline, three fur tones per element, rarity-tinted eyes. The other 20 currently fall back to the bare base. Give each its own patches.

- Keep the base head and body. A cat is told apart by a few pixels: ear shape, a forehead or cheek marking, an accessory on the head, the tail tip, paws, a chest patch. Read each cat's `flavor`, `archetype` and `element` in `src/server/game/cats.ts` and draw from them (Bramblepaw has burrs, Verdantmane has moss on its shoulders, Aurelynx wears gilded plate, Infernomane has a mane).
- Two cats of the same element must not look alike at 32px. Colour comes from the element and rarity automatically; your job is the silhouette and markings.
- Higher rarity may carry more detail (horns, mane, plate, extra tails), still inside 16x16.
- Stay within the legend (`.` `o` `1` `2` `3` `e` `w`). Keep the eyes and muzzle readable; do not move them.
- Look at your work. Render every cat to a contact sheet (a throwaway script that prints each grid as block characters is enough; a browser screenshot at 32px and 96px is better) and fix what reads as noise. Do not commit the throwaway script.
- Extend `cats.test.ts`: every cat has patches, and no two cats share an identical grid.

## 2. Codex: `/codex`

`api.codex.get` returns `{ cats, relics, clans }`, each `{ id, unlocked, hint }[]`. The catalogue text comes from the engine by id (`getCat`, `getRelic`, `CLANS`, `RIVAL_LIST`).

- Sections: Cats (with a count, "18 of 25"), Relics, Clans, Rivals.
- Cats: a grid of `CatCard`s. Locked cats pass `lockedHint` so the card shows how to unlock it instead of its rules. Filter by element and by rarity; filters are local state. Tapping an unlocked cat opens a `Modal` with `<CatCard variant="full">`.
- Relics and clans: name and text, or the hint while locked.
- Rivals: all six in gauntlet order with flavor, trait, and what their cards do in numbers (bank value, yarn per stash, dice per raid, cards per burn). Bosses are marked. Rivals are never locked.
- Loading, error and empty filter states.

## 3. Home: `/` signed in

`HomeDashboard` is the page a returning player lands on. It answers one question: what do I do now?

- A run in progress (`api.run.current`): which rival is next or being played (match `n` of 6), the clan, and one primary action, "Continue run", to `/run`.
- No run: one primary action, "Start a run", to `/run`.
- Recent runs from `api.run.history({ limit: 5 })`: clan, outcome, matches won of 6, score, and when. An empty state for a new account.
- Codex progress in one line (cats and relics unlocked) linking to `/codex`.
- Prefetch these in `src/app/page.tsx`'s existing pattern only if you can do it without editing files you do not own; otherwise fetch client-side with skeletons.

## Look

Use the existing tokens and `ui/` primitives. Game pieces are hard-edged with a 2px `border-ink`, as `CatCard` already is; page chrome keeps the rounded panels. No new colours, no emoji, no gradients. Everything works at 375px with no sideways scroll. Copy is dry and short, in the voice of the flavor text.

## Done when

- `pnpm check` and `pnpm test` pass.
- In a real browser (playwright-cli is available; `pnpm dev` on a port other than 3000 and 3009, log in as `demo` / `demo1234`), at 375px and 1280px: `/` and `/codex` render with no console errors and no sideways scroll; filters work; a locked cat shows its hint; the full card opens and closes.
- Stop the dev server when done.
- Small conventional commits, no co-author lines, `git add` only your own files by explicit path.

Report: what you built, how you checked the sprites and what you changed after looking, what you verified in the browser and at which widths, and anything you could not verify.
