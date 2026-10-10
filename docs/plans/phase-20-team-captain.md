# Phase 20: Captain decides

**Branch:** `feature/team-captain` (from `develop`, after phase 19)
**Commit:** `Add the captain decides team mode`
**Skills to load:** `game-engine`, `scoring`, `realtime`, `socket-client`, `web-ui`, `game-screens`, `motion`, `i18n`, `browser-checks`, `verification`, `git-workflow`

## Goal

A fourth team answer mode: everyone in the team sees the question and suggests an answer, the captain sees the suggestions live with names and confirms the one answer that counts. If the captain has not confirmed by the end, the team's majority suggestion counts, so a slow or offline captain never costs the team the question. Builds on phase 19's captains, team answers and tallies.

## Decisions

From the user: a captain mode where the team leader sees everybody's answers and gives the final answer that counts.

Proposed defaults (confirm or change before implementation):
- **Suggestions** are the members' answers, recorded as votes like in majority mode. A member can change a suggestion until the captain confirms (or the lock-in starts).
- **The captain** can suggest too and confirms any answer, not only one suggested. With phase 18's `answerChanges` on, the captain may change the confirmed answer until the lock-in; otherwise the confirmation is final.
- **Safety net:** no confirmation by the deadline means the majority of the suggestions counts (phase 19's rules), with a note on the phones: "Your captain did not confirm; the team's majority counted."
- **Speed bonus:** the time of the captain's confirmation (the fallback uses phase 19's majority time).
- **Early close:** when every captain-mode team has confirmed (together with phase 19's rules for the other modes).
- **Handover during a question:** phase 19's handover applies; the new captain sees the same tally and can confirm.

## Scope

In:
- `teamAnswer` gets `captain`; teams can choose it in the lobby like the other modes.
- **Engine:** in captain mode, a member's `submitAnswer` is a suggestion and a captain's `confirmTeamAnswer` writes the team answer. `endQuestion` falls back to the majority when nothing was confirmed and marks the team answer as a fallback.
- **Snapshots:** `myTeam` in captain mode carries the suggestion tally with names (for the whole team, so members see what the others think) and the confirmed answer.
- **Realtime:** `player:confirmTeamAnswer` (only from the team's current captain), validated, with i18n errors (`errors.notCaptain`).
- **Phone:**
  - **member:** taps suggest. The view then shows the team's tally and "Waiting for your captain…", and the confirmed answer when it arrives.
  - **captain:** the question with each option showing who suggested it (avatars and a count), then "Confirm for the team" on the chosen option, then a confirmed state.
  - Text, number and ordering questions show the suggestions as a list the captain picks from, plus the captain's own input.
- **Host and projector:** the live view shows per team "confirmed", "suggesting (3 of 4)" or nothing yet; the reveal and results mark fallback answers.

Out: anything beyond captain decides; team chat; captain voting.

## Files (expected)

```
packages/shared/src/quiz.ts, game.ts, events.ts         captain mode, confirm event, snapshot fields
apps/server/src/game/engine.ts (+ engine.test.ts)       suggestions, confirm, fallback
apps/server/src/game/snapshots.ts (+ test)              captain tally
apps/server/src/realtime/handlers.ts (+ realtime.test)  confirm event, early close
apps/web/src/features/play/*                            member and captain question views
apps/web/src/features/questions/*                       suggestion badges on options
apps/web/src/features/host/*, features/screen/*         captain status per team
apps/web/src/i18n/hu.json, en.json
apps/web/e2e/team-captain.e2e.ts
```

## Steps

1. **Engine.** Suggestions, confirm (captain only, lock-in, `answerChanges`), majority fallback, early close. Check: engine tests, including a handover between suggestion and confirmation.
2. **Snapshots and realtime.** Tally with names for the team only; confirm event and errors. Check: snapshot and realtime tests, including a non-captain trying to confirm.
3. **Phone.** Member and captain views for every question type. Check: screenshots on a phone, both colour modes, choice and text questions.
4. **Host, projector, results.** Captain status, fallback marks. Check: screenshots.
5. **Final pass.** An e2e spec: two members suggest differently, the captain confirms the minority answer and it counts; a second question without confirmation falls back to the majority. All e2e on the production build, `pnpm verify`, changelog, backlog.

## Done when

- Only the captain's confirmed answer counts; without one, the majority suggestion counts.
- Members see the team's suggestions and the confirmed answer; other teams see nothing of it.
- A captain handover during a question lets the new captain confirm.
- `pnpm verify` and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
```

## Manual test list (draft)

1. A team game in "Captain decides" with three phones in one team. Expected: the captain's phone shows a crown and the suggestion badges.
2. Two members suggest different answers. Expected: the captain sees both with names; members see the tally and "Waiting for your captain…".
3. The captain confirms the less popular answer. Expected: it counts at the reveal.
4. Next question: nobody confirms. Expected: the majority counts, with the fallback note on the phones.
5. Close the captain's phone mid-question. Expected: another member becomes captain and can confirm.
