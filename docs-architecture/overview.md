# Architecture Overview

This document explains the current implementation of `@cyftec/signal` for contributors. It describes repository structure and runtime mechanics; [semantics.md](./semantics.md) remains the observable contract.

## Runtime model

The runtime has three signal kinds and one active computation kind:

```text
SourceSignal ──value read──▶ EffectHook ──registers──▶ Effect
     │                                               │
     └──value write──▶ subscribed Effect.run() ◀─────┘

DerivedSignal = base-signal storage + updater Effect + read-only setter
DeadSignal    = base-signal storage + read-only setter + non-live methods
```

- A **source signal** owns mutable state.
- A **derived signal** owns computed state updated by an effect.
- A **dead signal** is a read-only snapshot with signal-shaped helper methods.
- An **effect** is an immediately invoked callback plus its subscription bookkeeping.

There is no scheduler, queue, batch, transaction, or cycle detector. A write directly runs subscribed effects in the same call stack.

## Repository layers

### Core: `src/_core`

- `signals/base-signal.ts` — storage, tracked and non-reactive reads, mutation publishing, subscribers, and source disposal.
- `signals/source-signal.ts` — mutable source facade and data-method attachment.
- `signals/derived-signal.ts` — evaluator effect, read-only facade, and live non-mutating methods.
- `signals/dead-signal.ts` — read-only non-live facade and snapshot methods.
- `effect/effect.ts` — effect object, subscription sets, execution, and immediate disposal.
- `effect/hook.ts` — singleton current-effect hook used during initial collection.
- `data-specific-methods/` — array, object, string, number, boolean, and generic method factories.
- `dispose.ts` — bulk disposal helper.

### Higher-level API: `src/api`

- `compute.ts` — function application over maybe-signal arguments.
- `connectors.ts` — eager signal/value-to-source bindings.
- `nullable.ts` — generic logical methods for nullable primitive inputs.
- `operations/` — the chainable `op` evaluator API.
- `promstates.ts` — promise result, error, and running projections.
- `tmpl.ts` — reactive tagged-template interpolation.

### Utilities: `src/utils`

- `value-getter.ts` — maybe-signal unwrapping through `.value`.
- `plain-method-params.ts` — parameter-list unwrapping.
- `type-checkers.ts` — runtime discrimination by the `type` field.

The public type system additionally follows the repository's signal-widening
contract. It intentionally applies to source as well as read-only signal
forms; consult [type-variance.md](./type-variance.md) before changing a
generic signal, conditional data-method type, or maybe-signal input.

The package root re-exports `src/index.ts`, which combines the core, API, and utility barrels.

## Base-signal storage

`getBaseSignal(initialValue)` creates the shared storage object used by all three signal kinds.

Current internal state:

- `_value` — current stored value.
- `_prevValue` — prior value from the last successful update.
- `_effects` — a Set of subscribed `Effect` objects.

Important access paths:

- `value` getter checks `EffectHook.getCurrentEffect()`, records the two-way subscription, and returns `newVal(_value)`.
- `nonReactiveValue` returns the raw stored value without dependency collection. Derived evaluation uses it to pass the previous computed value.
- `value` setter checks strict equality, moves the current reference into previous state, stores the setter input directly, then calls every subscribed effect's `run()`.
- `mutateWith(evaluator)` computes a new value from the stored value and publishes it through the setter.
- `removeEffect(effect)` removes one known subscription and throws if the effect is absent.
- `dispose()` clears the source's subscriber Set immediately.

`nonReactiveValue`, `mutateWith`, and `removeEffect` are exposed by the inferred base type, but they exist primarily to connect runtime pieces. Application code should normally use `.value`, attached methods, and `.dispose()`.

`newVal(...)` isolates initial object and array inputs and tracked `.value` reads. It is not applied by the setter: an object or array assigned through `.value` remains shared with the caller. Mutating that original reference changes stored data without publishing an update. `prevValue` and `nonReactiveValue` can also expose raw stored references and should be treated as read-only.

## Initial dependency collection

Effect creation follows this sequence:

```text
effect(callback)
  ├─ create Effect with empty stimulus/dependent Sets
  ├─ EffectHook.setCurrentEffect(effect)
  ├─ effect.run() → callback()
  │    └─ every live signal.value read records the subscription
  ├─ finally: EffectHook.setCurrentEffect(null)
  └─ return Effect
```

When a base signal sees a current effect, it:

1. calls `effect.registerStimulusSignal(baseSignal)`; and
2. adds the effect to its local `_effects` Set.

The hook is installed only around the initial call made by `effect(...)`. `Effect.run()` itself does not reinstall it. This is why dependencies are initial-run only: later executions retain the original subscription set but do not reconcile it with newly taken branches.

The hook is a single slot rather than a stack. Nested effect construction changes that slot while the inner effect is created, so code must not assume stack-based restoration of an outer collector.

## Effect bookkeeping and disposal

An `Effect` owns:

- `_isDisposed` — surfaced as `isDisposed`.
- `_stimulusSignals` — signals whose writes can run this effect.
- `_dependentSignals` — signals explicitly registered as depending on this effect; derived signals currently use this for bookkeeping.

Disposal is immediate:

```text
effect.dispose()
  ├─ for each stimulus: stimulus.removeEffect(effect)
  ├─ clear stimulus and dependent Sets
  └─ set isDisposed = true
```

`run()` returns without invoking the callback after disposal. A second disposal throws instead of silently succeeding.

Source disposal and effect disposal are not fully symmetric. A source clears its own subscriber Set but does not remove itself from the subscribed effects' `_stimulusSignals` Sets. If one of those effects is disposed later, its attempt to call `source.removeEffect(effect)` can throw because the source subscription was already cleared. This is a current bookkeeping limitation, not intended graph behavior.

This replaces the older deferred-cleanup design. Documentation or generated metadata that mentions cleanup on a future signal update describes an obsolete implementation.

## Derived-signal construction

`derive(evaluator)` creates a base signal initialized with `undefined` and an updater effect:

```text
dependency write
  → updater Effect
  → evaluator(previousComputedValue)
  → internal base value setter
  → downstream effects if the output changed
```

After initial computation, `derive`:

1. registers the internal base as a dependent signal of the updater effect;
2. replaces the public `value` setter with a no-op;
3. assigns `type: "derived-signal"` and a `dispose()` method that disposes the updater; and
4. attaches generic and type-specific non-mutating methods.

The derived signal therefore uses the same storage and downstream subscriber mechanism as a source, but it is not implemented as a public source signal wrapper. Its setter is read-only and it has no source `.mutate` surface.

Strict-equality short-circuiting occurs at the internal base setter. If recomputation returns the current output, `prevValue` and downstream effects do not change.

## Dead-signal construction

`deadSignal(input)` also starts from base-signal storage, then:

1. replaces the public setter with a no-op;
2. assigns `type: "dead-signal"`;
3. assigns a no-op `dispose()`; and
4. attaches generic and non-mutating data methods in non-live mode.

Non-live method factories evaluate immediately and wrap results in another dead signal. They do not create an updater effect. This gives live and dead values a similar projection vocabulary without falsely making snapshots reactive.

## Data-method dispatch

Source, derived, and dead constructors choose a method family once. The dispatch value is:

1. the optional non-null exemplar, when supplied; otherwise
2. the base's current non-reactive value.

Dispatch order matters:

1. arrays;
2. plain objects;
3. strings;
4. numbers;
5. booleans for source mutation only; and
6. no data-specific methods for other kinds.

Arrays are checked before objects because arrays are objects in JavaScript. Plain-object detection comes from `@cyftec/immut`.

Source method bundles combine:

- `.mutate` methods that publish through `mutateWith`; and
- read-only methods that produce live derived results.

Derived bundles contain only live read-only methods. Dead bundles contain the same read-only method names, but their results are dead snapshots.

At the type level, a value union distributes the eligible helper surface while preserving the signal's full value type. This allows `SourceSignal<string>` to satisfy `SourceSignal<string | number>`, but prevents string-only or number-only helpers from being called on the mixed signal without narrowing.

All maybe-signal method parameters flow through `value(...)`. On a live result's initial derivation, this captures both the base signal and every live parameter that is read.

## Generic method architecture

`getGenericMethods` builds three groups:

- `or(alternative)` — a JavaScript `||` evaluator.
- `is` — boolean projections for truthiness, equality, numeric measure, and string/array length.
- `if` — the same checks returning a `then(truthy, falsy)` selector.

The factory checks `valueIsLiveSignal(base)` once:

- live base → wrap evaluators with `derive`;
- dead or plain base → evaluate now and wrap with `deadSignal`.

This same factory powers methods attached to signals and the public `nullable(...)` adapter.

## Higher-level flow

### Unwrapping

`value(input)` calls `.value` for every source, derived, or dead signal. It only inspects the outer input, so a plain container of signals is returned as that container without recursively reading its members. For a live outer signal, unwrapping is a tracked read during initial collection. `compute`, connectors, operation evaluators, and parameter unwrapping rely on this behavior.

### Connectors

`receive` constructs one immediate effect per transmitter; `transmit` constructs one immediate effect for all receivers. Because effect construction runs eagerly, connectors synchronize current values before returning. Plain and dead inputs still perform this initial write but capture no changing live stimulus.

### Promise state

`promstates` owns one object source signal with `isRunning`, `result`, and `error` properties, then returns `state.props()` projections. Each run publishes a pending object before invoking the promise function and publishes a settled object from the promise chain.

Known implementation limitations include falsy initial-value loss, unhandled synchronous throws before a promise is returned, and races between overlapping runs.

### Operation chains

`op` evaluates once to select generic, number, or string/array chain shape. Each chained operation returns another evaluator object. A final getter or `then(...)` creates a derived signal whose initial run captures every live value read through the evaluator chain.

## Documentation build architecture

There are three documentation sources:

- human-authored Markdown under `docs-architecture/` and `README.md`;
- semantic comments in `src/**/*.ts`; and
- human-authored website pages under `website/dev/`.

The API metadata path is:

```text
src/**/*.ts comments
  → bun run build:meta
  → website/dev/view/pages/assets/code_entities_meta.json
  → website API page renders the JSON
  → bun run docs / Brahma publish
  → generated static output under docs/
```

`docs/` and its metadata copy are generated output. Changes belong in source comments or `website/dev/`, followed by regeneration.

The metadata builder uses the TypeScript compiler AST to discover supported exported declarations, extract callable parameters and type parameters, and associate each declaration with its adjacent raw TSDoc block. A deliberately limited parser handles the supported semantic tags, and `build:validate` enforces required comment sections plus parameter/template agreement with the extracted signature. Contributor checks should still inspect generated names, signatures, links, and completeness because validation covers the documented schema rather than every aspect of API meaning.

## Architecture invariants

When changing the runtime, preserve or explicitly revise these contracts:

- synchronous, unbatched propagation;
- strict-equality update suppression;
- initial-run-only dependency collection;
- read-only derived and dead public values;
- immediate effect and derived disposal, including the double-dispose error;
- live methods returning derived signals and dead methods returning dead snapshots;
- source mutation methods living under `.mutate`;
- eager connector initialization; and
- `value(...)` acting as a tracked read for live signals.

Any intentional public behavior change requires behavioral tests and coordinated updates to the semantic, behavioral, architecture, and agent-facing documents.
