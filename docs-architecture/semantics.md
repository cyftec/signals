# Semantics

This is the behavioral contract for the current implementation. It is specific
to this repository; do not import expectations from another reactive library.
When this document is incomplete, the runtime source and behavioral tests are
authoritative.

## Signal kinds

### Source signals

`signal(initialValue, nonNullInitialValue?)` returns a writable
`SourceSignal<T>`.

- `type` is `"source-signal"`.
- `value` reads the current value and accepts assignments.
- `prevValue` is initially `undefined`, then holds the previous stored
  value after a successful assignment.
- The initial value and every object/array read are copied with `newVal`.
- An assignment that is strictly equal to the stored value warns and does not
  notify effects or change `prevValue`.
- A different assignment stores the supplied value, then synchronously runs
  registered effects.
- `mutateWith(fn)` evaluates `fn` against the stored value and assigns its
  result.

The optional second argument only selects a data-method family for nullish
initial values. It does not replace the stored initial value.

### Derived signals

`derive(catcher, nonNullInitialValue?)` returns a read-only
`DerivedSignal<T>`.

- `type` is `"derived-signal"`.
- Each read of `.value` invokes `catcher()` synchronously.
- There is no cached value, previous value, setter, notification mechanism, or
  disposal API.
- Source signals read by the catcher can be registered when that derived value
  is read during an effect's initial run.
- Derived projections and generic helpers are themselves derived signals, so
  their work also happens when their `.value` is read.

## Effects and dependency collection

`effect(callback)` creates a receiver with a unique `id`, runs
`callback` immediately, and returns that receiver. The receiver exposes
`id` and `run()`; it has no lifecycle or disposal controls.

During that one initial callback execution, each source signal read through
`.value` records the receiver. Repeated reads of one source register it once.
Later writes to the source invoke registered receivers synchronously in
registration order.

Dependency collection is intentionally fixed:

- Reads made after the initial callback run do not add dependencies.
- A source read only in a later conditional branch is never registered.
- A source read initially remains registered even if later runs stop reading it.
- The collection marker is cleared with `finally` if the initial callback
  throws.

The runtime has no batching, scheduler, transaction API, dynamic dependency
reconciliation, cycle detection, or recursion guard.

## Method families

Every source and derived signal receives generic helpers. Data-specific helpers
are selected once from the initial runtime value or the optional non-null hint.
The dispatch order is array, plain object, string, number, then boolean (source
signals only). Unsupported values receive no data-specific family.

- Array sources expose mutators under `.mutate`:
  `concat`, `copyWithin`, `fill`, `filter`, `pop`, `push`,
  `shift`, `toReversed`, `toSorted`, `toSpliced`, and `unshift`.
- Arrays expose lazy projections including lookups, predicates, transforms,
  reductions, `length`, `lastItem`, and `partition`.
- Plain-object sources expose `.mutate.set(partial)` for shallow merging;
  object projections are `keys()`, `get(key)`, and `props()`.
  `props()` includes only keys present when called.
- String sources expose string transformations under `.mutate`; source and
  derived strings expose lazy read-only string projections plus `deepTrim()`.
- Numbers expose formatting helpers and `toConfined(start, end)`, which
  clamps inclusively.
- Boolean sources expose `.mutate.toggle()`.

Source mutators publish through the normal source assignment path. Every
read-only helper returns a lazy `DerivedSignal`. Signal-valued helper
arguments are unwrapped when that derived result is read.

## Generic helpers

`or`, `is`, and `if` are attached to every source and derived signal.

- `or(alternative)` uses JavaScript `||`; all falsy values select the
  alternative.
- `is` provides truthiness and strict equality comparisons.
- Number values also provide strict and inclusive measure comparisons.
- Strings and arrays provide those comparisons under `.is.length` and
  `.if.length`.
- `if.*` returns `.then(truthyOption, falsyOption)`; both options are read
  when the resulting value is read before the selected option is returned.
- `nullable(input)` exposes the same generic surface for an input type with a
  primitive member.

## Convenience APIs

`compute(fn, ...args)` returns a lazy derived value. It unwraps each argument
with `value()` when its result is read, then calls `fn`.

`tmpl` returns a lazy derived string. On each read it evaluates functions,
reads signals, converts nullish expressions to `""`, and stringifies all
other expressions.

`receive(receiver, ...transmitters)` creates one immediate effect per
transmitter. `transmit(transmitter, ...receivers)` creates one immediate
effect for all receivers. Signal transmitters remain connected; plain
transmitters only make their immediate assignment. Multiple connector effects
remain active and run in their registration order.

`promstates(promiseFn, initialValue?, ultimately?)` returns a runner with
lazy derived `result`, `error`, and `isRunning` projections. Starting a
run publishes `isRunning: true`; fulfillment stores the result, while
rejection stores the rejection and keeps the prior result.

Known current limitations:

- Falsy `initialValue` values in `promstates` become `undefined`.
- A synchronous throw from `promiseFn` before it returns a promise leaves
  `isRunning` true and bypasses `ultimately`.
- Concurrent runs share one state object; settlement order wins.

## Runtime recognition

`value(input)` unwraps only an outer source or derived signal. All other
values, including containers that hold signals, are returned unchanged.
`valueIsSourceSignal`, `valueIsDerivedSignal`, and `valueIsSignal` are
structural checks of the `type` discriminator only.

## Type variance

The public signal containers support directional widening. When `Narrow` is
assignable to `Wide`, a `SourceSignal<Narrow>` or
`DerivedSignal<Narrow>` is assignable to its matching `Wide` form. A
widened source view accepts writes from the wider type.

```ts
const narrow = signal<1>(1);
const wide: SourceSignal<number | boolean | string> = narrow;

wide.value = "text";
wide.value = false;
```

The inverse assignment is rejected when the plain wide value is not assignable
to the narrow value. See [type-variance.md](./type-variance.md).
