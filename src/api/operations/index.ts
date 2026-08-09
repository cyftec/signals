import { type MaybeSignal } from "../../_core";
import { value } from "../../utils";
import { genericOp } from "./generic-operation";
import { numberOp } from "./number-operation";
import { stringAndArrayOp } from "./string-and-array-operation";
import type { Operation } from "./types";

/**
 * Selects a lazy operation chain from the input's current runtime value.
 *
 * The input is evaluated once for dispatch: numbers receive arithmetic methods,
 * strings and arrays receive length methods, and every other value receives the
 * generic logical surface.
 *
 * @template T - The input value type used to select the operation return type.
 * @param input - A signal-capable value or zero-argument evaluator.
 * @returns The operation variant selected from the initial evaluated value.
 *
 * @remarks
 * - A function input is invoked once immediately for dispatch and again by terminal evaluation.
 * - The selected operation variant never changes if a live input later changes runtime type.
 * - Chain methods are lazy; terminal getters and `then()` create derived signals.
 * - Runtime dispatch uses `typeof` for numbers and strings and `Array.isArray` for arrays.
 *
 * @example
 * ```typescript
 * const count = signal(5);
 * const total = op(count).add(3).result;
 * const inRange = op(count).isBetween(1, 10).truthy;
 * const label = op(count).isGT(0).then("positive", "other");
 * ```
 *
 * @see {@link Operation} - Maps input types to operation variants.
 * @see {@link numberOp} - Builds numeric chains.
 * @see {@link stringAndArrayOp} - Builds length-aware chains.
 * @see {@link genericOp} - Builds generic logical chains.
 */
export const op = <T>(input: MaybeSignal<T> | (() => T)): Operation<T> => {
  const evaluator: () => T =
    typeof input === "function"
      ? (input as () => T)
      : (): T => value(input as MaybeSignal<T>);
  const val = evaluator();

  return (
    typeof val === "number"
      ? numberOp(input as MaybeSignal<number> | (() => number))
      : typeof val === "string" || Array.isArray(val)
        ? stringAndArrayOp(
            input as
              | MaybeSignal<string | unknown[]>
              | (() => string | unknown[]),
          )
        : genericOp(input)
  ) as Operation<T>;
};
