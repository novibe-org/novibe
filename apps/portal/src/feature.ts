export type Row = { id: string; cells: { column: number; value: string }[] };
export type Step = {
  id: string;
  keyword: string;
  text: string;
  docString?: string;
  dataTable?: Row[];
};
export type Examples = { id: string; keyword: string; name: string; rows: Row[] };
export type Scenario = {
  id: string;
  keyword: string;
  name: string;
  description: string;
  backlog: boolean;
  steps: Step[];
  examples: Examples[];
};
export type Rule = {
  id: string;
  keyword: string;
  name: string;
  description: string;
  parts: Part[];
};
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
