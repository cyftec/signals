import { describe, expect, it } from "bun:test";
import { promstates } from "../src";

describe("promstates", () => {
  it("should create promise state signals", () => {
    const promiseFn = async (value: number) => value * 2;
    const [runPromise, result, error, isRunning] = promstates(promiseFn);

    expect(result.value).toBe(undefined);
    expect(error.value).toBe(undefined);
    expect(isRunning.value).toBe(false);
  });

  it("should track running state while the promise is pending", async () => {
    let resolvePromise!: (value: number) => void;
    const promiseFn = () =>
      new Promise<number>((resolve) => {
        resolvePromise = resolve;
      });
    const [runPromise, , , isRunning] = promstates(promiseFn);

    const pending = runPromise();
    expect(isRunning.value).toBe(true);

    resolvePromise(42);
    await pending;
    expect(isRunning.value).toBe(false);
  });

  it("should update result on successful promise completion", async () => {
    const promiseFn = async (value: number) => value * 2;
    const [runPromise, result] = promstates(promiseFn);

    expect(result.value).toBe(undefined);
    await runPromise(5);
    expect(result.value).toBe(10);
  });

  it("should update error on promise failure", async () => {
    const promiseFn = async () => {
      throw new Error("Test error");
    };
    const [runPromise, , error] = promstates(promiseFn);

    expect(error.value).toBe(undefined);
    await runPromise();
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value?.message).toBe("Test error");
  });

  it("should preserve previous result on error", async () => {
    const promiseFn = async (value: number) => {
      if (value < 0) throw new Error("Negative value");
      return value * 2;
    };
    const [runPromise, result, error] = promstates(promiseFn, 0);

    await runPromise(5);
    expect(result.value).toBe(10);
    expect(error.value).toBe(undefined);

    await runPromise(-1);
    expect(result.value).toBe(10); // Preserved
    expect(error.value).toBeInstanceOf(Error);
  });

  it("should reset error on success", async () => {
    const promiseFn = async (value: number) => {
      if (value < 0) throw new Error("Negative value");
      return value * 2;
    };
    const [runPromise, result, error] = promstates(promiseFn, 0);

    await runPromise(5);
    expect(result.value).toBe(10);
    expect(error.value).toBe(undefined); // Initially undefined

    await runPromise(-1);
    expect(error.value).toBeInstanceOf(Error);
    expect(result.value).toBe(10); // Preserved

    await runPromise(3);
    expect(error.value).toBe(undefined); // Reset
    expect(result.value).toBe(6);
  });

  it("should run ultimately callback in finally block", async () => {
    let finallyCalled = false;
    const promiseFn = async (value: number) => value * 2;
    const ultimately = () => {
      finallyCalled = true;
    };
    const [runPromise] = promstates(promiseFn, 0, ultimately);

    expect(finallyCalled).toBe(false);
    await runPromise(5);
    expect(finallyCalled).toBe(true);
  });

  it("should run ultimately callback on error", async () => {
    let finallyCalled = false;
    const promiseFn = async () => {
      throw new Error("Test error");
    };
    const ultimately = () => {
      finallyCalled = true;
    };
    const [runPromise] = promstates(promiseFn, 0, ultimately);

    expect(finallyCalled).toBe(false);
    await runPromise().catch(() => {});
    expect(finallyCalled).toBe(true);
  });

  it("should allow running promise multiple times", async () => {
    const promiseFn = async (value: number) => value * 2;
    const [runPromise, result] = promstates(promiseFn, 0);

    await runPromise(5);
    expect(result.value).toBe(10);

    await runPromise(10);
    expect(result.value).toBe(20);
  });

  it("should handle complex promise types", async () => {
    const promiseFn = async (data: { name: string }) => ({
      ...data,
      timestamp: Date.now(),
    });
    const [runPromise, result] = promstates(promiseFn);

    await runPromise({ name: "test" });
    expect(result.value).toEqual({
      name: "test",
      timestamp: expect.any(Number),
    });
  });

  it("should return derived signals", () => {
    const promiseFn = async (value: number) => value * 2;
    const [runPromise, result, error, isRunning] = promstates(promiseFn);

    expect(result.type).toBe("derived-signal");
    expect(error.type).toBe("derived-signal");
    expect(isRunning.type).toBe("derived-signal");
  });

  it("should handle async functions with multiple arguments", async () => {
    const promiseFn = async (a: number, b: number) => a + b;
    const [runPromise, result] = promstates(promiseFn);

    await runPromise(5, 3);
    expect(result.value).toBe(8);
  });
});
