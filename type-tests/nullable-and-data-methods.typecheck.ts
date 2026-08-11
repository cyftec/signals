import { expectTypeOf } from "bun:test";
import {
  derive,
  nullable,
  signal,
  type DerivedSignal,
  type SourceSignal,
} from "../src";

const nullableSource = signal<string | null>(null, "");
const nullableDerived = derive<string | null>(() => nullableSource.value, "");
const nullableMethods = nullable(nullableSource);

expectTypeOf(nullableSource.or("fallback")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(nullableDerived.or("fallback")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(
  nullableMethods.if.equalTo(null).then("missing", 1),
).toEqualTypeOf<DerivedSignal<string | number>>();

const nullableNumber = signal<number | null>(null, 0);
const nullableDate = signal<Date | null>(null, new Date());
const objectMethods = nullable(new Set<number>());
const narrowComparisonOperand = signal<42>(42);
const narrowNullableNumber = signal<42 | null>(null, 42);
const wideNullableNumber: SourceSignal<number | null> = narrowNullableNumber;
const anySource = signal<any>(undefined);

const directComparisons = [
  nullableNumber.is.truthy(),
  nullableNumber.is.falsy(),
  nullableNumber.is.equalTo(narrowComparisonOperand),
  nullableNumber.is.notEqualTo(narrowComparisonOperand),
  nullableNumber.is.greaterThan(narrowComparisonOperand),
  nullableNumber.is.greaterThanOrEqualTo(narrowComparisonOperand),
  nullableNumber.is.smallerThan(narrowComparisonOperand),
  nullableNumber.is.smallerThanOrEqualTo(narrowComparisonOperand),
];
const ternaryComparisons = [
  nullableNumber.if.truthy().then("yes", "no"),
  nullableNumber.if.falsy().then("yes", "no"),
  nullableNumber.if.equalTo(narrowComparisonOperand).then("yes", "no"),
  nullableNumber.if.notEqualTo(narrowComparisonOperand).then("yes", "no"),
  nullableNumber.if.greaterThan(narrowComparisonOperand).then("yes", "no"),
  nullableNumber.if
    .greaterThanOrEqualTo(narrowComparisonOperand)
    .then("yes", "no"),
  nullableNumber.if.smallerThan(narrowComparisonOperand).then("yes", "no"),
  nullableNumber.if
    .smallerThanOrEqualTo(narrowComparisonOperand)
    .then("yes", "no"),
  wideNullableNumber.if.greaterThan(narrowComparisonOperand).then("yes", "no"),
];

expectTypeOf(nullableNumber.is.greaterThan(42)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(nullableNumber.if.smallerThan("100").then("yes", "no")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(nullableDate.is.greaterThan(0)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(nullableDerived.is.greaterThan(narrowComparisonOperand)).toEqualTypeOf<
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
