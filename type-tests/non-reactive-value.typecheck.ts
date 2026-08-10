import { derive, signal, type BaseDerivedSignal, type BaseSourceSignal } from "../src";

const source = signal(1);
const derived = derive(() => "ready");

const sourceValue: number = source.nonReactiveValue;
const derivedValue: string = derived.nonReactiveValue;

const baseSource: BaseSourceSignal<number> = source;
const baseDerived: BaseDerivedSignal<string> = derived;

// @ts-expect-error nonReactiveValue is read-only on source signals.
source.nonReactiveValue = 2;
// @ts-expect-error nonReactiveValue is read-only on derived signals.
derived.nonReactiveValue = "changed";

void sourceValue;
void derivedValue;
void baseSource;
void baseDerived;
