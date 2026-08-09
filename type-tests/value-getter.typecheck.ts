import { type MaybeSignal, value } from "../src";

type Child = undefined | string | { child: number };
type Children = MaybeSignal<Child>[] | MaybeSignal<Child | Child[]>;

declare const children: Children;

const childrenValue = value(children);

// `value` unwraps only an outer signal. An array containing maybe-signals is
// itself a plain value and its members are therefore preserved.
const expectedChildrenValue: MaybeSignal<Child>[] | Child = childrenValue;
const equivalentChildrenValue: typeof childrenValue = expectedChildrenValue;

void equivalentChildrenValue;
