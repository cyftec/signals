# Architecture Overview

This document describes the current runtime structure. For caller guarantees,
see [semantics.md](./semantics.md).

## Runtime shape

```text
effect(callback)
  ├─ marks one receiver as being installed
  ├─ runs callback once
  └─ source.value reads register that receiver

source.value assignment
  └─ runs every registered receiver synchronously

derived.value read
  └─ invokes its catcher immediately
```

There are two runtime signal discriminators:

- `"source-signal"` for writable `SourceSignal` values.
- `"derived-signal"` for read-only lazy `DerivedSignal` values.

Derived signals are not stored computations. They do not own an effect, cache a
previous result, or propagate updates. They are value getters whose source reads
can be observed only when a derived value is read while an effect installs.

## Core files

- `src/_core/source-signal.ts` constructs source signals, stores their state,
  and attaches helpers.
- `src/_core/derived-signal.ts` constructs the lazy derived getter and
  attaches non-mutating helpers.
- `src/_core/effect.ts` creates the immediate callback receiver.
- `src/_core/connector.ts` holds the currently installing receiver and the
  source-to-receiver registration map.
- `src/_core/id-generator.ts` creates source and receiver IDs.
- `src/_core/data-specific-methods/` implements generic, array, object,
  string, number, and boolean helper families.
- `src/_core/_types.ts` defines the signal, receiver, and maybe-signal
  contracts.

`src/index.ts` re-exports the core, API, and utilities.

## Effect registration

`Connector.installReceiver(receiver)` sets one module-level receiver marker,
runs the receiver, clears that marker in `finally`, and stores the receiver by
ID. While the marker exists, a source signal getter calls
`connectWithNewReceiver(source)`.

The connector maps each source signal to a `Set` of receiver IDs. A source
write looks up that set, resolves each ID from the receiver map, and calls
`run()` directly. This makes propagation synchronous and explains both the
fixed dependency set and registration-order execution.

## Source-signal storage

A source signal closes over:

- an immutable-helper copy of its initial value;
- its prior stored value; and
- one generated ID.

The getter first attempts effect registration, then returns `newVal(_value)`.
The setter compares the supplied value with `_value` using `===`. On a
difference it shifts `_value` to `_prevValue`, stores the new input, and
asks the connector to run receivers.

`mutateWith` is the common mutation path used by data-method mutators. It
evaluates a function against the stored value and forwards the returned value
to the public setter.

## Derived-signal construction

`derive(catcher, hint?)` returns an object with a `type` getter and a
`value` getter. The value getter simply calls `catcher()`. Generic helpers
and non-mutating methods use `derive` again, so they share this lazy behavior.

The optional hint is passed to data-method dispatch. Callers should use it when
a nullable value must have a method family attached.

## Method dispatch and implementations

`getNonMutatingDataMethods` and
`getMutatingAndNonMutatingDataMethods` select a family from a runtime value:

1. array;
2. plain object;
3. string;
4. number;
5. boolean for source methods only; or
6. no data-specific methods.

Arrays precede objects because arrays are objects. The concrete family functions
wrap native operations in either `mutateWith` or another lazy `derive`.
`getPlainMethodParams` unwraps signal-capable arguments at evaluation time.

`getGenericMethods` supplies:

- `or` using JavaScript `||`;
- `is` comparison projections; and
- `if` comparison selectors.

## API and utilities

- `compute` maps signal-capable arguments through `value` before calling a
  function inside a derived getter.
- `receive` and `transmit` compose immediate effects to copy values.
- `nullable` exposes generic helpers for a maybe-null primitive input.
- `promstates` stores promise state in one object source signal and returns
  property projections.
- `tmpl` is a derived tagged-template evaluator.
- `value` unwraps only recognized outer signals.

## Documentation pipeline

Public `src/` declarations use adjacent TSDoc blocks. The metadata builder
parses those blocks and writes
`website/dev/view/pages/assets/code_entities_meta.json`.

```text
src/**/*.ts TSDoc
  → bun run build:meta
  → code_entities_meta.json
  → bun run build:validate
  → website API pages
```

`build:validate` checks the required title, summary, remarks, example, see,
parameter, and type-parameter fields. Function overloads in the metadata
builder are deduplicated by source file and export name.
