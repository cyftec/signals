import {
  DataMethodValue,
  GenericMethods,
  getGenericMethods,
  NonMutatingMethods,
} from "../data-specific-methods";
import { getNonMutatingDataMethods } from "../data-specific-methods/data-methods";
import { getBaseSignal } from "./base-signal";
import { BaseDeadSignal } from "./types";

/**
 * Represents a read-only, non-reactive signal snapshot.
 *
 * A dead signal provides the same value-oriented read helpers as a compatible
 * live signal, but helper results are further dead snapshots rather than
 * reactive derived signals.
 *
 * @template T - The wrapped value type.
 *
 * @remarks
 * - Its discriminator is `type: "dead-signal"`.
 * - Assigning to `value` is ignored.
 * - `dispose()` is a repeatable no-op.
 * - Signal arguments supplied to its helpers are read once when the helper is called.
 *
 * @example
 * ```typescript
 * const text: DeadSignal<string> = deadSignal("hello");
 * const upper = text.toUpperCase();
 * console.log(upper.type, upper.value); // "dead-signal", "HELLO"
 * ```
 *
 * @see {@link deadSignal} - Creates a dead signal.
 * @see {@link LiveSignal} - Represents reactive signals.
 * @see {@link valueIsDeadSignal} - Checks the runtime discriminator.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

type DeadSignalMethods<T> = IsAny<T> extends true
  ? {}
  : T extends unknown
    ? GenericMethods<"non-live", DataMethodValue<T>> &
        NonMutatingMethods<"non-live", DataMethodValue<T>>
    : never;

export type DeadSignal<T> = BaseDeadSignal<T> &
  DeadSignalMethods<T>;

/**
 * Wraps a value in a read-only, non-reactive signal snapshot.
 *
 * The returned object supports runtime signal discrimination, generic helpers,
 * and value-specific non-mutating helpers without subscribing to live inputs.
 *
 * @template T - The wrapped value type.
 * @param input - The value to snapshot.
 * @param nonNullableInitialValue - Optional non-nullish dispatch hint used to attach data methods when `input` is nullish.
 * @returns A `DeadSignal<T>` containing the copied snapshot.
 *
 * @remarks
 * - The helper set is selected once at creation time.
 * - The `value` setter is a no-op.
 * - Dead-signal helper results do not react to live signal parameters.
 * - Unlike live effect disposal, dead-signal disposal never throws.
 *
 * @example
 * ```typescript
 * const snapshot = deadSignal([1, 2, 3]);
 * const last = snapshot.lastItem();
 * console.log(last.type, last.value); // "dead-signal", 3
 * ```
 *
 * @see {@link DeadSignal} - Describes the returned snapshot.
 * @see {@link signal} - Creates a mutable live signal.
 * @see {@link valueIsDeadSignal} - Checks dead signals.
 */
export const deadSignal = <T>(
  input: T,
  nonNullableInitialValue?: NonNullable<T extends Record<string, any> ? {} : T>,
): DeadSignal<T> => {
  const baseSignal = getBaseSignal<T>(input);
  const valueDescriptor = Object.getOwnPropertyDescriptor(baseSignal, "value")!;

  Object.defineProperty(baseSignal, "value", {
    configurable: valueDescriptor.configurable,
    enumerable: valueDescriptor.enumerable,
    get: valueDescriptor.get!,
    set() {},
  });

  const deadSignal = Object.assign(baseSignal, {
    type: "dead-signal",
    mutate: undefined,
    dispose() {},
  }) as BaseDeadSignal<T>;

  Object.assign(
    deadSignal,
    getGenericMethods<"non-live", T>(deadSignal as any),
  );
  Object.assign(
    deadSignal,
    getNonMutatingDataMethods<"non-live", T>(
      deadSignal as any,
      nonNullableInitialValue,
    ),
  );
  return deadSignal as any;
};
