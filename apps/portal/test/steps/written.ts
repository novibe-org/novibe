const ONE_SCENARIO = ["  Scenario: It is written", "    Then it reads as written"];

export const slug = (title: string) => title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");

export function featureFile({
  title,
  id = slug(title),
  tags = [],
  body = ONE_SCENARIO,
}: {
  title: string;
  id?: string | null;
  tags?: string[];
  body?: string[];
}): string {
  const tagLine = [...(id === null ? [] : [`@id:${id}`]), ...tags].join(" ");
  return [tagLine, `Feature: ${title}`, "", ...body, ""].join("\n");
}
