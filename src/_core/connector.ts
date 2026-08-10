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
  const _signalsReceiversMap = new Map<
    BaseSourceSignal<unknown>,
    Set<number>
  >();

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

  return signalConnector;
})();
