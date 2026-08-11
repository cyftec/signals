import { expectTypeOf } from "bun:test";
import {
  op,
  signal,
  type DerivedSignal,
} from "../src";

const count = signal(1);
const text = signal("hello");
const readonlyItems = signal<readonly number[]>([1, 2]);
const user = signal({ name: "Ada" });

const numericResult: DerivedSignal<number> = op(count).add(2).result;
const textLengthCheck: DerivedSignal<boolean> = op(text).lengthEquals(5).truthy;
const readonlyLengthCheck: DerivedSignal<boolean> = op(
  readonlyItems,
).lengthGTE(1).truthy;
const userText: DerivedSignal<string> = user.toString();

expectTypeOf(numericResult).toMatchTypeOf<DerivedSignal<number>>();
expectTypeOf(textLengthCheck).toMatchTypeOf<DerivedSignal<boolean>>();
expectTypeOf(readonlyLengthCheck).toMatchTypeOf<DerivedSignal<boolean>>();
expectTypeOf(userText).toMatchTypeOf<DerivedSignal<string>>();
