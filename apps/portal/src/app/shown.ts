import type { Feature, Part, Scenario } from "../feature";

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

const scenariosOf = (parts: Part[]): Scenario[] =>
  parts.flatMap((part) => {
    if ("rule" in part) return scenariosOf(part.rule.parts);
    return "scenario" in part ? [part.scenario] : [];
  });

export const scenariosIn = (parts: Part[]) => scenariosOf(parts).length;

export function passedOf(parts: Part[]): string | undefined {
  const scenarios = scenariosOf(parts);
  if (!scenarios.some(({ result }) => result)) return undefined;
  const passed = scenarios.filter(({ result }) => result === "passed").length;
  return `${passed} of ${scenarios.length} passed`;
}

const SPANS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function agoFrom(then: string, now = Date.now()): string {
  const past = Math.max(0, now - Date.parse(then));
  const [unit, span] = SPANS.find(([, length]) => past >= length) ?? ["second", 1_000];
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    -Math.round(past / span),
    unit,
  );
}

export function droppedBefore<T>(order: T[], item: T, onto: T | undefined, after: boolean) {
  if (onto === item) return undefined;
  const rest = order.filter((each) => each !== item);
  const before = onto === undefined ? undefined : rest[rest.indexOf(onto) + (after ? 1 : 0)];
  return before === order[order.indexOf(item) + 1] ? undefined : { before };
}
