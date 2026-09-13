import { scan } from './messages.mjs'

const paths = process.argv.slice(2)
if (!paths.length) {
  console.error('usage: node src/report.mjs <cucumber.ndjson>...')
  process.exit(1)
}

const { runs, scenarios, documents } = await scan(paths)

for (const run of runs) console.log(`run  ${new Date(run.ranAt).toISOString()}  ${run.path}`)
console.log()

const byFile = new Map()
for (const scenario of scenarios) {
  const list = byFile.get(scenario.uri) ?? []
  list.push(scenario)
  byFile.set(scenario.uri, list)
}

const total = {}
for (const [uri, list] of [...byFile].sort()) {
  const counts = {}
  for (const s of list) counts[s.status] = (counts[s.status] ?? 0) + 1
  for (const k in counts) total[k] = (total[k] ?? 0) + counts[k]
  const name = documents.get(uri)?.feature?.name ?? uri
  const summary = Object.entries(counts).sort().map(([k, v]) => `${k} ${v}`).join('  ')
  console.log(`${String(list.length).padStart(4)}  ${name.padEnd(34)}  ${summary}`)
}
console.log()
console.log(`${String(scenarios.length).padStart(4)}  TOTAL`.padEnd(42) + '  ' +
  Object.entries(total).sort().map(([k, v]) => `${k} ${v}`).join('  '))
