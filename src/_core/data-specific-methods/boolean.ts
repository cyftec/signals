import { type BaseSignal } from "../signals";
import {
  BooleanMutatingMethods,
  BooleanMutatingAndNonMutatingMethods,
} from "./types";

/**
 * Creates mutating methods for boolean signals.
 *
 * Returns the boolean mutation surface used to flip a mutable base signal
 * without exposing its lower-level `mutateWith()` implementation.
 *
 * @param baseSignal - The mutable base signal whose boolean value is updated
 * @returns Mutating methods for boolean signals
 *
 * @remarks
 * - `toggle()` flips the boolean value
 * - The update is published through the base signal and notifies its effects synchronously
 * - Source signals expose this method under `.mutate.toggle()`
 *
 * @example
 * ```typescript
 * const enabled = signal(true);
 * const methods = getBooleanMutatingMethods(enabled);
 * methods.toggle();
 * console.log(enabled.value); // false
 * ```
 *
 * @see {@link BooleanMutatingMethods} - The returned method contract
 * @see {@link getBooleanSignalMethods} - For the source-signal method bundle
 */
export const getBooleanMutatingMethods = (
  baseSignal: BaseSignal<boolean>,
): BooleanMutatingMethods => ({
  toggle: () => baseSignal.mutateWith((oldValue) => !oldValue),
});

/**
 * Creates combined methods for boolean source signals.
 *
 * Wraps the boolean mutators in the `.mutate` namespace attached to a source
 * signal.
 *
 * @param baseSignal - The base boolean signal to access values from
 * @returns Combined methods for boolean source signals
 *
 * @remarks
 * - The only boolean-specific method is `.mutate.toggle()`
 * - Toggling publishes one synchronous source-signal update
 * - Generic logical methods are attached separately by signal construction
 *
 * @example
 * ```typescript
 * const enabled = signal(true);
 * const methods = getBooleanSignalMethods(enabled);
 * methods.mutate.toggle();
 * console.log(enabled.value); // false
 * ```
 *
 * @see {@link BooleanMutatingAndNonMutatingMethods} - The returned method contract
 * @see {@link getBooleanMutatingMethods} - For the unwrapped mutator object
 */
export const getBooleanSignalMethods = (
  baseSignal: BaseSignal<boolean>,
): BooleanMutatingAndNonMutatingMethods => ({
  mutate: { ...getBooleanMutatingMethods(baseSignal) },
});
