---
version: 1
slug: "src-components-profile-profile-tsx"
primary_target: "src/components/profile/Profile.tsx"
related_targets: ["src/app/profile/page.tsx","src/app/profile/ProfileView.tsx","src/components/profile/WardrobeTile.tsx","src/components/profile/PieceDrawing.tsx","src/components/profile/ProfileSkeleton.tsx","src/components/profile/swatches.ts","src/components/profile/wardrobe.ts","src/components/HaduAvatar.tsx","src/components/sprites/hadu.ts","src/components/skins/skins.ts","src/components/skins/SkinProvider.tsx","src/app/layout.tsx","src/styles/globals.css"]
---

# Profile — surface brief

Scope: signed-in `/profile`. Visitor mode: Operate. Audience: a player who has opened a cosmetic pack, or wants to see what there is to find. Job: see the hadu as it stands, put a piece on or take it off, and change the look of the board, the cloth, the tower and its sky. Every piece and slot comes from `src/server/game/cosmetics.ts`; every drawing from `src/components/sprites/hadu.ts` and `src/components/skins/skins.ts`.

## Direction contract

THESIS: The profile is a dressing room in the tower: the player's hadu on a mat, and under it every thing it can wear and every look of the table and the tower, a row to a slot. A press changes it at once. It refuses a settings page: no form, no save, no preview apart from the thing itself.

OWN-WORLD: Pieces on a Cream Table (DESIGN.md). The hadu is Hadu's own sprite with one drawing a slot laid into cells no other slot uses, and an aura in pixels behind him. An owned piece is a white tile with its rarity's band; the piece in force is lime with the chosen frame; one not owned is a dashed outline with its picture faint. A look is a swatch of flat colours, and wearing one repaints the room the page is in.

STORY: See the hadu, the name and the coins; read the one sentence that says what is worn; press a piece and watch the hadu, the mat, the cloth or the wall behind the page change; read the sentence again; see what is still dashed and go to the shop for it.

FIRST VIEWPORT: The ink lid (the hadu's piece lime and pressed, Play in cobalt). On the stone wall, from 1024px: at the left "Profile" in print on a cream plate, the sky mat with the hadu at 160px on its cast, the name on a lime nameplate and the coins on a white token, and a white status card; to the right the "Wardrobe" board with its owned count in print and the first slot rows. Below 1024px the plate, the mat and the board stack, and a white card rail above the dock carries a 32px hadu and the sentence.

FORM: Not recorded in the build as a seed key, pin or comp. The builder's notes handed to the documenter named the room, the mat, the nameplate, the two boards and the three standings of a tile.

FINISH: documented from the build (commits `aa62363`, `a01e271`, `e518eac`) in DESIGN.md on 2026-10-06. No finish review is recorded here.

## Layout by width

- `in-room`, capped at 1180px. From 1024px an 18rem column is stuck 20px under the lid beside the boards; below that everything stacks.
- The hadu is 128px, 160px from 1024px, with 32px of air round it (40px from 1024px) for an aura. The plates are beside it below 1024px and under it from 1024px.
- The two boards are 28px apart. A slot's row is three tiles across, five from 640px, nine from 1280px.
- Below 1024px the status card is a card rail stuck 92px above the bottom edge on a phone and 16px from 768px.

## Pieces

- The hadu, the name plate, the mirror, the status card, the boards and the wardrobe tile: see "Profile and the Hadu" in DESIGN.md. A look's swatch: see Shapes.

## States

- Loading: the frame with blanks in the shape of the hadu, the plates and the rows, each slot already named.
- A piece owned and not on: white, liftable.
- A piece in force: lime, the chosen frame, lifted, with "Worn" or "In use".
- A piece not owned: a dashed outline, its picture at 45%; a press is the buzz, and the sentence says where it is found.
- A press on the piece already on: the sentence says so and nothing changes. The first of a row, the free piece, takes the slot's piece off.
- A change the server refuses: it comes back off, the sentence and an error notice say why.
- Everything owned: the board loses its note and its "Open the shop".

## Motion and sound

- Nothing plays by itself. The tile in force lifts as any chosen piece does; the page behind it repaints at once.
- Putting a piece on is the rising blip; a refusal is the buzz.

## Accessibility

- Each tile is a button reported as pressed while in force; one not owned is `aria-disabled` and described by the board's note.
- The one sentence is `aria-live`. The large hadu is an image named with what it wears; every picture on a tile is decoration, since the name is printed beside it.
- Every board and cloth carries ink at 7:1 or more, held by `skins.test.ts`.
