import { getBaseSignal } from "./base-signal";
import type { DeadSignal } from "./dead-signal";
import type { DerivedSignal } from "./derived-signal";
import type { SourceSignal } from "./source-signal";

/**
 * Normalizes an object-like intersection for readable property display.
 *
 * This mapped type preserves every property while encouraging TypeScript to
 * present the expanded shape instead of the original intersection.
 *
 * @template T - The type whose properties should be normalized.
 *
 * @remarks
 * - The transformation is type-only and has no runtime behavior.
 * - Property modifiers and value types are preserved.
 *
 * @example
 * ```typescript
 * type Expanded = Prettify<{ a: number } & { b: string }>;
 * ```
 *
 * @see {@link BaseSourceSignal} - Uses this helper for its public shape.
 * @see {@link BaseDerivedSignal} - Uses this helper for its public shape.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Captures the low-level shape returned by `getBaseSignal`.
 *
 * This type includes reactive and non-reactive reads, previous-value access,
 * mutation, effect registration cleanup, and subscriber disposal.
 *
 * @template T - The stored value type.
 *
 * @remarks
 * - `value` is reactive, while `nonReactiveValue` and `prevValue` are not.
 * - This is a structural implementation type shared by all signal kinds.
 *
 * @example
 * ```typescript
 * declare const base: BaseSignal<number>;
 * const current: number = base.nonReactiveValue;
 * ```
 *
 * @see {@link getBaseSignal} - Produces this shape.
 * @see {@link BaseLiveSignal} - Combines the live base variants.
 */
export type BaseSignal<T> = ReturnType<typeof getBaseSignal<T>>;

/**
 * Adds the source-signal discriminator to the mutable base shape.
 *
 * This is the low-level portion of `SourceSignal` before generic and
 * value-specific helpers are intersected into it.
 *
 * @template T - The mutable value type.
 *
 * @remarks
 * - The discriminator is `type: "source-signal"`.
 * - The inherited `value` property remains writable.
 *
 * @example
 * ```typescript
 * declare const source: BaseSourceSignal<number>;
 * source.value = 2;
 * ```
 *
 * @see {@link SourceSignal} - Adds the supported helper surface.
 * @see {@link BaseSignal} - Supplies the shared low-level members.
 */
export type BaseSourceSignal<T> = Prettify<
  BaseSignal<T> & { type: "source-signal" }
>;

/**
 * Defines the read-only base shape for a computed live signal.
 *
 * The mutable `value` member is replaced with a readonly value and the source
 * discriminator is replaced with `type: "derived-signal"`.
 *
 * @template T - The computed value type.
 *
 * @remarks
 * - Other low-level base members remain structurally present.
 * - `DerivedSignal` adds generic and value-specific read helpers.
 *
 * @example
 * ```typescript
 * declare const computed: BaseDerivedSignal<number>;
 * const current: number = computed.value;
 * ```
 *
 * @see {@link DerivedSignal} - Adds the supported helper surface.
 * @see {@link BaseSignal} - Supplies the shared low-level members.
 */
export type BaseDerivedSignal<T> = Prettify<
  Omit<BaseSignal<T>, "type" | "value" | "mutate"> & {
    readonly type: "derived-signal";
    readonly value: T;
  }
>;

/**
 * Defines the read-only base shape for a non-live signal snapshot.
 *
 * This shape reuses the derived base members but changes the discriminator to
 * `type: "dead-signal"`.
 *
 * @template T - The snapshot value type.
 *
 * @remarks
 * - The type does not imply reactive recomputation.
 * - `DeadSignal` adds generic and value-specific snapshot helpers.
 *
 * @example
 * ```typescript
 * declare const snapshot: BaseDeadSignal<string>;
 * const kind = snapshot.type; // "dead-signal"
 * ```
 *
 * @see {@link DeadSignal} - Adds the supported helper surface.
 * @see {@link BaseDerivedSignal} - Supplies the read-only base members.
 */
export type BaseDeadSignal<T> = Prettify<
  Omit<BaseDerivedSignal<T>, "type"> & {
    readonly type: "dead-signal";
  }
>;

/**
 * Unites the low-level mutable and computed live-signal shapes.
 *
 * This union is useful where helper methods are irrelevant but the shared live
 * signal storage interface and discriminator remain important.
 *
 * @template T - The live signal value type.
 *
 * @remarks
 * - Source members expose a writable value.
 * - Derived members expose a readonly value.
 *
 * @example
 * ```typescript
 * declare const base: BaseLiveSignal<number>;
 * console.log(base.type);
 * ```
 *
 * @see {@link BaseSourceSignal} - The mutable branch.
 * @see {@link BaseDerivedSignal} - The computed branch.
 */
export type BaseLiveSignal<T> = BaseSourceSignal<T> | BaseDerivedSignal<T>;

/**
 * Represents either supported kind of reactive signal.
 *
 * Unlike `BaseLiveSignal`, this union includes the generic and value-specific
 * helpers attached to source and derived signals.
 *
 * @template T - The live signal value type.
 *
 * @remarks
 * - Both branches participate in dependency collection when `value` is read.
 * - Only the source branch supports value-specific mutation helpers.
 *
 * @example
 * ```typescript
 * const read = (input: LiveSignal<number>) => input.value;
 * ```
 *
 * @see {@link SourceSignal} - The mutable branch.
 * @see {@link DerivedSignal} - The computed branch.
 */
export type LiveSignal<T> = SourceSignal<T> | DerivedSignal<T>;

/**
 * Accepts either a plain value or a mutable source signal of that value.
 *
 * This union describes APIs that specifically permit source signals but not
 * derived or dead signals.
 *
 * @template T - The plain or source-signal value type.
 *
 * @remarks
 * - Plain values carry no reactivity.
 * - Source-signal values can be unwrapped with `value()`.
 *
 * @example
 * ```typescript
 * const input: MaybeSourceSignal<number> = signal(1);
 * ```
 *
 * @see {@link SourceSignal} - The signal branch.
 * @see {@link MaybeSignal} - Accepts every signal kind.
 */
export type MaybeSourceSignal<T> = T | SourceSignal<T>;

/**
 * Accepts either a plain value or a computed derived signal of that value.
 *
 * This union excludes mutable source signals and dead snapshots.
 *
 * @template T - The plain or derived-signal value type.
 *
 * @remarks
 * - Plain values carry no reactivity.
 * - The derived branch is read-only and live.
 *
 * @example
 * ```typescript
 * const input: MaybeDerivedSignal<number> = derive(() => 1);
 * ```
 *
 * @see {@link DerivedSignal} - The signal branch.
 * @see {@link MaybeSignal} - Accepts every signal kind.
 */
export type MaybeDerivedSignal<T> = T | DerivedSignal<T>;

/**
 * Accepts either a plain value or a dead signal containing that value.
 *
 * Both branches are non-live, though the dead-signal branch exposes signal-like
 * discrimination and helper methods.
 *
 * @template T - The plain or dead-signal value type.
 *
 * @remarks
 * - Neither branch updates in response to another signal.
 * - `value()` unwraps the dead-signal branch.
 *
 * @example
 * ```typescript
 * const input: MaybeDeadSignal<number> = deadSignal(1);
 * ```
 *
 * @see {@link DeadSignal} - The snapshot branch.
 * @see {@link MaybeSignal} - Accepts every signal kind.
 */
export type MaybeDeadSignal<T> = T | DeadSignal<T>;

/**
 * Accepts either a plain value or a live-signal of that value.
 *
 * This union excludes dead snapshots.
 *
 * @template T - The plain or live-signal value type.
 *
 * @remarks
 * - Plain values are non-live.
 * - Source and derived signals are live.
 *
 * @example
 * ```typescript
 * const input1: MaybeLiveSignal<number> = 1;
 * const input2: MaybeLiveSignal<number> = signal(1);
 * const input3: MaybeLiveSignal<number> = derive(() => input2.value);
 * ```
 *
 * @see {@link LiveSignal} - The reactive branches.
 */
export type MaybeLiveSignal<T> = T | LiveSignal<T>;

/**
 * Represents any source, derived, or dead signal.
 *
 * This union is the common discriminated signal-object surface and excludes
 * unwrapped plain values.
 *
 * @template T - The contained value type.
 *
 * @remarks
 * - Live branches are reactive; the dead branch is a snapshot.
 * - Runtime discrimination uses the `type` property.
 *
 * @example
 * ```typescript
 * const inputs: Signal<number>[] = [signal(1), deadSignal(2)];
 * ```
 *
 * @see {@link LiveSignal} - The reactive branches.
 * @see {@link DeadSignal} - The snapshot branch.
 */
export type Signal<T> = LiveSignal<T> | DeadSignal<T>;

/**
 * Represents a read-only result that may be live or a dead snapshot.
 *
 * Data and generic helpers use this union when the input is itself a union of
 * live and dead signals, so the runtime result kind cannot be narrowed further.
 *
 * @template T - The result value type.
 *
 * @remarks
 * - The derived branch updates from live dependencies.
 * - The dead branch remains fixed at creation.
 *
 * @example
 * ```typescript
 * declare const result: DerivedOrDeadSignal<string>;
 * console.log(result.value);
 * ```
 *
 * @see {@link DerivedSignal} - The live branch.
 * @see {@link DeadSignal} - The snapshot branch.
 */
export type DerivedOrDeadSignal<T> = DerivedSignal<T> | DeadSignal<T>;

/**
 * Accepts a plain value or any signal kind containing that value.
 *
 * This is the library's general input type for APIs that unwrap values while
 * retaining reactivity when the supplied object is live.
 *
 * @template T - The possible plain or contained value type.
 *
 * @remarks
 * - Source and derived signals are live.
 * - Dead signals and plain values are non-live.
 *
 * @example
 * ```typescript
 * const input: MaybeSignal<number> = signal(1);
 * console.log(value(input)); // 1
 * ```
 *
 * @see {@link Signal} - The object branches.
 * @see {@link value} - Unwraps this input form.
 */
export type MaybeSignal<T> = T | LiveSignal<T> | DeadSignal<T>;

/**
 * Removes nullish values while preserving the surrounding signal kind.
 *
 * Plain values use ordinary nullish exclusion; source, derived, and dead signal
 * inputs are rebuilt with null and undefined removed from their value types.
 *
 * @template S - The plain or signal type to make non-nullish.
 *
 * @remarks
 * - A wholly nullish plain type becomes `never`.
 * - Runtime values are not validated or transformed by this type.
 *
 * @example
 * ```typescript
 * type Present = NonNullSignalValue<SourceSignal<string | null>>;
 * // SourceSignal<string>
 * ```
 *
 * @see {@link Signal} - Signal kinds preserved by this transformation.
 * @see {@link nullable} - Adds generic helpers to nullable primitive inputs.
 */
export type NonNullSignalValue<S> =
  S extends SourceSignal<infer SS>
    ? SourceSignal<NonNullable<SS>>
    : S extends DerivedSignal<infer DS>
      ? DerivedSignal<NonNullable<DS>>
      : S extends DeadSignal<infer NS>
        ? DeadSignal<NonNullable<NS>>
        : S extends null | undefined
          ? never
          : NonNullable<S>;

/**
 * Converts function parameters into a tuple accepting signal-wrapped values.
 *
 * Callable tuple elements remain callable so callback parameters are not
 * mistaken for value-producing signals; other elements become `MaybeSignal`.
 *
 * @template T - The parameter tuple to transform.
 *
 * @remarks
 * - Tuple positions and optionality are preserved.
 * - This transformation has no runtime behavior.
 *
 * @example
 * ```typescript
 * type Inputs = MaybeSignalValues<[number, string]>;
 * // [MaybeSignal<number>, MaybeSignal<string>]
 * ```
 *
 * @see {@link MaybeSignal} - Wraps non-callable tuple entries.
 * @see {@link PlainValues} - Extracts plain values from such a tuple.
 */
export type MaybeSignalValues<T extends any[]> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? T[K]
    : MaybeSignal<T[K]>;
};

/**
 * Extracts the contained type from a signal or preserves a plain type.
 *
 * This is the type-level counterpart of the runtime `value()` helper for a
 * single `MaybeSignal` input.
 *
 * @template I - The plain or signal input type.
 *
 * @remarks
 * - Every signal kind is unwrapped through `Signal<infer T>`.
 * - Plain inputs remain unchanged.
 *
 * @example
 * ```typescript
 * type Count = PlainValue<SourceSignal<number>>; // number
 * ```
 *
 * @see {@link MaybeSignal} - Constrains accepted inputs.
 * @see {@link value} - Performs runtime unwrapping.
 */
export type PlainValue<I extends MaybeSignal<unknown>> =
  I extends Signal<infer T> ? T : I;

/**
 * Extracts contained value types from a tuple of signal-capable inputs.
 *
 * Each tuple element is matched against `MaybeSignal` and replaced by the
 * inferred underlying value type.
 *
 * @template T - The tuple of signal-capable values to unwrap.
 *
 * @remarks
 * - Tuple positions are preserved.
 * - This transformation is used by `compute` and method-parameter helpers.
 *
 * @example
 * ```typescript
 * type Values = PlainValues<[SourceSignal<number>, string]>;
 * // [number, string]
 * ```
 *
 * @see {@link MaybeSignalValues} - Produces compatible input tuples.
 * @see {@link getPlainMethodParams} - Performs runtime tuple unwrapping.
 */
export type PlainValues<T extends MaybeSignalValues<any[]>> = {
  [K in keyof T]: T[K] extends MaybeSignal<infer V> ? V : never;
};
