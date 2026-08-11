import { expectTypeOf } from "bun:test";
import {
  compute,
  maybePlain,
  receive,
  signal,
  transmit,
  value,
  type BaseDerivedSignal,
  type BaseSourceSignal,
  type DerivedSignal,
  type MaybeSignal,
  type MaybeSignalValues,
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
declare const wideSourceArray: SourceSignal<WideArray>;
declare const wideDerivedArray: DerivedSignal<WideArray>;

// Every current signal container widens with its contained value.
const sourceArray: SourceSignal<WideArray> = narrowSourceArray;
const derivedArray: DerivedSignal<WideArray> = narrowDerivedArray;
const baseSourceArray: BaseSourceSignal<WideArray> = narrowSourceArray;
const baseDerivedArray: BaseDerivedSignal<WideArray> = narrowDerivedArray;
const signalArray: Signal<WideArray> = narrowSourceArray;
const signalDerivedArray: Signal<WideArray> = narrowDerivedArray;
const maybeSignalSourceArray: MaybeSignal<WideArray> = narrowSourceArray;
const maybeSignalDerivedArray: MaybeSignal<WideArray> = narrowDerivedArray;

// Widening is directional.
// @ts-expect-error A wide source cannot be used where a narrow source is required.
const sourceArrayReverse: SourceSignal<NarrowArray> = wideSourceArray;
// @ts-expect-error A wide derived signal cannot be used where a narrow derived signal is required.
const derivedArrayReverse: DerivedSignal<NarrowArray> = wideDerivedArray;

// The wide source view accepts wide-only values and exposes wide projections.
sourceArray.value = [{ title: "wide write" }];
sourceArray.mutate.push({ title: "wide item" });
sourceArray.mutate.fill({ title: "filled" });
sourceArray.mutate.toSpliced(0, 0, { title: "spliced" });

expectTypeOf(sourceArray.at(0)).toEqualTypeOf<
  DerivedSignal<WideObject | undefined>
>();
expectTypeOf(sourceArray.map((item) => item.href)).toEqualTypeOf<
  DerivedSignal<(string | undefined)[]>
>();
expectTypeOf(
  sourceArray.partition((item) => item.isSelected === true),
).toEqualTypeOf<
  readonly [DerivedSignal<WideArray>, DerivedSignal<WideArray>]
>();

expectTypeOf(derivedArray.at(0)).toEqualTypeOf<
  DerivedSignal<WideObject | undefined>
>();
expectTypeOf(derivedArray.map((item) => item.href)).toEqualTypeOf<
  DerivedSignal<(string | undefined)[]>
>();

const narrowObject = signal<NarrowObject>({
  title: "narrow",
  isSelected: true,
});
const wideObject: SourceSignal<WideObject> = narrowObject;
wideObject.value = { title: "wide" };
wideObject.mutate.set({ href: "https://example.test" });
expectTypeOf(wideObject.get("href")).toEqualTypeOf<
  DerivedSignal<string | undefined>
>();
expectTypeOf(wideObject.props().href).toEqualTypeOf<
  DerivedSignal<string | undefined> | undefined
>();

const narrowNumber = signal<1>(1);
const narrowBoolean = signal<true>(true);
const narrowString = signal<"ready">("ready");
const wideNumber: SourceSignal<number | boolean | string> = narrowNumber;
const wideBoolean: Signal<number | boolean | string> = narrowBoolean;
const wideString: Signal<number | boolean | string> = narrowString;
wideNumber.value = "now a string";
wideNumber.value = false;

const acceptsWidePrimitive = (
  input: Signal<number | boolean | string>,
): Signal<number | boolean | string> => input;
acceptsWidePrimitive(narrowNumber);
acceptsWidePrimitive(narrowBoolean);
acceptsWidePrimitive(narrowString);

const maybeValues: MaybeSignalValues<[WideArray, WideObject]> = [
  narrowSourceArray,
  narrowObject,
];
expectTypeOf<
  PlainValue<SourceSignal<NarrowArray>>
>().toEqualTypeOf<NarrowArray>();
expectTypeOf<
  PlainValues<MaybeSignalValues<[NarrowArray, string]>>
>().toEqualTypeOf<[NarrowArray, string]>();
expectTypeOf<
  NonNullSignalValue<SourceSignal<NarrowObject | undefined>>
>().toEqualTypeOf<SourceSignal<NarrowObject>>();

expectTypeOf(value<WideArray>(narrowSourceArray)).toEqualTypeOf<WideArray>();
expectTypeOf(value<WideArray>(narrowDerivedArray)).toEqualTypeOf<WideArray>();
expectTypeOf(
  compute<(items: WideArray) => string>(
    (items) => items.map((item) => item.href ?? item.title).join(","),
    narrowSourceArray,
  ),
).toEqualTypeOf<DerivedSignal<string>>();

const maybePlainWide = (input: MaybeSignal<string | number>) =>
  maybePlain(input);
maybePlainWide(narrowString);
maybePlainWide(narrowNumber);

const receiver = signal<WideArray>([]);
receive(receiver, narrowSourceArray, narrowDerivedArray, []);
transmit(narrowSourceArray, receiver);
transmit(narrowDerivedArray, receiver);

void [
  baseSourceArray,
  baseDerivedArray,
  signalArray,
  signalDerivedArray,
  maybeSignalSourceArray,
  maybeSignalDerivedArray,
  sourceArrayReverse,
  derivedArrayReverse,
  wideBoolean,
  wideString,
  maybeValues,
];
