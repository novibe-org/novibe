import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Prioritisation is the only thing the portal owns, and the only thing it writes. It is held in
 * SQLite rather than a file it rewrites whole: an epic moving is one statement, a half-written
 * plan is not reachable, and two people asking at once is the database's problem rather than
 * ours.
 *
 * Order is a column in both directions — which epic comes first, and what comes first inside
 * one — because it is a fact about the plan rather than about the file it was serialised into.
 *
 * Every statement lives here and every export is async, though node:sqlite is synchronous. D1 is
 * not, and Workers cannot load node:sqlite at all, so the shape that survives a move to
 * Cloudflare is a driver swap in this file rather than a change at every call site.
 */
let db

export function open(path) {
  if (db) return db
  mkdirSync(dirname(path), { recursive: true })
  db = new DatabaseSync(path)
  db.exec(`
    pragma journal_mode = wal;
    pragma foreign_keys = on;

    create table if not exists epic (
      project     text not null,
      id          text not null,
      title       text not null,
      description text not null default '',
      position    integer not null,
      primary key (project, id)
    );

    create table if not exists pick (
      project  text not null,
      epic     text not null,
      feature  text not null,
      position integer not null,
      primary key (project, feature),
      foreign key (project, epic) references epic (project, id) on delete cascade
    );

    create index if not exists pick_by_epic on pick (project, epic, position);
  `)
  return db
}

export async function load(project) {
  const epics = db.prepare(
    'select id, title, description from epic where project = ? order by position').all(project)
  const picks = db.prepare(
    'select epic, feature from pick where project = ? order by epic, position').all(project)

  return {
    epics: epics.map((epic) => ({
      ...epic,
      features: picks.filter((pick) => pick.epic === epic.id).map((pick) => pick.feature),
    })),
  }
}

/** One transaction: the plan is never observed halfway through being changed. */
export async function save(project, plan) {
  const insertEpic = db.prepare(
    'insert into epic (project, id, title, description, position) values (?, ?, ?, ?, ?)')
  const insertPick = db.prepare(
    'insert into pick (project, epic, feature, position) values (?, ?, ?, ?)')

  db.exec('begin immediate')
  try {
    db.prepare('delete from pick where project = ?').run(project)
    db.prepare('delete from epic where project = ?').run(project)

    plan.epics.forEach((epic, at) => {
      insertEpic.run(project, epic.id, epic.title, epic.description ?? '', at)
      ;(epic.features ?? []).forEach((feature, place) =>
        insertPick.run(project, epic.id, feature, place))
    })
    db.exec('commit')
  } catch (failure) {
    db.exec('rollback')
    throw failure
  }
  return await load(project)
}

export const dbFor = (root) => resolve(root, 'data', 'portal.db')
