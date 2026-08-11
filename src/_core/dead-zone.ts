import { ConnectionsManager } from "./connections-manager";

/**
 * Evaluates a callback without collecting source-signal reads for the currently installing effect.
 *
 * The callback runs synchronously with dependency collection suspended, while
 * preserving its return value and error behavior.
 *
 * @template T - The callback result type.
 * @param callbackWithSignals - The callback that may read source or derived signals.
 * @returns The callback result.
 *
 * @remarks
 * - The zone affects only dependency collection during an effect's immediate run.
 * - Reads inside the callback are evaluated normally but do not become dependencies.
 * - Nested zones are supported, and the prior collection context is restored if the callback throws.
 *
 * @example
 * ```typescript
 * const tracked = signal(1);
 * const sampled = signal(2);
 *
 * effect(() => {
 *   console.log(tracked.value);
 *   console.log(deadZone(() => sampled.value));
 * });
 *
 * sampled.value = 3; // does not rerun the effect
 * ```
 *
 * @see {@link effect} - Installs the dependency-collection context.
 * @see {@link BaseSourceSignal.nonReactiveValue} - Reads one signal without collecting it.
 */
export const deadZone = <T>(callbackWithSignals: () => T): T => {
  return ConnectionsManager.ignoreSignalsRegistration(callbackWithSignals);
};
