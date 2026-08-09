import { describe, expect, it } from "bun:test";
import { deadSignal, derive, effect, signal } from "../src";
import type { DeadSignal, LiveSignal, SourceSignal } from "../src";

type NumberArraySignal = SourceSignal<number[]>;
type StringSignal = SourceSignal<string>;
type ReactiveResult = {
  readonly type: string;
  readonly value: unknown;
};

const assertArrayMutation = (
  initial: number[],
  mutation: (array: NumberArraySignal) => void,
  expected: number[],
) => {
  const externalInput = [...initial];
  const array = signal(externalInput);
  const previousSnapshot = array.value;
  let effectRuns = 0;
  const watcher = effect(() => {
    void array.value;
    effectRuns++;
  });

  const result = mutation(array);

  expect(result).toBeUndefined();
  expect(array.value).toEqual(expected);
  expect(array.prevValue).toEqual(initial);
  expect(previousSnapshot).toEqual(initial);
  expect(externalInput).toEqual(initial);
  expect(effectRuns).toBe(2);
  watcher.dispose();
};

const assertStringMutation = (
  initial: string,
  mutation: (text: StringSignal) => void,
  expected: string,
) => {
  const text = signal(initial);
  let effectRuns = 0;
  const watcher = effect(() => {
    void text.value;
    effectRuns++;
  });

  const result = mutation(text);

  expect(result).toBeUndefined();
  expect(text.value).toBe(expected);
  expect(text.prevValue).toBe(initial);
  expect(effectRuns).toBe(2);
  watcher.dispose();
};

describe("array data methods", () => {
  describe("mutating methods", () => {
    const cases: Array<{
      name: string;
      initial: number[];
      mutate: (array: NumberArraySignal) => void;
      expected: number[];
    }> = [
      {
        name: "concat appends multiple arrays",
        initial: [1, 2],
        mutate: (array) => array.mutate.concat([3], [4]),
        expected: [1, 2, 3, 4],
      },
      {
        name: "copyWithin copies the requested range",
        initial: [1, 2, 3, 4],
        mutate: (array) => array.mutate.copyWithin(0, 2),
        expected: [3, 4, 3, 4],
      },
      {
        name: "fill replaces the selected range",
        initial: [1, 2, 3],
        mutate: (array) => array.mutate.fill(0, 1),
        expected: [1, 0, 0],
      },
      {
        name: "filter retains matching values",
        initial: [1, 2, 3, 4],
        mutate: (array) => array.mutate.filter((item) => item % 2 === 0),
        expected: [2, 4],
      },
      {
        name: "pop removes the final value",
        initial: [1, 2, 3],
        mutate: (array) => array.mutate.pop(),
        expected: [1, 2],
      },
      {
        name: "push appends multiple values",
        initial: [1, 2],
        mutate: (array) => array.mutate.push(signal(3), 4),
        expected: [1, 2, 3, 4],
      },
      {
        name: "shift removes the first value",
        initial: [1, 2, 3],
        mutate: (array) => array.mutate.shift(),
        expected: [2, 3],
      },
      {
        name: "toReversed reverses the source value",
        initial: [1, 2, 3],
        mutate: (array) => array.mutate.toReversed(),
        expected: [3, 2, 1],
      },
      {
        name: "toSorted applies a comparator to the source value",
        initial: [3, 1, 2],
        mutate: (array) => array.mutate.toSorted((a, b) => a - b),
        expected: [1, 2, 3],
      },
      {
        name: "toSpliced removes and inserts values",
        initial: [1, 2, 3, 4],
        mutate: (array) => array.mutate.toSpliced(1, 2, 8, 9),
        expected: [1, 8, 9, 4],
      },
      {
        name: "unshift prepends multiple values",
        initial: [3, 4],
        mutate: (array) => array.mutate.unshift(1, 2),
        expected: [1, 2, 3, 4],
      },
    ];

    for (const testCase of cases) {
      it(testCase.name, () => {
        assertArrayMutation(
          testCase.initial,
          testCase.mutate,
          testCase.expected,
        );
      });
    }
  });

  describe("non-mutating methods", () => {
    const cases: Array<{
      name: string;
      initial: number[];
      updated: number[];
      create: (array: NumberArraySignal) => ReactiveResult;
      expected: unknown;
      updatedExpected: unknown;
    }> = [
      {
        name: "at returns the indexed value",
        initial: [1, 2, 3],
        updated: [4, 5, 6],
        create: (array) => array.at(1),
        expected: 2,
        updatedExpected: 5,
      },
      {
        name: "concat returns a concatenated copy",
        initial: [1, 2],
        updated: [4, 5],
        create: (array) => array.concat([3]),
        expected: [1, 2, 3],
        updatedExpected: [4, 5, 3],
      },
      {
        name: "every checks every item",
        initial: [2, 4],
        updated: [2, 3],
        create: (array) => array.every((item) => item % 2 === 0),
        expected: true,
        updatedExpected: false,
      },
      {
        name: "filter returns matching items",
        initial: [1, 2, 3, 4],
        updated: [5, 6, 8],
        create: (array) => array.filter((item) => item % 2 === 0),
        expected: [2, 4],
        updatedExpected: [6, 8],
      },
      {
        name: "find returns the first match",
        initial: [1, 2, 3],
        updated: [0, 1],
        create: (array) => array.find((item) => item > 2),
        expected: 3,
        updatedExpected: undefined,
      },
      {
        name: "findIndex returns the first matching index",
        initial: [1, 2, 3],
        updated: [0, 4],
        create: (array) => array.findIndex((item) => item > 2),
        expected: 2,
        updatedExpected: 1,
      },
      {
        name: "findLast returns the final match",
        initial: [1, 2, 4, 3],
        updated: [6, 7, 8],
        create: (array) => array.findLast((item) => item % 2 === 0),
        expected: 4,
        updatedExpected: 8,
      },
      {
        name: "findLastIndex returns the final matching index",
        initial: [1, 2, 3, 4],
        updated: [6, 7, 8],
        create: (array) => array.findLastIndex((item) => item % 2 === 0),
        expected: 3,
        updatedExpected: 2,
      },
      {
        name: "length returns the current item count",
        initial: [1, 2, 3],
        updated: [4, 5],
        create: (array) => array.length(),
        expected: 3,
        updatedExpected: 2,
      },
      {
        name: "map transforms every item",
        initial: [1, 2, 3],
        updated: [4, 5],
        create: (array) => array.map((item) => item * 2),
        expected: [2, 4, 6],
        updatedExpected: [8, 10],
      },
      {
        name: "reduce folds from the left",
        initial: [1, 2, 3],
        updated: [4, 5],
        create: (array) => array.reduce((sum, item) => sum + item, 0),
        expected: 6,
        updatedExpected: 9,
      },
      {
        name: "reduceRight folds from the right",
        initial: [1, 2, 3],
        updated: [4, 5],
        create: (array) =>
          array.reduceRight<string>((text, item) => text + item, ""),
        expected: "321",
        updatedExpected: "54",
      },
      {
        name: "some checks whether one item matches",
        initial: [1, 2, 3],
        updated: [0, 1],
        create: (array) => array.some((item) => item > 2),
        expected: true,
        updatedExpected: false,
      },
      {
        name: "toReversed returns a reversed copy",
        initial: [1, 2, 3],
        updated: [4, 5],
        create: (array) => array.toReversed(),
        expected: [3, 2, 1],
        updatedExpected: [5, 4],
      },
      {
        name: "toSorted returns a sorted copy",
        initial: [3, 1, 2],
        updated: [6, 4, 5],
        create: (array) => array.toSorted((a, b) => a - b),
        expected: [1, 2, 3],
        updatedExpected: [4, 5, 6],
      },
      {
        name: "toSpliced returns a spliced copy",
        initial: [1, 2, 3],
        updated: [4, 5, 6],
        create: (array) => array.toSpliced(1, 1),
        expected: [1, 3],
        updatedExpected: [4, 6],
      },
      {
        name: "lastItem returns the final item",
        initial: [1, 2, 3],
        updated: [4, 5],
        create: (array) => array.lastItem(),
        expected: 3,
        updatedExpected: 5,
      },
    ];

    for (const testCase of cases) {
      it(testCase.name, () => {
        const externalInput = [...testCase.initial];
        const array = signal(externalInput);
        const result = testCase.create(array);

        expect(result.type).toBe("derived-signal");
        expect(result.value).toEqual(testCase.expected);
        expect(array.value).toEqual(testCase.initial);
        expect(externalInput).toEqual(testCase.initial);

        array.value = [...testCase.updated];
        expect(result.value).toEqual(testCase.updatedExpected);
        expect(array.value).toEqual(testCase.updated);
      });
    }

    it("partition returns reactive passing and failing groups and honors thisArg", () => {
      const array = signal([1, 2, 3]);
      const context = { minimum: 2 };
      const [passing, failing] = array.partition(function (
        this: typeof context,
        item,
      ) {
        return item >= this.minimum;
      }, context);

      expect(passing.value).toEqual([2, 3]);
      expect(failing.value).toEqual([1]);
      expect(array.value).toEqual([1, 2, 3]);

      array.value = [0, 4];
      expect(passing.value).toEqual([4]);
      expect(failing.value).toEqual([0]);
      expect(array.value).toEqual([0, 4]);
    });

    it("reacts to signal-valued method parameters", () => {
      const array = signal([1, 2, 3]);
      const index = signal(0);
      const selected = array.at(index);

      expect(selected.value).toBe(1);

      index.value = 2;
      expect(selected.value).toBe(3);
      expect(array.value).toEqual([1, 2, 3]);
    });

    it("handles an empty array at the boundaries", () => {
      const array = signal<number[]>([]);
      expect(array.at(0).value).toBeUndefined();
      expect(array.lastItem().value).toBeUndefined();
      expect(array.every(() => false).value).toBe(true);
      expect(array.some(() => true).value).toBe(false);
    });
  });

  it("supports non-mutating methods on derived and dead array signals", () => {
    const source = signal([3, 1, 2]);
    const derived = derive(() => source.value);
    const sorted = derived.toSorted((a, b) => a - b);
    const dead = deadSignal([1, 2, 3]);

    expect(sorted.value).toEqual([1, 2, 3]);
    expect(dead.map((item) => item * 2).value).toEqual([2, 4, 6]);

    source.value = [6, 4, 5];
    expect(sorted.value).toEqual([4, 5, 6]);
  });

  it("returns derived results for live arrays and dead snapshots for dead arrays", () => {
    const source = signal([1, 2, 3]);
    const derived = derive(() => source.value);
    const dead = deadSignal([1, 2, 3]);
    const index = signal(0);

    const sourceItem = source.at(index);
    const derivedItem = derived.at(index);
    const deadItem = dead.at(index);
    const [derivedPassing, derivedFailing] = derived.partition(
      (item) => item % 2 === 0,
    );
    const [deadPassing, deadFailing] = dead.partition(
      (item) => item % 2 === 0,
    );

    expect(sourceItem.type).toBe("derived-signal");
    expect(derivedItem.type).toBe("derived-signal");
    expect(deadItem.type).toBe("dead-signal");
    expect(derivedPassing.type).toBe("derived-signal");
    expect(derivedFailing.type).toBe("derived-signal");
    expect(deadPassing.type).toBe("dead-signal");
    expect(deadFailing.type).toBe("dead-signal");

    index.value = 1;
    source.value = [4, 5, 6];

    expect(sourceItem.value).toBe(5);
    expect(derivedItem.value).toBe(5);
    expect(deadItem.value).toBe(1);
    expect(derivedPassing.value).toEqual([4, 6]);
    expect(derivedFailing.value).toEqual([5]);
    expect(deadPassing.value).toEqual([2]);
    expect(deadFailing.value).toEqual([1, 3]);
  });

  it("attaches array methods for a nullable signal after transition", () => {
    const nullableArray = signal<number[] | undefined>(undefined, []);
    nullableArray.value = [1, 2];
    const narrowed = nullableArray as unknown as SourceSignal<number[]>;
    const length = narrowed.length();

    expect(length.value).toBe(2);
    nullableArray.value = [1, 2, 3];
    expect(length.value).toBe(3);
  });
});

describe("string data methods", () => {
  describe("mutating methods", () => {
    const cases: Array<{
      name: string;
      initial: string;
      mutate: (text: StringSignal) => void;
      expected: string;
    }> = [
      {
        name: "concat appends signalled text",
        initial: "hello",
        mutate: (text) => text.mutate.concat(signal(" world")),
        expected: "hello world",
      },
      {
        name: "deepTrim trims and collapses whitespace",
        initial: "  hello     world  ",
        mutate: (text) => text.mutate.deepTrim(),
        expected: "hello world",
      },
      {
        name: "padEnd pads to the requested length",
        initial: "a",
        mutate: (text) => text.mutate.padEnd(4, "."),
        expected: "a...",
      },
      {
        name: "padStart pads at the start",
        initial: "a",
        mutate: (text) => text.mutate.padStart(4, "."),
        expected: "...a",
      },
      {
        name: "repeat repeats the source text",
        initial: "ab",
        mutate: (text) => text.mutate.repeat(3),
        expected: "ababab",
      },
      {
        name: "replace accepts string search and replacement values",
        initial: "hello world",
        mutate: (text) => text.mutate.replace("world", "there"),
        expected: "hello there",
      },
      {
        name: "replaceAll accepts a RegExp and callback",
        initial: "cat cat",
        mutate: (text) =>
          text.mutate.replaceAll(/cat/g, (match) => match.toUpperCase()),
        expected: "CAT CAT",
      },
      {
        name: "slice keeps the selected range",
        initial: "hello",
        mutate: (text) => text.mutate.slice(1, 4),
        expected: "ell",
      },
      {
        name: "substring keeps the selected range",
        initial: "hello",
        mutate: (text) => text.mutate.substring(1, 4),
        expected: "ell",
      },
      {
        name: "trim removes surrounding whitespace",
        initial: "  hello  ",
        mutate: (text) => text.mutate.trim(),
        expected: "hello",
      },
      {
        name: "trimEnd removes trailing whitespace",
        initial: "  hello  ",
        mutate: (text) => text.mutate.trimEnd(),
        expected: "  hello",
      },
      {
        name: "trimStart removes leading whitespace",
        initial: "  hello  ",
        mutate: (text) => text.mutate.trimStart(),
        expected: "hello  ",
      },
      {
        name: "toLocaleLowerCase uses an explicit locale",
        initial: "HELLO",
        mutate: (text) => text.mutate.toLocaleLowerCase("en-US"),
        expected: "hello",
      },
      {
        name: "toLocaleUpperCase uses an explicit locale",
        initial: "hello",
        mutate: (text) => text.mutate.toLocaleUpperCase("en-US"),
        expected: "HELLO",
      },
      {
        name: "toLowerCase lowercases the source text",
        initial: "HELLO",
        mutate: (text) => text.mutate.toLowerCase(),
        expected: "hello",
      },
      {
        name: "toUpperCase uppercases the source text",
        initial: "hello",
        mutate: (text) => text.mutate.toUpperCase(),
        expected: "HELLO",
      },
    ];

    for (const testCase of cases) {
      it(testCase.name, () => {
        assertStringMutation(
          testCase.initial,
          testCase.mutate,
          testCase.expected,
        );
      });
    }
  });

  describe("non-mutating methods", () => {
    const cases: Array<{
      name: string;
      initial: string;
      updated: string;
      create: (text: StringSignal) => ReactiveResult;
      expected: unknown;
      updatedExpected: unknown;
    }> = [
      {
        name: "at returns the indexed character",
        initial: "hello",
        updated: "world",
        create: (text) => text.at(1),
        expected: "e",
        updatedExpected: "o",
      },
      {
        name: "charAt returns the indexed character",
        initial: "hello",
        updated: "world",
        create: (text) => text.charAt(1),
        expected: "e",
        updatedExpected: "o",
      },
      {
        name: "charCodeAt returns the UTF-16 code unit",
        initial: "hello",
        updated: "world",
        create: (text) => text.charCodeAt(0),
        expected: 104,
        updatedExpected: 119,
      },
      {
        name: "codePointAt returns a Unicode code point",
        initial: "😀a",
        updated: "😁a",
        create: (text) => text.codePointAt(0),
        expected: 128512,
        updatedExpected: 128513,
      },
      {
        name: "concat returns appended text",
        initial: "hello",
        updated: "hi",
        create: (text) => text.concat("!"),
        expected: "hello!",
        updatedExpected: "hi!",
      },
      {
        name: "endsWith checks the suffix",
        initial: "hello",
        updated: "world",
        create: (text) => text.endsWith("lo"),
        expected: true,
        updatedExpected: false,
      },
      {
        name: "includes checks for contained text",
        initial: "hello",
        updated: "world",
        create: (text) => text.includes("ell"),
        expected: true,
        updatedExpected: false,
      },
      {
        name: "indexOf returns the first matching index",
        initial: "hello",
        updated: "world",
        create: (text) => text.indexOf("l"),
        expected: 2,
        updatedExpected: 3,
      },
      {
        name: "lastIndexOf returns the final matching index",
        initial: "hello",
        updated: "level",
        create: (text) => text.lastIndexOf("l"),
        expected: 3,
        updatedExpected: 4,
      },
      {
        name: "padEnd returns end-padded text",
        initial: "hello",
        updated: "hi",
        create: (text) => text.padEnd(7, "."),
        expected: "hello..",
        updatedExpected: "hi.....",
      },
      {
        name: "padStart returns start-padded text",
        initial: "hello",
        updated: "hi",
        create: (text) => text.padStart(7, "."),
        expected: "..hello",
        updatedExpected: ".....hi",
      },
      {
        name: "repeat returns repeated text",
        initial: "ab",
        updated: "x",
        create: (text) => text.repeat(2),
        expected: "abab",
        updatedExpected: "xx",
      },
      {
        name: "slice returns the selected range",
        initial: "hello",
        updated: "world",
        create: (text) => text.slice(1, 4),
        expected: "ell",
        updatedExpected: "orl",
      },
      {
        name: "startsWith checks the prefix",
        initial: "hello",
        updated: "world",
        create: (text) => text.startsWith("he"),
        expected: true,
        updatedExpected: false,
      },
      {
        name: "substring returns the selected range",
        initial: "hello",
        updated: "world",
        create: (text) => text.substring(1, 4),
        expected: "ell",
        updatedExpected: "orl",
      },
      {
        name: "trim returns text without surrounding whitespace",
        initial: "  hello  ",
        updated: "  world  ",
        create: (text) => text.trim(),
        expected: "hello",
        updatedExpected: "world",
      },
      {
        name: "trimEnd returns text without trailing whitespace",
        initial: "  hello  ",
        updated: "  world  ",
        create: (text) => text.trimEnd(),
        expected: "  hello",
        updatedExpected: "  world",
      },
      {
        name: "trimStart returns text without leading whitespace",
        initial: "  hello  ",
        updated: "  world  ",
        create: (text) => text.trimStart(),
        expected: "hello  ",
        updatedExpected: "world  ",
      },
      {
        name: "length returns the UTF-16 length",
        initial: "hello",
        updated: "hello world",
        create: (text) => text.length(),
        expected: 5,
        updatedExpected: 11,
      },
      {
        name: "normalize returns the requested Unicode form",
        initial: "e\u0301",
        updated: "A\u030A",
        create: (text) => text.normalize("NFC"),
        expected: "é",
        updatedExpected: "Å",
      },
      {
        name: "replace accepts a string search and replacement",
        initial: "hello world",
        updated: "world hello",
        create: (text) => text.replace("world", "there"),
        expected: "hello there",
        updatedExpected: "there hello",
      },
      {
        name: "replaceAll accepts a RegExp and callback",
        initial: "cat cat",
        updated: "cat dog",
        create: (text) =>
          text.replaceAll(/cat/g, (match) => match.toUpperCase()),
        expected: "CAT CAT",
        updatedExpected: "CAT dog",
      },
      {
        name: "search returns a matching index or -1",
        initial: "hello world",
        updated: "hello there",
        create: (text) => text.search(/world/),
        expected: 6,
        updatedExpected: -1,
      },
      {
        name: "split accepts a RegExp and a limit",
        initial: "one two three",
        updated: "four five",
        create: (text) => text.split(/\s+/, 2),
        expected: ["one", "two"],
        updatedExpected: ["four", "five"],
      },
      {
        name: "toLocaleLowerCase uses an explicit locale",
        initial: "HELLO",
        updated: "WORLD",
        create: (text) => text.toLocaleLowerCase("en-US"),
        expected: "hello",
        updatedExpected: "world",
      },
      {
        name: "toLocaleUpperCase uses an explicit locale",
        initial: "hello",
        updated: "world",
        create: (text) => text.toLocaleUpperCase("en-US"),
        expected: "HELLO",
        updatedExpected: "WORLD",
      },
      {
        name: "toLowerCase lowercases text",
        initial: "HELLO",
        updated: "WORLD",
        create: (text) => text.toLowerCase(),
        expected: "hello",
        updatedExpected: "world",
      },
      {
        name: "toUpperCase uppercases text",
        initial: "hello",
        updated: "world",
        create: (text) => text.toUpperCase(),
        expected: "HELLO",
        updatedExpected: "WORLD",
      },
      {
        name: "deepTrim trims and collapses whitespace",
        initial: "  hello     world  ",
        updated: "  hi       there  ",
        create: (text) => text.deepTrim(),
        expected: "hello world",
        updatedExpected: "hi there",
      },
    ];

    for (const testCase of cases) {
      it(testCase.name, () => {
        const text = signal(testCase.initial);
        const result = testCase.create(text);

        expect(result.type).toBe("derived-signal");
        expect(result.value).toEqual(testCase.expected);
        expect(text.value).toBe(testCase.initial);

        text.value = testCase.updated;
        expect(result.value).toEqual(testCase.updatedExpected);
        expect(text.value).toBe(testCase.updated);
      });
    }

    it("localeCompare reacts and is asserted by sign", () => {
      const text = signal("a");
      const comparison = text.localeCompare("b", "en-US");

      expect(comparison.value).toBeLessThan(0);
      expect(text.value).toBe("a");

      text.value = "c";
      expect(comparison.value).toBeGreaterThan(0);
      expect(text.value).toBe("c");
    });

    it("reacts to signal-valued string parameters", () => {
      const text = signal("cat");
      const targetLength = signal(5);
      const fill = signal<string | undefined>(".");
      const search = signal("cat");
      const padded = text.padEnd(targetLength, fill);
      const included = text.includes(search);

      expect(padded.value).toBe("cat..");
      expect(included.value).toBe(true);

      targetLength.value = 6;
      fill.value = "-";
      search.value = "dog";
      expect(padded.value).toBe("cat---");
      expect(included.value).toBe(false);
      expect(text.value).toBe("cat");
    });

    it("accepts native replace, replaceAll, and split parameter forms", () => {
      const text = signal("cat bat cat");
      const replacedByCallback = text.replace(/cat/, (match) =>
        match.toUpperCase(),
      );
      const replacedAllByString = text.replaceAll("cat", "dog");
      const splitByString = text.split(" ");

      expect(replacedByCallback.value).toBe("CAT bat cat");
      expect(replacedAllByString.value).toBe("dog bat dog");
      expect(splitByString.value).toEqual(["cat", "bat", "cat"]);

      text.value = "cat dog";
      expect(replacedByCallback.value).toBe("CAT dog");
      expect(replacedAllByString.value).toBe("dog dog");
      expect(splitByString.value).toEqual(["cat", "dog"]);
    });

    it("distinguishes out-of-range character results", () => {
      const text = signal("hi");
      expect(text.at(10).value).toBeUndefined();
      expect(text.charAt(10).value).toBe("");
      expect(text.charCodeAt(10).value).toBeNaN();
      expect(text.codePointAt(10).value).toBeUndefined();
    });
  });

  it("supports non-mutating methods on derived and dead string signals", () => {
    const source = signal("  hello   world  ");
    const derived = derive(() => source.value);
    const trimmed = derived.deepTrim();
    const dead = deadSignal("hello");

    expect(trimmed.value).toBe("hello world");
    expect(dead.toUpperCase().value).toBe("HELLO");

    source.value = "  hi   there  ";
    expect(trimmed.value).toBe("hi there");
  });

  it("returns derived results for live strings and dead snapshots for dead strings", () => {
    const source = signal("cat");
    const derived = derive(() => source.value.trim());
    const dead = deadSignal("cat");
    const deadWithWhitespace = deadSignal("  dead   value  ");
    const targetLength = signal(5);
    const fill = signal<string | undefined>(".");

    const sourcePadded = source.padEnd(targetLength, fill);
    const derivedUppercase = derived.toUpperCase();
    const deadPadded = dead.padEnd(targetLength, fill);
    const deadTrimmed = deadWithWhitespace.deepTrim();

    expect(sourcePadded.type).toBe("derived-signal");
    expect(derivedUppercase.type).toBe("derived-signal");
    expect(deadPadded.type).toBe("dead-signal");
    expect(deadTrimmed.type).toBe("dead-signal");
    expect(deadTrimmed.value).toBe("dead value");

    targetLength.value = 6;
    fill.value = "-";
    source.value = " dog ";

    expect(sourcePadded.value).toBe(" dog -");
    expect(derivedUppercase.value).toBe("DOG");
    expect(deadPadded.value).toBe("cat..");
    expect(deadTrimmed.value).toBe("dead value");
  });

  it("attaches string methods for a nullable signal after transition", () => {
    const nullableText = signal<string | undefined>(undefined, "");
    nullableText.value = "  hello  ";
    const narrowed = nullableText as unknown as SourceSignal<string>;
    const trimmed = narrowed.trim();

    expect(trimmed.value).toBe("hello");
    nullableText.value = "  world  ";
    expect(trimmed.value).toBe("world");
  });
});

describe("object data methods", () => {
  it("set shallowly merges, returns void, isolates input, and triggers once", () => {
    const externalInput = {
      name: "Ada",
      details: { active: true },
    };
    const object = signal(externalInput);
    let effectRuns = 0;
    const watcher = effect(() => {
      void object.value;
      effectRuns++;
    });

    const result = object.mutate.set({ name: "Grace" });

    expect(result).toBeUndefined();
    expect(object.value).toEqual({
      name: "Grace",
      details: { active: true },
    });
    expect(object.prevValue).toEqual(externalInput);
    expect(externalInput).toEqual({
      name: "Ada",
      details: { active: true },
    });
    expect(effectRuns).toBe(2);
    watcher.dispose();
  });

  it("get returns a reactive property signal", () => {
    const object = signal<{ name: string; active?: boolean }>({ name: "Ada" });
    const active = object.get("active");

    expect(active.value).toBeUndefined();
    expect(object.value).toEqual({ name: "Ada" });

    object.mutate.set({ active: true });
    expect(active.value).toBe(true);
  });

  it("keys returns reactive enumerable keys without changing the source", () => {
    const object = signal<{ name: string; active?: boolean }>({ name: "Ada" });
    const keys = object.keys();

    expect(keys.value).toEqual(["name"]);
    expect(object.value).toEqual({ name: "Ada" });

    object.mutate.set({ active: true });
    expect(keys.value).toEqual(["name", "active"]);
  });

  it("props returns reactive signals for each existing property", () => {
    const object = signal({ name: "Ada", count: 1 });
    const props = object.props();

    expect(props.name.value).toBe("Ada");
    expect(props.count.value).toBe(1);
    expect(object.value).toEqual({ name: "Ada", count: 1 });

    object.mutate.set({ name: "Grace", count: 2 });
    expect(props.name.value).toBe("Grace");
    expect(props.count.value).toBe(2);
  });

  it("supports non-mutating methods on derived and dead object signals", () => {
    const source = signal({ name: "Ada", count: 1 });
    const derived = derive(() => source.value);
    const name = derived.get("name");
    const dead = deadSignal({ name: "Grace", count: 2 });

    expect(name.value).toBe("Ada");
    expect(dead.keys().value).toEqual(["name", "count"]);

    source.mutate.set({ name: "Lin" });
    expect(name.value).toBe("Lin");
  });

  it("returns derived object projections for live inputs and dead projections for dead inputs", () => {
    const source = signal({ name: "Ada", count: 1 });
    const derived = derive(() => source.value);
    const dead = deadSignal({ name: "Grace", count: 2 });

    const sourceKeys = source.keys();
    const derivedName = derived.get("name");
    const deadKeys = dead.keys();
    const sourceProps = source.props();
    const derivedProps = derived.props();
    const deadProps = dead.props();

    expect(sourceKeys.type).toBe("derived-signal");
    expect(derivedName.type).toBe("derived-signal");
    expect(deadKeys.type).toBe("dead-signal");
    expect(sourceProps.name.type).toBe("derived-signal");
    expect(sourceProps.count.type).toBe("derived-signal");
    expect(derivedProps.name.type).toBe("derived-signal");
    expect(derivedProps.count.type).toBe("derived-signal");
    expect(deadProps.name.type).toBe("dead-signal");
    expect(deadProps.count.type).toBe("dead-signal");

    source.mutate.set({ name: "Lin", count: 3 });

    expect(sourceKeys.value).toEqual(["name", "count"]);
    expect(derivedName.value).toBe("Lin");
    expect(sourceProps.name.value).toBe("Lin");
    expect(sourceProps.count.value).toBe(3);
    expect(derivedProps.name.value).toBe("Lin");
    expect(derivedProps.count.value).toBe(3);
    expect(deadKeys.value).toEqual(["name", "count"]);
    expect(deadProps.name.value).toBe("Grace");
    expect(deadProps.count.value).toBe(2);
  });
});

describe("number data methods", () => {
  const cases: Array<{
    name: string;
    initial: number;
    updated: number;
    create: (number: SourceSignal<number>) => ReactiveResult;
    expected: string | number;
    updatedExpected: string | number;
  }> = [
    {
      name: "toExponential returns exponential notation",
      initial: 100,
      updated: 25,
      create: (number) => number.toExponential(2),
      expected: "1.00e+2",
      updatedExpected: "2.50e+1",
    },
    {
      name: "toFixed returns fixed-point notation",
      initial: 3.14159,
      updated: 2.71828,
      create: (number) => number.toFixed(2),
      expected: "3.14",
      updatedExpected: "2.72",
    },
    {
      name: "toPrecision returns the requested precision",
      initial: 123.456,
      updated: 789.012,
      create: (number) => number.toPrecision(4),
      expected: "123.5",
      updatedExpected: "789.0",
    },
    {
      name: "toLocaleString uses an explicit locale and options",
      initial: 1234.5,
      updated: 9876.5,
      create: (number) =>
        number.toLocaleString("en-US", {
          useGrouping: false,
          maximumFractionDigits: 1,
        }),
      expected: "1234.5",
      updatedExpected: "9876.5",
    },
    {
      name: "toConfined clamps to the supplied bounds",
      initial: 50,
      updated: 150,
      create: (number) => number.toConfined(0, 100),
      expected: 50,
      updatedExpected: 100,
    },
  ];

  for (const testCase of cases) {
    it(testCase.name, () => {
      const number = signal(testCase.initial);
      const result = testCase.create(number);

      expect(result.type).toBe("derived-signal");
      expect(result.value).toBe(testCase.expected);
      expect(number.value).toBe(testCase.initial);

      number.value = testCase.updated;
      expect(result.value).toBe(testCase.updatedExpected);
      expect(number.value).toBe(testCase.updated);
    });
  }

  it("reacts to signal-valued precision and confinement bounds", () => {
    const number = signal(12.345);
    const digits = signal<number | undefined>(2);
    const start = signal(0);
    const end = signal(20);
    const fixed = number.toFixed(digits);
    const confined = number.toConfined(start, end);

    expect(fixed.value).toBe("12.35");
    expect(confined.value).toBe(12.345);

    digits.value = 1;
    end.value = 10;
    expect(fixed.value).toBe("12.3");
    expect(confined.value).toBe(10);
  });

  it("supports non-mutating methods on derived and dead number signals", () => {
    const source = signal(3.14159);
    const derived = derive(() => source.value);
    const fixed = derived.toFixed(2);
    const dead = deadSignal(12.345);

    expect(fixed.value).toBe("3.14");
    expect(dead.toPrecision(4).value).toBe("12.35");

    source.value = 2.71828;
    expect(fixed.value).toBe("2.72");
  });

  it("returns derived results for live numbers and dead snapshots for dead numbers", () => {
    type HybridNumber = LiveSignal<number> | DeadSignal<number>;
    const fromHybrid = (input: HybridNumber) => input.toFixed(0);

    const source = signal(12.345);
    const derived = derive(() => source.value);
    const dead = deadSignal(12.345);
    const deadOutsideBounds = deadSignal(30);
    const digits = signal<number | undefined>(2);
    const end = signal(20);

    const sourceFixed = source.toFixed(digits);
    const derivedConfined = derived.toConfined(0, end);
    const deadFixed = dead.toFixed(digits);
    const deadConfined = deadOutsideBounds.toConfined(0, end);
    const hybridLiveResult = fromHybrid(source);
    const hybridDeadResult = fromHybrid(dead);

    expect(sourceFixed.type).toBe("derived-signal");
    expect(derivedConfined.type).toBe("derived-signal");
    expect(deadFixed.type).toBe("dead-signal");
    expect(deadConfined.type).toBe("dead-signal");
    expect(hybridLiveResult.type).toBe("derived-signal");
    expect(hybridDeadResult.type).toBe("dead-signal");

    digits.value = 1;
    end.value = 10;
    source.value = 25.55;

    expect(sourceFixed.value).toBe("25.6");
    expect(derivedConfined.value).toBe(10);
    expect(deadFixed.value).toBe("12.35");
    expect(deadConfined.value).toBe(20);
    expect(hybridLiveResult.value).toBe("26");
    expect(hybridDeadResult.value).toBe("12");
  });
});

describe("boolean data methods", () => {
  it("toggle flips the value, returns void, and triggers once per call", () => {
    const boolean = signal(true);
    let effectRuns = 0;
    const watcher = effect(() => {
      void boolean.value;
      effectRuns++;
    });

    const firstResult = boolean.mutate.toggle();
    expect(firstResult).toBeUndefined();
    expect(boolean.value).toBe(false);
    expect(boolean.prevValue).toBe(true);
    expect(effectRuns).toBe(2);

    const secondResult = boolean.mutate.toggle();
    expect(secondResult).toBeUndefined();
    expect(boolean.value).toBe(true);
    expect(boolean.prevValue).toBe(false);
    expect(effectRuns).toBe(3);
    watcher.dispose();
  });
});

describe("data-method dispatch", () => {
  it("keeps unsupported primitive signals usable without data methods", () => {
    const first = Symbol("first");
    const second = Symbol("second");
    const source = signal<symbol>(first);
    const derived = derive(() => source.value);

    expect(source.value).toBe(first);
    expect(derived.value).toBe(first);

    source.value = second;
    expect(source.value).toBe(second);
    expect(derived.value).toBe(second);
  });
});
