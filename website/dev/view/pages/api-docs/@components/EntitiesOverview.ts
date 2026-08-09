import { component, m } from "@cyftec/maya/core";
import { HeaderCard } from "./HeaderCard";

type EntitiesOverviewProps = {
  entityCategories: {
    type: string;
    label: string;
  }[];
};

export const EntitiesOverview = component<EntitiesOverviewProps>(
  ({ entityCategories }) => {
    return m.Article({
      class: "doc",
      children: [
        HeaderCard({
          eyebrow: "Reference",
          title: "API Docs",
          description:
            "Reference generated from semantic source comments and source metadata.",
          children: m.If({
            subject: entityCategories,
            isTruthy: () =>
              m.Div({
                class: "stats",
                children: m.For({
                  subject: entityCategories,
                  map: (category) =>
                    m.Div({
                      children: [
                        m.Strong({ children: category.label }),
                        m.Span({ children: `${category.type} entities` }),
                      ],
                    }),
                }),
              }),
          }),
        }),
        m.Section({
          class: "panel",
          children: [
            m.H2("Start here"),
            m.P(
              "Select a category from the navigation. Search filters both the nav and page content.",
            ),
          ],
        }),
      ],
    });
  },
);
