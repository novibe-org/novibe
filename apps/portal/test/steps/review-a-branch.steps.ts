import { Given, Then, When } from "@cucumber/cucumber";
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

Given(
  "{string} changed today and {string} yesterday",
  function (this: PortalWorld, today: string, yesterday: string) {
    this.branchChanged(today, new Date());
    this.branchChanged(yesterday, new Date(Date.now() - 86_400_000));
  },
);

When("I look at the branches I can choose", async function (this: PortalWorld) {
  await this.open();
  await this.page()
    .getByRole("button", { name: /^Branch / })
    .click();
});

Then(
  "I see {string} set apart first, then {string}, then {string}",
  async function (this: PortalWorld, main: string, first: string, second: string) {
    const menu = this.page().getByRole("menu");
    await menu.getByRole("menuitem", { name: second, exact: true }).waitFor();
    const seen = await menu.evaluate((shown) =>
      [...shown.querySelectorAll('[role="menuitem"], [role="separator"]')].map((each) =>
        each.getAttribute("role") === "separator" ? "set apart" : each.textContent,
      ),
    );
    expect(seen).toEqual([main, "set apart", first, second]);
  },
);

async function choose(world: PortalWorld, branch: string) {
  const page = world.page();
  await page.getByRole("button", { name: /^Branch / }).click();
  await page.getByRole("menu").getByRole("menuitem", { name: branch, exact: true }).click();
}

Given("I chose the branch {string}", async function (this: PortalWorld, branch: string) {
  mainHolds(this, "Paying with a saved card");
  branchHoldsTitled(this, branch, "Refunding a payment");
  await this.open();
  await choose(this, branch);
  await this.page().waitForURL((address) => address.searchParams.get("branch") === branch);
});

When("I load the same page again", async function (this: PortalWorld) {
  await this.page().reload();
});

Then("I still see the features on {string}", async function (this: PortalWorld, branch: string) {
  await seeTheFeaturesOn(this, branch);
});

Given(
  "only {string} holds the feature {string}",
  function (this: PortalWorld, branch: string, title: string) {
    branchHoldsTitled(this, branch, title);
  },
);

When("I choose the branch {string}", async function (this: PortalWorld, branch: string) {
  await this.open();
  await choose(this, branch);
});

Given(
  "the latest test run of {string} passed {string}",
  function (this: PortalWorld, branch: string, title: string) {
    const scenario = "Refunding in full";
    this.feature = title;
    this.featurePath = `features/payments/${slug(title)}.feature`;
    const body = [`  Scenario: ${scenario}`, "    Then it is refunded"];
    this.branchHolds(branch, this.featurePath, featureFile({ title, body }));
    this.proved(this.featurePath, scenario, "passed", branch);
  },
);

Then("I see {string}", async function (this: PortalWorld, title: string) {
  await notInAnyEpicOn(this.page()).getByRole("link", { name: title, exact: true }).waitFor();
});
