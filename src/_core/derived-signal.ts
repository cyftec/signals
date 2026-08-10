import { BaseDerivedSignal, SignalType } from "./_types";
import {
  DataMethodValue,
  GenericMethods,
  getGenericMethods,
  getNonMutatingDataMethods,
  IsExactlyAny,
  NonMutatingMethods,
} from "./data-specific-methods";

type DerivedSignalMethods<T> =
  IsExactlyAny<T> extends true
    ? {}
    : T extends unknown
      ? GenericMethods<DataMethodValue<T>> &
          NonMutatingMethods<DataMethodValue<T>>
      : never;

export type DerivedSignal<T> = BaseDerivedSignal<T> & DerivedSignalMethods<T>;

export const derive = <T>(
  signalCatcherFn: () => T,
  nonNullInitialValue?: NonNullable<T>,
): DerivedSignal<T> => {
  let derivedSignal: BaseDerivedSignal<T> = {
    get type(): SignalType {
      return "derived-signal";
    },

    get value(): T {
      return signalCatcherFn();
    },
  };

  Object.assign(derivedSignal, getGenericMethods<T>(derivedSignal as any));
  Object.assign(
    derivedSignal,
    getNonMutatingDataMethods<T>(derivedSignal as any, nonNullInitialValue),
  );

  return derivedSignal as DerivedSignal<T>;
};
