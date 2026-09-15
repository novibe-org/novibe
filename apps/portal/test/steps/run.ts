import { generateMessages } from "@cucumber/gherkin";
import {
  type Envelope,
  IdGenerator,
  SourceMediaType,
  TestStepResultStatus,
} from "@cucumber/messages";
import { strToU8, zipSync } from "fflate";

export type Verdict = "passed" | "failed";

const statusOf = (verdict: Verdict, step: number) => {
  if (verdict === "passed") return TestStepResultStatus.PASSED;
  return step === 0 ? TestStepResultStatus.FAILED : TestStepResultStatus.SKIPPED;
};

export function resultsArtifact(
  files: ReadonlyMap<string, string>,
  verdictOf: (path: string, scenario: string) => Verdict | undefined,
  finished: Date,
): Uint8Array {
  const newId = IdGenerator.uuid();
  const timestamp = { seconds: Math.floor(finished.getTime() / 1000), nanos: 0 };
  const duration = { seconds: 0, nanos: 0 };
  const envelopes: Envelope[] = [{ testRunStarted: { timestamp } }];
  let success = true;
  for (const [path, text] of files) {
    if (!path.endsWith(".feature")) continue;
    const media = SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN;
    const written = generateMessages(text, `../../${path}`, media, {
      includeSource: true,
      includeGherkinDocument: true,
      includePickles: true,
      newId,
    });
    for (const envelope of written) {
      envelopes.push(envelope);
      const { pickle } = envelope;
      const verdict = pickle && verdictOf(path, pickle.name);
      if (!pickle || !verdict) continue;
      success &&= verdict === "passed";
      const testSteps = pickle.steps.map((step) => ({ id: newId(), pickleStepId: step.id }));
      const testCase = { id: newId(), pickleId: pickle.id, testSteps };
      const testCaseStartedId = newId();
      envelopes.push(
        { testCase },
        {
          testCaseStarted: {
            id: testCaseStartedId,
            testCaseId: testCase.id,
            attempt: 0,
            timestamp,
          },
        },
        ...testSteps.map(
          ({ id }, step): Envelope => ({
            testStepFinished: {
              testCaseStartedId,
              testStepId: id,
              testStepResult: { duration, status: statusOf(verdict, step) },
              timestamp,
            },
          }),
        ),
        { testCaseFinished: { testCaseStartedId, willBeRetried: false, timestamp } },
      );
    }
  }
  envelopes.push({ testRunFinished: { success, timestamp } });
  const messages = envelopes.map((envelope) => JSON.stringify(envelope)).join("\n");
  return zipSync({ "messages.ndjson": strToU8(messages) });
}
