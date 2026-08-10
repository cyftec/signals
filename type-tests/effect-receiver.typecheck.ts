import { expectTypeOf } from "bun:test";
import {
  effect,
  type Receiver,
  type SignalConnector,
  type SignalsReceptionManager,
} from "../src";

const receiver = effect(() => {});

expectTypeOf(receiver).toEqualTypeOf<Receiver>();
expectTypeOf(receiver.dispose).toEqualTypeOf<() => void>();
expectTypeOf<SignalConnector>().toEqualTypeOf<SignalsReceptionManager>();
