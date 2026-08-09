import { expectTypeOf } from "bun:test";
import {
  deadSignal,
  derive,
  MaybeSignal,
  signal,
  type DerivedSignal,
} from "../src";

const acceptsAnyArraySignal = (_source: MaybeSignal<any[]>): void => {};

acceptsAnyArraySignal(signal<string[]>(["one"]));
acceptsAnyArraySignal(signal<(string | number)[]>(["one", 2]));
acceptsAnyArraySignal(signal<unknown[]>(["one", 2, false]));

acceptsAnyArraySignal(derive<string[]>(() => ["one"]));
acceptsAnyArraySignal(derive<(string | number)[]>(() => ["one", 2]));
acceptsAnyArraySignal(derive<unknown[]>(() => ["one", 2, false]));

acceptsAnyArraySignal(deadSignal<string[]>(["one"]));
acceptsAnyArraySignal(deadSignal<(string | number)[]>(["one", 2]));
acceptsAnyArraySignal(deadSignal<unknown[]>(["one", 2, false]));

expectTypeOf(signal<any[]>([]).at(0)).toEqualTypeOf<DerivedSignal<any>>();
