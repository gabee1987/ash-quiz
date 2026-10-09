---
name: i18n
description: Hungarian and English localisation rules for Quizmoo: key naming, where strings live, server error keys, pluralisation and dates. Load whenever adding or changing any user-visible text on the web or any error code on the server.
---

# i18n

Hungarian is the default language, English is the second. Both are first-class: no feature ships with one dictionary updated and the other missing.

## Where strings live

- `apps/web/src/i18n/hu.json` and `en.json`, same key tree in both. A key present in one and not the other is a bug; `apps/web/src/i18n/i18n.test.ts` asserts the key sets are equal.
- The server sends no human-readable text. Every error is `{ error: '<key>' }` and every such key exists under `errors.*` in both dictionaries.
- Quiz content (titles, questions, options) is user data and is not translated.

## Keys

- Dot-separated, camelCase leaves, grouped by screen or concern: `join.*`, `play.*`, `screen.*`, `host.*`, `editor.*`, `results.*`, `auth.*`, `common.*`, `errors.*`, `questionTypes.*`.
- Leaf names say what the text is for, not what it says: `editor.addQuestion`, not `editor.plusButton`.
- Reuse through `common.*` for generic actions: `common.save`, `common.cancel`, `common.delete`, `common.next`, `common.back`, `common.loading`.

## Usage in code

```tsx
const { t } = useTranslation()
<Button>{t('common.save')}</Button>
t('play.answeredCount', { count: snapshot.answeredCount })
```

- Never build sentences from fragments; use interpolation `{{name}}` and `count` pluralisation (`key_one`, `key_other` in both languages).
- `aria-label` and `title` attributes are translated too.
- Numbers and dates: `Intl.NumberFormat` / `Intl.DateTimeFormat` with `i18n.language`, never hand-formatted.
- Language choice persists in `localStorage` (`quizmoo.lang`) and is set on `<html lang>`.

## Tone

Hungarian uses informal "te" for players (event atmosphere) and formal, concise wording for host and editor screens. English is plain and short. Keep button labels to one or two words. Error messages say what to do next: "Nincs ilyen játék. Ellenőrizd a PIN-t."

## Adding a new error code

1. Throw or ack `{ error: 'errors.newCode' }` on the server.
2. Add `errors.newCode` to `hu.json` and `en.json`.
3. If a test asserts the error, assert the key, not the text.
