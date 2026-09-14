import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import {
  type FeatureChild,
  IdGenerator,
  type RuleChild,
  type Step,
  type Tag,
} from "@cucumber/messages";
import type { Feature, Part, Scenario } from "../feature";

export const FEATURE_PATH = /^features\/(?:(.+)\/)?([^/]+\.feature)$/;

const ID_TAG = "@id:";
const BACKLOG_TAG = "@backlog";

const namesOf = (tags: readonly Tag[]) => tags.map(({ name }) => name);

function scenario(
  {
    id,
    keyword,
    name,
    steps,
  }: { id: string; keyword: string; name: string; steps: readonly Step[] },
  tags: readonly Tag[],
): Scenario {
  return {
    id,
    keyword,
    name,
    backlog: namesOf(tags).includes(BACKLOG_TAG),
    steps: steps.map((step) => ({ id: step.id, keyword: step.keyword, text: step.text })),
  };
}

function partsOf(children: readonly (FeatureChild | RuleChild)[]): Part[] {
  return children.flatMap((child): Part[] => {
    if (child.background) return [{ scenario: scenario(child.background, []) }];
    if (child.scenario) return [{ scenario: scenario(child.scenario, child.scenario.tags) }];
    if ("rule" in child && child.rule) {
      const { id, keyword, name, children: ruled } = child.rule;
      return [{ rule: { id, keyword, name, parts: partsOf(ruled) } }];
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
      id: tags.find((tag) => tag.startsWith(ID_TAG))?.slice(ID_TAG.length),
      backlog: tags.includes(BACKLOG_TAG),
      narrative: feature.description
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        .trim(),
      parts: partsOf(feature.children),
    };
  } catch {
    return broken;
  }
}
