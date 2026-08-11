import { derive, type DerivedSignal, type Signal } from "../_core";
import { valueIsSignal } from "../utils";

/**
 * Describes the expression list accepted by the `tmpl` tag.
 *
 * Expressions may be signal objects, zero-argument deferred functions, or plain
 * values. The broad plain-value branch intentionally permits any JavaScript value.
 *
 * @remarks
 * - Functions are invoked during initial computation and captured signal updates.
 * - Signal values are read during those same computations.
 * - Nullish expression results are rendered as empty strings.
 *
 * @example
 * ```typescript
 * const expressions: StringSignalDeriverTemplateExpressions = [
 *   signal("Ada"),
 *   () => 42,
 *   null,
 * ];
 * ```
 *
 * @see {@link tmpl} - Consumes this expression list.
 * @see {@link Signal} - Represents directly accepted signal expressions.
 */
export type StringSignalDeriverTemplateExpressions = (
  | Signal<any>
  | (<T>(oldValue: T) => T)
  | any
)[];

/**
 * Builds an eagerly maintained derived string from a tagged-template expression list.
 *
 * The tag creates a derived signal, evaluates deferred functions, reads signal
 * values, replaces nullish results with an empty string, and stringifies every
 * remaining expression in template order.
 *
 * @param strings - The static template fragments supplied by JavaScript.
 * @param tlExpressions - The dynamic placeholder expressions.
 * @returns A derived signal containing the interpolated string.
 *
 * @remarks
 * - Function expressions are called with no arguments.
 * - Source-signal reads inside interpolation become fixed dependencies of the template signal.
 * - Plain expressions are evaluated during each template computation, not on value reads.
 * - A throwing function or `toString()` call propagates its error.
 *
 * @example
 * ```typescript
 * const name = signal("World");
 * const greeting = tmpl`Hello ${name}!`;
 * name.value = "Ada";
 * console.log(greeting.value); // "Hello Ada!"
 * ```
 *
 * @see {@link StringSignalDeriverTemplateExpressions} - Describes placeholders.
 * @see {@link derive} - Provides the eagerly maintained derived signal.
 * @see {@link DerivedSignal} - Describes the return value.
 */
export const tmpl = (
  strings: TemplateStringsArray,
  ...tlExpressions: StringSignalDeriverTemplateExpressions
): DerivedSignal<string> =>
  derive(() => {
    return strings.reduce((acc, fragment, i) => {
      let expValue;
      const expression = tlExpressions[i];

      if (typeof expression === "function") {
        expValue = expression() ?? "";
      } else if (valueIsSignal(expression)) {
        expValue = (expression as Signal<any>).value ?? "";
      } else {
        expValue = (expression as any) ?? "";
      }

      return `${acc}${fragment}${expValue.toString()}`;
    }, "");
  });
