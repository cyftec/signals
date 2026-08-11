import { describe, it, expect } from "bun:test";
import {
  value,
  valueIsSourceSignal,
  valueIsDerivedSignal,
  valueIsSignal,
  valueIsMaybeSignalValueOfStringOrArray,
  getPlainMethodParams,
  effect,
  signal,
  derive,
} from "../src";

describe("value utility", () => {
  it("should return plain value from source signal", () => {
    const count = signal(43);
    expect(count).toMatchObject({ type: "source-signal" });
    expect(value(count)).toBe(43);
  });

  it("should return plain value from derived signal", () => {
    const count = signal(42);
    const doubled = derive(() => count.value * 2);
    expect(doubled).toMatchObject({ type: "derived-signal" });
    expect(value(doubled)).toBe(84);
  });

  it("should return plain value as-is", () => {
    expect(value(42)).toBe(42);
  });

  it("should handle null", () => {
    expect(value(null)).toBe(null);
  });

  it("should handle undefined", () => {
    expect(value(undefined)).toBe(undefined);
  });

  it("collects an outer source signal when unwrapping during effect installation", () => {
    const count = signal(1);
    const seen: number[] = [];

    effect(() => {
      seen.push(value(count));
    });
    count.value = 2;

    expect(seen).toEqual([1, 2]);
  });

  it("leaves nested signals unchanged", () => {
    const nested = signal(1);
    const container = { nested };

    expect(value(container)).toBe(container);
  });
});

describe("getPlainMethodParams", () => {
  it("unwraps source and derived signal arguments in order", () => {
    const source = signal(2);
    const derived = derive(() => source.value * 3);

    expect(getPlainMethodParams(source, "plain", derived)).toEqual([
      2,
      "plain",
      6,
    ]);
  });
});

describe("valueIsSourceSignal", () => {
  it("should return true for source signal", () => {
    const count = signal(42);
    expect(valueIsSourceSignal(count)).toBe(true);
  });

  it("should return false for derived signal", () => {
    const count = signal(42);
    const doubled = derive(() => count.value * 2);
    expect(valueIsSourceSignal(doubled)).toBe(false);
  });

  it("should return false for plain value", () => {
    expect(valueIsSourceSignal(42)).toBe(false);
  });

  it("should return false for null", () => {
    expect(valueIsSourceSignal(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(valueIsSourceSignal(undefined)).toBe(false);
  });
});

describe("valueIsDerivedSignal", () => {
  it("should return true for derived signal", () => {
    const count = signal(42);
    const doubled = derive(() => count.value * 2);
    expect(valueIsDerivedSignal(doubled)).toBe(true);
  });

  it("should return false for source signal", () => {
    const count = signal(42);
    expect(valueIsDerivedSignal(count)).toBe(false);
  });

  it("should return false for plain value", () => {
    expect(valueIsDerivedSignal(42)).toBe(false);
  });

  it("should return false for null", () => {
    expect(valueIsDerivedSignal(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(valueIsDerivedSignal(undefined)).toBe(false);
  });
});

describe("valueIsSignal", () => {
  it("should return true for source signal", () => {
    const count = signal(42);
    expect(valueIsSignal(count)).toBe(true);
  });

  it("should return true for derived signal", () => {
    const count = signal(42);
    const doubled = derive(() => count.value * 2);
    expect(valueIsSignal(doubled)).toBe(true);
  });

  it("should return false for plain value", () => {
    expect(valueIsSignal(42)).toBe(false);
  });

  it("should return false for null", () => {
    expect(valueIsSignal(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(valueIsSignal(undefined)).toBe(false);
  });
});

describe("runtime guard structure", () => {
  it("recognizes matching discriminators without validating signal members", () => {
    const sourceLike = { type: "source-signal" };
    const derivedLike = { type: "derived-signal" };

    expect(valueIsSourceSignal(sourceLike)).toBe(true);
    expect(valueIsDerivedSignal(derivedLike)).toBe(true);
    expect(valueIsSignal(sourceLike)).toBe(true);
    expect(valueIsSignal(derivedLike)).toBe(true);
  });
});

describe("valueIsSignal", () => {
  it("should return true for source signal", () => {
    const count = signal(42);
    expect(valueIsSignal(count)).toBe(true);
  });

  it("should return true for derived signal", () => {
    const count = signal(42);
    const doubled = derive(() => count.value * 2);
    expect(valueIsSignal(doubled)).toBe(true);
  });

  it("should return false for plain value", () => {
    expect(valueIsSignal(42)).toBe(false);
  });

  it("should return false for null", () => {
    expect(valueIsSignal(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(valueIsSignal(undefined)).toBe(false);
  });
});

describe("valueIsMaybeSignalValueOfStringOrArray", () => {
  it("should return true for string", () => {
    expect(valueIsMaybeSignalValueOfStringOrArray("hello")).toBe(true);
  });

  it("should return true for array", () => {
    expect(valueIsMaybeSignalValueOfStringOrArray([1, 2, 3])).toBe(true);
  });

  it("should return true for signal string", () => {
    const text = signal("hello");
    expect(valueIsMaybeSignalValueOfStringOrArray(text)).toBe(true);
  });

  it("should return true for signal array", () => {
    const arr = signal([1, 2, 3]);
    expect(valueIsMaybeSignalValueOfStringOrArray(arr)).toBe(true);
  });

  it("should return false for number", () => {
    expect(valueIsMaybeSignalValueOfStringOrArray(42)).toBe(false);
  });

  it("should return false for boolean", () => {
    expect(valueIsMaybeSignalValueOfStringOrArray(true)).toBe(false);
  });

  it("should return false for object", () => {
    expect(valueIsMaybeSignalValueOfStringOrArray({})).toBe(false);
  });

  it("should return false for null", () => {
    expect(valueIsMaybeSignalValueOfStringOrArray(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(valueIsMaybeSignalValueOfStringOrArray(undefined)).toBe(false);
  });
});
