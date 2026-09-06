---
version: 1
slug: "src-components-landing-landingpage-tsx"
primary_target: "src/components/landing/LandingPage.tsx"
related_targets: ["src/app/page.tsx"]
---

# Landing page — surface brief

Scope: the logged-out root route `/`, rendered by `src/components/landing/LandingPage.tsx`. Visitor mode: Persuade. Build path: code-led.

Audience: idle/gacha genre fans arriving from a shared link. Job: understand HaduMon's twist in seconds and start pulling. Action: create an account (lands on `/summon` with 1000 gems). Proof: live game components from seed data, real screenshots, real roster stats. Constraints: no fabricated testimonials, counts, or press; every number derives from `src/server/game/*`; no new dependencies, palette, or fonts; mobile-first at 375px.

Memorable moment: a working ten-pull in the hero before any account exists.

## Direction contract

THESIS: The hero is the Summoning Hub itself, live and playable before an account exists. It refuses headline + screenshot + feature grid.

OWN-WORLD: The game's own chrome unchanged: indigo ground, violet 2px-edged panels with hard black offsets, gold Press Start 2P kickers, VT323 body, rarity glows, stepped motion. One new register: full-bleed element bands drenched in each element's fur palette.

STORY: Cats answer the call; I pulled one and it flipped in; there are 25 across five elements; they fight while I'm away; the rates are printed and nothing is for sale; my 1000 gems are waiting.

FIRST VIEWPORT: Minimal header (wordmark, Log in, Create account). Kicker, one-line H1, two-line sub, roster stat strip beside the Weekly Spotlight altar: featured cat at 128px on a two-frame bob, 2×5 empty slots, SUMMON ×1/×10 with preview wallet and pity bar. Primary action: SUMMON ×10.

FORM: Summoning Altar, #1 of seven on my ordered list; seed key 2876dde8 (dealt 7, 3, 1; user-pinned Altar locked).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Motion grammar

Focal: pixel-press → slots flip in at 150ms stagger with steps(6) pop → rarity flash → legendary shine plus a two-frame 2px altar jolt. Supporting: IntersectionObserver reveals (once, stepped, ≤4 siblings staggered); fight-log ticker one line per second with stepped HP bars, paused offscreen; element-wheel arrow advancing one stop per 900ms in steps(1). Reduced motion: opacity-only reveals, no bob, no jolt, no ticker autoplay.

## Unresolved
None. Routine choices: Weekly Spotlight banner in the hero; 2700-gem preview wallet; copy in the flavor-text voice.
