---
version: 2
slug: "src-components-landing-landingpage-tsx"
primary_target: "src/components/landing/LandingPage.tsx"
related_targets: ["src/app/page.tsx", "src/app/login/AuthForm.tsx"]
build_path: comp
approved_comps:
  - ".impeccable/mocks/approved/gachapon-landing-desktop.png"
  - ".impeccable/mocks/approved/gachapon-landing-mobile.png"
---

# Landing and auth — surface brief

Scope: signed-out `/`, `/login`, and `/signup`. Visitor mode: Persuade on the landing page and Operate on auth. Audience: idle/gacha players arriving from a shared link. Success: understand the twist, complete a real preview pull, then create an account. Every number and rate comes from `src/server/game/*`; never invent social proof or commercial claims.

## Direction contract

THESIS: A friendly physical gachapon counter lets the visitor play before they are asked to commit. The public experience inherits the approved app world: warm cream canvas, sky-blue structure, cobalt action, lime reward, coral notice, rounded near-black type, soft 3D cats, and controlled ambient shadows.

FIRST VIEWPORT: Compact sticky account header. A direct headline and short explanation sit beside Weekly Spotlight on desktop; mobile stacks them and keeps Summon ×10 inside 375×812. The console carries a featured creature, preview wallet, 2×5 result tray, pity, single pull, and ten-pull. The preview starts with 2700 gems and hands off to signup after play.

STORY: Pull now; see the factual scale (25 cats, five elements, eight offline hours, nothing for sale); understand Summon / Send / Return; meet one cat from each element; read rates and guarantees; create an account beside the three starter cats.

AUTH: One cream shell on sky. The home-linked wordmark and form lead; the mascot stays contained and secondary. Mobile is one column with the form first. Short landscape may scroll but never clips the wordmark or controls horizontally. Demo login is a fill action; signup carries its starter pack in the task card.

## Motion grammar

Hero copy and console enter once over 360–420ms. The featured cat floats only while visible. A pull compresses the button, recoils the console, waits briefly, then reveals cards at 150ms intervals with a one-shot rarity flash and a finite legendary shimmer. Supporting groups rise 14px once with at most five siblings staggered. Auth enters once over 320ms and fields never move in response to typing or errors. Reduced motion removes movement and autoplay while leaving state changes and announcements immediate.

## Guardrails

- No pixel art, hard offset shadows, gradients, dark public surfaces, testimonials, prices, or store language.
- Touch targets are at least 48px; focus is cobalt and visible; fields keep stable error space.
- The landing page remains server-rendered with `now: Date`; client components receive plain typed props.
- Desktop and mobile approved comps are compositional references; shipped creature art remains the typed project artwork.
