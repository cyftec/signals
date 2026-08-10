import { DerivedSignal } from "./_types";

export const derive = <T>(
  signalCatcherFn: (prevValue: T | undefined) => T,
): DerivedSignal<T> => {
  let _prevValue: T | undefined = undefined;
  let _value: T | undefined = undefined;

  const derivedSignal: DerivedSignal<T> = {
    get prevValue(): T | undefined {
      return _prevValue;
    },

    get value(): T {
      _prevValue = _value;
      _value = signalCatcherFn(_value);
      return _value;
    },
  };

  return derivedSignal;
};
