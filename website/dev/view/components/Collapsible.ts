import { Children, component, m } from "@cyftec/maya/core";
import { derive, receive, signal, tmpl } from "@cyftec/maya/signal";

type CollapsibleProps = {
  title: string;
  children: Children;
  expandedState?: boolean;
};

export const Collapsible = component<CollapsibleProps>(
  ({ expandedState, title, children }) => {
    const expanded = signal(true);
    const outerExpandedState = derive(() => !!expandedState?.value);
    const iconClass = tmpl`collapsible-icon ${() => (expanded.value ? "expanded" : "collapsed")}`;
    const iconLabel = derive(() => (expanded.value ? "𐱀" : "𐰷"));

    receive(expanded, outerExpandedState);

    return m.Div({
      class: "collapsible",
      children: [
        m.Button({
          type: "button",
          class: "collapsible-header",
          onclick: () => expanded.toggle(),
          children: [
            m.Span({ class: "collapsible-title", children: title }),
            m.Span({
              class: iconClass,
              children: iconLabel,
            }),
          ],
        }),
        m.If({
          subject: expanded,
          isTruthy: () =>
            m.Div({
              class: "collapsible-content",
              children,
            }),
        }),
      ],
    });
  },
);
