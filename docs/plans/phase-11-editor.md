# Phase 11: Quiz editor overhaul

**Branch:** `feature/editor-v2` (from `develop`, after phase 9)
**Commit:** `Rebuild the quiz editor with drag and drop and a live preview`
**Skills to load:** `web-ui`, `server-api`, `i18n`, `verification`, `git-workflow`

## Goal

Creating a quiz is fast and pleasant on a laptop and workable on a phone: questions are reordered by dragging (mouse, touch and keyboard), options are reordered the same way, every change is previewed on a phone mock-up, mistakes are undoable, and a quiz can be duplicated as a starting point.

## Scope

In:
- **Drag and drop with `@dnd-kit`** (`core`, `sortable`, `utilities`): sortable question list and sortable options, with pointer, touch (press-and-hold activation so scrolling still works) and keyboard sensors; a drag overlay; the existing move up/down buttons stay as the accessible fallback. The native HTML5 drag code is removed.
- **Layout.** Laptop: three panes, question list (thumbnails with type icon, number, first words, validation dot) on the left, the question form in the middle, the phone preview on the right; the quiz title and settings in a top bar. Phone: the list as a bottom sheet, the form full width, the preview behind a toggle.
- **Adding questions.** A type picker as a grid of cards with an icon, name and one-line description per type; new questions are inserted after the current one.
- **Question actions.** Duplicate, delete with an "Undo" toast (10 s, restores at the same index), move to top or bottom from a dropdown.
- **Options editor.** Each option row shows its fixed colour and shape, the correct marker is a large toggle, Enter in the last option adds the next one, up to six.
- **Media.** Image field accepts drop and paste from the clipboard, shows upload progress, and crops nothing (the preview shows how it fits).
- **Validation.** Inline, per field, with a summary in the list (a red dot per invalid question); "Play" is disabled while invalid with a tooltip listing the first three problems; clicking a problem focuses the field.
- **Save state.** The autosave indicator shows saved, saving, offline (queued) and error, with a retry button; leaving the page with unsaved changes asks for confirmation.
- **Quiz list.** Search by title, sort by last edited or title, duplicate quiz (new API: `POST /api/quizzes/:quizId/duplicate`, owner only, copies questions and settings, title suffixed with "(copy)" translated), delete with confirmation.
- **Keyboard shortcuts** on laptop: `Ctrl+D` duplicate question, `Ctrl+Enter` add question, `Alt+Up/Down` move question, shown in a "?" dialog.

Out: question bank or import (backlog), collaboration, AI-generated questions, new question types (backlog), templates.

## Third-party packages added

`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`. Open-source, bundled, no network calls. Listed in `docs/security-notes.md`. Alternative considered: Atlassian's `pragmatic-drag-and-drop` (framework-agnostic, smaller); `@dnd-kit` is chosen for its sortable preset and keyboard sensor, which avoid writing accessibility code by hand.

## Files

```
apps/web/src/routes/host/quizzes.$quizId.tsx       layout
apps/web/src/routes/host/index.tsx                 quiz list search, sort, duplicate
apps/web/src/features/editor/question-list.tsx     sortable list + thumbnails
apps/web/src/features/editor/question-card.tsx     removed (merged into list and form)
apps/web/src/features/editor/question-form.tsx
apps/web/src/features/editor/options-editor.tsx    sortable options
apps/web/src/features/editor/type-picker.tsx       card grid
apps/web/src/features/editor/image-field.tsx       drop and paste
apps/web/src/features/editor/phone-preview.tsx
apps/web/src/features/editor/save-indicator.tsx
apps/web/src/features/editor/shortcuts.ts + test
apps/web/src/features/editor/draft.ts + test       duplicate, undo delete, move
apps/web/src/features/editor/use-autosave.ts       offline queue, retry
apps/web/src/lib/sortable.ts                       sensors and helpers shared by both lists
apps/server/src/routes/quizzes.ts + test            duplicate endpoint
apps/web/e2e/editor.e2e.ts                          new spec
.claude/skills/web-ui/SKILL.md (editor section), CHANGELOG.md, docs/security-notes.md
```

## Steps

1. **Draft operations.** Pure functions in `draft.ts`: `moveQuestion`, `duplicateQuestion` (new ids for question and options), `removeQuestion` returning the removed item and index, `restoreQuestion(at)`, `moveOption`. Tests. Check: `vitest run src/features/editor/draft.test.ts`.
2. **Duplicate endpoint.** `POST /api/quizzes/:quizId/duplicate`, owner check, 404 as an i18n key, test with `app.inject`. Check: `vitest run test/quizzes.test.ts`.
3. **Sortable question list.** `lib/sortable.ts` with pointer, touch (250 ms delay, 5 px tolerance) and keyboard sensors; the list with thumbnails and drag overlay; the up/down buttons kept. Remove the HTML5 drag code. Check: manual with a mouse, a phone and the keyboard (Space, arrows, Space).
4. **Layout.** Three panes at `lg:`, bottom sheet and toggle below. Check: manual at 375 px and 1280 px; the e2e `addQuestion` helper still works or is updated.
5. **Type picker and question actions.** Card grid, duplicate, delete with undo toast, move to top/bottom. Check: manual; deleting then pressing Undo restores the question at its index with the same ids.
6. **Options editor.** Sortable rows, large correct toggle, Enter adds the next option. Check: manual; the preview reflects the new order immediately.
7. **Image field.** Drop and paste, progress bar, errors as toasts. Check: manual with a PNG over the size limit (translated error) and a pasted screenshot.
8. **Validation and save state.** Red dots, Play tooltip with the first three problems, focus on click; save indicator with the offline queue (DevTools offline, then online: the queued save goes through). Check: `vitest run src/features/editor/use-autosave.test.ts` extended with offline and retry cases.
9. **Quiz list.** Search, sort, duplicate, delete. Check: manual.
10. **Shortcuts.** `shortcuts.ts` mapping with a test that no shortcut fires while typing in a field. Check: tests.
11. **E2E.** `editor.e2e.ts`: create a quiz, add three questions of different types, drag the third to the top using keyboard drag (deterministic), duplicate one, delete and undo, duplicate the quiz, verify the copy in the list, clean up. Check: `pnpm e2e`.
12. **Docs and final pass.** Skill editor section, changelog, security notes; `pnpm verify`, e2e against Docker.

## Done when

- Questions and options can be reordered with mouse, touch and keyboard, and the preview follows.
- Duplicate, delete with undo and duplicate quiz work and persist after reload.
- Validation problems are visible in the list and reachable in one click.
- An offline edit is saved once the connection returns, with the indicator telling the truth throughout.
- The editor e2e spec passes with the existing game spec.
- `pnpm verify` and `pnpm e2e` pass.

## Verification command

```powershell
pnpm verify; $env:TEST_DATABASE_URL="postgres://ashquiz:ashquiz@localhost:5432/ashquiz"; pnpm --filter @ash-quiz/server test
docker compose up -d --build --wait
$env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; pnpm e2e
```

## Manual test list (draft)

1. On a laptop, drag question 3 above question 1. Expect the list, the numbering and the preview to update, and the order to survive a reload.
2. On a phone, press and hold a question, then drag. Expect the drag to start after the hold and normal scrolling otherwise.
3. Focus a question's drag handle, press Space, Arrow Down twice, Space. Expect the question moved two places down.
4. Delete a question, press Undo in the toast. Expect it back in place.
5. Paste a screenshot into the image field. Expect an upload with progress and the image in the preview.
6. Leave an option empty and try Play. Expect a disabled button with a tooltip naming the option; click it. Expect the field focused.
7. Go offline in DevTools, edit the title, go online. Expect "offline" then "saved" and the title persisted.
8. Duplicate a quiz from the list. Expect a copy with "(másolat)" or "(copy)" opened in the editor.
9. Press `Ctrl+D` while editing an option's text. Expect no duplicate (shortcuts are ignored in fields).
