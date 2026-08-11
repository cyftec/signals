import { Receiver } from "./_types";
import { SourceSignal } from "./source-signal";

/**
 * Defines the internal registry used to connect source-signal reads to effects.
 *
 * Source-signal getters register the effect currently being installed, and
 * source-signal writes synchronously invoke each registered receiver.
 *
 * @remarks
 * - This is exported for the core implementation; applications normally use effect() instead.
 * - Dependency registration occurs only while an effect is first installed.
 *
 * @example
 * ```typescript
 * declare const receptionManager: ConnectionsManager;
 * receptionManager.notifySignalUpdate(signal(1));
 * ```
 *
 * @see {@link Receiver} - The callback registered for source-signal changes.
 * @see {@link effect} - The public API that installs a receiver.
 */
export type ConnectionsManager = {
  readonly addReceiver: (receiver: Receiver) => void;
  readonly removeReceiver: (receiver: Receiver) => void;
  readonly ignoreSignalsRegistration: <T>(callbackWithSignals: () => T) => T;
  readonly notifySignalRegistration: (signal: SourceSignal<unknown>) => void;
  readonly notifySignalUpdate: (signal: SourceSignal<unknown>) => void;
};

/**
 * Coordinates initial effect dependency collection and synchronous source writes.
 *
 * The connector records source signals read while installing a receiver, then
 * invokes each recorded receiver when that source signal changes.
 *
 * @remarks
 * - Dependencies are captured only during addReceiver().
 * - Repeated reads of one signal by a receiver register one receiver identifier.
 * - Receivers run synchronously in insertion order for each source signal.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * effect(() => count.value);
 * count.value = 1;
 * ```
 *
 * @see {@link effect} - Adds receivers through this manager.
 * @see {@link SourceSignal} - The signal shape that triggers receivers.
 */
export const ConnectionsManager = ((): ConnectionsManager => {
  let _newReceiver: Receiver | null = null;
  const _connectionsMap = new Map<SourceSignal<unknown>, Set<Receiver>>();

  const ConnectionsManager: ConnectionsManager = {
    addReceiver(receiver: Receiver) {
      _newReceiver = receiver;
      try {
        receiver.run();
      } catch (error) {
        ConnectionsManager.removeReceiver(receiver);
        throw error;
      } finally {
        _newReceiver = null;
      }
    },

    removeReceiver(receiver: Receiver) {
      _connectionsMap.forEach((receiversSet, signal) => {
        receiversSet.delete(receiver);
        if (receiversSet.size === 0) {
          _connectionsMap.delete(signal);
        }
      });
    },

    ignoreSignalsRegistration<T>(callbackWithSignals: () => T): T {
      const preservedReceiver = _newReceiver;
      _newReceiver = null;
      try {
        return callbackWithSignals();
      } finally {
        _newReceiver = preservedReceiver;
      }
    },

    notifySignalRegistration(signal: SourceSignal<unknown>) {
      if (_newReceiver) {
        if (_connectionsMap.has(signal)) {
          _connectionsMap.get(signal)!.add(_newReceiver);
        } else {
          const newReceiversSet: Set<Receiver> = new Set([_newReceiver]);
          _connectionsMap.set(signal, newReceiversSet);
        }
      }
    },

    notifySignalUpdate(signal: SourceSignal<unknown>) {
      const mappedReceivers = _connectionsMap.get(signal);
      mappedReceivers?.forEach((receiver) => {
        receiver.run();
      });
    },
  };

  return ConnectionsManager;
})();
