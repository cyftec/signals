import { BaseSignal, MaybeSignal, PlainValue } from "../_core/signals";
import { valueIsSignal } from "./type-checkers";

/**
 * Unwraps a signal-capable input to its plain value.
 *
 * Structurally recognized source, derived, and dead signals are read through
 * their `value` getter; every other input is returned unchanged.
 *
 * @template T - The explicitly requested unwrapped value type.
 * @template I - The exact inferred input type for union-preserving unwrapping.
 * @param input - A plain value or any base/supported signal shape.
 * @returns The outer signal's current value or the original plain input.
 *
 * @remarks
 * - Reading a live signal through this helper participates in dependency collection.
 * - Signal getters return copied object and array values according to base-signal behavior.
 * - Only an outer signal is unwrapped; signals nested in a plain container are preserved.
 * - `null` and `undefined` pass through unchanged.
 * - Recognition relies only on the `type` discriminator.
 *
 * @example
 * ```typescript
 * const count = signal(42);
 * const snapshot = deadSignal("hello");
 * console.log(value(count)); // 42
 * console.log(value(snapshot)); // "hello"
 * console.log(value(null)); // null
 * ```
 *
 * @see {@link valueIsSignal} - Performs runtime recognition.
 * @see {@link MaybeSignal} - Describes the general accepted input.
 * @see {@link BaseSignal} - Describes the additional low-level input shape.
 */
export function value<T>(input: MaybeSignal<T> | BaseSignal<T>): T;
export function value<I>(input: I): PlainValue<I>;
export function value(input: unknown): unknown {
  return valueIsSignal(input as MaybeSignal<unknown>)
    ? (input as BaseSignal<unknown>).value
    : input;
}
