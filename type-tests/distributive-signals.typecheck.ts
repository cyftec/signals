import { expectTypeOf } from "bun:test";
import {
  derive,
  signal,
  type DerivedSignal,
  type MaybeSignal,
  type MaybeSignalValues,
  type Signal,
  type SourceSignal,
} from "../src";

const stringSource = signal<string>("");
const numberSource = signal<number>(0);
const stringDerived = derive<string>(() => "");
const numberDerived = derive<number>(() => 0);

const sourceUnionFromString: SourceSignal<string | number> = stringSource;
const sourceUnionFromNumber: SourceSignal<string | number> = numberSource;
const derivedUnionFromString: DerivedSignal<string | number> = stringDerived;
const derivedUnionFromNumber: DerivedSignal<string | number> = numberDerived;
const signalUnionFromSource: Signal<string | number> = stringSource;
const signalUnionFromDerived: Signal<string | number> = numberDerived;
const maybeUnionFromSource: MaybeSignal<string | number> = stringSource;
const maybeUnionFromDerived: MaybeSignal<string | number> = numberDerived;
const maybeValues: MaybeSignalValues<[string | number, string | number]> = [
  stringSource,
  numberDerived,
];

expectTypeOf(stringSource.trim()).toEqualTypeOf<DerivedSignal<string>>();
expectTypeOf(numberSource.toFixed()).toEqualTypeOf<DerivedSignal<string>>();

declare const mixedSource: SourceSignal<string | number>;
declare const mixedDerived: DerivedSignal<string | number>;

// Data-specific methods appear only when every branch of a union provides them.
// @ts-expect-error trim is unavailable on a string-or-number signal.
mixedSource.trim();
// @ts-expect-error toFixed is unavailable on a string-or-number signal.
mixedSource.toFixed();
// @ts-expect-error trim is unavailable on a string-or-number derived signal.
mixedDerived.trim();
// @ts-expect-error toFixed is unavailable on a string-or-number derived signal.
mixedDerived.toFixed();

void [
  sourceUnionFromString,
  sourceUnionFromNumber,
  derivedUnionFromString,
  derivedUnionFromNumber,
  signalUnionFromSource,
  signalUnionFromDerived,
  maybeUnionFromSource,
  maybeUnionFromDerived,
  maybeValues,
];
