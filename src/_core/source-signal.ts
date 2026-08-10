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

/**
 * Represents a writable signal with generic and data-specific helpers.
 *
 * A source signal stores its value, exposes the preceding assigned value, and
 * synchronously runs effects that read it while those effects were installed.
 *
 * @template T - The value type stored by the signal.
 *
 * @remarks
 * - Objects and arrays are copied when read through value.
 * - nonReactiveValue reads the stored value without registering an installing effect.
 * - Assigning the identical stored reference warns and does not notify effects.
 * - The available data-specific helpers are selected from the initial value or hint.
 * - A narrower value view is assignable to a matching wider source-signal view.
 *
 * @example
 * ```typescript
 * const count: SourceSignal<number> = signal(1);
 * count.value = 2;
 * console.log(count.prevValue); // 1
 * ```
 *
 * @see {@link signal} - Creates a source signal.
 * @see {@link DerivedSignal} - The read-only computed signal form.
 */
export type SourceSignal<T> = BaseSourceSignal<T> & SourceSignalMethods<T>;

/**
 * Creates a writable source signal.
 *
 * The created signal stores an initial value, supplies generic logical helpers,
 * attaches data-specific helpers for its selected value family, and synchronously
 * publishes changed assignments to installed effects.
 *
 * @template T - The value type to store in the signal.
 * @param initialValue - The initial value stored by the signal.
 * @param nonNullInitialValue - Optional non-null hint used only to select data-specific helpers.
 * @returns A writable source signal carrying the supplied value type.
 *
 * @remarks
 * - The initial value is copied with the configured immutable-value helper.
 * - Object and array assignments are exposed as copies when later read.
 * - nonReactiveValue returns the stored value directly and does not collect an effect dependency.
 * - Assigning the same stored reference leaves prevValue unchanged and warns.
 *
 * @example
 * ```typescript
 * const count = signal(1);
 * count.value = 2;
 * console.log(count.value); // 2
 * ```
 *
 * @see {@link SourceSignal} - The returned signal contract.
 * @see {@link effect} - Observes source-signal writes.
 */
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

    get nonReactiveValue() {
      return _value;
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
      Connector.runReceivers(sourceSignal as BaseSourceSignal<unknown>);
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
