import { expectTypeOf } from "bun:test";
import { derive, dispose, effect, signal, type Receiver } from "../src";

const receiver = effect(() => {});

expectTypeOf(receiver).toEqualTypeOf<Receiver>();
expectTypeOf(receiver.dispose).toEqualTypeOf<() => void>();

const derived = derive(() => signal(1).value);
expectTypeOf(derived.prevValue).toEqualTypeOf<number | undefined>();
expectTypeOf(dispose(receiver, derived)).toEqualTypeOf<void>();
