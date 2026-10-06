# Sprint 16 — Other players, achievements and the record of every run

Until this sprint a profile was only its owner's: a hadu to dress and nothing else. Nothing listed other players, the record book on the home page held five runs, and a run's summary lived in memory until the page was left. Once a reward was taken, a match was gone except for its two scores.

This sprint adds four things:
- A profile that anyone can read.
- A way to find other players.
- Achievements that pay coins once.
- A summary of every finished run, kept for good.

Nobody plays anybody. Rivals are still the game's own, and this is a record, not multiplayer.

## Decisions

Settled with the user before the build:

| Topic | Decision |
| --- | --- |
| Finding a player | A directory by name, a leaderboard, a link to share, and a feed of recent runs |
| Achievements | Each pays coins once, the first time it holds |
| Privacy | A setting keeps a player's runs to themselves; their record, achievements and leaderboard place still show |
| Run summary | Every finished run has a page of everything it did, opened from "View run summary" |

Chosen during the build, and open to change:

- **The handle.** A profile is found by a handle. It is the username, or the username and the start of the account's id when another account took the name first. A username has no hyphen, so the two kinds never meet.
- **Signed-out access.** A profile and a run summary can be opened signed out, so a shared link works. The directory, the leaderboard, the feed and your own record book need an account.
- **Coins.**
  - A run's coins, and what each of its matches paid, are shown only to its player.
  - What an achievement pays is shown to everyone, as a pack's price is.
  - Achievement coins are paid on their own and never folded into a run's total.
- **Achievements read a career, not a run.** Every rule is tested against totals over all of an account's finished runs, plus its collection, its packs opened and its cosmetics. A run played before achievements existed counts too: an account's first run after this sprint pays everything its past already holds.
- **The leaderboard ranks every account, private or not.** Only numbers are shown there. Win rate ranks only accounts with 5 or more finished runs.

## Achievements

`src/server/game/achievements.ts` has 24. Coins are set against a cat pack (100 coins): from a quarter of a pack to three packs.

| Group | Achievements |
| --- | --- |
| Getting up the tower | Win a match. Beat Madame Mittens. Reach Old Nine Lives. Win a run. Win a run on Stray or harder. Win a run on Apex. |
| Over many runs | Win 5 and 25 runs. Win 25 and 100 matches. Finish 10 and 50 runs. |
| Scores | Score 76 and 87 in a match (the unlocks' two scores). Score 400 over one run. |
| How a run is played | Take every round goal in a match, once and 10 times. Take back 5 stolen cards in one run, the most a run can. Win a run with 12 or more cats of one element. |
| Between runs | Own 50 cats and all 102. Open 10 and 50 packs. Own 10 cosmetics. |

Achievements are counted in two places:
- When a run ends, in the transaction that closes it, after its row is written so the career includes it.
- When a pack is opened.

## What a run keeps

A match's record (`MatchRecord` in `run.ts`) now also keeps `detail`:
- the rival's level;
- both score sheets;
- the round goals;
- the tiebreak;
- both boards as the match left them, with tucked cats counted and not named;
- both sides' relics.

It also keeps `reward`: what the reward after the match took.

Both fields are optional, so a run saved before them still reads and `RUN_VERSION` did not move. When a run ends, its `RunSummary` is written to its row (`runs.summary`) beside `matches_played` and `best_match`, so profiles and achievements never read a whole state. An unlock or an achievement notes the run that earned it.

The summary page (`/runs/<id>`) is built by `toRunRecord` in `runRecord.ts`. Like the run view, the seed and the pool never leave the server.

A run from before this sprint kept only its scores. Its page shows those, and says in one line that the rest was not kept.

Migration `0008_players_achievements` makes a profile row and a handle for every account, and fills in matches played and best match for every run already played.
