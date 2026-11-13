---
description: Create or update a shared UI component from the contracts in the landing spec
agent: build
---

Create or update the shared component: $ARGUMENTS

Source of truth: section 6 of @docs/landing-page-spec.md (contracts) and section 5 (tokens).

Rules:
- Place generic primitives in `components/ui`, site chrome in `components/layout`, and one icon per file in `components/icons`. If it already exists, extend it without breaking current usages.
- Match the prop contract in the spec exactly; keep it feature-agnostic (no activity, auth or landing-specific logic).
- Style with tokens from `app/globals.css`; no hardcoded colors or magic numbers that belong to the design system.
- Accessible by default: semantic element, visible focus ring, `aria-*` where needed, respects `prefers-reduced-motion`.
- If the component renders a link, use `next/link`; if it renders images, use `next/image`.
- If the component is not described in the spec, say so, propose a minimal contract first, and wait for my confirmation.

Finish with a short summary: file path, props, and where it should be used.
