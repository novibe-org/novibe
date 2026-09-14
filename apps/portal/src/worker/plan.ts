import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Feature } from "../feature";
import type { Change, Plan, Refused } from "../plan";
import { epics, picks } from "./tables";

export async function planOf(database: D1Database, repository: string): Promise<Plan> {
  const db = drizzle(database);
  const [started, picked] = await db.batch([
    db.select().from(epics).where(eq(epics.repository, repository)).orderBy(asc(epics.id)),
    db.select().from(picks).where(eq(picks.repository, repository)).orderBy(asc(picks.id)),
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
  if (change.change === "start") {
    const started = await db
      .select({ title: epics.title })
      .from(epics)
      .where(eq(epics.repository, repository));
    if (started.some(({ title }) => sameTitle(title, change.title))) return TITLE_TAKEN;
    await db.insert(epics).values({ repository, title: change.title });
    return planOf(database, repository);
  }
  const inAnyEpic = and(eq(picks.repository, repository), eq(picks.feature, change.feature));
  if (change.change === "take out") {
    await db.delete(picks).where(inAnyEpic);
    return planOf(database, repository);
  }
  const epic = await db
    .select({ id: epics.id })
    .from(epics)
    .where(and(eq(epics.id, change.epic), eq(epics.repository, repository)))
    .get();
  if (!epic) return NO_SUCH_EPIC;
  await db.batch([
    db.delete(picks).where(inAnyEpic),
    db.insert(picks).values({ repository, feature: change.feature, epic: epic.id }),
  ]);
  return planOf(database, repository);
}
