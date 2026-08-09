import { newVal } from "@cyftec/immut";
import { Effect, EffectHook } from "../effect";

/**
 * Creates the shared reactive storage used by every signal kind.
 *
 * The returned object stores current and previous values, collects the current
 * effect when `value` is read, synchronously notifies registered effects when
 * `value` changes, and exposes low-level mutation and cleanup operations.
 *
 * @template T - The value stored by the base signal.
 * @param initialValue - The initial value. It is copied with `newVal` before storage.
 * @returns The low-level signal object used to construct source, derived, and dead signals.
 *
 * @remarks
 * - Equality uses JavaScript strict equality against the internally stored value.
 * - Reading `value` participates in dependency collection and returns a copied value.
 * - `nonReactiveValue` and `prevValue` do not collect dependencies and return stored references.
 * - `dispose()` clears current subscribers but does not prevent later subscriptions.
 * - Assigning an unchanged value writes a diagnostic message to `console.log`.
 *
 * @example
 * ```typescript
 * const base = getBaseSignal(1);
 * base.value = 2;
 * console.log(base.value); // 2
 * console.log(base.prevValue); // 1
 * ```
 *
 * @see {@link signal} - Creates the supported mutable signal abstraction.
 * @see {@link Effect} - Describes registered reactive effects.
 */
export const getBaseSignal = <T>(initialValue: T) => {
  let _prevValue: T | undefined = undefined;
  let _value: T = newVal(initialValue);
  const _effects = new Set<Effect>();

  const _catchNewReceiverIfAny = (): void => {
    const newEffect = EffectHook.getCurrentEffect();
    if (newEffect) {
      newEffect.registerStimulusSignal(base);
      _effects.add(newEffect);
    }
  };

  const base = {
    get prevValue(): T | undefined {
      return _prevValue;
    },

    get nonReactiveValue(): T {
      return _value;
    },

    get value(): T {
      _catchNewReceiverIfAny();
      return newVal(_value);
    },

    set value(newValue: T) {
      if (_value === newValue) {
        console.log(`Unnecessary value change - ${newValue}`);
        return;
      }

      _prevValue = _value;
      _value = newValue;
      _effects.forEach((effect) => effect.run());
    },

    mutateWith(mutatedValueEvaluator: (oldValue: T) => T) {
      const updatedValue = mutatedValueEvaluator(_value);
      this.value = updatedValue;
    },

    removeEffect(effect: Effect): void {
      if (!_effects.has(effect))
        throw `Receiver doesn't exist in current signal.`;
      _effects.delete(effect);
    },

    dispose(): void {
      _effects.clear();
    },
  } as const;

  return base;
};
