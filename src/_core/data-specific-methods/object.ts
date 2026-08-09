import { valueIsLiveSignal } from "../../utils";
import {
  type BaseSignal,
  deadSignal,
  derive,
} from "../signals";
import {
  DeriverReturnType,
  InputSignalType,
  ObjectNonMutatingMethods,
  ObjectMutatingAndNonMutatingMethods,
  ObjectMutatingMethods,
} from "./types";

const getObjectMethodDeriver = <InputSignal extends InputSignalType>(
  baseObjectSignal: BaseSignal<any>,
) => {
  const inputIsLiveSignal = valueIsLiveSignal(baseObjectSignal as any);

  return <T>(deriver: () => T): DeriverReturnType<InputSignal, T> =>
    (inputIsLiveSignal
      ? derive(deriver)
      : deadSignal(deriver())) as DeriverReturnType<InputSignal, T>;
};

/**
 * Creates mutating methods for a plain-object source signal.
 *
 * Provides a shallow `set()` update implemented through the base signal's
 * `mutateWith()` hook.
 *
 * @template T - The object type
 * @param baseObjectSignal - The mutable base signal whose object value is updated
 * @returns Mutating methods for the object source signal
 *
 * @example
 * ```typescript
 * const user = signal({ name: "John", age: 30 });
 * const methods = getObjectMutatingMethods(user);
 * methods.set({ age: 31 }); // Shallow merge: { name: "John", age: 31 }
 * ```
 *
 * @remarks
 * - `set()` performs a shallow merge with the current value
 * - Nested objects are replaced rather than deeply merged
 * - Source signals expose this method under `.mutate.set()`
 *
 * @see {@link getObjectMutatingAndNonMutatingMethods} - For combined methods
 * @see {@link ObjectMutatingMethods} - The returned method contract
 */
export const getObjectMutatingMethods = <T extends Record<string, any>>(
  baseObjectSignal: BaseSignal<T>,
): ObjectMutatingMethods<T> => ({
  set: (partiallyNewObjectValue: Partial<T>) =>
    baseObjectSignal.mutateWith((oldValue: T) => ({
      ...oldValue,
      ...partiallyNewObjectValue,
    })),
});

/**
 * Creates non-mutating projections for a plain-object signal.
 *
 * Exposes the object's keys, individual properties, and a snapshot of property
 * signal objects while preserving the liveness category of the input.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 * @template T - The object type
 * @param baseObjectSignal - The base object signal whose properties are projected
 * @returns Non-mutating methods for object keys and properties
 *
 * @example
 * ```typescript
 * const user = signal({ name: "John", age: 30 });
 * const methods = getObjectNonMutatingMethods<"live", typeof user.value>(user);
 * const name = methods.get("name");
 * console.log(name.value); // "John"
 * ```
 *
 * @remarks
 * - `keys()` and `get()` project through the current object value
 * - `props()` creates one property signal for each key present when it is called
 * - Live inputs produce reactive `DerivedSignal` projections
 * - Dead inputs produce snapshot `DeadSignal` projections
 *
 * @see {@link ObjectNonMutatingMethods} - The returned method contract
 * @see {@link getObjectMutatingMethods} - For shallow source-signal updates
 */
export const getObjectNonMutatingMethods = <
  InputSignal extends InputSignalType,
  T extends Record<string, any>,
>(
  baseObjectSignal: BaseSignal<T>,
): ObjectNonMutatingMethods<InputSignal, T> => {
  const deriveFromBase = getObjectMethodDeriver<InputSignal>(baseObjectSignal);

  return {
    keys: () => deriveFromBase(() => Object.keys(baseObjectSignal.value)),
    get: <K extends keyof T>(key: K) =>
      deriveFromBase(() => baseObjectSignal.value[key]),
    props: () => {
      const signalledPropsObj = {} as {
        [key in keyof T]: DeriverReturnType<InputSignal, T[key]>;
      };

      (Object.keys(baseObjectSignal.value) as (keyof T)[]).forEach((key) => {
        signalledPropsObj[key] = deriveFromBase(
          () => baseObjectSignal.value[key],
        );
      });

      return signalledPropsObj;
    },
  };
};

/**
 * Creates combined methods for a plain-object source signal.
 *
 * Places shallow mutation under `.mutate` and exposes keys and property
 * projections as direct methods on the returned object.
 *
 * @template InputSignal - The liveness category used by non-mutating results
 * @template T - The object type
 * @param baseObjectSignal - The mutable base signal whose object value is used
 * @returns Combined mutating and non-mutating object methods
 *
 * @example
 * ```typescript
 * const user = signal({ name: "John", age: 30 });
 * const methods = getObjectMutatingAndNonMutatingMethods<
 *   "live",
 *   typeof user.value
 * >(user);
 * methods.mutate.set({ age: 31 });
 * console.log(methods.get("name").value); // "John"
 * ```
 *
 * @remarks
 * - Mutation is available only through `.mutate.set()`
 * - Non-mutating projections are direct members
 * - Live inputs produce `DerivedSignal` projections; a non-live type produces snapshots
 *
 * @see {@link getObjectMutatingMethods} - For mutating methods only
 * @see {@link getObjectNonMutatingMethods} - For non-mutating methods only
 * @see {@link ObjectMutatingAndNonMutatingMethods} - The returned method contract
 */
export const getObjectMutatingAndNonMutatingMethods = <
  InputSignal extends InputSignalType,
  T extends Record<string, any>,
>(
  baseObjectSignal: BaseSignal<T>,
): ObjectMutatingAndNonMutatingMethods<InputSignal, T> => ({
  mutate: { ...getObjectMutatingMethods(baseObjectSignal) },
  ...getObjectNonMutatingMethods<InputSignal, T>(baseObjectSignal),
});
