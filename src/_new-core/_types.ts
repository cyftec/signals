export type SignalConnector = {
  readonly installReceiver: (effect: {
    readonly id: number;
    readonly run: () => void;
  }) => void;
  readonly connectWithNewReceiver: (signal: SourceSignal<unknown>) => void;
  readonly processSignal: (signal: SourceSignal<unknown>) => void;
};

export type Receiver = {
  readonly id: number;
  readonly run: () => void;
};

export type SourceSignal<T> = {
  readonly id: number;
  readonly prevValue: T | undefined;
  value: T;
  readonly mutateWith: (mutatedSignalEvaluator: (old: T) => T) => void;
};

export type DerivedSignal<T> = {
  readonly prevValue: T | undefined;
  readonly value: T;
};

export type Signal<T> = SourceSignal<T> | DerivedSignal<T>;
