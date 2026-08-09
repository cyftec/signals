import { Effect } from "./effect";

const _effectHookFactory = () => {
  let _currentSignalsCatcherEffect: Effect | null = null;

  return {
    getCurrentEffect(): Effect | null {
      return _currentSignalsCatcherEffect;
    },
    setCurrentEffect(effect: Effect | null): void {
      _currentSignalsCatcherEffect = effect;
    },
  };
};

/**
 * Exposes the current-effect slot used during dependency collection.
 *
 * Signal getters consult this singleton to associate a signal with the effect
 * being created. The slot is set only around an effect's initial execution.
 *
 * @remarks
 * - This is a single global slot rather than a stack.
 * - `getCurrentEffect()` returns the current effect or `null`.
 * - `setCurrentEffect()` replaces the current slot value.
 * - Direct use can alter dependency collection for all signals in this module instance.
 *
 * @example
 * ```typescript
 * const current = EffectHook.getCurrentEffect();
 * EffectHook.setCurrentEffect(current);
 * ```
 *
 * @see {@link effect} - Sets and clears this hook while creating an effect.
 * @see {@link Effect} - The value stored by the hook.
 */
export const EffectHook = _effectHookFactory();
