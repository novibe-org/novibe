import type { Feature, Part } from "../feature";

export function duplicateIdsIn(features: Feature[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const feature of features) {
    if (feature.broken || !feature.id) continue;
    if (seen.has(feature.id)) duplicates.add(feature.id);
    seen.add(feature.id);
  }
  return duplicates;
}

export const keyOf = (feature: Feature, duplicates: ReadonlySet<string>) =>
  feature.broken || !feature.id || duplicates.has(feature.id)
    ? `path:${feature.path}`
    : `id:${feature.id}`;

export const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export const stemOf = (file: string) => file.replace(/\.feature$/, "");

export const counted = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

export const scenariosIn = (parts: Part[]): number =>
  parts.reduce((count, part) => {
    if ("rule" in part) return count + scenariosIn(part.rule.parts);
    return "scenario" in part ? count + 1 : count;
  }, 0);

export function droppedBefore<T>(order: T[], item: T, onto: T | undefined, after: boolean) {
  if (onto === item) return undefined;
  const rest = order.filter((each) => each !== item);
  const before = onto === undefined ? undefined : rest[rest.indexOf(onto) + (after ? 1 : 0)];
  return before === order[order.indexOf(item) + 1] ? undefined : { before };
}
