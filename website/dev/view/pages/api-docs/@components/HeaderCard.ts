import { component, m, Children } from "@cyftec/maya/core";

type HeaderCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: Children;
};

export const HeaderCard = component<HeaderCardProps>(
  ({ eyebrow, title, description, children }) => {
    return m.Header({
      class: "card deep mb2",
      children: [
        m.Div({ class: "eyebrow", children: eyebrow }),
        m.H1(title),
        m.P(description),
        m.Div(children),
      ],
    });
  },
);
