import { Receiver, SignalConnector, SourceSignal } from "./_types";

export const Connector = ((): SignalConnector => {
  let _newReceiver: Receiver | null = null;
  const _receivers = new Map<number, Receiver>();
  const _connectorMap = new Map<SourceSignal<unknown>, Set<number>>();

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

    connectWithNewReceiver(signal: SourceSignal<unknown>) {
      if (_newReceiver) {
        if (_connectorMap.has(signal)) {
          _connectorMap.get(signal)!.add(_newReceiver!.id);
        } else {
          const newReceiverSet: Set<number> = new Set([_newReceiver!.id]);
          _connectorMap.set(signal, newReceiverSet);
        }
      }
    },

    processSignal(signal: SourceSignal<unknown>) {
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
