import { expectTypeOf } from "bun:test";
import { effect, type Receiver } from "../src";

const receiver = effect(() => {});

expectTypeOf(receiver).toEqualTypeOf<Receiver>();
expectTypeOf(receiver.dispose).toEqualTypeOf<() => void>();
