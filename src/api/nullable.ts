import { type MaybeSignal, type PlainValue } from "../_core/_types";
import {
  type GenericMethods,
  getGenericMethods,
} from "../_core/data-specific-methods";

/**
 * Adds generic helpers to any plain or signal-wrapped input.
 *
 * The wrapper exposes `or`, `is`, `if`, and `toString()` operations while preserving the
 * derived result helpers for any accepted plain value or signal input.
 *
 * @template I - The concrete plain or signal input type.
 * @param input - A plain value or signal to wrap.
 * @returns Generic helper methods specialized to the input's plain value type.
 *
 * @remarks
 * - `or` uses JavaScript truthiness, not only nullishness.
 * - `toString()` produces an eagerly maintained string representation.
 * - Comparisons accept any signal-capable operand and preserve JavaScript
 *   coercion behavior for relational operators.
 * - Result helpers are eagerly maintained derived signals, including for plain inputs.
 *
 * @example
 * ```typescript
 * const count = signal<number | null>(null);
 * const label = nullable(count).if.falsy().then("missing", "present");
 * count.value = 1;
 * console.log(label.value); // "present"
 * ```
 *
 * @see {@link MaybeSignal} - Describes accepted wrapper inputs.
 * @see {@link DerivedSignal} - Represents helper results.
 * @see {@link value} - Unwraps signal operands.
 */
export const nullable = <I extends MaybeSignal<unknown>>(
  input: I,
): GenericMethods<PlainValue<I>> =>
  getGenericMethods<PlainValue<I>>(input as MaybeSignal<PlainValue<I>>);
