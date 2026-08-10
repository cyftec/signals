import { describe, expect, it } from "bun:test";
import { deadZone, derive, effect, signal } from "../src";

describe("deadZone", () => {
  it("returns the callback result", () => {
    expect(deadZone(() => "result")).toBe("result");
  });

  it("does not collect source reads made inside an installing effect", () => {
    const tracked = signal(1);
    const ignored = signal(2);
    const seen: number[] = [];

    effect(() => {
      seen.push(tracked.value + deadZone(() => ignored.value));
    });
    // effect method runs immediately
    expect(seen).toEqual([3]);

    ignored.value = 3;
    expect(seen).toEqual([3]);

    tracked.value = 2;
    expect(seen).toEqual([3, 5]);
  });

  it("continues collecting reads before and after a dead zone", () => {
    const before = signal(1);
    const ignored = signal(2);
    const after = signal(3);
    let runs = 0;

    effect(() => {
      runs++;
      void before.value;
      deadZone(() => ignored.value);
      void after.value;
    });

    ignored.value = 4;
    expect(runs).toBe(1);

    before.value = 2;
    after.value = 4;
    expect(runs).toBe(3);
  });

  it("does not collect source reads reached through a derived signal", () => {
    const source = signal(2);
    const doubled = derive(() => source.value * 2);
    const seen: number[] = [];

    effect(() => {
      seen.push(deadZone(() => doubled.value));
    });

    source.value = 3;

    expect(seen).toEqual([4]);
  });

  it("supports nested zones and restores collection after each one", () => {
    const tracked = signal(1);
    const ignored = signal(2);
    let runs = 0;

    effect(() => {
      runs++;
      deadZone(() => deadZone(() => ignored.value));
      void tracked.value;
    });

    ignored.value = 3;
    tracked.value = 2;

    expect(runs).toBe(2);
  });

  it("propagates errors and restores collection when the error is handled", () => {
    const tracked = signal(1);
    const ignored = signal(2);
    const afterError = signal(3);
    let runs = 0;

    effect(() => {
      runs++;
      void tracked.value;
      try {
        deadZone(() => {
          void ignored.value;
          throw new Error("dead-zone failure");
        });
      } catch (error) {
        expect(error).toEqual(new Error("dead-zone failure"));
      }
      void afterError.value;
    });

    ignored.value = 4;
    tracked.value = 2;
    afterError.value = 4;

    expect(runs).toBe(3);
  });
});

describe("nonReactiveValue", () => {
  it("reads a source value without collecting it as an effect dependency", () => {
    const count = signal(1);
    const seen: number[] = [];

    effect(() => {
      seen.push(count.nonReactiveValue);
    });

    count.value = 2;

    expect(seen).toEqual([1]);
    expect(count.nonReactiveValue).toBe(2);
  });

  it("evaluates a derived value without collecting its source reads", () => {
    const count = signal(1);
    const doubled = derive(() => count.value * 2);
    const seen: number[] = [];

    effect(() => {
      seen.push(doubled.nonReactiveValue);
    });

    count.value = 2;

    expect(seen).toEqual([2]);
    expect(doubled.nonReactiveValue).toBe(4);
  });

  it("does not accidentally collect a signal while assigning its data methods", () => {
    const input = signal([1]);
    let localSource: ReturnType<typeof signal<number[]>> | undefined;
    let derived: ReturnType<typeof derive<number[]>> | undefined;
    let runs = 0;

    effect(() => {
      runs++;
      localSource = signal([1]);
      derived = derive(() => input.value);
    });

    localSource!.mutate.push(2);
    input.value = [2];

    expect(runs).toBe(1);
    expect(derived!.value).toEqual([2]);
  });
});
