#!/usr/bin/env node
// Usage: architecture-diff.mjs <base dir> <head dir>, each holding model.json and mermaid/ from LikeC4.
import { existsSync, readdirSync, readFileSync } from 'node:fs'

const MARKER = '<!-- architecture-diff -->'
const LIMIT = 60000
// Mid-tones and translucent tints, as Mermaid on GitHub cannot pick colours by theme: each reads on light and dark.
const STROKE = { added: '#2da44e', changed: '#bf8700', removed: '#e5534b' }
const FILL = { added: '#2da44e33', changed: '#bf870033', removed: '#e5534b33' }
const EMPTY = { elements: {}, relations: {}, deployments: { elements: {} }, views: {} }

const [baseDir, headDir] = process.argv.slice(2)
// With a likec4.config, the export is a list of projects, and may list one project more than once.
const load = dir => {
  if (!existsSync(`${dir}/model.json`)) return EMPTY
  const model = JSON.parse(readFileSync(`${dir}/model.json`, 'utf8'))
  if (!Array.isArray(model)) return model
  const projects = [...new Set(model.map(p => p.projectId))]
  if (projects.length > 1) throw new Error(`${dir} holds the LikeC4 projects ${projects.join(', ')}; point path at one of them`)
  return model[0] ?? EMPTY
}
const base = load(baseDir)
const head = load(headDir)

const props = e => JSON.stringify([e.kind, e.title, e.description, e.summary, e.technology, e.tags, e.style, e.links, e.metadata, e.element])
const relKey = r => [r.source.model ?? r.source.deployment, r.target.model ?? r.target.deployment, r.kind ?? ''].join(' ')
const relProps = r => JSON.stringify([r.title, r.description, r.technology, r.tags, r.links, r.metadata, r.line, r.color])

const changedElements = new Set()
for (const kind of ['elements', 'deployments']) {
  const before = kind === 'elements' ? base.elements : base.deployments?.elements ?? {}
  const after = kind === 'elements' ? head.elements : head.deployments?.elements ?? {}
  for (const [id, e] of Object.entries(after)) if (before[id] && props(before[id]) !== props(e)) changedElements.add(id)
}

const relationsOf = model => [...Object.values(model.relations), ...Object.values(model.deployments?.relations ?? {})]
const pairOf = new Map()
const changedRelations = new Set()
const pool = relationsOf(base)
const unpaired = []
for (const r of relationsOf(head)) {
  const same = pool.findIndex(b => relKey(b) === relKey(r) && relProps(b) === relProps(r))
  if (same >= 0) pairOf.set(pool.splice(same, 1)[0].id, r.id)
  else unpaired.push(r)
}
for (const r of unpaired) {
  const near = pool.findIndex(b => relKey(b) === relKey(r))
  if (near < 0) continue
  changedRelations.add(r.id)
  pairOf.set(pool.splice(near, 1)[0].id, r.id)
}

const nodeRef = n => n.deploymentRef ?? n.modelRef ?? n.id
const relationRefs = (e, side) => e.relations.map(id => (side === 'head' ? id : pairOf.get(id) ?? `base:${id}`))
const nodeLook = n => JSON.stringify([n.kind, n.title, n.description, n.technology, n.color, n.shape, n.style, n.tags])
const edgeLook = e => JSON.stringify([e.label, e.color, e.line, e.head, e.tail])

// A view's state per node and edge: present only in one version, or present in both with changed content.
function marks(view, other, side) {
  const own = side === 'after' ? 'head' : 'base'
  const otherNodes = new Map(other?.nodes.map(n => [nodeRef(n), n]) ?? [])
  const otherEdges = new Map(other?.edges.flatMap(e => relationRefs(e, own === 'head' ? 'base' : 'head').map(r => [r, e])) ?? [])
  const gone = side === 'after' ? 'added' : 'removed'
  const nodes = new Map()
  for (const n of view.nodes) {
    const before = otherNodes.get(nodeRef(n))
    if (!before) nodes.set(n.id, gone)
    else if (side === 'after' && ([n.modelRef, n.deploymentRef, n.id].some(id => changedElements.has(id)) || nodeLook(before) !== nodeLook(n))) nodes.set(n.id, 'changed')
  }
  const edges = new Map()
  for (const e of view.edges) {
    const refs = relationRefs(e, own)
    const found = refs.filter(r => otherEdges.has(r))
    if (!found.length) edges.set(e.id, gone)
    else if (side === 'after' && (found.length < refs.length || otherEdges.get(found[0]).relations.length !== refs.length
      || e.relations.some(id => changedRelations.has(id)) || edgeLook(otherEdges.get(found[0])) !== edgeLook(e))) edges.set(e.id, 'changed')
  }
  return { nodes, edges }
}

const pascal = s => s.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
function mermaidIds(view) {
  const byId = new Map(view.nodes.map(n => [n.id, n]))
  const ids = new Map()
  const of = n => {
    if (!ids.has(n.id)) {
      const parent = n.parent && byId.get(n.parent)
      ids.set(n.id, parent ? `${of(parent)}.${pascal(n.id.slice(parent.id.length + 1))}` : pascal(n.id))
    }
    return ids.get(n.id)
  }
  view.nodes.forEach(of)
  return ids
}

function styled(view, text, { nodes, edges }, unmatched) {
  const ids = mermaidIds(view)
  // A long label wraps over lines, so labels are dropped before links are read line by line.
  const unlabelled = text.replace(/"`[\s\S]*?`"/g, '""')
  const links = unlabelled.split('\n').filter(l => /^\s*\S+\s+-.*->\s+\S+\s*$/.test(l)).map(l => l.trim().split(/\s+/))
  const taken = new Set()
  const containers = new Set(view.nodes.filter(n => n.children?.length).map(n => n.id))
  const lines = [text]
  // Mermaid fills a subgraph and borders it olive in its light theme, which reads as the changed tint.
  for (const id of containers) if (!nodes.has(id) && text.includes(ids.get(id))) lines.push(`  style ${ids.get(id)} fill:#8c959f1f,stroke:#8c959f`)
  for (const [id, state] of nodes) {
    const fill = containers.has(id) ? 'fill:#8c959f1f,' : `fill:${FILL[state]},`
    if (!text.includes(ids.get(id))) unmatched.push(`${view.id}: ${id}`)
    else lines.push(`  style ${ids.get(id)} ${fill}stroke:${STROKE[state]},stroke-width:3px`)
  }
  for (const e of view.edges) {
    const at = links.findIndex((l, i) => !taken.has(i) && l[0] === ids.get(e.source) && l.at(-1) === ids.get(e.target))
    if (at >= 0) taken.add(at)
    if (!edges.has(e.id)) continue
    if (at < 0) unmatched.push(`${view.id}: ${e.source} -> ${e.target}`)
    else lines.push(`  linkStyle ${at} stroke:${STROKE[edges.get(e.id)]},stroke-width:3px`)
  }
  return lines.join('\n').replaceAll('```', "'''")
}

const out = [MARKER, '## Architecture diff', '']
// LikeC4 writes each view's diagram under the folder of the file that defines the view.
const diagrams = dir => {
  const root = `${dir}/mermaid`
  if (!existsSync(root)) return {}
  const files = readdirSync(root, { recursive: true }).filter(f => f.endsWith('.mmd'))
  return Object.fromEntries(files.map(f => [f.split('/').at(-1).slice(0, -'.mmd'.length), `${root}/${f}`]))
}
const diagramOf = { [headDir]: diagrams(headDir), [baseDir]: diagrams(baseDir) }

const sections = []
const unmatched = []
for (const id of [...new Set([...Object.keys(base.views), ...Object.keys(head.views)])].sort()) {
  const h = head.views[id]
  const b = base.views[id]
  const parts = []
  for (const [label, view, other, dir, side] of [['After', h, b, headDir, 'after'], ['Before', b, h, baseDir, 'before']]) {
    const file = diagramOf[dir][id]
    if (!view || !file) continue
    const m = marks(view, other, side)
    if (!m.nodes.size && !m.edges.size) continue
    parts.push(`**${label}**`, '', '```mermaid', styled(view, readFileSync(file, 'utf8').trimEnd(), m, unmatched), '```', '')
  }
  const retitled = h && b && JSON.stringify([h.title, h.description]) !== JSON.stringify([b.title, b.description])
  if (retitled && !parts.length) parts.push('The view\'s title or description changed.', '')
  if (parts.length) sections.push([id, [`### \`${id}\` — ${!b ? 'new view' : !h ? 'view removed' : 'changed'}`, '', ...parts].join('\n')])
}

if (!sections.length) {
  out.push('No view of the architecture model changed.')
} else {
  out.push(`${sections.length} of ${new Set([...Object.keys(base.views), ...Object.keys(head.views)]).size} views changed · 🟩 added · 🟨 changed · 🟥 removed`, '')
  let size = out.join('\n').length
  for (const [n, [, text]] of sections.entries()) {
    if (size + text.length > LIMIT) {
      out.push(`…and ${sections.length - n} more: ${sections.slice(n).map(([id]) => `\`${id}\``).join(', ')}.`)
      break
    }
    out.push(text)
    size += text.length
  }
}
for (const u of unmatched) console.error(`::warning::architecture-diff could not mark ${u} in the Mermaid output`)
console.log(out.join('\n'))
