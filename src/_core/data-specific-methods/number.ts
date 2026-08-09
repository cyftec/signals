import { getPlainMethodParams, value, valueIsLiveSignal } from "../../utils";
import {
  type BaseSignal,
  deadSignal,
  derive,
  MaybeSignal,
  MaybeSignalValues,
} from "../signals";
import {
  DeriverReturnType,
  InputSignalType,
  NumberCustomNonMutatingMethods,
  NumberIntrinsicNonMutatingMethods,
  NumberNonMutatingMethods,
} from "./types";

const getNumberMethodDeriver = <InputSignal extends InputSignalType>(
  baseNumberSignal: BaseSignal<number>,
) => {
  const inputIsLiveSignal = valueIsLiveSignal(baseNumberSignal as any);

  return <T>(deriver: () => T): DeriverReturnType<InputSignal, T> =>
    (inputIsLiveSignal
      ? derive(deriver)
      : deadSignal(deriver())) as DeriverReturnType<InputSignal, T>;
};

/**
 * Creates intrinsic non-mutating methods for number signals.
 *
 * Adapts the standard number formatting methods so their results follow the
 * liveness category of the input signal.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 * @param baseNumberSignal - The base number signal to access values from
 * @returns Intrinsic non-mutating methods for number signals
 *
 * @remarks
 * - Includes `toExponential()`, `toFixed()`, `toPrecision()`, and `toLocaleString()`
 * - Method parameters may themselves be signals
 * - Live inputs produce `DerivedSignal` results; dead inputs produce snapshot `DeadSignal` results
 *
 * @example
 * ```typescript
 * const amount = signal(12.5);
 * const methods = getNumberIntrinsicNonMutatingMethods<"live">(amount);
 * console.log(methods.toFixed(2).value); // "12.50"
 * ```
 *
 * @see {@link NumberIntrinsicNonMutatingMethods} - The returned method contract
 * @see {@link getNumberCustomNonMutatingMethods} - For numeric confinement
 */
export const getNumberIntrinsicNonMutatingMethods = <
  InputSignal extends InputSignalType,
>(
  baseNumberSignal: BaseSignal<number>,
): NumberIntrinsicNonMutatingMethods<InputSignal> => {
  const deriveFromBase =
    getNumberMethodDeriver<InputSignal>(baseNumberSignal);

  return {
    toExponential: (
      ...args: MaybeSignalValues<Parameters<number["toExponential"]>>
    ) =>
      deriveFromBase(() =>
        baseNumberSignal.value.toExponential(...getPlainMethodParams(...args)),
      ),
    toFixed: (...args: MaybeSignalValues<Parameters<number["toFixed"]>>) =>
      deriveFromBase(() =>
        baseNumberSignal.value.toFixed(...getPlainMethodParams(...args)),
      ),
    toPrecision: (
      ...args: MaybeSignalValues<Parameters<number["toPrecision"]>>
    ) =>
      deriveFromBase(() =>
        baseNumberSignal.value.toPrecision(...getPlainMethodParams(...args)),
      ),
    toLocaleString: (
      locales?: MaybeSignal<string | string[] | undefined>,
      options?: MaybeSignal<Intl.NumberFormatOptions | undefined>,
    ) =>
      deriveFromBase(() =>
        baseNumberSignal.value.toLocaleString(value(locales), value(options)),
      ),
  };
};

/**
 * Creates custom non-mutating methods for number signals.
 *
 * Provides the library-specific `toConfined()` projection and preserves the
 * liveness category of the input signal.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 * @param baseNumberSignal - The base number signal to access values from
 * @returns Custom non-mutating methods for number signals
 *
 * @remarks
 * - `toConfined()` clamps the value to the inclusive `[start, end]` range
 * - Both boundaries may be signals and participate in live dependency tracking
 * - Live inputs produce a `DerivedSignal`; dead inputs produce a snapshot `DeadSignal`
 *
 * @example
 * ```typescript
 * const amount = signal(12);
 * const methods = getNumberCustomNonMutatingMethods<"live">(amount);
 * console.log(methods.toConfined(0, 10).value); // 10
 * ```
 *
 * @see {@link NumberCustomNonMutatingMethods} - The returned method contract
 * @see {@link getNumberIntrinsicNonMutatingMethods} - For standard number formatting
 */
export const getNumberCustomNonMutatingMethods = <
  InputSignal extends InputSignalType,
>(
  baseNumberSignal: BaseSignal<number>,
): NumberCustomNonMutatingMethods<InputSignal> => {
  const deriveFromBase =
    getNumberMethodDeriver<InputSignal>(baseNumberSignal);

  return {
    toConfined: (start: MaybeSignal<number>, end: MaybeSignal<number>) =>
      deriveFromBase(() => {
        const startValue = value(start);
        const endValue = value(end);
        return baseNumberSignal.value < startValue
          ? startValue
          : baseNumberSignal.value > endValue
            ? endValue
            : baseNumberSignal.value;
      }),
  };
};

/**
 * Creates combined non-mutating methods for number signals.
 *
 * Combines the intrinsic formatting projections with the custom confinement
 * projection used by number signals.
 *
 * @template InputSignal - Whether results are live derived signals or dead snapshots
 * @param baseNumberSignal - The base number signal to access values from
 * @returns Combined non-mutating methods for number signals
 *
 * @remarks
 * - The returned object contains only number-specific non-mutating methods
 * - Generic logical methods are attached separately during signal construction
 * - Live inputs produce `DerivedSignal` results; dead inputs produce snapshot `DeadSignal` results
 *
 * @example
 * ```typescript
 * const amount = deadSignal(12.345);
 * const methods = getNumberSignalMethods<"non-live">(amount);
 * console.log(methods.toFixed(1).value); // "12.3"
 * ```
 *
 * @see {@link NumberNonMutatingMethods} - The returned method contract
 * @see {@link getNumberIntrinsicNonMutatingMethods} - For intrinsic formatting methods
 */
export const getNumberSignalMethods = <InputSignal extends InputSignalType>(
  baseNumberSignal: BaseSignal<number>,
): NumberNonMutatingMethods<InputSignal> => ({
  ...getNumberIntrinsicNonMutatingMethods<InputSignal>(baseNumberSignal),
  ...getNumberCustomNonMutatingMethods<InputSignal>(baseNumberSignal),
});
