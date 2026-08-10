import { getPlainMethodParams, value } from "../../utils";
import { type Signal, MaybeSignal, MaybeSignalValues } from "../_types";
import { derive } from "../derived-signal";
import {
  NumberCustomNonMutatingMethods,
  NumberIntrinsicNonMutatingMethods,
  NumberNonMutatingMethods,
} from "./types";

/**
 * Creates intrinsic non-mutating methods for number signals.
 *
 * Adapts the standard number formatting methods so their results follow the
 * derived result type of the input signal.
 *
 * @param baseNumberSignal - The base number signal to access values from
 * @returns Intrinsic non-mutating methods for number signals
 *
 * @remarks
 * - Includes `toExponential()`, `toFixed()`, `toPrecision()`, and `toLocaleString()`
 * - Method parameters may themselves be signals
 * - All inputs produce `DerivedSignal` results; inputs produce `DerivedSignal` results
 *
 * @example
 * ```typescript
 * const amount = signal(12.5);
 * const methods = getNumberIntrinsicNonMutatingMethods(amount);
 * console.log(methods.toFixed(2).value); // "12.50"
 * ```
 *
 * @see {@link NumberIntrinsicNonMutatingMethods} - The returned method contract
 * @see {@link getNumberCustomNonMutatingMethods} - For numeric confinement
 */
export const getNumberIntrinsicNonMutatingMethods = (
  baseNumberSignal: Signal<number>,
): NumberIntrinsicNonMutatingMethods => {
  return {
    toExponential: (
      ...args: MaybeSignalValues<Parameters<number["toExponential"]>>
    ) =>
      derive(() =>
        baseNumberSignal.value.toExponential(...getPlainMethodParams(...args)),
      ),
    toFixed: (...args: MaybeSignalValues<Parameters<number["toFixed"]>>) =>
      derive(() =>
        baseNumberSignal.value.toFixed(...getPlainMethodParams(...args)),
      ),
    toPrecision: (
      ...args: MaybeSignalValues<Parameters<number["toPrecision"]>>
    ) =>
      derive(() =>
        baseNumberSignal.value.toPrecision(...getPlainMethodParams(...args)),
      ),
    toLocaleString: (
      locales?: MaybeSignal<string | string[] | undefined>,
      options?: MaybeSignal<Intl.NumberFormatOptions | undefined>,
    ) =>
      derive(() =>
        baseNumberSignal.value.toLocaleString(value(locales), value(options)),
      ),
  };
};

/**
 * Creates custom non-mutating methods for number signals.
 *
 * Provides the library-specific `toConfined()` projection and preserves the
 * derived result type of the input signal.
 *
 * @param baseNumberSignal - The base number signal to access values from
 * @returns Custom non-mutating methods for number signals
 *
 * @remarks
 * - `toConfined()` clamps the value to the inclusive `[start, end]` range
 * - Both boundaries may be signals and participate in live dependency tracking
 * - All inputs produce a `DerivedSignal`; inputs produce a `DerivedSignal`
 *
 * @example
 * ```typescript
 * const amount = signal(12);
 * const methods = getNumberCustomNonMutatingMethods(amount);
 * console.log(methods.toConfined(0, 10).value); // 10
 * ```
 *
 * @see {@link NumberCustomNonMutatingMethods} - The returned method contract
 * @see {@link getNumberIntrinsicNonMutatingMethods} - For standard number formatting
 */
export const getNumberCustomNonMutatingMethods = (
  baseNumberSignal: Signal<number>,
): NumberCustomNonMutatingMethods => {
  return {
    toConfined: (start: MaybeSignal<number>, end: MaybeSignal<number>) =>
      derive(() => {
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
 * @param baseNumberSignal - The base number signal to access values from
 * @returns Combined non-mutating methods for number signals
 *
 * @remarks
 * - The returned object contains only number-specific non-mutating methods
 * - Generic logical methods are attached separately during signal construction
 * - All inputs produce `DerivedSignal` results; inputs produce `DerivedSignal` results
 *
 * @example
 * ```typescript
 * const amount = signal(12.345);
 * const methods = getNumberSignalMethods(amount);
 * console.log(methods.toFixed(1).value); // "12.3"
 * ```
 *
 * @see {@link NumberNonMutatingMethods} - The returned method contract
 * @see {@link getNumberIntrinsicNonMutatingMethods} - For intrinsic formatting methods
 */
export const getNumberSignalMethods = (
  baseNumberSignal: Signal<number>,
): NumberNonMutatingMethods => ({
  ...getNumberIntrinsicNonMutatingMethods(baseNumberSignal),
  ...getNumberCustomNonMutatingMethods(baseNumberSignal),
});
