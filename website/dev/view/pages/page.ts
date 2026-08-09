import { m } from "@cyftec/maya/core";
import { CodeBlock, HtmlPage } from "../components";
import { CODE_SAMPLES, extractCodeTokens } from "../../controller";

export default HtmlPage({
  children: m.Main({
    class: "landing",
    children: [
      m.Section({
        class: "showcase",
        children: [
          m.Div({
            class: "showcase-code",
            children: [
              m.H1(
                "Signals you can wire in the code, watch the effects in the UI.",
              ),
              m.P(
                "A source signal owns the state. An effect observes that state. When the value changes, the UI follows synchronously.",
              ),
              CodeBlock({
                noCopy: true,
                tokens: extractCodeTokens(CODE_SAMPLES.SHOWCASE, "ts"),
              }),
            ],
          }),
          m.Div({
            class: "card showcase-demo",
            children: m.Div({
              class: "traffic-scene",
              children: [
                m.Div({
                  class: "traffic-controller",
                  children: [
                    m.Span({ children: "signal value" }),
                    m.Strong({
                      class: "state-word",
                    }),
                  ],
                }),
                m.Div({
                  class: "card traffic-light",
                  children: [
                    m.Div({ class: "lamp lamp-red" }),
                    m.Div({ class: "lamp lamp-amber" }),
                    m.Div({ class: "lamp lamp-green" }),
                  ],
                }),
                m.Div({
                  class: "traffic-timeline",
                  children: [
                    m.Span({ children: "red" }),
                    m.Span({ children: "amber" }),
                    m.Span({ children: "green" }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      m.Section({
        class: "landing-grid",
        children: m.For({
          subject: [
            {
              href: "/api-docs/",
              title: "api-docs",
              description:
                    "Generated API reference driven by semantic source comments and metadata.",
            },
            {
              href: "/tutorial/",
              title: "tutorial",
              description:
                "Learning-first guide with examples, outcomes, and progressive steps.",
            },
            {
              href: "/architecture/",
              title: "architecture",
              description:
                "Contributor-focused diagrams and implementation notes.",
            },
          ],
          map: (item) =>
            m.A({
              class: "card landing-card",
              href: item.href,
              children: [
                m.Span({ children: item.title }),
                m.Small({ children: item.description }),
              ],
            }),
        }),
      }),
    ],
  }),
});
