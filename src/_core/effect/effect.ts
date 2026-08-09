import { BaseSignal } from "../signals";
import { EffectHook } from "./hook";

/**
 * Describes a runnable and disposable reactive effect.
 *
 * An effect records stimulus signals read during its initial execution and can
 * also record dependent signals created by that execution. Its methods expose
 * execution, registration, and immediate cleanup behavior.
 *
 * @remarks
 * - `run()` does nothing after disposal.
 * - `dependentSignals` is the live internal set and is cleared by disposal.
 * - Registering signals after disposal throws.
 * - Calling `dispose()` more than once throws.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const watcher: Effect = effect(() => console.log(count.value));
 * console.log(watcher.isDisposed); // false
 * watcher.dispose();
 * ```
 *
 * @see {@link effect} - Creates and initially runs an effect.
 * @see {@link dispose} - Disposes several effects or derived signals.
 */
export type Effect = {
  get isDisposed(): boolean;
  get dependentSignals(): Set<BaseSignal<any>>;
  run(): void;
  registerStimulusSignal(signal: BaseSignal<any>): void;
  registerDependentSignal(signal: BaseSignal<any>): void;
  removeAllSignals(): void;
  dispose(): void;
};

/**
 * Creates an effect and runs its callback immediately.
 *
 * Reads of signal `value` properties during the initial callback execution
 * become permanent stimulus dependencies. Changes to those signals rerun the
 * callback synchronously until the returned effect is disposed.
 *
 * @param signalsCatcherFn - The callback to execute and initially inspect for signal reads.
 * @returns An `Effect` object for manual runs, inspection, registration, and disposal.
 *
 * @remarks
 * - Dependency collection occurs only during the initial execution.
 * - Dependencies skipped by the initial control-flow path are never added later.
 * - Dependencies collected initially are not removed when later runs skip them.
 * - Disposal immediately unsubscribes from every stimulus signal.
 * - Callback errors propagate; the global collection slot is still cleared after an initial error.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const watcher = effect(() => console.log(count.value)); // logs 0 now
 * count.value = 1; // logs 1 synchronously
 * watcher.dispose();
 * ```
 *
 * @see {@link Effect} - Describes the returned controller.
 * @see {@link signal} - Creates mutable stimulus signals.
 * @see {@link dispose} - Disposes multiple effects or derived signals.
 */
export const effect = (signalsCatcherFn: () => void): Effect => {
  let _isDisposed = false;
  const _stimulusSignals = new Set<BaseSignal<any>>();
  const _dependentSignals = new Set<BaseSignal<any>>();

  const signalsCatcherEffect: Effect = {
    get isDisposed(): boolean {
      return _isDisposed;
    },

    get dependentSignals() {
      return _dependentSignals;
    },

    run(): void {
      if (_isDisposed) return;
      signalsCatcherFn();
    },

    registerStimulusSignal(signal: BaseSignal<any>): void {
      if (_isDisposed)
        throw `Register source signal failed. This receiver is already destroyed.`;
      _stimulusSignals.add(signal);
    },

    registerDependentSignal(signal: BaseSignal<any>): void {
      if (_isDisposed)
        throw `Register dependent signal failed. This receiver is already destroyed.`;
      _dependentSignals.add(signal);
    },

    removeAllSignals(): void {
      _stimulusSignals.forEach((signal) => {
        signal.removeEffect(this);
      });
      _stimulusSignals.clear();
      _dependentSignals.clear();
    },

    dispose(): void {
      if (_isDisposed) throw `This receiver is already destroyed.`;
      this.removeAllSignals();
      _isDisposed = true;
    },
  };

  EffectHook.setCurrentEffect(signalsCatcherEffect);
  try {
    signalsCatcherEffect.run();
  } finally {
    EffectHook.setCurrentEffect(null);
  }

  return signalsCatcherEffect;
};
