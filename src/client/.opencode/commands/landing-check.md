---
description: Read-only review of the landing page implementation against the spec
agent: plan
---

Review the current landing page implementation against @docs/spec/landing-page-spec.md. Do not modify files.

Changes so far:
!`git status --short`

Typecheck output:
!`npx tsc --noEmit 2>&1 | head -50`

Lint output:
!`npm run lint 2>&1 | tail -50`

Check and report, section by section (Header, Hero, Highlights, Activities, Services, Help, Footer):
1. Missing or deviating UI details versus the spec (copy, layout, tokens, behavior).
2. Activities: loading, success, empty and error states; layout rules for 0/1/2 featured and 0/1/3 upcoming; image fallback; date formatting.
3. Services: guest vs authenticated rendering; blurred cards inert and hidden from assistive tech; no real hrefs on locked cards.
4. Reuse: duplicated components that should use `components/ui` or `components/layout`; hardcoded colors; direct `fetch` outside `libs/api-client.ts`.
5. Conventions versus `features/auth` (service + mock, DTO/UI split, mapper).
6. Accessibility basics: landmarks, heading order, focus rings, alt text.

Output a table with columns: Section, Issue, Severity (high/medium/low), Suggested fix. Finish with the top 3 things to fix first.
