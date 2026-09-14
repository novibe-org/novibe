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
  return {
    epics: started.map(({ id, title }) => ({
      id,
      title,
      features: picked.filter((pick) => pick.epic === id).map(({ feature }) => feature),
    })),
  };
}

export function goneFrom(plan: Plan, features: Feature[]): string[] {
  const onMain = new Set(
    features.flatMap((feature) => (feature.broken || !feature.id ? [] : [feature.id])),
  );
  return plan.epics.flatMap((epic) => epic.features).filter((id) => !onMain.has(id));
}

export async function changed(
  database: D1Database,
  repository: string,
  change: Change,
): Promise<Plan | Refused> {
  const db = drizzle(database);
  if (change.change === "start") {
    await db.insert(epics).values({ repository, title: change.title });
    return planOf(database, repository);
  }
  const epic = await db
    .select({ id: epics.id })
    .from(epics)
    .where(and(eq(epics.id, change.epic), eq(epics.repository, repository)))
    .get();
  if (!epic) return { refused: "there is no such epic" };
  const inAnyEpic = and(eq(picks.repository, repository), eq(picks.feature, change.feature));
  if (change.change === "pick") {
    await db.batch([
      db.delete(picks).where(inAnyEpic),
      db.insert(picks).values({ repository, feature: change.feature, epic: epic.id }),
    ]);
  } else {
    await db.delete(picks).where(and(inAnyEpic, eq(picks.epic, epic.id)));
  }
  return planOf(database, repository);
}
