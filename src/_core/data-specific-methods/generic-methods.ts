import { isPlainObject } from "@cyftec/immut";
import { value } from "../../utils";
import { MaybeSignal } from "../_types";
import { derive, DerivedSignal } from "../derived-signal";
import type {
  Comparison,
  GenericMethodReturnType,
  GenericMethods,
  LengthComparison,
  TernaryThen,
} from "./types";

/**
 * Creates a logical map object for conditional value selection.
 *
 * This function creates an object with a `then` method that selects between
 * two values based on a condition. Used for ternary-style conditional logic.
 *
 * @param truthyEvaluator - A function that evaluates to true or false
 * @returns A logical map object with a `then` method
 *
 * @remarks
 * - The `then` method returns truthyOption if the condition is true, otherwise falsyOption
 * - Every branch selection returns an eagerly maintained derived signal.
 * - Both options are read during initial computation and captured updates.
 * - Used by the `if` logical methods for conditional value selection
 */
const getTernaryThen = (truthyEvaluator: () => boolean): TernaryThen => {
  return {
    then: <U, V>(
      truthyOption: MaybeSignal<U>,
      falsyOption: MaybeSignal<V>,
    ): DerivedSignal<U | V> => {
      return derive(() => {
        const truthyValue = value(truthyOption) as U;
        const falsyValue = value(falsyOption) as V;
        return truthyEvaluator() ? truthyValue : falsyValue;
      });
    },
  };
};

/**
 * Creates universal truthiness, equality, and relational comparisons.
 *
 * Relational evaluators deliberately delegate to JavaScript operators. Their
 * native coercion and error behavior therefore remains observable.
 */
const getComparisonMethods = <
  GenericMethodReturn extends GenericMethodReturnType,
>(
  valueGetter: () => unknown,
  forTernary: boolean,
): Comparison<GenericMethodReturn> => {
  const result = (evaluator: () => boolean) =>
    forTernary ? getTernaryThen(evaluator) : derive(evaluator);

  return {
    truthy: () => result(() => !!valueGetter()),
    falsy: () => result(() => !valueGetter()),
    equalTo: (compareValue) =>
      result(() => valueGetter() === value(compareValue)),
    notEqualTo: (compareValue) =>
      result(() => valueGetter() !== value(compareValue)),
    greaterThan: (compareValue) =>
      result(() => (valueGetter() as any) > (value(compareValue) as any)),
    greaterThanOrEqualTo: (compareValue) =>
      result(() => (valueGetter() as any) >= (value(compareValue) as any)),
    smallerThan: (compareValue) =>
      result(() => (valueGetter() as any) < (value(compareValue) as any)),
    smallerThanOrEqualTo: (compareValue) =>
      result(() => (valueGetter() as any) <= (value(compareValue) as any)),
  } as Comparison<GenericMethodReturn>;
};

/**
 * Creates a logical length methods object for length-based comparisons.
 *
 * This function creates methods for comparing the length of strings and arrays.
 *
 * @template R - The return type (DerivedSignal or TernaryThen)
 * @param lengthGetter - A function that returns the length to compare
 * @param forTernary - Whether to return TernaryThen for ternary operations
 * @returns A logical length methods object
 *
 * @remarks
 * - The `length` property provides all logical checks on the length value
 * - Returns NaN for values that don't have a length property
 * - Used by string and array signals for length-based logic
 */
const getLengthMethods = <GenericMethodReturn extends GenericMethodReturnType>(
  lengthGetter: () => number,
  forTernary: boolean,
): LengthComparison<GenericMethodReturn> => {
  return {
    length: getComparisonMethods(lengthGetter, forTernary),
  };
};

/**
 * Creates logical methods for signals.
 *
 * Builds the `or`, `is`, `if`, and `toString()` method groups shared by supported signal
 * values. Every comparison result is an eagerly maintained derived signal.
 *
 * @template T - The value type exposed by the input
 * @param baseSignal - The signal to add logical methods to
 * @returns A logical methods object
 *
 * @remarks
 * - `or()` selects its alternative for every JavaScript-falsy input value
 * - `is` methods return boolean signals returned as derived signals
 * - `if` methods return a `then()` selector for reactive conditional values
 * - `toString()` renders nullish values explicitly, plain objects as JSON, and other values through JavaScript `toString()`
 * - Length comparisons are exposed for strings and arrays
 * - Relational comparisons are exposed for every value type
 * - All inputs produce `DerivedSignal` results; inputs produce `DerivedSignal` results
 *
 * @example
 * ```typescript
 * const count = signal(5);
 * const logical = getGenericMethods<number>(count);
 * logical.is.truthy().value; // true
 * logical.is.greaterThan(3).value; // true
 * logical.if.greaterThan(10).then("big", "small").value; // "small"
 * ```
 *
 * @see {@link GenericMethods} - The conditional logical-method surface
 * @see {@link TernaryThen} - The selector returned by `if` comparisons
 */
export const getGenericMethods = <T>(
  // generic methods are valid even for null or undefined
  baseSignal: MaybeSignal<T>,
): GenericMethods<T> => {
  const valueGetter = () => value(baseSignal);
  const lengthGetter = () => {
    const val = value(baseSignal);
    if (typeof val === "string" || Array.isArray(val)) return val.length;
    return NaN;
  };

  return {
    is: {
      ...getComparisonMethods(valueGetter, false),
      ...getLengthMethods(lengthGetter, false),
    },
    if: {
      ...getComparisonMethods(valueGetter, true),
      ...getLengthMethods(lengthGetter, true),
    },
    or: <A>(
      alternativeValue: MaybeSignal<A>,
    ): DerivedSignal<NonNullable<T> | A> => {
      return derive(() => {
        const altValue = value(alternativeValue);
        return (value(baseSignal) || altValue) as NonNullable<T> | A;
      });
    },
    toString: (): DerivedSignal<string> => {
      return derive(() => {
        const signalValue = value(baseSignal);
        if (signalValue === null) return "null";
        if (signalValue === undefined) return "undefined";
        if (isPlainObject(signalValue)) return JSON.stringify(signalValue);
        return signalValue.toString();
      });
    },
  } as GenericMethods<T>;
};
