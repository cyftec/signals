import { BaseDerivedSignal, SignalType } from "./_types";
import {
  DataMethodValue,
  GenericMethods,
  getGenericMethods,
  getNonMutatingDataMethods,
  IsExactlyAny,
  NonMutatingMethods,
} from "./data-specific-methods";
import { effect } from "./effect";
import { signal } from "./source-signal";

type DerivedSignalMethods<T> =
  GenericMethods<T> &
  (IsExactlyAny<T> extends true
    ? {}
    : T extends unknown
      ? NonMutatingMethods<DataMethodValue<T>>
      : never);

/**
 * Represents a read-only, eagerly maintained signal with helper methods.
 *
 * A derived signal computes its initial value immediately, recomputes when its
 * captured dependencies change, and exposes generic and selected non-mutating
 * data-specific helpers.
 *
 * @template T - The value type returned by the catcher.
 *
 * @remarks
 * - Derived signals expose the preceding stored computed value through prevValue.
 * - The catcher runs at construction and on captured source-signal updates, not on reads.
 * - The current and previous computed values are stored internally.
 * - dispose() stops future recomputation.
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
 * Creates a read-only eagerly maintained signal from a value-catching function.
 *
 * The returned signal invokes the catcher immediately, stores its result, and
 * attaches generic and selected non-mutating data-specific helpers.
 *
 * @template T - The value type returned by the catcher.
 * @param signalCatcherFn - The function invoked initially and on captured dependency updates.
 * @param nonNullInitialValue - Optional non-null hint used only to select data-specific helpers.
 * @returns A read-only derived signal containing the most recently computed value.
 *
 * @remarks
 * - The catcher receives the most recently stored derived value. It is undefined
 *   only during the initial computation.
 * - Source-signal reads during the initial catch are fixed dependencies for future recomputation.
 * - Reading value and nonReactiveValue does not invoke the catcher.
 * - dispose() stops the internal effect and freezes the stored value.
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
  signalCatcherFn: (previousValue: T | undefined) => T,
  nonNullInitialValue?: NonNullable<T>,
): DerivedSignal<T> => {
  const _baseSourceSignal = signal<T>(undefined as T);
  const _receiver = effect(() => {
    _baseSourceSignal.value = signalCatcherFn(
      _baseSourceSignal.nonReactiveValue,
    );
  });

  let derivedSignal: BaseDerivedSignal<T> = {
    get type(): SignalType {
      return "derived-signal";
    },

    get prevValue(): T | undefined {
      return _baseSourceSignal.prevValue;
    },

    get nonReactiveValue(): T {
      return _baseSourceSignal.nonReactiveValue;
    },

    get value(): T {
      return _baseSourceSignal.value;
    },

    dispose() {
      _receiver.dispose();
    },
  };

  Object.assign(derivedSignal, getGenericMethods<T>(derivedSignal as any));
  Object.assign(
    derivedSignal,
    getNonMutatingDataMethods<T>(derivedSignal as any, nonNullInitialValue),
  );

  return derivedSignal as DerivedSignal<T>;
};
