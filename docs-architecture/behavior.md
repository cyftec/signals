# Behavioral Inventory

Signatures below are simplified. The exported TypeScript declarations and
[semantics.md](./semantics.md) are authoritative.

## Core

### `signal(initialValue, nonNullInitialValue?)`

Creates `SourceSignal<T>`:

- `type: "source-signal"`
- mutable `value: T`
- readonly `id: number`
- readonly `prevValue: T | undefined`
- `mutateWith((oldValue) => nextValue): void`

The optional hint selects a data-method family when the initial value is
nullish. Source values notify installed effects synchronously after a changed
assignment.

### `derive(catcher, nonNullInitialValue?)`

Creates `DerivedSignal<T>`:

- `type: "derived-signal"`
- readonly `value: T`

Reading `value` calls `catcher()`. It is not a cached or independently
updating computation. The optional hint selects non-mutating data methods.

### `effect(callback)`

Runs `callback` immediately and returns:

```ts
type Receiver = {
  readonly id: number;
  readonly run: () => void;
};
```

Only source reads during the immediate callback run become dependencies.
`run()` runs the callback but does not collect new dependencies.

## Attached method families

### Arrays

Source-array mutators, all returning `void`:

```ts
array.mutate.concat(...itemsOrArrays);
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

Source and derived arrays provide lazy `DerivedSignal` projections:

```text
at, concat, every, filter, find, findIndex, findLast, findLastIndex,
length, map, reduce, reduceRight, some, toReversed, toSorted, toSpliced,
lastItem, partition
```

`partition(predicate, thisArg?)` returns `[passing, failing]`.

### Objects

Plain-object sources provide `.mutate.set(partial)`, a shallow merge.
Source and derived plain objects provide:

- `keys()`
- `get(key)`
- `props()`

`props()` creates entries only for keys visible when it is called.

### Strings

String sources expose transformations under `.mutate`: `concat`,
`deepTrim`, padding, repetition, replacement, slicing, trimming, locale
case conversion, and ordinary case conversion.

Source and derived strings expose lazy versions of the matching read-only
native methods plus `length()` and `deepTrim()`.

### Numbers and booleans

Source and derived numbers provide `toExponential`, `toFixed`,
`toPrecision`, `toLocaleString`, and `toConfined(start, end)`.
Parameters may be signals.

Boolean source signals provide `.mutate.toggle()`. Derived booleans have no
boolean-specific data method.

## Generic helpers

Every source and derived signal receives:

```ts
input.or(alternative);
input.is.truthy();
input.is.falsy();
input.is.equalTo(other);
input.is.notEqualTo(other);
input.if.truthy().then(whenTruthy, whenFalsy);
```

Numbers additionally have the four measure comparisons; strings and arrays
provide the same comparison surface under `.is.length` and `.if.length`.
All results are lazy `DerivedSignal` values.

`nullable(input)` supplies this generic surface for a static type that
contains at least one primitive branch.

## Convenience APIs

### `compute`

```ts
const total = compute((left: number, right: number) => left + right, a, b);
```

Returns a lazy derived result. `a` and `b` may be plain values or signals.

### `tmpl`

```ts
const text = tmpl`Hello ${name}; count: ${count}`;
```

Returns a lazy derived string. Expressions may be plain values, signals, or
zero-argument functions. Nullish expressions render as empty strings.

### `receive` and `transmit`

```ts
const links = receive(receiver, first, second);
const link = transmit(source, left, right);
```

Both APIs create immediate effects. `receive` returns one receiver per
transmitter; `transmit` returns one receiver for the broadcast.

### `promstates`

```ts
const [run, result, error, isRunning] = promstates(fetchUser);
```

Returns a runner and three lazy derived property projections over an internal
object source signal.

## Utilities and types

`value(input)` unwraps an outer source or derived signal. The type guards
`valueIsSourceSignal`, `valueIsDerivedSignal`, and `valueIsSignal` inspect
the discriminator without reading `value`.

The principal types are `SourceSignal<T>`, `DerivedSignal<T>`,
`Signal<T>`, `MaybeSignal<T>`, `BaseSourceSignal<T>`,
`BaseDerivedSignal<T>`, `MaybeSignalValues<T>`, `PlainValue<T>`, and
`PlainValues<T>`.
