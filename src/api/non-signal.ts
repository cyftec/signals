import { type Signal } from "../_core";
import { type MaybeSignal, type PlainValue } from "../_core/_types";
import {
  type GenericMethods,
  type NonMutatingMethods,
  getNonMutatingDataMethods,
  getGenericMethods,
} from "../_core/data-specific-methods";
import { value, valueIsSignal } from "../utils";

/**
 * Adds generic and applicable read-only data helpers to any plain or signal-wrapped input.
 *
 * The wrapper exposes `or`, `is`, `if`, and `toString()` along with the applicable array,
 * plain-object, string, or number projection methods. Every helper result is a derived signal.
 *
 * @template I - The concrete plain or signal input type.
 * @param input - A plain value or signal to wrap.
 * @returns Generic helper methods specialized to the input's plain value type.
 *
 * @remarks
 * - `or` uses JavaScript truthiness, not only nullishness.
 * - `toString()` produces an eagerly maintained string representation.
 * - Data-specific methods are read-only; the wrapper never exposes `.mutate`.
 * - Data-method selection uses the input's current runtime value when the wrapper is created.
 * - Comparisons accept any signal-capable operand and preserve JavaScript
 *   coercion behavior for relational operators.
 * - Result helpers are eagerly maintained derived signals, including for plain inputs.
 *
 * @example
 * ```typescript
 * const count = signal<number | null>(null);
 * const label = nonSignal(count).if.falsy().then("missing", "present");
 * count.value = 1;
 * console.log(label.value); // "present"
 * ```
 *
 * @see {@link MaybeSignal} - Describes accepted wrapper inputs.
 * @see {@link DerivedSignal} - Represents helper results.
 * @see {@link value} - Unwraps signal operands.
 */
export const nonSignal = <I extends MaybeSignal<unknown>>(
  input: I,
  nonNullableInitialValue?: NonNullable<PlainValue<I>>,
): GenericMethods<PlainValue<I>> & NonMutatingMethods<PlainValue<I>> => {
  type Output = PlainValue<I>;

  const dataMethodBaseSignal = {
    get value(): Output {
      return value(input) as Output;
    },
    get nonReactiveValue(): Output {
      return valueIsSignal(input as MaybeSignal<unknown>)
        ? (input as Signal<Output>).nonReactiveValue
        : (input as Output);
    },
  } as Signal<Output>;

  return {
    ...getGenericMethods<Output>(input as MaybeSignal<Output>),
    ...getNonMutatingDataMethods<Output>(
      dataMethodBaseSignal,
      nonNullableInitialValue,
    ),
  };
};
