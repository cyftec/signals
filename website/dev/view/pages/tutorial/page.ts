import { m } from "@cyftec/maya/core";
import { CodeBlock, HtmlPage } from "../../components";
import { CODE_SAMPLES, extractCodeTokens } from "../../../controller";

export default HtmlPage({
  title: "Tutorial",
  children: m.Main({
    class: "main",
    children: m.Article({
      class: "doc",
      children: [
        m.Header({
          class: "card deep mb2",
          children: [
            m.Div({ class: "eyebrow", children: "Tutorial" }),
            m.H1({ children: "Tutorial" }),
            m.P({
              children: "Learn the library step by step.",
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "1. Import" }),
            m.Pre({
              children: CodeBlock({
                tokens: extractCodeTokens(CODE_SAMPLES.IMPORT, "ts"),
              }),
            }),
            m.P({ children: "Expected result:" }),
            m.Ul({
              children: [
                m.Li({ children: "the library imports cleanly" }),
                m.Li({
                  children: "the three primitives are available immediately",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "2. Create State" }),
            m.Pre({
              children: CodeBlock({
                tokens: extractCodeTokens(CODE_SAMPLES.CREATE_STATE, "ts"),
              }),
            }),
            m.P({ children: "What changed:" }),
            m.Ul({
              children: [
                m.Li({ children: "`signal()` stores mutable state" }),
                m.Li({
                  children: "`.value` reads and writes the current value",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "3. Read From State" }),
            m.Pre({
              children: CodeBlock({
                tokens: extractCodeTokens(CODE_SAMPLES.READ_FROM_STATE, "ts"),
              }),
            }),
            m.P({ children: "Expected result:" }),
            m.Ul({
              children: [
                m.Li({
                  children: "output reads the current signal value directly",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "4. Derive State" }),
            m.Pre({
              children: CodeBlock({
                tokens: extractCodeTokens(CODE_SAMPLES.DERIVE_STATE, "ts"),
              }),
            }),
            m.P({ children: "What changed:" }),
            m.Ul({
              children: [
                m.Li({
                  children: "`derive()` computes new state from existing state",
                }),
                m.Li({
                  children: "the result stays in sync automatically",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "5. React To Changes" }),
            m.Pre({
              children: CodeBlock({
                tokens: extractCodeTokens(CODE_SAMPLES.REACT_TO_CHANGES, "ts"),
              }),
            }),
            m.P({ children: "Expected result:" }),
            m.Ul({
              children: [
                m.Li({
                  children: "the effect runs once immediately",
                }),
                m.Li({ children: "it runs again after the update" }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "6. Combine Signals" }),
            m.Pre({
              children: CodeBlock({
                tokens: extractCodeTokens(CODE_SAMPLES.COMBINE_SIGNALS, "ts"),
              }),
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "7. Pattern to Prefer" }),
            m.Ul({
              children: [
                m.Li({
                  children: "Use `signal()` for mutable source data",
                }),
                m.Li({
                  children: "Use `derive()` for computed values",
                }),
                m.Li({
                  children:
                    "Use `effect()` for logging, DOM updates, and integration points",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "8. Mental Model" }),
            m.Div({
              class: "card diagram-block",
              children: m.Div({
                class: "diagram-svg",
                children: [
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "source signal" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "derive()" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "effect()" }),
                  }),
                ],
              }),
            }),
            m.P({
              children:
                "Use this when you want the shortest path from state to UI.",
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "9. Equality Short-Circuit" }),
            m.Pre({
              children: CodeBlock({
                tokens: extractCodeTokens(
                  CODE_SAMPLES.EQUALITY_SHORT_CIRCUIT,
                  "ts",
                ),
              }),
            }),
            m.P({ children: "Expected result:" }),
            m.Ul({
              children: [
                m.Li({
                  children: "the effect does not re-run for the same value",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "10. Dispose When Done" }),
            m.Pre({
              children: CodeBlock({
                tokens: extractCodeTokens(CODE_SAMPLES.DISPOSE_WHEN_DONE, "ts"),
              }),
            }),
            m.P({ children: "Expected result:" }),
            m.Ul({
              children: [
                m.Li({
                  children:
                    "the disposed effect is disconnected immediately and does not run again",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "11. Arrays And Objects" }),
            m.Pre({
              children: CodeBlock({
                tokens: extractCodeTokens(
                  CODE_SAMPLES.ARRAYS_AND_OBJECTS,
                  "ts",
                ),
              }),
            }),
            m.P({ children: "Expected result:" }),
            m.Ul({
              children: [
                m.Li({
                  children: "array mutations are grouped under `.mutate`",
                }),
                m.Li({
                  children: "object `.mutate.set()` performs a shallow merge",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  }),
});
