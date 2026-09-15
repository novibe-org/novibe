import { Given, Then } from "@cucumber/cucumber";
import { expect } from "expect";
import type { Page } from "playwright";
import { eventually, mainHolds, notInAnyEpicOn } from "./plan";
import type { PortalWorld } from "./world";
import { featureFile, slug } from "./written";

function branchHoldsTitled(world: PortalWorld, branch: string, title: string) {
  world.featurePath = `features/payments/${slug(title)}.feature`;
  world.branchHolds(branch, world.featurePath, featureFile({ title }));
}

const listedTitlesOn = (page: Page) =>
  notInAnyEpicOn(page)
    .getByRole("listitem")
    .evaluateAll((items) => items.map((item) => item.querySelector("a")?.textContent));

async function seeTheFeaturesOn(world: PortalWorld, branch: string) {
  const page = world.page();
  await page.getByRole("button", { name: `Branch ${branch}`, exact: true }).waitFor();
  await eventually(async () => {
    expect(await listedTitlesOn(page)).toEqual(world.titlesOn(branch));
  });
}

Given("the branches {string} and {string}", function (this: PortalWorld, main, other: string) {
  expect(main).toBe("main");
  mainHolds(this, "Paying with a saved card");
  branchHoldsTitled(this, other, "Refunding a payment");
});

Then("I see the features on {string}", async function (this: PortalWorld, branch: string) {
  await seeTheFeaturesOn(this, branch);
});
