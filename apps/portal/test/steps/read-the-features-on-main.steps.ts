import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "expect";
import type { PortalWorld } from "./world";
import { featureFile, slug } from "./written";

const OTHER_SCENARIO = "Paying with the only saved card";

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
  "main holds the feature {string} tagged {string} with the scenario {string}",
  function (this: PortalWorld, title: string, tag: string, scenario: string) {
    const body = [`  Scenario: ${scenario}`, "    Then points are earned"];
    this.holds(
      `features/rewards/${slug(title)}.feature`,
      featureFile({ title, tags: [tag], body }),
    );
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
    const listed = this.page().getByRole("listitem").filter({ hasText: title });
    await listed.getByText(id, { exact: true }).waitFor();
    await listed.getByText(domain, { exact: true }).waitFor();
  },
);

Then(
  "I see one list: {string} in {string}, {string} in {string}, then {string} in {string}",
  async function (
    this: PortalWorld,
    first: string,
    firstDomain: string,
    second: string,
    secondDomain: string,
    last: string,
    lastDomain: string,
  ) {
    const list = this.page().getByRole("group", { name: "not in any epic", exact: true });
    await list.getByRole("listitem").filter({ hasText: last }).waitFor();
    expect(await list.getByRole("list").count()).toBe(1);
    const seen = await list
      .getByRole("listitem")
      .evaluateAll((items) =>
        items.map((item) => [
          item.querySelector("a")?.textContent,
          item.querySelector("span")?.textContent,
        ]),
      );
    expect(seen).toEqual([
      [first, firstDomain],
      [second, secondDomain],
      [last, lastDomain],
    ]);
  },
);

async function seeWrittenInOrder(world: PortalWorld) {
  const shown = await world.page().getByRole("article").innerText();
  let from = 0;
  for (const line of world.written) {
    const at = shown.indexOf(line, from);
    expect({ line, shown: at >= 0 }).toEqual({ line, shown: true });
    from = at + line.length;
  }
}

Then(
  "I see its narrative, its rule and both scenarios with all their steps, in the order written",
  async function (this: PortalWorld) {
    await seeWrittenInOrder(this);
  },
);

const PARTS: Record<string, { body: string[]; written: string[] }> = {
  background: {
    body: [
      "  Background:",
      "    Given I saved a card",
      "",
      "  Scenario: Paying with the saved card",
      "    When I pay",
      "    Then the saved card is charged",
    ],
    written: [
      "Background:",
      "Given I saved a card",
      "Scenario: Paying with the saved card",
      "When I pay",
      "Then the saved card is charged",
    ],
  },
  "rule description": {
    body: [
      "  Rule: A saved card needs no number",
      "    The shop keeps only the last four digits;",
      "    the number stays with the payment provider.",
      "",
      "    Scenario: Paying with the saved card",
      "      When I pay",
    ],
    written: [
      "Rule: A saved card needs no number",
      "The shop keeps only the last four digits;",
      "the number stays with the payment provider.",
      "Scenario: Paying with the saved card",
      "When I pay",
    ],
  },
  "scenario description": {
    body: [
      "  Scenario: Paying with the saved card",
      "    A customer who saved a card",
      "    never types its number again.",
      "",
      "    When I pay",
      "    Then the saved card is charged",
    ],
    written: [
      "Scenario: Paying with the saved card",
      "A customer who saved a card",
      "never types its number again.",
      "When I pay",
      "Then the saved card is charged",
    ],
  },
  "doc string": {
    body: [
      "  Scenario: Being told what was charged",
      "    When I pay",
      "    Then I am sent",
      '      """',
      "      Dear customer,",
      "        your card ending 4242 was charged.",
      '      """',
    ],
    written: [
      "Scenario: Being told what was charged",
      "When I pay",
      "Then I am sent",
      "Dear customer,\n  your card ending 4242 was charged.",
    ],
  },
  "data table": {
    body: [
      "  Scenario: Paying with one of several saved cards",
      "    Given I saved these cards",
      "      | card       | ending |",
      "      | Visa       | 4242   |",
      "      | Mastercard | 4444   |",
      "    When I pay with the Mastercard",
    ],
    written: [
      "Given I saved these cards",
      "card\tending",
      "Visa\t4242",
      "Mastercard\t4444",
      "When I pay with the Mastercard",
    ],
  },
  "Examples table": {
    body: [
      "  Scenario Outline: Paying in <currency>",
      "    When I pay in <currency>",
      "    Then the card is charged in <currency>",
      "",
      "    Examples: Currencies the shop takes",
      "      | currency | symbol |",
      "      | EUR      | €      |",
      "      | GBP      | £      |",
    ],
    written: [
      "Scenario Outline: Paying in <currency>",
      "When I pay in <currency>",
      "Then the card is charged in <currency>",
      "Examples: Currencies the shop takes",
      "currency\tsymbol",
      "EUR\t€",
      "GBP\t£",
    ],
  },
};

const PART = Object.keys(PARTS).join("|");

Given(
  new RegExp(`^main holds the feature "([^"]*)" with a (${PART})$`),
  function (this: PortalWorld, title: string, part: string) {
    const { body, written } = PARTS[part] ?? { body: [], written: [] };
    this.holds("features/payments/pay-with-a-saved-card.feature", featureFile({ title, body }));
    this.written = written;
  },
);

Then(new RegExp(`^I see its (?:${PART}) as written$`), async function (this: PortalWorld) {
  await seeWrittenInOrder(this);
});

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
