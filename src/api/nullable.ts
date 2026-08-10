import { type MaybeSignal, type PlainValue } from "../_core/_types";
import {
  type GenericMethods,
  getGenericMethods,
  type Primitive,
} from "../_core/data-specific-methods";

/**
 * Adds generic logical helpers to a nullable primitive input.
 *
 * The wrapper exposes `or`, `is`, and `if` operations while preserving the
 * derived result helpers for any accepted plain value or signal input.
 *
 * @template I - The concrete plain or signal input type.
 * @param input - A value whose plain type includes at least one primitive member.
 * @returns Generic helper methods specialized to the input's plain value type.
 *
 * @remarks
 * - The type constraint rejects inputs with no primitive member.
 * - `or` uses JavaScript truthiness, not only nullishness.
 * - Comparisons accept signal-capable operands.
 * - Result helpers are lazy derived signals, including for plain inputs.
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
  input: I &
    (Extract<PlainValue<I>, Primitive> extends never ? never : unknown),
): GenericMethods<PlainValue<I>> =>
  getGenericMethods<PlainValue<I>>(input as MaybeSignal<PlainValue<I>>);
