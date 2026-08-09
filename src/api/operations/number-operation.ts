import { derive, type MaybeSignal } from "../../_core";
import { value } from "../../utils";
import { genericOp } from "./generic-operation";
import type { NumberOperation } from "./types";

/**
 * Creates a lazy numeric operation chain around an evaluator.
 *
 * Arithmetic methods compose further numeric evaluators. Comparison methods
 * switch to generic boolean chains, and terminal getters create derived signals.
 *
 * @param input - A signal-capable number or zero-argument numeric evaluator.
 * @returns A number operation with arithmetic, range, comparison, and generic methods.
 *
 * @remarks
 * - Arithmetic uses native JavaScript operators without validation.
 * - `isBetween` includes both bounds by default; each bound can be made exclusive independently.
 * - Operands are unwrapped only when a terminal derived result evaluates.
 * - Each terminal getter access creates a distinct derived signal.
 *
 * @example
 * ```typescript
 * const count = signal(10);
 * const doubled = numberOp(count).mul(2).result;
 * const inside = numberOp(count).isBetween(5, 15).truthy;
 * ```
 *
 * @see {@link op} - Selects this factory for numeric initial values.
 * @see {@link NumberOperation} - Describes the returned chain.
 * @see {@link genericOp} - Supplies generic logical operations.
 */
export const numberOp = (
  input: MaybeSignal<number> | (() => number),
): NumberOperation => {
  const evaluate: () => number =
    typeof input === "function"
      ? (input as () => number)
      : (): number => value(input);

  return {
    ...genericOp(input),
    get result() {
      return derive(evaluate) as any;
    },
    add: (num: MaybeSignal<number>) =>
      numberOp(() => {
        const val = evaluate();
        return val + value(num);
      }),
    sub: (num: MaybeSignal<number>) =>
      numberOp(() => {
        const val = evaluate();
        return val - value(num);
      }),
    mul: (num: MaybeSignal<number>) =>
      numberOp(() => {
        const val = evaluate();
        return val * value(num);
      }),
    div: (num: MaybeSignal<number>) =>
      numberOp(() => {
        const val = evaluate();
        return val / value(num);
      }),
    mod: (num: MaybeSignal<number>) =>
      numberOp(() => {
        const val = evaluate();
        return val % value(num);
      }),
    pow: (num: MaybeSignal<number>) =>
      numberOp(() => {
        const val = evaluate();
        return val ** value(num);
      }),
    isBetween: (
      lowerValue: MaybeSignal<number>,
      upperValue: MaybeSignal<number>,
      touchingLower = true,
      touchingUpper = true,
    ) =>
      genericOp(() => {
        const val = evaluate();
        const lowerVal = value(lowerValue);
        const upperVal = value(upperValue);
        const lowerCheckPass = touchingLower ? val >= lowerVal : val > lowerVal;
        const upperCheckPass = touchingUpper ? val <= upperVal : val < upperVal;
        return lowerCheckPass && upperCheckPass;
      }),
    isLT: (compareValue: MaybeSignal<number>) =>
      genericOp(() => evaluate() < value(compareValue)),
    isLTE: (compareValue: MaybeSignal<number>) =>
      genericOp(() => evaluate() <= value(compareValue)),
    isGT: (compareValue: MaybeSignal<number>) =>
      genericOp(() => evaluate() > value(compareValue)),
    isGTE: (compareValue: MaybeSignal<number>) =>
      genericOp(() => evaluate() >= value(compareValue)),
  };
};
