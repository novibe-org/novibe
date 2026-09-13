import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

export const FUTURE = 'future'
export const NOT_RUN = 'not-run'

/** Worst step wins: one failure makes the scenario failed however many steps passed before it. */
const SEVERITY = ['FAILED', 'AMBIGUOUS', 'UNDEFINED', 'PENDING', 'SKIPPED', 'PASSED']

function worstOf(statuses) {
  for (const status of SEVERITY) if (statuses.includes(status)) return status
  return NOT_RUN
}

/**
 * One Cucumber Messages file. The schema is the Gherkin protocol rather than any one runner's
 * output, so a Go or .NET project reaches this function the same way a JVM one does.
 */
async function readRun(path) {
  const run = {
    path,
    documents: new Map(),
    pickles: new Map(),
    caseOf: new Map(),
    startedAs: new Map(),
    stepStatus: new Map(),
    ranAt: 0,
  }

  const lines = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  for await (const line of lines) {
    if (!line.trim()) continue
    const message = JSON.parse(line)

    if (message.gherkinDocument) run.documents.set(message.gherkinDocument.uri, message.gherkinDocument)
    if (message.pickle) run.pickles.set(message.pickle.id, message.pickle)
    if (message.testCase) run.caseOf.set(message.testCase.pickleId, message.testCase)
    if (message.testCaseStarted) run.startedAs.set(message.testCaseStarted.id, message.testCaseStarted.testCaseId)
    if (message.testRunStarted) run.ranAt = message.testRunStarted.timestamp.seconds * 1000
    if (message.testStepFinished) {
      const caseId = run.startedAs.get(message.testStepFinished.testCaseStartedId)
      const seen = run.stepStatus.get(caseId) ?? []
      seen.push(message.testStepFinished.testStepResult.status)
      run.stepStatus.set(caseId, seen)
    }
  }
  return run
}

/** Scenarios can sit under a Rule, so the tree is walked rather than the top level read. */
function* scenariosIn(children) {
  for (const child of children ?? []) {
    if (child.scenario) yield child.scenario
    if (child.rule) yield* scenariosIn(child.rule.children)
  }
}

function indexScenarios(document) {
  const byId = new Map()
  for (const scenario of scenariosIn(document.feature?.children)) {
    byId.set(scenario.id, {
      id: scenario.id,
      name: scenario.name,
      line: scenario.location.line,
      keyword: scenario.keyword.trim(),
      uri: document.uri,
      feature: document.feature?.name ?? document.uri,
    })
  }
  return byId
}

/**
 * Several runs of the same project — a filtered inner loop and a full one — describe different
 * halves of the same spec, so the newest run that actually exercised a scenario is the one that
 * knows its status.
 *
 * A Scenario Outline is one scenario the driver wrote and one pickle per Examples row. The row is
 * what passes or fails; the scenario is what gets prioritised, so rows are folded back into it.
 */
export async function scan(paths) {
  const runs = []
  for (const path of paths) runs.push(await readRun(path))
  runs.sort((a, b) => b.ranAt - a.ranAt)

  const written = new Map()
  const scenarios = new Map()

  for (const run of runs) {
    for (const document of run.documents.values()) {
      if (written.has(document.uri)) continue
      written.set(document.uri, document)
      for (const [id, scenario] of indexScenarios(document)) {
        scenarios.set(id, { ...scenario, tags: [], examples: [] })
      }
    }
  }

  for (const run of runs) {
    for (const pickle of run.pickles.values()) {
      const scenario = scenarios.get(pickle.astNodeIds[0])
      if (!scenario) continue

      const tags = pickle.tags.map((tag) => tag.name)
      const testCase = run.caseOf.get(pickle.id)
      const ran = testCase ? worstOf(run.stepStatus.get(testCase.id) ?? []) : null

      // An Examples row is identified by its own ast node, never by name: an outline whose title
      // carries no placeholder gives every one of its rows the same name.
      const row = pickle.astNodeIds.slice(1).join(',') || pickle.astNodeIds[0]
      const example = scenario.examples.find((e) => e.row === row)
      if (example && (example.status !== NOT_RUN || !ran)) continue
      if (example) Object.assign(example, { status: ran, ranAt: run.ranAt })
      else scenario.examples.push({
        row,
        name: pickle.name,
        steps: pickle.steps.length,
        status: ran ?? (tags.includes('@backlog') ? FUTURE : NOT_RUN),
        ranAt: ran ? run.ranAt : null,
      })

      if (!scenario.tags.length) scenario.tags = tags
    }
  }

  const all = [...scenarios.values()].filter((s) => s.examples.length)
  for (const scenario of all) {
    scenario.status = worstOf(scenario.examples.map((e) => e.status))
    if (scenario.examples.every((e) => e.status === FUTURE)) scenario.status = FUTURE
    scenario.ranAt = Math.max(0, ...scenario.examples.map((e) => e.ranAt ?? 0)) || null
  }

  return { runs: runs.map((r) => ({ path: r.path, ranAt: r.ranAt })), scenarios: all, documents: written }
}
