import { newVal } from "@cyftec/immut";
import { Connector } from "./connector";
import { IdGenerator } from "./id-generator";
import { BaseSourceSignal, SignalType } from "./_types";
import {
  DataMethodValue,
  GenericMethods,
  getGenericMethods,
  getMutatingAndNonMutatingDataMethods,
  IsExactlyAny,
  MutatingAndNonMutatingMethods,
} from "./data-specific-methods";

type SourceSignalMethods<T> =
  IsExactlyAny<T> extends true
    ? {}
    : T extends unknown
      ? GenericMethods<DataMethodValue<T>> &
          MutatingAndNonMutatingMethods<DataMethodValue<T>>
      : never;

export type SourceSignal<T> = BaseSourceSignal<T> & SourceSignalMethods<T>;

export const signal = <T>(
  initialValue: T,
  nonNullInitialValue?: NonNullable<T>,
): SourceSignal<T> => {
  const _id = IdGenerator.newID;
  let _prevValue: T | undefined = undefined;
  let _value: T = newVal(initialValue);

  const sourceSignal: BaseSourceSignal<T> = {
    get type(): SignalType {
      return "source-signal";
    },

    get id(): number {
      return _id;
    },

    get prevValue(): T | undefined {
      return _prevValue;
    },

    get value(): T {
      Connector.connectWithNewReceiver(
        sourceSignal as BaseSourceSignal<unknown>,
      );
      return newVal(_value);
    },

    set value(newSignalValue: T) {
      if (newSignalValue === _value) {
        console.warn(`Unncessary assignment to sourceSignal with ID - ${_id}`);
        return;
      }

      _prevValue = _value;
      _value = newSignalValue;
      Connector.processSignal(sourceSignal as BaseSourceSignal<unknown>);
    },

    mutateWith(mutatedSignalEvaluator: (oldSignalValue: T) => T) {
      const updatedValue = mutatedSignalEvaluator(_value);
      this.value = updatedValue;
    },
  };

  Object.assign(sourceSignal, getGenericMethods<T>(sourceSignal as any));
  Object.assign(
    sourceSignal,
    getMutatingAndNonMutatingDataMethods<T>(
      sourceSignal as any,
      nonNullInitialValue,
    ),
  );

  return sourceSignal as SourceSignal<T>;
};
