# Document Review Guide

## Prerequisites

- Read `docs/analysis-and-design/db/br-gap-analysis.md` and the original version of `docs/analysis-and-design/db/business-requirement.md` from Git.
- Review the current business requirements document after targeted edits.

## Validation

1. Compare the original and revised heading lists; text, Markdown level, and order must match exactly.
2. For DB-01 through DB-18, locate the revised statement in an existing section. Cross-check its entity row, cardinality, and constraint where relevant.
3. Search for old active conflicts: single cumulative role, lifetime-unique registration, four-state request lifecycle, mandatory score ID for a missing score, universal all-session attendance, mandatory QR/signature, negative penalties, and reopening resolved requests.
4. Inspect the diff to ensure unchanged business-purpose and aligned rules remain in place, with no new section or wholesale replacement.
5. Check the repository diff for this request: only the business requirements document and feature Markdown may change. No code tests are required.

## Expected result

All 18 gaps are addressed within the original structure, and the document is ready for stakeholder review. This guide does not authorize product implementation.
