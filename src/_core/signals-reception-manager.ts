import { Receiver, SignalsReceptionManager, BaseSourceSignal } from "./_types";

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
 * @see {@link BaseSourceSignal} - The signal shape that triggers receivers.
 */
export const ConnectionsManager = ((): SignalsReceptionManager => {
  let _newReceiver: Receiver | null = null;
  const _receivers = new Map<number, Receiver>();
  const _signalsReceiversMap = new Map<
    BaseSourceSignal<unknown>,
    Set<number>
  >();

  const signalsReceptionManager: SignalsReceptionManager = {
    addReceiver(receiver: Receiver) {
      _newReceiver = receiver;
      try {
        receiver.run();
      } catch (error) {
        signalsReceptionManager.removeReceiver(receiver);
        throw error;
      } finally {
        _newReceiver = null;
      }
      _receivers.set(receiver.id, receiver);
    },

    removeReceiver(receiver: Receiver) {
      _signalsReceiversMap.forEach((receiverIdsSet, signal) => {
        receiverIdsSet.delete(receiver.id);
        if (receiverIdsSet.size === 0) {
          _signalsReceiversMap.delete(signal);
        }
      });
      _receivers.delete(receiver.id);
    },

    ignoreReceiver<T>(callbackWithSignals: () => T): T {
      const preservedReceiver = _newReceiver;
      _newReceiver = null;
      try {
        return callbackWithSignals();
      } finally {
        _newReceiver = preservedReceiver;
      }
    },

    connectWithNewReceiver(signal: BaseSourceSignal<unknown>) {
      if (_newReceiver) {
        if (_signalsReceiversMap.has(signal)) {
          _signalsReceiversMap.get(signal)!.add(_newReceiver!.id);
        } else {
          const newReceiverSet: Set<number> = new Set([_newReceiver!.id]);
          _signalsReceiversMap.set(signal, newReceiverSet);
        }
      }
    },

    runReceivers(signal: BaseSourceSignal<unknown>) {
      const receiverIDs = _signalsReceiversMap.get(signal);
      receiverIDs?.forEach((receiverID) => {
        const receiver = _receivers.get(receiverID);
        if (!receiver)
          throw `WTF! No receiver found for the receiver ID - ${receiverID}?`;

        receiver.run();
      });
    },
  };

  return signalsReceptionManager;
})();
