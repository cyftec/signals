import {
  derive,
  type DerivedSignal,
  type MaybeSignalValues,
  type PlainValues,
} from "../_core";
import { value } from "../utils";

/**
 * Computes a derived signal from signal-capable function arguments.
 *
 * Every argument is unwrapped with `value()` inside a derived value getter, then
 * passed to `computerFn` in order whenever the returned value is read.
 *
 * @template F - The function type used for parameter and result inference.
 * @param computerFn - The function to call with unwrapped argument values.
 * @param restArgs - Plain values or signals matching the function parameters.
 * @returns A derived signal containing the function result.
 *
 * @remarks
 * - The computation runs when the returned derived value is read.
 * - Plain arguments are read as supplied; signals are unwrapped at read time.
 * - Source-signal reads can be collected when the derived value is read during effect installation.
 * - Errors thrown by `computerFn` propagate synchronously.
 *
 * @example
 * ```typescript
 * const left = signal(2);
 * const right = signal(3);
 * const total = compute((a: number, b: number) => a + b, left, right);
 * right.value = 5;
 * console.log(total.value); // 7
 * ```
 *
 * @see {@link derive} - Provides the lazy derived value getter.
 * @see {@link value} - Unwraps each argument.
 * @see {@link MaybeSignalValues} - Describes accepted argument tuples.
 */
export const compute = <F extends (...args: any[]) => any>(
  computerFn: F,
  ...restArgs: MaybeSignalValues<Parameters<F>>
): DerivedSignal<ReturnType<F>> => {
  return derive<ReturnType<F>>(() => {
    const plainArgs = restArgs.map((arg) => value(arg)) as PlainValues<
      typeof restArgs
    >;
    return computerFn(...plainArgs);
  });
};
