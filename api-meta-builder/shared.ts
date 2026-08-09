import * as fs from "fs";
import * as path from "path";

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

export const OUTPUT_FILENAME = "code_entities_meta.json";
export const OUTPUT_DIRNAME = "website/dev/view/pages/assets";
export const REPO_ROOT = path.join(__dirname, "..");
export const SRC_DIR_PATH = path.join(REPO_ROOT, "src");
export const OUTPUT_DIR_PATH = path.join(REPO_ROOT, OUTPUT_DIRNAME);
export const OUTPUT_FILE_PATH = path.join(OUTPUT_DIR_PATH, OUTPUT_FILENAME);

export function readText(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

export function writeText(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

export function stripIndent(input: string) {
  const lines = input.replace(/\t/g, "  ").split(/\r?\n/);
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines
    .map((line) => line.slice(min))
    .join("\n")
    .trim();
}

export function relSource(filePath: string) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

export function categoryForFile(filePath: string) {
  const rel = path.relative(SRC_DIR_PATH, filePath).split(path.sep).join("/");
  return rel.startsWith("_core/")
    ? "core"
    : rel.startsWith("api/")
      ? "api"
      : "utils";
}
