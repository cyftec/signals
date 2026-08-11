import { describe, expect, it } from "bun:test";
import { derive, nullable, signal } from "../src";

describe("generic methods", () => {
  describe("toString()", () => {
    it("serializes nullish, primitive, array, and plain-object values reactively", () => {
      const nullable = signal<string | null>(null, "");
      const undefinedValue = signal<undefined>(undefined);
      const number = signal(12);
      const items = signal([1, 2]);
      const object = signal({ name: "Ada", active: true });

      const nullableText = nullable.toString();
      const undefinedText = undefinedValue.toString();
      const numberText = number.toString();
      const itemsText = items.toString();
      const objectText = object.toString();

      expect(nullableText.value).toBe("null");
      expect(undefinedText.value).toBe("undefined");
      expect(numberText.value).toBe("12");
      expect(itemsText.value).toBe("1,2");
      expect(objectText.value).toBe('{"name":"Ada","active":true}');

      nullable.value = "ready";
      number.value = 7;
      items.value = [3];
      object.value = { name: "Grace", active: false };

      expect(nullableText.value).toBe("ready");
      expect(numberText.value).toBe("7");
      expect(itemsText.value).toBe("3");
      expect(objectText.value).toBe('{"name":"Grace","active":false}');
    });

    it("works on derived plain-object values", () => {
      const name = signal("Ada");
      const user = derive(() => ({ name: name.value }));
      const text = user.toString();

      expect(text.value).toBe('{"name":"Ada"}');

      name.value = "Grace";
      expect(text.value).toBe('{"name":"Grace"}');
    });
  });

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
    });
  });

  describe("is comparisons", () => {
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

    it("smallerThanOrEqualTo() includes equality and reacts", () => {
      const input = signal(5);
      const result = input.is.smallerThanOrEqualTo(5);

      expect(result.value).toBe(true);

      input.value = 6;
      expect(result.value).toBe(false);
    });
  });

  describe("if comparisons", () => {
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
  it("adds generic methods to a plain nullable value", () => {
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

  it("supports relational comparisons for dates and custom object coercion", () => {
    const timestamp = signal(1_000);
    const date = signal(new Date(2_000));
    const rank = signal({ valueOf: () => 3 });
    const dateResult = date.is.greaterThan(timestamp);
    const rankResult = nullable(rank).if.smallerThan(4).then("low", "high");

    expect(dateResult.value).toBe(true);
    expect(rankResult.value).toBe("low");

    timestamp.value = 2_500;
    expect(dateResult.value).toBe(false);
  });

  it("propagates JavaScript relational comparison errors", () => {
    const symbol = signal(Symbol("value"));

    expect(() => symbol.is.greaterThan(1)).toThrow(TypeError);
  });
});
