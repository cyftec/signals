import { SourceSignal, DerivedSignal } from "..";

export type SignalConnector = {
  readonly installReceiver: (effect: {
    readonly id: number;
    readonly run: () => void;
  }) => void;
  readonly connectWithNewReceiver: (signal: BaseSourceSignal<unknown>) => void;
  readonly processSignal: (signal: BaseSourceSignal<unknown>) => void;
};

export type Receiver = {
  readonly id: number;
  readonly run: () => void;
};

export type SignalType = "source-signal" | "derived-signal";

export type BaseSourceSignal<T> = {
  readonly type: SignalType;
  readonly id: number;
  readonly prevValue: T | undefined;
  value: T;
  readonly mutateWith: (mutatedSignalEvaluator: (old: T) => T) => void;
};

export type BaseDerivedSignal<T> = {
  readonly type: SignalType;
  readonly value: T;
};

export type Signal<T> = SourceSignal<T> | DerivedSignal<T>;

export type MaybeSignal<T> = T | Signal<T>;

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
 * type Present = NonNullSignalValue<BaseSourceSignal<string | null>>;
 * // BaseSourceSignal<string>
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
 * type Count = PlainValue<BaseSourceSignal<number>>; // number
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
 * type Values = PlainValues<[BaseSourceSignal<number>, string]>;
 * // [number, string]
 * ```
 *
 * @see {@link MaybeSignalValues} - Produces compatible input tuples.
 * @see {@link getPlainMethodParams} - Performs runtime tuple unwrapping.
 */
export type PlainValues<T extends MaybeSignalValues<any[]>> = {
  [K in keyof T]: T[K] extends MaybeSignal<infer V> ? V : never;
};
