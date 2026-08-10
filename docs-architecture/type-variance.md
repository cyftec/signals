# Signal Type Variance Contract

The signal declarations deliberately support directional widening. This is a
public TypeScript contract and is verified by `type-tests/variance.typecheck.ts`.

## Core rule

When `Narrow` is assignable to `Wide`, the matching signal container also
widens:

```ts
SourceSignal<Narrow>  -> SourceSignal<Wide>
DerivedSignal<Narrow> -> DerivedSignal<Wide>
BaseSourceSignal<Narrow>  -> BaseSourceSignal<Wide>
BaseDerivedSignal<Narrow> -> BaseDerivedSignal<Wide>
Signal<Narrow>        -> Signal<Wide>
MaybeSignal<Narrow>   -> MaybeSignal<Wide>
```

For example:

```ts
const literal = signal<1>(1);
const wide: Signal<number | boolean | string> = literal;

const writable: SourceSignal<number | boolean | string> = literal;
writable.value = false;
writable.value = "ready";
```

The reverse direction is invalid unless the wide plain value is assignable to
the narrow plain value.

## Object and array views

The type visible through the wider view controls writes, helper arguments,
callback parameters, and derived result types.

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

Source-array mutators are intentionally typed with a shared mutable array
surface so they do not make the enclosing source signal invariant. Object
mutators and array projections use method signatures for the same reason.

## Signal-capable inputs

APIs accepting `MaybeSignal<T>` accept a narrower signal when their declared
value type is wider. This applies to:

- `value` and `getPlainMethodParams`;
- `compute` arguments;
- `nullable` inputs;
- signal-valued data-method arguments;
- `receive` transmitters; and
- `transmit` transmitters with wider source receivers.

```ts
const narrow = signal<1>(1);
const receiver = signal<number | boolean | string>(0);

transmit(narrow, receiver);
```

## Union method surfaces

Widening does not invent data-specific helpers that are unsafe for another
branch. A mixed `SourceSignal<string | number>` has generic helpers, but it
does not expose string-only `trim()` or number-only `toFixed()`.

## Verification

Run:

```bash
bun run test:types
```

The type suite covers positive and negative container assignments, wide source
writes, array/object projections, primitive unions, maybe-signal inputs,
`compute`, `value`, `nullable`, `receive`, and `transmit`.
