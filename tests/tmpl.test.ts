import { describe, it, expect } from "bun:test";
import { tmpl, signal, derive } from "../src";

describe("tmpl", () => {
  it("should create derived signal from template literal", () => {
    const name = signal("World");
    const greeting = tmpl`Hello ${name}`;

    expect(greeting.value).toBe("Hello World");
  });

  it("should update when signal expressions change", () => {
    const name = signal("World");
    const greeting = tmpl`Hello ${name}`;
    expect(greeting.value).toBe("Hello World");

    name.value = "Alice";
    expect(greeting.value).toBe("Hello Alice");
  });

  it("should handle multiple expressions", () => {
    const firstName = signal("John");
    const lastName = signal("Doe");
    const fullName = tmpl`${firstName} ${lastName}`;

    expect(fullName.value).toBe("John Doe");

    firstName.value = "Jane";
    expect(fullName.value).toBe("Jane Doe");

    lastName.value = "Smith";
    expect(fullName.value).toBe("Jane Smith");
  });

  it("should handle plain value expressions", () => {
    const name = tmpl`Hello ${"World"}`;
    expect(name.value).toBe("Hello World");
  });

  it("should handle function expressions", () => {
    const count = signal(5);
    const doubled = tmpl`Count: ${() => count.value * 2}`;

    expect(doubled.value).toBe("Count: 10");

    count.value = 10;
    expect(doubled.value).toBe("Count: 20");
  });

  it("should handle mixed expressions", () => {
    const name = signal("Alice");
    const age = 30;
    const info = tmpl`${name} is ${age} years old`;

    expect(info.value).toBe("Alice is 30 years old");

    name.value = "Bob";
    expect(info.value).toBe("Bob is 30 years old");
  });

  it("should convert null to empty string", () => {
    const name = signal(null);
    const greeting = tmpl`Hello ${name}`;

    expect(greeting.value).toBe("Hello ");
  });

  it("should convert undefined to empty string", () => {
    const name = signal(undefined);
    const greeting = tmpl`Hello ${name}`;

    expect(greeting.value).toBe("Hello ");
  });

  it("should handle derived signal expressions", () => {
    const count = signal(5);
    const doubled = derive(() => count.value * 2);
    const message = tmpl`Double is ${doubled}`;

    expect(message.value).toBe("Double is 10");

    count.value = 10;
    expect(message.value).toBe("Double is 20");
  });

  it("should handle numbers in expressions", () => {
    const count = signal(42);
    const message = tmpl`Count: ${count}`;

    expect(message.value).toBe("Count: 42");

    count.value = 100;
    expect(message.value).toBe("Count: 100");
  });

  it("should handle objects with toString", () => {
    const date = signal(new Date("2024-01-01"));
    const message = tmpl`Date: ${date}`;

    expect(message.value).toContain(`Date: ${date.value.toString()}`);
  });

  it("should handle arrays in expressions", () => {
    const items = signal([1, 2, 3]);
    const message = tmpl`Items: ${items}`;

    expect(message.value).toBe("Items: 1,2,3");
  });

  it("should return a derived signal", () => {
    const name = signal("World");
    const greeting = tmpl`Hello ${name}`;

    expect(greeting.type).toBe("derived-signal");
  });

  it("should have dispose method", () => {
    const name = signal("World");
    const greeting = tmpl`Hello ${name}`;

    greeting.dispose();
    name.value = "Alice";
    expect(greeting.value).toBe("Hello World"); // Should not update
  });

  it("should handle complex template literals", () => {
    const firstName = signal("John");
    const lastName = signal("Doe");
    const age = signal(30);
    const bio = tmpl`Name: ${firstName} ${lastName}, Age: ${age}`;

    expect(bio.value).toBe("Name: John Doe, Age: 30");

    firstName.value = "Jane";
    lastName.value = "Smith";
    age.value = 25;
    expect(bio.value).toBe("Name: Jane Smith, Age: 25");
  });

  it("should handle empty expressions", () => {
    const message = tmpl`Hello `;
    expect(message.value).toBe("Hello ");
  });

  it("should handle expressions at different positions", () => {
    const prefix = signal("Hello");
    const middle = signal("beautiful");
    const suffix = signal("World");
    const message = tmpl`${prefix} ${middle} ${suffix}`;

    expect(message.value).toBe("Hello beautiful World");

    prefix.value = "Hi";
    middle.value = "wonderful";
    suffix.value = "Universe";
    expect(message.value).toBe("Hi wonderful Universe");
  });
});
