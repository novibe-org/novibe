import { expect } from "expect";
import type { Locator, Page } from "playwright";
import type { PortalWorld } from "./world";
import { featureFile, slug } from "./written";

export const epicsOn = (page: Page) => page.getByRole("group", { name: "epics", exact: true });

export const notInAnyEpicOn = (page: Page) =>
  page.getByRole("group", { name: "not in any epic", exact: true });

export const epicOn = (page: Page, title: string) =>
  epicsOn(page).getByRole("region", { name: title, exact: true });

export const epicSelectOn = (page: Page) =>
  page.getByRole("combobox", { name: "Epic", exact: true });

export const epicTitlesOn = (page: Page) =>
  epicsOn(page)
    .getByRole("region")
    .evaluateAll((regions) => regions.map((region) => region.getAttribute("aria-label")));

export const featuresIn = (page: Page, epic: string) =>
  epicOn(page, epic)
    .getByRole("listitem")
    .evaluateAll((items) => items.map((item) => item.querySelector("a")?.textContent));

export const headOf = (page: Page, epic: string) =>
  epicOn(page, epic).getByRole("heading", { name: epic, exact: true });

export const rowOf = (page: Page, epic: string, feature: string) =>
  epicOn(page, epic).getByRole("listitem").filter({ hasText: feature });

export const listedIn = (group: Locator) =>
  group
    .getByRole("listitem")
    .evaluateAll((items) =>
      items.map((item) => [
        item.querySelector("a")?.textContent,
        item.querySelector("span")?.textContent,
      ]),
    );

export async function dragOnto(source: Locator, target: Locator, half: "upper" | "lower") {
  await target.waitFor();
  const box = await target.boundingBox();
  if (!box) throw new Error("there is nothing to drop onto");
  const y = half === "upper" ? box.height / 4 : (box.height * 3) / 4;
  await source.dragTo(target, { targetPosition: { x: box.width / 2, y } });
}

export function mainHolds(
  world: PortalWorld,
  title: string,
  domain = "payments",
  written: { id?: string | null; tags?: string[] } = {},
) {
  world.holds(`features/${domain}/${slug(title)}.feature`, featureFile({ title, ...written }));
}

export async function epicHolding(world: PortalWorld, title: string, ...ids: string[]) {
  const { epics } = await world.change({ change: "start", title });
  const epic = epics.filter((started) => started.title === title).at(-1);
  if (!epic) throw new Error(`the epic "${title}" was not started`);
  for (const id of ids) await world.change({ change: "pick", feature: id, epic: epic.id });
}

export async function reading(world: PortalWorld, title: string) {
  if (!world.holdsTitled(title)) mainHolds(world, title);
  await world.open();
  await world.page().getByRole("link", { name: title, exact: true }).click();
}

export async function seeNotInAnyEpic(world: PortalWorld, title: string) {
  const page = world.page();
  await notInAnyEpicOn(page).getByRole("listitem").filter({ hasText: title }).waitFor();
  expect(await epicsOn(page).getByRole("listitem").filter({ hasText: title }).count()).toBe(0);
}

export async function eventually(check: () => Promise<void>, timeout = 5_000) {
  const until = Date.now() + timeout;
  for (;;) {
    try {
      await check();
      return;
    } catch (failure) {
      if (Date.now() > until) throw failure;
    }
    await new Promise((later) => setTimeout(later, 50));
  }
}
