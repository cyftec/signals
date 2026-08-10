import { BaseSourceSignal, type Signal } from "../_types";
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
 * @param Signal - The mutable base signal whose boolean value is updated
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
  Signal: BaseSourceSignal<boolean>,
): BooleanMutatingMethods => ({
  toggle: () => Signal.mutateWith((oldValue) => !oldValue),
});

/**
 * Creates combined methods for boolean source signals.
 *
 * Wraps the boolean mutators in the `.mutate` namespace attached to a source
 * signal.
 *
 * @param Signal - The base boolean signal to access values from
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
  Signal: Signal<boolean>,
): BooleanMutatingAndNonMutatingMethods => ({
  mutate: { ...getBooleanMutatingMethods(Signal as BaseSourceSignal<boolean>) },
});
