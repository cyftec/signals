# Contributing to @cyftec/signals

Thank you for considering a contribution.

## Before you begin

Read [AGENTS.md](./AGENTS.md) in full. It is the technical contract for this
library. In particular, do not infer behavior from another reactive library:
verify any semantic assumption in the implementation, tests, or that guide.

For a significant change, open an issue first to describe the problem, the
proposed outcome, risks, and tradeoffs. This helps prevent accidental public
API or semantic changes.

## Local setup

```bash
bun install
bun run test
bun run build:meta
bun run build:validate
```

Use `bun run test:types` when a change may affect declarations or generic
inference. Use behavioral tests for runtime changes: assert the observable
result rather than an internal implementation detail whenever possible.

## Making a change

1. Create a focused branch from the default branch.
2. Make the smallest change that solves the agreed problem.
3. Add or update behavioral tests for changed behavior. Reproduce a bug in a
   test before fixing it.
4. Update `AGENTS.md` when a public semantic, API, architecture, or type
   contract changes.
5. Run the relevant checks and describe them in the pull request.

Do not add dependencies, change public behavior, or make a large refactor
without prior discussion and maintainer approval.

## Pull requests

Use the pull-request template. Keep each pull request scoped to one concern,
explain user-visible effects, and call out any uncertainty. Maintainers may ask
for tests, documentation, or a narrower scope before merging.

## Reporting issues

Use the bug-report template for reproducible defects and the feature-request
template for proposals. Please search existing issues first and avoid including
secrets, credentials, or personal information.

## Code of conduct

All contributors must follow the [Code of Conduct](./CODE_OF_CONDUCT.md).
