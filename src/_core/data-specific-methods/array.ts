import { newVal } from "@cyftec/immut";
import { getPlainMethodParams, value } from "../../utils";
import {
  MaybeSignal,
  MaybeSignalValues,
  Signal,
  BaseSourceSignal,
} from "../_types";
import { derive } from "../derived-signal";
import {
  ArrayCustomNonMutatingMethods,
  ArrayIntrinsicNonMutatingMethods,
  ArrayMutatingAndNonMutatingMethods,
  ArrayMutatingMethods,
  ArrayNonMutatingMethods,
} from "./types";

/**
 * Creates intrinsic mutating methods for array signals.
 *
 * Returns the array operations that update a source signal through its
 * `mutateWith()` hook. Copying operations work on a fresh array before the
 * updated value is published to dependent effects.
 *
 * @template T - The array type
 * @param baseArraySignal - The mutable base signal whose array value is updated
 * @returns Intrinsic mutating methods for array signals
 *
 * @remarks
 * - The returned methods form the contents of a source signal's `.mutate` object
 * - Copy-based operations do not mutate the array returned by the signal getter
 * - Each successful update is published through the base signal exactly once
 *
 * @example
 * ```typescript
 * const items = signal([1, 2]);
 * const methods = getArrayMutatingMethods(items);
 * methods.push(3);
 * console.log(items.value); // [1, 2, 3]
 * ```
 *
 * @see {@link ArrayMutatingMethods} - The returned method contract
 * @see {@link getArrayMutatingAndNonMutatingMethods} - For the source-signal method bundle
 */
export const getArrayMutatingMethods = <T extends any[]>(
  baseArraySignal: BaseSourceSignal<T>,
): ArrayMutatingMethods<T> => {
  const signalUpdator = (mutatorMethod: (newVal: T) => void): void =>
    baseArraySignal.mutateWith((oldValue: T) => {
      const newValue = Array.from(oldValue) as T;
      mutatorMethod(newValue);
      return newValue;
    });

  return {
    concat: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["concat"]>>
    ) =>
      baseArraySignal.mutateWith(
        (oldValue) => oldValue.concat(...getPlainMethodParams(...args)) as T,
      ),
    copyWithin: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["copyWithin"]>>
    ) =>
      signalUpdator((newValue) =>
        newValue.copyWithin(...getPlainMethodParams(...args)),
      ),
    fill: (...args: MaybeSignalValues<Parameters<Array<T[number]>["fill"]>>) =>
      signalUpdator((newValue) =>
        newValue.fill(...getPlainMethodParams(...args)),
      ),
    filter: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["filter"]>>
    ) =>
      baseArraySignal.mutateWith((oldValue: T) => {
        return oldValue.filter(...getPlainMethodParams(...args)) as T;
      }),
    pop: (...args: MaybeSignalValues<Parameters<Array<T[number]>["pop"]>>) =>
      signalUpdator((newValue) =>
        newValue.pop(...getPlainMethodParams(...args)),
      ),
    push: (...args: MaybeSignalValues<Parameters<Array<T[number]>["push"]>>) =>
      signalUpdator((newValue) =>
        newValue.push(...getPlainMethodParams(...args)),
      ),
    shift: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["shift"]>>
    ) =>
      signalUpdator((newValue) =>
        newValue.shift(...getPlainMethodParams(...args)),
      ),
    toReversed: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["reverse"]>>
    ) =>
      signalUpdator((newValue) =>
        newValue.reverse(...getPlainMethodParams(...args)),
      ),
    toSorted: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["sort"]>>
    ) =>
      signalUpdator((newValue) =>
        newValue.sort(...getPlainMethodParams(...args)),
      ),
    toSpliced: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["splice"]>>
    ) =>
      signalUpdator((newValue) =>
        newValue.splice(...getPlainMethodParams(...args)),
      ),
    unshift: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["unshift"]>>
    ) =>
      signalUpdator((newValue) =>
        newValue.unshift(...getPlainMethodParams(...args)),
      ),
  };
};

/**
 * Creates intrinsic non-mutating methods for array signals.
 *
 * Adapts standard read-only array operations so each result has the same
 * derived result type as the input signal.
 *
 * @template T - The array type
 * @param baseArraySignal - The base array signal to access values from
 * @returns Intrinsic non-mutating methods for array signals
 *
 * @remarks
 * - All inputs produce `DerivedSignal` results that react to the base and signal arguments
 * - All inputs produce `DerivedSignal` results
 * - Methods include element lookup, transforms, reducers, predicates, and copy helpers
 *
 * @example
 * ```typescript
 * const items = signal([1, 2, 3]);
 * const methods = getArrayIntrinsicNonMutatingMethods<number[]>(items);
 * const doubled = methods.map((item) => item * 2);
 * console.log(doubled.value); // [2, 4, 6]
 * ```
 *
 * @see {@link ArrayIntrinsicNonMutatingMethods} - The returned method contract
 * @see {@link getArrayCustomNonMutatingMethods} - For library-specific array projections
 */
export const getArrayIntrinsicNonMutatingMethods = <T extends any[]>(
  baseArraySignal: Signal<T>,
): ArrayIntrinsicNonMutatingMethods<T> => {
  return {
    at: (...args: MaybeSignalValues<Parameters<Array<T[number]>["at"]>>) =>
      derive(
        () =>
          baseArraySignal.value.at(...getPlainMethodParams(...args)) as
            | T[number]
            | undefined,
      ),
    concat: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["concat"]>>
    ) =>
      derive(
        () =>
          baseArraySignal.value.concat(
            ...getPlainMethodParams(...args),
          ) as T[number][],
      ),
    every: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["every"]>>
    ) =>
      derive(() =>
        baseArraySignal.value.every(...getPlainMethodParams(...args)),
      ),
    filter: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["filter"]>>
    ) =>
      derive(
        () =>
          baseArraySignal.value.filter(
            ...getPlainMethodParams(...args),
          ) as T[number][],
      ),
    find: (...args: MaybeSignalValues<Parameters<Array<T[number]>["find"]>>) =>
      derive(
        () =>
          baseArraySignal.value.find(...getPlainMethodParams(...args)) as
            | T[number]
            | undefined,
      ),
    findIndex: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["findIndex"]>>
    ) =>
      derive(() =>
        baseArraySignal.value.findIndex(...getPlainMethodParams(...args)),
      ),
    findLast: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["findLast"]>>
    ) =>
      derive(
        () =>
          baseArraySignal.value.findLast(...getPlainMethodParams(...args)) as
            | T[number]
            | undefined,
      ),
    findLastIndex: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["findLastIndex"]>>
    ) =>
      derive(() =>
        baseArraySignal.value.findLastIndex(...getPlainMethodParams(...args)),
      ),
    length: () => derive(() => baseArraySignal.value.length),
    map: <U>(mapFn: (item: T[number], index: number, array: T) => U) =>
      derive(() => baseArraySignal.value.map(mapFn as any) as U[]),
    reduce: <U>(
      reducerFn: (
        previousValue: U,
        currentValue: T[number],
        currentIndex: number,
        array: T,
      ) => U,
      initialValue: MaybeSignal<U>,
    ) =>
      derive(
        () =>
          baseArraySignal.value.reduce(
            reducerFn as any,
            value(initialValue),
          ) as U,
      ),
    reduceRight: <U>(
      reducerFn: (
        previousValue: U,
        currentValue: T[number],
        currentIndex: number,
        array: T,
      ) => U,
      initialValue: MaybeSignal<U>,
    ) =>
      derive(
        () =>
          baseArraySignal.value.reduceRight(
            reducerFn as any,
            value(initialValue),
          ) as U,
      ),
    some: (...args: MaybeSignalValues<Parameters<Array<T[number]>["some"]>>) =>
      derive(() =>
        baseArraySignal.value.some(...getPlainMethodParams(...args)),
      ),
    toReversed: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["toReversed"]>>
    ) =>
      derive(
        () =>
          baseArraySignal.value.toReversed(
            ...getPlainMethodParams(...args),
          ) as T[number][],
      ),
    toSorted: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["toSorted"]>>
    ) =>
      derive(
        () =>
          baseArraySignal.value.toSorted(
            ...getPlainMethodParams(...args),
          ) as T[number][],
      ),
    toSpliced: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["splice"]>>
    ) =>
      derive(
        () =>
          baseArraySignal.value.toSpliced(
            ...getPlainMethodParams(...args),
          ) as T[number][],
      ),
  };
};

/**
 * Creates custom non-mutating methods for array signals.
 *
 * Provides the library-specific `lastItem()` and `partition()` projections,
 * returning results that follow the derived result type of the input.
 *
 * @template T - The array type
 * @param baseArraySignal - The base array signal to access values from
 * @returns Custom non-mutating methods for array signals
 *
 * @remarks
 * - `lastItem()` projects the final item without changing the base array
 * - `partition()` returns passing and failing groups and honors the predicate `thisArg`
 * - All inputs produce `DerivedSignal` results; inputs produce `DerivedSignal` results
 *
 * @example
 * ```typescript
 * const items = signal([1, 2, 3, 4]);
 * const methods = getArrayCustomNonMutatingMethods<number[]>(items);
 * const [even, odd] = methods.partition((item) => item % 2 === 0);
 * console.log(even.value, odd.value); // [2, 4], [1, 3]
 * ```
 *
 * @see {@link ArrayCustomNonMutatingMethods} - The returned method contract
 * @see {@link getArrayIntrinsicNonMutatingMethods} - For standard array projections
 */
export const getArrayCustomNonMutatingMethods = <T extends any[]>(
  baseArraySignal: Signal<T>,
): ArrayCustomNonMutatingMethods<T> => {
  return {
    lastItem: () => {
      return derive(() => {
        const updatedArr = newVal(baseArraySignal.value);
        const returnVal = updatedArr.pop() as T[number] | undefined;
        return returnVal;
      });
    },
    partition: (
      ...args: MaybeSignalValues<Parameters<Array<T[number]>["filter"]>>
    ) => {
      const conditionPassArray = derive(() => {
        const [predicate, thisArg] = getPlainMethodParams(...args);
        return baseArraySignal.value.filter(predicate, thisArg) as T;
      });
      const conditionFailArray = derive(() => {
        const [predicate, thisArg] = getPlainMethodParams(...args);
        return baseArraySignal.value.filter(
          (item, index, array) => !predicate.call(thisArg, item, index, array),
        ) as T;
      });
      return [conditionPassArray, conditionFailArray];
    },
  };
};

/**
 * Creates combined non-mutating methods for array signals.
 *
 * Merges the intrinsic array projections with the library-specific projections
 * into the non-mutating method surface attached to array signals.
 *
 * @template T - The array type
 * @param baseArraySignal - The base array signal to access values from
 * @returns Combined non-mutating methods for array signals
 *
 * @remarks
 * - Every projection returns a lazy `DerivedSignal`.
 * - This bundle does not include mutators
 *
 * @example
 * ```typescript
 * const items = signal([1, 2, 3]);
 * const methods = getArrayNonMutatingMethods<number[]>(items);
 * console.log(methods.lastItem().value); // 3
 * ```
 *
 * @see {@link ArrayNonMutatingMethods} - The returned method contract
 * @see {@link getArrayMutatingAndNonMutatingMethods} - For the mutable source bundle
 */
export const getArrayNonMutatingMethods = <T extends any[]>(
  baseArraySignal: Signal<T>,
): ArrayNonMutatingMethods<T> => ({
  ...getArrayIntrinsicNonMutatingMethods<T>(baseArraySignal),
  ...getArrayCustomNonMutatingMethods<T>(baseArraySignal),
});

/**
 * Creates combined methods for array source signals.
 *
 * Combines a nested `.mutate` object with the direct non-mutating projections
 * used by an array source signal.
 *
 * @template T - The array type
 * @param baseArraySignal - The base array signal to access values from
 * @returns Combined methods for array source signals
 *
 * @remarks
 * - Mutation methods are available under `.mutate`
 * - Non-mutating methods are direct members of the returned object
 * - Every projection returns a lazy `DerivedSignal`.
 *
 * @example
 * ```typescript
 * const items = signal([1, 2]);
 * const methods = getArrayMutatingAndNonMutatingMethods<number[]>(items);
 * methods.mutate.push(3);
 * console.log(methods.length().value); // 3
 * ```
 *
 * @see {@link ArrayMutatingAndNonMutatingMethods} - The returned method contract
 * @see {@link getArrayMutatingMethods} - For the nested mutation methods
 */
export const getArrayMutatingAndNonMutatingMethods = <T extends any[]>(
  baseArraySignal: Signal<T>,
): ArrayMutatingAndNonMutatingMethods<T> => ({
  mutate: {
    ...getArrayMutatingMethods(baseArraySignal as BaseSourceSignal<T>),
  },
  ...getArrayNonMutatingMethods<T>(baseArraySignal),
});
