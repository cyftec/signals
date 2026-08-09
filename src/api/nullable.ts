import {
  type BaseLiveSignal,
  type MaybeSignal,
  type PlainValue,
} from "../_core";
import {
  type GenericMethods,
  getGenericMethods,
  type Primitive,
} from "../_core/data-specific-methods";

type NullableInputSignal<I> =
  I extends BaseLiveSignal<any> ? "live" : "non-live";

/**
 * Adds generic logical helpers to a nullable primitive input.
 *
 * The wrapper exposes `or`, `is`, and `if` operations while preserving the
 * runtime liveness of the input: live inputs produce derived results, while
 * plain and dead inputs produce dead-signal snapshots.
 *
 * @template I - The concrete plain or signal input type.
 * @param input - A value whose plain type includes at least one primitive member.
 * @returns Generic helper methods specialized to the input's value and liveness.
 *
 * @remarks
 * - The type constraint rejects inputs with no primitive member.
 * - `or` uses JavaScript truthiness, not only nullishness.
 * - Comparisons accept signal-capable operands.
 * - Plain and dead inputs snapshot every operand when a result helper is called.
 *
 * @example
 * ```typescript
 * const count = signal<number | null>(null);
 * const label = nullable(count).if.falsy().then("missing", "present");
 * count.value = 1;
 * console.log(label.value); // "present"
 * ```
 *
 * @see {@link MaybeSignal} - Describes accepted wrapper inputs.
 * @see {@link DeadSignal} - Represents non-live helper results.
 * @see {@link DerivedSignal} - Represents live helper results.
 */
export const nullable = <I extends MaybeSignal<unknown>>(
  input: I &
    (Extract<PlainValue<I>, Primitive> extends never ? never : unknown),
): GenericMethods<NullableInputSignal<I>, PlainValue<I>> =>
  getGenericMethods<NullableInputSignal<I>, PlainValue<I>>(
    input as MaybeSignal<PlainValue<I>>,
  );
