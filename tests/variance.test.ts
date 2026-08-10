import { describe, expect, it } from "bun:test";
import {
  derive,
  effect,
  receive,
  signal,
  transmit,
  type DerivedSignal,
  type SourceSignal,
} from "../src";

/**
 * Runtime companion to type-tests/variance.typecheck.ts.
 *
 * The public type contract permits a matching narrow signal view where a
 * wider signal view is expected. These tests exercise the same calls at
 * runtime after the widening assignment.
 */
type NarrowObject = { title: string; isSelected: boolean };
type WideObject = {
  title: string;
  href?: string;
  isSelected?: boolean;
};
type NarrowArray = NarrowObject[];
type WideArray = WideObject[];
type WideArrayProjectionMethodNames =
  | "at"
  | "concat"
  | "every"
  | "filter"
  | "find"
  | "findIndex"
  | "findLast"
  | "findLastIndex"
  | "length"
  | "map"
  | "reduce"
  | "reduceRight"
  | "some"
  | "toReversed"
  | "toSorted"
  | "toSpliced"
  | "lastItem";
type WideArrayProjectionSignal = Pick<
  DerivedSignal<WideArray>,
  WideArrayProjectionMethodNames
>;

const narrowItems = (): NarrowArray => [
  { title: "third", isSelected: true },
  { title: "first", isSelected: false },
  { title: "second", isSelected: true },
];

const wideItems = (): WideArray => [
  { title: "updated", href: "https://updated.test" },
  { title: "plain" },
  { title: "last", isSelected: false },
];

const labels = (items: WideArray): string[] =>
  items.map((item) => item.href ?? item.title);

const widenedArraySource = () => {
  const narrow = signal<NarrowArray>(narrowItems());
  const wide: SourceSignal<WideArray> = narrow;
  return { narrow, wide };
};

describe("source-signal widening", () => {
  it("exposes a stable source discriminator and unique identifier through the widened view", () => {
    const first = widenedArraySource().wide;
    const second = widenedArraySource().wide;

    expect(first.type).toBe("source-signal");
    expect(first.id).toBeGreaterThan(0);
    expect(second.id).toBeGreaterThan(first.id);
  });

  it("accepts every wider primitive-union write and preserves reactive bookkeeping", () => {
    const narrow = signal<"ready">("ready");
    const wide: SourceSignal<string | number | undefined> = narrow;
    const seen: Array<string | number | undefined> = [];
    const watcher = effect(() => seen.push(wide.value));

    wide.value = 1;
    wide.value = undefined;
    wide.value = "done";

    expect(wide.value).toBe("done");
    expect(wide.prevValue).toBeUndefined();
    expect(seen).toEqual(["ready", 1, undefined, "done"]);
  });

  it("accepts a widened object replacement and shallow optional-property updates", () => {
    const narrow = signal<NarrowObject>({ title: "initial", isSelected: true });
    const wide: SourceSignal<WideObject> = narrow;
    const href = wide.get("href");
    const title = wide.get("title");

    wide.mutate.set({ href: "https://example.test" });
    expect(wide.value).toEqual({
      title: "initial",
      isSelected: true,
      href: "https://example.test",
    });
    expect(href.value).toBe("https://example.test");

    wide.value = { title: "replacement" };
    expect(wide.prevValue).toEqual({
      title: "initial",
      isSelected: true,
      href: "https://example.test",
    });
    expect(title.value).toBe("replacement");
    expect(href.value).toBeUndefined();
  });

  it("retains object props fixed to keys present when props() is created", () => {
    const narrow = signal<NarrowObject>({ title: "initial", isSelected: true });
    const wide: SourceSignal<WideObject> = narrow;
    const props = wide.props();

    expect(props.title.value).toBe("initial");
    expect(props.isSelected?.value).toBe(true);
    expect(props.href).toBeUndefined();

    wide.mutate.set({ href: "https://added-later.test", isSelected: false });
    expect(props.title.value).toBe("initial");
    expect(props.isSelected?.value).toBe(false);
    expect(props.href).toBeUndefined();
  });
});

describe("widened source arrays", () => {
  const mutationCases: Array<{
    name: string;
    mutate: (items: SourceSignal<WideArray>) => void;
    expected: WideArray;
  }> = [
    {
      name: "concat accepts a wide-only item",
      mutate: (items) => items.mutate.concat({ title: "concat" }),
      expected: [...narrowItems(), { title: "concat" }],
    },
    {
      name: "copyWithin updates through the widened view",
      mutate: (items) => items.mutate.copyWithin(0, 1, 2),
      expected: [
        { title: "first", isSelected: false },
        { title: "first", isSelected: false },
        { title: "second", isSelected: true },
      ],
    },
    {
      name: "fill accepts a wide-only item",
      mutate: (items) => items.mutate.fill({ title: "filled" }, 1, 2),
      expected: [
        { title: "third", isSelected: true },
        { title: "filled" },
        { title: "second", isSelected: true },
      ],
    },
    {
      name: "filter receives the widened element view",
      mutate: (items) => items.mutate.filter((item) => item.title !== "first"),
      expected: [
        { title: "third", isSelected: true },
        { title: "second", isSelected: true },
      ],
    },
    {
      name: "pop updates through the widened view",
      mutate: (items) => items.mutate.pop(),
      expected: [
        { title: "third", isSelected: true },
        { title: "first", isSelected: false },
      ],
    },
    {
      name: "push accepts a wide-only item",
      mutate: (items) => items.mutate.push({ title: "push" }),
      expected: [...narrowItems(), { title: "push" }],
    },
    {
      name: "shift updates through the widened view",
      mutate: (items) => items.mutate.shift(),
      expected: [
        { title: "first", isSelected: false },
        { title: "second", isSelected: true },
      ],
    },
    {
      name: "toReversed updates through the widened view",
      mutate: (items) => items.mutate.toReversed(),
      expected: [
        { title: "second", isSelected: true },
        { title: "first", isSelected: false },
        { title: "third", isSelected: true },
      ],
    },
    {
      name: "toSorted receives the widened element view",
      mutate: (items) =>
        items.mutate.toSorted((left, right) =>
          left.title.localeCompare(right.title),
        ),
      expected: [
        { title: "first", isSelected: false },
        { title: "second", isSelected: true },
        { title: "third", isSelected: true },
      ],
    },
    {
      name: "toSpliced accepts a wide-only item",
      mutate: (items) => items.mutate.toSpliced(1, 1, { title: "spliced" }),
      expected: [
        { title: "third", isSelected: true },
        { title: "spliced" },
        { title: "second", isSelected: true },
      ],
    },
    {
      name: "unshift accepts a wide-only item",
      mutate: (items) => items.mutate.unshift({ title: "unshift" }),
      expected: [{ title: "unshift" }, ...narrowItems()],
    },
  ];

  for (const testCase of mutationCases) {
    it(`mutate.${testCase.name}`, () => {
      const { wide } = widenedArraySource();
      const projectedLabels = wide.map((item) => item.href ?? item.title);
      let effectRuns = 0;
      const watcher = effect(() => {
        void wide.value;
        effectRuns++;
      });

      testCase.mutate(wide);

      expect(wide.value).toEqual(testCase.expected);
      expect(projectedLabels.value).toEqual(labels(testCase.expected));
      expect(effectRuns).toBe(2);
    });
  }

  const projectionCases: Array<{
    name: string;
    create: (items: WideArrayProjectionSignal) => {
      type: string;
      value: unknown;
    };
    initial: unknown;
    updated: unknown;
  }> = [
    {
      name: "at",
      create: (items) => items.at(1),
      initial: { title: "first", isSelected: false },
      updated: { title: "plain" },
    },
    {
      name: "concat accepts a wide-only item",
      create: (items) => items.concat({ title: "concat" }),
      initial: [...narrowItems(), { title: "concat" }],
      updated: [...wideItems(), { title: "concat" }],
    },
    {
      name: "every receives the widened element view",
      create: (items) => items.every((item) => item.href !== undefined),
      initial: false,
      updated: false,
    },
    {
      name: "filter receives the widened element view",
      create: (items) => items.filter((item) => item.isSelected !== false),
      initial: [
        { title: "third", isSelected: true },
        { title: "second", isSelected: true },
      ],
      updated: [
        { title: "updated", href: "https://updated.test" },
        { title: "plain" },
      ],
    },
    {
      name: "find receives the widened element view",
      create: (items) => items.find((item) => item.href !== undefined),
      initial: undefined,
      updated: { title: "updated", href: "https://updated.test" },
    },
    {
      name: "findIndex receives the widened element view",
      create: (items) => items.findIndex((item) => item.href !== undefined),
      initial: -1,
      updated: 0,
    },
    {
      name: "findLast receives the widened element view",
      create: (items) => items.findLast((item) => item.isSelected === false),
      initial: { title: "first", isSelected: false },
      updated: { title: "last", isSelected: false },
    },
    {
      name: "findLastIndex receives the widened element view",
      create: (items) =>
        items.findLastIndex((item) => item.isSelected === false),
      initial: 1,
      updated: 2,
    },
    {
      name: "length",
      create: (items) => items.length(),
      initial: 3,
      updated: 3,
    },
    {
      name: "map receives the widened element view",
      create: (items) => items.map((item) => item.href ?? item.title),
      initial: ["third", "first", "second"],
      updated: ["https://updated.test", "plain", "last"],
    },
    {
      name: "reduce receives the widened element view",
      create: (items) =>
        items.reduce((all, item) => `${all}/${item.href ?? item.title}`, ""),
      initial: "/third/first/second",
      updated: "/https://updated.test/plain/last",
    },
    {
      name: "reduceRight receives the widened element view",
      create: (items) =>
        items.reduceRight((all, item) => `${all}/${item.title}`, ""),
      initial: "/second/first/third",
      updated: "/last/plain/updated",
    },
    {
      name: "some receives the widened element view",
      create: (items) => items.some((item) => item.href !== undefined),
      initial: false,
      updated: true,
    },
    {
      name: "toReversed",
      create: (items) => items.toReversed(),
      initial: [...narrowItems()].reverse(),
      updated: [...wideItems()].reverse(),
    },
    {
      name: "toSorted receives the widened element view",
      create: (items) =>
        items.toSorted((left, right) => left.title.localeCompare(right.title)),
      initial: [
        { title: "first", isSelected: false },
        { title: "second", isSelected: true },
        { title: "third", isSelected: true },
      ],
      updated: [
        { title: "last", isSelected: false },
        { title: "plain" },
        { title: "updated", href: "https://updated.test" },
      ],
    },
    {
      name: "toSpliced",
      create: (items) => items.toSpliced(1, 1, { title: "projection-splice" }),
      initial: [
        { title: "third", isSelected: true },
        { title: "projection-splice" },
        { title: "second", isSelected: true },
      ],
      updated: [
        { title: "updated", href: "https://updated.test" },
        { title: "projection-splice" },
        { title: "last", isSelected: false },
      ],
    },
    {
      name: "lastItem",
      create: (items) => items.lastItem(),
      initial: { title: "second", isSelected: true },
      updated: { title: "last", isSelected: false },
    },
  ];

  for (const testCase of projectionCases) {
    it(`projection.${testCase.name} reacts after a wide replacement`, () => {
      const { wide } = widenedArraySource();
      const result = testCase.create(wide);

      expect(result.type).toBe("derived-signal");
      expect(result.value).toEqual(testCase.initial);
      wide.value = wideItems();
      expect(result.value).toEqual(testCase.updated);
    });
  }

  for (const testCase of projectionCases) {
    it(`derived.${testCase.name} stays live after a narrow-to-wide assignment`, () => {
      const source = signal<NarrowArray>(narrowItems());
      const wideSource: SourceSignal<WideArray> = source;
      const narrow = derive(() => source.value);
      const wide: DerivedSignal<WideArray> = narrow;
      const result = testCase.create(wide);

      expect(result.type).toBe("derived-signal");
      expect(result.value).toEqual(testCase.initial);
      wideSource.value = wideItems();
      expect(result.value).toEqual(testCase.updated);
    });
  }

  it("partition reacts to a signal thisArg through a widened view", () => {
    const { wide } = widenedArraySource();
    const predicate = function (this: { selected: boolean }, item: WideObject) {
      return item.isSelected === this.selected;
    };
    const context = signal({ selected: true });
    const [passing, failing] = wide.partition(predicate, context);

    expect(passing.value).toEqual([
      { title: "third", isSelected: true },
      { title: "second", isSelected: true },
    ]);
    expect(failing.value).toEqual([{ title: "first", isSelected: false }]);

    context.value = { selected: false };
    expect(passing.value).toEqual([{ title: "first", isSelected: false }]);
    expect(failing.value).toEqual([
      { title: "third", isSelected: true },
      { title: "second", isSelected: true },
    ]);

    wide.value = wideItems();
    expect(passing.value).toEqual([{ title: "last", isSelected: false }]);
    expect(failing.value).toEqual([
      { title: "updated", href: "https://updated.test" },
      { title: "plain" },
    ]);
  });

  it("reacts when a signal-valued array operand changes through the widened view", () => {
    const { wide } = widenedArraySource();
    const index = signal(0);
    const appended = signal<WideObject>({ title: "first-extra" });
    const selected = wide.at(index);
    const concatenated = wide.concat(appended);

    expect(selected.value).toEqual({ title: "third", isSelected: true });
    expect(concatenated.value.at(-1)).toEqual({ title: "first-extra" });

    index.value = 2;
    appended.value = { title: "second-extra", href: "https://extra.test" };
    expect(selected.value).toEqual({ title: "second", isSelected: true });
    expect(concatenated.value.at(-1)).toEqual({
      title: "second-extra",
      href: "https://extra.test",
    });
  });
});

describe("widened derived data-specific signals", () => {
  it("keeps derived array projections live after a narrow-to-wide assignment", () => {
    const source = signal<NarrowArray>(narrowItems());
    const wideSource: SourceSignal<WideArray> = source;
    const narrow = derive(() => source.value);
    const wide: DerivedSignal<WideArray> = narrow;
    const hrefs = wide.map((item) => item.href ?? item.title);
    const [selected, unselected] = wide.partition(
      (item) => item.isSelected !== false,
    );

    expect(hrefs.value).toEqual(["third", "first", "second"]);
    wideSource.value = wideItems();
    expect(hrefs.value).toEqual(["https://updated.test", "plain", "last"]);
    expect(selected.value).toEqual([
      { title: "updated", href: "https://updated.test" },
      { title: "plain" },
    ]);
    expect(unselected.value).toEqual([{ title: "last", isSelected: false }]);
  });

  it("uses data-specific helpers through widened literal string, number, and boolean views", () => {
    const narrowString = signal<"  HELLO  ">("  HELLO  ");
    const wideString: SourceSignal<string> = narrowString;
    const trimmed = wideString.trim();
    const uppercase = wideString.toUpperCase();

    wideString.mutate.deepTrim();
    expect(wideString.value).toBe("HELLO");
    expect(trimmed.value).toBe("HELLO");
    expect(uppercase.value).toBe("HELLO");

    const narrowNumber = signal<1>(1);
    const wideNumber: SourceSignal<number> = narrowNumber;
    const limit = signal(2);
    const confined = wideNumber.toConfined(0, limit);
    const greater = wideNumber.is.greaterThan(0);
    wideNumber.value = 3;
    limit.value = 4;
    expect(wideNumber.toFixed(1).value).toBe("3.0");
    expect(confined.value).toBe(3);
    expect(greater.value).toBe(true);

    const narrowBoolean = signal<true>(true);
    const wideBoolean: SourceSignal<boolean> = narrowBoolean;
    const falsy = wideBoolean.is.falsy();
    wideBoolean.mutate.toggle();
    expect(wideBoolean.value).toBe(false);
    expect(falsy.value).toBe(true);
  });

  it("keeps generic comparisons and ternaries live through widened primitive-union writes", () => {
    const narrow = signal<"yes">("yes");
    const wide: SourceSignal<string | number | undefined> = narrow;
    const fallback = wide.or("fallback");
    const truthyLabel = wide.if.truthy().then("truthy", "falsy");
    const equals = wide.is.equalTo(1);

    expect(fallback.value).toBe("yes");
    expect(truthyLabel.value).toBe("truthy");
    expect(equals.value).toBe(false);

    wide.value = 1;
    expect(fallback.value as string | number).toBe(1);
    expect(truthyLabel.value).toBe("truthy");
    expect(equals.value).toBe(true);

    wide.value = undefined;
    expect(fallback.value).toBe("fallback");
    expect(truthyLabel.value).toBe("falsy");
    expect(equals.value).toBe(false);
  });

  it("covers every numeric confinement path through a widened number view", () => {
    const narrow = signal<1>(1);
    const wide: SourceSignal<number> = narrow;
    const lower = signal(0);
    const upper = signal(4);
    const confined = wide.toConfined(lower, upper);

    expect(confined.value).toBe(1);

    wide.value = -1;
    expect(confined.value).toBe(0);

    wide.value = 2;
    expect(confined.value).toBe(2);

    wide.value = 9;
    expect(confined.value).toBe(4);

    upper.value = 12;
    expect(confined.value).toBe(9);
  });

  it("covers strict comparisons and selects reactive ternary operands through a widened number view", () => {
    const narrow = signal<0>(0);
    const wide: SourceSignal<number> = narrow;
    const boundary = signal(2);
    const truthyOption = signal("above");
    const falsyOption = signal("not-above");
    const greater = wide.is.greaterThan(boundary);
    const greaterOrEqual = wide.is.greaterThanOrEqualTo(boundary);
    const smaller = wide.is.smallerThan(boundary);
    const smallerOrEqual = wide.is.smallerThanOrEqualTo(boundary);
    const unequal = wide.is.notEqualTo(boundary);
    const label = wide.if.greaterThan(boundary).then(
      truthyOption,
      falsyOption,
    );

    expect(greater.value).toBe(false);
    expect(greaterOrEqual.value).toBe(false);
    expect(smaller.value).toBe(true);
    expect(smallerOrEqual.value).toBe(true);
    expect(unequal.value).toBe(true);
    expect(label.value).toBe("not-above");

    wide.value = 2;
    expect(greater.value).toBe(false);
    expect(greaterOrEqual.value).toBe(true);
    expect(smaller.value).toBe(false);
    expect(smallerOrEqual.value).toBe(true);
    expect(unequal.value).toBe(false);

    wide.value = 3;
    expect(greater.value).toBe(true);
    expect(greaterOrEqual.value).toBe(true);
    expect(smaller.value).toBe(false);
    expect(smallerOrEqual.value).toBe(false);
    expect(unequal.value).toBe(true);
    expect(label.value).toBe("above");

    truthyOption.value = "greater";
    expect(label.value).toBe("greater");

    boundary.value = 4;
    falsyOption.value = "smaller";
    expect(label.value).toBe("smaller");
  });
});

describe("widened array branch outcomes", () => {
  it("preserves native boundary and predicate outcomes after widened replacements", () => {
    const { wide } = widenedArraySource();
    const index = signal(0);
    const selected = wide.at(index);
    const allSelected = wide.every((item) => item.isSelected === true);
    const anyHref = wide.some((item) => item.href !== undefined);
    const firstHref = wide.find((item) => item.href !== undefined);
    const lastUnselected = wide.findLast((item) => item.isSelected === false);

    expect(selected.value).toEqual({ title: "third", isSelected: true });
    expect(allSelected.value).toBe(false);
    expect(anyHref.value).toBe(false);
    expect(firstHref.value).toBeUndefined();
    expect(lastUnselected.value).toEqual({ title: "first", isSelected: false });

    index.value = -1;
    expect(selected.value).toEqual({ title: "second", isSelected: true });

    wide.value = [];
    expect(selected.value).toBeUndefined();
    expect(allSelected.value).toBe(true);
    expect(anyHref.value).toBe(false);
    expect(firstHref.value).toBeUndefined();
    expect(lastUnselected.value).toBeUndefined();

    wide.value = wideItems();
    expect(anyHref.value).toBe(true);
    expect(firstHref.value).toEqual({
      title: "updated",
      href: "https://updated.test",
    });
    expect(lastUnselected.value).toEqual({
      title: "last",
      isSelected: false,
    });
  });

  it("evaluates reducers with updated widened values and signal initial values", () => {
    const { wide } = widenedArraySource();
    const initialTotal = signal(10);
    const total = wide.reduce(
      (sum, item) => sum + item.title.length,
      initialTotal,
    );
    const reverseLabels = wide.reduceRight(
      (all, item) => `${all}${item.href ?? item.title}|`,
      signal(""),
    );

    expect(total.value).toBe(26);
    expect(reverseLabels.value).toBe("second|first|third|");

    initialTotal.value = 0;
    expect(total.value).toBe(16);

    wide.value = wideItems();
    expect(total.value).toBe(16);
    expect(reverseLabels.value).toBe("last|plain|https://updated.test|");
  });
});

describe("widened connectors", () => {
  it("receive keeps source and derived transmitter connections active in installation order", () => {
    const narrowSource = signal<NarrowObject>({
      title: "source",
      isSelected: true,
    });
    const narrowDerived = derive(() => ({
      title: `${narrowSource.value.title}-derived`,
      isSelected: narrowSource.value.isSelected,
    }));
    const receiver = signal<WideObject>({ title: "receiver" });

    receive(receiver, narrowSource);

    expect(receiver.value).toEqual({ title: "source", isSelected: true });
    narrowSource.value = { title: "source-update", isSelected: false };
    expect(receiver.value).toEqual({
      title: "source-update",
      isSelected: false,
    });

    receive(receiver, narrowDerived);

    expect(receiver.value).toEqual({
      title: "source-update-derived",
      isSelected: false,
    });
    narrowSource.value = { title: "derived-update", isSelected: true };
    expect(narrowDerived.value).toEqual({
      title: "derived-update-derived",
      isSelected: true,
    });
    expect(receiver.value).toEqual({
      title: "derived-update-derived",
      isSelected: true,
    });

    receive(receiver, { title: "plain", isSelected: true });
    expect(receiver.value).toEqual({ title: "plain", isSelected: true });

    narrowSource.value = { title: "connected-again", isSelected: false };
    expect(receiver.value).toEqual({
      title: "connected-again-derived",
      isSelected: false,
    });
  });

  it("receive honors initialization order and leaves only live narrow transmitters connected", () => {
    const first = signal<NarrowObject>({ title: "first", isSelected: true });
    const second = signal<NarrowObject>({ title: "second", isSelected: false });
    const receiver = signal<WideObject>({ title: "receiver" });
    const connections = receive(receiver, first, { title: "plain" }, second);

    expect(receiver.value).toEqual({ title: "second", isSelected: false });
    first.value = { title: "first-update", isSelected: false };
    expect(receiver.value).toEqual({
      title: "first-update",
      isSelected: false,
    });
    second.value = { title: "second-update", isSelected: true };
    expect(receiver.value).toEqual({
      title: "second-update",
      isSelected: true,
    });
  });

  it("transmit keeps source and derived broadcasts active in installation order", () => {
    const narrowSource = signal<NarrowObject>({
      title: "source",
      isSelected: true,
    });
    const derived = derive(() => ({
      title: `${narrowSource.value.title}-derived`,
      isSelected: narrowSource.value.isSelected,
    }));
    const left = signal<WideObject>({ title: "left" });
    const right = signal<WideObject>({ title: "right" });

    transmit(narrowSource, left, right);
    expect(left.value).toEqual({ title: "source", isSelected: true });
    expect(right.value).toEqual({ title: "source", isSelected: true });
    narrowSource.value = { title: "source-update", isSelected: false };
    expect(left.value).toEqual({ title: "source-update", isSelected: false });
    expect(right.value).toEqual({ title: "source-update", isSelected: false });

    transmit(derived, left, right);
    narrowSource.value = { title: "derived-update", isSelected: true };
    expect(left.value).toEqual({
      title: "derived-update-derived",
      isSelected: true,
    });
    expect(right.value).toEqual({
      title: "derived-update-derived",
      isSelected: true,
    });

    transmit({ title: "plain", isSelected: true }, left, right);
    expect(left.value).toEqual({ title: "plain", isSelected: true });
    expect(right.value).toEqual({ title: "plain", isSelected: true });

    narrowSource.value = { title: "broadcast-again", isSelected: false };
    expect(left.value).toEqual({
      title: "broadcast-again-derived",
      isSelected: false,
    });
    expect(right.value).toEqual({
      title: "broadcast-again-derived",
      isSelected: false,
    });
  });

  it("propagates wide writes made through a widened source transmitter", () => {
    const narrow = signal<NarrowObject>({ title: "initial", isSelected: true });
    const wide: SourceSignal<WideObject> = narrow;
    const receiver = signal<WideObject>({ title: "receiver" });
    const connection = transmit(wide, receiver);

    wide.value = { title: "wide-only" };
    expect(receiver.value).toEqual({ title: "wide-only" });
  });
});
