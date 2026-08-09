import { describe, expect, it } from "bun:test";
import { derive, effect, receive, signal, transmit } from "../src";

describe("receive", () => {
  it("should connect multiple transmitters to a receiver", () => {
    const transmitter1 = signal("Hello");
    const transmitter2 = signal("World");
    const receiver = signal("");

    receive(receiver, transmitter1, transmitter2);

    transmitter1.value = "Hi";
    expect(receiver.value).toBe("Hi");

    transmitter2.value = "There";
    expect(receiver.value).toBe("There");
  });

  it("should return array of effects for disposal", () => {
    const transmitter1 = signal("Hello");
    const transmitter2 = signal("World");
    const receiver = signal("");

    const effects = receive(receiver, transmitter1, transmitter2);

    expect(Array.isArray(effects)).toBe(true);
    expect(effects.length).toBe(2);
    expect(effects[0].dispose).toBeInstanceOf(Function);
    expect(effects[1].dispose).toBeInstanceOf(Function);
  });

  // TODO: should throw error if no transmitters are provided
  it("should handle empty transmitters array", () => {
    const receiver = signal("");
    const effects = receive(receiver);

    expect(effects).toEqual([]);
  });

  it("should handle single transmitter", () => {
    const transmitter = signal("Hello");
    const receiver = signal("");

    const effects = receive(receiver, transmitter);

    transmitter.value = "Hi";
    expect(receiver.value).toBe("Hi");

    expect(effects.length).toBe(1);
  });

  it("should allow receiver to be updated independently", () => {
    const transmitter1 = signal("Hello");
    const transmitter2 = signal("World");
    const receiver = signal("");

    receive(receiver, transmitter1, transmitter2);

    receiver.value = "Manual update";
    expect(receiver.value).toBe("Manual update");

    transmitter1.value = "Hi";
    expect(receiver.value).toBe("Hi");
  });

  it("should work with derived signals as transmitters", () => {
    const base1 = signal(5);
    const base2 = signal(3);
    const derived1 = derive(() => base1.value * 2);
    const derived2 = derive(() => base2.value * 3);
    const receiver = signal(0);

    receive(receiver, derived1, derived2);

    base1.value = 10;
    expect(receiver.value).toBe(20);

    base2.value = 5;
    expect(receiver.value).toBe(15);
  });

  it("should dispose connections when effects are disposed", () => {
    const transmitter1 = signal("Hello");
    const transmitter2 = signal("World");
    const receiver = signal("");

    const effects = receive(receiver, transmitter1, transmitter2);
    expect(receiver.value).toBe("World"); // Last transmitter value

    // Dispose all effects
    effects.forEach((eff) => eff.dispose());

    // Effects run once more after disposal (lazy removal)
    transmitter1.value = "Hi";
    expect(receiver.value).toBe("World"); // Last transmitter value

    // Now effects should be removed
    transmitter2.value = "There";
    expect(receiver.value).toBe("World"); // No longer updates
  });

  it("should handle number signals", () => {
    const temp1 = signal(20);
    const temp2 = signal(25);
    const currentTemp = signal(0);

    receive(currentTemp, temp1, temp2);

    temp1.value = 22;
    expect(currentTemp.value).toBe(22);

    temp2.value = 30;
    expect(currentTemp.value).toBe(30);
  });

  it("should handle object signals", () => {
    const event1 = signal({ type: "click", x: 10 });
    const event2 = signal({ type: "hover", y: 20 });
    const currentEvent = signal({});

    receive(currentEvent, event1, event2);

    event1.value = { type: "click", x: 15 };
    expect(currentEvent.value).toEqual({ type: "click", x: 15 });

    event2.value = { type: "hover", y: 25 };
    expect(currentEvent.value).toEqual({ type: "hover", y: 25 });
  });

  it("should handle plain value transmitters", () => {
    const receiver = signal("");

    receive(receiver, "Hello", "World");

    expect(receiver.value).toBe("World"); // Last plain value
  });

  it("should handle plain number transmitters", () => {
    const receiver = signal(0);

    receive(receiver, 42, 100);

    expect(receiver.value).toBe(100);
  });

  it("should handle plain object transmitters", () => {
    const receiver = signal({});

    receive(receiver, { type: "click" }, { type: "hover" });

    expect(receiver.value).toEqual({ type: "hover" });
  });

  it("should handle mixed signal and plain value transmitters", () => {
    const signalTransmitter = signal("Signal value");
    const receiver = signal("");

    receive(receiver, signalTransmitter, "Plain value");

    expect(receiver.value).toBe("Plain value");

    signalTransmitter.value = "Updated signal";
    expect(receiver.value).toBe("Updated signal");
  });

  it("should handle null and undefined plain transmitters", () => {
    const receiver = signal<string | null>("initial");

    receive(receiver, null, "undefined");

    expect(receiver.value).toBe("undefined");
  });
});

describe("transmit", () => {
  it("should broadcast from transmitter to multiple receivers", () => {
    const transmitter = signal("Hello");
    const receiver1 = signal("");
    const receiver2 = signal("");
    const receiver3 = signal("");

    const effect = transmit(transmitter, receiver1, receiver2, receiver3);

    transmitter.value = "Hi";

    expect(receiver1.value).toBe("Hi");
    expect(receiver2.value).toBe("Hi");
    expect(receiver3.value).toBe("Hi");
  });

  it("should return effect for disposal", () => {
    const transmitter = signal("Hello");
    const receiver1 = signal("");
    const receiver2 = signal("");

    const effect = transmit(transmitter, receiver1, receiver2);

    expect(effect.dispose).toBeInstanceOf(Function);
  });

  // TODO: should throw error if no receivers are provided
  it("should handle empty receivers array", () => {
    const transmitter = signal("Hello");
    const effect = transmit(transmitter);

    transmitter.value = "Hi"; // Should not throw
  });

  it("should handle single receiver", () => {
    const transmitter = signal("Hello");
    const receiver = signal("");

    const effect = transmit(transmitter, receiver);

    transmitter.value = "Hi";
    expect(receiver.value).toBe("Hi");
  });

  it("should allow receivers to be updated independently", () => {
    const transmitter = signal("Hello");
    const receiver1 = signal("");
    const receiver2 = signal("");

    transmit(transmitter, receiver1, receiver2);
    expect(receiver1.value).toBe("Hello");
    expect(receiver2.value).toBe("Hello");

    receiver1.value = "Manual update 1";
    receiver2.value = "Manual update 2";

    expect(receiver1.value).toBe("Manual update 1");
    expect(receiver2.value).toBe("Manual update 2");

    transmitter.value = "Hi";
    expect(receiver1.value).toBe("Hi");
    expect(receiver2.value).toBe("Hi");
  });

  it("should work with derived signal as transmitter", () => {
    const base = signal(5);
    const derived = derive(() => base.value * 2);
    const receiver1 = signal(0);
    const receiver2 = signal(0);

    transmit(derived, receiver1, receiver2);

    base.value = 10;
    expect(receiver1.value).toBe(20);
    expect(receiver2.value).toBe(20);
  });

  it("should dispose connection when effect is disposed", () => {
    const transmitter = signal("Hello");
    const receiver1 = signal("");
    const receiver2 = signal("");

    const effect = transmit(transmitter, receiver1, receiver2);

    // Effect runs once to set initial values
    expect(receiver1.value).toBe("Hello");
    expect(receiver2.value).toBe("Hello");

    effect.dispose();

    // After disposal, effect doesn't run, receivers keep their values
    transmitter.value = "Hi";
    expect(receiver1.value).toBe("Hello"); // Still "Hello", no updates
    expect(receiver2.value).toBe("Hello"); // Still "Hello", no updates
  });

  it("should handle number signals", () => {
    const temperature = signal(22);
    const display1 = signal(0);
    const display2 = signal(0);

    transmit(temperature, display1, display2);

    temperature.value = 25;
    expect(display1.value).toBe(25);
    expect(display2.value).toBe(25);
  });

  it("should handle object signals", () => {
    const user = signal({ name: "John", age: 30 });
    const profile1 = signal({});
    const profile2 = signal({});

    transmit(user, profile1, profile2);

    user.value = { name: "Jane", age: 25 };
    expect(profile1.value).toEqual({ name: "Jane", age: 25 });
    expect(profile2.value).toEqual({ name: "Jane", age: 25 });
  });

  it("should update all receivers synchronously", () => {
    const transmitter = signal(0);
    const updateOrder: number[] = [];
    const receiver1 = signal(0);
    const receiver2 = signal(0);

    effect(() => {
      if (receiver1.value !== 0) updateOrder.push(1);
    });

    effect(() => {
      if (receiver2.value !== 0) updateOrder.push(2);
    });

    transmit(transmitter, receiver1, receiver2);

    transmitter.value = 1;

    // Both receivers should be updated
    expect(receiver1.value).toBe(1);
    expect(receiver2.value).toBe(1);

    // The order of updates should be consistent
    expect(updateOrder).toEqual([1, 2]);

    transmitter.value = 2;
    expect(receiver1.value).toBe(2);
    expect(receiver2.value).toBe(2);
    expect(updateOrder).toEqual([1, 2, 1, 2]);
  });

  it("should handle plain value transmitter", () => {
    const receiver1 = signal("");
    const receiver2 = signal("");

    transmit("Hello", receiver1, receiver2);

    expect(receiver1.value).toBe("Hello");
    expect(receiver2.value).toBe("Hello");
  });

  it("should handle plain number transmitter", () => {
    const receiver1 = signal(0);
    const receiver2 = signal(0);

    transmit(42, receiver1, receiver2);

    expect(receiver1.value).toBe(42);
    expect(receiver2.value).toBe(42);
  });

  it("should handle plain object transmitter", () => {
    const receiver1 = signal({});
    const receiver2 = signal({});

    transmit({ type: "click", x: 10 }, receiver1, receiver2);

    expect(receiver1.value).toEqual({ type: "click", x: 10 });
    expect(receiver2.value).toEqual({ type: "click", x: 10 });
  });

  it("should handle null and undefined plain transmitter", () => {
    const receiver1 = signal<string | null>("initial");
    const receiver2 = signal<string | undefined>("initial");

    transmit(null, receiver1);
    expect(receiver1.value).toBe(null);

    transmit(undefined, receiver2);
    expect(receiver2.value).toBe(undefined);
  });
});
