# Spec kit convention
## Introduction 
This document is supplementary to the spec-kit guide; in this document, I try establishing some conventions on writing specifications and prompts to improve productivity and standardize documents across features. Feel free to suggest modifications to this convention if you have a good idea on how to improve it.
## Specs writing convention
Most of the time, you will let the agent write files like `plan.md` or `tasks.md` for you, but in case you ever decide to write it yourself or need to review the specs, here are a few rules to stick to:
Describe observable behavior, avoiding technical implementation details.

1. Organize user stories by priority, such as P1, P2, and P3. Each should ideally be independently testable.

2. Use structured acceptance scenarios, typically Given / When / Then.

3. Write explicit functional requirements, using identifiers such as FR-001 and precise language such as MUST.

4. Define measurable success criteria, rather than subjective phrases such as "fast" or "user-friendly".

5. Address edge cases and assumptions, including invalid input, missing data, and failures.

6. Keep optional sections relevant, rather than filling every section with unnecessary content.