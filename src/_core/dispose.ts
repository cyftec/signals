import type { Effect } from "./effect";
import type { Signal } from "./signals";

/**
 * Disposes derived signals and effects in argument order.
 *
 * The function invokes `dispose()` synchronously on every supplied value. An
 * empty argument list is a valid no-op.
 *
 * @template T - The tuple of value types carried by supplied derived signals.
 * @param derivedSignalsOrEffects - Derived signals and effects to dispose.
 * @returns Nothing.
 *
 * @remarks
 * - Effect and derived-signal cleanup is immediate.
 * - Effects are not idempotent: disposing the same effect twice throws.
 * - If one argument throws during disposal, later arguments are not processed.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const doubled = derive(() => count.value * 2);
 * const watcher = effect(() => console.log(count.value));
 * dispose(doubled, watcher);
 * ```
 *
 * @see {@link effect} - Creates disposable effects.
 * @see {@link derive} - Creates disposable derived signals.
 */
export const dispose = <T extends any[]>(
  ...derivedSignalsOrEffects: { [K in keyof T]: Signal<T[K]> | Effect }
): void => {
  derivedSignalsOrEffects.forEach((derSigOrEff) => derSigOrEff.dispose());
};
