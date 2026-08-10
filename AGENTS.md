# @cyftec/signals — Project and Contributor Guide

`@cyftec/signals` is a TypeScript signal library with mutable source values,
lazy derived values, synchronous effects, and data-specific helpers. This is
the repository's canonical technical reference: it combines the behavioral
contract, API inventory, architecture notes, type contract, and contributor
instructions. `README.md` is the permanent GitHub-facing quick guide;
community policies and contribution templates live in their conventional
repository locations.

## Contents

- [Quick start](#quick-start)
- [Semantic contract](#semantic-contract)
- [API inventory](#api-inventory)
- [Architecture](#architecture)
- [Type variance contract](#type-variance-contract)
- [Development and documentation](#development-and-documentation)
- [Contributor and agent instructions](#contributor-and-agent-instructions)

## Quick start

Install the package with Bun:

```bash
bun add @cyftec/signals
```

```ts
import { deadZone, derive, effect, signal } from "@cyftec/signals";

const count = signal(1);
const doubled = derive(() => count.value * 2);

effect(() => {
  console.log(count.value, doubled.value);
  console.log(deadZone(() => count.value));
});

count.value = 2;
```

`effect()` runs its callback immediately. Source signals read during that
initial run are permanently connected to the effect; a later source write runs
the callback synchronously. The returned receiver has no disposal API.

`deadZone(callback)` evaluates a callback without recording its signal reads for
the effect currently being installed. `nonReactiveValue` offers the same
non-collecting read for one source or derived signal.

`derive()` creates a lazy value getter. Its catcher runs whenever `.value` is
read; it does not cache a result, keep a previous value, or independently
notify dependents.

Source signals receive generic logical helpers and a data-method family chosen
from the initial value (or an optional non-null hint):

```ts
const items = signal([1, 2, 3]);
const last = items.lastItem();
items.mutate.push(4);
console.log(last.value); // 4

const user = signal({ name: "Ada", active: false });
const name = user.get("name");
user.mutate.set({ active: true });

const text = signal<string | undefined>(undefined, "");
text.value = "  hello  ";
console.log(text.trim().value); // "hello"
```

Arrays, plain objects, strings, numbers, and source booleans receive their
respective helpers. Mutators exist only on source signals under `.mutate`;
projections always return a lazy `DerivedSignal`.

Main exports are `signal`, `derive`, `effect`, `deadZone`, `compute`, `tmpl`, `receive`,
`transmit`, `promstates`, `nullable`, `value`, `getPlainMethodParams`, and the
runtime signal guards.

## Semantic contract

This is the behavioral contract for the current implementation. It is specific
to this repository: do not import expectations from another reactive library.
When this guide is incomplete, the runtime source and behavioral tests are
authoritative.

### Signal kinds

#### Source signals

`signal(initialValue, nonNullInitialValue?)` returns a writable
`SourceSignal<T>`.

- `type` is `"source-signal"`.
- `value` reads the current value and accepts assignments.
- `nonReactiveValue` reads the stored value without registering an installing effect.
- `prevValue` is initially `undefined`, then contains the previous stored
  value after a successful assignment.
- The initial value and every object/array `value` getter result are copied
  with `newVal`. `nonReactiveValue` returns the stored value directly.
- An assignment strictly equal to the stored value warns, does not notify
  effects, and does not change `prevValue`.
- A different assignment stores the supplied value and synchronously runs the
  registered effects.
- `mutateWith(fn)` evaluates `fn` against the stored value and assigns its
  result.

The optional second argument selects a data-method family for a nullish
initial value. It does not replace the stored initial value.

#### Derived signals

`derive(catcher, nonNullInitialValue?)` returns a read-only
`DerivedSignal<T>`.

- `type` is `"derived-signal"`.
- Every read of `.value` invokes `catcher()` synchronously.
- Every read of `.nonReactiveValue` invokes `catcher()` synchronously without
  recording the source reads it makes.
- It has no cached value, previous value, setter, notification mechanism, or
  disposal API.
- Source signals read by the catcher can register when the derived value is
  read during an effect's initial run.
- Derived projections and generic helpers are also derived signals, so their
  work happens when their `.value` is read.

### Effects and dependency collection

`effect(callback)` creates a receiver with a unique `id`, runs `callback`
immediately, and returns that receiver. A receiver exposes `id` and `run()`;
it has no lifecycle or disposal controls.

During that one immediate callback execution, every source signal read through
`.value` records the receiver. Repeated reads of the same source record it
once. Later writes invoke recorded receivers synchronously, in registration
order.

Dependency collection is intentionally fixed:

- Reads made after the immediate callback run do not add dependencies.
- A source read only in a later conditional branch is never registered.
- A source read initially remains registered even if later runs stop reading
  it.
- The collection marker is cleared with `finally` if the initial callback
  throws.

There is no batching, scheduler, transaction API, dynamic dependency
reconciliation, cycle detection, or recursion guard.

#### Non-collecting reads

`deadZone(callback)` temporarily suspends dependency collection for the
callback. It returns the callback result and propagates its errors; collection
for the surrounding effect resumes afterward, including when the callback
throws. Nested dead zones are supported. The zone matters only during the
immediate installation run of an effect, because later receiver runs do not
collect dependencies.

`source.nonReactiveValue` returns the source's stored value without effect
registration. For objects and arrays this is the stored value itself, unlike
`source.value`, which returns an immutable-helper copy. `derived.nonReactiveValue`
evaluates its catcher inside a dead zone, so source reads reached through that
catcher do not register the installing effect.

### Method selection and evaluation

Every source and derived signal receives generic helpers. Data-specific helpers
are selected once from the initial runtime value or the optional non-null hint.
Dispatch order is array, plain object, string, number, then boolean (source
signals only). Unsupported values receive no data-specific family.

- Array sources expose mutators under `.mutate`: `concat`, `copyWithin`,
  `fill`, `filter`, `pop`, `push`, `shift`, `toReversed`, `toSorted`,
  `toSpliced`, and `unshift`.
- Arrays expose lazy projections including lookups, predicates, transforms,
  reductions, `length`, `lastItem`, and `partition`.
- Plain-object sources expose `.mutate.set(partial)` for shallow merging;
  object projections are `keys()`, `get(key)`, and `props()`. `props()` only
  includes keys present when called.
- String sources expose string transformations under `.mutate`; source and
  derived strings expose lazy read-only string projections plus `deepTrim()`.
- Numbers expose formatting helpers and `toConfined(start, end)`, which clamps
  inclusively.
- Boolean source signals expose `.mutate.toggle()`.

Source mutators publish through normal source assignment. Every read-only
helper returns a lazy `DerivedSignal`. Signal-valued helper arguments are
unwrapped when that derived result is read.

### Generic helpers

`or`, `is`, and `if` are attached to every source and derived signal.

- `or(alternative)` uses JavaScript `||`; every falsy value selects the
  alternative.
- `is` provides truthiness and strict-equality comparisons.
- Number values also provide strict and inclusive measure comparisons.
- Strings and arrays provide those comparisons under `.is.length` and
  `.if.length`.
- `if.*` returns `.then(truthyOption, falsyOption)`; both options are read
  when the resulting value is read before the selected option is returned.
- `nullable(input)` exposes this generic surface for an input type with a
  primitive member.

### Convenience APIs

`compute(fn, ...args)` returns a lazy derived value. When read, it unwraps
each argument with `value()` and calls `fn`.

`tmpl` returns a lazy derived string. On every read it evaluates functions,
reads signals, renders nullish expressions as `""`, and stringifies every
other expression.

`receive(receiver, ...transmitters)` creates one immediate effect per
transmitter. `transmit(transmitter, ...receivers)` creates one immediate effect
for all receivers. Signal transmitters remain connected; plain transmitters
only make their immediate assignment. Multiple connector effects remain active
and run in registration order.

`promstates(promiseFn, initialValue?, ultimately?)` returns a runner with lazy
derived `result`, `error`, and `isRunning` projections. Beginning a run
publishes `isRunning: true`; fulfillment stores the result, while rejection
stores the rejection and preserves the prior result.

Current `promstates` limitations are contractual documentation of the current
implementation:

- Falsy `initialValue` values become `undefined`.
- A synchronous throw from `promiseFn`, before it returns a promise, leaves
  `isRunning` true and bypasses `ultimately`.
- Concurrent runs share a state object; settlement order wins.

### Runtime recognition

`value(input)` unwraps only an outer source or derived signal. Every other
value, including a container that holds signals, is returned unchanged.
`valueIsSourceSignal`, `valueIsDerivedSignal`, and `valueIsSignal` are
structural checks of the `type` discriminator only.

## API inventory

Signatures below are simplified. Exported TypeScript declarations are
authoritative.

### Core

#### `signal(initialValue, nonNullInitialValue?)`

Creates `SourceSignal<T>`:

- `type: "source-signal"`
- mutable `value: T`
- readonly `nonReactiveValue: T`
- readonly `id: number`
- readonly `prevValue: T | undefined`
- `mutateWith((oldValue) => nextValue): void`

The optional hint selects a data-method family when the initial value is
nullish. Changed source values notify installed effects synchronously.

#### `derive(catcher, nonNullInitialValue?)`

Creates `DerivedSignal<T>`:

- `type: "derived-signal"`
- readonly `value: T`
- readonly `nonReactiveValue: T`

Reading `value` calls `catcher()`. It is neither a cached nor an independently
updating computation. The optional hint selects non-mutating data methods.

#### `effect(callback)`

Runs `callback` immediately and returns:

```ts
type Receiver = {
  readonly id: number;
  readonly run: () => void;
};
```

Only source reads during the immediate run are dependencies. `run()` invokes
the callback but does not collect new dependencies.

#### `deadZone(callback)`

Evaluates `callback` and returns its result while suppressing dependency
collection for all signal reads made by that callback. The surrounding effect's
collection context is restored after return or throw.

### Attached method families

#### Arrays

Source-array mutators all return `void`:

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

#### Objects

Plain-object sources provide `.mutate.set(partial)`, a shallow merge. Source
and derived plain objects provide `keys()`, `get(key)`, and `props()`.

#### Strings

String sources expose transformations under `.mutate`: `concat`, `deepTrim`,
padding, repetition, replacement, slicing, trimming, locale case conversion,
and ordinary case conversion. Source and derived strings expose lazy versions
of the matching read-only native methods plus `length()` and `deepTrim()`.

#### Numbers and booleans

Source and derived numbers provide `toExponential`, `toFixed`, `toPrecision`,
`toLocaleString`, and `toConfined(start, end)`. Parameters may be signals.

Boolean source signals provide `.mutate.toggle()`; derived booleans have no
boolean-specific data method.

### Generic helpers

Every source and derived signal receives:

```ts
input.or(alternative);
input.is.truthy();
input.is.falsy();
input.is.equalTo(other);
input.is.notEqualTo(other);
input.if.truthy().then(whenTruthy, whenFalsy);
```

Numbers also provide the four measure comparisons. Strings and arrays provide
the equivalent comparison surface under `.is.length` and `.if.length`. All
results are lazy `DerivedSignal` values.

`nullable(input)` supplies this generic surface for a static type with at least
one primitive branch.

### Convenience APIs

#### `compute`

```ts
const total = compute((left: number, right: number) => left + right, a, b);
```

Returns a lazy derived result. `a` and `b` may be plain values or signals.

#### `tmpl`

```ts
const text = tmpl`Hello ${name}; count: ${count}`;
```

Returns a lazy derived string. Expressions may be plain values, signals, or
zero-argument functions; nullish expressions render as empty strings.

#### `receive` and `transmit`

```ts
const links = receive(receiver, first, second);
const link = transmit(source, left, right);
```

Both APIs create immediate effects. `receive` returns one receiver per
transmitter; `transmit` returns one receiver for the broadcast.

#### `promstates`

```ts
const [run, result, error, isRunning] = promstates(fetchUser);
```

Returns a runner and three lazy derived property projections over an internal
object source signal.

### Utilities and types

`value(input)` unwraps an outer source or derived signal. The guards
`valueIsSourceSignal`, `valueIsDerivedSignal`, and `valueIsSignal` inspect the
discriminator without reading `value`.

Principal types are `SourceSignal<T>`, `DerivedSignal<T>`, `Signal<T>`,
`MaybeSignal<T>`, `BaseSourceSignal<T>`, `BaseDerivedSignal<T>`,
`MaybeSignalValues<T>`, `PlainValue<T>`, and `PlainValues<T>`.

## Architecture

This describes the current runtime structure. The semantic contract above
defines caller guarantees.

### Runtime shape

```text
effect(callback)
  ├─ marks one receiver as being installed
  ├─ runs callback once
  └─ source.value reads register that receiver

deadZone(callback)
  ├─ temporarily clears the installing receiver
  ├─ runs callback
  └─ restores the prior receiver in finally

source.value assignment
  └─ runs every registered receiver synchronously

derived.value read
  └─ invokes its catcher immediately
```

The two runtime signal discriminators are `"source-signal"` for writable
`SourceSignal` values and `"derived-signal"` for read-only lazy
`DerivedSignal` values. A derived signal is not a stored computation: it does
not own an effect, cache a previous result, or propagate updates. It is a value
getter whose source reads can be observed only while an effect installs.

### Core files

- `src/_core/source-signal.ts` constructs source signals, stores their state,
  and attaches helpers.
- `src/_core/derived-signal.ts` constructs the lazy derived getter and
  attaches non-mutating helpers.
- `src/_core/dead-zone.ts` exposes the public non-collecting callback helper.
- `src/_core/effect.ts` creates the immediate callback receiver.
- `src/_core/connector.ts` holds the currently installing receiver and the
  source-to-receiver registration map.
- `src/_core/id-generator.ts` creates source and receiver IDs.
- `src/_core/data-specific-methods/` implements generic, array, object,
  string, number, and boolean helper families.
- `src/_core/_types.ts` defines signal, receiver, and maybe-signal contracts.

`src/index.ts` re-exports the core, API, and utilities.

### Effect registration

`Connector.installReceiver(receiver)` sets one module-level receiver marker,
runs the receiver, clears that marker in `finally`, and stores the receiver by
ID. While the marker exists, a source getter calls
`connectWithNewReceiver(source)`.

The connector maps each source signal to a `Set` of receiver IDs. A source
write looks up that set, resolves each ID from the receiver map, and calls
`run()` directly. This makes propagation synchronous and accounts for the
fixed dependency set and registration-order execution.

`deadZone` delegates to the connector to temporarily clear the installing
receiver. The connector restores the previous receiver with `finally`, which
keeps subsequent reads in the surrounding effect collectible even if the
dead-zone callback throws.

### Source storage

A source signal closes over an immutable-helper copy of its initial value, its
prior stored value, and one generated ID. The getter first attempts effect
registration, then returns `newVal(_value)`. The setter compares its input to
`_value` with `===`; on a difference, it shifts `_value` to `_prevValue`,
stores the input, and asks the connector to run receivers.

`mutateWith` is the shared mutation path for data-method mutators. It calls a
function with the stored value and forwards the returned value to the public
setter.

`nonReactiveValue` bypasses registration and returns `_value` directly. This
is useful for intentional non-collecting reads, but object and array callers
must not mutate that returned stored reference.

### Derived construction and helper dispatch

`derive(catcher, hint?)` returns an object with `type` and `value` getters.
The value getter only calls `catcher()`. Generic helpers and non-mutating data
methods call `derive` again and therefore share this lazy behavior. The
optional hint is passed to data-method dispatch; use it when a nullable value
must have a method family.

The `nonReactiveValue` getter invokes the same catcher inside `deadZone`, so it
remains lazy but does not let the catcher's source reads attach to an installing
effect.

`getNonMutatingDataMethods` and `getMutatingAndNonMutatingDataMethods` select
a family in this order: array, plain object, string, number, boolean for
source methods only, or no data-specific methods. Arrays precede objects
because arrays are objects. Family functions wrap native operations in either
`mutateWith` or a lazy `derive`; `getPlainMethodParams` unwraps
signal-capable arguments at evaluation time.

`getGenericMethods` supplies `or` using JavaScript `||`, `is` comparison
projections, and `if` comparison selectors.

### API composition

- `compute` maps signal-capable arguments through `value` inside a derived
  getter before calling its function.
- `receive` and `transmit` compose immediate effects to copy values.
- `nullable` exposes generic helpers for a maybe-null primitive input.
- `promstates` stores promise state in one object source signal and returns
  property projections.
- `tmpl` is a derived tagged-template evaluator.
- `value` unwraps only recognized outer signals.

## Type variance contract

Signal declarations deliberately support directional widening. This is public
TypeScript behavior, verified by `type-tests/variance.typecheck.ts`.

### Core rule

When `Narrow` is assignable to `Wide`, the matching signal container also
widens:

```text
SourceSignal<Narrow>      -> SourceSignal<Wide>
DerivedSignal<Narrow>     -> DerivedSignal<Wide>
BaseSourceSignal<Narrow>  -> BaseSourceSignal<Wide>
BaseDerivedSignal<Narrow> -> BaseDerivedSignal<Wide>
Signal<Narrow>            -> Signal<Wide>
MaybeSignal<Narrow>       -> MaybeSignal<Wide>
```

```ts
const literal = signal<1>(1);
const wide: Signal<number | boolean | string> = literal;

const writable: SourceSignal<number | boolean | string> = literal;
writable.value = false;
writable.value = "ready";
```

The reverse direction is invalid unless the wide plain value is assignable to
the narrow plain value.

### Object and array views

The wider view controls writes, helper arguments, callback parameters, and
derived result types.

```ts
type Narrow = { title: string; selected: boolean };
type Wide = { title: string; selected?: boolean; href?: string };

const narrow = signal<Narrow[]>([]);
const wide: SourceSignal<Wide[]> = narrow;

wide.value = [{ title: "Docs" }];
wide.mutate.push({ title: "More docs" });

const hrefs = wide.map((item) => item.href);
// DerivedSignal<(string | undefined)[]>
```

Source-array mutators intentionally use a shared mutable array surface so they
do not make the enclosing source signal invariant. Object mutators and array
projections use method signatures for the same reason.

### Signal-capable inputs

APIs accepting `MaybeSignal<T>` accept a narrower signal where the declared
value type is wider. This includes `value`, `getPlainMethodParams`, `compute`
arguments, `nullable` inputs, signal-valued data-method arguments, `receive`
transmitters, and `transmit` transmitters with wider source receivers.

```ts
const narrow = signal<1>(1);
const receiver = signal<number | boolean | string>(0);

transmit(narrow, receiver);
```

### Union method surfaces

Widening does not invent data-specific helpers unsafe for another branch. A
mixed `SourceSignal<string | number>` has generic helpers, but not
string-only `trim()` or number-only `toFixed()`.

## Development and documentation

Use Bun and keep dependencies minimal:

```bash
bun install
bun run test:runtime
bun run test:coverage
bun run test:types
bun run build:meta
bun run build:validate
```

`bun run test:types` verifies the public TypeScript contract, including
directional widening such as assigning `Signal<number>` where
`Signal<number | boolean | string>` is expected. Its fixtures cover positive
and negative container assignments, wide source writes, array/object
projections, primitive unions, maybe-signal inputs, `compute`, `value`,
`nullable`, `receive`, and `transmit`.

### Documentation pipeline

Public `src/` declarations use adjacent TSDoc blocks. The metadata builder
parses them and writes
`website/dev/view/pages/assets/code_entities_meta.json`.

```text
src/**/*.ts TSDoc
  → bun run build:meta
  → code_entities_meta.json
  → bun run build:validate
  → website API pages
```

`build:validate` requires title, summary, remarks, example, see, parameter,
and type-parameter fields. The metadata builder deduplicates function overloads
by source file and export name. This guide is human-authored architecture and
behavior documentation; do not replace it with generated API output.

### Testing guidance

Prefer behavioral tests over internal implementation tests unless the latter
are necessary. For lazy helper behavior:

1. Read a result explicitly.
2. Change the source or signal-valued argument.
3. Read the result again and assert the new observable value.
4. For effects, assert immediate execution and synchronous reruns separately.

Line coverage is insufficient for conditional logic. Cover both outcomes of
predicates, searches, comparisons, confinement bounds, connector ordering, and
signal-valued operands.

## Contributor and agent instructions

### Purpose and non-negotiable rule

This repository implements a custom reactive state-management library. Its
behavior is intentionally unique. Never assume semantics from SolidJS, Angular
Signals, Preact Signals, MobX, Vue, React, S.js, or any other reactive system.

If a change depends on a semantic assumption not explicitly verified by source
code, tests, or this guide, stop and ask rather than guessing. The current
runtime is authoritative when documentation is incomplete.

### Required reading and mental model

Read this entire guide before making changes. The essential model is:

```text
signal(value)     mutable source value
derive(catcher)   lazy value getter
effect(callback)  immediate callback with fixed source dependencies
```

Use `signal` for mutable state. Object and array initial values and getter
results are copied, so callers must not rely on identity preservation. Use
`derive` for values calculated on demand. Reading a derived value outside
effect installation only evaluates it; it creates no independent subscription.

Do not add tests expecting a catcher to run at construction, retain a previous
result, automatically run after a source write, or notify an effect itself.
Test observable values only after explicitly reading `.value`.

For `receive` and `transmit`, construction is eager because each creates an
immediate effect. Their receivers cannot be disposed, and later source writes
continue to invoke their installed connections.

### Before implementation

1. Verify requirements.
2. Identify assumptions.
3. Identify risks.
4. Identify tradeoffs.
5. Propose a plan.

For major work, wait for approval before implementation. Stop and ask if
requirements are ambiguous, multiple valid solutions exist, behavior is
undocumented, a public API must change, a dependency must be added, a large
refactor is required, repository structure must change, or documentation
appears inconsistent with code.

### Public API and completion rules

Do not change public behavior without approval. If it changes, update the
behavioral tests and this guide's semantic contract, API inventory, and
architecture sections.

Before completing work, report files changed, assumptions made, risks
identified, recommended follow-up work, and any uncertainty explicitly.
