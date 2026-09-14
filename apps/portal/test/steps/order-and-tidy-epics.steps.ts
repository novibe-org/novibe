import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "expect";
import type { Page } from "playwright";
import {
  epicHolding,
  epicOn,
  epicTitlesOn,
  eventually,
  featuresIn,
  mainHolds,
  reading,
  seeNotInAnyEpic,
} from "./plan";
import type { PortalWorld } from "./world";
import { slug } from "./written";

const placeSelectOn = (page: Page) => page.getByRole("combobox", { name: "Place", exact: true });

async function fromTheMenuOf(world: PortalWorld, epic: string, action: string) {
  await world.open();
  const page = world.page();
  await epicOn(page, epic).getByRole("button", { name: "Change", exact: true }).click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

async function placing(world: PortalWorld, feature: string, place: string) {
  await reading(world, feature);
  await placeSelectOn(world.page()).selectOption({ label: place });
}

async function epicHoldingInOrder(world: PortalWorld, epic: string, titles: string[]) {
  for (const title of titles) mainHolds(world, title);
  await epicHolding(world, epic, ...titles.map(slug));
}

Given(
  "the epics {string}, {string} and {string}, in that order",
  async function (this: PortalWorld, first: string, second: string, third: string) {
    for (const title of [first, second, third]) await this.change({ change: "start", title });
  },
);

Given(
  "the epic {string} holds {string}, {string} and {string}, in that order",
  async function (this: PortalWorld, epic: string, first: string, second: string, third) {
    await epicHoldingInOrder(this, epic, [first, second, third]);
  },
);

Given(
  "the epic {string} holds {string} and {string}, in that order",
  async function (this: PortalWorld, epic: string, first: string, second: string) {
    await epicHoldingInOrder(this, epic, [first, second]);
  },
);

When("I move {string} before {string}", async function (this: PortalWorld, moving, before) {
  if (this.plan?.epics.some(({ title }) => title === moving)) {
    await fromTheMenuOf(this, moving, `Move before ${before}`);
  } else {
    await placing(this, moving, `before ${before}`);
  }
});

When("I move {string} to the end", async function (this: PortalWorld, moving: string) {
  await fromTheMenuOf(this, moving, "Move to the end");
});

When(
  "I move {string} to the end of {string}",
  async function (this: PortalWorld, moving: string, epic: string) {
    await reading(this, moving);
    expect(await epicOn(this.page(), epic).getByRole("link", { name: moving }).count()).toBe(1);
    await placeSelectOn(this.page()).selectOption({ label: "at the end" });
  },
);

Then(
  "I see the epics {string}, {string} and {string}, in that order",
  async function (this: PortalWorld, first: string, second: string, third: string) {
    await eventually(async () => {
      expect(await epicTitlesOn(this.page())).toEqual([first, second, third]);
    });
  },
);

Then(
  "I see {string} holding {string}, {string} and {string}, in that order",
  async function (this: PortalWorld, epic: string, first: string, second: string, third) {
    await eventually(async () => {
      expect(await featuresIn(this.page(), epic)).toEqual([first, second, third]);
    });
  },
);

Given("the epics {string} and {string}", async function (this: PortalWorld, first, second) {
  for (const title of [first, second]) await this.change({ change: "start", title });
});

Given(
  "the epics {string} and {string}, and {string} holds {string}",
  async function (this: PortalWorld, first: string, second: string, holder: string, title) {
    for (const epic of [first, second]) await this.change({ change: "start", title: epic });
    const epic = this.plan?.epics.find((started) => started.title === holder);
    if (!epic) throw new Error(`the epic "${holder}" was not started`);
    mainHolds(this, title);
    await this.change({ change: "pick", feature: slug(title), epic: epic.id });
  },
);

When("I rename {string} to {string}", async function (this: PortalWorld, epic: string, title) {
  await fromTheMenuOf(this, epic, "Rename");
  const panel = epicOn(this.page(), epic);
  await panel.getByRole("textbox", { name: "New title", exact: true }).fill(title);
  await panel.getByRole("button", { name: "Save", exact: true }).click();
});

Then(
  "I see {string}, holding {string}, then {string}",
  async function (this: PortalWorld, first: string, feature: string, second: string) {
    const page = this.page();
    await eventually(async () => {
      expect(await epicTitlesOn(page)).toEqual([first, second]);
      expect(await featuresIn(page, first)).toEqual([feature]);
      expect(await featuresIn(page, second)).toEqual([]);
    });
  },
);

Then(
  "I still see the epics {string} and {string}",
  async function (this: PortalWorld, first: string, second: string) {
    const page = this.page();
    await page.getByRole("alert").waitFor({ timeout: 5_000 });
    expect(await epicTitlesOn(page)).toEqual([first, second]);
  },
);

When("I remove {string} and confirm", async function (this: PortalWorld, epic: string) {
  await fromTheMenuOf(this, epic, "Remove");
  const dialog = this.page().getByRole("dialog");
  await dialog.getByRole("button", { name: "Remove", exact: true }).click();
});

When("I remove {string} but do not confirm", async function (this: PortalWorld, epic: string) {
  await fromTheMenuOf(this, epic, "Remove");
  const dialog = this.page().getByRole("dialog");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
});

Then(
  "I no longer see {string}, and {string} is not in any epic",
  async function (this: PortalWorld, epic: string, feature: string) {
    await eventually(async () => {
      expect(await epicTitlesOn(this.page())).not.toContain(epic);
    });
    await seeNotInAnyEpic(this, feature);
  },
);

Then("I still see the epic {string}", async function (this: PortalWorld, epic: string) {
  await this.open();
  await epicOn(this.page(), epic).waitFor({ timeout: 5_000 });
});
