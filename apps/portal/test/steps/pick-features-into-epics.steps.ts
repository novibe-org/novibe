import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "expect";
import {
  dragOnto,
  epicHolding,
  epicOn,
  epicSelectOn,
  epicsOn,
  epicTitlesOn,
  eventually,
  featuresIn,
  headOf,
  listedIn,
  mainHolds,
  notInAnyEpicOn,
  reading,
  rowOf,
  seeNotInAnyEpic,
} from "./plan";
import type { PortalWorld } from "./world";
import { slug } from "./written";

function listedRowOf(world: PortalWorld, title: string) {
  const page = world.page();
  const holder = world.plan?.epics.find(({ features }) => features.includes(slug(title)));
  if (holder) return rowOf(page, holder.title, title);
  return notInAnyEpicOn(page).getByRole("listitem").filter({ hasText: title });
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

Given("the branch shown holds no feature with that id", function (this: PortalWorld) {
  this.noLongerHolds(this.picked ?? "");
});

When("I start the epic {string}", async function (this: PortalWorld, title: string) {
  await this.open();
  const page = this.page();
  await page.getByRole("textbox", { name: "Epic title" }).fill(title);
  await page.getByRole("button", { name: "Start epic" }).click();
});

When("I start an epic titled {string}", async function (this: PortalWorld, title: string) {
  await this.open();
  const page = this.page();
  await page.getByRole("textbox", { name: "Epic title" }).fill(title);
  await page.getByRole("button", { name: "Start epic" }).click();
  await page.getByRole("alert").waitFor({ timeout: 5_000 });
});

When("I pick {string} into {string}", async function (this: PortalWorld, title, epic) {
  if (!this.holdsTitled(title)) mainHolds(this, title);
  await this.open();
  await dragOnto(listedRowOf(this, title), headOf(this.page(), epic), "lower");
});

When("I try to pick {string} into {string}", async function (this: PortalWorld, title, epic) {
  await reading(this, title);
  const select = epicSelectOn(this.page());
  expect(await select.getByRole("option", { name: epic, exact: true }).count()).toBe(1);
  expect(await select.isDisabled()).toBe(true);
});

When(
  "I pick {string} into {string} and take it out again before that is saved",
  async function (this: PortalWorld, title: string, epic: string) {
    await reading(this, title);
    const page = this.page();
    const select = epicSelectOn(page);
    let release = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    let hold = () => {};
    const held = new Promise<void>((resolve) => {
      hold = resolve;
    });
    await page.route(
      "**/api/plan",
      async (route) => {
        hold();
        await released;
        await route.continue();
      },
      { times: 1 },
    );
    await select.selectOption({ label: epic });
    await held;
    await select.selectOption({ label: "not in any epic" });
    release();
  },
);

When("I take {string} out of {string}", async function (this: PortalWorld, title, epic) {
  await this.open();
  const page = this.page();
  await dragOnto(rowOf(page, epic, title), notInAnyEpicOn(page), "upper");
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
  expect(await epicTitlesOn(this.page())).toEqual([title]);
});

Then(
  "I see {string} holding {string}, then {string}",
  async function (this: PortalWorld, epic: string, first: string, second: string) {
    await eventually(async () => {
      expect(await featuresIn(this.page(), epic)).toEqual([first, second]);
    });
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
  "after {string} I see not in any epic {string} in {string}, then {string} in {string}",
  async function (
    this: PortalWorld,
    epic: string,
    first: string,
    firstDomain: string,
    last: string,
    lastDomain: string,
  ) {
    const page = this.page();
    const list = notInAnyEpicOn(page);
    await list.getByRole("listitem").filter({ hasText: last }).waitFor();
    expect(await epicTitlesOn(page)).toEqual([epic]);
    const afterTheEpics = await list.evaluate((group) => {
      const epics = group.ownerDocument.querySelector('fieldset[aria-label="epics"]');
      return epics?.compareDocumentPosition(group) === Node.DOCUMENT_POSITION_FOLLOWING;
    });
    expect(afterTheEpics).toBe(true);
    expect(await list.getByRole("list").count()).toBe(1);
    expect(await listedIn(list)).toEqual([
      [first, firstDomain],
      [last, lastDomain],
    ]);
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
  "I see {string} in {string}, marked as not on this branch",
  async function (this: PortalWorld, id: string, epic: string) {
    const listed = epicOn(this.page(), epic).getByRole("listitem").filter({ hasText: id });
    await listed.getByText("not on this branch", { exact: true }).waitFor();
  },
);

Then(
  "I still see {string} in {string}",
  async function (this: PortalWorld, title: string, epic: string) {
    await epicOn(this.page(), epic).getByRole("listitem").filter({ hasText: title }).waitFor();
  },
);
