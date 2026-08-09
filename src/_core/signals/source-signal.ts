import {
  DataMethodValue,
  GenericMethods,
  getGenericMethods,
  MutatingAndNonMutatingMethods,
} from "../data-specific-methods";
import { getMutatingAndNonMutatingDataMethods } from "../data-specific-methods/data-methods";
import { getBaseSignal } from "./base-signal";
import { BaseSourceSignal } from "./types";

/**
 * Represents a mutable live signal with value-specific helpers.
 *
 * Source signals combine the low-level signal interface with generic comparison
 * helpers and methods selected from the value type. Mutating data methods are
 * grouped under `mutate`; non-mutating methods return derived signals.
 *
 * @template T - The value held by the source signal.
 *
 * @remarks
 * - Arrays, strings, plain objects, numbers, and booleans receive different helper sets.
 * - Array, string, object, and boolean mutations return `void` and notify synchronously.
 * - Reads through `value` collect the current effect as a dependency.
 * - `dispose()` clears the source's current subscribers without freezing its value.
 *
 * @example
 * ```typescript
 * const items: SourceSignal<number[]> = signal([1, 2]);
 * items.mutate.push(3);
 * const size = items.length(); // DerivedSignal<number>
 * ```
 *
 * @see {@link signal} - Creates a source signal.
 * @see {@link DerivedSignal} - Represents a read-only live signal.
 * @see {@link DeadSignal} - Represents a non-live signal snapshot.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

type SourceSignalMethods<T> = IsAny<T> extends true
  ? {}
  : T extends unknown
    ? GenericMethods<"live", DataMethodValue<T>> &
        MutatingAndNonMutatingMethods<"live", DataMethodValue<T>>
    : never;

export type SourceSignal<T> = BaseSourceSignal<T> &
  SourceSignalMethods<T>;

/**
 * Creates a mutable live signal from a JavaScript value.
 *
 * The signal tracks effects that read its `value`, stores the previous value on
 * change, and runs registered effects synchronously. Its value-specific method
 * surface is selected once at creation time.
 *
 * @template T - The value held by the signal.
 * @param initialValue - The initial signal value.
 * @param nonNullableInitialValue - Optional non-nullish dispatch hint used to attach data methods when `initialValue` is nullish.
 * @returns A mutable `SourceSignal<T>`.
 *
 * @remarks
 * - Strict-equal assignments are skipped and log an unnecessary-change diagnostic.
 * - The initial value and values returned by `value` are copied by `@cyftec/immut`.
 * - The helper set does not change if the value's runtime type changes later.
 * - Object and array mutations are available under `mutate`, not as direct methods.
 *
 * @example
 * ```typescript
 * const user = signal({ name: "Ada", active: false });
 * user.mutate.set({ active: true });
 * const name = user.get("name");
 *
 * const delayed = signal<string | undefined>(undefined, "");
 * delayed.value = " ready ";
 * ```
 *
 * @see {@link SourceSignal} - Describes the returned signal.
 * @see {@link effect} - Observes signal reads.
 * @see {@link derive} - Computes a read-only live signal.
 */
export const signal = <T>(
  initialValue: T,
  nonNullableInitialValue?: NonNullable<T extends Record<string, any> ? {} : T>,
): SourceSignal<T> => {
  const sourceSignal = getBaseSignal(initialValue) as BaseSourceSignal<T>;
  Object.assign(sourceSignal, { type: "source-signal" });
  Object.assign(sourceSignal, getGenericMethods<"live", T>(sourceSignal as any));
  Object.assign(
    sourceSignal,
    getMutatingAndNonMutatingDataMethods<"live", T>(
      sourceSignal as any,
      nonNullableInitialValue,
    ),
  );

  return sourceSignal as SourceSignal<T>;
};
