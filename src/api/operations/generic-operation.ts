import { derive, type MaybeSignal } from "../../_core";
import { value } from "../../utils";
import type { GenericOperation, OperationResult } from "./types";

/**
 * Creates a generic lazy operation chain around an evaluator.
 *
 * Chain methods compose a new evaluator without creating a signal. Reading a
 * terminal getter or calling `then` creates a fresh derived signal that executes
 * the complete chain and tracks live values read on its first evaluation.
 *
 * @template T - The input evaluator's value type.
 * @param input - A signal-capable value or a zero-argument evaluator.
 * @returns A generic operation object with logical chains and terminal results.
 *
 * @remarks
 * - `or`, `orNot`, `and`, and `andNot` preserve JavaScript operand semantics.
 * - Strict equality is used by equality operations.
 * - JavaScript short-circuiting can skip a signal on the first terminal evaluation; such a signal is not added later.
 * - Every access to `result`, `truthy`, `falsy`, or `truthyFalsyPair` creates a distinct derived signal.
 *
 * @example
 * ```typescript
 * const enabled = signal(true);
 * const visible = genericOp(enabled).and(true).truthy;
 * const label = genericOp(enabled).then("shown", "hidden");
 * ```
 *
 * @see {@link op} - Dispatches to the appropriate operation factory.
 * @see {@link GenericOperation} - Describes the returned chain.
 * @see {@link derive} - Creates terminal reactive results.
 */
export const genericOp = <T>(
  input: MaybeSignal<T> | (() => T),
): GenericOperation => {
  const evaluator: () => T =
    typeof input === "function"
      ? (input as () => T)
      : (): T => value(input as MaybeSignal<T>);

  const opResultGetters: OperationResult = {
    get result() {
      return derive<unknown>(() => evaluator());
    },
    get truthy() {
      return derive(() => !!evaluator());
    },
    get falsy() {
      return derive(() => !evaluator());
    },
    get truthyFalsyPair() {
      return derive(() => {
        const truthyVal = !!evaluator();
        const pair = [truthyVal, !truthyVal] as const;
        return pair;
      });
    },
    then: <Tr, Fl>(
      valueIfTruthy: MaybeSignal<Tr>,
      valueIfFalsy: MaybeSignal<Fl>,
    ) =>
      derive(() => {
        const val = evaluator();
        return val ? value(valueIfTruthy) : value(valueIfFalsy);
      }),
  };

  return {
    ...opResultGetters,
    or: (checkValue: MaybeSignal<any>) =>
      genericOp(() => {
        const val = evaluator();
        return val || value(checkValue);
      }),
    orNot: (checkValue: MaybeSignal<any>) =>
      genericOp(() => {
        const val = evaluator();
        return val || !value(checkValue);
      }),
    and: (checkValue: MaybeSignal<any>) =>
      genericOp(() => {
        const val = evaluator();
        return val && value(checkValue);
      }),
    andNot: (checkValue: MaybeSignal<any>) =>
      genericOp(() => {
        const val = evaluator();
        return val && !value(checkValue);
      }),
    equals: (compareValue: MaybeSignal<any>) =>
      genericOp(() => {
        const val = evaluator();
        return val === value(compareValue);
      }),
    notEquals: (compareValue: MaybeSignal<any>) =>
      genericOp(() => {
        const val = evaluator();
        return val !== value(compareValue);
      }),
    orBothEqual: (
      subjectValue: MaybeSignal<any>,
      compareValue: MaybeSignal<any>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) === value(compareValue);
        return val || comparisonResult;
      }),
    orBothUnequal: (
      subjectValue: MaybeSignal<any>,
      compareValue: MaybeSignal<any>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) !== value(compareValue);
        return val || comparisonResult;
      }),
    andBothEqual: (
      subjectValue: MaybeSignal<any>,
      compareValue: MaybeSignal<any>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) === value(compareValue);
        return val && comparisonResult;
      }),
    andBothUnequal: (
      subjectValue: MaybeSignal<any>,
      compareValue: MaybeSignal<any>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) !== value(compareValue);
        return val && comparisonResult;
      }),
    orThisIsLT: (
      subjectValue: MaybeSignal<number>,
      compareValue: MaybeSignal<number>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) < value(compareValue);
        return val || comparisonResult;
      }),
    orThisIsLTE: (
      subjectValue: MaybeSignal<number>,
      compareValue: MaybeSignal<number>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) <= value(compareValue);
        return val || comparisonResult;
      }),
    orThisIsGT: (
      subjectValue: MaybeSignal<number>,
      compareValue: MaybeSignal<number>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) > value(compareValue);
        return val || comparisonResult;
      }),
    orThisIsGTE: (
      subjectValue: MaybeSignal<number>,
      compareValue: MaybeSignal<number>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) >= value(compareValue);
        return val || comparisonResult;
      }),
    andThisIsLT: (
      subjectValue: MaybeSignal<number>,
      compareValue: MaybeSignal<number>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) < value(compareValue);
        return val && comparisonResult;
      }),
    andThisIsLTE: (
      subjectValue: MaybeSignal<number>,
      compareValue: MaybeSignal<number>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) <= value(compareValue);
        return val && comparisonResult;
      }),
    andThisIsGT: (
      subjectValue: MaybeSignal<number>,
      compareValue: MaybeSignal<number>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) > value(compareValue);
        return val && comparisonResult;
      }),
    andThisIsGTE: (
      subjectValue: MaybeSignal<number>,
      compareValue: MaybeSignal<number>,
    ) =>
      genericOp(() => {
        const val = evaluator();
        const comparisonResult = value(subjectValue) >= value(compareValue);
        return val && comparisonResult;
      }),
  };
};
