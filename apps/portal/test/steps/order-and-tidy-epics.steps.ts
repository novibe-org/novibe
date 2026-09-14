import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "expect";
import { epicOn, epicTitlesOn, eventually } from "./plan";
import type { PortalWorld } from "./world";

async function fromTheMenuOf(world: PortalWorld, epic: string, action: string) {
  await world.open();
  const page = world.page();
  await epicOn(page, epic).getByRole("button", { name: "Change", exact: true }).click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

Given(
  "the epics {string}, {string} and {string}, in that order",
  async function (this: PortalWorld, first: string, second: string, third: string) {
    for (const title of [first, second, third]) await this.change({ change: "start", title });
  },
);

When("I move {string} before {string}", async function (this: PortalWorld, moving, before) {
  await fromTheMenuOf(this, moving, `Move before ${before}`);
});

When("I move {string} to the end", async function (this: PortalWorld, moving: string) {
  await fromTheMenuOf(this, moving, "Move to the end");
});

Then(
  "I see the epics {string}, {string} and {string}, in that order",
  async function (this: PortalWorld, first: string, second: string, third: string) {
    await eventually(async () => {
      expect(await epicTitlesOn(this.page())).toEqual([first, second, third]);
    });
  },
);
