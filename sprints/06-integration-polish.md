# Sprint 06 — Integration & Polish

**Mode:** sequential, after 02–05 are merged into the working tree. Read all sprint files.

## Goal
Everything works together as one retro, mobile-friendly dashboard; seeds, README, and quality gates are complete.

## Tasks

1. **Home dashboard (`src/app/page.tsx`)**: wallet (gold, gems, materials), active expedition card (zone, timer, pending encounters, quick Claim), latest 5 pulls with sprites, ladder rank + rating + attacks left today, pending incoming trades count, quick links. Empty states for new players ("Summon your first cat!").
2. **Seeds**: wire `seed-battle.ts` and `seed-market.ts` into `pnpm db:seed` (single idempotent command; order: users/creatures → defense teams → listings).
3. **Collection integration**: show `UpgradeButton` (Sprint 03) on creature detail; show status chips (On expedition / Listed / In trade) and a link to where the cat is.
4. **Cross-cutting**: consistent toasts/errors (one small `useToast` or inline error pattern), loading skeletons on every page, `AppShell` wallet chips refresh after mutations (invalidate `auth.me`), 404 for missing creature/listing/battle.
5. **Retro pass**: verify pixel font on headings, `.panel` hard shadows, rarity glows, element badge colors, sprite rendering crisp at 2× and 3× sizes; add a subtle scanline overlay toggle (off by default) if cheap.
6. **Mobile**: check every page at 375px and 768px; bottom nav never overlaps content (padding-bottom); modals scroll.
7. **README**: full run instructions, feature list, screenshots section placeholder, sprint links, test/check commands.
8. **Quality gates**: `pnpm check`, `pnpm test`, `pnpm build` green. Boot `pnpm dev` and run the end-to-end script manually with `curl`/tRPC or the browser: signup → 10-pull → start expedition → claim → set defense → attack a bot → ladder → list a cat → buy with `demo` account → trade proposal + accept.
9. Fix any bugs found; keep fixes minimal and within the relevant sprint's files.

## Done when
Commit `feat: sprint 06 integration and polish` (no co-author line).
