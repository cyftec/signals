import { component, m } from "@cyftec/maya/core";
import { derive } from "@cyftec/maya/signal";

type ParagraphProps = {
  text: string;
};

export const Paragraph = component<ParagraphProps>(({ text }) => {
  const paras = derive(() => text.value.split("\n\n"));

  return m.Div(
    m.For({
      subject: paras,
      map: (para) => m.P(para),
    }),
  );
});
