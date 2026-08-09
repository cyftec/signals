import { component, m } from "@cyftec/maya/core";
import { compute, derive, tmpl } from "@cyftec/maya/signal";
import { extractCodeTokens } from "../../../../controller";
import { CodeEntity } from "../../../../models";
import { CodeBlock, Paragraph } from "../../../components";
import { HeaderCard } from "./HeaderCard";

type EntityDetailsProps = {
  codeEntity: CodeEntity;
  onEntitySelect: (codeEntityName: string) => void;
};

export const EntityDetails = component<EntityDetailsProps>(
  ({ codeEntity, onEntitySelect }) => {
    const derivedCodeEntity = derive(() => codeEntity.value);
    const { kind, category, name, sourcePath, signature, tsdoc } =
      derivedCodeEntity.props();
    const nonNullSignature = derive(() => signature?.value || "");
    const {
      title,
      summary,
      returns,
      remarks,
      params,
      examples,
      see,
      template,
      deprecated,
    } = tsdoc.props();
    const remarkLines = derive(() => {
      let onlyRem = remarks.value[0] || "";
      if (onlyRem.startsWith("-")) onlyRem = onlyRem.slice(1).trim();
      return onlyRem.split("\n-");
    });
    const eyebrowLabel = tmpl`${category} / ${kind}`;

    return m.Article({
      class: "doc",
      children: [
        HeaderCard({
          eyebrow: eyebrowLabel,
          title: name,
          description: title,
          children: m.Div({
            class: "meta",
            children: ["Source: ", m.Code(sourcePath)],
          }),
        }),
        m.If({ subject: deprecated.length(), isTruthy: () => m.H2("Deprecated") }),
        m.Div(m.For({ subject: deprecated, map: (notice) => m.P(notice) })),
        Paragraph({ text: summary }),
        m.Br(),
        m.H2("Signature"),
        CodeBlock({
          tokens: compute(extractCodeTokens, nonNullSignature, "ts"),
        }),
        m.Br(),
        m.If({
          subject: template.length(),
          isTruthy: () => m.H2("Type parameters"),
        }),
        m.Ul(
          m.For({
            subject: template,
            map: (prm) =>
              m.Li([m.Code(prm.name), m.Span(": "), m.Span(prm.description)]),
          }),
        ),
        m.Br(),
        m.If({ subject: params.length(), isTruthy: () => m.H2("Parameters") }),
        m.Ul(
          m.For({
            subject: params,
            map: (prm) =>
              m.Li([m.Code(prm.name), m.Span(": "), m.Span(prm.description)]),
          }),
        ),
        m.Br(),
        m.If({ subject: returns.length(), isTruthy: () => m.H2("Returns") }),
        m.Div(m.For({ subject: returns, map: (ret) => m.P(ret) })),
        m.Br(),
        m.If({
          subject: remarkLines.length(),
          isTruthy: () => m.H2("Remarks"),
        }),
        m.Ul(m.For({ subject: remarkLines, map: (rem) => m.Li(rem) })),
        m.Br(),
        m.If({ subject: examples.length(), isTruthy: () => m.H2("Examples") }),
        m.Div(
          m.For({
            subject: examples,
            map: (ex) => {
              let example = ex.replaceAll("```", "");
              if (example.startsWith("typescript"))
                example = example.replace("typescript", "");
              if (example.startsWith("\n")) example = example.replace("\n", "");

              return CodeBlock({
                tokens: compute(extractCodeTokens, example, "ts"),
              });
            },
          }),
        ),
        m.Br(),
        m.If({ subject: see.length(), isTruthy: () => m.H2("See also") }),
        m.Ul(
          m.For({
            subject: see,
            map: (s) => {
              const [linkStr, description] = s.split("}");
              const codeEntityName = linkStr.split(" ").pop() || "";
              if (!codeEntityName) return m.Span({ style: "display: none;" });

              return m.Li([
                m.A({
                  onclick: () => onEntitySelect(codeEntityName),
                  children: codeEntityName,
                }),
                m.Span(description),
              ]);
            },
          }),
        ),
      ],
    });
  },
);
