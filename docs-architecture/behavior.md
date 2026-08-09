# Behavioral Inventory

This is a caller-oriented inventory of the current `@cyftec/signal` surface. For normative details and limitations, read [semantics.md](./semantics.md). Signatures are simplified for readability; TypeScript inference in the source remains authoritative.

## Core primitives

### `signal(initialValue, nonNullableInitialValue?)`

```ts
signal<T>(
  initialValue: T,
  nonNullableInitialValue?: NonNullable<T extends Record<string, any> ? {} : T>,
): SourceSignal<T>
```

Creates a mutable source signal.

Returned base members:

- `type: "source-signal"`
- `value: T` — tracked getter and mutable setter
- `prevValue: T | undefined` — prior successfully stored value
- `dispose(): void` — immediately removes subscribed effects from this source

Setting a strictly equal value does not update `prevValue` or notify effects. Object and array initial values and getter results are isolated copies. Setter inputs are stored directly, however, and `prevValue` and the low-level `nonReactiveValue` accessor can expose raw stored references. Do not mutate those references; publish changes with assignment or `.mutate`.

Source disposal clears that source's subscriber Set but currently leaves the source in each affected effect's stimulus bookkeeping. Disposing one of those effects later can therefore throw while removing the already-cleared subscription.

The optional second argument is a non-null runtime exemplar. Use it when `initialValue` is nullish but the eventual value needs a data-specific method family:

```ts
const items = signal<string[] | undefined>(undefined, []);
```

### `derive(evaluator, nonNullableInitialValue?)`

```ts
derive<T>(
  evaluator: (oldValue: T | undefined) => T,
  nonNullableInitialValue?: NonNullable<T extends Record<string, any> ? {} : T>,
): DerivedSignal<T>
```

Creates a read-only live signal. The evaluator runs immediately, receives the previous computed value, and reruns synchronously for dependencies captured during its initial execution.

Returned base members:

- `type: "derived-signal"`
- `readonly value: T`
- `prevValue: T | undefined`
- `dispose(): void`

A runtime assignment to `value` is ignored. Disposal is immediate and leaves the last computed value readable.

### `deadSignal(input, nonNullableInitialValue?)`

```ts
deadSignal<T>(input: T, nonNullableInitialValue?): DeadSignal<T>
```

Creates a read-only, non-live signal-shaped value.

- `type` is `"dead-signal"`.
- `value` cannot be replaced through the public setter.
- `dispose()` is a repeatable no-op.
- Projection and generic methods produce dead snapshots rather than live derived signals.

Use a dead signal when code benefits from the signal method surface but the input should not establish a live computation.

### `effect(callback)`

```ts
effect(callback: () => void): Effect
```

Runs `callback` immediately and captures live signal values read during that initial call.

Commonly used members:

- `isDisposed: boolean`
- `run(): void`
- `dispose(): void`

`dispose()` unsubscribes immediately. Calling it twice throws `"This receiver is already destroyed."`. `run()` does nothing after disposal.

The returned object also exposes `dependentSignals`, `registerStimulusSignal`, `registerDependentSignal`, and `removeAllSignals`. These are low-level graph-bookkeeping members, not normally needed by application code.

### `dispose(...items)`

```ts
dispose<T extends any[]>(
  ...items: { [K in keyof T]: DerivedSignal<T[K]> | Effect }
): void
```

Calls `.dispose()` on each argument in order. An empty call is valid. Repeating an effect or derived signal that is already disposed causes the underlying double-dispose error and stops iteration.

### `EffectHook`

`EffectHook` is the exported singleton used by the runtime to get or set the effect currently collecting dependencies. It is exposed by the core barrel but should be treated as a low-level integration point.

## Signal types

The principal public unions are:

```ts
type LiveSignal<T> = SourceSignal<T> | DerivedSignal<T>;
type Signal<T> = LiveSignal<T> | DeadSignal<T>;
type MaybeSignal<T> = T | LiveSignal<T> | DeadSignal<T>;
type DerivedOrDeadSignal<T> = DerivedSignal<T> | DeadSignal<T>;
```

Related helpers include `MaybeSourceSignal`, `MaybeDerivedSignal`, `MaybeDeadSignal`, `MaybeSignalValues`, `PlainValue`, `PlainValues`, and `NonNullSignalValue`.

A signal with a narrower value type is accepted where the same signal kind has a wider union value type. For example, `SourceSignal<string>` is valid as `SourceSignal<string | number>`; the same applies to derived, dead, and composed signal input types. A mixed value union exposes only data-specific helpers available on every branch, so string-only and number-only helpers are unavailable on `SourceSignal<string | number>`.

This is an intentional library-wide TypeScript contract, including writes through a widened source-signal view. See [type-variance.md](./type-variance.md) for affected APIs, conditional data-method requirements, and the required typecheck matrix.

## Attached data methods

Data-specific methods are attached from the dispatch value available at construction. Mutators exist only on source signals and are nested under `.mutate`. Read-only methods return a `DerivedSignal` for live inputs and a `DeadSignal` for dead inputs.

Method parameters typed as `MaybeSignal` may be plain, live, or dead values. Live parameter reads are reactive.

### Array signals

Source-only mutation surface:

```ts
array.mutate.concat(...arrays);
array.mutate.copyWithin(target, start, end?);
array.mutate.fill(value, start?, end?);
array.mutate.filter(predicate, thisArg?);
array.mutate.pop();
array.mutate.push(...items);
array.mutate.shift();
array.mutate.toReversed();
array.mutate.toSorted(compareFn?);
array.mutate.toSpliced(start, deleteCount?, ...items);
array.mutate.unshift(...items);
```

These methods return `void`, publish a new array, preserve the prior array in `prevValue`, and notify once.

Read-only projections on source, derived, and dead arrays:

- Element/search: `at`, `find`, `findIndex`, `findLast`, `findLastIndex`, `lastItem`
- Copy/transform: `concat`, `filter`, `map`, `toReversed`, `toSorted`, `toSpliced`
- Predicates: `every`, `some`
- Reduction: `reduce`, `reduceRight`
- Shape: `length`
- Custom split: `partition`, returning `[passing, failing]`

Examples:

```ts
const items = signal([1, 2, 3]);
const length = items.length();
const [odd, even] = items.partition((item) => item % 2 === 1);

items.mutate.push(4);
```

### Object signals

Plain-object sources add:

```ts
object.mutate.set(partial); // shallow merge, returns void
```

Source, derived, and dead objects add:

- `keys()` — returns the current enumerable string keys.
- `get(key)` — returns the selected property.
- `props()` — returns an object of property signals for keys present when called.

```ts
const user = signal({ name: "Ada", active: false });
const { name, active } = user.props();
user.mutate.set({ active: true });
```

### String signals

String sources provide these transformations under `.mutate`:

`concat`, `deepTrim`, `padEnd`, `padStart`, `repeat`, `replace`, `replaceAll`, `slice`, `substring`, `trim`, `trimEnd`, `trimStart`, `toLocaleLowerCase`, `toLocaleUpperCase`, `toLowerCase`, and `toUpperCase`.

Read-only string methods on source, derived, and dead strings:

`at`, `charAt`, `charCodeAt`, `codePointAt`, `concat`, `endsWith`, `includes`, `indexOf`, `lastIndexOf`, `padEnd`, `padStart`, `repeat`, `slice`, `startsWith`, `substring`, `trim`, `trimEnd`, `trimStart`, `length`, `localeCompare`, `normalize`, `replace`, `replaceAll`, `search`, `split`, `toLocaleLowerCase`, `toLocaleUpperCase`, `toLowerCase`, `toUpperCase`, and `deepTrim`.

### Number signals

Source, derived, and dead numbers provide:

- `toExponential(fractionDigits?)`
- `toFixed(fractionDigits?)`
- `toPrecision(precision?)`
- `toLocaleString(locales?, options?)`
- `toConfined(start, end)` — clamps inclusively

Each call returns a signal matching the base's liveness. Parameters such as precision and bounds may themselves be signals.

### Boolean signals

Boolean sources provide one mutator:

```ts
flag.mutate.toggle();
```

It returns `void`, flips the value, updates `prevValue`, and notifies once.

## Generic logical methods

The generic surface is attached to supported signal types and may also be obtained for nullable primitives with `nullable`.

### `or`

```ts
input.or(alternative)
```

Returns `input || alternative`. It is a JavaScript-falsy fallback, not only a nullish fallback.

### `is`

Primitive checks:

```ts
input.is.truthy();
input.is.falsy();
input.is.equalTo(value);
input.is.notEqualTo(value);
```

Number checks additionally expose:

```ts
number.is.greaterThan(value);
number.is.greaterThanOrEqualTo(value);
number.is.smallerThan(value);
number.is.smallerThanOrEqualTo(value);
```

Strings and arrays expose the same checks under `is.length`:

```ts
items.is.length.greaterThan(0);
text.is.length.equalTo(5);
```

### `if ... then`

Every `is` check has a conditional counterpart under `if`. It returns a selector with `then(truthyOption, falsyOption)`:

```ts
const label = count.if.greaterThan(0).then("positive", "not positive");
const state = items.if.length.falsy().then("empty", "populated");
```

Live inputs return derived signals that also track live comparison values and options. Dead and plain inputs return dead snapshots.

## High-level API

### `compute`

```ts
compute<F>(fn: F, ...args: MaybeSignalValues<Parameters<F>>): DerivedSignal<ReturnType<F>>
```

Unwraps each argument with `value(...)`, calls `fn`, and exposes the return value as a derived signal. Live arguments are dependencies; plain and dead arguments are snapshots.

### `nullable`

```ts
nullable<I extends MaybeSignal<unknown>>(input: nullable primitive): GenericMethods<...>
```

Adds `or`, `is`, and `if` to an input whose value type is a primitive and may include `null` or `undefined`.

```ts
const input: SourceSignal<number> | undefined = signal(5);
const present = nullable(input).is.truthy();
```

The result family follows the concrete input: source/derived inputs are live; dead/plain inputs are non-live.

### `receive`

```ts
receive<T>(receiver: SourceSignal<T>, ...transmitters: MaybeSignal<T>[]): Effect[]
```

Creates one immediate effect per transmitter. Construction eagerly assigns each current value to the receiver in order, so the last transmitter supplies the initial receiver value. Live transmitters continue to update it synchronously. Plain and dead transmitters assign once. The returned effects disconnect individually and immediately.

### `transmit`

```ts
transmit<T>(transmitter: MaybeSignal<T>, ...receivers: SourceSignal<T>[]): Effect
```

Creates one immediate effect. Construction eagerly writes the current value to every receiver in order. A live transmitter broadcasts future updates synchronously; a plain or dead transmitter writes only once. Disposing the effect disconnects immediately.

### `tmpl`

```ts
tmpl`...${expression}...`: DerivedSignal<string>
```

Expressions may be signals, functions, or plain values. Signal reads and reads performed by functions during the initial computation become dependencies. Nullish values render as empty strings; other values use `.toString()`.

### `promstates`

```ts
promstates(promiseFn, initialValue?, ultimately?)
// => [runPromise, result, error, isRunning] as const
```

- `runPromise(...args)` returns `Promise<void>`.
- `isRunning.value` becomes `true` before `promiseFn` is invoked and remains true while its returned promise is pending.
- Fulfillment updates `result`, clears `error`, and ends the running state.
- Rejection preserves the prior result, stores the rejection in `error`, and ends the running state.
- `ultimately` is used as the promise chain's `finally` callback.

Known limitations:

- Falsy initial values are currently converted to `undefined`.
- A synchronous throw from `promiseFn` bypasses the chain and leaves running state true.
- Overlapping runs race; running state is not reference-counted.

### `op`

```ts
op<T>(input: MaybeSignal<T> | (() => T))
```

Creates the chain family selected by the initially evaluated runtime kind.

All operation chains provide:

- Result getters: `result`, `truthy`, `falsy`, `truthyFalsyPair`
- Selection: `then(truthyValue, falsyValue)`
- Logic: `or`, `orNot`, `and`, `andNot`
- Equality: `equals`, `notEquals`
- Combined checks: `orBothEqual`, `orBothUnequal`, `andBothEqual`, `andBothUnequal`
- Combined numeric comparisons: `orThisIsLT`, `orThisIsLTE`, `orThisIsGT`, `orThisIsGTE`, and the corresponding `and...` methods

Number chains also provide `add`, `sub`, `mul`, `div`, `mod`, `pow`, `isBetween`, `isLT`, `isLTE`, `isGT`, and `isGTE`.

String and array chains also provide `lengthBetween`, `lengthEquals`, `lengthNotEquals`, `lengthLT`, `lengthLTE`, `lengthGT`, and `lengthGTE`.

Chaining builds evaluators; requesting a result creates a derived signal. Runtime kind changes do not redispatch the chain family.

## Utilities

### `value`

```ts
value<T>(input: MaybeSignal<T> | BaseSignal<T>): T
value<I>(input: I): PlainValue<I>
```

Returns `.value` for source, derived, or dead signals and returns a plain input unchanged. The first overload preserves an explicit `T`; the fallback overload preserves the exact input union and conditionally unwraps its outer signal branches. Nested signals in a plain array or object remain part of that plain value. A live unwrap performed during initial effect collection registers the dependency.

### `getPlainMethodParams`

```ts
getPlainMethodParams(...inputs)
```

Maps `value(...)` over inputs in order. Data-method implementations use it so method parameters may be signals.

### Runtime guards

- `valueIsSourceSignal(input)`
- `valueIsDerivedSignal(input)`
- `valueIsLiveSignal(input)`
- `valueIsDeadSignal(input, primitiveTypes?)`
- `valueIsSignal(input)` — includes live and dead signals
- `valueIsDeadSignalString(input)`
- `valueIsDeadSignalStringArray(input)`
- `valueIsMaybeSignalValueOfStringOrArray(input)`

All guards return booleans and tolerate nullish inputs. `valueIsDeadSignalStringArray` returns true for an empty dead array because every element satisfies the string predicate vacuously.

## Failure and timing summary

- All reactive propagation is synchronous and unbatched.
- Dependencies are captured only during the first effect/derivation execution.
- Effect and derived disposal is immediate; double disposal throws.
- Dead-signal disposal is a repeatable no-op.
- User callback, evaluator, method, conversion, and operation errors propagate unless an API explicitly handles promise rejection.
- There is no cycle detector, scheduler, retry policy, or automatic lifecycle disposal.
