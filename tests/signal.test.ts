import { describe, expect, it } from "bun:test";
import { deadSignal, derive, dispose, effect, signal } from "../src";

describe("signal", () => {
  it("creates a source signal with its initial value and type", () => {
    const count = signal(0);

    expect(count.value).toBe(0);
    expect(count.type).toBe("source-signal");
  });

  it("updates value and retains the previous value", () => {
    const count = signal(0);

    expect(count.prevValue).toBeUndefined();

    count.value = 1;
    expect(count.value).toBe(1);
    expect(count.prevValue).toBe(0);

    count.value = 2;
    expect(count.value).toBe(2);
    expect(count.prevValue).toBe(1);
  });

  it("does not update prevValue or trigger effects for an unchanged value", () => {
    const count = signal(0);
    let runs = 0;
    const watcher = effect(() => {
      runs++;
      void count.value;
    });

    count.value = 1;
    expect(runs).toBe(2);
    expect(count.prevValue).toBe(0);

    count.value = 1;
    expect(runs).toBe(2);
    expect(count.prevValue).toBe(0);

    watcher.dispose();
  });

  it("supports null, undefined, string, and boolean values", () => {
    expect(signal(null).value).toBeNull();
    expect(signal(undefined).value).toBeUndefined();
    expect(signal("hello").value).toBe("hello");
    expect(signal(true).value).toBe(true);
  });

  it("isolates an object from its initial input and returned values", () => {
    const initial = { nested: { count: 1 } };
    const state = signal(initial);

    initial.nested.count = 2;
    expect(state.value).toEqual({ nested: { count: 1 } });

    const returnedValue = state.value;
    returnedValue.nested.count = 3;
    expect(state.value).toEqual({ nested: { count: 1 } });
  });

  it("isolates an array from its initial input and returned values", () => {
    const initial = [{ count: 1 }];
    const state = signal(initial);

    initial[0].count = 2;
    initial.push({ count: 3 });
    expect(state.value).toEqual([{ count: 1 }]);

    const returnedValue = state.value;
    returnedValue[0].count = 4;
    returnedValue.push({ count: 5 });
    expect(state.value).toEqual([{ count: 1 }]);
  });

  it("stops notifying effects immediately when disposed", () => {
    const count = signal(0);
    let runs = 0;
    effect(() => {
      runs++;
      void count.value;
    });

    count.dispose();
    count.value = 1;
    count.value = 2;

    expect(runs).toBe(1);
    expect(count.value).toBe(2);
  });
});

describe("effect", () => {
  it("runs immediately when created", () => {
    let runs = 0;
    const count = signal(0);
    const watcher = effect(() => {
      runs++;
      void count.value;
    });

    expect(runs).toBe(1);
    watcher.dispose();
  });

  it("runs synchronously when an accessed signal changes", () => {
    const count = signal(0);
    const seen: number[] = [];
    const watcher = effect(() => {
      seen.push(count.value);
    });

    count.value = 1;
    expect(seen).toEqual([0, 1]);

    count.value = 2;
    expect(seen).toEqual([0, 1, 2]);

    watcher.dispose();
  });

  it("tracks multiple signals", () => {
    const left = signal(1);
    const right = signal(2);
    const seen: number[] = [];
    const watcher = effect(() => {
      seen.push(left.value + right.value);
    });

    left.value = 3;
    right.value = 4;

    expect(seen).toEqual([3, 5, 7]);
    watcher.dispose();
  });

  it("registers only one rerun when a signal is read repeatedly", () => {
    const count = signal(0);
    let runs = 0;
    const watcher = effect(() => {
      runs++;
      void count.value;
      void count.value;
      void count.value;
    });

    count.value = 1;

    expect(runs).toBe(2);
    watcher.dispose();
  });

  it("does not track signals whose value was not accessed", () => {
    const count = signal(0);
    let runs = 0;
    const watcher = effect(() => {
      runs++;
    });

    count.value = 1;

    expect(runs).toBe(1);
    watcher.dispose();
  });

  it("retains dependencies accessed during the initial conditional branch", () => {
    const count = signal(0);
    const shouldAccess = signal(true);
    let runs = 0;
    const watcher = effect(() => {
      runs++;
      if (shouldAccess.value) void count.value;
    });

    count.value = 1;
    shouldAccess.value = false;
    count.value = 2;

    expect(runs).toBe(4);
    watcher.dispose();
  });

  it("does not add dependencies missed during the initial conditional branch", () => {
    const count = signal(0);
    const shouldAccess = signal(false);
    let runs = 0;
    const watcher = effect(() => {
      runs++;
      if (shouldAccess.value) void count.value;
    });

    count.value = 1;
    expect(runs).toBe(1);

    shouldAccess.value = true;
    expect(runs).toBe(2);

    count.value = 2;
    expect(runs).toBe(2);

    watcher.dispose();
  });

  it("tracks a derived signal as a dependency", () => {
    const count = signal(1);
    const doubled = derive(() => count.value * 2);
    const seen: number[] = [];
    const watcher = effect(() => {
      seen.push(doubled.value);
    });

    count.value = 2;

    expect(seen).toEqual([2, 4]);
    dispose(watcher, doubled);
  });

  it("exposes disposal state and clears dependent signals", () => {
    const source = signal(0);
    const dependent = signal(1);
    const watcher = effect(() => {
      void source.value;
    });

    expect(watcher.isDisposed).toBe(false);
    expect(watcher.dependentSignals.size).toBe(0);

    watcher.registerDependentSignal(dependent);
    expect(watcher.dependentSignals).toEqual(new Set([dependent]));

    watcher.dispose();
    expect(watcher.isDisposed).toBe(true);
    expect(watcher.dependentSignals.size).toBe(0);
  });

  it("unsubscribes immediately when disposed", () => {
    const count = signal(0);
    let runs = 0;
    const watcher = effect(() => {
      runs++;
      void count.value;
    });

    watcher.dispose();
    count.value = 1;
    count.value = 2;

    expect(runs).toBe(1);
  });

  it("throws when disposed more than once", () => {
    const watcher = effect(() => {});

    watcher.dispose();

    expect(() => watcher.dispose()).toThrow(
      "This receiver is already destroyed.",
    );
  });

  it("clears dependency collection after an initial callback throws", () => {
    const count = signal(0);

    expect(() =>
      effect(() => {
        throw new Error("initial failure");
      }),
    ).toThrow("initial failure");

    void count.value;

    expect(() => {
      count.value = 1;
    }).not.toThrow();
  });
});

describe("derive", () => {
  it("creates a derived signal with its computed value and type", () => {
    const count = signal(42);
    const doubled = derive(() => count.value * 2);

    expect(doubled.value).toBe(84);
    expect(doubled.type).toBe("derived-signal");

    doubled.dispose();
  });

  it("updates when its dependency changes", () => {
    const count = signal(0);
    const doubled = derive(() => count.value * 2);

    count.value = 5;

    expect(doubled.value).toBe(10);
    doubled.dispose();
  });

  it("retains the previous computed value", () => {
    const count = signal(1);
    const doubled = derive(() => count.value * 2);

    expect(doubled.value).toBe(2);
    expect(doubled.prevValue).toBeUndefined();

    count.value = 5;
    expect(doubled.value).toBe(10);
    expect(doubled.prevValue).toBe(2);

    count.value = 13;
    expect(doubled.value).toBe(26);
    expect(doubled.prevValue).toBe(10);

    doubled.dispose();
  });

  it("tracks multiple dependencies", () => {
    const left = signal(1);
    const right = signal(2);
    const sum = derive(() => left.value + right.value);

    left.value = 5;
    expect(sum.value).toBe(7);

    right.value = 3;
    expect(sum.value).toBe(8);

    sum.dispose();
  });

  it("supports chained derived signals", () => {
    const count = signal(1);
    const doubled = derive(() => count.value * 2);
    const quadrupled = derive(() => doubled.value * 2);

    count.value = 5;

    expect(doubled.value).toBe(10);
    expect(quadrupled.value).toBe(20);
    dispose(quadrupled, doubled);
  });

  it("passes the previous computed value to its evaluator", () => {
    const count = signal(1);
    const previousValues: (number | undefined)[] = [];
    const doubled = derive((previousValue: number | undefined) => {
      previousValues.push(previousValue);
      return count.value * 2;
    });

    count.value = 5;
    count.value = 11;
    count.value = 42;

    expect(previousValues).toEqual([undefined, 2, 10, 22]);
    expect(doubled.value).toBe(84);
    doubled.dispose();
  });

  it("is read-only at runtime and remains internally reactive", () => {
    const count = signal(1);
    const doubled = derive(() => count.value * 2);
    const writableView = doubled as unknown as { value: number };

    writableView.value = 99;
    expect(doubled.value).toBe(2);

    count.value = 3;
    expect(doubled.value).toBe(6);

    doubled.dispose();
  });

  it("does not notify downstream effects when its output is unchanged", () => {
    const count = signal(1);
    const parity = derive(() => count.value % 2);
    const seen: number[] = [];
    const watcher = effect(() => {
      seen.push(parity.value);
    });

    count.value = 3;
    expect(seen).toEqual([1]);

    count.value = 4;
    expect(seen).toEqual([1, 0]);

    dispose(watcher, parity);
  });

  it("does not add dependencies missed during its initial conditional branch", () => {
    const count = signal(1);
    const shouldAccess = signal(false);
    let computations = 0;
    const selected = derive(() => {
      computations++;
      return shouldAccess.value ? count.value : -1;
    });

    count.value = 2;
    expect(computations).toBe(1);
    expect(selected.value).toBe(-1);

    shouldAccess.value = true;
    expect(computations).toBe(2);
    expect(selected.value).toBe(2);

    count.value = 3;
    expect(computations).toBe(2);
    expect(selected.value).toBe(2);

    selected.dispose();
  });

  it("retains dependencies accessed during its initial conditional branch", () => {
    const count = signal(1);
    const shouldAccess = signal(true);
    let computations = 0;
    const selected = derive(() => {
      computations++;
      return shouldAccess.value ? count.value : -1;
    });

    shouldAccess.value = false;
    count.value = 2;

    expect(computations).toBe(3);
    expect(selected.value).toBe(-1);

    selected.dispose();
  });

  it("stops updating and notifying downstream effects after disposal", () => {
    const count = signal(1);
    const doubled = derive(() => count.value * 2);
    const seen: number[] = [];
    const watcher = effect(() => {
      seen.push(doubled.value);
    });

    doubled.dispose();
    count.value = 2;

    expect(doubled.value).toBe(2);
    expect(seen).toEqual([2]);
    watcher.dispose();
  });
});

describe("deadSignal", () => {
  it("is read-only at runtime", () => {
    const value = deadSignal({ count: 1 });
    const writableView = value as unknown as { value: { count: number } };

    writableView.value = { count: 99 };

    expect(value.type).toBe("dead-signal");
    expect(value.value).toEqual({ count: 1 });
    expect(() => value.dispose()).not.toThrow();
    expect(value.value).toEqual({ count: 1 });
  });
});

describe("dispose", () => {
  it("disposes a single derived signal", () => {
    const count = signal(1);
    const doubled = derive(() => count.value * 2);

    dispose(doubled);
    count.value = 5;

    expect(doubled.value).toBe(2);
  });

  it("disposes a single effect", () => {
    const count = signal(0);
    let runs = 0;
    const watcher = effect(() => {
      runs++;
      void count.value;
    });

    dispose(watcher);
    count.value = 5;

    expect(runs).toBe(1);
    expect(watcher.isDisposed).toBe(true);
  });

  it("disposes every derived signal passed to it", () => {
    const text = signal("hello");
    const upper = derive(() => text.value.toUpperCase());
    const count = signal(0);
    const doubled = derive(() => count.value * 2);
    const tripled = derive(() => count.value * 3);

    dispose(doubled, tripled, upper);
    count.value = 5;
    text.value = "world";

    expect(doubled.value).toBe(0);
    expect(tripled.value).toBe(0);
    expect(upper.value).toBe("HELLO");
  });

  it("disposes every effect passed to it", () => {
    const count = signal(0);
    let firstRuns = 0;
    let secondRuns = 0;
    const first = effect(() => {
      firstRuns++;
      void count.value;
    });
    const second = effect(() => {
      secondRuns++;
      void count.value;
    });

    dispose(first, second);
    count.value = 5;

    expect(firstRuns).toBe(1);
    expect(secondRuns).toBe(1);
    expect(first.isDisposed).toBe(true);
    expect(second.isDisposed).toBe(true);
  });

  it("disposes mixed derived signals and effects", () => {
    const count = signal(0);
    const doubled = derive(() => count.value * 2);
    let runs = 0;
    const watcher = effect(() => {
      runs++;
      void count.value;
    });

    dispose(doubled, watcher);
    count.value = 5;

    expect(doubled.value).toBe(0);
    expect(runs).toBe(1);
    expect(watcher.isDisposed).toBe(true);
  });

  it("accepts an empty argument list", () => {
    expect(() => dispose()).not.toThrow();
  });
});
