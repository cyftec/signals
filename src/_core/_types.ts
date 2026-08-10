import { SourceSignal, DerivedSignal } from "..";

/**
 * Defines the internal registry used to connect source-signal reads to effects.
 *
 * Source-signal getters register the effect currently being installed, and
 * source-signal writes synchronously invoke each registered receiver.
 *
 * @remarks
 * - This is exported for the core implementation; applications normally use effect() instead.
 * - Dependency registration occurs only while an effect is first installed.
 *
 * @example
 * ```typescript
 * declare const connector: SignalConnector;
 * connector.processSignal(signal(1));
 * ```
 *
 * @see {@link Receiver} - The callback registered for source-signal changes.
 * @see {@link effect} - The public API that installs a receiver.
 */
export type SignalConnector = {
  readonly installReceiver: (effect: {
    readonly id: number;
    readonly run: () => void;
  }) => void;
  readonly ignoreReceiver: <T>(callbackWithSignals: () => T) => T;
  readonly connectWithNewReceiver: (signal: BaseSourceSignal<unknown>) => void;
  readonly processSignal: (signal: BaseSourceSignal<unknown>) => void;
};

/**
 * Represents a synchronous effect receiver.
 *
 * A receiver has a stable identifier and invokes its effect callback through
 * run() when a connected source signal is written.
 *
 * @remarks
 * - Receivers do not expose disposal or lifecycle controls.
 * - The connector uses id to deduplicate repeated reads of one source signal.
 *
 * @example
 * ```typescript
 * declare const receiver: Receiver;
 * receiver.run();
 * ```
 *
 * @see {@link SignalConnector} - Stores and invokes receivers.
 * @see {@link effect} - Creates receivers from callbacks.
 */
export type Receiver = {
  readonly id: number;
  readonly run: () => void;
};

/**
 * Identifies a source or derived signal at runtime.
 *
 * The discriminator is used by the value utilities to recognize the two signal
 * implementations without reading their values.
 *
 * @remarks
 * - source-signal identifies a writable source signal.
 * - derived-signal identifies a read-only derived signal.
 *
 * @example
 * ```typescript
 * const kind: SignalType = signal(1).type;
 * ```
 *
 * @see {@link BaseSourceSignal} - The writable signal shape.
 * @see {@link BaseDerivedSignal} - The derived signal shape.
 */
export type SignalType = "source-signal" | "derived-signal";

/**
 * Defines the common runtime shape of a writable source signal.
 *
 * Source signals own a value, expose the preceding assigned value, and publish
 * synchronous notifications whenever an assignment changes the stored value.
 *
 * @template T - The value type stored by the signal.
 *
 * @remarks
 * - Reading value returns an immutable-library copy for objects and arrays.
 * - Reading nonReactiveValue does not collect an installing effect and returns the stored value directly.
 * - mutateWith() computes an assignment from the current stored value.
 * - The declaration permits a narrower source-signal view where a wider view is expected.
 *
 * @example
 * ```typescript
 * const count: BaseSourceSignal<number> = signal(1);
 * count.value = 2;
 * ```
 *
 * @see {@link SourceSignal} - Adds generic and data-specific methods.
 * @see {@link BaseDerivedSignal} - The read-only signal shape.
 */
export type BaseSourceSignal<T> = {
  readonly type: SignalType;
  readonly id: number;
  readonly prevValue: T | undefined;
  get nonReactiveValue(): T;
  get value(): T;
  set value(newValue: T);
  mutateWith(mutatedSignalEvaluator: (old: T) => T): void;
};

/**
 * Defines the common runtime shape of a read-only derived signal.
 *
 * A derived signal evaluates its catcher whenever its value is read and exposes
 * the same runtime discriminator as other derived projections.
 *
 * @template T - The value type produced by the signal.
 *
 * @remarks
 * - Derived signals have no identifier, previous value, or setter.
 * - Reads can connect source signals accessed by the catcher to an installing effect.
 * - nonReactiveValue evaluates the catcher without connecting those source reads.
 *
 * @example
 * ```typescript
 * const doubled: BaseDerivedSignal<number> = derive(() => 2);
 * console.log(doubled.value); // 2
 * ```
 *
 * @see {@link DerivedSignal} - Adds generic and data-specific methods.
 * @see {@link BaseSourceSignal} - The writable signal shape.
 */
export type BaseDerivedSignal<T> = {
  readonly type: SignalType;
  get nonReactiveValue(): T;
  get value(): T;
};

/**
 * Represents either writable or derived signal form.
 *
 * This union is the common input accepted by helpers that only need to read a
 * signal value.
 *
 * @template T - The value type exposed by the signal.
 *
 * @remarks
 * - Source signals are writable; derived signals are read-only.
 * - Both forms carry a type discriminator and a value getter.
 * - A signal with a narrower value type is assignable to the corresponding wider signal type.
 *
 * @example
 * ```typescript
 * const input: Signal<number> = signal(1);
 * ```
 *
 * @see {@link SourceSignal} - The writable member of this union.
 * @see {@link DerivedSignal} - The read-only member of this union.
 */
export type Signal<T> = SourceSignal<T> | DerivedSignal<T>;

/**
 * Represents either a plain value or a source/derived signal carrying it.
 *
 * APIs use this union when they accept ordinary inputs while allowing callers
 * to supply a signal whose current value should be read.
 *
 * @template T - The plain value type accepted by the API.
 *
 * @remarks
 * - Only an outer signal is recognized and unwrapped.
 * - Plain values are returned unchanged by value().
 *
 * @example
 * ```typescript
 * const input: MaybeSignal<number> = signal(1);
 * ```
 *
 * @see {@link Signal} - The signal branch of this union.
 * @see {@link value} - Unwraps a maybe-signal at runtime.
 */
export type MaybeSignal<T> = T | Signal<T>;

/**
 * Removes nullish values while preserving the surrounding signal kind.
 *
 * Plain values use ordinary nullish exclusion; source and derived signal inputs
 * are rebuilt with null and undefined removed from their value types.
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
