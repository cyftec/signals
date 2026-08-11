import { DerivedSignal, Receiver } from "../_core";

/**
 * Disposes several effect receivers and derived signals in one call.
 *
 * @template T - The value types carried by the supplied derived signals.
 * @param derivedSignalsOrReceivers - Disposable effects or derived signals.
 * @returns Nothing.
 *
 * @remarks
 * - Each argument receives its own `dispose()` call in argument order.
 * - The helper inherits the idempotent disposal behavior of its arguments.
 * - Disposing a derived signal stops its internal recomputation effect.
 *
 * @example
 * ```typescript
 * const source = signal(1);
 * const doubled = derive(() => source.value * 2);
 * const logger = effect(() => console.log(doubled.value));
 * dispose(doubled, logger);
 * ```
 *
 * @see {@link DerivedSignal.dispose} - Stops a derived signal's updates.
 * @see {@link Receiver.dispose} - Stops an effect receiver's updates.
 */
export const dispose = <T extends any[]>(
  ...derivedSignalsOrReceivers: {
    [K in keyof T]: DerivedSignal<T[K]> | Receiver;
  }
): void => {
  derivedSignalsOrReceivers.forEach((derSigOrEff) => derSigOrEff.dispose());
};
