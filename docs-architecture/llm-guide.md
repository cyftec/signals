# LLM Guide for `@cyftec/signal`

Use this guide when writing or reviewing code against this repository. The library has custom semantics. Do not fill gaps from another reactive library: verify behavior in [semantics.md](./semantics.md), [behavior.md](./behavior.md), source, and behavioral tests.

The signal type system also has an intentional widening contract: narrow signal
types are accepted by matching wider signal types, including source signals.
Read [type-variance.md](./type-variance.md) before changing generic signal or
conditional data-method types.

## Fast mental model

```text
signal(value)     → mutable SourceSignal
derive(evaluator) → read-only live DerivedSignal
deadSignal(value) → read-only non-live DeadSignal snapshot
effect(callback)  → immediate synchronous observer
```

Five rules prevent most mistakes:

1. Effects and derives collect dependencies only during their initial execution.
2. `value(liveSignal)` is a tracked read; it does not opt out of reactivity. It unwraps only an outer signal, never signals nested inside a plain container.
3. Updates are synchronous and unbatched.
4. Source mutations use `.mutate`; read-only data methods return signals.
5. Effect and derived disposal is immediate, and disposing one twice throws.

## Correct imports

```ts
import {
  compute,
  deadSignal,
  derive,
  dispose,
  effect,
  nullable,
  op,
  promstates,
  receive,
  signal,
  tmpl,
  transmit,
  value,
} from "@cyftec/signal";
```

The package scope is `@cyftec`, not `@cyftech`.

## Choose the right signal kind

### Mutable state: `signal`

```ts
const count = signal(0);

count.value = 1;
console.log(count.prevValue); // 0
```

Use assignment to replace a value. Assigning a strictly equal value does not update `prevValue` or notify effects.

For object and array values, do not mutate the result of `.value` and expect the signal to change. Initial values and getter results are copied, but setter inputs are stored directly. After assigning an object or array, do not mutate that original reference; publish another assignment or use `.mutate`. Treat `prevValue` and the low-level `nonReactiveValue` accessor as read-only because they can expose raw stored references:

```ts
const items = signal([1, 2]);
items.mutate.push(3);

const user = signal({ name: "Ada", active: false });
user.mutate.set({ active: true }); // shallow merge
```

### Computed live state: `derive`

```ts
const price = signal(10);
const quantity = signal(2);
const total = derive(() => price.value * quantity.value);
```

The evaluator runs immediately. Its optional argument is the previous computed result:

```ts
const history = derive<number[]>((previous) => [
  ...(previous ?? []),
  count.value,
]);
```

The public value is read-only. Dispose the derived signal when it is no longer needed.

### Non-live signal-shaped values: `deadSignal`

```ts
const fixed = deadSignal([1, 2, 3]);
const doubled = fixed.map((item) => item * 2);

console.log(doubled.type); // "dead-signal"
console.log(doubled.value); // [2, 4, 6]
```

Dead methods calculate snapshots. A live signal passed as an argument does not make the dead result reactive.

## Dependency collection

Always reason about the first call.

```ts
const enabled = signal(false);
const count = signal(0);

const selected = derive(() => {
  return enabled.value ? count.value : -1;
});
```

The initial run reads `enabled` but not `count`. Changing `enabled` reruns the evaluator, but the later `count` read does not add a dependency. A subsequent `count` write will not rerun `selected`.

If both values must always be dependencies, read both before branching:

```ts
const selected = derive(() => {
  const isEnabled = enabled.value;
  const currentCount = count.value;
  return isEnabled ? currentCount : -1;
});
```

Dependencies read initially remain subscribed even if a later branch no longer reads them.

### `value(...)` tracks live inputs

```ts
const count = signal(1);

effect(() => {
  console.log(value(count)); // count is captured
});
```

This behavior is why `compute`, method parameters, connector effects, and operation chains react to live inputs.

### Effects run now

```ts
let runs = 0;
const watcher = effect(() => {
  runs++;
  void count.value;
});

console.log(runs); // 1
count.value = 2;
console.log(runs); // 2, before the assignment statement returns
```

There is no automatic batching. Two writes can cause two runs.

## Disposal

```ts
const watcher = effect(() => console.log(count.value));

watcher.dispose();
count.value = 2; // watcher does not run
```

Disposal removes subscriptions immediately. Do not write code that expects one final run or cleanup on the next update.

Effect disposal is not idempotent:

```ts
watcher.dispose(); // throws: already disposed
```

Derived disposal delegates to its internal effect and also throws when repeated. Dead-signal disposal is a repeatable no-op.

For several live resources:

```ts
dispose(firstDerived, secondDerived, watcher);
```

Do not include an already-disposed item unless you intend the call to throw before later items are processed.

## Data methods

### Liveness rule

The same read-only method name has a result matching the base category:

```ts
signal([1, 2]).length().type;     // "derived-signal"
derive(() => [1, 2]).length().type; // "derived-signal"
deadSignal([1, 2]).length().type; // "dead-signal"
```

Source-only mutators return `void` and live under `.mutate`.

### Nullable initial values

Method families are selected at construction. Supply a non-null exemplar when the initial value does not reveal the intended family:

```ts
const text = signal<string | undefined>(undefined, "");
const rows = signal<Array<{ id: number }> | null>(null, []);

text.value = " hello ";
rows.value = [{ id: 1 }];
```

The second argument selects methods; it is not a fallback assignment to `.value`.

### Arrays

Use `.mutate` for updates:

```ts
const items = signal([3, 1, 2]);
items.mutate.toSorted((a, b) => a - b);
items.mutate.filter((item) => item > 1);
```

Use direct methods for projections:

```ts
const selectedIndex = signal(0);
const selected = items.at(selectedIndex);
const sorted = items.toSorted((a, b) => a - b);
const [positive, nonPositive] = items.partition((item) => item > 0);
```

Live signal parameters such as `selectedIndex` are captured by the returned live result.

Available array mutators are `concat`, `copyWithin`, `fill`, `filter`, `pop`, `push`, `shift`, `toReversed`, `toSorted`, `toSpliced`, and `unshift`.

Available projections are `at`, `concat`, `every`, `filter`, `find`, `findIndex`, `findLast`, `findLastIndex`, `length`, `map`, `reduce`, `reduceRight`, `some`, `toReversed`, `toSorted`, `toSpliced`, `lastItem`, and `partition`.

### Objects

```ts
const user = signal({ name: "Ada", role: "admin" });
const name = user.get("name");
const keys = user.keys();
const props = user.props();

user.mutate.set({ name: "Grace" });
```

`set` is shallow. `props()` creates projections only for keys present when it is called.

### Strings

```ts
const text = signal("  hello   world  ");
const clean = text.deepTrim();

text.mutate.deepTrim();
text.mutate.toUpperCase();
```

Direct string methods produce signals. Source transformations under `.mutate` replace the source value.

### Numbers and booleans

```ts
const amount = signal(12.345);
const digits = signal<number | undefined>(2);
const formatted = amount.toFixed(digits);
const confined = amount.toConfined(0, 10);

const enabled = signal(false);
enabled.mutate.toggle();
```

## Generic logic

### Fallbacks

```ts
const name = signal<string | undefined>(undefined, "");
const displayName = name.or("anonymous");
```

`or` uses `||`, so `0`, `false`, `""`, `NaN`, `null`, and `undefined` all choose the alternative.

### Boolean checks

```ts
const ready = name.is.truthy();
const matches = name.is.equalTo("Ada");
```

### Numeric checks

```ts
const count = signal(5);
const inRange = count.is.greaterThanOrEqualTo(1);
const label = count.if.smallerThan(10).then("small", "large");
```

### Length checks

```ts
const items = signal([1, 2]);
const populated = items.is.length.truthy();
const message = items.if.length.greaterThan(3).then("many", "few");
```

Comparison values and both `then` options may be signals. Live bases produce live derived results; dead bases produce dead snapshots.

### `nullable`

Use `nullable` when a primitive input's static type may itself be absent or may be any signal category:

```ts
const maybeCount: SourceSignal<number> | undefined = signal(5);
const logical = nullable(maybeCount);
const valueOrZero = logical.or(0);
```

`nullable` does not convert a plain value into a live source. A plain or dead input produces dead results.

## Convenience APIs

### `compute`

```ts
const subtotal = compute(
  (price, quantity) => price * quantity,
  price,
  quantity,
);
```

Prefer `compute` when a normal function already describes the calculation and the arguments may be signals. It unwraps arguments with tracked `value(...)` reads.

### `tmpl`

```ts
const greeting = tmpl`Hello ${name}; count: ${count}`;
const doubledText = tmpl`Double: ${() => count.value * 2}`;
```

Signal and function expressions can be reactive. Plain expressions are fixed. Nullish expressions become empty strings.

### Connectors

Connector construction synchronizes immediately:

```ts
const first = signal("first");
const second = signal("second");
const receiver = signal("");

const links = receive(receiver, first, second);
console.log(receiver.value); // "second"
```

`receive` creates one effect per transmitter, so the last current value wins during eager initialization. `transmit` creates one effect and eagerly initializes receivers in order:

```ts
const source = signal(1);
const left = signal(0);
const right = signal(0);
const link = transmit(source, left, right);
```

Plain and dead transmitters perform the initial assignment but have no future changes to propagate. Dispose returned effects to disconnect immediately.

### Promise state

```ts
const [run, result, error, isRunning] = promstates(loadUser);

const pending = run("ada");
console.log(isRunning.value); // true while pending
await pending;

if (error.value !== undefined) {
  handleError(error.value);
} else {
  render(result.value);
}
```

On rejection, `result` keeps the last successful value. On fulfillment, `error` is cleared.

Account for current limitations:

- a falsy `initialValue` is stored as `undefined`;
- a synchronous throw before a promise is returned leaves `isRunning` true and skips `ultimately`;
- overlapping runs race and running state is not reference-counted; and
- runtime rejection values are not guaranteed to be `Error` objects.

### Operation chains

`op` remains available for chain-style composition:

```ts
const result = op(count).add(5).mul(2).result;
const acceptable = op(count).isBetween(1, 10).truthy;
const hasItems = op(items).lengthGT(0).truthy;
```

The chain family is selected from the evaluated runtime type when `op` is created. A later type change does not redispatch it. Final getters create derived signals.

## Runtime guards

Use the supplied guards instead of guessing from object shape:

```ts
valueIsSourceSignal(input);
valueIsDerivedSignal(input);
valueIsLiveSignal(input);
valueIsDeadSignal(input);
valueIsSignal(input); // live or dead
```

`valueIsDeadSignalString`, `valueIsDeadSignalStringArray`, and `valueIsMaybeSignalValueOfStringOrArray` cover narrower utility cases.

## Errors and edge cases

- User evaluators and effect callbacks propagate errors synchronously.
- An error during initial effect construction clears the current collection hook in `finally`.
- No cycle guard prevents recursively connected writes.
- Source `.dispose()` clears its subscribers but does not freeze the source.
- Source disposal does not remove that source from each subscribed effect's stimulus bookkeeping; later disposing such an effect can throw while removing the already-cleared subscription.
- Method dispatch is based on construction-time kind and does not change after a value-kind transition.
- Unchanged derived outputs do not notify downstream effects.
- The empty array is a valid dead string array for `valueIsDeadSignalStringArray` because `.every(...)` is vacuously true.

## Review checklist

Before producing code with this library, check:

1. Is the package name exactly `@cyftec/signal`?
2. Were all required dependencies read during the initial effect or derive run?
3. Are source mutations under `.mutate`?
4. Is a nullable signal given a non-null method-dispatch exemplar when needed?
5. Does code expect a live derived result or a dead snapshot?
6. Does connector code account for eager initialization?
7. Does promise code check `error` before trusting a preserved result?
8. Is disposal called exactly once for each live effect/derived resource?
9. Does code rely on batching, dynamic dependency reconciliation, or type redispatch that the library does not provide?
10. Are claims backed by current source or behavioral tests rather than analogy?
