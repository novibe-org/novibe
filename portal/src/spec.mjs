import { AstBuilder, Parser, GherkinClassicTokenMatcher } from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'

/**
 * The specification is read from the files, not from a run: a feature written this morning has
 * to appear in the backlog before anyone has run it, and a run only ever reports the scenarios
 * its filter admitted.
 */
function* scenariosIn(children) {
  for (const child of children ?? []) {
    if (child.scenario) yield child.scenario
    if (child.rule) yield* scenariosIn(child.rule.children)
  }
}

const tagsOf = (node) => (node.tags ?? []).map((tag) => tag.name)

/** Gherkin allows one Feature per file, so the file is the feature and needs no tag to say so. */
export async function specFrom(paths, read) {
  const features = []

  for (const path of paths) {
    const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher())
    try {
      const { feature } = parser.parse(await read(path))
      if (!feature) continue

      const inherited = tagsOf(feature)
      // A feature is identified by what it says it is, not by where it sits: @id survives the
      // file being renamed or moved to the domain it should have been in.
      const declared = inherited.find((tag) => tag.startsWith('@id:'))

      features.push({
        path,
        id: declared ? declared.slice(4) : path,
        identified: Boolean(declared),
        name: feature.name,
        description: (feature.description ?? '').trim(),
        tags: inherited,
        scenarios: [...scenariosIn(feature.children)].map((scenario) => ({
          name: scenario.name,
          keyword: scenario.keyword.trim(),
          line: scenario.location.line,
          description: (scenario.description ?? '').trim(),
          tags: [...new Set([...inherited, ...tagsOf(scenario)])],
          own: tagsOf(scenario),
          steps: (scenario.steps ?? []).map((step) => ({
            keyword: step.keyword.trim(),
            text: step.text,
            // A doc string or a data table is part of the step and has to render with it.
            doc: step.docString?.content ?? null,
            table: step.dataTable?.rows.map((row) => row.cells.map((cell) => cell.value)) ?? null,
          })),
          examples: (scenario.examples ?? []).map((example) => ({
            name: example.name,
            header: example.tableHeader?.cells.map((cell) => cell.value) ?? [],
            rows: example.tableBody.map((row) => row.cells.map((cell) => cell.value)),
          })),
          exampleRows: (scenario.examples ?? []).reduce((n, e) => n + e.tableBody.length, 0),
        })),
      })
    } catch (failure) {
      features.push({ path, name: path, error: String(failure.message).split('\n')[1] ?? 'parse error', scenarios: [] })
    }
  }
  // Two features answering to one id would make a plan ambiguous, so it is said rather than
  // resolved.
  const seen = new Map()
  for (const feature of features) {
    if (feature.identified && seen.has(feature.id)) {
      feature.duplicates = seen.get(feature.id)
    } else if (feature.identified) {
      seen.set(feature.id, feature.path)
    }
  }

  return features.sort((a, b) => a.path.localeCompare(b.path))
}
