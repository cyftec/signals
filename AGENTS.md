# AGENTS.md

## Purpose

This repository contains a custom reactive state management library.

The implementation is intentionally unique.

Do not assume behavior from any other reactive system.

---

# Read First

Before making changes, read:

1. docs-architecture/semantics.md
2. docs-architecture/behavior.md
3. docs-architecture/overview.md
4. docs-architecture/llm-guide.md

These documents are part of the repository contract.

---

# Critical Rule

Do not assume behavior from:

- SolidJS
- Angular Signals
- Preact Signals
- MobX
- Vue
- React
- S.js
- Any other reactive library

If a code change depends on an assumption about library semantics that is not explicitly verified by:

- source code
- tests
- semantics.md
- behavior.md
- architecture.md

stop and ask.

Do not guess.

---

# Before Implementation

1. Verify requirements.
2. Identify assumptions.
3. Identify risks.
4. Identify tradeoffs.
5. Propose a plan.

For major work, wait for approval before implementation.

---

# Stop And Ask If

- requirements are ambiguous
- multiple valid solutions exist
- behavior is undocumented
- a public API must change
- a dependency must be added
- a large refactor is required
- repository structure must change
- documentation appears inconsistent with code

---

# Public API Rules

Do not change public behavior without approval.

If behavior changes:

- update tests
- update semantics.md
- update behavior.md
- update architecture.md

---

# Testing Rules

Prefer behavioral tests.

Avoid testing internal implementation details unless necessary.

When fixing bugs:

- reproduce with a test
- implement the fix
- verify the test passes

---

# Repository Constraints

- TypeScript-first
- Bun-first
- Minimal dependencies
- Static documentation site
- Generated API reference
- Human-authored tutorial content
- Human-authored architecture content

---

# Before Completing Work

Provide:

- files changed
- assumptions made
- risks identified
- recommended follow-up work

Explicitly identify any uncertainty.
