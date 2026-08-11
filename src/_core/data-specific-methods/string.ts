import { getPlainMethodParams, value } from "../../utils";
import {
  type Signal,
  type BaseSourceSignal,
  MaybeSignalValues,
} from "../_types";
import { derive } from "../derived-signal";
import {
  StringCustomNonMutatingMethods,
  StringIntrinsicNonMutatingMethods,
  StringMutatingAndNonMutatingMethods,
  StringMutatingMethods,
  StringNonMutatingMethods,
  StringReplaceParameters,
  StringSplitParameters,
} from "./types";

const _deepTrim = (value: string) => value.trim().replace(/\s+/g, " ");

/**
 * Creates mutating methods for string source signals.
 *
 * Wraps string-producing operations so each call replaces the source signal's
 * value through `mutateWith()`.
 *
 * @param baseStringSignal - The mutable base signal whose string value is updated
 * @returns Mutating string methods for use under a source signal's `.mutate` namespace
 *
 * @remarks
 * - Includes concatenation, padding, repetition, replacement, slicing, trimming, and case conversion
 * - `deepTrim()` trims the ends and collapses internal whitespace runs
 * - Each method returns `void` and publishes one source-signal update
 *
 * @example
 * ```typescript
 * const text = signal("  hello   world  ");
 * const methods = getStringSignalMutatingMethods(text);
 * methods.deepTrim();
 * console.log(text.value); // "hello world"
 * ```
 *
 * @see {@link StringMutatingMethods} - The returned method contract
 * @see {@link getStringSignalMethods} - For the complete source-signal method bundle
 */
export const getStringSignalMutatingMethods = (
  baseStringSignal: BaseSourceSignal<string>,
): StringMutatingMethods => {
  return {
    concat: function (
      ...args: MaybeSignalValues<Parameters<String["concat"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.concat(...getPlainMethodParams(...args)),
      );
    },
    deepTrim: function (): void {
      baseStringSignal.mutateWith((oldValue) => _deepTrim(oldValue));
    },
    padEnd: function (
      ...args: MaybeSignalValues<Parameters<String["padEnd"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.padEnd(...getPlainMethodParams(...args)),
      );
    },
    padStart: function (
      ...args: MaybeSignalValues<Parameters<String["padStart"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.padStart(...getPlainMethodParams(...args)),
      );
    },
    repeat: function (
      ...args: MaybeSignalValues<Parameters<String["repeat"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.repeat(...getPlainMethodParams(...args)),
      );
    },
    replace: function (
      ...args: MaybeSignalValues<StringReplaceParameters>
    ): void {
      baseStringSignal.mutateWith((oldValue) => {
        const [searchValue, replaceValue] = getPlainMethodParams(...args);
        return oldValue.replace(searchValue as any, replaceValue as any);
      });
    },
    replaceAll: function (
      ...args: MaybeSignalValues<StringReplaceParameters>
    ): void {
      baseStringSignal.mutateWith((oldValue) => {
        const [searchValue, replaceValue] = getPlainMethodParams(...args);
        return oldValue.replaceAll(searchValue as any, replaceValue as any);
      });
    },
    slice: function (
      ...args: MaybeSignalValues<Parameters<String["slice"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.slice(...getPlainMethodParams(...args)),
      );
    },
    substring: function (
      ...args: MaybeSignalValues<Parameters<String["substring"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.substring(...getPlainMethodParams(...args)),
      );
    },
    trim: function (
      ...args: MaybeSignalValues<Parameters<String["trim"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.trim(...getPlainMethodParams(...args)),
      );
    },
    trimEnd: function (
      ...args: MaybeSignalValues<Parameters<String["trimEnd"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.trimEnd(...getPlainMethodParams(...args)),
      );
    },
    trimStart: function (
      ...args: MaybeSignalValues<Parameters<String["trimStart"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.trimStart(...getPlainMethodParams(...args)),
      );
    },
    toLocaleLowerCase: function (
      ...args: MaybeSignalValues<Parameters<String["toLocaleLowerCase"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.toLocaleLowerCase(...getPlainMethodParams(...args)),
      );
    },
    toLocaleUpperCase: function (
      ...args: MaybeSignalValues<Parameters<String["toLocaleUpperCase"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.toLocaleUpperCase(...getPlainMethodParams(...args)),
      );
    },
    toLowerCase: function (
      ...args: MaybeSignalValues<Parameters<String["toLowerCase"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.toLowerCase(...getPlainMethodParams(...args)),
      );
    },
    toUpperCase: function (
      ...args: MaybeSignalValues<Parameters<String["toUpperCase"]>>
    ): void {
      baseStringSignal.mutateWith((oldValue) =>
        oldValue.toUpperCase(...getPlainMethodParams(...args)),
      );
    },
  };
};

/**
 * Creates intrinsic non-mutating methods for string signals.
 *
 * Adapts standard read-only string operations so their results follow the
 * derived result type of the input signal.
 *
 * @param baseStringSignal - The base string signal to access values from
 * @returns Intrinsic non-mutating methods for string signals
 *
 * @remarks
 * - Includes character lookup, search, concatenation, padding, replacement, splitting, trimming, and case conversion
 * - Method parameters may themselves be signals
 * - All inputs produce `DerivedSignal` results; inputs produce `DerivedSignal` results
 *
 * @example
 * ```typescript
 * const text = signal("hello");
 * const methods = getStringIntrinsicNonMutatingMethods(text);
 * console.log(methods.toUpperCase().value); // "HELLO"
 * ```
 *
 * @see {@link StringIntrinsicNonMutatingMethods} - The returned method contract
 * @see {@link getStringCustomNonMutatingMethods} - For `deepTrim()`
 */
export const getStringIntrinsicNonMutatingMethods = (
  baseStringSignal: Signal<string>,
): StringIntrinsicNonMutatingMethods => {
  return {
    at: (...args: MaybeSignalValues<Parameters<String["at"]>>) =>
      derive(() => baseStringSignal.value.at(...getPlainMethodParams(...args))),
    charAt: (...args: MaybeSignalValues<Parameters<String["charAt"]>>) =>
      derive(() =>
        baseStringSignal.value.charAt(...getPlainMethodParams(...args)),
      ),
    charCodeAt: (
      ...args: MaybeSignalValues<Parameters<String["charCodeAt"]>>
    ) =>
      derive(() =>
        baseStringSignal.value.charCodeAt(...getPlainMethodParams(...args)),
      ),
    codePointAt: (
      ...args: MaybeSignalValues<Parameters<String["codePointAt"]>>
    ) =>
      derive(() =>
        baseStringSignal.value.codePointAt(...getPlainMethodParams(...args)),
      ),
    concat: (...args: MaybeSignalValues<Parameters<String["concat"]>>) =>
      derive(() =>
        baseStringSignal.value.concat(...getPlainMethodParams(...args)),
      ) as any,
    endsWith: (...args: MaybeSignalValues<Parameters<String["endsWith"]>>) =>
      derive(() =>
        baseStringSignal.value.endsWith(...getPlainMethodParams(...args)),
      ),
    includes: (...args: MaybeSignalValues<Parameters<String["includes"]>>) =>
      derive(() =>
        baseStringSignal.value.includes(...getPlainMethodParams(...args)),
      ),
    indexOf: (...args: MaybeSignalValues<Parameters<String["indexOf"]>>) =>
      derive(() =>
        baseStringSignal.value.indexOf(...getPlainMethodParams(...args)),
      ),
    lastIndexOf: (
      ...args: MaybeSignalValues<Parameters<String["lastIndexOf"]>>
    ) =>
      derive(() =>
        baseStringSignal.value.lastIndexOf(...getPlainMethodParams(...args)),
      ),
    padEnd: (...args: MaybeSignalValues<Parameters<String["padEnd"]>>) =>
      derive(() =>
        baseStringSignal.value.padEnd(...getPlainMethodParams(...args)),
      ),
    padStart: (...args: MaybeSignalValues<Parameters<String["padStart"]>>) =>
      derive(() =>
        baseStringSignal.value.padStart(...getPlainMethodParams(...args)),
      ),
    repeat: (...args: MaybeSignalValues<Parameters<String["repeat"]>>) =>
      derive(() =>
        baseStringSignal.value.repeat(...getPlainMethodParams(...args)),
      ) as any,
    slice: (...args: MaybeSignalValues<Parameters<String["slice"]>>) =>
      derive(() =>
        baseStringSignal.value.slice(...getPlainMethodParams(...args)),
      ),
    startsWith: (
      ...args: MaybeSignalValues<Parameters<String["startsWith"]>>
    ) =>
      derive(() =>
        baseStringSignal.value.startsWith(...getPlainMethodParams(...args)),
      ),
    substring: (...args: MaybeSignalValues<Parameters<String["substring"]>>) =>
      derive(() =>
        baseStringSignal.value.substring(...getPlainMethodParams(...args)),
      ),
    trim: (...args: MaybeSignalValues<Parameters<String["trim"]>>) =>
      derive(() =>
        baseStringSignal.value.trim(...getPlainMethodParams(...args)),
      ),
    trimEnd: (...args: MaybeSignalValues<Parameters<String["trimEnd"]>>) =>
      derive(() =>
        baseStringSignal.value.trimEnd(...getPlainMethodParams(...args)),
      ),
    trimStart: (...args: MaybeSignalValues<Parameters<String["trimStart"]>>) =>
      derive(() =>
        baseStringSignal.value.trimStart(...getPlainMethodParams(...args)),
      ),
    length: () => derive(() => baseStringSignal.value.length),
    localeCompare: (
      ...args: MaybeSignalValues<Parameters<String["localeCompare"]>>
    ) =>
      derive(() =>
        baseStringSignal.value.localeCompare(...getPlainMethodParams(...args)),
      ),
    normalize: (...args: MaybeSignalValues<Parameters<String["normalize"]>>) =>
      derive(() =>
        baseStringSignal.value.normalize(
          value(...getPlainMethodParams(...args)),
        ),
      ),
    replace: (...args: MaybeSignalValues<StringReplaceParameters>) =>
      derive(() => {
        const [searchValue, replaceValue] = getPlainMethodParams(...args);
        return baseStringSignal.value.replace(
          searchValue as any,
          replaceValue as any,
        );
      }),
    replaceAll: (...args: MaybeSignalValues<StringReplaceParameters>) =>
      derive(() => {
        const [searchValue, replaceValue] = getPlainMethodParams(...args);
        return baseStringSignal.value.replaceAll(
          searchValue as any,
          replaceValue as any,
        );
      }),
    search: (...args: MaybeSignalValues<Parameters<String["search"]>>) =>
      derive(() =>
        baseStringSignal.value.search(...getPlainMethodParams(...args)),
      ),
    split: (...args: MaybeSignalValues<StringSplitParameters>) =>
      derive(() => {
        const [separator, limit] = getPlainMethodParams(...args);
        return baseStringSignal.value.split(separator as any, limit);
      }),
    toLocaleLowerCase: (
      ...args: MaybeSignalValues<Parameters<String["toLocaleLowerCase"]>>
    ) =>
      derive(() =>
        baseStringSignal.value.toLocaleLowerCase(
          ...getPlainMethodParams(...args),
        ),
      ),
    toLocaleUpperCase: (
      ...args: MaybeSignalValues<Parameters<String["toLocaleUpperCase"]>>
    ) =>
      derive(() =>
        baseStringSignal.value.toLocaleUpperCase(
          ...getPlainMethodParams(...args),
        ),
      ),
    toLowerCase: (
      ...args: MaybeSignalValues<Parameters<String["toLowerCase"]>>
    ) => {
      return derive(() =>
        baseStringSignal.value.toLowerCase(...getPlainMethodParams(...args)),
      );
    },
    toUpperCase: (
      ...args: MaybeSignalValues<Parameters<String["toUpperCase"]>>
    ) => {
      return derive(() =>
        baseStringSignal.value.toUpperCase(...getPlainMethodParams(...args)),
      );
    },
  };
};

/**
 * Creates custom non-mutating methods for string signals.
 *
 * Provides the library-specific `deepTrim()` projection while preserving the
 * derived result type of the input signal.
 *
 * @param baseStringSignal - The base string signal to access values from
 * @returns Custom non-mutating methods for string signals
 *
 * @remarks
 * - `deepTrim()` trims leading and trailing whitespace
 * - Internal whitespace runs are collapsed to a single space
 * - All inputs produce a `DerivedSignal`; inputs produce a `DerivedSignal`
 *
 * @example
 * ```typescript
 * const text = signal("  hello   world  ");
 * const methods = getStringCustomNonMutatingMethods(text);
 * console.log(methods.deepTrim().value); // "hello world"
 * ```
 *
 * @see {@link StringCustomNonMutatingMethods} - The returned method contract
 * @see {@link getStringIntrinsicNonMutatingMethods} - For standard string projections
 */
export const getStringCustomNonMutatingMethods = (
  baseStringSignal: Signal<string>,
): StringCustomNonMutatingMethods => {
  return {
    deepTrim: () => {
      return derive(() => _deepTrim(baseStringSignal.value));
    },
  };
};

/**
 * Creates combined non-mutating methods for string signals.
 *
 * Combines the intrinsic string projections with the custom `deepTrim()`
 * projection used by string signals.
 *
 * @param baseStringSignal - The base string signal to access values from
 * @returns Combined non-mutating methods for string signals
 *
 * @remarks
 * - The returned object contains only string-specific non-mutating methods
 * - Generic logical methods are attached separately during signal construction
 * - All inputs produce `DerivedSignal` results; inputs produce `DerivedSignal` results
 *
 * @example
 * ```typescript
 * const text = signal("  hello  ");
 * const methods = getStringSignalNonMutatingMethods(text);
 * console.log(methods.deepTrim().value); // "hello"
 * ```
 *
 * @see {@link StringNonMutatingMethods} - The returned method contract
 * @see {@link getStringSignalMethods} - For the source-signal method bundle
 */
export const getStringSignalNonMutatingMethods = (
  baseStringSignal: Signal<string>,
): StringNonMutatingMethods => ({
  ...getStringIntrinsicNonMutatingMethods(baseStringSignal),
  ...getStringCustomNonMutatingMethods(baseStringSignal),
});

/**
 * Creates combined methods for a string source signal.
 *
 * Places string mutation methods under `.mutate` and exposes non-mutating
 * string projections as direct methods on the returned object.
 *
 * @param baseStringSignal - The mutable base signal whose string value is used
 * @returns Combined mutating and non-mutating string methods
 *
 * @remarks
 * - Mutation methods are available only under `.mutate`
 * - Non-mutating projection methods are direct members
 * - Every projection returns an eagerly maintained `DerivedSignal`.
 *
 * @example
 * ```typescript
 * const text = signal("hello");
 * const methods = getStringSignalMethods(text);
 * methods.mutate.toUpperCase();
 * console.log(methods.length().value); // 5
 * ```
 *
 * @see {@link StringMutatingAndNonMutatingMethods} - The returned method contract
 * @see {@link getStringSignalMutatingMethods} - For the nested mutation methods
 */
export const getStringSignalMethods = (
  baseStringSignal: Signal<string>,
): StringMutatingAndNonMutatingMethods => ({
  mutate: {
    ...getStringSignalMutatingMethods(
      baseStringSignal as BaseSourceSignal<string>,
    ),
  },
  ...getStringSignalNonMutatingMethods(baseStringSignal),
});
