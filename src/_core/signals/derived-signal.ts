import {
  DataMethodValue,
  GenericMethods,
  getGenericMethods,
  NonMutatingMethods,
} from "../data-specific-methods";
import { getNonMutatingDataMethods } from "../data-specific-methods/data-methods";
import { effect } from "../effect";
import { getBaseSignal } from "./base-signal";
import { BaseDerivedSignal } from "./types";

/**
 * Represents a read-only live signal computed from initial dependencies.
 *
 * Derived signals combine a read-only value with generic helpers and
 * type-specific non-mutating methods. Helper results remain live and are
 * represented by further derived signals.
 *
 * @template T - The computed value type.
 *
 * @remarks
 * - Dependencies are the signals read during the evaluator's initial execution.
 * - Later executions neither add nor remove dependencies.
 * - `prevValue` contains the previous computed output after an actual output change.
 * - Disposal immediately disconnects the internal effect and leaves the last value readable.
 *
 * @example
 * ```typescript
 * const count = signal(2);
 * const doubled: DerivedSignal<number> = derive(() => count.value * 2);
 * count.value = 3;
 * console.log(doubled.value); // 6
 * ```
 *
 * @see {@link derive} - Creates a derived signal.
 * @see {@link SourceSignal} - Represents a mutable live signal.
 * @see {@link DeadSignal} - Represents a non-live snapshot.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

type DerivedSignalMethods<T> = IsAny<T> extends true
  ? {}
  : T extends unknown
    ? GenericMethods<"live", DataMethodValue<T>> &
        NonMutatingMethods<"live", DataMethodValue<T>>
    : never;

export type DerivedSignal<T> = BaseDerivedSignal<T> &
  DerivedSignalMethods<T>;

/**
 * Describes the evaluator accepted by `derive`.
 *
 * The evaluator receives the prior computed output and returns the next output.
 * Signal values read on its first call become the derived signal's dependencies.
 *
 * @template T - The value returned by the evaluator.
 * @param oldValue - The previous computed output, or `undefined` on the first call.
 * @returns The next computed output.
 *
 * @remarks
 * - `oldValue` is not a previous dependency value.
 * - Dependencies missed on the first call are not collected on later calls.
 * - Throwing propagates to the caller that caused the evaluation.
 *
 * @example
 * ```typescript
 * const count = signal(1);
 * const history = derive<number[]>((oldValue) => [
 *   ...(oldValue ?? []),
 *   count.value,
 * ]);
 * ```
 *
 * @see {@link derive} - Uses this evaluator type.
 * @see {@link DerivedSignal} - Represents the resulting signal.
 */
export type DerivedValueGetterWithSignals<T> = (oldValue: T | undefined) => T;

/**
 * Creates a read-only live signal from a synchronous evaluator.
 *
 * The evaluator runs immediately. Signals read during that call become fixed
 * dependencies whose later changes synchronously recompute the derived value.
 * Downstream effects run only when the computed output changes by strict equality.
 *
 * @template T - The computed value type.
 * @param signalsCatcher - The evaluator that receives the previous computed output.
 * @param nonNullableInitialValue - Optional non-nullish dispatch hint used to attach data methods when the first output is nullish.
 * @returns A disposable `DerivedSignal<T>`.
 *
 * @remarks
 * - Assigning to `value` is ignored at runtime.
 * - The first evaluator call receives `undefined`.
 * - Dependency collection is initial-only and uses a single global effect slot.
 * - Calling `dispose()` twice throws through the internal effect.
 *
 * @example
 * ```typescript
 * const source = signal(2);
 * const squared = derive(() => source.value ** 2);
 * source.value = 4;
 * console.log(squared.value); // 16
 * squared.dispose();
 * ```
 *
 * @see {@link DerivedSignal} - Describes the returned value.
 * @see {@link DerivedValueGetterWithSignals} - Describes the evaluator.
 * @see {@link effect} - Provides the internal dependency subscription.
 */
export const derive = <T>(
  signalsCatcher: DerivedValueGetterWithSignals<T>,
  nonNullableInitialValue?: NonNullable<T extends Record<string, any> ? {} : T>,
): DerivedSignal<T> => {
  const baseSignal = getBaseSignal<T>(undefined as T);
  const valueDescriptor = Object.getOwnPropertyDescriptor(baseSignal, "value")!;

  const updateBaseValue = (newValue: T): void => {
    valueDescriptor.set!.call(baseSignal, newValue);
  };

  const deriverEffect = effect(() => {
    updateBaseValue(signalsCatcher(baseSignal.nonReactiveValue));
  });
  deriverEffect.registerDependentSignal(baseSignal);

  Object.defineProperty(baseSignal, "value", {
    configurable: valueDescriptor.configurable,
    enumerable: valueDescriptor.enumerable,
    get: valueDescriptor.get!,
    set() {},
  });

  const derivedSignal = Object.assign(baseSignal, {
    type: "derived-signal",
    mutate: undefined,
    dispose() {
      deriverEffect.dispose();
    },
  }) as BaseDerivedSignal<T>;

  Object.assign(
    derivedSignal,
    getGenericMethods<"live", T>(derivedSignal as any),
  );
  Object.assign(
    derivedSignal,
    getNonMutatingDataMethods<"live", T>(
      derivedSignal as any,
      nonNullableInitialValue,
    ),
  );

  return derivedSignal as DerivedSignal<T>;
};
