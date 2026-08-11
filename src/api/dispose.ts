import { DerivedSignal, Receiver } from "../_core";

export const dispose = <T extends any[]>(
  ...derivedSignalsOrReceivers: {
    [K in keyof T]: DerivedSignal<T[K]> | Receiver;
  }
): void => {
  derivedSignalsOrReceivers.forEach((derSigOrEff) => derSigOrEff.dispose());
};
