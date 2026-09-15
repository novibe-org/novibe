import { strFromU8, unzipSync } from "fflate";
import { z } from "zod";

const RESULTS_FILE = "messages.ndjson";
const MOST_UNZIPPED_BYTES = 16 * 1024 * 1024;

export type Proved = "passed" | "failed";

export type Results = ReadonlyMap<string, ReadonlyMap<number, Proved>>;

const PlacedSchema = z.object({ id: z.string(), location: z.object({ line: z.number() }) });

const ChildSchema = z.object({ scenario: PlacedSchema.optional() });

const EnvelopeSchema = z.object({
  gherkinDocument: z
    .object({
      uri: z.string(),
      feature: z
        .object({
          children: z.array(
            ChildSchema.extend({
              rule: z.object({ children: z.array(ChildSchema) }).optional(),
            }),
          ),
        })
        .optional(),
    })
    .optional(),
  pickle: z.object({ id: z.string(), astNodeIds: z.array(z.string()) }).optional(),
  testCase: z.object({ id: z.string(), pickleId: z.string() }).optional(),
  testCaseStarted: z.object({ id: z.string(), testCaseId: z.string() }).optional(),
  testStepFinished: z
    .object({ testCaseStartedId: z.string(), testStepResult: z.object({ status: z.string() }) })
    .optional(),
  testCaseFinished: z
    .object({ testCaseStartedId: z.string(), willBeRetried: z.boolean() })
    .optional(),
});

const repositoryPathOf = (uri: string) => uri.replace(/^(?:\.\.?\/)+/, "");

export function resultsIn(messages: string): Results {
  const places = new Map<string, { path: string; line: number }>();
  const scenarioOf = new Map<string, string>();
  const pickleOf = new Map<string, string>();
  const testCaseOf = new Map<string, string>();
  const failing = new Set<string>();
  const attempts: string[] = [];

  for (const line of messages.split("\n")) {
    if (!line.trim()) continue;
    const envelope = EnvelopeSchema.parse(JSON.parse(line));
    const { gherkinDocument, pickle, testCase, testCaseStarted, testStepFinished } = envelope;
    if (gherkinDocument) {
      const path = repositoryPathOf(gherkinDocument.uri);
      for (const child of gherkinDocument.feature?.children ?? []) {
        for (const { scenario } of [child, ...(child.rule?.children ?? [])]) {
          if (scenario) places.set(scenario.id, { path, line: scenario.location.line });
        }
      }
    }
    const [scenario] = pickle?.astNodeIds ?? [];
    if (pickle && scenario) scenarioOf.set(pickle.id, scenario);
    if (testCase) pickleOf.set(testCase.id, testCase.pickleId);
    if (testCaseStarted) testCaseOf.set(testCaseStarted.id, testCaseStarted.testCaseId);
    if (testStepFinished && testStepFinished.testStepResult.status !== "PASSED") {
      failing.add(testStepFinished.testCaseStartedId);
    }
    const finished = envelope.testCaseFinished;
    if (finished && !finished.willBeRetried) attempts.push(finished.testCaseStartedId);
  }

  const results = new Map<string, Map<number, Proved>>();
  for (const attempt of attempts) {
    const testCase = testCaseOf.get(attempt);
    const pickle = testCase && pickleOf.get(testCase);
    const scenario = pickle && scenarioOf.get(pickle);
    const place = scenario && places.get(scenario);
    if (!place) continue;
    const lines = results.get(place.path) ?? new Map<number, Proved>();
    results.set(place.path, lines);
    if (lines.get(place.line) !== "failed") {
      lines.set(place.line, failing.has(attempt) ? "failed" : "passed");
    }
  }
  return results;
}

export function resultsInArtifact(zip: ArrayBuffer): Results | undefined {
  const files = unzipSync(new Uint8Array(zip), {
    filter: ({ name, originalSize }) => {
      if (name !== RESULTS_FILE) return false;
      if (originalSize <= MOST_UNZIPPED_BYTES) return true;
      console.error(`${RESULTS_FILE} unzips to ${originalSize} bytes, over ${MOST_UNZIPPED_BYTES}`);
      return false;
    },
  });
  const messages = files[RESULTS_FILE];
  return messages && resultsIn(strFromU8(messages));
}
