import { MaybeSignalValues, PlainValues } from "../_core/signals/types";
import { value } from "./value-getter";

/**
 * Unwraps a tuple of signal-capable method arguments.
 *
 * Data-specific helpers use this function to convert their plain, live-signal,
 * and dead-signal operands into the native argument tuple expected by JavaScript.
 *
 * @template T - The signal-capable argument tuple type.
 * @param methodParams - Arguments to unwrap in order.
 * @returns A new array containing each argument's plain value.
 *
 * @remarks
 * - Live signal arguments participate in dependency collection.
 * - Dead signals and plain values do not create future updates.
 * - Function arguments remain functions because `MaybeSignalValues` preserves callable entries.
 * - The returned array preserves input order.
 *
 * @example
 * ```typescript
 * const index = signal(1);
 * const args = getPlainMethodParams(index, "fallback");
 * console.log(args); // [1, "fallback"]
 * ```
 *
 * @see {@link value} - Unwraps each individual argument.
 * @see {@link MaybeSignalValues} - Describes the input tuple.
 * @see {@link PlainValues} - Describes the output tuple.
 */
export const getPlainMethodParams = <T extends MaybeSignalValues<any[]>>(
  ...methodParams: T
) => methodParams.map((p) => value(p)) as PlainValues<T>;
