import { Receiver, SignalConnector, BaseSourceSignal } from "./_types";

/**
 * Coordinates initial effect dependency collection and synchronous source writes.
 *
 * The connector records source signals read while installing a receiver, then
 * invokes each recorded receiver when that source signal changes.
 *
 * @remarks
 * - Dependencies are captured only during installReceiver().
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
 * @see {@link effect} - Installs receivers through this connector.
 * @see {@link BaseSourceSignal} - The signal shape that triggers receivers.
 */
export const Connector = ((): SignalConnector => {
  let _newReceiver: Receiver | null = null;
  const _receivers = new Map<number, Receiver>();
  const _connectorMap = new Map<BaseSourceSignal<unknown>, Set<number>>();

  const signalConnector: SignalConnector = {
    installReceiver(receiver: Receiver) {
      _newReceiver = receiver;
      try {
        receiver.run();
      } finally {
        _newReceiver = null;
      }
      _receivers.set(receiver.id, receiver);
    },

    connectWithNewReceiver(signal: BaseSourceSignal<unknown>) {
      if (_newReceiver) {
        if (_connectorMap.has(signal)) {
          _connectorMap.get(signal)!.add(_newReceiver!.id);
        } else {
          const newReceiverSet: Set<number> = new Set([_newReceiver!.id]);
          _connectorMap.set(signal, newReceiverSet);
        }
      }
    },

    processSignal(signal: BaseSourceSignal<unknown>) {
      const receiverIDs = _connectorMap.get(signal);
      receiverIDs?.forEach((receiverID) => {
        const receiver = _receivers.get(receiverID);
        if (!receiver)
          throw `WTF! No receiver found for the receiver ID - ${receiverID}?`;

        receiver.run();
      });
    },
  };

  return signalConnector;
})();
