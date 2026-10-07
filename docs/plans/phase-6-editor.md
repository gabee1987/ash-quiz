# Phase 6: Quiz editor, images, user management

**Branch:** `feature/editor` (from `develop`)
**Commit:** `feat(editor): add quiz editor with images and admin user management`
**Skills to load:** `web-ui`, `server-api`, `i18n`, `verification`, `git-workflow`

## Goal

HR colleagues create a quiz in minutes without reading anything: a quiz list, an editor with question cards, image upload, duplicate and reorder, autosave, and a preview of how a question looks on a phone. Admins can add host users.

## Scope

In:
- `/host` list: New quiz, Duplicate, Delete (with confirmation), Edit, Play, Results link (phase 7 fills it).
- `/host/quizzes/$quizId` editor: title and description; question list as cards with type badge, text, time, points; add question with a type picker; per-type form (options with correct markers, accepted answers chips, number + tolerance, true/false toggle); image per question and per option; duplicate, delete, move up/down (and drag on desktop); autosave with debounce and a saved/saving/error indicator; inline validation mirroring the shared schema; phone preview panel using the phase 4 question components in display mode.
- Image upload API with resize, served with cache headers.
- `POST /api/users` and `GET /api/users` (admin only), `/host/users` page: list and add host users (username + initial password, must be changed on first login via `POST /api/auth/password`).
- Password change for the logged-in user.

Out: question bank, import/export of quizzes, AI generation.

## Files

```
apps/server/src/routes/images.ts
apps/server/src/routes/users.ts
apps/server/src/routes/auth.ts                 add POST /password
apps/server/test/images.test.ts, users.test.ts
apps/web/src/routes/host/quizzes.$quizId.tsx
apps/web/src/routes/host/users.tsx
apps/web/src/features/editor/*.tsx             QuizHeader, QuestionList, QuestionCard, QuestionForm, OptionsEditor, ImageField, PhonePreview, TypePicker
apps/web/src/features/editor/use-autosave.ts   + use-autosave.test.ts
apps/web/src/features/editor/validate.ts       + validate.test.ts (uses shared schema)
apps/web/src/components/text-field.tsx, dialog.tsx, chips.tsx
```

## Steps

1. **Images API.** `@fastify/multipart`, `sharp` resize to 1280 px WebP, 5 MB limit, mime allowlist, owner recorded, `GET` with `Cache-Control: public, max-age=31536000, immutable`. Tests: upload PNG returns id and GET serves `image/webp`; GIF rejected 400; 6 MB rejected 413. Check: `vitest run test/images.test.ts`.
2. **Users API.** Admin-only list and create, `mustChangePassword` flag on `users` (migration), `POST /api/auth/password`. Tests: editor role gets 403, duplicate username 409, password change clears the flag. Check: tests.
3. **Editor skeleton.** Route loads the quiz via Query, holds a local draft in state, `useAutosave` debounces 800 ms and PUTs when the draft is valid; invalid drafts show field errors and do not save. Test the hook with fake timers. Check: `vitest run src/features/editor`.
4. **Question forms.** One form per type, sharing `OptionsEditor`. Correct marker is a radio for single, checkboxes for multiple. Accepted answers as chips, empty means host-graded with an explanatory hint. Check: manual, every type.
5. **Images in editor.** `ImageField` uploads on pick, shows a thumbnail, remove button. Check: manual.
6. **List actions.** Add, duplicate (server copies with new ids), delete with dialog, reorder with up/down buttons on all sizes and drag on pointer devices (native HTML drag and drop, no library). Check: manual.
7. **Phone preview.** Right-hand panel on desktop, toggle on phone, renders the selected question with the phase 4 components in display mode inside a 375 px frame. Check: manual.
8. **Quiz list.** New, Duplicate, Delete, Edit, Play. Check: manual.
9. **Users page and first-login flow.** Guard redirects to `/host/password` when `mustChangePassword`. Check: manual.
10. **i18n.** `editor.*`, `questionTypes.*`, `users.*`, `auth.password.*`. Check: key-set test.
11. **Final pass.** `pnpm verify`.

## Done when

- A new user can create a 5-question quiz with one question of each type, with an image, and play it, in under 5 minutes without instructions.
- Leaving the editor mid-edit and coming back shows the saved state; an invalid question is never saved and is marked.
- Admin can add a host user who is forced to change the initial password.
- `pnpm verify` passes.

## Verification command

```
pnpm verify && TEST_DATABASE_URL=postgres://ashquiz:ashquiz@localhost:5432/ashquiz pnpm --filter @ash-quiz/server test
```

## Manual test list (draft)

1. `/host`: New quiz. Expect the editor with an empty title field focused.
2. Type a title, add a single-choice question with 4 options, mark option 2 correct. Expect "Saved" within a second of stopping typing.
3. Remove the question text. Expect a field error and "Not saved" indicator; reload shows the last valid state.
4. Add one question of each remaining type. Text question: leave accepted answers empty. Expect the host-graded hint.
5. Upload a 3 MB JPG to question 1 and a PNG to option 1. Expect thumbnails; the preview shows them.
6. Duplicate question 2, move it to the top. Expect order persisted after reload.
7. On a phone, open the editor. Expect usable forms, preview behind a toggle, reorder via buttons.
8. Delete a question, confirm. Expect it gone after reload.
9. Play the quiz. Expect images on phones and screen.
10. As admin, add user "hr1" with an initial password. Log in as hr1. Expect the forced password change, then the empty quiz list.
11. As hr1, try `/host/users`. Expect 403 translated message and no list.
