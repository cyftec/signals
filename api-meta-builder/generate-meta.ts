#!/usr/bin/env bun
import * as fs from "fs";
import * as path from "path";
import ts from "typescript";
import {
  categoryForFile,
  OUTPUT_FILE_PATH,
  OUTPUT_FILENAME,
  readText,
  relSource,
  SRC_DIR_PATH,
  stripIndent,
  writeText,
  type CodeEntitiesMeta,
  type CodeEntity,
  type TSDoc,
} from "./shared";

type ExportEntry = Omit<CodeEntity, "filePath" | "sourcePath"> & {
  filePath: string;
};

const exportMap = new Map<string, ExportEntry>();

function defaultTSDoc(): TSDoc {
  return {
    title: "",
    summary: "",
    remarks: [],
    examples: [],
    params: [],
    returns: [],
    see: [],
    template: [],
    deprecated: [],
  };
}

function cleanTagText(text: string) {
  return stripIndent(text).trim();
}

function parseNamedTag(body: string) {
  const [name, ...rest] = body.split(/\s+-\s+/);
  return {
    name: name.trim(),
    description: rest.join(" - ").trim() || body,
  };
}

function parseTSDoc(comment: string): TSDoc {
  const doc = defaultTSDoc();
  const lines = comment
    .replace(/^\/\*\*+/, "")
    .replace(/\*\/\s*$/, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\*\s?/, ""));

  const blocks: Array<{ tag: string | null; lines: string[] }> = [];
  let current: { tag: string | null; lines: string[] } = {
    tag: null,
    lines: [],
  };

  for (const line of lines) {
    const tagMatch = line.match(
      /^@(remarks|example|param|returns|see|template|deprecated)\b\s*(.*)$/,
    );
    if (tagMatch) {
      if (current.lines.length || current.tag !== null) blocks.push(current);
      current = { tag: tagMatch[1], lines: [tagMatch[2] ?? ""] };
      continue;
    }
    current.lines.push(line);
  }
  if (current.lines.length || current.tag !== null) blocks.push(current);

  const summaryBlock = blocks.find((block) => block.tag === null);
  const summaryLines = [...(summaryBlock?.lines ?? [])];
  while (summaryLines.length && !summaryLines[0].trim()) summaryLines.shift();
  doc.title = summaryLines.shift()?.trim() ?? "";
  while (summaryLines.length && !summaryLines[0].trim()) summaryLines.shift();
  doc.summary = cleanTagText(summaryLines.join("\n"));

  for (const block of blocks) {
    if (!block.tag) continue;
    const body = cleanTagText(block.lines.join("\n"));
    if (block.tag === "remarks") doc.remarks.push(body);
    if (block.tag === "example") doc.examples.push(body);
    if (block.tag === "returns") doc.returns.push(body);
    if (block.tag === "see") doc.see.push(body);
    if (block.tag === "deprecated") doc.deprecated.push(body);
    if (block.tag === "template") doc.template.push(parseNamedTag(body));
    if (block.tag === "param") doc.params.push(parseNamedTag(body));
  }

  return doc;
}

function extractAdjacentComment(
  content: string,
  node: ts.Node,
  sourceFile: ts.SourceFile,
) {
  const leadingTrivia = content.slice(
    node.getFullStart(),
    node.getStart(sourceFile),
  );
  const start = leadingTrivia.lastIndexOf("/**");
  if (start === -1) return "";

  const candidate = leadingTrivia.slice(start);
  const end = candidate.indexOf("*/");
  if (end === -1 || candidate.slice(end + 2).trim()) return "";
  return candidate.slice(0, end + 2);
}

function hasExportModifier(node: ts.Node) {
  return Boolean(
    ts.canHaveModifiers(node) &&
      ts
        .getModifiers(node)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
  );
}

function callableForDeclaration(
  declaration:
    | ts.VariableDeclaration
    | ts.FunctionDeclaration
    | ts.TypeAliasDeclaration,
) {
  if (ts.isFunctionDeclaration(declaration)) return declaration;
  if (ts.isVariableDeclaration(declaration)) {
    const initializer = declaration.initializer;
    if (
      initializer &&
      (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
    ) {
      return initializer;
    }
    return undefined;
  }
  return ts.isFunctionTypeNode(declaration.type) ? declaration.type : undefined;
}

function parameterMeta(
  parameters: readonly ts.ParameterDeclaration[] | undefined,
  sourceFile: ts.SourceFile,
) {
  return (parameters ?? []).map((parameter) => ({
    name: parameter.name.getText(sourceFile),
    type: parameter.type?.getText(sourceFile) ?? "unknown",
    optional: Boolean(parameter.questionToken || parameter.initializer),
  }));
}

function typeParameterMeta(
  parameters: readonly ts.TypeParameterDeclaration[] | undefined,
) {
  return (parameters ?? []).map((parameter) => parameter.name.text);
}

function record(entry: ExportEntry) {
  const key = `${entry.category}:${entry.name}`;
  const existing = exportMap.get(key);
  if (existing) {
    throw new Error(
      `Duplicate generated entity '${key}' in ${relSource(existing.filePath)} and ${relSource(entry.filePath)}.`,
    );
  }
  exportMap.set(key, entry);
}

function recordEntity(
  filePath: string,
  content: string,
  sourceFile: ts.SourceFile,
  docNode: ts.Node,
  declaration:
    | ts.VariableDeclaration
    | ts.FunctionDeclaration
    | ts.TypeAliasDeclaration
    | ts.InterfaceDeclaration,
  name: string,
  kind: CodeEntity["kind"],
  signatureNode: ts.Node,
) {
  const callable = ts.isInterfaceDeclaration(declaration)
    ? undefined
    : callableForDeclaration(declaration);
  const typeParameters = ts.isVariableDeclaration(declaration)
    ? callable?.typeParameters
    : declaration.typeParameters;
  const comment = extractAdjacentComment(content, docNode, sourceFile);

  record({
    name,
    kind,
    filePath,
    isCallable: Boolean(callable),
    isExported: true,
    exportKind: "named",
    category: categoryForFile(filePath),
    signature: signatureNode.getText(sourceFile),
    type: undefined,
    parameters: parameterMeta(callable?.parameters, sourceFile),
    typeParameters: typeParameterMeta(typeParameters),
    tsdoc: comment ? parseTSDoc(comment) : defaultTSDoc(),
  });
}

function parseFile(filePath: string) {
  const content = readText(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  for (const statement of sourceFile.statements) {
    if (!hasExportModifier(statement)) continue;

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        recordEntity(
          filePath,
          content,
          sourceFile,
          statement,
          declaration,
          declaration.name.text,
          "const",
          statement,
        );
      }
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      recordEntity(
        filePath,
        content,
        sourceFile,
        statement,
        statement,
        statement.name.text,
        "const",
        statement,
      );
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      recordEntity(
        filePath,
        content,
        sourceFile,
        statement,
        statement,
        statement.name.text,
        "type",
        statement,
      );
      continue;
    }

    if (ts.isInterfaceDeclaration(statement)) {
      recordEntity(
        filePath,
        content,
        sourceFile,
        statement,
        statement,
        statement.name.text,
        "type",
        statement,
      );
    }
  }
}

function walk(dir: string) {
  for (const entry of fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".ts")) parseFile(full);
  }
}

function sortEntities(entities: CodeEntity[]) {
  entities.sort((left, right) => left.name.localeCompare(right.name));
}

function main() {
  walk(SRC_DIR_PATH);

  const meta: CodeEntitiesMeta = {
    const: { core: [], api: [], utils: [] },
    type: { core: [], api: [], utils: [] },
  };

  for (const entry of exportMap.values()) {
    const sourcePath = relSource(entry.filePath);
    const entity: CodeEntity = {
      ...entry,
      filePath: sourcePath,
      sourcePath,
    };
    meta[entity.kind][entity.category].push(entity);
  }

  for (const kind of ["const", "type"] as const) {
    for (const category of ["core", "api", "utils"] as const) {
      sortEntities(meta[kind][category]);
    }
  }

  writeText(OUTPUT_FILE_PATH, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(
    `Generated '${OUTPUT_FILENAME}' with ${exportMap.size} documented entities.`,
  );
}

main();
