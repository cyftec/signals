#!/usr/bin/env bun
import {
  type CodeEntitiesMeta,
  type CodeEntity,
  OUTPUT_FILE_PATH,
  readText,
} from "./shared";

const issues: string[] = [];
const rawMeta = readText(OUTPUT_FILE_PATH);
const meta: CodeEntitiesMeta = JSON.parse(rawMeta);

const entities = (
  ["const", "type"] as const
).flatMap((kind) =>
  (["core", "api", "utils"] as const).flatMap(
    (category) => meta[kind][category],
  ),
);

function report(entity: CodeEntity, message: string) {
  issues.push(`${entity.sourcePath}:${entity.name} - ${message}`);
}

function nonEmpty(values: string[]) {
  return values.every((value) => value.trim().length > 0);
}

function sameNames(actual: string[], expected: string[]) {
  return (
    actual.length === expected.length &&
    actual.every((name, index) => name === expected[index])
  );
}

function validateEntity(entity: CodeEntity) {
  const { tsdoc } = entity;
  const label = `${entity.category}:${entity.kind}:${entity.name}`;

  if (!entity.sourcePath.startsWith("src/")) {
    report(entity, `sourcePath must be repository-relative, received '${entity.sourcePath}'.`);
  }
  if (entity.filePath !== entity.sourcePath) {
    report(entity, "filePath and sourcePath must use the same repository-relative path.");
  }
  if (/^(?:\/|[A-Za-z]:\\)/.test(entity.filePath)) {
    report(entity, "filePath must not contain an absolute machine path.");
  }
  if (!entity.signature?.trim()) report(entity, "missing declaration signature.");
  if (!tsdoc.title.trim()) report(entity, "missing title sentence.");
  else if (!/[.!?]$/.test(tsdoc.title.trim())) {
    report(entity, "title must be a complete sentence.");
  }
  if (!tsdoc.summary.trim()) report(entity, "missing summary.");

  for (const [section, values] of [
    ["remarks", tsdoc.remarks],
    ["examples", tsdoc.examples],
    ["see", tsdoc.see],
  ] as const) {
    if (!values.length) report(entity, `missing @${section === "examples" ? "example" : section} section.`);
    else if (!nonEmpty(values)) report(entity, `contains an empty @${section} entry.`);
  }

  if (tsdoc.remarks.length !== 1) {
    report(entity, "must contain exactly one @remarks block.");
  } else if (!tsdoc.remarks[0].trimStart().startsWith("- ")) {
    report(entity, "@remarks must use a semantic bullet list.");
  }

  for (const example of tsdoc.examples) {
    const fences = example.match(/```/g)?.length ?? 0;
    if (fences < 2 || fences % 2 !== 0) {
      report(entity, "each @example must contain balanced fenced code.");
    }
  }

  for (const see of tsdoc.see) {
    if (!/^\{@link\s+[^}\s]+\}\s+-\s+\S/.test(see)) {
      report(entity, `invalid @see entry '${see}'.`);
    }
  }

  const expectedParams = (entity.parameters ?? []).map(({ name }) => name);
  const actualParams = tsdoc.params.map(({ name }) => name);
  if (!sameNames(actualParams, expectedParams)) {
    report(
      entity,
      `@param names [${actualParams.join(", ")}] do not match signature [${expectedParams.join(", ")}].`,
    );
  }
  if (tsdoc.params.some(({ name, description }) => !name || !description)) {
    report(entity, "every @param needs a name and description.");
  }

  const expectedTemplates = entity.typeParameters ?? [];
  const actualTemplates = tsdoc.template.map(({ name }) => name);
  if (!sameNames(actualTemplates, expectedTemplates)) {
    report(
      entity,
      `@template names [${actualTemplates.join(", ")}] do not match signature [${expectedTemplates.join(", ")}].`,
    );
  }
  if (tsdoc.template.some(({ name, description }) => !name || !description)) {
    report(entity, "every @template needs a name and description.");
  }

  if (entity.isCallable && !tsdoc.returns.length) {
    report(entity, "callable entity is missing @returns.");
  }
  if (!nonEmpty(tsdoc.returns)) report(entity, "contains an empty @returns entry.");
  if (!nonEmpty(tsdoc.deprecated)) {
    report(entity, "contains an empty @deprecated entry.");
  }

  return label;
}

const keys = new Set<string>();
for (const entity of entities) {
  const key = validateEntity(entity);
  if (keys.has(key)) report(entity, `duplicate generated key '${key}'.`);
  keys.add(key);
}

if (!entities.length) issues.push("Metadata contains no entities.");
if (/\/(?:Users|private)\//.test(rawMeta)) {
  issues.push("Metadata contains an absolute local filesystem path.");
}

if (issues.length) {
  console.error(`API metadata validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`API metadata validation passed for ${entities.length} entities.`);
