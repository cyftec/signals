import { BaseDerivedSignal, SignalType } from "./_types";
import {
  DataMethodValue,
  GenericMethods,
  getGenericMethods,
  getNonMutatingDataMethods,
  IsExactlyAny,
  NonMutatingMethods,
} from "./data-specific-methods";

type DerivedSignalMethods<T> =
  IsExactlyAny<T> extends true
    ? {}
    : T extends unknown
      ? GenericMethods<DataMethodValue<T>> &
          NonMutatingMethods<DataMethodValue<T>>
      : never;

/**
 * Represents a read-only, lazily evaluated signal with helper methods.
 *
 * A derived signal runs its catcher only when its value getter is read and
 * exposes generic and selected non-mutating data-specific helpers.
 *
 * @template T - The value type returned by the catcher.
 *
 * @remarks
 * - Derived signals do not store a previous value or expose a setter.
 * - The catcher is invoked for each value read; its result is not cached.
 * - Reads performed by the catcher can connect source signals to an installing effect.
 *
 * @example
 * ```typescript
 * const count = signal(1);
 * const doubled: DerivedSignal<number> = derive(() => count.value * 2);
 * console.log(doubled.value); // 2
 * ```
 *
 * @see {@link derive} - Creates a derived signal.
 * @see {@link SourceSignal} - The writable signal form.
 */
export type DerivedSignal<T> = BaseDerivedSignal<T> & DerivedSignalMethods<T>;

/**
 * Creates a read-only lazy signal from a value-catching function.
 *
 * The returned signal invokes the catcher when its value getter is read and
 * attaches generic and selected non-mutating data-specific helpers.
 *
 * @template T - The value type returned by the catcher.
 * @param signalCatcherFn - The function invoked by the derived value getter.
 * @param nonNullInitialValue - Optional non-null hint used only to select data-specific helpers.
 * @returns A read-only derived signal whose value is produced by the catcher.
 *
 * @remarks
 * - The signal has no cached value or independent update lifecycle.
 * - Reading value evaluates the catcher synchronously and propagates its errors.
 * - Source-signal reads inside the catcher are visible while an effect is installed.
 *
 * @example
 * ```typescript
 * const count = signal(2);
 * const doubled = derive(() => count.value * 2);
 * console.log(doubled.value); // 4
 * ```
 *
 * @see {@link DerivedSignal} - The returned read-only contract.
 * @see {@link compute} - Creates a derived signal from signal-capable arguments.
 */
export const derive = <T>(
  signalCatcherFn: () => T,
  nonNullInitialValue?: NonNullable<T>,
): DerivedSignal<T> => {
  let derivedSignal: BaseDerivedSignal<T> = {
    get type(): SignalType {
      return "derived-signal";
    },

    get value(): T {
      return signalCatcherFn();
    },
  };

  Object.assign(derivedSignal, getGenericMethods<T>(derivedSignal as any));
  Object.assign(
    derivedSignal,
    getNonMutatingDataMethods<T>(derivedSignal as any, nonNullInitialValue),
  );

  return derivedSignal as DerivedSignal<T>;
};
