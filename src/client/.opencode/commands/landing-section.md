---
description: Implement one landing page section from the spec (hero, highlights, activities, services, help, footer)
agent: build
---

Implement the landing page section: "$ARGUMENTS".

Source of truth: @docs/landing-page-spec.md

1. Find the matching subsection in section 7 of the spec. Use sections 3-4 for file placement, section 5 for design tokens, and section 6 for shared component contracts. If "$ARGUMENTS" matches no section, list the valid section names and stop.
2. Before creating anything, check what already exists in `components/ui`, `components/layout`, `components/icons` and `features/`. Reuse existing components; create only the missing ones, exactly following the contracts in section 6.
3. Follow the repo conventions already used by `features/auth`: feature-first folders, HTTP only through `libs/api-client.ts`, service + mock service behind one interface, separate DTO and UI types with a mapper.
4. Use design tokens from `app/globals.css`. Never hardcode colors. Put copy and static items in `features/landing/config/*`.
5. For data-driven or auth-dependent sections, implement every state the spec lists (loading, success, empty, error; guest vs authenticated). Layout must not shift between states.
6. Do not modify other sections. Do not invent API endpoints: use the assumed contract in the spec together with the mock service.
7. Server Components by default; add "use client" only where the spec requires state, effects or auth.

When finished: list the files created or changed, mention any ambiguity or conflict you found in the spec, and tell me which commands to run to verify (typecheck, lint). Do not run the dev server.
