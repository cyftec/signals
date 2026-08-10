import { expectTypeOf } from "bun:test";
import {
  derive,
  signal,
  type DerivedSignal,
  type MaybeSignal,
} from "../src";

const acceptsAnyArraySignal = (_source: MaybeSignal<any[]>): void => {};

acceptsAnyArraySignal(signal<string[]>(["one"]));
acceptsAnyArraySignal(signal<(string | number)[]>(["one", 2]));
acceptsAnyArraySignal(signal<unknown[]>(["one", 2, false]));
acceptsAnyArraySignal(derive<string[]>(() => ["one"]));
acceptsAnyArraySignal(derive<(string | number)[]>(() => ["one", 2]));
acceptsAnyArraySignal(derive<unknown[]>(() => ["one", 2, false]));

expectTypeOf(signal<any[]>([]).at(0)).toEqualTypeOf<DerivedSignal<any>>();
