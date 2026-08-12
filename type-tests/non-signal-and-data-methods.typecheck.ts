import { expectTypeOf } from "bun:test";
import {
  derive,
  nonSignal,
  signal,
  type DerivedSignal,
  type SourceSignal,
} from "../src";

const optionalSource = signal<string | null>(null, "");
const optionalDerived = derive<string | null>(() => optionalSource.value, "");
const optionalMethods = nonSignal(optionalSource);

expectTypeOf(optionalSource.or("fallback")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(optionalDerived.or("fallback")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(
  optionalMethods.if.equalTo(null).then("missing", 1),
).toEqualTypeOf<DerivedSignal<string | number>>();

const optionalNumber = signal<number | null>(null, 0);
const optionalDate = signal<Date | null>(null, new Date());
const objectMethods = nonSignal(new Set<number>());
const narrowComparisonOperand = signal<42>(42);
const narrowOptionalNumber = signal<42 | null>(null, 42);
const wideOptionalNumber: SourceSignal<number | null> = narrowOptionalNumber;
const anySource = signal<any>(undefined);

const directComparisons = [
  optionalNumber.is.truthy(),
  optionalNumber.is.falsy(),
  optionalNumber.is.equalTo(narrowComparisonOperand),
  optionalNumber.is.notEqualTo(narrowComparisonOperand),
  optionalNumber.is.greaterThan(narrowComparisonOperand),
  optionalNumber.is.greaterThanOrEqualTo(narrowComparisonOperand),
  optionalNumber.is.smallerThan(narrowComparisonOperand),
  optionalNumber.is.smallerThanOrEqualTo(narrowComparisonOperand),
];
const ternaryComparisons = [
  optionalNumber.if.truthy().then("yes", "no"),
  optionalNumber.if.falsy().then("yes", "no"),
  optionalNumber.if.equalTo(narrowComparisonOperand).then("yes", "no"),
  optionalNumber.if.notEqualTo(narrowComparisonOperand).then("yes", "no"),
  optionalNumber.if.greaterThan(narrowComparisonOperand).then("yes", "no"),
  optionalNumber.if
    .greaterThanOrEqualTo(narrowComparisonOperand)
    .then("yes", "no"),
  optionalNumber.if.smallerThan(narrowComparisonOperand).then("yes", "no"),
  optionalNumber.if
    .smallerThanOrEqualTo(narrowComparisonOperand)
    .then("yes", "no"),
  wideOptionalNumber.if.greaterThan(narrowComparisonOperand).then("yes", "no"),
];

expectTypeOf(optionalNumber.is.greaterThan(42)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(optionalNumber.if.smallerThan("100").then("yes", "no")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(optionalDate.is.greaterThan(0)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(optionalDerived.is.greaterThan(narrowComparisonOperand)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(objectMethods.if.greaterThan(42).then("yes", "no")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(directComparisons).toMatchTypeOf<DerivedSignal<boolean>[]>();
expectTypeOf(ternaryComparisons).toMatchTypeOf<DerivedSignal<string>[]>();
expectTypeOf(anySource.is.greaterThan(new Date())).toEqualTypeOf<
  DerivedSignal<boolean>
>();

const days = nonSignal([0, 1, 2]);
const dayIndex = days.indexOf(narrowComparisonOperand);
const plainText = nonSignal("  text  ");
const plainNumber = nonSignal(12);

expectTypeOf(dayIndex).toEqualTypeOf<DerivedSignal<number>>();
expectTypeOf(days.includes(narrowComparisonOperand)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(plainText.trim()).toEqualTypeOf<DerivedSignal<string>>();
expectTypeOf(plainNumber.toConfined(0, 10)).toEqualTypeOf<
  DerivedSignal<number>
>();

const arraySource = signal<number[]>([]);
const arrayDerived = derive<number[]>(() => arraySource.value);
const textSource = signal("  text  ");
const numberSource = signal(4);

expectTypeOf(arraySource.length()).toEqualTypeOf<DerivedSignal<number>>();
expectTypeOf(arrayDerived.map((item) => String(item))).toEqualTypeOf<
  DerivedSignal<string[]>
>();
expectTypeOf(textSource.deepTrim()).toEqualTypeOf<DerivedSignal<string>>();
expectTypeOf(numberSource.toConfined(0, 10)).toEqualTypeOf<
  DerivedSignal<number>
>();
