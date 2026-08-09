import { m } from "@cyftec/maya/core";
import { HtmlPage } from "../../components";

export default HtmlPage({
  title: "Architecture",
  children: m.Main({
    class: "main",
    children: m.Article({
      class: "doc",
      children: [
        m.Header({
          class: "card deep mb2",
          children: [
            m.Div({ class: "eyebrow", children: "Architecture" }),
            m.H1({ children: "Architecture" }),
            m.P({
              children: "Understand the internal architecture visually.",
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "1. Core Runtime" }),
            m.Div({
              class: "card diagram-block",
              children: m.Div({
                class: "diagram-svg",
                children: [
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "signal(input)" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "base-signal storage" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "value getter" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "EffectHook registration" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "value setter / mutation" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({
                      children: "run dependent effects synchronously",
                    }),
                  }),
                ],
              }),
            }),
            m.P({
              children: "The core runtime is small on purpose:",
            }),
            m.Ul({
              children: [
                m.Li({ children: "`signal()` creates mutable source state" }),
                m.Li({
                  children:
                    "reading `.value` records the current EffectHook effect on the base signal",
                }),
                m.Li({
                  children:
                    "writing `.value` or using `.mutate` runs dependent effects immediately",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "2. Dependency Tracking" }),
            m.Div({
              class: "card diagram-block",
              children: m.Div({
                class: "diagram-svg",
                children: [
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "effect(fn)" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "EffectHook" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "signal.value getter" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "base signal effect Set" }),
                  }),
                ],
              }),
            }),
            m.P({
              children: "Tracking is global and temporary:",
            }),
            m.Ul({
              children: [
                m.Li({
                  children:
                    "`effect()` places itself in the singleton EffectHook before the initial callback",
                }),
                m.Li({
                  children:
                    "each live signal getter records a two-way subscription between the signal and effect",
                }),
                m.Li({
                  children:
                    "a `finally` block clears the hook when initial execution ends",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "3. Derived Signal Model" }),
            m.Div({
              class: "card diagram-block",
              children: m.Div({
                class: "diagram-svg",
                children: [
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "derive(fn)" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({
                      children: "base-signal storage",
                    }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "internal updater effect" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "computed value" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({
                      children: "read-only public facade",
                    }),
                  }),
                ],
              }),
            }),
            m.P({
              children: "Derived signals reuse the base-signal engine:",
            }),
            m.Ul({
              children: [
                m.Li({
                  children:
                    "a base signal stores the current and previous computed values",
                }),
                m.Li({ children: "an internal effect recomputes the value" }),
                m.Li({
                  children:
                    "the public derived signal exposes read-only `.value`, `prevValue`, and `dispose()`",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "4. Disposal" }),
            m.Div({
              class: "card diagram-block",
              children: m.Div({
                class: "diagram-svg",
                children: [
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "dispose() called" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "remove subscriptions now" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({
                      children: "clear effect bookkeeping",
                    }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({
                      children: "isDisposed = true",
                    }),
                  }),
                ],
              }),
            }),
            m.P({
              children: "Disposal is immediate:",
            }),
            m.Ul({
              children: [
                m.Li({
                  children:
                    "calling `dispose()` removes the effect from every captured stimulus signal",
                }),
                m.Li({
                  children: "future writes cannot run the disposed effect",
                }),
                m.Li({
                  children:
                    "disposing the same live effect or derived signal twice throws",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "5. Data Flow" }),
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
                    children: m.Span({ children: "derived signal" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "effect" }),
                  }),
                  m.Div({ class: "diagram-arrow", children: "→" }),
                  m.Div({
                    class: "card shallow diagram-node",
                    children: m.Span({ children: "side effects" }),
                  }),
                ],
              }),
            }),
            m.P({
              children: "The actual data flow is:",
            }),
            m.Ul({
              children: [
                m.Li({ children: "a source signal stores state" }),
                m.Li({
                  children:
                    "derived signals read source signals and recompute immediately",
                }),
                m.Li({
                  children: "effects observe signals by reading `.value`",
                }),
                m.Li({
                  children:
                    "updates propagate synchronously through the dependency set",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "6. Internal State And Method Liveness" }),
            m.Ul({
              children: [
                m.Li({
                  children: "Source signals store `_value` and `_effects`",
                }),
                m.Li({
                  children:
                    "Effects store disposal state plus stimulus and dependent signal Sets",
                }),
                m.Li({
                  children:
                    "Derived signals combine base-signal storage, an updater effect, and a read-only setter",
                }),
                m.Li({
                  children:
                    "Live data methods return derived signals; dead-signal methods return snapshots",
                }),
                m.Li({
                  children:
                    "Source mutations for arrays, objects, strings, and booleans live under `.mutate`",
                }),
              ],
            }),
          ],
        }),
        m.Section({
          children: [
            m.H2({ children: "7. Why This Design" }),
            m.Ul({
              children: [
                m.Li({
                  children: "It keeps the runtime small and explicit",
                }),
                m.Li({
                  children: "It avoids hidden batching or deferred execution",
                }),
                m.Li({
                  children:
                    "It gives live and dead values a consistent projection vocabulary",
                }),
                m.Li({
                  children:
                    "It keeps dependency capture explicit: only initial live getter reads subscribe",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  }),
});
