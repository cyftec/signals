import { expectTypeOf } from "bun:test";
import {
  deadSignal,
  derive,
  signal,
  type DeadSignal,
  type DerivedSignal,
  type DerivedOrDeadSignal,
  type LiveSignal,
  type MaybeDeadSignal,
  type MaybeDerivedSignal,
  type MaybeLiveSignal,
  type MaybeSignal,
  type MaybeSignalValues,
  type MaybeSourceSignal,
  type Signal,
  type SourceSignal,
} from "../src";

const stringSource = signal("");
const numberSource = signal(0);
const stringDerived = derive(() => "");
const numberDerived = derive(() => 0);
const stringDead = deadSignal("");
const numberDead = deadSignal(0);

const sourceUnion: SourceSignal<string | number> = stringSource;
const sourceUnionFromNumber: SourceSignal<string | number> = numberSource;
const derivedUnion: DerivedSignal<string | number> = stringDerived;
const derivedUnionFromNumber: DerivedSignal<string | number> = numberDerived;
const deadUnion: DeadSignal<string | number> = stringDead;
const deadUnionFromNumber: DeadSignal<string | number> = numberDead;

const liveUnion: LiveSignal<string | number> = stringSource;
const liveUnionFromDerived: LiveSignal<string | number> = numberDerived;
const signalUnion: Signal<string | number> = stringSource;
const signalUnionFromDead: Signal<string | number> = numberDead;
const derivedOrDeadUnion: DerivedOrDeadSignal<string | number> = stringDerived;
const derivedOrDeadUnionFromDead: DerivedOrDeadSignal<string | number> =
  numberDead;

const maybeSourceUnion: MaybeSourceSignal<string | number> = stringSource;
const maybeDerivedUnion: MaybeDerivedSignal<string | number> = numberDerived;
const maybeDeadUnion: MaybeDeadSignal<string | number> = stringDead;
const maybeLiveUnion: MaybeLiveSignal<string | number> = numberDerived;
const maybeUnionFromSource: MaybeSignal<string | number> = stringSource;
const maybeUnionFromDerived: MaybeSignal<string | number> = stringDerived;
const maybeUnionFromDead: MaybeSignal<string | number> = stringDead;
const maybeValues: MaybeSignalValues<[string | number]> = [stringSource];

expectTypeOf(stringSource.trim()).toEqualTypeOf<DerivedSignal<string>>();
expectTypeOf(numberSource.toFixed()).toEqualTypeOf<DerivedSignal<string>>();
expectTypeOf(mixedSource.is.equalTo(stringSource)).toEqualTypeOf<
  DerivedSignal<boolean>
>();

declare const mixedSource: SourceSignal<string | number>;
declare const mixedDerived: DerivedSignal<string | number>;
declare const mixedDead: DeadSignal<string | number>;

// Data-specific methods are available only when every possible value branch
// supplies that method.
// @ts-expect-error trim exists only on the string branch.
mixedSource.trim();
// @ts-expect-error toFixed exists only on the number branch.
mixedSource.toFixed();
// @ts-expect-error trim exists only on the string branch.
mixedDerived.trim();
// @ts-expect-error toFixed exists only on the number branch.
mixedDead.toFixed();

void [
  sourceUnion,
  sourceUnionFromNumber,
  derivedUnion,
  derivedUnionFromNumber,
  deadUnion,
  deadUnionFromNumber,
  liveUnion,
  liveUnionFromDerived,
  signalUnion,
  signalUnionFromDead,
  derivedOrDeadUnion,
  derivedOrDeadUnionFromDead,
  maybeSourceUnion,
  maybeDerivedUnion,
  maybeDeadUnion,
  maybeLiveUnion,
  maybeUnionFromSource,
  maybeUnionFromDerived,
  maybeUnionFromDead,
  maybeValues,
];
