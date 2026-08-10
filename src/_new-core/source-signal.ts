import { newVal } from "@cyftec/immut";
import { Connector } from "./connector";
import { IdGenerator } from "./id-generator";
import { SourceSignal } from "./_types";

export const signal = <T>(initialValue: T): SourceSignal<T> => {
  const _id = IdGenerator.newID;
  let _prevValue: T | undefined = undefined;
  let _value: T = newVal(initialValue);

  const sourceSignal: SourceSignal<T> = {
    get id(): number {
      return _id;
    },

    get prevValue(): T | undefined {
      return _prevValue;
    },

    get value(): T {
      Connector.connectWithNewReceiver(sourceSignal as SourceSignal<unknown>);
      return newVal(_value);
    },

    set value(newSignalValue: T) {
      if (newSignalValue === _value) {
        console.warn(`Unncessary assignment to sourceSignal with ID - ${_id}`);
        return;
      }

      _prevValue = _value;
      _value = newSignalValue;
      Connector.processSignal(sourceSignal as SourceSignal<unknown>);
    },

    mutateWith(mutatedSignalEvaluator: (oldSignalValue: T) => T) {
      const updatedValue = mutatedSignalEvaluator(_value);
      this.value = updatedValue;
    },
  };

  return sourceSignal;
};
