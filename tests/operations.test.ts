import { describe, it, expect } from "bun:test";
import { op, signal } from "../src";

describe("op - generic operations", () => {
  it("should create operation for boolean values", () => {
    const value = signal(1);
    const operation = op(value);

    expect(operation.truthy.value).toBe(true);
    expect(operation.falsy.value).toBe(false);
  });

  it("should provide truthyFalsyPair getter", () => {
    const value = signal(1);
    expect(op(value).truthyFalsyPair.value).toEqual([true, false]);
  });

  it("should provide ternary method", () => {
    const value = signal(1);
    expect(op(value).then("yes", "no").value).toBe("yes");
  });

  it("should provide or operation", () => {
    const value = signal("");
    expect(op(value).or(true).truthy.value).toBe(true);
    expect(op(value).or(false).truthy.value).toBe(false);
  });

  it("should provide and operation", () => {
    const value = signal("hello");
    expect(op(value).and(true).truthy.value).toBe(true);
    expect(op(value).and(false).truthy.value).toBe(false);
  });

  it("should provide equals operation", () => {
    const value = signal(5);
    expect(op(value).equals(5).truthy.value).toBe(true);
    expect(op(value).equals(10).truthy.value).toBe(false);
  });

  it("should provide notEquals operation", () => {
    const value = signal(5);
    expect(op(value).notEquals(10).truthy.value).toBe(true);
    expect(op(value).notEquals(5).truthy.value).toBe(false);
  });

  it("should support chaining operations", () => {
    const value = signal(5);
    expect(op(value).equals(5).and(true).truthy.value).toBe(true);
    expect(op(value).equals(10).or(true).truthy.value).toBe(true);
  });

  it("should provide orNot operation", () => {
    const value = signal(true);
    expect(op(value).orNot(false).truthy.value).toBe(true);
    expect(op(value).orNot(true).truthy.value).toBe(true);
  });

  it("should provide andNot operation", () => {
    const value = signal(true);
    expect(op(value).andNot(false).truthy.value).toBe(true);
    expect(op(value).andNot(true).truthy.value).toBe(false);
  });

  it("should provide orBothEqual operation", () => {
    const value = signal(false);
    expect(op(value).orBothEqual(5, 5).truthy.value).toBe(true);
    expect(op(value).orBothEqual(5, 10).truthy.value).toBe(false);
  });

  it("should provide orBothUnequal operation", () => {
    const value = signal(false);
    expect(op(value).orBothUnequal(5, 10).truthy.value).toBe(true);
    expect(op(value).orBothUnequal(5, 5).truthy.value).toBe(false);
  });

  it("should provide andBothEqual operation", () => {
    const value = signal(true);
    expect(op(value).andBothEqual(5, 5).truthy.value).toBe(true);
    expect(op(value).andBothEqual(5, 10).truthy.value).toBe(false);
  });

  it("should provide andBothUnequal operation", () => {
    const value = signal(true);
    expect(op(value).andBothUnequal(5, 10).truthy.value).toBe(true);
    expect(op(value).andBothUnequal(5, 5).truthy.value).toBe(false);
  });

  it("should provide orThisIsLT operation", () => {
    const value = signal(false);
    expect(op(value).orThisIsLT(5, 10).truthy.value).toBe(true);
    expect(op(value).orThisIsLT(10, 5).truthy.value).toBe(false);
  });

  it("should provide orThisIsLTE operation", () => {
    const value = signal(false);
    expect(op(value).orThisIsLTE(5, 5).truthy.value).toBe(true);
    expect(op(value).orThisIsLTE(10, 5).truthy.value).toBe(false);
  });

  it("should provide orThisIsGT operation", () => {
    const value = signal(false);
    expect(op(value).orThisIsGT(10, 5).truthy.value).toBe(true);
    expect(op(value).orThisIsGT(5, 10).truthy.value).toBe(false);
  });

  it("should provide orThisIsGTE operation", () => {
    const value = signal(false);
    expect(op(value).orThisIsGTE(5, 5).truthy.value).toBe(true);
    expect(op(value).orThisIsGTE(5, 10).truthy.value).toBe(false);
  });

  it("should provide andThisIsLT operation", () => {
    const value = signal(true);
    expect(op(value).andThisIsLT(5, 10).truthy.value).toBe(true);
    expect(op(value).andThisIsLT(10, 5).truthy.value).toBe(false);
  });

  it("should provide andThisIsLTE operation", () => {
    const value = signal(true);
    expect(op(value).andThisIsLTE(5, 5).truthy.value).toBe(true);
    expect(op(value).andThisIsLTE(10, 5).truthy.value).toBe(false);
  });

  it("should provide andThisIsGT operation", () => {
    const value = signal(true);
    expect(op(value).andThisIsGT(10, 5).truthy.value).toBe(true);
    expect(op(value).andThisIsGT(5, 10).truthy.value).toBe(false);
  });

  it("should provide andThisIsGTE operation", () => {
    const value = signal(6);
    expect(op(value).andThisIsGTE(5, 5).truthy.value).toBe(true);
    expect(op(value).andThisIsGTE(5, 10).truthy.value).toBe(false);
    expect(op(value).or(3).and(2).and(5).result.value).toBe(5);
  });
});

describe("op - number operations", () => {
  it("should create operation for number values", () => {
    const value = signal(5);
    expect(op(value).result.value).toBe(5);
  });

  it("should provide add operation", () => {
    const value = signal(5);
    expect(op(value).add(3).result.value).toBe(8);
  });

  it("should provide sub operation", () => {
    const value = signal(5);
    expect(op(value).sub(3).result.value).toBe(2);
  });

  it("should provide mul operation", () => {
    const value = signal(5);
    expect(op(value).mul(3).result.value).toBe(15);
  });

  it("should provide div operation", () => {
    const value = signal(6);
    expect(op(value).div(3).result.value).toBe(2);
  });

  it("should provide mod operation", () => {
    const value = signal(5);
    expect(op(value).mod(3).result.value).toBe(2);
  });

  it("should provide pow operation", () => {
    const value = signal(2);
    expect(op(value).pow(3).result.value).toBe(8);
  });

  it("should support chaining math operations", () => {
    const value = signal(5);
    expect(op(value).add(3).mul(2).result.value).toBe(16);
  });

  it("should update when input signal changes", () => {
    const value = signal(5);
    const doubled = op(value).add(5);

    expect(doubled.result.value).toBe(10);

    value.value = 10;
    expect(doubled.result.value).toBe(15);
  });

  it("should work with signal arguments", () => {
    const value = signal(5);
    const addend = signal(3);
    const sum = op(value).add(addend);

    expect(sum.result.value).toBe(8);

    addend.value = 5;
    expect(sum.result.value).toBe(10);
  });

  it("should provide isBetween operation", () => {
    const value = signal(15);
    expect(op(value).isBetween(10, 20).truthy.value).toBe(true);
    expect(op(value).isBetween(20, 30).truthy.value).toBe(false);
  });

  it("should provide isBetween with exclusive bounds", () => {
    const value = signal(10);
    expect(op(value).isBetween(10, 20, false, true).truthy.value).toBe(false);
    expect(op(value).isBetween(10, 20, true, false).truthy.value).toBe(true);
  });

  it("should provide isLT operation", () => {
    const value = signal(5);
    expect(op(value).isLT(10).truthy.value).toBe(true);
    expect(op(value).isLT(3).truthy.value).toBe(false);
  });

  it("should provide isLTE operation", () => {
    const value = signal(5);
    expect(op(value).isLTE(5).truthy.value).toBe(true);
    expect(op(value).isLTE(3).truthy.value).toBe(false);
  });

  it("should provide isGT operation", () => {
    const value = signal(10);
    expect(op(value).isGT(5).truthy.value).toBe(true);
    expect(op(value).isGT(15).truthy.value).toBe(false);
  });

  it("should provide isGTE operation", () => {
    const value = signal(10);
    expect(op(value).isGTE(10).truthy.value).toBe(true);
    expect(op(value).isGTE(15).truthy.value).toBe(false);
  });
});

describe("op - string operations", () => {
  it("should create operation for string values", () => {
    const value = signal("hello");
    expect(op(value).lengthEquals(5).truthy.value).toBe(true);
  });

  it("should provide lengthEquals operation", () => {
    const value = signal("hello");
    expect(op(value).lengthEquals(5).truthy.value).toBe(true);
    expect(op(value).lengthEquals(10).truthy.value).toBe(false);
  });

  it("should provide lengthNotEquals operation", () => {
    const value = signal("hello");
    expect(op(value).lengthNotEquals(10).truthy.value).toBe(true);
    expect(op(value).lengthNotEquals(5).truthy.value).toBe(false);
  });

  it("should provide length-less-than operation", () => {
    const value = signal("hello");
    expect(op(value).lengthLT(10).truthy.value).toBe(true);
    expect(op(value).lengthLT(3).truthy.value).toBe(false);
  });

  it("should provide length-less-than-or-equal operation", () => {
    const value = signal("hello");
    expect(op(value).lengthLTE(5).truthy.value).toBe(true);
    expect(op(value).lengthLTE(4).truthy.value).toBe(false);
  });

  it("should provide length-greater-than operation", () => {
    const value = signal("hello");
    expect(op(value).lengthGT(3).truthy.value).toBe(true);
    expect(op(value).lengthGT(10).truthy.value).toBe(false);
  });

  it("should provide length-greater-than-or-equal operation", () => {
    const value = signal("hello");
    expect(op(value).lengthGTE(5).truthy.value).toBe(true);
    expect(op(value).lengthGTE(10).truthy.value).toBe(false);
  });

  it("should provide lengthBetween operation", () => {
    const value = signal("hello");
    expect(op(value).lengthBetween(3, 10).truthy.value).toBe(true);
    expect(op(value).lengthBetween(10, 20).truthy.value).toBe(false);
  });

  it("should update when input string changes", () => {
    const value = signal("hello");
    const lengthGreaterThan3 = op(value).lengthGT(3);

    expect(lengthGreaterThan3.truthy.value).toBe(true);

    value.value = "hi";
    expect(lengthGreaterThan3.truthy.value).toBe(false);
  });
});

describe("op - array operations", () => {
  it("should create operation for array values", () => {
    const value = signal([1, 2, 3]);
    expect(op(value).lengthEquals(3).truthy.value).toBe(true);
  });

  it("should provide lengthEquals operation for arrays", () => {
    const value = signal([1, 2, 3]);
    expect(op(value).lengthEquals(3).truthy.value).toBe(true);
    expect(op(value).lengthEquals(5).truthy.value).toBe(false);
  });

  it("should provide lengthBetween operation for arrays", () => {
    const value = signal([1, 2, 3]);
    expect(op(value).lengthBetween(2, 5).truthy.value).toBe(true);
    expect(op(value).lengthBetween(5, 10).truthy.value).toBe(false);
  });

  it("should update when input array changes", () => {
    const value = signal([1, 2, 3]);
    const lengthGreaterThan2 = op(value).lengthGT(2);

    expect(lengthGreaterThan2.truthy.value).toBe(true);

    value.value = [1];
    expect(lengthGreaterThan2.truthy.value).toBe(false);
  });
});

describe("op - function input", () => {
  it("should handle function input", () => {
    const value = signal(5);
    const operation = op(() => value.value * 2);

    expect(operation.result.value).toBe(10);

    value.value = 10;
    expect(operation.result.value).toBe(20);
  });

  it("should chain operations with function input", () => {
    const value = signal(5);
    const operation = op(() => value.value * 2);

    expect(operation.add(3).result.value).toBe(13);

    value.value = 10;
    expect(operation.add(3).result.value).toBe(23);
  });
});
