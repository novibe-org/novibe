import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "expect";
import type { PortalWorld } from "./world";

const ONE_SCENARIO = ["  Scenario: It is written", "    Then it reads as written"];
const OTHER_SCENARIO = "Paying with the only saved card";

const slug = (title: string) => title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");

function featureFile({
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

Given(
  "main holds the feature {string} with the id {string} in the domain {string}",
  function (this: PortalWorld, title: string, id: string, domain: string) {
    this.holds(`features/${domain}/${id}.feature`, featureFile({ title, id }));
  },
);

Given(
  "main holds {string} in {string}, {string} in {string} and {string} in {string}",
  function (
    this: PortalWorld,
    first: string,
    firstDomain: string,
    second: string,
    secondDomain: string,
    third: string,
    thirdDomain: string,
  ) {
    const held = [
      [first, firstDomain],
      [second, secondDomain],
      [third, thirdDomain],
    ];
    held.forEach(([title = "", domain = ""], at) => {
      this.holds(`features/${domain}/${at}-${slug(title)}.feature`, featureFile({ title }));
    });
  },
);

Given(
  "main holds the feature {string} with a narrative, a rule and two scenarios",
  function (this: PortalWorld, title: string) {
    const written = [
      "  As a returning customer",
      "  I pay with a card I saved before",
      "  so that I check out without typing it again.",
      "",
      "  Scenario: Paying with the only saved card",
      "    Given I saved a card",
      "    When I pay",
      "    Then the saved card is charged",
      "",
      "  Rule: A saved card needs no number",
      "",
      "    Scenario: Choosing between two saved cards",
      "      Given I saved two cards",
      "      When I pay with the second",
      "      Then the second card is charged",
    ];
    this.holds(
      "features/payments/pay-with-a-saved-card.feature",
      featureFile({ title, body: written }),
    );
    this.written = written.map((line) => line.trim()).filter(Boolean);
  },
);

Given("main holds the feature {string} without an id", function (this: PortalWorld, title: string) {
  this.holds(`features/payments/${slug(title)}.feature`, featureFile({ title, id: null }));
});

Given(
  "main holds {string}, which is not a readable feature",
  function (this: PortalWorld, path: string) {
    this.holds(`features/${path}`, "Refunds are not written yet.\n  Given nothing is refunded\n");
  },
);

Given("main holds no features", () => {});

Given(
  "main holds the feature {string} tagged {string}",
  function (this: PortalWorld, title: string, tag: string) {
    this.holds(`features/rewards/${slug(title)}.feature`, featureFile({ title, tags: [tag] }));
  },
);

Given(
  "the feature {string} holds the scenario {string} tagged {string}",
  function (this: PortalWorld, title: string, scenario: string, tag: string) {
    const body = [
      `  Scenario: ${OTHER_SCENARIO}`,
      "    Then the saved card is charged",
      "",
      `  ${tag}`,
      `  Scenario: ${scenario}`,
      "    Then the card is charged in both currencies",
    ];
    this.holds(`features/payments/${slug(title)}.feature`, featureFile({ title, body }));
  },
);

When("I open the portal", async function (this: PortalWorld) {
  await this.open();
});

When("I read {string}", async function (this: PortalWorld, title: string) {
  await this.open();
  await this.page().getByRole("link", { name: title }).click();
});

Then(
  "I see {string} listed with {string} and {string}",
  async function (this: PortalWorld, title: string, id: string, domain: string) {
    const listed = this.page()
      .getByRole("region", { name: domain })
      .getByRole("listitem")
      .filter({ hasText: title });
    await listed.getByText(id, { exact: true }).waitFor();
  },
);

Then(
  "I see {string} with {string} then {string}, then {string} with {string}",
  async function (
    this: PortalWorld,
    firstDomain: string,
    first: string,
    second: string,
    lastDomain: string,
    last: string,
  ) {
    await this.page().getByRole("region", { name: lastDomain }).waitFor();
    const seen = await this.page()
      .getByRole("region")
      .evaluateAll((regions) =>
        regions.map((region) => [
          region.getAttribute("aria-label"),
          ...Array.from(region.querySelectorAll("li a"), (link) => link.textContent),
        ]),
      );
    expect(seen).toEqual([
      [firstDomain, first, second],
      [lastDomain, last],
    ]);
  },
);

Then(
  "I see its narrative, its rule and both scenarios with all their steps, in the order written",
  async function (this: PortalWorld) {
    const shown = await this.page().getByRole("article").innerText();
    let from = 0;
    for (const line of this.written) {
      const at = shown.indexOf(line, from);
      expect({ line, shown: at >= 0 }).toEqual({ line, shown: true });
      from = at + line.length;
    }
  },
);

Then(
  "I see {string} listed, marked as having no id",
  async function (this: PortalWorld, title: string) {
    const listed = this.page().getByRole("listitem").filter({ hasText: title });
    await listed.getByText("no id", { exact: true }).waitFor();
  },
);

Then("I see {string} listed as broken", async function (this: PortalWorld, file: string) {
  const listed = this.page().getByRole("listitem").filter({ hasText: file });
  await listed.getByText("broken", { exact: true }).waitFor();
});

Then("I am told main has no features yet", async function (this: PortalWorld) {
  await this.page().getByText("main has no features yet").waitFor();
  expect(await this.page().getByRole("listitem").count()).toBe(0);
});

Then("I see {string} listed as backlog", async function (this: PortalWorld, title: string) {
  const listed = this.page().getByRole("listitem").filter({ hasText: title });
  await listed.getByText("backlog", { exact: true }).waitFor();
});

Then("I see {string} marked as backlog", async function (this: PortalWorld, scenario: string) {
  const page = this.page();
  await page
    .getByRole("region", { name: scenario })
    .getByText("backlog", { exact: true })
    .waitFor();
  expect(
    await page.getByRole("region", { name: OTHER_SCENARIO }).getByText("backlog").count(),
  ).toBe(0);
});
