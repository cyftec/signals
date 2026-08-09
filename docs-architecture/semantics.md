# Semantics

This document defines the behavior that callers of `@cyftec/signal` may rely on. The source and behavioral tests are authoritative when this document is incomplete. The library has its own model; behavior from another reactive system is not part of this contract.

The sections below distinguish:

- **Guarantee** — observable behavior supported by the current implementation and tests.
- **Current limitation** — observable behavior that callers must account for, but which may be improved in a future release.
- **Implementation detail** — useful contributor context that should not be treated as a permanent public promise.

## Signal kinds

### Source signals

`signal(initialValue, nonNullableInitialValue?)` returns a mutable `SourceSignal<T>` with `type === "source-signal"`.

Guarantees:

- `.value` reads the current value and accepts assignments.
- `.prevValue` is `undefined` initially and becomes the prior stored value after a successful update.
- Assigning a strictly equal value does not change `.prevValue` or notify effects.
- Initial object and array inputs are isolated from subsequent mutation of the original input.
- Object and array values returned by `.value` are copies; mutating a returned value does not mutate the signal.
- `.dispose()` immediately clears the effects subscribed to that source. The source remains readable and writable afterward.
- Updates and effect propagation are synchronous.

Current limitations:

- Equality uses strict identity/equality, not structural comparison.
- Object and array setter inputs are stored directly rather than copied. Mutating an assigned input afterward can change stored data without an assignment, dependency notification, or `prevValue` update.
- `.prevValue` and the low-level `.nonReactiveValue` accessor can expose stored object or array references. Treat those values as read-only.
- Source `.dispose()` clears only the source's subscriber Set. It does not remove that source from each affected effect's stimulus bookkeeping, so later disposing one of those effects can throw when it tries to remove the already-cleared subscription.
- An unchanged assignment currently writes a diagnostic to the console. The diagnostic text is not a semantic guarantee.
- No transaction or batch API coalesces several writes.

### Derived signals

`derive(evaluator, nonNullableInitialValue?)` returns a read-only `DerivedSignal<T>` with `type === "derived-signal"`.

Guarantees:

- The evaluator runs immediately during construction.
- It receives the previous computed value; that argument is `undefined` on the first run.
- It recomputes synchronously when a dependency captured during its initial run changes.
- `.value` is read-only at both the type level and runtime. A forced assignment is ignored.
- `.prevValue` changes only when the computed output changes by strict equality.
- An unchanged computed output does not notify downstream effects.
- Derived signals may depend on source or derived signals.
- `.dispose()` immediately detaches the evaluator from its captured dependencies. The last value stays readable.

Current limitations:

- A second call to `.dispose()` reaches the underlying already-disposed effect and throws.
- Dependencies are captured only during the initial evaluator run; later runs do not add or remove dependencies.

### Dead signals

`deadSignal(input, nonNullableInitialValue?)` returns a read-only `DeadSignal<T>` with `type === "dead-signal"`.

Guarantees:

- The wrapped value is readable through `.value` and cannot be replaced through the public setter.
- `.dispose()` is a no-op and may be called repeatedly.
- Non-mutating data methods and generic logical methods return `DeadSignal` snapshots.
- A dead result does not become reactive merely because one of its method arguments is a live signal.

A dead signal is a value wrapper with signal-shaped projection helpers. It is not a live source or derived computation.

## Dependency tracking

`effect(callback)` returns an `Effect` and invokes `callback` immediately.

Guarantees:

- Reading `.value` from a live signal while the initial callback is running registers that signal as a stimulus for the effect.
- Reading the same signal several times registers one subscription.
- Reading multiple signals registers each one.
- A signal not read during the initial run is not a dependency.
- Dependencies captured in the initial run remain subscribed even if a later branch stops reading them.
- A dependency skipped by the initial branch is not added if a later run starts reading it.
- A dependency write calls the effect synchronously in the same call stack.
- `value(liveSignal)` participates in tracking because it reads the signal's `.value`. Helpers built on `value`, including `compute`, connector effects, method parameters, and operation chains, inherit this behavior.
- Initial callback errors propagate, and the global collection hook is cleared in a `finally` block.

Example of the initial-run rule:

```ts
const enabled = signal(false);
const count = signal(0);

const selected = derive(() => (enabled.value ? count.value : -1));

enabled.value = true; // selected recomputes and reads count
count.value = 1; // selected does not recompute: count was missed initially
```

Current limitations:

- Dependencies are not dynamically reconciled after the first run.
- A single current-effect hook is used, not a nested effect stack. Do not depend on implicit dependency collection across nested effect construction.
- Propagation is recursive and synchronous; the library does not impose a recursion-depth guard or cycle detector.

## Effect execution and disposal

Guarantees:

- An effect runs once before `effect(...)` returns.
- Subsequent runs are synchronous.
- Effects subscribed to one signal are visited in their registration order by the current implementation.
- `.isDisposed` changes from `false` to `true` on disposal.
- `.dispose()` immediately removes the effect from every captured stimulus signal and clears its dependent-signal bookkeeping.
- A disposed effect's `run()` method is a no-op.
- Disposing the same effect twice throws `"This receiver is already destroyed."`.
- `dispose(...items)` calls `.dispose()` on each supplied effect or derived signal in argument order; an empty call is a no-op.

Current limitations:

- If one item passed to `dispose(...)` throws, later items are not disposed by that call.
- If an effect throws during propagation, the error escapes synchronously. There is no retry or error boundary.
- Ordering across a recursively propagating graph is a consequence of synchronous writes and Set iteration, not a separately scheduled topological order.

The returned `Effect` also exposes `run`, `registerStimulusSignal`, `registerDependentSignal`, `removeAllSignals`, and `dependentSignals`. Those are low-level bookkeeping APIs. Their exact data structures are implementation details; ordinary callers should use `dispose()` and `isDisposed`.

## Data-specific methods

Method families are chosen from the initial runtime value, or from the optional non-null exemplar passed as the second argument to `signal`, `derive`, or `deadSignal`.

Guarantees:

- Source-only mutators are grouped under `.mutate` and return `void`.
- A mutator publishes one new value through the base signal and therefore triggers each subscribed effect once.
- Non-mutating methods never change the base value.
- Non-mutating methods on a source or derived signal return live `DerivedSignal` results.
- The same methods on a dead signal return `DeadSignal` snapshots.
- Signal-valued method parameters are unwrapped with `value(...)`; live parameters therefore become dependencies of live results.
- Unsupported value kinds remain usable as base signals without data-specific methods.
- A narrower signal is assignable to the corresponding signal type with a wider value union. For example, `SourceSignal<string>` is assignable to `SourceSignal<string | number>`.
- This widening rule applies to source, derived, dead, live, composed, and every `Maybe*Signal` form. A write through a widened source view is valid and the runtime must honor it. See [type-variance.md](./type-variance.md) for the complete TypeScript contract and test matrix.
- A signal whose value type spans multiple method families exposes only the data-specific helpers shared by every possible branch. Thus `SourceSignal<string | number>` exposes neither string-only nor number-only helpers until it is narrowed.

### Arrays

Source arrays provide these mutators under `.mutate`:

`concat`, `copyWithin`, `fill`, `filter`, `pop`, `push`, `shift`, `toReversed`, `toSorted`, `toSpliced`, and `unshift`.

Array source, derived, and dead signals provide:

`at`, `concat`, `every`, `filter`, `find`, `findIndex`, `findLast`, `findLastIndex`, `length`, `map`, `reduce`, `reduceRight`, `some`, `toReversed`, `toSorted`, `toSpliced`, `lastItem`, and `partition`.

`partition(predicate, thisArg?)` returns `[passing, failing]` and honors the predicate's `thisArg`.

### Objects

Plain-object source signals provide `.mutate.set(partial)`, which performs a shallow merge. Object source, derived, and dead signals provide:

- `keys()` — key projection.
- `get(key)` — one property projection.
- `props()` — an object containing one projection per property that exists when `props()` is called.

The projection set from `props()` is not automatically expanded when later writes introduce new keys.

### Strings

String source signals expose transformation mutators under `.mutate`, including `concat`, `deepTrim`, padding, repetition, replacement, slicing, trimming, and case conversion.

String source, derived, and dead signals expose read-only string projections including character lookup, search, inclusion, comparison, padding, repetition, replacement, splitting, trimming, case conversion, `length()`, and `deepTrim()`.

### Numbers and booleans

Number source, derived, and dead signals provide `toExponential`, `toFixed`, `toPrecision`, `toLocaleString`, and `toConfined`. Bounds and formatting parameters may be signals.

Boolean source signals provide `.mutate.toggle()`. There is no separate boolean read-only data-method family.

Current limitations:

- Method dispatch is fixed at construction. Changing a signal's runtime value to another kind does not replace its attached method family.
- For nullable values, callers must provide a suitable non-null exemplar when methods cannot be inferred from the initial value.
- Object-specific methods are attached only when the dispatch value is a plain object.

## Generic logical methods

Eligible signals expose `or`, `is`, and `if`.

Guarantees:

- `or(alternative)` uses JavaScript `||`, so every falsy value selects the alternative.
- `is.truthy()`, `is.falsy()`, `is.equalTo(value)`, and `is.notEqualTo(value)` return boolean results.
- Numbers also support `greaterThan`, `greaterThanOrEqualTo`, `smallerThan`, and `smallerThanOrEqualTo` under `is` and `if`.
- Strings and arrays expose the same checks for `.length`, for example `text.is.length.greaterThan(3)`.
- Each `if` check returns an object with `.then(truthyOption, falsyOption)`.
- Live bases return derived results that react to live operands and options.
- Dead or plain bases return dead snapshots.
- Equality checks use `===` and `!==`.

`nullable(input)` exposes the same generic method surface for a maybe-signal primitive whose static type may include `null` or `undefined`. It preserves liveness: live inputs produce derived results; dead and plain inputs produce dead results.

## Higher-level APIs

### `compute`

`compute(fn, ...arguments)` returns a derived signal of `fn` called with unwrapped arguments.

- Live signal arguments read through `value(...)` and are tracked.
- Plain and dead arguments contribute values but cannot initiate future updates.
- Errors from `fn` propagate synchronously.

### `receive` and `transmit`

Connector construction is eager because it uses immediate effects.

- `receive(receiver, ...transmitters)` creates one effect per transmitter, immediately assigns each transmitter's current value in argument order, and returns the effects. The receiver therefore initially holds the last transmitter's value. With no transmitters it returns `[]`.
- `transmit(transmitter, ...receivers)` creates one effect, immediately assigns the current transmitter value to every receiver in argument order, and returns that effect. With no receivers it creates a no-op effect.
- Live transmitters continue to propagate synchronously. Plain and dead transmitters perform only the eager initial assignment because no changing dependency is captured.
- Disposing the returned effects disconnects immediately.
- Receivers remain independently mutable.

### `tmpl`

`tmpl` returns a derived interpolated string.

- Live signal expressions and function expressions that read live signals are tracked during the initial derivation.
- Plain expressions are snapshots.
- `null` and `undefined` become empty strings.
- Other values use `.toString()`; conversion errors propagate.

### `promstates`

`promstates(promiseFn, initialValue?, ultimately?)` returns `[runPromise, result, error, isRunning]`.

Guarantees:

- Calling `runPromise` sets `isRunning.value` to `true` before invoking `promiseFn`.
- `isRunning.value` remains `true` while that returned promise is pending.
- Fulfillment stores the result, clears the error, and sets running to `false`.
- Rejection stores the rejection value in `error`, preserves the prior result, and sets running to `false`.
- `ultimately` is passed to `.finally(...)` and runs after fulfillment or rejection.
- The three state projections are derived signals.

Current limitations:

- Falsy initial values (`0`, `false`, `""`, and similar) are currently replaced with `undefined` because initialization uses `initialValue || undefined`.
- A synchronous throw before `promiseFn` returns a promise bypasses the promise chain, leaves `isRunning` true, and does not run `ultimately`.
- Concurrent runs are not counted or ordered. One settlement can set `isRunning` false while another run remains pending, and later settlements overwrite earlier state.
- Rejection values are not normalized to `Error` instances at runtime.

### `op`

`op(input)` is the chainable operation API. It selects number, string/array, or generic operations from the input's evaluated runtime kind at construction.

- Operation methods build lazy evaluator chains.
- Accessing `result`, `truthy`, `falsy`, or `truthyFalsyPair`, or calling `then`, creates a derived signal.
- Live values read by the final evaluator are dependencies.
- Number chains add arithmetic/range comparisons; string and array chains add length comparisons.

Current limitation: the operation family is fixed at construction and is not redispatched if the runtime value kind changes.

## Utilities and type discrimination

Guarantees:

- `value(input)` unwraps source, derived, and dead signals; plain values are returned unchanged. Unwrapping applies only to the outer input: a plain array or object that contains signals remains plain and retains those nested signals.
- Unwrapping a live signal during initial dependency collection tracks it.
- `getPlainMethodParams(...inputs)` applies `value(...)` to each input in order.
- `valueIsSourceSignal`, `valueIsDerivedSignal`, `valueIsLiveSignal`, `valueIsDeadSignal`, and `valueIsSignal` discriminate using the `type` field.
- `valueIsSignal` includes source, derived, and dead signals. `valueIsLiveSignal` includes only source and derived signals.
- `valueIsDeadSignalStringArray(deadSignal([]))` is `true`; the empty array satisfies the all-elements-are-strings check vacuously.

## Implementation details

The following explains the current code but is not an independent compatibility promise:

- `getBaseSignal` stores the current value, previous value, and a Set of effects.
- `EffectHook` holds one current effect during initial collection.
- Each effect stores stimulus signals so immediate disposal can remove itself from them.
- A derived signal uses base-signal storage plus an updater effect, then replaces the public setter with a no-op.
- Data-method factories choose live `derive(...)` or non-live `deadSignal(...)` results from the base kind.
- Propagation is direct Set iteration with no scheduler.
