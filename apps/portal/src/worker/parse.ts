import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import {
  type Background,
  type FeatureChild,
  type Scenario as GherkinScenario,
  type Step as GherkinStep,
  IdGenerator,
  type RuleChild,
  type TableRow,
  type Tag,
} from "@cucumber/messages";
import type { Feature, Part, Row, Scenario, Step } from "../feature";

export const FEATURE_PATH = /^features\/(?:(.+)\/)?([^/]+\.feature)$/;

const ID_TAG = "@id:";
const BACKLOG_TAG = "@backlog";

const namesOf = (tags: readonly Tag[]) => tags.map(({ name }) => name);

const asWritten = (description: string) =>
  description
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();

const rowsOf = (rows: readonly TableRow[]): Row[] =>
  rows.map(({ id, cells }) => ({
    id,
    cells: cells.map(({ location, value }) => ({ column: location.column ?? 0, value })),
  }));

const stepOf = ({ id, keyword, text, docString, dataTable }: GherkinStep): Step => ({
  id,
  keyword,
  text,
  docString: docString?.content,
  dataTable: dataTable && rowsOf(dataTable.rows),
});

function scenarioOf(written: Background | GherkinScenario, inherited: string[]): Scenario {
  const { id, keyword, name, description, steps } = written;
  const tags = namesOf("tags" in written ? written.tags : []);
  const examples = "examples" in written ? written.examples : [];
  return {
    id,
    keyword,
    name,
    description: asWritten(description),
    tags,
    backlog: [...inherited, ...tags].includes(BACKLOG_TAG),
    steps: steps.map(stepOf),
    examples: examples.map(({ id, keyword, name, tableHeader, tableBody }) => ({
      id,
      keyword,
      name,
      rows: rowsOf([...(tableHeader ? [tableHeader] : []), ...tableBody]),
    })),
  };
}

function partsOf(children: readonly (FeatureChild | RuleChild)[], inherited: string[]): Part[] {
  return children.flatMap((child): Part[] => {
    if (child.background) return [{ background: scenarioOf(child.background, []) }];
    if (child.scenario) return [{ scenario: scenarioOf(child.scenario, inherited) }];
    if ("rule" in child && child.rule) {
      const { id, keyword, name, description, tags, children: ruled } = child.rule;
      const parts = partsOf(ruled, [...inherited, ...namesOf(tags)]);
      return [{ rule: { id, keyword, name, description: asWritten(description), parts } }];
    }
    return [];
  });
}

export function parsed(path: string, text: string): Feature {
  const [, domain = "", file = path] = FEATURE_PATH.exec(path) ?? [];
  const broken = { path, file, domain, broken: true } as const;
  try {
    const parser = new Parser(
      new AstBuilder(IdGenerator.incrementing()),
      new GherkinClassicTokenMatcher(),
    );
    const { feature } = parser.parse(text);
    if (!feature) return broken;
    const tags = namesOf(feature.tags);
    return {
      path,
      file,
      domain,
      broken: false,
      title: feature.name,
      id: tags.find((tag) => tag.startsWith(ID_TAG))?.slice(ID_TAG.length) || undefined,
      tags,
      backlog: tags.includes(BACKLOG_TAG),
      narrative: asWritten(feature.description),
      parts: partsOf(feature.children, tags),
    };
  } catch {
    return broken;
  }
}
