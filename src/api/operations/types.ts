import type { DerivedSignal, MaybeSignal } from "../../_core";

/** Type for logical operations that return a `GenericOperation` for chaining. */
type LogicalOperation<T> = (checkValue: MaybeSignal<T>) => GenericOperation;

/** Type for comparison operations that return a `GenericOperation` for chaining. */
type ComparisonOperation<T> = (
  compareValue: MaybeSignal<T>,
) => GenericOperation;

/** Type for operations combining logic with comparisons on two values. */
type LogicWithComparisonOperation<T> = (
  subjectValue: MaybeSignal<T>,
  compareValue: MaybeSignal<T>,
) => GenericOperation;

/**
 * Describes terminal result creation shared by every operation chain.
 *
 * Getter access and `then()` terminate lazy operation composition by creating a
 * new derived signal that evaluates the chain.
 *
 * @remarks
 * - `result` preserves the evaluated value with the broad `unknown` type here.
 * - Boolean getters coerce with JavaScript truthiness.
 * - `then()` evaluates only the selected option on each run.
 * - Each terminal access creates a separate derived signal and subscription.
 *
 * @example
 * ```typescript
 * const operation: OperationResult = op(true);
 * const raw = operation.result;
 * const pair = operation.truthyFalsyPair;
 * const label = operation.then("yes", "no");
 * ```
 *
 * @see {@link GenericOperation} - Adds logical composition methods.
 * @see {@link NumberOperation} - Narrows `result` to a numeric signal.
 * @see {@link DerivedSignal} - Represents every terminal result.
 */
export type OperationResult = {
  /** Derived signal of the evaluated operation value. */
  get result(): DerivedSignal<unknown>;
  /** Derived signal of whether the evaluated value is truthy. */
  get truthy(): DerivedSignal<boolean>;
  /** Derived signal of whether the evaluated value is falsy. */
  get falsy(): DerivedSignal<boolean>;
  /** Derived signal of the `[isTruthy, isFalsy]` pair. */
  get truthyFalsyPair(): DerivedSignal<readonly [boolean, boolean]>;
  /** Returns `valueIfTruthy` if truthy, otherwise `valueIfFalsy`. */
  then: <Tr, Fl>(
    valueIfTruthy: MaybeSignal<Tr>,
    valueIfFalsy: MaybeSignal<Fl>,
  ) => DerivedSignal<Tr | Fl>;
};

/**
 * Describes the logical chain available for every operation input.
 *
 * Each method returns another generic chain whose evaluator composes the prior
 * value with signal-capable logical or comparison operands.
 *
 * @remarks
 * - Logical operations use native `||`, `&&`, and `!` semantics.
 * - Equality operations use strict equality and inequality.
 * - Two-value comparison helpers evaluate their subject and comparison operands.
 * - Terminal behavior is inherited from `OperationResult`.
 *
 * @example
 * ```typescript
 * const chain: GenericOperation = op(true)
 *   .and(signal(1))
 *   .notEquals(false);
 * const result = chain.truthy;
 * ```
 *
 * @see {@link OperationResult} - Creates terminal derived results.
 * @see {@link genericOp} - Constructs this operation shape.
 * @see {@link Operation} - Selects an operation shape by input type.
 */
export type GenericOperation = OperationResult & {
  /** Chains an OR operation */
  or: LogicalOperation<any>;
  /** Chains an OR-NOT operation */
  orNot: LogicalOperation<any>;
  /** Chains an AND operation */
  and: LogicalOperation<any>;
  /** Chains an AND-NOT operation */
  andNot: LogicalOperation<any>;
  /** Chains an equality comparison */
  equals: ComparisonOperation<any>;
  /** Chains an inequality comparison */
  notEquals: ComparisonOperation<any>;
  /** Chains an OR operation with an equality check on two other values */
  orBothEqual: LogicWithComparisonOperation<any>;
  /** Chains an OR operation with an inequality check on two other values */
  orBothUnequal: LogicWithComparisonOperation<any>;
  /** Chains an AND operation with an equality check on two other values */
  andBothEqual: LogicWithComparisonOperation<any>;
  /** Chains an AND operation with an inequality check on two other values */
  andBothUnequal: LogicWithComparisonOperation<any>;
  /** Chains an OR operation with a less-than comparison on two other values */
  orThisIsLT: LogicWithComparisonOperation<number>;
  /** Chains an OR operation with a less-than-or-equal comparison on two other values */
  orThisIsLTE: LogicWithComparisonOperation<number>;
  /** Chains an OR operation with a greater-than comparison on two other values */
  orThisIsGT: LogicWithComparisonOperation<number>;
  /** Chains an OR operation with a greater-than-or-equal comparison on two other values */
  orThisIsGTE: LogicWithComparisonOperation<number>;
  /** Chains an AND operation with a less-than comparison on two other values */
  andThisIsLT: LogicWithComparisonOperation<number>;
  /** Chains an AND operation with a less-than-or-equal comparison on two other values */
  andThisIsLTE: LogicWithComparisonOperation<number>;
  /** Chains an AND operation with a greater-than comparison on two other values */
  andThisIsGT: LogicWithComparisonOperation<number>;
  /** Chains an AND operation with a greater-than-or-equal comparison on two other values */
  andThisIsGTE: LogicWithComparisonOperation<number>;
};

/** Type for confinement/range check operations. */
type ConfinementCheckOperation = (
  lowerValue: MaybeSignal<number>,
  upperValue: MaybeSignal<number>,
  touchingLower?: boolean,
  touchingUpper?: boolean,
) => GenericOperation;

/** Type for math operations that return `NumberOperation` for chaining. */
type MathOperation = (num: MaybeSignal<number>) => NumberOperation;

/**
 * Describes numeric arithmetic and comparison operation chains.
 *
 * This operation extends generic logical composition, narrows `result` to a
 * number, and adds native arithmetic and range comparisons.
 *
 * @remarks
 * - Arithmetic methods return another `NumberOperation`.
 * - Numeric comparisons return `GenericOperation` boolean chains.
 * - Range bounds are inclusive by default.
 * - JavaScript numeric edge cases such as `NaN` and division by zero are preserved.
 *
 * @example
 * ```typescript
 * const chain: NumberOperation = op(10).add(2).mul(3);
 * console.log(chain.result.value); // 36
 * ```
 *
 * @see {@link numberOp} - Constructs this operation shape.
 * @see {@link GenericOperation} - Supplies inherited logical methods.
 * @see {@link Operation} - Selects this shape for numeric inputs.
 */
export type NumberOperation = GenericOperation & {
  /** The numeric value as a derived signal. */
  get result(): DerivedSignal<number>;
  /** Chains an addition operation */
  add: MathOperation;
  /** Chains a subtraction operation */
  sub: MathOperation;
  /** Chains a multiplication operation */
  mul: MathOperation;
  /** Chains a division operation */
  div: MathOperation;
  /** Chains a modulo operation */
  mod: MathOperation;
  /** Chains an exponentiation operation */
  pow: MathOperation;
  /** Checks if the value is between lower and upper (inclusive by default) */
  isBetween: ConfinementCheckOperation;
  /** Chains a less-than comparison */
  isLT: ComparisonOperation<number>;
  /** Chains a less-than-or-equal comparison */
  isLTE: ComparisonOperation<number>;
  /** Chains a greater-than comparison */
  isGT: ComparisonOperation<number>;
  /** Chains a greater-than-or-equal comparison */
  isGTE: ComparisonOperation<number>;
};

/**
 * Describes length comparisons for string and array operation chains.
 *
 * This operation extends generic logical composition with equality, ordering,
 * and bounded-range checks against the evaluated value's `.length`.
 *
 * @remarks
 * - Every length method returns a generic boolean operation chain.
 * - Comparison values may be plain, live, or dead signals.
 * - `lengthBetween` includes both bounds by default.
 * - String length follows JavaScript UTF-16 code-unit semantics.
 *
 * @example
 * ```typescript
 * const chain: StringAndArrayOperation = op("hello");
 * const longEnough = chain.lengthGTE(5).truthy;
 * ```
 *
 * @see {@link stringAndArrayOp} - Constructs this operation shape.
 * @see {@link GenericOperation} - Supplies inherited logical methods.
 * @see {@link Operation} - Selects this shape for strings and arrays.
 */
export type StringAndArrayOperation = GenericOperation & {
  /** Checks whether the length is between lower and upper values. */
  lengthBetween: ConfinementCheckOperation;
  /** Chains a length equality comparison. */
  lengthEquals: ComparisonOperation<number>;
  /** Chains a length inequality comparison. */
  lengthNotEquals: ComparisonOperation<number>;
  /** Chains a length less-than comparison. */
  lengthLT: ComparisonOperation<number>;
  /** Chains a length less-than-or-equal comparison. */
  lengthLTE: ComparisonOperation<number>;
  /** Chains a length greater-than comparison. */
  lengthGT: ComparisonOperation<number>;
  /** Chains a length greater-than-or-equal comparison. */
  lengthGTE: ComparisonOperation<number>;
};

/**
 * Maps an input value type to its operation-chain surface.
 *
 * Numeric types receive arithmetic operations, string and array types receive
 * length operations, and all other types receive generic logical operations.
 *
 * @template T - The input value type to classify.
 *
 * @remarks
 * - The conditional type distributes over union inputs.
 * - Runtime `op()` dispatch is based only on the initially evaluated value.
 * - This type does not make a chain change shape after creation.
 *
 * @example
 * ```typescript
 * type Numeric = Operation<number>; // NumberOperation
 * type Textual = Operation<string>; // StringAndArrayOperation
 * type Flag = Operation<boolean>; // GenericOperation
 * ```
 *
 * @see {@link op} - Performs the corresponding runtime dispatch.
 * @see {@link NumberOperation} - Numeric result shape.
 * @see {@link StringAndArrayOperation} - String and array result shape.
 * @see {@link GenericOperation} - Fallback result shape.
 */
export type Operation<T> = T extends number
  ? NumberOperation
  : T extends string | unknown[]
    ? StringAndArrayOperation
    : GenericOperation;
