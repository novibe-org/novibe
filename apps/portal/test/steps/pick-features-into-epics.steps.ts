import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "expect";
import type { Page } from "playwright";
import type { PortalWorld } from "./world";
import { featureFile, slug } from "./written";

const epicsOn = (page: Page) => page.getByRole("group", { name: "epics", exact: true });

const notInAnyEpicOn = (page: Page) =>
  page.getByRole("group", { name: "not in any epic", exact: true });

const epicOn = (page: Page, title: string) =>
  epicsOn(page).getByRole("region", { name: title, exact: true });

const epicSelectOn = (page: Page) => page.getByRole("combobox", { name: "Epic", exact: true });

function mainHolds(
  world: PortalWorld,
  title: string,
  domain = "payments",
  written: { id?: string | null; tags?: string[] } = {},
) {
  world.holds(`features/${domain}/${slug(title)}.feature`, featureFile({ title, ...written }));
}

async function epicHolding(world: PortalWorld, title: string, id: string) {
  const { epics } = await world.change({ change: "start", title });
  const epic = epics.filter((started) => started.title === title).at(-1);
  if (!epic) throw new Error(`the epic "${title}" was not started`);
  await world.change({ change: "pick", feature: id, epic: epic.id });
}

async function reading(world: PortalWorld, title: string) {
  if (!world.holdsTitled(title)) mainHolds(world, title);
  await world.open();
  await world.page().getByRole("link", { name: title, exact: true }).click();
}

async function seeNotInAnyEpic(world: PortalWorld, title: string) {
  const page = world.page();
  await notInAnyEpicOn(page).getByRole("listitem").filter({ hasText: title }).waitFor();
  expect(await epicsOn(page).getByRole("listitem").filter({ hasText: title }).count()).toBe(0);
}

Given("the epic {string}", async function (this: PortalWorld, title: string) {
  await this.change({ change: "start", title });
});

Given("the epic {string} holds {string}", async function (this: PortalWorld, epic, title) {
  mainHolds(this, title);
  await epicHolding(this, epic, slug(title));
});

Given(
  "the epic {string} holds {string}, and there is the epic {string}",
  async function (this: PortalWorld, epic: string, title: string, other: string) {
    mainHolds(this, title);
    await epicHolding(this, epic, slug(title));
    await this.change({ change: "start", title: other });
  },
);

Given(
  "main also holds {string} in {string} and {string} in {string}",
  function (this: PortalWorld, first: string, firstDomain: string, last: string, lastDomain) {
    mainHolds(this, first, firstDomain);
    mainHolds(this, last, lastDomain);
  },
);

Given(
  "the epic {string} and the feature {string} without an id",
  async function (this: PortalWorld, epic: string, title: string) {
    await this.change({ change: "start", title: epic });
    mainHolds(this, title, "payments", { id: null });
  },
);

Given(
  "the epic {string} and the feature {string} tagged {string}",
  async function (this: PortalWorld, epic: string, title: string, tag: string) {
    await this.change({ change: "start", title: epic });
    mainHolds(this, title, "rewards", { tags: [tag] });
  },
);

Given(
  "the epic {string} holds the feature with the id {string}",
  async function (this: PortalWorld, epic: string, id: string) {
    mainHolds(this, id, "payments", { id });
    await epicHolding(this, epic, id);
    this.picked = id;
  },
);

Given("main no longer holds a feature with that id", function (this: PortalWorld) {
  this.noLongerHolds(this.picked ?? "");
});

When("I start the epic {string}", async function (this: PortalWorld, title: string) {
  await this.open();
  const page = this.page();
  await page.getByRole("textbox", { name: "Epic title" }).fill(title);
  await page.getByRole("button", { name: "Start epic" }).click();
});

When("I start an epic without a title", async function (this: PortalWorld) {
  await this.open();
  const page = this.page();
  await page.getByRole("button", { name: "Start epic" }).click();
  await page.getByRole("alert").waitFor();
});

When("I pick {string} into {string}", async function (this: PortalWorld, title, epic) {
  await reading(this, title);
  await epicSelectOn(this.page()).selectOption({ label: epic });
});

When("I try to pick {string} into {string}", async function (this: PortalWorld, title, epic) {
  await reading(this, title);
  const select = epicSelectOn(this.page());
  expect(await select.getByRole("option", { name: epic, exact: true }).count()).toBe(1);
  expect(await select.isDisabled()).toBe(true);
});

When("I take {string} out of {string}", async function (this: PortalWorld, title, epic) {
  await reading(this, title);
  const select = epicSelectOn(this.page());
  expect(await select.locator("option:checked").textContent()).toBe(epic);
  await select.selectOption({ label: "not in any epic" });
});

When("I open the portal again later", async function (this: PortalWorld) {
  await this.open();
  await this.restart();
  await this.open();
});

Then(
  "I see {string}, then {string} holding no features yet",
  async function (this: PortalWorld, first: string, second: string) {
    const page = this.page();
    await epicOn(page, second).getByText("No features yet.").waitFor();
    const seen = await epicsOn(page)
      .getByRole("region")
      .evaluateAll((regions) =>
        regions.map((region) => [
          region.getAttribute("aria-label"),
          region.querySelectorAll("li").length,
        ]),
      );
    expect(seen).toEqual([
      [first, 0],
      [second, 0],
    ]);
  },
);

Then("I still see only the epic {string}", async function (this: PortalWorld, title: string) {
  const seen = await epicsOn(this.page())
    .getByRole("region")
    .evaluateAll((regions) => regions.map((region) => region.getAttribute("aria-label")));
  expect(seen).toEqual([title]);
});

Then(
  "I see {string} holding {string}, then {string}",
  async function (this: PortalWorld, epic: string, first: string, second: string) {
    const held = epicOn(this.page(), epic).getByRole("listitem");
    await held.filter({ hasText: second }).waitFor();
    const seen = await held.evaluateAll((items) =>
      items.map((item) => item.querySelector("a")?.textContent),
    );
    expect(seen).toEqual([first, second]);
  },
);

Then(
  "I see {string} in {string} and no longer in {string}",
  async function (this: PortalWorld, title: string, epic: string, before: string) {
    const page = this.page();
    await epicOn(page, epic).getByRole("listitem").filter({ hasText: title }).waitFor();
    expect(
      await epicOn(page, before).getByRole("listitem").filter({ hasText: title }).count(),
    ).toBe(0);
  },
);

Then("I see {string} as not in any epic", async function (this: PortalWorld, title: string) {
  await seeNotInAnyEpic(this, title);
});

Then("I see {string} still as not in any epic", async function (this: PortalWorld, title) {
  await seeNotInAnyEpic(this, title);
});

Then(
  "after {string} I see {string} with {string}, then {string} with {string}, as not in any epic",
  async function (
    this: PortalWorld,
    epic: string,
    firstDomain: string,
    first: string,
    lastDomain: string,
    last: string,
  ) {
    const page = this.page();
    await notInAnyEpicOn(page).getByRole("region", { name: lastDomain, exact: true }).waitFor();
    const seen = await page.getByRole("region").evaluateAll((regions) =>
      regions.map((region) => ({
        group: region.closest("fieldset")?.getAttribute("aria-label"),
        name: region.getAttribute("aria-label"),
        features: Array.from(region.querySelectorAll("li a"), (link) => link.textContent),
      })),
    );
    expect(seen.map(({ group, name }) => [group, name])).toEqual([
      ["epics", epic],
      ["not in any epic", firstDomain],
      ["not in any epic", lastDomain],
    ]);
    expect(seen.slice(1).map(({ features }) => features)).toEqual([[first], [last]]);
  },
);

Then(
  "I see {string} in {string}, marked as backlog",
  async function (this: PortalWorld, title: string, epic: string) {
    const listed = epicOn(this.page(), epic).getByRole("listitem").filter({ hasText: title });
    await listed.getByText("backlog", { exact: true }).waitFor();
  },
);

Then(
  "I see {string} in {string}, marked as no longer on main",
  async function (this: PortalWorld, id: string, epic: string) {
    const listed = epicOn(this.page(), epic).getByRole("listitem").filter({ hasText: id });
    await listed.getByText("no longer on main", { exact: true }).waitFor();
  },
);

Then(
  "I still see {string} in {string}",
  async function (this: PortalWorld, title: string, epic: string) {
    await epicOn(this.page(), epic).getByRole("listitem").filter({ hasText: title }).waitFor();
  },
);
