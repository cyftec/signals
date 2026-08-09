import { expectTypeOf } from "bun:test";
import {
  compute,
  deadSignal,
  derive,
  nullable,
  op,
  receive,
  signal,
  transmit,
  value,
  type BaseDeadSignal,
  type BaseDerivedSignal,
  type BaseSourceSignal,
  type DeadSignal,
  type DerivedOrDeadSignal,
  type DerivedSignal,
  type LiveSignal,
  type MaybeDeadSignal,
  type MaybeDerivedSignal,
  type MaybeLiveSignal,
  type MaybeSignal,
  type MaybeSignalValues,
  type MaybeSourceSignal,
  type NonNullSignalValue,
  type PlainValue,
  type PlainValues,
  type Signal,
  type SourceSignal,
} from "../src";

type NarrowObject = { title: string; isSelected: boolean };
type WideObject = {
  title: string;
  href?: string;
  isSelected?: boolean;
};
type NarrowArray = NarrowObject[];
type WideArray = WideObject[];

declare const narrowSourceArray: SourceSignal<NarrowArray>;
declare const narrowDerivedArray: DerivedSignal<NarrowArray>;
declare const narrowDeadArray: DeadSignal<NarrowArray>;
declare const wideSourceArray: SourceSignal<WideArray>;
declare const wideDerivedArray: DerivedSignal<WideArray>;
declare const wideDeadArray: DeadSignal<WideArray>;

// Every signal-container form widens when its contained plain value widens.
const sourceArray: SourceSignal<WideArray> = narrowSourceArray;
const derivedArray: DerivedSignal<WideArray> = narrowDerivedArray;
const deadArray: DeadSignal<WideArray> = narrowDeadArray;
const baseSourceArray: BaseSourceSignal<WideArray> = narrowSourceArray;
const baseDerivedArray: BaseDerivedSignal<WideArray> = narrowDerivedArray;
const baseDeadArray: BaseDeadSignal<WideArray> = narrowDeadArray;
const liveArray: LiveSignal<WideArray> = narrowSourceArray;
const liveDerivedArray: LiveSignal<WideArray> = narrowDerivedArray;
const signalArray: Signal<WideArray> = narrowSourceArray;
const signalDerivedArray: Signal<WideArray> = narrowDerivedArray;
const signalDeadArray: Signal<WideArray> = narrowDeadArray;
const derivedOrDeadArray: DerivedOrDeadSignal<WideArray> = narrowDerivedArray;
const derivedOrDeadDeadArray: DerivedOrDeadSignal<WideArray> = narrowDeadArray;
const maybeSourceArray: MaybeSourceSignal<WideArray> = narrowSourceArray;
const maybeDerivedArray: MaybeDerivedSignal<WideArray> = narrowDerivedArray;
const maybeDeadArray: MaybeDeadSignal<WideArray> = narrowDeadArray;
const maybeLiveArray: MaybeLiveSignal<WideArray> = narrowDerivedArray;
const maybeSignalSourceArray: MaybeSignal<WideArray> = narrowSourceArray;
const maybeSignalDerivedArray: MaybeSignal<WideArray> = narrowDerivedArray;
const maybeSignalDeadArray: MaybeSignal<WideArray> = narrowDeadArray;
const maybeSignalPlainArray: MaybeSignal<WideArray> = [
  { title: "plain", isSelected: true },
];

// Reverse assignments remain invalid when the corresponding plain assignment is invalid.
// @ts-expect-error WideArray is not assignable to NarrowArray.
const sourceArrayReverse: SourceSignal<NarrowArray> = wideSourceArray;
// @ts-expect-error WideArray is not assignable to NarrowArray.
const derivedArrayReverse: DerivedSignal<NarrowArray> = wideDerivedArray;
// @ts-expect-error WideArray is not assignable to NarrowArray.
const deadArrayReverse: DeadSignal<NarrowArray> = wideDeadArray;

// A widened source view accepts widened writes and every source array mutator.
sourceArray.value = [{ title: "write through wide view" }];
sourceArray.mutate.concat({ title: "concat" });
sourceArray.mutate.copyWithin(0, 0);
sourceArray.mutate.fill({ title: "fill" });
sourceArray.mutate.filter((item) => !!item.href);
sourceArray.mutate.pop();
sourceArray.mutate.push({ title: "push" });
sourceArray.mutate.shift();
sourceArray.mutate.toReversed();
sourceArray.mutate.toSorted((left, right) =>
  left.title.localeCompare(right.title),
);
sourceArray.mutate.toSpliced(0, 0, { title: "spliced" });
sourceArray.mutate.unshift({ title: "unshift" });

// A widened source view has the same widened projection surface as a derived view.
expectTypeOf(sourceArray.at(0)).toEqualTypeOf<
  DerivedSignal<WideObject | undefined>
>();
expectTypeOf(sourceArray.concat({ title: "concat" })).toEqualTypeOf<
  DerivedSignal<WideArray>
>();
expectTypeOf(sourceArray.every((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(sourceArray.filter((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<WideArray>
>();
expectTypeOf(sourceArray.find((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<WideObject | undefined>
>();
expectTypeOf(sourceArray.findIndex((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<number>
>();
expectTypeOf(sourceArray.findLast((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<WideObject | undefined>
>();
expectTypeOf(sourceArray.findLastIndex((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<number>
>();
expectTypeOf(sourceArray.length()).toEqualTypeOf<DerivedSignal<number>>();
expectTypeOf(sourceArray.map((item) => item.href)).toEqualTypeOf<
  DerivedSignal<(string | undefined)[]>
>();
expectTypeOf(
  sourceArray.reduce((all, item) => all + item.title, ""),
).toEqualTypeOf<DerivedSignal<string>>();
expectTypeOf(
  sourceArray.reduceRight((all, item) => all + item.title, ""),
).toEqualTypeOf<DerivedSignal<string>>();
expectTypeOf(sourceArray.some((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(sourceArray.toReversed()).toEqualTypeOf<
  DerivedSignal<WideArray>
>();
expectTypeOf(
  sourceArray.toSorted((left, right) =>
    left.title.localeCompare(right.title),
  ),
).toEqualTypeOf<DerivedSignal<WideArray>>();
expectTypeOf(
  sourceArray.toSpliced(0, 0, { title: "spliced" }),
).toEqualTypeOf<DerivedSignal<WideArray>>();
expectTypeOf(sourceArray.lastItem()).toEqualTypeOf<
  DerivedSignal<WideObject | undefined>
>();
expectTypeOf(sourceArray.partition((item) => !!item.href)).toEqualTypeOf<
  readonly [DerivedSignal<WideArray>, DerivedSignal<WideArray>]
>();

// Every array projection uses the widened element type at the call site.
expectTypeOf(derivedArray.at(0)).toEqualTypeOf<
  DerivedSignal<WideObject | undefined>
>();
expectTypeOf(derivedArray.concat({ title: "concat" })).toEqualTypeOf<
  DerivedSignal<WideArray>
>();
expectTypeOf(derivedArray.every((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(derivedArray.filter((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<WideArray>
>();
expectTypeOf(derivedArray.find((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<WideObject | undefined>
>();
expectTypeOf(derivedArray.findIndex((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<number>
>();
expectTypeOf(derivedArray.findLast((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<WideObject | undefined>
>();
expectTypeOf(derivedArray.findLastIndex((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<number>
>();
expectTypeOf(derivedArray.length()).toEqualTypeOf<DerivedSignal<number>>();
expectTypeOf(derivedArray.map((item) => item.href)).toEqualTypeOf<
  DerivedSignal<(string | undefined)[]>
>();
expectTypeOf(
  derivedArray.reduce((all, item) => all + item.title, ""),
).toEqualTypeOf<DerivedSignal<string>>();
expectTypeOf(
  derivedArray.reduceRight((all, item) => all + item.title, ""),
).toEqualTypeOf<DerivedSignal<string>>();
expectTypeOf(derivedArray.some((item) => !!item.href)).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(derivedArray.toReversed()).toEqualTypeOf<
  DerivedSignal<WideArray>
>();
expectTypeOf(
  derivedArray.toSorted((left, right) => left.title.localeCompare(right.title)),
).toEqualTypeOf<DerivedSignal<WideArray>>();
expectTypeOf(derivedArray.toSpliced(0, 0, { title: "spliced" })).toEqualTypeOf<
  DerivedSignal<WideArray>
>();
expectTypeOf(derivedArray.lastItem()).toEqualTypeOf<
  DerivedSignal<WideObject | undefined>
>();
expectTypeOf(derivedArray.partition((item) => !!item.href)).toEqualTypeOf<
  readonly [DerivedSignal<WideArray>, DerivedSignal<WideArray>]
>();

expectTypeOf(deadArray.concat({ title: "concat" })).toEqualTypeOf<
  DeadSignal<WideArray>
>();
expectTypeOf(deadArray.at(0)).toEqualTypeOf<
  DeadSignal<WideObject | undefined>
>();
expectTypeOf(deadArray.every((item) => !!item.href)).toEqualTypeOf<
  DeadSignal<boolean>
>();
expectTypeOf(deadArray.filter((item) => !!item.href)).toEqualTypeOf<
  DeadSignal<WideArray>
>();
expectTypeOf(deadArray.map((item) => item.href)).toEqualTypeOf<
  DeadSignal<(string | undefined)[]>
>();
expectTypeOf(deadArray.find((item) => !!item.href)).toEqualTypeOf<
  DeadSignal<WideObject | undefined>
>();
expectTypeOf(deadArray.findIndex((item) => !!item.href)).toEqualTypeOf<
  DeadSignal<number>
>();
expectTypeOf(deadArray.findLast((item) => !!item.href)).toEqualTypeOf<
  DeadSignal<WideObject | undefined>
>();
expectTypeOf(deadArray.findLastIndex((item) => !!item.href)).toEqualTypeOf<
  DeadSignal<number>
>();
expectTypeOf(deadArray.length()).toEqualTypeOf<DeadSignal<number>>();
expectTypeOf(
  deadArray.reduce((all, item) => all + item.title, ""),
).toEqualTypeOf<DeadSignal<string>>();
expectTypeOf(
  deadArray.reduceRight((all, item) => all + item.title, ""),
).toEqualTypeOf<DeadSignal<string>>();
expectTypeOf(deadArray.some((item) => !!item.href)).toEqualTypeOf<
  DeadSignal<boolean>
>();
expectTypeOf(deadArray.toReversed()).toEqualTypeOf<DeadSignal<WideArray>>();
expectTypeOf(
  deadArray.toSorted((left, right) => left.title.localeCompare(right.title)),
).toEqualTypeOf<DeadSignal<WideArray>>();
expectTypeOf(deadArray.toSpliced(0, 0, { title: "spliced" })).toEqualTypeOf<
  DeadSignal<WideArray>
>();
expectTypeOf(deadArray.lastItem()).toEqualTypeOf<
  DeadSignal<WideObject | undefined>
>();
expectTypeOf(deadArray.partition((item) => !!item.href)).toEqualTypeOf<
  readonly [DeadSignal<WideArray>, DeadSignal<WideArray>]
>();

// Signal-valued array operands widen in the same direction as plain operands.
expectTypeOf(
  derivedArray.concat(
    signal<NarrowObject>({ title: "source", isSelected: true }),
  ),
).toEqualTypeOf<DerivedSignal<WideArray>>();
expectTypeOf(
  derivedArray.concat(
    derive<NarrowObject>(() => ({ title: "derived", isSelected: true })),
  ),
).toEqualTypeOf<DerivedSignal<WideArray>>();
expectTypeOf(
  derivedArray.concat(
    deadSignal<NarrowObject>({ title: "dead", isSelected: true }),
  ),
).toEqualTypeOf<DerivedSignal<WideArray>>();

declare const narrowSourceObject: SourceSignal<NarrowObject>;
declare const narrowDerivedObject: DerivedSignal<NarrowObject>;
declare const narrowDeadObject: DeadSignal<NarrowObject>;
const sourceObject: SourceSignal<WideObject> = narrowSourceObject;
const derivedObject: DerivedSignal<WideObject> = narrowDerivedObject;
const deadObject: DeadSignal<WideObject> = narrowDeadObject;

sourceObject.value = { title: "wide write" };
sourceObject.mutate.set({ href: "https://example.test" });
expectTypeOf(derivedObject.get("href")).toEqualTypeOf<
  DerivedSignal<string | undefined>
>();
expectTypeOf(deadObject.get("href")).toEqualTypeOf<
  DeadSignal<string | undefined>
>();
expectTypeOf(derivedObject.props().href).toEqualTypeOf<
  DerivedSignal<string | undefined> | undefined
>();
expectTypeOf(deadObject.props().href).toEqualTypeOf<
  DeadSignal<string | undefined> | undefined
>();

declare const narrowStringSource: SourceSignal<string>;
declare const narrowStringDerived: DerivedSignal<string>;
declare const narrowStringDead: DeadSignal<string>;
const sourcePrimitive: SourceSignal<string | number> = narrowStringSource;
const derivedPrimitive: DerivedSignal<string | number> = narrowStringDerived;
const deadPrimitive: DeadSignal<string | number> = narrowStringDead;
const livePrimitive: LiveSignal<string | number> = narrowStringSource;
const signalPrimitive: Signal<string | number> = narrowStringDead;
const maybePrimitive: MaybeSignal<string | number> = narrowStringDerived;

sourcePrimitive.value = 1;
expectTypeOf(derivedPrimitive.or(1)).toEqualTypeOf<
  DerivedSignal<string | number>
>();
expectTypeOf(deadPrimitive.or(1)).toEqualTypeOf<DeadSignal<string | number>>();
expectTypeOf(derivedPrimitive.if.truthy().then("yes", 1)).toEqualTypeOf<
  DerivedSignal<string | number>
>();

declare const narrowNumberSource: SourceSignal<1>;
const wideNumberSource: SourceSignal<number> = narrowNumberSource;
expectTypeOf(wideNumberSource.is.greaterThan(signal<1>(1))).toEqualTypeOf<
  DerivedSignal<boolean>
>();
expectTypeOf(derivedArray.is.length.greaterThan(signal<1>(1))).toEqualTypeOf<
  DerivedSignal<boolean>
>();

// A union view retains only helpers common to every value branch.
declare const mixedSource: SourceSignal<string | number>;
declare const mixedDerived: DerivedSignal<string | number>;
declare const mixedDead: DeadSignal<string | number>;
// @ts-expect-error String-only helper is unavailable on a mixed union.
mixedSource.trim();
// @ts-expect-error Number-only helper is unavailable on a mixed union.
mixedDerived.toFixed();
// @ts-expect-error String-only helper is unavailable on a mixed union.
mixedDead.trim();

// Maybe-signal transformations preserve signal containment and plain values.
const maybeValues: MaybeSignalValues<[WideArray, WideObject, string | number]> =
  [narrowSourceArray, narrowDerivedObject, narrowStringDead];
expectTypeOf<
  PlainValue<SourceSignal<NarrowArray>>
>().toEqualTypeOf<NarrowArray>();
expectTypeOf<
  PlainValues<MaybeSignalValues<[NarrowArray, string]>>
>().toEqualTypeOf<[NarrowArray, string]>();
expectTypeOf<
  NonNullSignalValue<SourceSignal<NarrowObject | undefined>>
>().toEqualTypeOf<SourceSignal<NarrowObject>>();
expectTypeOf<PlainValue<never>>().toEqualTypeOf<never>();
expectTypeOf<PlainValue<unknown>>().toEqualTypeOf<unknown>();

// Every public unwrapping API accepts narrow signals where it expects wide values.
expectTypeOf(value<WideArray>(narrowSourceArray)).toEqualTypeOf<WideArray>();
expectTypeOf(value<WideArray>(narrowDerivedArray)).toEqualTypeOf<WideArray>();
expectTypeOf(value<WideArray>(narrowDeadArray)).toEqualTypeOf<WideArray>();
expectTypeOf(
  compute<(items: WideArray) => string>(
    (items) => items.map((item) => item.href ?? item.title).join(","),
    narrowSourceArray,
  ),
).toEqualTypeOf<DerivedSignal<string>>();

const nullableWide = (input: MaybeSignal<string | number>) => nullable(input);
nullableWide(narrowStringSource);
nullableWide(narrowStringDerived);
nullableWide(narrowStringDead);

expectTypeOf(op<WideArray>(narrowSourceArray).result).toEqualTypeOf<
  DerivedSignal<unknown>
>();
expectTypeOf(
  op<WideArray>(narrowSourceArray).lengthEquals(signal<1>(1)).truthy,
).toEqualTypeOf<DerivedSignal<boolean>>();
const numericOperationResult: DerivedSignal<number> = op<number>(
  signal<1>(1),
).add(signal<1>(1)).result;

// Connectors accept narrow transmitters and a widened source receiver.
receive(sourceArray, narrowSourceArray, narrowDerivedArray, narrowDeadArray, [
  { title: "plain", isSelected: true },
]);
transmit(narrowSourceArray, sourceArray);
transmit(narrowDerivedArray, sourceArray);
transmit(narrowDeadArray, sourceArray);

void [
  baseSourceArray,
  baseDerivedArray,
  baseDeadArray,
  liveArray,
  liveDerivedArray,
  signalArray,
  signalDerivedArray,
  signalDeadArray,
  derivedOrDeadArray,
  derivedOrDeadDeadArray,
  maybeSourceArray,
  maybeDerivedArray,
  maybeDeadArray,
  maybeLiveArray,
  maybeSignalSourceArray,
  maybeSignalDerivedArray,
  maybeSignalDeadArray,
  maybeSignalPlainArray,
  livePrimitive,
  signalPrimitive,
  maybePrimitive,
  wideNumberSource,
  maybeValues,
  numericOperationResult,
];
