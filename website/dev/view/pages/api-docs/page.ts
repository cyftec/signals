import { m } from "@cyftec/maya/core";
import { derive, effect, signal } from "@cyftec/maya/signal";
import { updateSearchParamWithoutReload } from "../../../controller";
import { CodeEntitiesMeta, CodeEntity } from "../../../models";
import { HtmlPage } from "../../components";
import {
  EntitiesNavigator,
  EntitiesOverview,
  EntityDetails,
} from "./@components";

const selectedEntityName = signal("");
const entitiesMeta = signal<CodeEntitiesMeta>({
  type: {
    core: [],
    api: [],
    utils: [],
  },
  const: {
    core: [],
    api: [],
    utils: [],
  },
});
const selectedEntity = derive(() => {
  const selectedName = selectedEntityName.value;
  const entity: CodeEntity = entitiesMeta.value.const.core.find(
    (en) => selectedName === en.name,
  ) ||
    entitiesMeta.value.const.api.find((en) => selectedName === en.name) ||
    entitiesMeta.value.const.utils.find((en) => selectedName === en.name) ||
    entitiesMeta.value.type.core.find((en) => selectedName === en.name) ||
    entitiesMeta.value.type.api.find((en) => selectedName === en.name) ||
    entitiesMeta.value.type.utils.find((en) => selectedName === en.name) || {
      name: "",
      kind: "const",
      filePath: "",
      sourcePath: "",
      isCallable: false,
      isExported: false,
      exportKind: "default",
      category: "core",
      tsdoc: {
        title: "",
        summary: "",
        remarks: [],
        examples: [],
        params: [],
        returns: [],
        see: [],
        template: [],
        deprecated: [],
      },
    };

  return entity;
});

const entitieCategoriesOverview = derive(() => {
  const coreCount =
    (entitiesMeta.value.const.core.length || 0) +
    (entitiesMeta.value.type.core.length || 0);
  const apiCount =
    (entitiesMeta.value.const.api.length || 0) +
    (entitiesMeta.value.type.api.length || 0);
  const utilsCount =
    (entitiesMeta.value.const.utils.length || 0) +
    (entitiesMeta.value.type.utils.length || 0);

  return [
    { type: "core", label: `${coreCount}` },
    { type: "api", label: `${apiCount}` },
    { type: "utils", label: `${utilsCount}` },
  ];
});

const onEntitySelect = (codeEntityName: string) => {
  updateSearchParamWithoutReload({ name: codeEntityName });
  selectedEntityName.value = codeEntityName;
};

const loadApiDocs = async () => {
  const response = await fetch("/assets/code_entities_meta.json");
  if (!response.ok) throw new Error("Failed to load code_entities_meta.json");
  const metaJson = (await response.json()) as CodeEntitiesMeta;
  entitiesMeta.value = metaJson;
};

const onPageMount = () => {
  loadApiDocs();
  const params = Object.fromEntries(
    typeof globalThis !== "undefined"
      ? new URLSearchParams((globalThis as any).location?.search || "")
      : new URLSearchParams(),
  );
  if (params.name) selectedEntityName.value = params.name;
};

export default HtmlPage({
  title: "API Docs",
  children: m.Div({
    onmount: onPageMount,
    class: "app-shell",
    children: [
      m.Aside({
        class: "sidebar",
        "data-collapsed": "true",
        children: [
          m.Div({ class: "brand-title", children: "API Docs" }),
          EntitiesNavigator({
            meta: entitiesMeta,
            selectedEntityName,
            onEntitySelect,
          }),
        ],
      }),
      m.Main({
        class: "main",
        children: m.If({
          subject: selectedEntity.get("name"),
          isTruthy: () =>
            EntityDetails({ codeEntity: selectedEntity, onEntitySelect }),
          isFalsy: () =>
            EntitiesOverview({ entityCategories: entitieCategoriesOverview }),
        }),
      }),
    ],
  }),
});
