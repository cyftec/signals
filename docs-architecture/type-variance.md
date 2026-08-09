# Signal Type Variance Contract

This document defines the TypeScript assignability contract for
`@cyftec/signal`. It is intentional library behavior. Do not substitute the
variance rules of ordinary mutable containers or another reactive library.

The source, derived, dead, union, and maybe-signal forms all support widening.
When `Narrow` is assignable to `Wide`, every matching signal form containing
`Narrow` is assignable to the corresponding form containing `Wide`.

```ts
type Narrow = { title: string; isSelected: boolean };
type Wide = {
  title: string;
  href?: string;
  isSelected?: boolean;
};

declare const narrow: SourceSignal<Narrow>;
const wide: SourceSignal<Wide> = narrow;

wide.value = { title: "Docs" };
```

The last assignment is valid. `SourceSignal<T>` describes the signal view
available at that program point, rather than permanently restricting the
runtime signal to its first inferred generic argument. Runtime code must honor
the value written through the widened view.

## Core rule

For every `Narrow extends Wide`, these assignments are guarantees:

```ts
SourceSignal<Narrow> -> SourceSignal<Wide>
DerivedSignal<Narrow> -> DerivedSignal<Wide>
DeadSignal<Narrow> -> DeadSignal<Wide>

BaseSourceSignal<Narrow> -> BaseSourceSignal<Wide>
BaseDerivedSignal<Narrow> -> BaseDerivedSignal<Wide>
BaseDeadSignal<Narrow> -> BaseDeadSignal<Wide>

LiveSignal<Narrow> -> LiveSignal<Wide>
Signal<Narrow> -> Signal<Wide>
DerivedOrDeadSignal<Narrow> -> DerivedOrDeadSignal<Wide>

MaybeSourceSignal<Narrow> -> MaybeSourceSignal<Wide>
MaybeDerivedSignal<Narrow> -> MaybeDerivedSignal<Wide>
MaybeDeadSignal<Narrow> -> MaybeDeadSignal<Wide>
MaybeLiveSignal<Narrow> -> MaybeLiveSignal<Wide>
MaybeSignal<Narrow> -> MaybeSignal<Wide>
```

The same rule applies to a value union. For example, every signal kind
containing `string` is assignable to its equivalent containing
`string | number`.

Narrow-to-wide is directional. A `Signal<Wide>` is not assignable to
`Signal<Narrow>` unless `Wide` itself is assignable to `Narrow`.

## Conditional method-surface rule

Method selection follows the declared type at the use site.

After assigning `DerivedSignal<Narrow[]>` to `DerivedSignal<Wide[]>`, array
methods use `Wide[]` in their parameter, callback, and return types:

```ts
declare const narrowItems: DerivedSignal<Narrow[]>;
const wideItems: DerivedSignal<Wide[]> = narrowItems;

const appended = wideItems.concat({ title: "Docs" });
// DerivedSignal<Wide[]>

wideItems.map((item) => item.href);
// DerivedSignal<(string | undefined)[]>
```

The original narrow variable keeps its narrow method surface. This is a normal
consequence of viewing one signal through two declared types; it does not
change which runtime data-method family was attached at construction.

For a union value type, only data-specific methods shared by every possible
branch are visible. This remains true after widening. For example,
`SourceSignal<string | number>` exposes neither `trim()` nor `toFixed()` until
the value is narrowed.

## Required type-definition behavior

### Signal containers and aliases

`SourceSignalMethods`, `DerivedSignalMethods`, and `DeadSignalMethods` must
preserve widening through their conditional branches. The aliases built from
them (`LiveSignal`, `Signal`, all `Maybe*Signal` types, and
`DerivedOrDeadSignal`) must preserve the same direction.

`NonNullSignalValue`, `PlainValue`, `PlainValues`, and `MaybeSignalValues`
must retain the contained widened type without collapsing a signal branch to an
incompatible plain or `never` branch.

### Array methods

The following method contracts depend on `T[number]` and must not make a
signal invariant merely because TypeScript checks a function-valued property
parameter contravariantly:

- `ArrayMutatingMethods`: `concat`, `fill`, `filter`, `push`, `toSorted`,
  `toSpliced`, `unshift`, and every other member whose native signature uses
  the element type.
- `ArrayIntrinsicNonMutatingMethods`: `concat`, `every`, `filter`, `find`,
  `findIndex`, `findLast`, `findLastIndex`, `map`, `reduce`, `reduceRight`,
  `some`, `toSorted`, and `toSpliced`.
- `ArrayCustomNonMutatingMethods.partition`.

These contracts should use method signatures where needed, rather than
function-valued properties, so that the public signal widening contract is
represented consistently. `at`, `length`, `lastItem`, and `toReversed` should
be tested too because their return values contain the element or array type.

The source-array `.mutate` object must not retain a `T`-dependent object type:
TypeScript infers such a nested generic object as invariant even when each
member is a method. It therefore uses a shared `any[]` mutator surface. This
is deliberate: a widened source view must be able to write widened elements;
the source's own generic parameter cannot block that operation.

This affects source, derived, and dead arrays: source mutators are included in
the widening guarantee.

### Object methods

`ObjectMutatingMethods.set`, `ObjectNonMutatingMethods.get`, and
`ObjectNonMutatingMethods.props` must be tested with required-to-optional
property widening. Calling `get` through the wide view must allow the wider
key set and return the corresponding widened property type. `props()` must
retain optional properties as optional projections.

### Primitive and generic methods

`DataMethodValue` normalizes distributed primitive branches. Its behavior must
continue to support:

- a literal or primitive member widening to its primitive base;
- a single primitive signal widening to a primitive union signal; and
- the shared-method rule for mixed primitive unions.

The generic logical contracts (`or`, `is`, `if`, comparison methods, and
`TernaryThen.then`) must accept narrow signal operands wherever their
`MaybeSignal<Wide>` parameter accepts a plain `Narrow` value. The same applies
to number bounds and string/array length comparison operands.

## Every read/unwrap boundary

Any API that unwraps a signal through `value(...)`, directly reads `.value`,
or forwards parameters to `getPlainMethodParams(...)` must accept every narrow
signal form for its declared wide value type. The current source locations are:

- `src/utils/value-getter.ts` — `value`.
- `src/utils/plain-method-params.ts` — `getPlainMethodParams` and therefore
  every signal-valued data-method argument.
- `src/api/compute.ts` — `compute` arguments.
- `src/api/nullable.ts` — `nullable` input.
- `src/api/connectors.ts` — `receive` transmitters and `transmit` transmitter;
  receivers remain source signals but also obey source widening.
- `src/api/operations/` — `op`, `genericOp`, `numberOp`,
  `stringAndArrayOp`, terminal `then`, logical operands, arithmetic operands,
  and length/range operands.
- `src/_core/data-specific-methods/generic-methods.ts` — generic alternatives,
  comparisons, and ternary branches.
- `src/_core/data-specific-methods/array.ts`, `string.ts`, and `number.ts` —
  signal-valued method parameters.

`tmpl` currently accepts `any` expressions, so it cannot reject a narrow
signal at the type level. It still belongs in runtime behavior tests, not in a
variance rejection test.

## Typecheck contract matrix

The typecheck suite must contain a dedicated variance file. Use both
structural and union fixtures:

```ts
type NarrowObject = { title: string; isSelected: boolean };
type WideObject = {
  title: string;
  href?: string;
  isSelected?: boolean;
};

type NarrowArray = NarrowObject[];
type WideArray = WideObject[];
type NarrowPrimitive = string;
type WidePrimitive = string | number;
```

Required groups:

1. Direct assignments for every signal and base-signal type listed in the core
   rule, for objects, arrays, primitives, nullable values, and literals.
2. Reverse assignments marked with `@ts-expect-error` whenever the plain-value
   direction is invalid.
3. Every array mutating and non-mutating method called through a widened source,
   derived, and dead array view. Assert callback parameters and result signal
   types with `expectTypeOf`.
4. Widened object `set`, `get`, and `props` calls, including optional keys and
   result projections.
5. `or`, equality, number comparisons, length comparisons, and every `if.*`
   branch/`then` combination with plain narrow values and source, derived, and
   dead narrow signals.
6. `MaybeSignal`, `MaybeLiveSignal`, every specialized `Maybe*Signal`,
   `MaybeSignalValues`, `PlainValue`, `PlainValues`, and `NonNullSignalValue`
   for narrow-to-wide and union-to-plain cases.
7. `compute`, `value`, `nullable`, every `op` family, and data-method
   signal-valued parameters, with an explicitly wide receiving signature and
   each narrow signal kind as the argument.
8. `receive` and `transmit` with a widened source receiver and narrow source,
   derived, dead, and plain transmitters; assert the inverse, genuinely
   incompatible plain type is rejected.
9. Dispatch surfaces for `string | number`, array-or-non-array, nullable
   arrays/objects with exemplars, `any`, `unknown`, and `never`.
10. Runtime companion tests for writes through a widened source view, especially
    array source mutators, object `set`, and direct `.value` assignment.

## Runtime regression matrix

`tests/variance.test.ts` is the runtime companion. It must exercise the
declared widening assignment before invoking a helper; merely testing the same
helper on an inferred wide signal does not cover this contract.

The matrix covers:

- every source-array mutator through `SourceSignal<Narrow[]>` viewed as
  `SourceSignal<Wide[]>`, including insertion of a wide-only element;
- every array projection through widened source, derived, and dead signals;
- live recomputation after a wide source write and dead-snapshot result kinds;
- `partition` passing and failing outputs, `thisArg`, and signal-valued method
  operands;
- required-to-optional object property widening, `set`, `get`, and fixed-key
  `props` behavior;
- literal-to-primitive, primitive-to-union, string, number, boolean, and
  generic logical helper paths; and
- `receive` and `transmit` for narrow source, derived, dead, and plain
  transmitters, including disposal and widened writes made by a transmitter.

The normal data-method suites remain responsible for the full behavior of each
method independent of variance. The variance suite proves that the same
runtime branches remain correct when reached through a widened signal view.

The positive assertions are the primary contract. Negative tests protect only
plain-value-incompatible directions; they must not reject a narrower signal
where the corresponding plain narrow value is accepted.

## Implementation review checklist

Before merging a variance-related change, verify all of the following:

- Every `T`-dependent method parameter is represented without accidentally
  blocking the required widening direction.
- The conditional data-method surface is computed from the use-site declared
  type and retains only methods shared by unions.
- A method invoked through the widened view has widened parameter, callback,
  and result types.
- Every `MaybeSignal`-accepting API accepts the same narrow signal forms as it
  accepts narrow plain values.
- Runtime writes and mutators behave consistently with the widened source view.
- `bun run test:types` passes with the variance matrix enabled.
