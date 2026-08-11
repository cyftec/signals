import { isPlainObject } from "@cyftec/immut";
import { value } from "../../utils";
import { MaybeSignal } from "../_types";
import { derive, DerivedSignal } from "../derived-signal";
import type {
  Comparison,
  ComparisonReturnType,
  ExistenceComparison,
  GenericMethodReturnType,
  GenericMethods,
  LengthComparison,
  MeasureComparison,
  Primitive,
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
 * Creates a logical primitive methods object for truthy/falsy and equality checks.
 *
 * This function creates methods for checking if a value is truthy or falsy,
 * and for comparing it with other values for equality.
 *
 * @template T - The type of value to check
 * @template R - The return type (DerivedSignal or TernaryThen)
 * @param valueGetter - A function that returns the value to check
 * @param forTernary - Whether to return TernaryThen for ternary operations
 * @returns A logical primitive methods object
 *
 * @remarks
 * - `truthy` returns true if the value is truthy
 * - `falsy` returns true if the value is falsy
 * - `equalTo` returns true if the value equals the comparison value
 * - `notEqualTo` returns true if the value does not equal the comparison value
 * - When forTernary is true, methods return TernaryThen for conditional selection
 */
const getExistenceComparisonMethods = <
  GenericMethodReturn extends GenericMethodReturnType,
  T extends Primitive,
  R extends ComparisonReturnType<GenericMethodReturn>,
>(
  valueGetter: () => T,
  forTernary: boolean,
): ExistenceComparison<GenericMethodReturn, R> => {
  const truthyEvaluator = () => !!valueGetter();
  const falsyEvaluator = () => !valueGetter();

  const truthyChecker = (forTernaryThen: boolean) => () =>
    forTernaryThen ? getTernaryThen(truthyEvaluator) : derive(truthyEvaluator);

  const falsyChecker = (forTernaryThen: boolean) => () =>
    forTernaryThen ? getTernaryThen(falsyEvaluator) : derive(falsyEvaluator);

  const equalToChecker =
    (forTernaryThen: boolean) => (compareValue: MaybeSignal<unknown>) => {
      const equalityEvaluator = () =>
        valueGetter() === (value(compareValue) as T);
      return forTernaryThen
        ? getTernaryThen(equalityEvaluator)
        : derive(equalityEvaluator);
    };

  const notEqualToChecker =
    (forTernaryThen: boolean) => (compareValue: MaybeSignal<unknown>) => {
      const notEqualityEvaluator = () =>
        valueGetter() !== (value(compareValue) as T);
      return forTernaryThen
        ? getTernaryThen(notEqualityEvaluator)
        : derive(notEqualityEvaluator);
    };

  return {
    truthy: truthyChecker(forTernary),
    falsy: falsyChecker(forTernary),
    equalTo: equalToChecker(forTernary),
    notEqualTo: notEqualToChecker(forTernary),
  } as ExistenceComparison<GenericMethodReturn, R>;
};

/**
 * Creates a logical number methods object for numeric comparisons.
 *
 * This function creates methods for comparing numeric values using
 * greater-than and less-than operators.
 *
 * @template R - The return type (DerivedSignal or TernaryThen)
 * @param numberGetter - A function that returns the number to compare
 * @param forTernary - Whether to return TernaryThen for ternary operations
 * @returns A logical number methods object
 *
 * @remarks
 * - `greaterThan` returns true if the value is greater than the comparison value
 * - `greaterThanOrEqualTo` returns true if the value is greater than or equal
 * - `smallerThan` returns true if the value is less than the comparison value
 * - `smallerThanOrEqualTo` returns true if the value is less than or equal
 * - When forTernary is true, methods return TernaryThen for conditional selection
 */
const getMeasureComparisonMethods = <
  GenericMethodReturn extends GenericMethodReturnType,
  R extends ComparisonReturnType<GenericMethodReturn>,
>(
  numberGetter: () => number,
  forTernary: boolean,
): MeasureComparison<GenericMethodReturn, R> => {
  const greaterThanChecker =
    (forTernaryThen: boolean) => (compareValue: MaybeSignal<number>) => {
      const greaterThanEvaluator = () =>
        numberGetter() > (value(compareValue) as number);
      return forTernaryThen
        ? getTernaryThen(greaterThanEvaluator)
        : derive(greaterThanEvaluator);
    };
  const greaterThanOrEqualToChecker =
    (forTernaryThen: boolean) => (compareValue: MaybeSignal<number>) => {
      const greaterThanOrEqualToEvaluator = () =>
        numberGetter() >= (value(compareValue) as number);
      return forTernaryThen
        ? getTernaryThen(greaterThanOrEqualToEvaluator)
        : derive(greaterThanOrEqualToEvaluator);
    };
  const smallerThanChecker =
    (forTernaryThen: boolean) => (compareValue: MaybeSignal<number>) => {
      const smallerThanEvaluator = () =>
        numberGetter() < (value(compareValue) as number);
      return forTernaryThen
        ? getTernaryThen(smallerThanEvaluator)
        : derive(smallerThanEvaluator);
    };
  const smallerThanOrEqualToChecker =
    (forTernaryThen: boolean) => (compareValue: MaybeSignal<number>) => {
      const smallerThanOrEqualToEvaluator = () =>
        numberGetter() <= (value(compareValue) as number);
      return forTernaryThen
        ? getTernaryThen(smallerThanOrEqualToEvaluator)
        : derive(smallerThanOrEqualToEvaluator);
    };

  return {
    greaterThan: greaterThanChecker(forTernary),
    greaterThanOrEqualTo: greaterThanOrEqualToChecker(forTernary),
    smallerThan: smallerThanChecker(forTernary),
    smallerThanOrEqualTo: smallerThanOrEqualToChecker(forTernary),
  } as MeasureComparison<GenericMethodReturn, R>;
};

/**
 * Combines primitive and number logical methods into a single checker.
 *
 * @template T - The type of value to check
 * @template R - The return type (DerivedSignal or TernaryThen)
 * @param valueGetter - A function that returns the value to check
 * @param forTernary - Whether to return TernaryThen for ternary operations
 * @returns A combined logical checker object
 */
const getComparisonMethods = <
  GenericMethodReturn extends GenericMethodReturnType,
  T extends Primitive,
>(
  valueGetter: () => T,
  forTernary: boolean,
): Comparison<GenericMethodReturn, T> => {
  return {
    ...getExistenceComparisonMethods(valueGetter, forTernary),
    ...getMeasureComparisonMethods(valueGetter as () => number, forTernary),
  } as unknown as Comparison<GenericMethodReturn, T>;
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
 * - Measure comparisons are exposed for numbers
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
  const valueGetter = () => value(baseSignal) as Primitive;
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
