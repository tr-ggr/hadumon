# Sprint 11 — The run screen

Read `sprints/08-roguelike-overview.md`, `sprints/10-engine.md` and `PRODUCT.md` first. `10-engine.md` is your API reference.

Goal: `/run` is the whole game, playable start to finish on a phone and on a desktop, against the real API.

## You own

`src/app/run/**` and `src/components/run/**`. Nothing else. Do not edit the engine, the routers, `src/components/cats/**`, `src/components/ui/**`, `src/components/sprites/**`, `AppShell`, or `globals.css`. If something there blocks you, work around it in your own files and say so in your report.

## Screens

`RunView` is one client component that switches on state:

1. **No active run** → `ClanPick`. Every clan from `CLAN_LIST`; locked ones (not in `run.clans`) are shown dimmed and cannot be chosen. For each: name, text, its relic, and the 16-card starter deck summarised (`starterDeck`). One primary action starts the run.
2. **`match.phase === "setup"`** → `SetupKeep`. The five dealt cats and five essence (one per element). The player toggles what to keep; the confirm button is enabled only at exactly 5 and says how many are chosen. Introduce the rival here: name, flavor, trait.
3. **`match.phase === "turn"` or `"pending"`** → the board (below).
4. **`run.phase === "reward"`** → `MatchResult` then `RewardPick`: the score breakdown against the rival, then pick 1 of the offered cats or skip, pick a relic when `reward.relics` is not empty, and optionally trim one card when `reward.canTrim`. One confirm sends `chooseReward`.
5. **Run over** → `RunSummary` from the final `RunUpdate` held in component state: outcome, each match's score, what was unlocked (names, not ids), and a button to start again. `run.current` is `null` by now, so this screen lives only as long as the component; a reload shows `ClanPick`.

## The board

Everything the player needs for a decision is visible without opening anything.

- **Status strip**: round `n` of 3, turns left, your score, the rival's score.
- **Rival**: name, the last card it flipped in plain words ("Banked a cat", "Raided 2 dice", "Burned Bramblepaw"), how many cards are left in its deck, and its trait.
- **Goal**: this round's goal text with the live standing from `view.standing` ("You 2 · Rival 3"), and the two later goals named.
- **Three rows** (Hunt, Den, Prowl), four slots each. A placed cat shows its sprite, yarn as `yarn/yarnCap`, and cached and tucked counts when above zero. Each row has its own activate control labelled with what it gives now (`view.rewards`), and shows the yarn cost of its next slot (`view.yarnCosts`).
- **Feeder** (dice as `EssencePip`s), **tray** (three `CatCard`s), deck and discard counts.
- **Your essence**, **your hand** (`CatCard` compact; scrolls sideways on a phone), **your relics**.

Tapping any cat (board, tray, hand) opens a `Modal` with `<CatCard variant="full">`. On the board the modal is the only tap action; in the hand and tray it must not get in the way of selecting, so give it its own small control.

### Taking a turn

One action at a time, with a clear way to back out before confirming.

- **Play**: select a hand card → the rows in `view.playable[handIndex]` become targets → tap a row. If a card has no legal row, say why in one line (not enough essence, no room, or not enough yarn).
- **Hunt**: activate → choose exactly the required dice → confirm. When the required count equals the dice left, there is nothing to choose: send it straight away.
- **Den**: activate → tap cats to place yarn one at a time, never past `yarnCap`, with a running "2 of 3 placed" → confirm (fewer is allowed). Offer "Place for me", which fills in board order.
- **Prowl**: activate → choose exactly `view.prowlPicks` from the tray and the deck (the deck can be chosen more than once, up to `deckCount + discardCount`) → confirm.
- **Reroll** appears only when `view.canReroll`.
- **Pending** (`view.pending`): a prompt naming the cat. `tuckHand`: pick a hand card to tuck, or Skip. `trade`: "Spend 1 yarn for 1 wild essence", or Skip.

### After an action

`run.act` returns `events`. Show them as a short, readable log of what just happened, newest action on top, in plain words that name cats and rivals (use `getCat`, `getRival`, `getGoal`). The rival's action and a scored goal must be impossible to miss. Keep motion small and honour `prefers-reduced-motion`.

## Data

- `api.run.current.useQuery()` is the source of truth. After every mutation write the returned snapshot into the cache with `utils.run.current.setData(undefined, …)`; do not refetch on success.
- Disable controls while a mutation is in flight. No optimistic updates: the server owns the randomness.
- `CONFLICT` → refetch `run.current` and tell the player the run was updated elsewhere. `BAD_REQUEST` → show the message.
- Keep the abandon action out of the way and behind a confirm `Modal`.

## Look

Use the existing tokens and `ui/` primitives. Game pieces (cards, slots, dice, pips) are hard-edged with a 2px `border-ink`, as `CatCard` already is; page chrome keeps the existing rounded panels. Rows sit on `bg-sky-surface`. No new colours, no emoji, no gradients. At 375px nothing scrolls sideways except the hand, and the action controls stay reachable without scrolling past the board.

## Done when

- `pnpm check` and `pnpm test` pass.
- In a real browser (playwright-cli is available; `pnpm dev`, log in as `demo` / `demo1234`), at 375px and at 1280px: start a run, keep 5, play a cat, activate each of the three rows, answer a pending choice if one comes up, finish a match, take a reward, and reach either a lost run or a second match. No console errors. Reload mid-match and land in the same state.
- Stop the dev server when done. Leave the demo account without an active run.
- Small conventional commits, no co-author lines, `git add` only your own files by explicit path.

Report: what you built, what you verified by playing and at which widths, anything you could not reach (for example a pending choice never came up), and any engine or API behaviour that made the UI awkward.
