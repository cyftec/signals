# LLM Guide

Use this guide when changing this repository. The current runtime is the
authority. Do not infer semantics from another signal implementation or from
older source files and documentation.

## Mental model

```text
signal(value)     mutable source value
derive(catcher)   lazy value getter
effect(callback)  immediate callback with fixed source dependencies
```

The most important rule: a `DerivedSignal` evaluates when
`derived.value` is read. It is not a stored reactive computation, does not
cache a result, and has no disposal behavior.

## Source signals

Use `signal` for mutable state:

```ts
const count = signal(0);
count.value = 1;
```

Source writes are synchronous. An effect can observe a source only if the
source was read while the effect was initially installed.

Object and array initial values and getter results are copied. Do not depend on
identity preservation for values returned by `.value`.

## Derived signals

Use `derive` for a value calculated on demand:

```ts
const total = derive(() => price.value * quantity.value);
console.log(total.value);
```

When `total.value` is read inside an effect's initial callback, the source
reads inside the catcher register that effect. Reading a derived value outside
effect installation only evaluates it; it establishes no independent
subscription.

Do not add tests expecting a catcher to run at construction, retain a previous
result, automatically run after a source write, or notify an effect by itself.
Test the observable value after explicitly reading `.value`.

## Effects

```ts
const receiver = effect(() => {
  console.log(count.value);
});

count.value = 2; // callback runs synchronously
receiver.run();  // manually runs the callback
```

Only initial reads are dependencies. Later branches cannot add sources; initial
sources cannot be removed. There is no `dispose()`.

## Helpers

- Source mutation methods live beneath `.mutate`.
- Read-only data helpers return lazy `DerivedSignal` values.
- The runtime method family is selected once by the initial value or optional
  non-null hint.
- `value` and `getPlainMethodParams` unwrap only recognized outer signals.
- `compute`, `tmpl`, `receive`, and `transmit` are built from those core
  mechanisms.

For `receive` and `transmit`, creation is eager because each creates an
immediate effect. The returned receivers are not disposable; later source
writes continue to invoke their installed connections.

## Testing guidance

Prefer behavioral tests:

1. Read a result value explicitly.
2. Change the source or signal-valued argument.
3. Read the result again and assert the new observable value.
4. For effects, assert initial execution and synchronous reruns separately.

Line coverage is insufficient for conditional logic. Include both outcomes of
predicates, searches, comparisons, confinement bounds, connector ordering, and
signal-valued operands.

Run `bun run test:types` to verify the public TypeScript contract. The
fixtures cover directional widening: a `Signal<number>`, `Signal<boolean>`,
or `Signal<string>` can be used where a
`Signal<number | boolean | string>` is expected.
