import { describe, expect, it } from "bun:test";
import { deadSignal, derive, nullable, signal } from "../src";
import type { DeadSignal, LiveSignal } from "../src";

describe("generic methods", () => {
  describe("or()", () => {
    it("uses the alternative for every JavaScript-falsy value and stays reactive", () => {
      const stringAlternative = signal("fallback");
      const num = signal(0);
      const numOrStringAlternative = num.or(stringAlternative);

      expect(numOrStringAlternative.type).toBe("derived-signal");
      expect(numOrStringAlternative.value).toBe("fallback");

      stringAlternative.value = "updated fallback";
      expect(numOrStringAlternative.value).toBe("updated fallback");

      num.value = 7;
      expect(numOrStringAlternative.value).toBe(7);

      const text = signal("");
      const derivedText = derive(() => text.value);
      const emptyStringOrAlternative = derivedText.or("empty fallback");

      expect(emptyStringOrAlternative.type).toBe("derived-signal");
      expect(emptyStringOrAlternative.value).toBe("empty fallback");

      text.value = "present";
      expect(emptyStringOrAlternative.value).toBe("present");

      expect(deadSignal(false).or("false fallback").value).toBe(
        "false fallback",
      );
      expect(deadSignal(NaN).or("NaN fallback").value).toBe("NaN fallback");
      expect(deadSignal(null).or("null fallback").value).toBe("null fallback");
      expect(deadSignal(undefined).or("undefined fallback").value).toBe(
        "undefined fallback",
      );
    });

    it("returns a dead snapshot for a dead input", () => {
      const alternative = signal("fallback");
      const result = deadSignal(0).or(alternative);

      expect(result.type).toBe("dead-signal");
      expect(result.value).toBe("fallback");

      alternative.value = "updated fallback";
      expect(result.value).toBe("fallback");
    });
  });

  describe("is primitive comparisons", () => {
    it("truthy() reports truthiness and reacts to source changes", () => {
      const input = signal("ready");
      const result = input.is.truthy();

      expect(result.value).toBe(true);

      input.value = "";
      expect(result.value).toBe(false);
    });

    it("falsy() works directly on a derived signal", () => {
      const input = signal(0);
      const derivedInput = derive(() => input.value);
      const result = derivedInput.is.falsy();

      expect(result.value).toBe(true);

      input.value = 1;
      expect(result.value).toBe(false);
    });

    it("equalTo() reacts to both the value and a signal operand", () => {
      const input = signal(5);
      const expected = signal(5);
      const result = input.is.equalTo(expected);

      expect(result.value).toBe(true);

      expected.value = 6;
      expect(result.value).toBe(false);

      input.value = 6;
      expect(result.value).toBe(true);
    });

    it("notEqualTo() works directly on a dead signal", () => {
      const input = deadSignal("left");

      expect(input.is.notEqualTo("right").value).toBe(true);
      expect(input.is.notEqualTo("left").value).toBe(false);
    });

    it("greaterThan() reacts to a signal operand", () => {
      const input = signal(10);
      const lowerBound = signal(5);
      const result = input.is.greaterThan(lowerBound);

      expect(result.value).toBe(true);

      lowerBound.value = 12;
      expect(result.value).toBe(false);
    });

    it("greaterThanOrEqualTo() includes equality on a derived signal", () => {
      const input = signal(10);
      const derivedInput = derive(() => input.value * 2);
      const result = derivedInput.is.greaterThanOrEqualTo(20);

      expect(result.value).toBe(true);

      input.value = 9;
      expect(result.value).toBe(false);
    });

    it("smallerThan() performs a strict comparison on a dead signal", () => {
      const input = deadSignal(-1);

      expect(input.is.smallerThan(0).value).toBe(true);
      expect(input.is.smallerThan(-1).value).toBe(false);
    });

    it("smallerThanOrEqualTo() includes equality and reacts", () => {
      const input = signal(5);
      const result = input.is.smallerThanOrEqualTo(5);

      expect(result.value).toBe(true);

      input.value = 6;
      expect(result.value).toBe(false);
    });
  });

  describe("if primitive comparisons", () => {
    it("truthy().then() reacts to the condition and signal options", () => {
      const input = signal(1);
      const truthyOption = signal("enabled");
      const falsyOption = signal("disabled");
      const result = input.if.truthy().then(truthyOption, falsyOption);

      expect(result.value).toBe("enabled");

      truthyOption.value = "active";
      expect(result.value).toBe("active");

      input.value = 0;
      expect(result.value).toBe("disabled");

      falsyOption.value = "inactive";
      expect(result.value).toBe("inactive");
    });

    it("falsy().then() selects the truthy option when the value is falsy", () => {
      const input = signal("");
      const result = input.if.falsy().then("empty", "present");

      expect(result.value).toBe("empty");

      input.value = "value";
      expect(result.value).toBe("present");
    });

    it("equalTo().then() reacts to a signal comparison operand", () => {
      const input = signal("draft");
      const expected = signal("draft");
      const result = input.if.equalTo(expected).then("match", "different");

      expect(result.value).toBe("match");

      expected.value = "published";
      expect(result.value).toBe("different");

      input.value = "published";
      expect(result.value).toBe("match");
    });

    it("notEqualTo().then() works directly on a derived signal", () => {
      const input = signal(2);
      const doubled = derive(() => input.value * 2);
      const result = doubled.if.notEqualTo(4).then("different", "same");

      expect(result.value).toBe("same");

      input.value = 3;
      expect(result.value).toBe("different");
    });

    it("greaterThan().then() reacts to a signal operand", () => {
      const input = signal(10);
      const boundary = signal(5);
      const result = input.if.greaterThan(boundary).then("above", "not above");

      expect(result.value).toBe("above");

      boundary.value = 10;
      expect(result.value).toBe("not above");
    });

    it("greaterThanOrEqualTo().then() works directly on a dead signal", () => {
      const input = deadSignal(10);

      expect(
        input.if.greaterThanOrEqualTo(10).then("at least", "below").value,
      ).toBe("at least");
      expect(
        input.if.greaterThanOrEqualTo(11).then("at least", "below").value,
      ).toBe("below");
    });

    it("smallerThan().then() performs a strict reactive comparison", () => {
      const input = signal(4);
      const result = input.if.smallerThan(5).then("below", "not below");

      expect(result.value).toBe("below");

      input.value = 5;
      expect(result.value).toBe("not below");
    });

    it("smallerThanOrEqualTo().then() includes equality on a derived signal", () => {
      const input = signal(5);
      const derivedInput = derive(() => input.value);
      const result = derivedInput.if
        .smallerThanOrEqualTo(5)
        .then("within", "above");

      expect(result.value).toBe("within");

      input.value = 6;
      expect(result.value).toBe("above");
    });
  });

  describe("is.length comparisons", () => {
    it("truthy() reports whether an array has items and reacts", () => {
      const input = signal<number[]>([]);
      const result = input.is.length.truthy();

      expect(result.value).toBe(false);

      input.value = [1];
      expect(result.value).toBe(true);
    });

    it("falsy() works directly on a derived string signal", () => {
      const input = signal("");
      const derivedInput = derive(() => input.value);
      const result = derivedInput.is.length.falsy();

      expect(result.value).toBe(true);

      input.value = "x";
      expect(result.value).toBe(false);
    });

    it("equalTo() reacts to a signal length operand", () => {
      const input = signal("test");
      const expectedLength = signal(4);
      const result = input.is.length.equalTo(expectedLength);

      expect(result.value).toBe(true);

      expectedLength.value = 5;
      expect(result.value).toBe(false);
    });

    it("notEqualTo() works directly on a dead array signal", () => {
      const input = deadSignal([1, 2, 3]);

      expect(input.is.length.notEqualTo(2).value).toBe(true);
      expect(input.is.length.notEqualTo(3).value).toBe(false);
    });

    it("greaterThan() compares string length strictly and reacts", () => {
      const input = signal("hello");
      const result = input.is.length.greaterThan(4);

      expect(result.value).toBe(true);

      input.value = "four";
      expect(result.value).toBe(false);
    });

    it("greaterThanOrEqualTo() includes equality on a derived array signal", () => {
      const input = signal([1, 2]);
      const derivedInput = derive(() => input.value);
      const result = derivedInput.is.length.greaterThanOrEqualTo(2);

      expect(result.value).toBe(true);

      input.value = [1];
      expect(result.value).toBe(false);
    });

    it("smallerThan() performs a strict length comparison on a dead signal", () => {
      const input = deadSignal("cat");

      expect(input.is.length.smallerThan(4).value).toBe(true);
      expect(input.is.length.smallerThan(3).value).toBe(false);
    });

    it("smallerThanOrEqualTo() includes equality and reacts", () => {
      const input = signal([1, 2]);
      const result = input.is.length.smallerThanOrEqualTo(2);

      expect(result.value).toBe(true);

      input.value = [1, 2, 3];
      expect(result.value).toBe(false);
    });
  });

  describe("if.length comparisons", () => {
    it("truthy().then() selects by non-empty length and reacts", () => {
      const input = signal("");
      const result = input.if.length.truthy().then("has content", "empty");

      expect(result.value).toBe("empty");

      input.value = "content";
      expect(result.value).toBe("has content");
    });

    it("falsy().then() works directly on a derived array signal", () => {
      const input = signal<number[]>([]);
      const derivedInput = derive(() => input.value);
      const result = derivedInput.if.length.falsy().then("empty", "has items");

      expect(result.value).toBe("empty");

      input.value = [1];
      expect(result.value).toBe("has items");
    });

    it("equalTo().then() reacts to a signal length operand", () => {
      const input = signal("cat");
      const expectedLength = signal(3);
      const result = input.if.length
        .equalTo(expectedLength)
        .then("exact", "different");

      expect(result.value).toBe("exact");

      expectedLength.value = 4;
      expect(result.value).toBe("different");
    });

    it("notEqualTo().then() works directly on a dead signal", () => {
      const input = deadSignal([1, 2]);

      expect(
        input.if.length.notEqualTo(3).then("different", "same").value,
      ).toBe("different");
      expect(
        input.if.length.notEqualTo(2).then("different", "same").value,
      ).toBe("same");
    });

    it("greaterThan().then() reacts to length and signal options", () => {
      const input = signal("hello");
      const longOption = signal("long");
      const shortOption = signal("short");
      const result = input.if.length
        .greaterThan(4)
        .then(longOption, shortOption);

      expect(result.value).toBe("long");

      longOption.value = "lengthy";
      expect(result.value).toBe("lengthy");

      input.value = "four";
      expect(result.value).toBe("short");

      shortOption.value = "compact";
      expect(result.value).toBe("compact");
    });

    it("greaterThanOrEqualTo().then() includes equality on a derived signal", () => {
      const input = signal([1, 2]);
      const derivedInput = derive(() => input.value);
      const result = derivedInput.if.length
        .greaterThanOrEqualTo(2)
        .then("enough", "too few");

      expect(result.value).toBe("enough");

      input.value = [1];
      expect(result.value).toBe("too few");
    });

    it("smallerThan().then() performs a strict comparison on a dead signal", () => {
      const input = deadSignal("cat");

      expect(
        input.if.length.smallerThan(4).then("shorter", "not shorter").value,
      ).toBe("shorter");
      expect(
        input.if.length.smallerThan(3).then("shorter", "not shorter").value,
      ).toBe("not shorter");
    });

    it("smallerThanOrEqualTo().then() includes equality and reacts", () => {
      const input = signal([1, 2]);
      const result = input.if.length
        .smallerThanOrEqualTo(2)
        .then("within", "too many");

      expect(result.value).toBe("within");

      input.value = [1, 2, 3];
      expect(result.value).toBe("too many");
    });
  });
});

describe("nullable generic-method wrapper", () => {
  it("adds generic methods to a plain nullable primitive", () => {
    const wrapped = nullable<number | undefined>(undefined);

    expect(wrapped.or(10).value).toBe(10);
    expect(wrapped.is.falsy().value).toBe(true);
    expect(wrapped.if.equalTo(undefined).then("missing", "present").value).toBe(
      "missing",
    );
  });

  it("keeps wrapped signal values reactive", () => {
    const input = signal<number | null>(null);
    const wrapped = nullable(input);
    const result = wrapped.if.truthy().then("present", "missing");

    expect(result.value).toBe("missing");

    input.value = 1;
    expect(result.value).toBe("present");
  });

  it("selects live, dead, and hybrid return behavior from the input", () => {
    type HybridInput = LiveSignal<number | null> | DeadSignal<number | null>;

    const asHybrid = (input: HybridInput): HybridInput => input;
    const alternative = signal("fallback");
    const liveSource = signal<number | null>(null);
    const liveDerived = derive(() => liveSource.value);
    const dead = deadSignal<number | null>(null);
    const plain: number | null = null;

    const liveSourceResult = nullable(liveSource).or(alternative);
    const liveDerivedResult = nullable(liveDerived).or(alternative);
    const deadResult = nullable(dead).or(alternative);
    const plainResult = nullable(plain).or(alternative);
    const hybridLiveResult = nullable(asHybrid(liveSource)).or(alternative);
    const hybridDeadResult = nullable(asHybrid(dead)).or(alternative);

    expect(liveSourceResult.type).toBe("derived-signal");
    expect(liveDerivedResult.type).toBe("derived-signal");
    expect(deadResult.type).toBe("dead-signal");
    expect(plainResult.type).toBe("dead-signal");
    expect(hybridLiveResult.type).toBe("derived-signal");
    expect(hybridDeadResult.type).toBe("dead-signal");

    alternative.value = "updated fallback";
    expect(liveSourceResult.value).toBe("updated fallback");
    expect(liveDerivedResult.value).toBe("updated fallback");
    expect(deadResult.value).toBe("fallback");
    expect(plainResult.value).toBe("fallback");
    expect(hybridLiveResult.value).toBe("updated fallback");
    expect(hybridDeadResult.value).toBe("fallback");

    liveSource.value = 1;
    expect(liveSourceResult.value).toBe(1);
    expect(liveDerivedResult.value).toBe(1);
    expect(hybridLiveResult.value).toBe(1);
    expect(deadResult.value).toBe("fallback");
    expect(plainResult.value).toBe("fallback");
    expect(hybridDeadResult.value).toBe("fallback");
  });

  it("applies live, dead, and hybrid selection to comparisons and ternaries", () => {
    type HybridInput = LiveSignal<number | null> | DeadSignal<number | null>;

    const asHybrid = (input: HybridInput): HybridInput => input;
    const liveSource = signal<number | null>(null);
    const liveDerived = derive(() => liveSource.value);
    const dead = deadSignal<number | null>(null);
    const compareValue = signal<number | null>(null);
    const truthyOption = signal("missing");

    const liveComparison = nullable(liveSource).is.equalTo(compareValue);
    const derivedTernary = nullable(liveDerived)
      .if.equalTo(compareValue)
      .then(truthyOption, "present");
    const deadComparison = nullable(dead).is.equalTo(compareValue);
    const plainTernary = nullable<number | null>(null)
      .if.equalTo(compareValue)
      .then(truthyOption, "present");
    const hybridLiveComparison = nullable(asHybrid(liveSource)).is.equalTo(
      compareValue,
    );
    const hybridDeadTernary = nullable(asHybrid(dead))
      .if.equalTo(compareValue)
      .then(truthyOption, "present");

    expect(liveComparison.type).toBe("derived-signal");
    expect(derivedTernary.type).toBe("derived-signal");
    expect(deadComparison.type).toBe("dead-signal");
    expect(plainTernary.type).toBe("dead-signal");
    expect(hybridLiveComparison.type).toBe("derived-signal");
    expect(hybridDeadTernary.type).toBe("dead-signal");

    truthyOption.value = "still missing";
    expect(derivedTernary.value).toBe("still missing");
    expect(plainTernary.value).toBe("missing");
    expect(hybridDeadTernary.value).toBe("missing");

    compareValue.value = 1;
    expect(liveComparison.value).toBe(false);
    expect(derivedTernary.value).toBe("present");
    expect(hybridLiveComparison.value).toBe(false);
    expect(deadComparison.value).toBe(true);
    expect(plainTernary.value).toBe("missing");
    expect(hybridDeadTernary.value).toBe("missing");
  });
});
