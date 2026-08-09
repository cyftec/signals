import { isPlainObject } from "@cyftec/immut";
import { BaseSignal } from "../signals";
import {
  getArrayMutatingAndNonMutatingMethods,
  getArrayNonMutatingMethods,
} from "./array";
import { getBooleanSignalMethods } from "./boolean";
import { getNumberSignalMethods } from "./number";
import {
  getObjectMutatingAndNonMutatingMethods,
  getObjectNonMutatingMethods,
} from "./object";
import {
  getStringSignalMethods,
  getStringSignalNonMutatingMethods,
} from "./string";
import {
  InputSignalType,
  MutatingAndNonMutatingMethods,
  NonMutatingMethods,
} from "./types";

/**
 * Selects non-mutating methods for a signal's data type.
 *
 * Inspects the signal's initial non-null value, or an explicit non-null hint,
 * and returns the array, object, string, or number projection methods that
 * match that runtime value.
 *
 * @template InputSignal - Whether method results are live derived signals or dead snapshots
 * @template T - The signal value type
 * @param baseSignal - The base signal whose value the selected methods read
 * @param nonNullableInitialValue - Optional non-null value used only to select a method family
 * @returns The non-mutating methods supported by the selected data type
 *
 * @remarks
 * - Array detection precedes plain-object detection
 * - Live inputs produce `DerivedSignal` projections; dead inputs produce snapshot `DeadSignal` projections
 * - The optional hint permits method selection when the current initial value is nullable
 * - Unsupported primitive types receive no data-specific methods
 *
 * @example
 * ```typescript
 * const text = signal("  hello  ");
 * const methods = getNonMutatingDataMethods<"live", string>(text);
 * console.log(methods.trim().value); // "hello"
 * ```
 *
 * @see {@link NonMutatingMethods} - The conditional return type
 * @see {@link getMutatingAndNonMutatingDataMethods} - For source-signal mutators and projections
 */
export const getNonMutatingDataMethods = <
  InputSignal extends InputSignalType,
  T,
>(
  baseSignal: BaseSignal<T>,
  nonNullableInitialValue?: NonNullable<T extends Record<string, any> ? {} : T>,
): NonMutatingMethods<InputSignal, T> => {
  const nonNullInitialValue =
    nonNullableInitialValue === undefined
      ? baseSignal.nonReactiveValue
      : nonNullableInitialValue;

  // ARRAY CHECK MUST BE BEFORE OBJECT CHECK
  if (Array.isArray(nonNullInitialValue)) {
    return getArrayNonMutatingMethods<InputSignal, Extract<T, any[]>>(
      baseSignal as any,
    ) as NonMutatingMethods<InputSignal, T>;
  }

  if (isPlainObject(nonNullInitialValue)) {
    return getObjectNonMutatingMethods<
      InputSignal,
      Extract<T, Record<string, any>>
    >(
      baseSignal as any,
    ) as NonMutatingMethods<InputSignal, T>;
  }

  if (typeof nonNullInitialValue === "string") {
    return getStringSignalNonMutatingMethods<InputSignal>(
      baseSignal as any,
    ) as unknown as NonMutatingMethods<InputSignal, T>;
  }

  if (typeof nonNullInitialValue === "number") {
    return getNumberSignalMethods<InputSignal>(
      baseSignal as any,
    ) as NonMutatingMethods<InputSignal, T>;
  }

  return {} as NonMutatingMethods<InputSignal, T>;
};

/**
 * Selects mutating and non-mutating methods for a source signal's data type.
 *
 * Inspects the source signal's initial non-null value, or an explicit non-null
 * hint, and builds the method surface appropriate for arrays, plain objects,
 * strings, numbers, or booleans.
 *
 * @template InputSignal - The liveness category used by non-mutating results
 * @template T - The source signal value type
 * @param baseSignal - The mutable base signal that selected methods read or update
 * @param nonNullableInitialValue - Optional non-null value used only to select a method family
 * @returns The mutating and non-mutating methods supported by the selected data type
 *
 * @remarks
 * - Mutators are grouped under the returned `.mutate` object
 * - Non-mutating methods are direct members and follow the requested liveness category
 * - The optional hint permits method selection for a nullable initial value
 * - Unsupported primitive types receive no data-specific methods
 *
 * @example
 * ```typescript
 * const items = signal([1, 2]);
 * const methods = getMutatingAndNonMutatingDataMethods<"live", number[]>(items);
 * methods.mutate.push(3);
 * console.log(methods.length().value); // 3
 * ```
 *
 * @see {@link MutatingAndNonMutatingMethods} - The conditional return type
 * @see {@link getNonMutatingDataMethods} - For projection-only method selection
 */
export const getMutatingAndNonMutatingDataMethods = <
  InputSignal extends InputSignalType,
  T,
>(
  baseSignal: BaseSignal<T>,
  nonNullableInitialValue?: NonNullable<T extends Record<string, any> ? {} : T>,
): MutatingAndNonMutatingMethods<InputSignal, T> => {
  const nonNullInitialValue =
    nonNullableInitialValue === undefined
      ? baseSignal.nonReactiveValue
      : nonNullableInitialValue;

  // ARRAY CHECK MUST BE BEFORE OBJECT CHECK
  if (Array.isArray(nonNullInitialValue)) {
    return getArrayMutatingAndNonMutatingMethods<
      InputSignal,
      Extract<T, any[]>
    >(
      baseSignal as any,
    ) as MutatingAndNonMutatingMethods<InputSignal, T>;
  }

  if (isPlainObject(nonNullInitialValue)) {
    return getObjectMutatingAndNonMutatingMethods<
      InputSignal,
      Extract<T, Record<string, any>>
    >(
      baseSignal as any,
    ) as MutatingAndNonMutatingMethods<InputSignal, T>;
  }

  if (typeof nonNullInitialValue === "string") {
    return getStringSignalMethods<InputSignal>(
      baseSignal as any,
    ) as MutatingAndNonMutatingMethods<InputSignal, T>;
  }

  if (typeof nonNullInitialValue === "number") {
    return getNumberSignalMethods<InputSignal>(
      baseSignal as any,
    ) as MutatingAndNonMutatingMethods<InputSignal, T>;
  }

  if (typeof nonNullInitialValue === "boolean") {
    return getBooleanSignalMethods(
      baseSignal as any,
    ) as MutatingAndNonMutatingMethods<InputSignal, T>;
  }

  return {} as MutatingAndNonMutatingMethods<InputSignal, T>;
};
