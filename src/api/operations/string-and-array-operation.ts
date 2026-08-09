import { type MaybeSignal } from "../../_core";
import { value } from "../../utils";
import { genericOp } from "./generic-operation";
import type { StringAndArrayOperation } from "./types";

/**
 * Creates a lazy length-aware operation chain for a string or array.
 *
 * Length methods compose boolean evaluators and return generic operation chains;
 * their terminal getters then create reactive derived results.
 *
 * @template T - The string or array input type.
 * @param input - A signal-capable value or zero-argument evaluator returning `T`.
 * @returns A string-and-array operation with length and generic logical methods.
 *
 * @remarks
 * - Length is read with the native `.length` property.
 * - `lengthBetween` includes both bounds by default and supports independent exclusivity flags.
 * - Comparison operands can themselves be live signals.
 * - Each terminal getter access creates a distinct derived signal.
 *
 * @example
 * ```typescript
 * const text = signal("hello");
 * const exact = stringAndArrayOp(text).lengthEquals(5).truthy;
 * const bounded = stringAndArrayOp(text).lengthBetween(1, 10).truthy;
 * ```
 *
 * @see {@link op} - Selects this factory for string and array initial values.
 * @see {@link StringAndArrayOperation} - Describes the returned chain.
 * @see {@link genericOp} - Supplies generic logical operations.
 */
export const stringAndArrayOp = <T extends string | unknown[]>(
  input: MaybeSignal<T> | (() => T),
): StringAndArrayOperation => {
  const evaluate: () => T =
    typeof input === "function"
      ? (input as () => T)
      : (): T => value(input as MaybeSignal<T>);

  return {
    ...genericOp(input),
    lengthBetween: (
      lowerValue: MaybeSignal<number>,
      upperValue: MaybeSignal<number>,
      touchingLower = true,
      touchingUpper = true,
    ) =>
      genericOp(() => {
        const val = evaluate();
        const len = val.length;
        const lowerVal = value(lowerValue);
        const upperVal = value(upperValue);
        const lowerCheckPass = touchingLower ? len >= lowerVal : len > lowerVal;
        const upperCheckPass = touchingUpper ? len <= upperVal : len < upperVal;
        return lowerCheckPass && upperCheckPass;
      }),
    lengthEquals: (compareValue: MaybeSignal<number>) =>
      genericOp(() => {
        const val = evaluate();
        return val.length === value(compareValue);
      }),
    lengthNotEquals: (compareValue: MaybeSignal<number>) =>
      genericOp(() => {
        const val = evaluate();
        return val.length !== value(compareValue);
      }),
    lengthLT: (compareValue: MaybeSignal<number>) =>
      genericOp(() => {
        const val = evaluate();
        return val.length < value(compareValue);
      }),
    lengthLTE: (compareValue: MaybeSignal<number>) =>
      genericOp(() => {
        const val = evaluate();
        return val.length <= value(compareValue);
      }),
    lengthGT: (compareValue: MaybeSignal<number>) =>
      genericOp(() => {
        const val = evaluate();
        return val.length > value(compareValue);
      }),
    lengthGTE: (compareValue: MaybeSignal<number>) =>
      genericOp(() => {
        const val = evaluate();
        return val.length >= value(compareValue);
      }),
  };
};
