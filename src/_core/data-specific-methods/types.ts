import type {
  DeadSignal,
  DerivedOrDeadSignal,
  DerivedSignal,
  MaybeSignal,
  MaybeSignalValues,
} from "../signals";

/**
 * Determines whether a type is an object literal candidate.
 *
 * Produces `true` for object types other than arrays and functions, and `false`
 * for all remaining types.
 *
 * @template T - The type to inspect
 *
 * @remarks
 * - Readonly arrays are excluded together with mutable arrays
 * - Class instances still satisfy the structural object branch
 *
 * @example
 * ```typescript
 * type RecordCheck = IsObjectLiteral<{ name: string }>; // true
 * type ArrayCheck = IsObjectLiteral<string[]>; // false
 * ```
 *
 * @see {@link IsArray} - For array-specific detection
 * @see {@link NonMutatingMethods} - Where this predicate selects object methods
 */
export type IsObjectLiteral<T> = T extends object
  ? T extends readonly any[]
    ? false
    : T extends (...args: any[]) => any
      ? false
      : true
  : false;

/**
 * Determines whether a type is an array.
 *
 * Produces `true` when the input extends a readonly array and `false` otherwise.
 *
 * @template T - The type to inspect
 *
 * @remarks
 * - Both mutable and readonly arrays satisfy this predicate
 *
 * @example
 * ```typescript
 * type MutableArrayCheck = IsArray<number[]>; // true
 * type ScalarCheck = IsArray<number>; // false
 * ```
 *
 * @see {@link IsObjectLiteral} - For non-array object detection
 * @see {@link NonMutatingMethods} - Where this predicate selects array methods
 */
export type IsArray<T> = T extends readonly unknown[] ? true : false;

/**
 * Determines whether a type is exactly `any`.
 *
 * This guard is needed before method selection because conditional types
 * involving `any` can otherwise satisfy unrelated branches. For example,
 * `IsArray<any>` resolves to `boolean`, which must not cause an arbitrary
 * projected value to receive the array method surface.
 *
 * @template T - The type to inspect.
 */
type IsExactlyAny<T> = 0 extends 1 & T ? true : false;

/**
 * Normalizes a distributed value branch before selecting data-specific methods.
 *
 * @template T - One member of a signal value union.
 */
export type DataMethodValue<T> = [true] extends [IsExactlyAny<T>]
  ? T
  : T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends bigint
          ? bigint
          : T extends symbol
            ? symbol
            : T;

/**
 * Tests whether two types are exactly assignable in both directions.
 *
 * Returns `true` for an exact match and `never` when either directional check
 * fails.
 *
 * @template T - The first type to compare
 * @template U - The second type to compare
 *
 * @remarks
 * - Function wrappers prevent ordinary distributive conditional behavior
 *
 * @example
 * ```typescript
 * type Exact = IsExactly<string, string>; // true
 * type NotExact = IsExactly<string, string | number>; // never
 * ```
 *
 * @see {@link IsUnionAndHasOtherTypeThan} - For detecting mixed unions
 * @see {@link GenericMethods} - Where exact-type checks shape method availability
 */
export type IsExactly<T, U> =
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2
    ? (<G>() => G extends U ? 1 : 2) extends <G>() => G extends T ? 1 : 2
      ? true
      : never
    : never;

/**
 * Detects a union that contains a target type and at least one other type.
 *
 * Produces `true` only when `T` includes part of `U` without being exactly `U`;
 * all other cases resolve to `never`.
 *
 * @template T - The candidate union
 * @template U - The member type to look for
 *
 * @remarks
 * - Exact matches and unions with no matching member both resolve to `never`
 *
 * @example
 * ```typescript
 * type Mixed = IsUnionAndHasOtherTypeThan<string | null, null>; // true
 * type Exact = IsUnionAndHasOtherTypeThan<null, null>; // never
 * ```
 *
 * @see {@link IsExactly} - For exact bidirectional comparison
 * @see {@link HasPrimitive} - For primitive-member detection
 */
export type IsUnionAndHasOtherTypeThan<T, U> = [true] extends [IsExactly<T, U>]
  ? never
  : Extract<T, U> extends never
    ? never
    : Exclude<T, U> extends never
      ? never
      : true;

/**
 * Represents the primitive values supported by generic logical methods.
 *
 * Includes strings, numbers, bigints, booleans, `null`, and `undefined`.
 *
 * @remarks
 * - Objects, functions, symbols, and arrays are not members of this union
 *
 * @example
 * ```typescript
 * const value: Primitive = null;
 * ```
 *
 * @see {@link HasPrimitive} - For detecting members of this union
 * @see {@link GenericMethods} - For the methods selected from primitive values
 */
export type Primitive = string | number | bigint | boolean | null | undefined;

/**
 * Determines whether a type contains at least one supported primitive member.
 *
 * Produces `true` when extracting `Primitive` from `T` is non-empty and `never`
 * otherwise.
 *
 * @template T - The type to inspect
 *
 * @remarks
 * - Union inputs succeed when any member belongs to `Primitive`
 *
 * @example
 * ```typescript
 * type NullableString = HasPrimitive<string | null>; // true
 * type RecordOnly = HasPrimitive<{ value: string }>; // never
 * ```
 *
 * @see {@link Primitive} - The primitive union being extracted
 * @see {@link GenericMethods} - Where this predicate enables logical methods
 */
export type HasPrimitive<T> =
  Extract<T, Primitive> extends never ? never : true;

/**
 * Identifies whether a method input is live or non-live.
 *
 * This discriminator controls whether projection methods return reactive
 * `DerivedSignal` objects or snapshot `DeadSignal` objects.
 *
 * @remarks
 * - `"live"` maps projections to `DerivedSignal`
 * - `"non-live"` maps projections to `DeadSignal`
 *
 * @example
 * ```typescript
 * const inputKind: InputSignalType = "live";
 * ```
 *
 * @see {@link DeriverReturnType} - For the return-type mapping
 * @see {@link GenericMethods} - For a consumer of this discriminator
 */
export type InputSignalType = "live" | "non-live";

/**
 * Identifies the result style of a generic comparison.
 *
 * Selects either a direct signal result or a ternary `then()` continuation.
 *
 * @remarks
 * - `"deriver"` selects a boolean signal
 * - `"ternary"` selects `TernaryThen`
 *
 * @example
 * ```typescript
 * const returnKind: GenericMethodReturnType = "ternary";
 * ```
 *
 * @see {@link ComparisonReturnType} - For the conditional result mapping
 * @see {@link TernaryThen} - For the ternary continuation
 */
export type GenericMethodReturnType = "ternary" | "deriver";

/**
 * Maps an input's liveness category to its projection signal type.
 *
 * Live inputs return `DerivedSignal<T>` while non-live inputs return
 * `DeadSignal<T>`. A statically mixed liveness input returns the public
 * `DerivedOrDeadSignal<T>` union alias.
 *
 * @template InputSignal - The input liveness category
 * @template T - The projected value type
 *
 * @remarks
 * - This mapping is shared by all data-specific and generic projection methods
 *
 * @example
 * ```typescript
 * type LiveNumber = DeriverReturnType<"live", number>; // DerivedSignal<number>
 * type DeadNumber = DeriverReturnType<"non-live", number>; // DeadSignal<number>
 * type MixedNumber = DeriverReturnType<"live" | "non-live", number>;
 * // DerivedOrDeadSignal<number>
 * ```
 *
 * @see {@link InputSignalType} - The mapping key
 * @see {@link ComparisonReturnType} - For comparison-specific mapping
 */
export type DeriverReturnType<InputSignal extends InputSignalType, T> =
  [InputSignal] extends ["live"]
    ? DerivedSignal<T>
    : [InputSignal] extends ["non-live"]
      ? DeadSignal<T>
      : DerivedOrDeadSignal<T>;

/**
 * Defines the fallback method available to supported primitive values.
 *
 * The `or()` method selects an alternative for a falsy input and returns a
 * signal matching the input's liveness category.
 *
 * @template InputSignal - The input liveness category
 * @template P - The primitive input value type
 *
 * @remarks
 * - The result excludes `null` and `undefined` from the original value branch
 * - The alternative may itself be a signal
 *
 * @example
 * ```typescript
 * declare const methods: LogicalOrAlternative<"live", string | undefined>;
 * const text = methods.or("fallback"); // DerivedSignal<string>
 * ```
 *
 * @see {@link GenericMethods} - The conditional method surface containing `or()`
 * @see {@link DeriverReturnType} - For live/dead result mapping
 */
export type LogicalOrAlternative<
  InputSignal extends InputSignalType,
  P extends Primitive,
> = {
  or: <U>(
    alternativeValue: MaybeSignal<U>,
  ) => DeriverReturnType<InputSignal, NonNullable<P> | U>;
};

/**
 * Defines the final branch selector for a ternary comparison.
 *
 * `then()` chooses between two maybe-signal values and returns a signal matching
 * the original input's liveness category.
 *
 * @template InputSignal - The input liveness category
 *
 * @remarks
 * - Both branch values participate in dependency tracking for live inputs
 *
 * @example
 * ```typescript
 * declare const branch: TernaryThen<"live">;
 * const label = branch.then("yes", "no"); // DerivedSignal<string>
 * ```
 *
 * @see {@link ComparisonReturnType} - For selecting this continuation
 * @see {@link IsAndIfComparison} - For the `if` comparison group
 */
export type TernaryThen<InputSignal extends InputSignalType> = {
  then: <U, V>(
    truthyOption: MaybeSignal<U>,
    falsyOption: MaybeSignal<V>,
  ) => DeriverReturnType<InputSignal, U | V>;
};

/**
 * Selects the result of a generic comparison.
 *
 * Ternary comparisons return a `TernaryThen` continuation; direct comparisons
 * return a boolean signal matching the input's liveness.
 *
 * @template InputSignal - The input liveness category
 * @template GenericMethodReturn - Whether the comparison is ternary or direct
 *
 * @remarks
 * - The mapping uses a wrapped conditional to avoid distribution
 *
 * @example
 * ```typescript
 * type Direct = ComparisonReturnType<"live", "deriver">;
 * type Branch = ComparisonReturnType<"live", "ternary">;
 * ```
 *
 * @see {@link TernaryThen} - The ternary result
 * @see {@link DeriverReturnType} - The direct boolean result
 */
export type ComparisonReturnType<
  InputSignal extends InputSignalType,
  GenericMethodReturn extends GenericMethodReturnType,
> = ["ternary"] extends [GenericMethodReturn]
  ? TernaryThen<InputSignal>
  : DeriverReturnType<InputSignal, boolean>;

/**
 * Defines truthiness and strict-equality comparisons.
 *
 * Supplies `truthy()`, `falsy()`, `equalTo()`, and `notEqualTo()` with a shared
 * comparison result type.
 *
 * @template InputSignal - The input liveness category
 * @template GenericMethodReturn - Whether methods return signals or ternary continuations
 * @template P - Retained primitive value type parameter
 * @template R - The resolved comparison result type
 *
 * @remarks
 * - Equality methods use strict JavaScript equality semantics
 *
 * @example
 * ```typescript
 * declare const checks: ExistenceComparison<
 *   "live",
 *   "deriver",
 *   number,
 *   DerivedSignal<boolean>
 * >;
 * const present = checks.truthy();
 * ```
 *
 * @see {@link Comparison} - For the complete comparison surface
 * @see {@link MeasureComparison} - For ordered numeric comparisons
 */
export type ExistenceComparison<
  InputSignal extends InputSignalType,
  GenericMethodReturn extends GenericMethodReturnType,
  R extends ComparisonReturnType<InputSignal, GenericMethodReturn>,
> = {
  truthy: () => R;
  falsy: () => R;
  equalTo: (compareValue: MaybeSignal<unknown>) => R;
  notEqualTo: (compareValue: MaybeSignal<unknown>) => R;
};

/**
 * Defines ordered numeric comparisons.
 *
 * Supplies strict and inclusive greater-than and smaller-than methods with a
 * shared comparison result type.
 *
 * @template InputSignal - The input liveness category
 * @template GenericMethodReturn - Whether methods return signals or ternary continuations
 * @template R - The resolved comparison result type
 *
 * @remarks
 * - Comparison operands may be signals
 *
 * @example
 * ```typescript
 * declare const checks: MeasureComparison<
 *   "live",
 *   "deriver",
 *   DerivedSignal<boolean>
 * >;
 * const positive = checks.greaterThan(0);
 * ```
 *
 * @see {@link Comparison} - For the primitive comparison composition
 * @see {@link ExistenceComparison} - For truthiness and equality checks
 */
export type MeasureComparison<
  InputSignal extends InputSignalType,
  GenericMethodReturn extends GenericMethodReturnType,
  R extends ComparisonReturnType<InputSignal, GenericMethodReturn>,
> = {
  greaterThan: (compareValue: MaybeSignal<number>) => R;
  greaterThanOrEqualTo: (compareValue: MaybeSignal<number>) => R;
  smallerThan: (compareValue: MaybeSignal<number>) => R;
  smallerThanOrEqualTo: (compareValue: MaybeSignal<number>) => R;
};

/**
 * Composes the comparison methods available to a primitive value.
 *
 * Always includes truthiness and equality checks and conditionally includes
 * ordered comparisons when the value type is numeric.
 *
 * @template InputSignal - The input liveness category
 * @template GenericMethodReturn - Whether methods return signals or ternary continuations
 * @template P - The primitive value type being compared
 *
 * @remarks
 * - Non-number primitives do not expose measure comparisons at the type level
 *
 * @example
 * ```typescript
 * declare const checks: Comparison<"live", "deriver", number>;
 * checks.equalTo(1);
 * checks.greaterThan(0);
 * ```
 *
 * @see {@link ExistenceComparison} - The always-present comparison group
 * @see {@link MeasureComparison} - The number-only comparison group
 */
export type Comparison<
  InputSignal extends InputSignalType,
  GenericMethodReturn extends GenericMethodReturnType,
  P extends Primitive,
> = ExistenceComparison<
  InputSignal,
  GenericMethodReturn,
  ComparisonReturnType<InputSignal, GenericMethodReturn>
> &
  (P extends number
    ? MeasureComparison<
        InputSignal,
        GenericMethodReturn,
        ComparisonReturnType<InputSignal, GenericMethodReturn>
      >
    : {});

/**
 * Wraps comparisons for a string or array length.
 *
 * Exposes the ordinary numeric comparison surface beneath a `length` member.
 *
 * @template InputSignal - The input liveness category
 * @template GenericMethodReturn - Whether methods return signals or ternary continuations
 *
 * @remarks
 * - Length comparisons use the same strict and inclusive operations as numbers
 *
 * @example
 * ```typescript
 * declare const checks: LengthComparison<"live", "deriver">;
 * const nonEmpty = checks.length.truthy();
 * ```
 *
 * @see {@link Comparison} - The nested numeric comparison surface
 * @see {@link IsAndIfComparison} - Where length checks are conditionally exposed
 */
export type LengthComparison<
  InputSignal extends InputSignalType,
  GenericMethodReturn extends GenericMethodReturnType,
> = {
  length: Comparison<InputSignal, GenericMethodReturn, number>;
};

/**
 * Defines direct and ternary comparison groups for a supported value.
 *
 * The `is` group returns direct result signals, while the `if` group returns
 * `then()` continuations. Length groups are added for strings and arrays.
 *
 * @template InputSignal - The input liveness category
 * @template T - The primitive or array value type
 *
 * @remarks
 * - Numeric primitives include ordered comparisons
 * - Strings and arrays include nested `length` comparisons
 *
 * @example
 * ```typescript
 * declare const methods: IsAndIfComparison<"live", string>;
 * const nonEmpty = methods.is.length.truthy();
 * const label = methods.if.truthy().then("yes", "no");
 * ```
 *
 * @see {@link Comparison} - The primitive comparison group
 * @see {@link LengthComparison} - The string and array length group
 */
export type IsAndIfComparison<
  InputSignal extends InputSignalType,
  T extends Primitive | any[],
> = {
  is: ([T] extends [Primitive] ? Comparison<InputSignal, "deriver", T> : {}) &
    ([string] extends [T]
      ? LengthComparison<InputSignal, "deriver">
      : [any[]] extends [T]
        ? LengthComparison<InputSignal, "deriver">
        : {});
  if: ([T] extends [Primitive] ? Comparison<InputSignal, "ternary", T> : {}) &
    ([string] extends [T]
      ? LengthComparison<InputSignal, "ternary">
      : [any[]] extends [T]
        ? LengthComparison<InputSignal, "ternary">
        : {});
};

/**
 * Selects the generic logical methods available to a value type.
 *
 * Combines fallback, direct comparison, and ternary comparison surfaces based
 * on the input's primitive, string, array, or object shape.
 *
 * @template InputSignal - The input liveness category
 * @template T - The input value type
 *
 * @remarks
 * - Exact record types receive no generic methods
 * - Primitive-containing types receive `or`, `is`, and `if`
 * - Array-only types receive length-based `is` and `if` groups
 *
 * @example
 * ```typescript
 * declare const methods: GenericMethods<"live", number>;
 * const positive = methods.is.greaterThan(0);
 * ```
 *
 * @see {@link LogicalOrAlternative} - The fallback surface
 * @see {@link IsAndIfComparison} - The comparison surfaces
 */
export type GenericMethods<InputSignal extends InputSignalType, T> = [
  true,
] extends [IsExactlyAny<T>]
  ? IsAndIfComparison<InputSignal, any[]>
  : [true] extends [IsExactly<T, Record<string, any>>]
    ? {}
    : [true] extends [HasPrimitive<T>]
      ? LogicalOrAlternative<InputSignal, Extract<T, Primitive>> &
          IsAndIfComparison<InputSignal, Extract<T, Primitive>>
      : IsAndIfComparison<InputSignal, any[]>;

/**
 * Intrinsic mutating methods for array signals.
 *
 * Defines the array operations that replace a source signal's value while
 * presenting familiar array method names.
 *
 * @template T - The array type
 *
 * @remarks
 * - Includes concat, copy, fill, filter, removal, insertion, reverse, sort, and splice-style updates
 * - All methods return `void`; results are observed through the source signal
 * - The containing source-signal surface exposes these methods under `.mutate`
 *
 * @example
 * ```typescript
 * declare const mutate: ArrayMutatingMethods<number[]>;
 * mutate.push(3);
 * mutate.toSorted((a, b) => a - b);
 * ```
 *
 * @see {@link ArrayMutatingAndNonMutatingMethods} - The complete array source surface
 * @see {@link getArrayMutatingMethods} - The runtime implementation
 */
export type ArrayMutatingMethods<T extends any[]> = {
  concat(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["concat"]>>
  ): void;
  copyWithin(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["copyWithin"]>>
  ): void;
  fill(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["fill"]>>
  ): void;
  filter(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["filter"]>>
  ): void;
  pop(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["pop"]>>
  ): void;
  push(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["push"]>>
  ): void;
  shift(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["shift"]>>
  ): void;
  toReversed(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["reverse"]>>
  ): void;
  toSorted(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["sort"]>>
  ): void;
  toSpliced(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["splice"]>>
  ): void;
  unshift(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["unshift"]>>
  ): void;
};

/**
 * Intrinsic non-mutating methods for array signals.
 *
 * Defines standard read-only array operations whose results preserve the input
 * signal's liveness category.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 * @template T - The array type
 *
 * @remarks
 * - Live inputs return `DerivedSignal` projections
 * - Dead inputs return snapshot `DeadSignal` projections
 * - Signal-valued method parameters remain reactive for live inputs
 *
 * @example
 * ```typescript
 * declare const methods: ArrayIntrinsicNonMutatingMethods<"live", number[]>;
 * const doubled = methods.map((item) => item * 2); // DerivedSignal<number[]>
 * ```
 *
 * @see {@link ArrayCustomNonMutatingMethods} - For library-specific projections
 * @see {@link getArrayIntrinsicNonMutatingMethods} - The runtime implementation
 */
export type ArrayIntrinsicNonMutatingMethods<
  InputSignal extends InputSignalType,
  T extends any[],
> = {
  at(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["at"]>>
  ): DeriverReturnType<InputSignal, ReturnType<Array<T[number]>["at"]>>;
  concat(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["concat"]>>
  ): DeriverReturnType<InputSignal, ReturnType<Array<T[number]>["concat"]>>;
  every(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["every"]>>
  ): DeriverReturnType<InputSignal, ReturnType<Array<T[number]>["every"]>>;
  filter(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["filter"]>>
  ): DeriverReturnType<InputSignal, ReturnType<Array<T[number]>["filter"]>>;
  find(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["find"]>>
  ): DeriverReturnType<InputSignal, ReturnType<Array<T[number]>["find"]>>;
  findIndex(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["findIndex"]>>
  ): DeriverReturnType<
    InputSignal,
    ReturnType<Array<T[number]>["findIndex"]>
  >;
  findLast(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["findLast"]>>
  ): DeriverReturnType<InputSignal, ReturnType<Array<T[number]>["findLast"]>>;
  findLastIndex(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["findLastIndex"]>>
  ): DeriverReturnType<
    InputSignal,
    ReturnType<Array<T[number]>["findLastIndex"]>
  >;
  length(): DeriverReturnType<InputSignal, number>;
  map<U>(
    mapFn: (item: T[number], index: number, array: T) => U,
  ): DeriverReturnType<InputSignal, U[]>;
  reduce<U>(
    reducerFn: (
      previousValue: U,
      currentValue: T[number],
      currentIndex: number,
      array: T,
    ) => U,
    initialValue: MaybeSignal<U>,
  ): DeriverReturnType<InputSignal, U>;
  reduceRight<U>(
    reducerFn: (
      previousValue: U,
      currentValue: T[number],
      currentIndex: number,
      array: T,
    ) => U,
    initialValue: MaybeSignal<U>,
  ): DeriverReturnType<InputSignal, U>;
  some(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["some"]>>
  ): DeriverReturnType<InputSignal, ReturnType<Array<T[number]>["some"]>>;
  toReversed(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["toReversed"]>>
  ): DeriverReturnType<
    InputSignal,
    ReturnType<Array<T[number]>["toReversed"]>
  >;
  toSorted(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["toSorted"]>>
  ): DeriverReturnType<InputSignal, ReturnType<Array<T[number]>["toSorted"]>>;
  toSpliced(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["splice"]>>
  ): DeriverReturnType<
    InputSignal,
    ReturnType<Array<T[number]>["toSpliced"]>
  >;
};

/**
 * Custom non-mutating methods for array signals.
 *
 * Defines the library-specific last-item and partition projections for an
 * array signal.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 * @template T - The array type
 *
 * @remarks
 * - `lastItem()` projects the final element or `undefined`
 * - `partition()` returns passing and failing arrays in that order
 * - Every result follows the input signal's liveness category
 *
 * @example
 * ```typescript
 * declare const methods: ArrayCustomNonMutatingMethods<"live", number[]>;
 * const [even, odd] = methods.partition((item) => item % 2 === 0);
 * ```
 *
 * @see {@link ArrayIntrinsicNonMutatingMethods} - For standard projections
 * @see {@link getArrayCustomNonMutatingMethods} - The runtime implementation
 */
export type ArrayCustomNonMutatingMethods<
  InputSignal extends InputSignalType,
  T extends any[],
> = {
  /** Last item of the array. */
  lastItem(): DeriverReturnType<InputSignal, T[number] | undefined>;
  /** Custom method that splits the array into `[passing, failing]` based on a predicate. */
  partition(
    ...args: MaybeSignalValues<Parameters<Array<T[number]>["filter"]>>
  ): readonly [
    DeriverReturnType<InputSignal, T>,
    DeriverReturnType<InputSignal, T>,
  ];
};

/**
 * Combined non-mutating methods for array signals.
 *
 * Combines the intrinsic array projections with `lastItem()` and `partition()`.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 * @template T - The array type
 *
 * @remarks
 * - Mutation methods are deliberately excluded from this surface
 * - Every projection result follows the input signal's liveness category
 *
 * @example
 * ```typescript
 * declare const methods: ArrayNonMutatingMethods<"non-live", number[]>;
 * const last = methods.lastItem(); // DeadSignal<number | undefined>
 * ```
 *
 * @see {@link ArrayIntrinsicNonMutatingMethods} - The intrinsic portion
 * @see {@link ArrayCustomNonMutatingMethods} - The custom portion
 */
export type ArrayNonMutatingMethods<
  InputSignal extends InputSignalType,
  T extends any[],
> = ArrayIntrinsicNonMutatingMethods<InputSignal, T> &
  ArrayCustomNonMutatingMethods<InputSignal, T>;

/**
 * Combined methods for array source signals.
 *
 * Defines a nested mutation namespace together with direct non-mutating array
 * projections.
 *
 * @template InputSignal - The liveness category used by non-mutating results
 * @template T - The array type
 *
 * @remarks
 * - Mutators are grouped beneath `.mutate`
 * - Projection methods remain direct members
 * - Live source inputs normally select `DerivedSignal` projections
 *
 * @example
 * ```typescript
 * declare const methods: ArrayMutatingAndNonMutatingMethods<"live", number[]>;
 * methods.mutate.push(3);
 * const length = methods.length();
 * ```
 *
 * @see {@link ArrayMutatingMethods} - The nested mutation surface
 * @see {@link ArrayNonMutatingMethods} - The direct projection surface
 */
export type ArrayMutatingAndNonMutatingMethods<
  InputSignal extends InputSignalType,
  T extends any[],
> = {
  /**
   * Source-array mutation is available through every widened array view.
   * The enclosing signal type supplies the view-specific value type; this
   * shared mutator surface must not make the signal itself invariant.
   */
  mutate: ArrayMutatingMethods<any[]>;
} & ArrayNonMutatingMethods<InputSignal, T>;

/**
 * Mutating methods for object signals.
 *
 * Defines the shallow object update operation exposed beneath a source signal's
 * `.mutate` namespace.
 *
 * @template T - The object type
 *
 * @remarks
 * - `set()` performs a shallow merge with the current value
 * - Nested values are replaced rather than deeply merged
 *
 * @example
 * ```typescript
 * declare const mutate: ObjectMutatingMethods<{ name: string; age: number }>;
 * mutate.set({ age: 31 });
 * ```
 *
 * @see {@link ObjectMutatingAndNonMutatingMethods} - The complete object source surface
 * @see {@link getObjectMutatingMethods} - The runtime implementation
 */
export type ObjectMutatingMethods<T extends Record<string, any>> = {
  /** Performs a shallow merge with the current value */
  set(partiallyNewObjectValue: Partial<T>): void;
};

/**
 * Non-mutating methods for object signals.
 *
 * Defines key and property projections whose results preserve the input
 * signal's liveness category.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 * @template T - The object type
 *
 * @remarks
 * - `keys()` projects enumerable string keys
 * - `get()` projects one named property
 * - `props()` creates a property-signal object for keys present when called
 *
 * @example
 * ```typescript
 * type User = { name: string; age: number };
 * declare const methods: ObjectNonMutatingMethods<"live", User>;
 * const name = methods.get("name"); // DerivedSignal<string>
 * ```
 *
 * @see {@link ObjectMutatingMethods} - For shallow object updates
 * @see {@link getObjectNonMutatingMethods} - The runtime implementation
 */
export type ObjectNonMutatingMethods<
  InputSignal extends InputSignalType,
  T extends Record<string, any>,
> = {
  /** Returns the object's keys in a signal matching the base kind. */
  keys(): DeriverReturnType<InputSignal, string[]>;
  /** Returns a signal matching the base kind for a specific property. */
  get<K extends keyof T>(key: K): DeriverReturnType<InputSignal, T[K]>;
  /** Returns an object whose property signals match the base kind. */
  props(): {
    [key in keyof T]: DeriverReturnType<InputSignal, T[key]>;
  };
};

/**
 * Combined methods for object source signals.
 *
 * Defines a nested shallow-mutation namespace together with direct key and
 * property projections.
 *
 * @template InputSignal - The liveness category used by non-mutating results
 * @template T - The object type
 *
 * @remarks
 * - Mutation is exposed beneath `.mutate.set()`
 * - `keys()`, `get()`, and `props()` remain direct members
 *
 * @example
 * ```typescript
 * type User = { name: string; age: number };
 * declare const methods: ObjectMutatingAndNonMutatingMethods<"live", User>;
 * methods.mutate.set({ age: 31 });
 * const name = methods.get("name");
 * ```
 *
 * @see {@link ObjectMutatingMethods} - The nested mutation surface
 * @see {@link ObjectNonMutatingMethods} - The direct projection surface
 */
export type ObjectMutatingAndNonMutatingMethods<
  InputSignal extends InputSignalType,
  T extends Record<string, any>,
> = { mutate: ObjectMutatingMethods<T> } & ObjectNonMutatingMethods<
  InputSignal,
  T
>;

/**
 * Represents values accepted as the search operand of string replacement.
 *
 * Supports literal strings and objects implementing JavaScript's
 * `Symbol.replace` protocol.
 *
 * @remarks
 * - Regular expressions satisfy the protocol-based branch
 *
 * @example
 * ```typescript
 * const search: StringReplaceSearchValue = /hello/gi;
 * ```
 *
 * @see {@link StringReplaceValue} - For the corresponding replacement operand
 * @see {@link StringReplaceParameters} - For the complete parameter tuple
 */
export type StringReplaceSearchValue =
  | string
  | {
      [Symbol.replace](
        string: string,
        replaceValue: string | ((substring: string, ...args: any[]) => string),
      ): string;
    };

/**
 * Represents values accepted as the replacement operand of string replacement.
 *
 * Supports a literal replacement string or a callback that computes the
 * replacement from the matched substring and capture arguments.
 *
 * @remarks
 * - The callback follows the native `String.replace()` argument convention
 *
 * @example
 * ```typescript
 * const replacement: StringReplaceValue = (match) => match.toUpperCase();
 * ```
 *
 * @see {@link StringReplaceSearchValue} - For the search operand
 * @see {@link StringReplaceParameters} - For the complete parameter tuple
 */
export type StringReplaceValue =
  | string
  | ((substring: string, ...args: any[]) => string);

/**
 * Represents the parameters accepted by string replacement methods.
 *
 * Pairs a search value with either a literal or callback replacement value for
 * the mutating and non-mutating string method surfaces.
 *
 * @remarks
 * - Each tuple member may be signalified through `MaybeSignalValues` at call sites
 *
 * @example
 * ```typescript
 * const parameters: StringReplaceParameters = [/hello/g, "hi"];
 * ```
 *
 * @see {@link StringReplaceSearchValue} - The first tuple member
 * @see {@link StringReplaceValue} - The second tuple member
 */
export type StringReplaceParameters = [
  searchValue: StringReplaceSearchValue,
  replaceValue: StringReplaceValue,
];

/**
 * Represents values accepted as a string split separator.
 *
 * Supports literal strings and objects implementing JavaScript's `Symbol.split`
 * protocol.
 *
 * @remarks
 * - Regular expressions satisfy the protocol-based branch
 *
 * @example
 * ```typescript
 * const separator: StringSplitSeparator = /\s+/;
 * ```
 *
 * @see {@link StringSplitParameters} - For the complete split parameter tuple
 * @see {@link StringReplaceSearchValue} - For the analogous replacement protocol
 */
export type StringSplitSeparator =
  | string
  | {
      [Symbol.split](string: string, limit?: number): string[];
    };

/**
 * Represents the optional parameters accepted by string splitting.
 *
 * Contains an optional protocol-aware separator and an optional result limit.
 *
 * @remarks
 * - Omitting both values follows native `String.split()` behavior
 *
 * @example
 * ```typescript
 * const parameters: StringSplitParameters = [",", 2];
 * ```
 *
 * @see {@link StringSplitSeparator} - The separator tuple member
 * @see {@link StringIntrinsicNonMutatingMethods} - The method surface using this tuple
 */
export type StringSplitParameters = [
  separator?: StringSplitSeparator,
  limit?: number,
];

/**
 * Mutating methods for string source signals.
 *
 * Defines string-producing operations that replace a source signal's value and
 * return `void`.
 *
 * @remarks
 * - Includes concatenation, padding, repetition, replacement, slicing, trimming, and case conversion
 * - `deepTrim()` trims the ends and collapses internal whitespace runs
 * - The containing source-signal surface exposes these methods under `.mutate`
 *
 * @example
 * ```typescript
 * declare const mutate: StringMutatingMethods;
 * mutate.deepTrim();
 * mutate.toUpperCase();
 * ```
 *
 * @see {@link StringMutatingAndNonMutatingMethods} - The complete string source surface
 * @see {@link getStringSignalMutatingMethods} - The runtime implementation
 */
export type StringMutatingMethods = {
  concat: (...args: MaybeSignalValues<Parameters<String["concat"]>>) => void;
  deepTrim: () => void;
  padEnd: (...args: MaybeSignalValues<Parameters<String["padEnd"]>>) => void;
  padStart: (
    ...args: MaybeSignalValues<Parameters<String["padStart"]>>
  ) => void;
  repeat: (...args: MaybeSignalValues<Parameters<String["repeat"]>>) => void;
  replace: (...args: MaybeSignalValues<StringReplaceParameters>) => void;
  replaceAll: (...args: MaybeSignalValues<StringReplaceParameters>) => void;
  slice: (...args: MaybeSignalValues<Parameters<String["slice"]>>) => void;
  substring: (
    ...args: MaybeSignalValues<Parameters<String["substring"]>>
  ) => void;
  trim: (...args: MaybeSignalValues<Parameters<String["trim"]>>) => void;
  trimEnd: (...args: MaybeSignalValues<Parameters<String["trimEnd"]>>) => void;
  trimStart: (
    ...args: MaybeSignalValues<Parameters<String["trimStart"]>>
  ) => void;
  toLocaleLowerCase: (
    ...args: MaybeSignalValues<Parameters<String["toLocaleLowerCase"]>>
  ) => void;
  toLocaleUpperCase: (
    ...args: MaybeSignalValues<Parameters<String["toLocaleUpperCase"]>>
  ) => void;
  toLowerCase: (
    ...args: MaybeSignalValues<Parameters<String["toLowerCase"]>>
  ) => void;
  toUpperCase: (
    ...args: MaybeSignalValues<Parameters<String["toUpperCase"]>>
  ) => void;
};

/**
 * Intrinsic non-mutating methods for string signals.
 *
 * Defines standard read-only string operations whose results preserve the input
 * signal's liveness category.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 *
 * @remarks
 * - Covers character lookup, search, concatenation, padding, replacement, splitting, trimming, and case conversion
 * - Live inputs return `DerivedSignal` projections
 * - Dead inputs return snapshot `DeadSignal` projections
 *
 * @example
 * ```typescript
 * declare const methods: StringIntrinsicNonMutatingMethods<"live">;
 * const upper = methods.toUpperCase(); // DerivedSignal<string>
 * ```
 *
 * @see {@link StringCustomNonMutatingMethods} - For `deepTrim()`
 * @see {@link getStringIntrinsicNonMutatingMethods} - The runtime implementation
 */
export type StringIntrinsicNonMutatingMethods<
  InputSignal extends InputSignalType,
> = {
  at: (
    ...args: MaybeSignalValues<Parameters<String["at"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["at"]>>;
  charAt: (
    ...args: MaybeSignalValues<Parameters<String["charAt"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["charAt"]>>;
  charCodeAt: (
    ...args: MaybeSignalValues<Parameters<String["charCodeAt"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["charCodeAt"]>>;
  codePointAt: (
    ...args: MaybeSignalValues<Parameters<String["codePointAt"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["codePointAt"]>>;
  concat: (
    ...args: MaybeSignalValues<Parameters<String["concat"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["concat"]>>;
  endsWith: (
    ...args: MaybeSignalValues<Parameters<String["endsWith"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["endsWith"]>>;
  includes: (
    ...args: MaybeSignalValues<Parameters<String["includes"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["includes"]>>;
  indexOf: (
    ...args: MaybeSignalValues<Parameters<String["indexOf"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["indexOf"]>>;
  lastIndexOf: (
    ...args: MaybeSignalValues<Parameters<String["lastIndexOf"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["lastIndexOf"]>>;
  padEnd: (
    ...args: MaybeSignalValues<Parameters<String["padEnd"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["padEnd"]>>;
  padStart: (
    ...args: MaybeSignalValues<Parameters<String["padStart"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["padStart"]>>;
  repeat: (
    ...args: MaybeSignalValues<Parameters<String["repeat"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["repeat"]>>;
  slice: (
    ...args: MaybeSignalValues<Parameters<String["slice"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["slice"]>>;
  startsWith: (
    ...args: MaybeSignalValues<Parameters<String["startsWith"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["startsWith"]>>;
  substring: (
    ...args: MaybeSignalValues<Parameters<String["substring"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["substring"]>>;
  trim: (
    ...args: MaybeSignalValues<Parameters<String["trim"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["trim"]>>;
  trimEnd: (
    ...args: MaybeSignalValues<Parameters<String["trimEnd"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["trimEnd"]>>;
  trimStart: (
    ...args: MaybeSignalValues<Parameters<String["trimStart"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["trimStart"]>>;
  length: () => DeriverReturnType<InputSignal, number>;
  localeCompare: (
    ...args: MaybeSignalValues<Parameters<String["localeCompare"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["localeCompare"]>>;
  normalize: (
    ...args: MaybeSignalValues<Parameters<String["normalize"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["normalize"]>>;
  replace: (
    ...args: MaybeSignalValues<StringReplaceParameters>
  ) => DeriverReturnType<InputSignal, string>;
  replaceAll: (
    ...args: MaybeSignalValues<StringReplaceParameters>
  ) => DeriverReturnType<InputSignal, string>;
  search: (
    ...args: MaybeSignalValues<Parameters<String["search"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["search"]>>;
  split: (
    ...args: MaybeSignalValues<StringSplitParameters>
  ) => DeriverReturnType<InputSignal, string[]>;
  toLocaleLowerCase: (
    ...args: MaybeSignalValues<Parameters<String["toLocaleLowerCase"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["toLocaleLowerCase"]>>;
  toLocaleUpperCase: (
    ...args: MaybeSignalValues<Parameters<String["toLocaleUpperCase"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["toLocaleUpperCase"]>>;
  toLowerCase: (
    ...args: MaybeSignalValues<Parameters<String["toLowerCase"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["toLowerCase"]>>;
  toUpperCase: (
    ...args: MaybeSignalValues<Parameters<String["toUpperCase"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<String["toUpperCase"]>>;
};

/**
 * Custom non-mutating methods for string signals.
 *
 * Defines the library-specific `deepTrim()` projection for string signals.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 *
 * @remarks
 * - `deepTrim()` trims the ends and collapses internal whitespace runs
 * - Its result follows the input signal's liveness category
 *
 * @example
 * ```typescript
 * declare const methods: StringCustomNonMutatingMethods<"non-live">;
 * const trimmed = methods.deepTrim(); // DeadSignal<string>
 * ```
 *
 * @see {@link StringIntrinsicNonMutatingMethods} - For standard string projections
 * @see {@link getStringCustomNonMutatingMethods} - The runtime implementation
 */
export type StringCustomNonMutatingMethods<
  InputSignal extends InputSignalType,
> = {
  deepTrim: () => DeriverReturnType<InputSignal, string>;
};

/**
 * Combined non-mutating methods for string signals.
 *
 * Combines the intrinsic string projections with the custom `deepTrim()`
 * projection.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 *
 * @remarks
 * - Mutation methods are deliberately excluded from this surface
 * - Every projection result follows the input signal's liveness category
 *
 * @example
 * ```typescript
 * declare const methods: StringNonMutatingMethods<"live">;
 * const contains = methods.includes("needle");
 * ```
 *
 * @see {@link StringIntrinsicNonMutatingMethods} - The intrinsic portion
 * @see {@link StringCustomNonMutatingMethods} - The custom portion
 */
export type StringNonMutatingMethods<InputSignal extends InputSignalType> =
  StringIntrinsicNonMutatingMethods<InputSignal> &
    StringCustomNonMutatingMethods<InputSignal>;

/**
 * Combined methods for string source signals.
 *
 * Defines a nested mutation namespace together with direct non-mutating string
 * projections.
 *
 * @template InputSignal - The liveness category used by non-mutating results
 *
 * @remarks
 * - Mutators are grouped beneath `.mutate`
 * - Projection methods remain direct members
 *
 * @example
 * ```typescript
 * declare const methods: StringMutatingAndNonMutatingMethods<"live">;
 * methods.mutate.trim();
 * const length = methods.length();
 * ```
 *
 * @see {@link StringMutatingMethods} - The nested mutation surface
 * @see {@link StringNonMutatingMethods} - The direct projection surface
 */
export type StringMutatingAndNonMutatingMethods<
  InputSignal extends InputSignalType,
> = {
  mutate: StringMutatingMethods;
} & StringNonMutatingMethods<InputSignal>;

/**
 * Intrinsic non-mutating methods for number signals.
 *
 * Defines standard number-formatting operations whose results preserve the
 * input signal's liveness category.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 *
 * @remarks
 * - Includes exponential, fixed, precision, and locale-aware formatting
 * - Formatting arguments may be signals
 * - Live inputs return `DerivedSignal` results; dead inputs return snapshot `DeadSignal` results
 *
 * @example
 * ```typescript
 * declare const methods: NumberIntrinsicNonMutatingMethods<"live">;
 * const fixed = methods.toFixed(2); // DerivedSignal<string>
 * ```
 *
 * @see {@link NumberCustomNonMutatingMethods} - For confinement
 * @see {@link getNumberIntrinsicNonMutatingMethods} - The runtime implementation
 */
export type NumberIntrinsicNonMutatingMethods<
  InputSignal extends InputSignalType,
> = {
  toExponential: (
    ...args: MaybeSignalValues<Parameters<number["toExponential"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<number["toExponential"]>>;
  toFixed: (
    ...args: MaybeSignalValues<Parameters<number["toFixed"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<number["toFixed"]>>;
  toPrecision: (
    ...args: MaybeSignalValues<Parameters<number["toPrecision"]>>
  ) => DeriverReturnType<InputSignal, ReturnType<number["toPrecision"]>>;
  toLocaleString: (
    locales?: MaybeSignal<string | string[] | undefined>,
    options?: MaybeSignal<Intl.NumberFormatOptions | undefined>,
  ) => DeriverReturnType<InputSignal, ReturnType<number["toLocaleString"]>>;
};

/**
 * Custom non-mutating methods for number signals.
 *
 * Defines the library-specific inclusive confinement projection.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 *
 * @remarks
 * - `toConfined()` clamps values to `[start, end]`
 * - Both bounds may be signals
 * - The result follows the input signal's liveness category
 *
 * @example
 * ```typescript
 * declare const methods: NumberCustomNonMutatingMethods<"non-live">;
 * const confined = methods.toConfined(0, 10); // DeadSignal<number>
 * ```
 *
 * @see {@link NumberIntrinsicNonMutatingMethods} - For standard formatting
 * @see {@link getNumberCustomNonMutatingMethods} - The runtime implementation
 */
export type NumberCustomNonMutatingMethods<
  InputSignal extends InputSignalType,
> = {
  /** Confines the number within a range [start, end]. */
  toConfined: (
    start: MaybeSignal<number>,
    end: MaybeSignal<number>,
  ) => DeriverReturnType<InputSignal, number>;
};

/**
 * Combined non-mutating methods for number signals.
 *
 * Combines standard number formatting with the custom confinement projection.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 *
 * @remarks
 * - Generic logical methods are not part of this data-specific type
 * - Every result follows the input signal's liveness category
 *
 * @example
 * ```typescript
 * declare const methods: NumberNonMutatingMethods<"live">;
 * const text = methods.toPrecision(3);
 * const bounded = methods.toConfined(0, 100);
 * ```
 *
 * @see {@link NumberIntrinsicNonMutatingMethods} - The intrinsic portion
 * @see {@link NumberCustomNonMutatingMethods} - The custom portion
 */
export type NumberNonMutatingMethods<InputSignal extends InputSignalType> =
  NumberIntrinsicNonMutatingMethods<InputSignal> &
    NumberCustomNonMutatingMethods<InputSignal>;

/**
 * Mutating methods for boolean signals.
 *
 * Defines the boolean toggle operation exposed beneath a source signal's
 * `.mutate` namespace.
 *
 * @remarks
 * - `toggle()` flips the boolean value
 * - The operation returns `void`
 *
 * @example
 * ```typescript
 * declare const mutate: BooleanMutatingMethods;
 * mutate.toggle();
 * ```
 *
 * @see {@link BooleanMutatingAndNonMutatingMethods} - The containing source surface
 * @see {@link getBooleanMutatingMethods} - The runtime implementation
 */
export type BooleanMutatingMethods = {
  toggle: () => void;
};

/**
 * Combined data-specific methods for boolean source signals.
 *
 * Defines the `.mutate` namespace that contains the boolean toggle operation;
 * booleans have no separate non-mutating data-specific projections.
 *
 * @remarks
 * - Generic logical methods are attached separately during signal construction
 * - The only boolean-specific operation is `.mutate.toggle()`
 *
 * @example
 * ```typescript
 * declare const methods: BooleanMutatingAndNonMutatingMethods;
 * methods.mutate.toggle();
 * ```
 *
 * @see {@link BooleanMutatingMethods} - The nested mutation surface
 * @see {@link getBooleanSignalMethods} - The runtime implementation
 */
export type BooleanMutatingAndNonMutatingMethods = {
  mutate: BooleanMutatingMethods;
};

/**
 * Selects non-mutating methods from a value's data type.
 *
 * Maps arrays, object literals, exact strings, and exact numbers to their
 * corresponding projection surfaces and maps unsupported values to an empty
 * object type.
 *
 * @template InputSignal - Whether projection results are live derived signals or dead snapshots
 * @template T - The value type used for method selection
 *
 * @remarks
 * - Selection priority is array, object literal, exact string, then exact number
 * - Boolean and unsupported primitive values have no non-mutating data-specific surface
 *
 * @example
 * ```typescript
 * type TextMethods = NonMutatingMethods<"live", string>;
 * type ArrayMethods = NonMutatingMethods<"non-live", number[]>;
 * ```
 *
 * @see {@link MutatingAndNonMutatingMethods} - For source-signal method selection
 * @see {@link getNonMutatingDataMethods} - The runtime dispatcher
 */
export type NonMutatingMethods<InputSignal extends InputSignalType, T> = [
  true,
] extends [IsExactlyAny<T>]
  ? {}
  : [true] extends [IsArray<T>]
    ? ArrayNonMutatingMethods<InputSignal, Extract<T, any[]>>
    : [true] extends [IsObjectLiteral<T>]
      ? ObjectNonMutatingMethods<InputSignal, Extract<T, Record<string, any>>>
      : [true] extends [IsExactly<T, string>]
        ? StringNonMutatingMethods<InputSignal>
        : [true] extends [IsExactly<T, number>]
          ? NumberNonMutatingMethods<InputSignal>
          : {};

/**
 * Selects the full data-specific method surface for a source value.
 *
 * Maps arrays, object literals, exact strings, exact numbers, and exact booleans
 * to their corresponding source-signal method types.
 *
 * @template InputSignal - The liveness category used by non-mutating results
 * @template T - The source value type used for method selection
 *
 * @remarks
 * - Mutation methods are nested beneath `.mutate` where the selected type supports them
 * - Number values expose projections but no number-specific mutators
 * - Unsupported values map to an empty object type
 *
 * @example
 * ```typescript
 * type TextSourceMethods = MutatingAndNonMutatingMethods<"live", string>;
 * type BooleanSourceMethods = MutatingAndNonMutatingMethods<"live", boolean>;
 * ```
 *
 * @see {@link NonMutatingMethods} - For projection-only selection
 * @see {@link getMutatingAndNonMutatingDataMethods} - The runtime dispatcher
 */
export type MutatingAndNonMutatingMethods<
  InputSignal extends InputSignalType,
  T,
> = [true] extends [IsArray<T>]
  ? ArrayMutatingAndNonMutatingMethods<InputSignal, Extract<T, any[]>>
  : [true] extends [IsObjectLiteral<T>]
    ? ObjectMutatingAndNonMutatingMethods<
        InputSignal,
        Extract<T, Record<string, any>>
      >
    : [true] extends [IsExactly<T, string>]
      ? StringMutatingAndNonMutatingMethods<InputSignal>
      : [true] extends [IsExactly<T, number>]
        ? NumberNonMutatingMethods<InputSignal>
        : [true] extends [IsExactly<T, boolean>]
          ? BooleanMutatingAndNonMutatingMethods
          : {};
