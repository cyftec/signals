import { describe, expect, it } from "bun:test";
import { derive, effect, signal } from "../src";

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
  });

  it("does not track signals whose value was not accessed", () => {
    const count = signal(0);
    let runs = 0;
    const watcher = effect(() => {
      runs++;
    });

    count.value = 1;

    expect(runs).toBe(1);
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
  });

  it("updates when its dependency changes", () => {
    const count = signal(0);
    const doubled = derive(() => count.value * 2);

    count.value = 5;

    expect(doubled.value).toBe(10);
  });

  it("tracks multiple dependencies", () => {
    const left = signal(1);
    const right = signal(2);
    const sum = derive(() => left.value + right.value);

    left.value = 5;
    expect(sum.value).toBe(7);

    right.value = 3;
    expect(sum.value).toBe(8);
  });

  it("supports chained derived signals", () => {
    const count = signal(1);
    const doubled = derive(() => count.value * 2);
    const quadrupled = derive(() => doubled.value * 2);

    count.value = 5;

    expect(doubled.value).toBe(10);
    expect(quadrupled.value).toBe(20);
  });

  it("is read-only at runtime and remains internally reactive", () => {
    const count = signal(1);
    const doubled = derive(() => count.value * 2);
    const writableView = doubled as unknown as { value: number };

    expect(() => (writableView.value = 99)).toThrow(
      "Attempted to assign to readonly property",
    );
    expect(doubled.value).toBe(2);

    count.value = 3;
    expect(doubled.value).toBe(6);
  });

  it("does not notify downstream effects when its output is unchanged", () => {
    const count = signal(1);
    const parity = derive(() => count.value % 2);
    const seen: number[] = [];
    const watcher = effect(() => {
      seen.push(parity.value);
    });
    // effect immediately runs for catching signals
    expect(seen).toEqual([1]);

    count.value = 3;
    expect(seen).toEqual([1, 1]);

    count.value = 4;
    expect(seen).toEqual([1, 1, 0]);
  });
});
