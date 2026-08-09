export type TSDocTag = {
  name: string;
  description: string;
};

export type TSDoc = {
  title: string;
  summary: string;
  remarks: string[];
  examples: string[];
  params: TSDocTag[];
  returns: string[];
  see: string[];
  template: TSDocTag[];
  deprecated: string[];
};

export type CodeEntity = {
  name: string;
  kind: "const" | "type";
  filePath: string;
  sourcePath: string;
  isCallable: boolean;
  isExported: boolean;
  exportKind: "named" | "default" | "reexport";
  category: "core" | "api" | "utils";
  subcategory?: string;
  signature?: string;
  type?: string;
  parameters?: Array<{ name: string; type: string; optional: boolean }>;
  typeParameters?: string[];
  tsdoc: TSDoc;
};

export type CodeEntitiesMeta = {
  const: {
    core: CodeEntity[];
    api: CodeEntity[];
    utils: CodeEntity[];
  };
  type: {
    core: CodeEntity[];
    api: CodeEntity[];
    utils: CodeEntity[];
  };
};
