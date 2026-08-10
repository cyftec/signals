import { Connector } from "./connector";
import { IdGenerator } from "./id-generator";
import { Receiver } from "./_types";

export const effect = (signalsCatcher: () => void) => {
  const _id = IdGenerator.newID;

  const receiver: Receiver = {
    get id(): number {
      return _id;
    },

    run(): void {
      signalsCatcher();
    },
  } as const;

  Connector.installReceiver(receiver);

  return receiver;
};
