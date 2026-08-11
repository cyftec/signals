import { describe, expect, it } from "bun:test";
import { derive, dispose, effect, signal } from "../src";

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

  it("updates through mutateWith using the stored current value", () => {
    const count = signal(2);
    let effectRuns = 0;
    effect(() => {
      void count.value;
      effectRuns++;
    });

    expect(count.mutateWith((value) => value * 3)).toBeUndefined();
    expect(count.value).toBe(6);
    expect(count.prevValue).toBe(2);
    expect(effectRuns).toBe(2);
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
        void count.value;
        throw new Error("initial failure");
      }),
    ).toThrow("initial failure");

    expect(() => {
      count.value = 1;
    }).not.toThrow();
  });

  it("stops automatic reruns for every dependency after disposal", () => {
    const left = signal(1);
    const right = signal(2);
    const seen: number[] = [];
    const receiver = effect(() => {
      seen.push(left.value + right.value);
    });

    receiver.dispose();
    left.value = 3;
    right.value = 4;

    expect(seen).toEqual([3]);
  });

  it("keeps other receivers connected when one receiver is disposed", () => {
    const count = signal(0);
    const firstSeen: number[] = [];
    const secondSeen: number[] = [];
    const first = effect(() => {
      firstSeen.push(count.value);
    });
    effect(() => {
      secondSeen.push(count.value);
    });

    first.dispose();
    count.value = 1;

    expect(firstSeen).toEqual([0]);
    expect(secondSeen).toEqual([0, 1]);
  });

  it("makes disposal idempotent", () => {
    const count = signal(0);
    let runs = 0;
    const receiver = effect(() => {
      runs++;
      void count.value;
    });

    receiver.dispose();
    receiver.dispose();
    count.value = 1;

    expect(runs).toBe(1);
  });

  it("skips a receiver disposed by an earlier receiver during the same write", () => {
    const count = signal(0);
    const seen: string[] = [];
    let second: ReturnType<typeof effect>;
    effect(() => {
      if (count.value === 1) second.dispose();
      seen.push("first");
    });
    second = effect(() => {
      void count.value;
      seen.push("second");
    });

    count.value = 1;

    expect(seen).toEqual(["first", "second", "first"]);
  });

  it("still permits manual runs after disposal without reconnecting dependencies", () => {
    const count = signal(0);
    const seen: number[] = [];
    const receiver = effect(() => {
      seen.push(count.value);
    });

    receiver.dispose();
    receiver.run();
    count.value = 1;

    expect(seen).toEqual([0, 0]);
  });
});

describe("derive", () => {
  it("creates a derived signal with its computed value and type", () => {
    const count = signal(42);
    const doubled = derive(() => count.value * 2);

    expect(doubled.value).toBe(84);
    expect(doubled.type).toBe("derived-signal");
  });

  it("computes eagerly once and reads its stored result without recomputing", () => {
    const count = signal(2);
    let computations = 0;
    const doubled = derive(() => {
      computations++;
      return count.value * 2;
    });

    expect(computations).toBe(1);
    expect(doubled.value).toBe(4);
    expect(doubled.value).toBe(4);
    expect(doubled.nonReactiveValue).toBe(4);
    expect(computations).toBe(1);
  });

  it("updates when its dependency changes", () => {
    const count = signal(0);
    const doubled = derive(() => count.value * 2);

    count.value = 5;

    expect(doubled.value).toBe(10);
  });

  it("exposes the preceding computed value through prevValue", () => {
    const count = signal(1);
    const doubled = derive(() => count.value * 2);

    expect(doubled.prevValue).toBeUndefined();

    count.value = 3;
    expect(doubled.value).toBe(6);
    expect(doubled.prevValue).toBe(2);
  });

  it("passes the backing signal previous value to its catcher", () => {
    const count = signal(1);
    const catcherPreviousValues: Array<number | undefined> = [];
    const doubled = derive<number>((previousValue) => {
      catcherPreviousValues.push(previousValue);
      return count.value * 2;
    });

    count.value = 2;
    count.value = 3;

    expect(doubled.value).toBe(6);
    expect(catcherPreviousValues).toEqual([undefined, undefined, 2]);
    expect(doubled.prevValue).toBe(4);
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

  it("keeps only the dependencies captured during its initial computation", () => {
    const chooseLeft = signal(true);
    const left = signal(1);
    const right = signal(10);
    let computations = 0;
    const selected = derive(() => {
      computations++;
      return chooseLeft.value ? left.value : right.value;
    });

    chooseLeft.value = false;
    expect(selected.value).toBe(10);

    right.value = 20;
    expect(selected.value).toBe(10);

    left.value = 2;
    expect(selected.value).toBe(20);
    expect(computations).toBe(3);
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
    expect(seen).toEqual([1]);

    count.value = 3;
    expect(seen).toEqual([1]);

    count.value = 4;
    expect(seen).toEqual([1, 0]);
  });

  it("stops recomputing and freezes its value after disposal", () => {
    const count = signal(2);
    let computations = 0;
    const doubled = derive(() => {
      computations++;
      return count.value * 2;
    });

    doubled.dispose();
    doubled.dispose();
    count.value = 3;

    expect(doubled.value).toBe(4);
    expect(doubled.prevValue).toBeUndefined();
    expect(computations).toBe(1);
  });
});

describe("dispose", () => {
  it("disposes derived signals and receivers in argument order", () => {
    const source = signal(1);
    const doubled = derive(() => source.value * 2);
    const seen: number[] = [];
    const watcher = effect(() => {
      seen.push(doubled.value);
    });

    expect(dispose(doubled, watcher)).toBeUndefined();
    source.value = 2;

    expect(doubled.value).toBe(2);
    expect(seen).toEqual([2]);
  });
});
