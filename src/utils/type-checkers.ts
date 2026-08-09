import type { MaybeSignal } from "../_core/signals/types";
import { value } from "./value-getter";

/**
 * Checks for the source-signal runtime discriminator.
 *
 * This structural guard tests only whether `input?.type` equals
 * `"source-signal"`; it does not validate the rest of the signal interface.
 *
 * @param input - The value to inspect.
 * @returns `true` for the source discriminator and `false` otherwise.
 *
 * @remarks
 * - Derived signals, dead signals, nullish values, and ordinary values return `false`.
 * - A plain object can satisfy this check by carrying the matching discriminator.
 * - The check does not read `value` and therefore does not collect dependencies.
 *
 * @example
 * ```typescript
 * valueIsSourceSignal(signal(1)); // true
 * valueIsSourceSignal(derive(() => 1)); // false
 * ```
 *
 * @see {@link SourceSignal} - The corresponding structural type.
 * @see {@link valueIsDerivedSignal} - Checks the computed-live discriminator.
 * @see {@link valueIsLiveSignal} - Checks either live discriminator.
 */
export const valueIsSourceSignal = (input: MaybeSignal<any>): boolean =>
  !!(input?.type === "source-signal");

/**
 * Checks for the derived-signal runtime discriminator.
 *
 * This structural guard tests only whether `input?.type` equals
 * `"derived-signal"`; it does not validate computation or disposal members.
 *
 * @param input - The value to inspect.
 * @returns `true` for the derived discriminator and `false` otherwise.
 *
 * @remarks
 * - Source signals, dead signals, nullish values, and ordinary values return `false`.
 * - A plain object can satisfy this check by carrying the matching discriminator.
 * - The check does not read `value` and therefore does not collect dependencies.
 *
 * @example
 * ```typescript
 * valueIsDerivedSignal(derive(() => 1)); // true
 * valueIsDerivedSignal(signal(1)); // false
 * ```
 *
 * @see {@link DerivedSignal} - The corresponding structural type.
 * @see {@link valueIsSourceSignal} - Checks the mutable-live discriminator.
 * @see {@link valueIsLiveSignal} - Checks either live discriminator.
 */
export const valueIsDerivedSignal = (input: MaybeSignal<any>): boolean =>
  !!(input?.type === "derived-signal");

/**
 * Checks whether a value carries either live-signal discriminator.
 *
 * Source and derived discriminator strings are accepted; dead signals and all
 * other values are rejected.
 *
 * @param input - The value to inspect.
 * @returns `true` for a structurally recognized source or derived signal.
 *
 * @remarks
 * - The check is structural and does not validate other signal members.
 * - Dead signals intentionally return `false`.
 * - The check does not read `value` and therefore does not collect dependencies.
 *
 * @example
 * ```typescript
 * valueIsLiveSignal(signal(1)); // true
 * valueIsLiveSignal(deadSignal(1)); // false
 * ```
 *
 * @see {@link LiveSignal} - The corresponding union type.
 * @see {@link valueIsSignal} - Also accepts dead signals.
 * @see {@link valueIsDeadSignal} - Checks the non-live discriminator.
 */
export const valueIsLiveSignal = (input: MaybeSignal<any>): boolean =>
  ["source-signal", "derived-signal"].includes(input?.type);

/**
 * Checks for a dead-signal discriminator and optional value `typeof` filters.
 *
 * A matching discriminator is required first. When a non-empty filter list is
 * supplied, at least one entry must equal `typeof input.value`.
 *
 * @param input - The value to inspect.
 * @param shouldMatchAnyOfTypes - Optional `typeof` strings accepted for the wrapped value.
 * @returns Whether the discriminator and optional type filter match.
 *
 * @remarks
 * - An omitted or empty filter list accepts every dead-signal value type.
 * - Arrays and null use JavaScript's `"object"` `typeof` result.
 * - The check is structural and reads `value` only when a type filter is present.
 * - Nullish and ordinary values return `false`.
 *
 * @example
 * ```typescript
 * const snapshot = deadSignal(42);
 * valueIsDeadSignal(snapshot); // true
 * valueIsDeadSignal(snapshot, ["number"]); // true
 * valueIsDeadSignal(snapshot, ["string"]); // false
 * ```
 *
 * @see {@link DeadSignal} - The corresponding structural type.
 * @see {@link deadSignal} - Creates recognized snapshots.
 * @see {@link valueIsSignal} - Accepts live and dead signals.
 */
export const valueIsDeadSignal = (
  input: any,
  shouldMatchAnyOfTypes?: string[],
): boolean =>
  input?.type === "dead-signal" &&
  (!shouldMatchAnyOfTypes ||
    !shouldMatchAnyOfTypes.length ||
    shouldMatchAnyOfTypes.some((type) => typeof input?.value === type));

/**
 * Checks whether a value carries any supported signal discriminator.
 *
 * The result combines the live-signal and dead-signal structural checks.
 *
 * @param input - The value to inspect.
 * @returns `true` for source, derived, or dead discriminator values.
 *
 * @remarks
 * - Plain and nullish values return `false`.
 * - The check does not validate getters, methods, or signal provenance.
 * - No signal `value` is read when no dead-signal type filter is requested.
 *
 * @example
 * ```typescript
 * valueIsSignal(signal(1)); // true
 * valueIsSignal(deadSignal(1)); // true
 * valueIsSignal(1); // false
 * ```
 *
 * @see {@link Signal} - The corresponding union type.
 * @see {@link valueIsLiveSignal} - Checks source and derived signals.
 * @see {@link valueIsDeadSignal} - Checks dead signals.
 */
export const valueIsSignal = (input: any): boolean =>
  valueIsLiveSignal(input) || valueIsDeadSignal(input);

/**
 * Checks for a dead signal whose wrapped value has string `typeof`.
 *
 * This convenience guard delegates to `valueIsDeadSignal` with a single
 * `"string"` value-type filter.
 *
 * @param input - The value to inspect.
 * @returns `true` only for a structurally recognized dead string signal.
 *
 * @remarks
 * - Plain strings and live string signals return `false`.
 * - The check reads a matching dead signal's `value` for the type comparison.
 * - Runtime recognition remains structural rather than branded.
 *
 * @example
 * ```typescript
 * valueIsDeadSignalString(deadSignal("text")); // true
 * valueIsDeadSignalString("text"); // false
 * ```
 *
 * @see {@link valueIsDeadSignal} - Performs the discriminator and type check.
 * @see {@link DeadSignal} - Represents the accepted signal kind.
 * @see {@link valueIsDeadSignalStringArray} - Checks dead string arrays.
 */
export const valueIsDeadSignalString = (input: any): boolean =>
  valueIsDeadSignal(input, ["string"]);

/**
 * Checks for a dead signal containing only string array elements.
 *
 * The discriminator and `Array.isArray` must match, then every element is
 * validated with `typeof item === "string"`.
 *
 * @param input - The value to inspect.
 * @returns `true` for dead string arrays, including empty arrays.
 *
 * @remarks
 * - Empty arrays pass because `Array.prototype.every` is vacuously true.
 * - Mixed and non-string arrays return `false`.
 * - Plain and live string arrays return `false`.
 *
 * @example
 * ```typescript
 * valueIsDeadSignalStringArray(deadSignal(["a", "b"])); // true
 * valueIsDeadSignalStringArray(deadSignal([])); // true
 * valueIsDeadSignalStringArray(["a"]); // false
 * ```
 *
 * @see {@link valueIsDeadSignal} - Checks general dead signals.
 * @see {@link valueIsDeadSignalString} - Checks a scalar dead string.
 * @see {@link DeadSignal} - Represents the accepted signal kind.
 */
export const valueIsDeadSignalStringArray = (input: any): boolean =>
  input?.type === "dead-signal" &&
  Array.isArray(input?.value) &&
  (input?.value as any[]).every((item) => typeof item === "string");

/**
 * Checks whether an unwrapped input is a string or an array.
 *
 * The helper calls `value()` and accepts either string `typeof` or
 * `Array.isArray` on the resulting plain value.
 *
 * @param input - A plain value or structurally recognized signal to inspect.
 * @returns `true` when the unwrapped value is a string or any array.
 *
 * @remarks
 * - Empty arrays return `true`.
 * - Nullish, numeric, boolean, and object values return `false`.
 * - Live signal inputs are read reactively and can be collected as dependencies.
 * - The implementation unwraps separately for each half of the boolean expression.
 *
 * @example
 * ```typescript
 * valueIsMaybeSignalValueOfStringOrArray(signal("text")); // true
 * valueIsMaybeSignalValueOfStringOrArray(deadSignal([1])); // true
 * valueIsMaybeSignalValueOfStringOrArray(1); // false
 * ```
 *
 * @see {@link value} - Performs signal unwrapping.
 * @see {@link MaybeSignal} - Describes common supported inputs.
 * @see {@link valueIsSignal} - Checks signal structure without unwrapping.
 */
export const valueIsMaybeSignalValueOfStringOrArray = (input: any): boolean =>
  typeof value(input) === "string" || Array.isArray(value(input));
