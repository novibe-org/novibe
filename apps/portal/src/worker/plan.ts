import { and, asc, eq, max } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Feature } from "../feature";
import type { Change, Plan, Refused } from "../plan";
import { epics, picks } from "./tables";

export async function planOf(database: D1Database, repository: string): Promise<Plan> {
  const db = drizzle(database);
  const [started, picked] = await db.batch([
    db
      .select()
      .from(epics)
      .where(eq(epics.repository, repository))
      .orderBy(asc(epics.position), asc(epics.id)),
    db
      .select()
      .from(picks)
      .where(eq(picks.repository, repository))
      .orderBy(asc(picks.position), asc(picks.id)),
  ]);
  const byEpic = new Map<number, string[]>();
  for (const { epic, feature } of picked) {
    const features = byEpic.get(epic);
    if (features) features.push(feature);
    else byEpic.set(epic, [feature]);
  }
  return {
    epics: started.map(({ id, title }) => ({ id, title, features: byEpic.get(id) ?? [] })),
  };
}

export function goneFrom(plan: Plan, features: Feature[]): string[] {
  const onMain = new Set(
    features.flatMap((feature) => (feature.broken || !feature.id ? [] : [feature.id])),
  );
  return plan.epics.flatMap((epic) => epic.features).filter((id) => !onMain.has(id));
}

export function moved<T>(order: T[], item: T, before: T | undefined): T[] | undefined {
  if (!order.includes(item)) return undefined;
  const rest = order.filter((each) => each !== item);
  const at = before === undefined ? rest.length : rest.indexOf(before);
  return at < 0 ? undefined : [...rest.slice(0, at), item, ...rest.slice(at)];
}

export type Refusal = Refused & { status: 404 | 409 };

const NO_SUCH_EPIC: Refusal = { refused: "there is no such epic", status: 404 };
const TITLE_TAKEN: Refusal = { refused: "an epic needs a title of its own", status: 409 };

const sameTitle = (one: string, other: string) => one.toLowerCase() === other.toLowerCase();

export async function changed(
  database: D1Database,
  repository: string,
  change: Change,
): Promise<Plan | Refusal> {
  const db = drizzle(database);
  const ofRepository = eq(epics.repository, repository);
  if (change.change === "start") {
    const started = await db
      .select({ title: epics.title, position: epics.position })
      .from(epics)
      .where(ofRepository)
      .orderBy(asc(epics.position));
    if (started.some(({ title }) => sameTitle(title, change.title))) return TITLE_TAKEN;
    const position = (started.at(-1)?.position ?? -1) + 1;
    await db.insert(epics).values({ repository, title: change.title, position });
    return planOf(database, repository);
  }
  if (change.change === "move epic") {
    const started = await db
      .select({ id: epics.id })
      .from(epics)
      .where(ofRepository)
      .orderBy(asc(epics.position), asc(epics.id));
    const order = moved(
      started.map(({ id }) => id),
      change.epic,
      change.before,
    );
    if (!order) return NO_SUCH_EPIC;
    const [first, ...rest] = order.map((id, position) =>
      db
        .update(epics)
        .set({ position })
        .where(and(ofRepository, eq(epics.id, id))),
    );
    if (first) await db.batch([first, ...rest]);
    return planOf(database, repository);
  }
  const inAnyEpic = and(eq(picks.repository, repository), eq(picks.feature, change.feature));
  if (change.change === "take out") {
    await db.delete(picks).where(inAnyEpic);
    return planOf(database, repository);
  }
  const [epic, last] = await db.batch([
    db
      .select({ id: epics.id })
      .from(epics)
      .where(and(eq(epics.id, change.epic), ofRepository)),
    db
      .select({ position: max(picks.position) })
      .from(picks)
      .where(and(eq(picks.repository, repository), eq(picks.epic, change.epic))),
  ]);
  if (!epic[0]) return NO_SUCH_EPIC;
  const position = (last[0]?.position ?? -1) + 1;
  await db.batch([
    db.delete(picks).where(inAnyEpic),
    db.insert(picks).values({ repository, feature: change.feature, epic: epic[0].id, position }),
  ]);
  return planOf(database, repository);
}
