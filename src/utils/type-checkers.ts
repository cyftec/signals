import type { MaybeSignal } from "../_core";
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
 * - Derived signals, nullish values, and ordinary values return `false`.
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
 * @see {@link valueIsDerivedSignal} - Checks the derived-signal discriminator.
 * @see {@link valueIsSignal} - Checks either live discriminator.
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
 * - Source signals, nullish values, and ordinary values return `false`.
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
 * @see {@link valueIsSignal} - Checks either live discriminator.
 */
export const valueIsDerivedSignal = (input: MaybeSignal<any>): boolean =>
  !!(input?.type === "derived-signal");

/**
 * Checks whether a value carries either live-signal discriminator.
 *
 * Source and derived discriminator strings are accepted; all other values are rejected.
 *
 * @param input - The value to inspect.
 * @returns `true` for a structurally recognized source or derived signal.
 *
 * @remarks
 * - The check is structural and does not validate other signal members.
 * - The check does not read `value` and therefore does not collect dependencies.
 *
 * @example
 * ```typescript
 * valueIsSignal(signal(1)); // true
 * ```
 *
 * @see {@link Signal} - The corresponding union type.
 * @see {@link valueIsSourceSignal} - Checks only the writable discriminator.
 * @see {@link valueIsDerivedSignal} - Checks only the derived discriminator.
 */
export const valueIsSignal = (input: MaybeSignal<any>): boolean =>
  ["source-signal", "derived-signal"].includes(input?.type);

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
 * - Source-signal inputs can be collected as effect dependencies when read.
 * - The implementation unwraps separately for each half of the boolean expression.
 *
 * @example
 * ```typescript
 * valueIsMaybeSignalValueOfStringOrArray(signal("text")); // true
 * valueIsMaybeSignalValueOfStringOrArray(1); // false
 * ```
 *
 * @see {@link value} - Performs signal unwrapping.
 * @see {@link MaybeSignal} - Describes common supported inputs.
 * @see {@link valueIsSignal} - Checks signal structure without unwrapping.
 */
export const valueIsMaybeSignalValueOfStringOrArray = (input: any): boolean =>
  typeof value(input) === "string" || Array.isArray(value(input));
