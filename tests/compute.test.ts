import { describe, it, expect } from "bun:test";
import { compute, signal, derive } from "../src";

describe("compute", () => {
  it("should create derived signal from function with signal arguments", () => {
    const a = signal(5);
    const b = signal(3);
    const sum = compute((x: number, y: number) => x + y, a, b);

    expect(sum.value).toBe(8);
  });

  it("should recompute when signal arguments change", () => {
    const a = signal(5);
    const b = signal(3);
    const sum = compute((x: number, y: number) => x + y, a, b);

    a.value = 10;
    expect(sum.value).toBe(13);

    b.value = 7;
    expect(sum.value).toBe(17);
  });

  it("should handle plain value arguments", () => {
    const a = signal(5);
    const sum = compute((x: number, y: number) => x + y, a, 3);

    expect(sum.value).toBe(8);

    a.value = 10;
    expect(sum.value).toBe(13);
  });

  it("should recompute only when signal arguments change", () => {
    const a = signal(5);
    let plainB = 3;
    let computeCount = 0;

    const sum = compute(
      (x: number, y: number) => {
        computeCount++;
        return x + y;
      },
      a,
      plainB,
    );

    expect(computeCount).toBe(1); // Initial computation

    a.value = 10;
    expect(computeCount).toBe(2); // Recomputed due to signal change

    a.value = 10; // Setting to same value should not trigger recompute
    expect(computeCount).toBe(2); // No change, no recompute

    plainB = 5; // Changing plain value should not trigger recompute
    expect(computeCount).toBe(2); // No change, no recompute

    a.value = 15;
    expect(computeCount).toBe(3); // Recomputed due to signal change
  });

  it("should handle mixed signal and plain value arguments", () => {
    const a = signal(5);
    const b = signal(3);
    const sum = compute(
      (x: number, y: number, z: number) => x + y + z,
      a,
      b,
      2,
    );

    expect(sum.value).toBe(10);

    a.value = 10;
    expect(sum.value).toBe(15);

    b.value = 7;
    expect(sum.value).toBe(19);
  });

  it("should work with functions of different arities", () => {
    const a = signal(5);
    const single = compute((x: number) => x * 2, a);
    expect(single.value).toBe(10);

    const b = signal(3);
    const c = signal(2);
    const triple = compute(
      (x: number, y: number, z: number) => x + y + z,
      a,
      b,
      c,
    );
    expect(triple.value).toBe(10);

    a.value = 10;
    expect(single.value).toBe(20);
    expect(triple.value).toBe(15);
  });

  it("should work with string arguments", () => {
    const firstName = signal("John");
    const lastName = signal("Doe");
    const fullName = compute(
      (first: string, last: string) => `${first} ${last}`,
      firstName,
      lastName,
    );

    expect(fullName.value).toBe("John Doe");

    firstName.value = "Jane";
    expect(fullName.value).toBe("Jane Doe");
  });

  it("should work with array arguments", () => {
    const arr1 = signal([1, 2, 3]);
    const arr2 = signal([4, 5]);
    const combined = compute(
      (a: number[], b: number[]) => [...a, ...b],
      arr1,
      arr2,
    );

    expect(combined.value).toEqual([1, 2, 3, 4, 5]);

    arr1.value = [10, 20];
    expect(combined.value).toEqual([10, 20, 4, 5]);
  });

  it("should work with object arguments", () => {
    const name = signal({ first: "John", last: "Doe" });
    const age = 30; // Plain value, not a signal
    const fn = (name: { first: string; last: string }, age: number) => ({
      ...name,
      age,
    });
    const person = compute(fn, name, age);

    expect(person.value).toEqual({ first: "John", last: "Doe", age: 30 });

    name.value = { first: "Jane", last: "Smith" };
    expect(person.value).toEqual({ first: "Jane", last: "Smith", age: 30 });
  });

  it("should return a derived signal", () => {
    const a = signal(5);
    const sum = compute((x: number, y: number) => x + y, a, 3);

    expect(sum.type).toBe("derived-signal");
  });

  it("should have dispose method", () => {
    const a = signal(5);
    const sum = compute((x: number, y: number) => x + y, a, 3);
    expect(sum.value).toBe(8); // Initial value

    sum.dispose();
    a.value = 10;
    expect(sum.value).toBe(8); // Should not update
  });

  it("should handle derived signal arguments", () => {
    const a = signal(5);
    const doubled = derive(() => a.value * 2);
    const twoAPlusThree = compute((x: number, y: number) => x + y, doubled, 3);

    expect(twoAPlusThree.value).toBe(13);

    a.value = 10;
    expect(twoAPlusThree.value).toBe(23);
  });

  it("should handle complex computations", () => {
    const base = signal(100);
    const rate = signal(0.1);
    const years = signal(5);

    const interest = compute(
      (b: number, r: number, y: number) => {
        return b * Math.pow(1 + r, y);
      },
      base,
      rate,
      years,
    );

    expect(interest.value).toBeCloseTo(161.051, 3);

    rate.value = 0.05;
    expect(interest.value).toBeCloseTo(127.628, 3);
  });
});
