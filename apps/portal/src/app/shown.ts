import type { Part } from "../feature";

export const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export const stemOf = (file: string) => file.replace(/\.feature$/, "");

export const counted = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

export const scenariosIn = (parts: Part[]): number =>
  parts.reduce((count, part) => {
    if ("rule" in part) return count + scenariosIn(part.rule.parts);
    return "scenario" in part ? count + 1 : count;
  }, 0);
