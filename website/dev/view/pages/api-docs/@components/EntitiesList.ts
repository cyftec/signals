import { component, m } from "@cyftec/maya/core";
import { CodeEntitiesMeta, CodeEntity } from "../../../../models";
import { derive, tmpl } from "@cyftec/maya/signal";
import { Collapsible } from "../../../components";

type CodeEntityKind = CodeEntity["kind"];
type CodeEntityCategory = CodeEntity["category"];

export type EntitiesListProps = {
  expanded?: boolean;
  filteredEntitiesMeta: CodeEntitiesMeta;
  selectedEntityName: string;
  onEntitySelect: (codeEntityName: string) => void;
};

export const EntitiesList = component<EntitiesListProps>(
  ({ expanded, filteredEntitiesMeta, selectedEntityName, onEntitySelect }) => {
    return m.Div({
      children: m.For({
        subject: ["const", "type"] as CodeEntityKind[],
        map: (codeEntityKind) => {
          const codeEntitiesGroup = derive(
            () => filteredEntitiesMeta.value[codeEntityKind],
          );

          return Collapsible({
            expandedState: expanded,
            title: codeEntityKind,
            children: m.For({
              subject: ["core", "api", "utils"] as CodeEntityCategory[],
              map: (category) => {
                const codeEntities = derive(
                  () => codeEntitiesGroup.value[category],
                );

                return Collapsible({
                  expandedState: expanded,
                  title: category,
                  children: m.For({
                    subject: codeEntities,
                    map: ({ name, tsdoc }) =>
                      m.A({
                        class: tmpl`nav-link ${() => (selectedEntityName.value === name ? "active" : "")}`,
                        onclick: () => onEntitySelect(name),
                        children: [
                          m.Span({ children: name }),
                          m.Small({ children: tsdoc.title }),
                        ],
                      }),
                  }),
                });
              },
            }),
          });
        },
      }),
    });
  },
);
