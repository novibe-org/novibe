export type Step = { id: string; keyword: string; text: string };
export type Scenario = {
  id: string;
  keyword: string;
  name: string;
  backlog: boolean;
  steps: Step[];
};
export type Rule = { id: string; keyword: string; name: string; parts: Part[] };
export type Part = { scenario: Scenario } | { rule: Rule };

type Located = { path: string; file: string; domain: string };

export type Readable = Located & {
  broken: false;
  title: string;
  id?: string;
  backlog: boolean;
  narrative: string;
  parts: Part[];
};

export type Feature = Readable | (Located & { broken: true });
