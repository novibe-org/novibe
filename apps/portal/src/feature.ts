import { z } from "zod";

export const RowSchema = z.object({
  id: z.string(),
  cells: z.array(z.object({ column: z.number(), value: z.string() })),
});

export const StepSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  text: z.string(),
  docString: z.string().optional(),
  dataTable: z.array(RowSchema).optional(),
});

export const ExamplesSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  name: z.string(),
  rows: z.array(RowSchema),
});

export const ResultSchema = z.enum(["passed", "failed", "not run"]);

export const ScenarioSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  backlog: z.boolean(),
  result: ResultSchema.optional(),
  steps: z.array(StepSchema),
  examples: z.array(ExamplesSchema),
});

export const RuleSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  name: z.string(),
  description: z.string(),
  get parts(): z.ZodArray<typeof PartSchema> {
    return z.array(PartSchema);
  },
});

export const PartSchema = z.union([
  z.object({ background: ScenarioSchema }),
  z.object({ scenario: ScenarioSchema }),
  z.object({ rule: RuleSchema }),
]);

const located = { path: z.string(), file: z.string(), domain: z.string() };

export const ReadableSchema = z.object({
  ...located,
  broken: z.literal(false),
  title: z.string(),
  id: z.string().optional(),
  tags: z.array(z.string()),
  backlog: z.boolean(),
  narrative: z.string(),
  parts: z.array(PartSchema),
});

export const BrokenSchema = z.object({ ...located, broken: z.literal(true) });

export const FeatureSchema = z.discriminatedUnion("broken", [ReadableSchema, BrokenSchema]);

export const RunSchema = z.object({ finished: z.string(), earlier: z.boolean() });

export const FeaturesSchema = z.object({
  branch: z.string(),
  features: z.array(FeatureSchema),
  run: RunSchema.nullable(),
});

export type Run = z.infer<typeof RunSchema>;

export type Row = z.infer<typeof RowSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Examples = z.infer<typeof ExamplesSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Part = z.infer<typeof PartSchema>;
export type Readable = z.infer<typeof ReadableSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type Features = z.infer<typeof FeaturesSchema>;
