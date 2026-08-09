import { expectTypeOf } from "bun:test";
import {
  type DeadSignal,
  type DerivedOrDeadSignal,
  type DerivedSignal,
  type LiveSignal,
  type Signal,
  deadSignal,
  derive,
  nullable,
  signal,
} from "../src";

const liveNullableSource = signal<string | null>(null);
const liveNullableDerived = derive(() => liveNullableSource.value);
const deadNullable = deadSignal<string | null>(null);
declare const hybridNullable:
  | LiveSignal<string | null>
  | DeadSignal<string | null>;
declare const maybeNullableNumber: Signal<number | undefined> | undefined;

expectTypeOf(liveNullableSource.or("fallback")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(liveNullableDerived.or("fallback")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(deadNullable.or("fallback")).toEqualTypeOf<DeadSignal<string>>();
expectTypeOf(hybridNullable.or("fallback")).toEqualTypeOf<
  DerivedOrDeadSignal<string>
>();
expectTypeOf(nullable(maybeNullableNumber).or(16)).toEqualTypeOf<
  DerivedOrDeadSignal<number>
>();

expectTypeOf(liveNullableSource.is.equalTo(null)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(liveNullableDerived.is.equalTo(null)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(deadNullable.is.equalTo(null)).toEqualTypeOf<
  DeadSignal<boolean>
>();
expectTypeOf(hybridNullable.is.equalTo(null)).toEqualTypeOf<
  DerivedOrDeadSignal<boolean>
>();

expectTypeOf(
  liveNullableSource.if.equalTo(null).then("missing", 1),
).toEqualTypeOf<DerivedSignal<string | number>>();
expectTypeOf(
  liveNullableDerived.if.equalTo(null).then("missing", 1),
).toEqualTypeOf<DerivedSignal<string | number>>();
expectTypeOf(
  deadNullable.if.equalTo(null).then("missing", 1),
).toEqualTypeOf<DeadSignal<string | number>>();
const directHybridTernary = hybridNullable.if
  .equalTo(null)
  .then("missing", 1);
expectTypeOf(directHybridTernary).toEqualTypeOf<
  DerivedOrDeadSignal<string | number>
>();

const liveSourceMethods = nullable(liveNullableSource);
const liveDerivedMethods = nullable(liveNullableDerived);
const deadMethods = nullable(deadNullable);
const plainMethods = nullable<string | null>(null);
const hybridMethods = nullable(hybridNullable);

expectTypeOf(liveSourceMethods.or("fallback")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(liveDerivedMethods.or("fallback")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(deadMethods.or("fallback")).toEqualTypeOf<DeadSignal<string>>();
expectTypeOf(plainMethods.or("fallback")).toEqualTypeOf<DeadSignal<string>>();
expectTypeOf(hybridMethods.or("fallback")).toEqualTypeOf<
  DerivedOrDeadSignal<string>
>();

expectTypeOf(liveSourceMethods.is.equalTo(null)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(liveDerivedMethods.is.equalTo(null)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(deadMethods.is.equalTo(null)).toEqualTypeOf<DeadSignal<boolean>>();
expectTypeOf(plainMethods.is.equalTo(null)).toEqualTypeOf<DeadSignal<boolean>>();
expectTypeOf(hybridMethods.is.equalTo(null)).toEqualTypeOf<
  DerivedOrDeadSignal<boolean>
>();

expectTypeOf(
  liveSourceMethods.if.equalTo(null).then("missing", 1),
).toEqualTypeOf<DerivedSignal<string | number>>();
expectTypeOf(
  liveDerivedMethods.if.equalTo(null).then("missing", 1),
).toEqualTypeOf<DerivedSignal<string | number>>();
expectTypeOf(
  deadMethods.if.equalTo(null).then("missing", 1),
).toEqualTypeOf<DeadSignal<string | number>>();
expectTypeOf(
  plainMethods.if.equalTo(null).then("missing", 1),
).toEqualTypeOf<DeadSignal<string | number>>();
expectTypeOf(
  hybridMethods.if.equalTo(null).then("missing", 1),
).toEqualTypeOf<DerivedOrDeadSignal<string | number>>();

expectTypeOf(liveSourceMethods.is.length.greaterThan(0)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(liveDerivedMethods.is.length.greaterThan(0)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(deadMethods.is.length.greaterThan(0)).toEqualTypeOf<
  DeadSignal<boolean>
>();
expectTypeOf(plainMethods.is.length.greaterThan(0)).toEqualTypeOf<
  DeadSignal<boolean>
>();
expectTypeOf(hybridMethods.is.length.greaterThan(0)).toEqualTypeOf<
  DerivedOrDeadSignal<boolean>
>();

expectTypeOf(
  nullable<number | undefined>(undefined).is.truthy(),
).toEqualTypeOf<DeadSignal<boolean>>();

const liveArraySource = signal<number[]>([1, 2, 3]);
const liveArrayDerived = derive(() => liveArraySource.value);
const deadArray = deadSignal<number[]>([1, 2, 3]);
declare const hybridArray: LiveSignal<number[]> | DeadSignal<number[]>;

expectTypeOf(liveArraySource.map((item: number) => String(item))).toEqualTypeOf<
  DerivedSignal<string[]>
>();
expectTypeOf(liveArrayDerived.map((item: number) => String(item))).toEqualTypeOf<
  DerivedSignal<string[]>
>();
expectTypeOf(deadArray.map((item: number) => String(item))).toEqualTypeOf<
  DeadSignal<string[]>
>();
expectTypeOf(hybridArray.map((item: number) => String(item))).toEqualTypeOf<
  DerivedOrDeadSignal<string[]>
>();

expectTypeOf(liveArraySource.partition((item: number) => item > 1)).toEqualTypeOf<
  readonly [DerivedSignal<number[]>, DerivedSignal<number[]>]
>();
expectTypeOf(liveArrayDerived.partition((item: number) => item > 1)).toEqualTypeOf<
  readonly [DerivedSignal<number[]>, DerivedSignal<number[]>]
>();
expectTypeOf(deadArray.partition((item: number) => item > 1)).toEqualTypeOf<
  readonly [DeadSignal<number[]>, DeadSignal<number[]>]
>();
const hybridPartition = hybridArray.partition((item: number) => item > 1);
expectTypeOf(hybridPartition.length).toEqualTypeOf<2>();
expectTypeOf(hybridPartition[0]).toEqualTypeOf<
  DerivedOrDeadSignal<number[]>
>();
expectTypeOf(hybridPartition[1]).toEqualTypeOf<
  DerivedOrDeadSignal<number[]>
>();

const liveStringSource = signal("hello");
const liveStringDerived = derive(() => liveStringSource.value);
const deadString = deadSignal("hello");
declare const hybridString: LiveSignal<string> | DeadSignal<string>;

expectTypeOf(liveStringSource.toUpperCase()).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(liveStringDerived.toUpperCase()).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(deadString.toUpperCase()).toEqualTypeOf<DeadSignal<string>>();
expectTypeOf(hybridString.toUpperCase()).toEqualTypeOf<
  DerivedOrDeadSignal<string>
>();

const liveNumberSource = signal(42);
const liveNumberDerived = derive(() => liveNumberSource.value);
const deadNumber = deadSignal(42);
declare const hybridNumber: LiveSignal<number> | DeadSignal<number>;

expectTypeOf(liveNumberSource.toFixed(2)).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(liveNumberDerived.toFixed(2)).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(deadNumber.toFixed(2)).toEqualTypeOf<DeadSignal<string>>();
expectTypeOf(hybridNumber.toFixed(2)).toEqualTypeOf<
  DerivedOrDeadSignal<string>
>();

type Person = {
  name: string;
  age: number;
};

const liveObjectSource = signal<Person>({ name: "Ada", age: 36 });
const liveObjectDerived = derive(() => liveObjectSource.value);
const deadObject = deadSignal<Person>({ name: "Ada", age: 36 });
declare const hybridObject: LiveSignal<Person> | DeadSignal<Person>;

expectTypeOf(liveObjectSource.get("name")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(liveObjectDerived.get("name")).toEqualTypeOf<
  DerivedSignal<string>
>();
expectTypeOf(deadObject.get("name")).toEqualTypeOf<DeadSignal<string>>();
expectTypeOf(hybridObject.get("name")).toEqualTypeOf<
  DerivedOrDeadSignal<string>
>();

expectTypeOf(liveObjectSource.props()).toEqualTypeOf<{
  name: DerivedSignal<string>;
  age: DerivedSignal<number>;
}>();
expectTypeOf(liveObjectDerived.props()).toEqualTypeOf<{
  name: DerivedSignal<string>;
  age: DerivedSignal<number>;
}>();
expectTypeOf(deadObject.props()).toEqualTypeOf<{
  name: DeadSignal<string>;
  age: DeadSignal<number>;
}>();
const hybridProps = hybridObject.props();
expectTypeOf(hybridProps.name).toEqualTypeOf<
  DerivedOrDeadSignal<string>
>();
expectTypeOf(hybridProps.age).toEqualTypeOf<
  DerivedOrDeadSignal<number>
>();
