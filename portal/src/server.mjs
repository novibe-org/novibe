import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scan } from './messages.mjs'
import { specFrom } from './spec.mjs'
import { featuresAt, headOf, readAt, refsIn } from './git.mjs'
import { dbFor, load, open, save } from './store.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const configPath = resolve(root, 'portal.config.json')

const configured = async () => JSON.parse(await readFile(configPath, 'utf8')).projects

open(dbFor(root))

/**
 * Three sources, kept apart on purpose: a ref says what the specification is, a run says what it
 * proved, and the store says what anyone decided to do about it. Only the last is writable.
 */
async function project(entry, ref) {
  const at = resolve(dirname(configPath), entry.root)
  const where = entry.features ?? 'features'
  const branches = await refsIn(at)
  const head = await headOf(at)
  // What is checked out is what somebody is working on, so it is what they meant.
  const chosen = branches.includes(ref) ? ref : (entry.ref ?? head ?? 'main')

  const runs = (entry.runs ?? []).map((run) => resolve(at, run)).filter(existsSync)
  const [features, ran, plan] = await Promise.all([
    specFrom(await featuresAt(at, chosen, where), (path) => readAt(at, chosen, path)),
    runs.length ? scan(runs) : Promise.resolve({ runs: [], scenarios: [] }),
    load(entry.name),
  ])

  const status = new Map()
  for (const scenario of ran.scenarios) {
    status.set(`${scenario.uri.replace(/^.*?\/(features\/)/, '$1')}:${scenario.line}`, scenario)
  }

  // A run made against a different version of the specification would otherwise paint features
  // red for reasons that have nothing to do with them.
  let located = 0
  for (const feature of features) {
    for (const scenario of feature.scenarios) {
      const ran = status.get(`${feature.path}:${scenario.line}`)
      if (ran) located++
      scenario.status = ran?.status ?? (scenario.tags.includes('@backlog') ? 'future' : 'not-run')
      scenario.exampleRows = ran?.examples?.length ?? scenario.exampleRows
    }
    feature.green = feature.scenarios.filter((s) => s.status === 'PASSED').length
    feature.total = feature.scenarios.length
  }

  const outcome = ran.scenarios.length
    ? {
        scenarios: ran.scenarios.length,
        passed: ran.scenarios.filter((s) => s.status === 'PASSED').length,
        exercised: ran.scenarios.filter((s) => s.status !== 'future').length,
        located,
        // Scenarios are matched by file and line, so a run made against a different ref locates
        // almost none of them. Below half, it is describing something else.
        describes: located >= features.reduce((n, f) => n + f.total, 0) / 2,
      }
    : null

  return {
    name: entry.name,
    source: entry.source ?? null,
    ref: chosen,
    head,
    branches,
    missing: (entry.runs ?? []).filter((run) => !existsSync(resolve(at, run))),
    runs: ran.runs,
    outcome,
    features,
    plan,
  }
}

const json = (response, code, body) => {
  response.writeHead(code, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost')

    if (url.pathname === '/api/projects') {
      const ref = url.searchParams.get('ref')
      return json(response, 200, await Promise.all((await configured()).map((e) => project(e, ref))))
    }

    // The whole plan is written at once: one person, one page, and a merge is not worth the
    // machinery it would take to be correct.
    if (url.pathname === '/api/plan' && request.method === 'PUT') {
      const name = url.searchParams.get('project')
      if (!(await configured()).some((entry) => entry.name === name)) {
        return json(response, 404, { error: `no project named ${name}` })
      }
      let body = ''
      for await (const chunk of request) body += chunk
      return json(response, 200, await save(name, JSON.parse(body)))
    }

    const page = await readFile(resolve(here, 'index.html'))
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    response.end(page)
  } catch (failure) {
    json(response, 500, { error: String(failure?.stack ?? failure) })
  }
}).listen(4173, '127.0.0.1', () => console.log('portal  http://localhost:4173'))
