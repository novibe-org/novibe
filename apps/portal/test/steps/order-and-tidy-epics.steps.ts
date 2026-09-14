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
