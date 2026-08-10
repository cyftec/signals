import { Signal, BaseSourceSignal } from "../_types";
import type { DerivedSignal } from "../derived-signal";
import { derive } from "../derived-signal";
import {
  ObjectNonMutatingMethods,
  ObjectMutatingAndNonMutatingMethods,
  ObjectMutatingMethods,
} from "./types";

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
  baseObjectSignal: BaseSourceSignal<T>,
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
 * signal objects while preserving the derived result type of the input.
 *
 * @template T - The object type
 * @param baseObjectSignal - The base object signal whose properties are projected
 * @returns Non-mutating methods for object keys and properties
 *
 * @example
 * ```typescript
 * const user = signal({ name: "John", age: 30 });
 * const methods = getObjectNonMutatingMethods<typeof user.value>(user);
 * const name = methods.get("name");
 * console.log(name.value); // "John"
 * ```
 *
 * @remarks
 * - `keys()` and `get()` project through the current object value
 * - `props()` creates one property signal for each key present when it is called
 * - Every projection returns a lazy `DerivedSignal`.
 *
 * @see {@link ObjectNonMutatingMethods} - The returned method contract
 * @see {@link getObjectMutatingMethods} - For shallow source-signal updates
 */
export const getObjectNonMutatingMethods = <T extends Record<string, any>>(
  baseObjectSignal: Signal<T>,
): ObjectNonMutatingMethods<T> => {
  return {
    keys: () => derive(() => Object.keys(baseObjectSignal.value)),
    get: <K extends keyof T>(key: K) =>
      derive(() => baseObjectSignal.value[key]),
    props: () => {
      const signalledPropsObj = {} as {
        [key in keyof T]: DerivedSignal<T[key]>;
      };

      (Object.keys(baseObjectSignal.value) as (keyof T)[]).forEach((key) => {
        signalledPropsObj[key] = derive(() => baseObjectSignal.value[key]);
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
 * @template T - The object type
 * @param baseObjectSignal - The mutable base signal whose object value is used
 * @returns Combined mutating and non-mutating object methods
 *
 * @example
 * ```typescript
 * const user = signal({ name: "John", age: 30 });
 * const methods = getObjectMutatingAndNonMutatingMethods(user);
 * methods.mutate.set({ age: 31 });
 * console.log(methods.get("name").value); // "John"
 * ```
 *
 * @remarks
 * - Mutation is available only through `.mutate.set()`
 * - Non-mutating projections are direct members
 * - Every projection returns a lazy `DerivedSignal`.
 *
 * @see {@link getObjectMutatingMethods} - For mutating methods only
 * @see {@link getObjectNonMutatingMethods} - For non-mutating methods only
 * @see {@link ObjectMutatingAndNonMutatingMethods} - The returned method contract
 */
export const getObjectMutatingAndNonMutatingMethods = <
  T extends Record<string, any>,
>(
  baseObjectSignal: Signal<T>,
): ObjectMutatingAndNonMutatingMethods<T> => ({
  mutate: {
    ...getObjectMutatingMethods(baseObjectSignal as BaseSourceSignal<T>),
  },
  ...getObjectNonMutatingMethods<T>(baseObjectSignal),
});
