import { type DerivedSignal, signal } from "../_core";

/**
 * Creates reactive result, error, and pending state for a promise function.
 *
 * The returned runner marks the operation as running before invoking
 * `promiseFn`. Settlement updates a shared state signal whose properties are
 * exposed as three derived signals.
 *
 * @template R - The fulfilled promise result type.
 * @template Args - The tuple of arguments accepted by the promise function.
 * @template I - The optional initial-result type.
 * @param promiseFn - The promise-returning function to execute.
 * @param initialValue - Optional initial result; current runtime initialization converts falsy values to `undefined`.
 * @param ultimately - Optional callback passed to the returned promise's `finally` stage.
 * @returns A readonly tuple of the runner, result signal, error signal, and running signal.
 *
 * @remarks
 * - `isRunning` becomes `true` synchronously when the runner is called and `false` on fulfillment or handled rejection.
 * - Success replaces the result and clears the prior error.
 * - Rejection is handled into the error signal and preserves the prior result.
 * - Rejected values are stored without runtime validation despite the `Error` type annotation.
 * - A synchronous throw before `promiseFn` returns a promise leaves `isRunning` true and escapes the runner.
 * - Concurrent runs share one boolean and use settlement order rather than request identity.
 *
 * @example
 * ```typescript
 * const [run, result, error, isRunning] = promstates(
 *   async (value: number) => value * 2,
 * );
 * const pending = run(3);
 * console.log(isRunning.value); // true
 * await pending;
 * console.log(result.value, error.value, isRunning.value); // 6, undefined, false
 * ```
 *
 * @see {@link DerivedSignal} - Describes each state projection.
 * @see {@link signal} - Stores the shared promise state.
 * @see {@link effect} - Observes derived state values.
 */
export const promstates = <R, Args extends Array<any>, I>(
  promiseFn: (...args: Args) => Promise<R>,
  initialValue?: I,
  ultimately?: () => void,
): readonly [
  /**
   * Promise runner method which takes the same arguments as the original promise
   * but returns `Promise<void>`.
   */
  (...args: Args) => Promise<void>,
  /** Derived signal of result of the promise. */
  DerivedSignal<unknown extends I ? R | undefined : R | I>,
  /** Derived signal of promise error. */
  DerivedSignal<Error | undefined>,
  /** Derived signal of whether promise is currently running or not */
  DerivedSignal<boolean>,
] => {
  type PromState = {
    isRunning: boolean;
    result: unknown extends I ? R | undefined : R | I;
    error: Error | undefined;
  };
  const state = signal<PromState>({
    isRunning: false,
    result: (initialValue || undefined) as unknown extends I
      ? R | undefined
      : R | I,
    error: undefined,
  });

  const runPromise = (...args: Args) => {
    state.value = {
      ...state.value,
      isRunning: true,
      error: undefined,
    };

    return promiseFn(...args)
      .then((res) => {
        state.value = {
          isRunning: false,
          result: res,
          error: undefined,
        };
      })
      .catch((e) => {
        const prevResult = state.value.result;
        /**
         * Result preservation on error:
         *
         * The result is NOT set to undefined or initialValue when an error occurs.
         * This design choice ensures that if the promise is run multiple times and
         * fails on the nth run, the result from the (n-1)th successful run is preserved.
         *
         * Best practice: Always check error first while using promstates.
         * Rationale: If the promise fails on a subsequent run, the previous successful
         * result remains intact and accessible, while the error signal is updated with
         * the current error.
         *
         * Note: The error signal is always reset to undefined on success. There is no
         * value in preserving the error from the last run when a new success occurs.
         */
        state.value = {
          isRunning: false,
          result: prevResult,
          error: e,
        };
      })
      .finally(ultimately);
  };

  const { isRunning, result, error } = state.props();
  return [runPromise, result, error, isRunning] as const;
};
