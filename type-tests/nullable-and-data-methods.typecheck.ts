import { expectTypeOf } from "bun:test";
import {
  derive,
  nullable,
  signal,
  type DerivedSignal,
} from "../src";

const nullableSource = signal<string | null>(null, "");
const nullableDerived = derive<string | null>(
  () => nullableSource.value,
  "",
);
const nullableMethods = nullable(nullableSource);

expectTypeOf(nullableSource.or("fallback")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(nullableDerived.or("fallback")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(nullableMethods.if.equalTo(null).then("missing", 1)).toEqualTypeOf<
  DerivedSignal<string | number>
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
