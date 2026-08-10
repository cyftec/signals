/**
 * Supplies monotonically increasing numeric identifiers for core objects.
 *
 * Source signals and effect receivers read newID to obtain distinct identifiers
 * within the current module instance.
 *
 * @remarks
 * - The first generated identifier is 1.
 * - Identifiers are never reused or reset by the public API.
 *
 * @example
 * ```typescript
 * const first = IdGenerator.newID;
 * const second = IdGenerator.newID;
 * console.log(second > first); // true
 * ```
 *
 * @see {@link signal} - Uses identifiers for source signals.
 * @see {@link effect} - Uses identifiers for effect receivers.
 */
export const IdGenerator = (() => {
  let _id = 0;

  const idGen = {
    get newID(): number {
      return ++_id;
    },
  } as const;

  return idGen;
})();
