import { Given, Then, When } from "@cucumber/cucumber";
import { epicHolding, epicOn } from "./plan";
import type { Verdict } from "./run";
import type { PortalWorld } from "./world";
import { featureFile, slug } from "./written";

const FEATURE = "Paying for an order";

const scenario = (name: string, tags: string[] = []) => [
  "",
  ...(tags.length > 0 ? [`  ${tags.join(" ")}`] : []),
  `  Scenario: ${name}`,
  "    Then it is proved",
];

const times = <T>(count: number, each: T): T[] => Array.from({ length: count }, () => each);

function defaultBranchHoldsFeature(world: PortalWorld, title: string, body: string[]): string {
  world.feature = title;
  world.featurePath = `features/payments/${slug(title)}.feature`;
  world.holds(world.featurePath, featureFile({ title, body }));
  return world.featurePath;
}

function defaultBranchHoldsProved(
  world: PortalWorld,
  title: string,
  verdicts: (Verdict | undefined)[],
  tags: string[][] = [],
) {
  const names = verdicts.map((_, at) => `${title}, scenario ${at + 1}`);
  const body = names.flatMap((name, at) => scenario(name, tags[at]));
  const path = defaultBranchHoldsFeature(world, title, body);
  names.forEach((name, at) => {
    const verdict = verdicts[at];
    if (verdict) world.proved(path, name, verdict);
  });
}

const passedAndFailed = (passed: number, of: number): Verdict[] => [
  ...times<Verdict>(passed, "passed"),
  ...times<Verdict>(of - passed, "failed"),
];

async function markedAs(world: PortalWorld, name: string, result: string) {
  const region = world.page().getByRole("region", { name, exact: true });
  await region.getByText(result, { exact: true }).waitFor();
}

const rowOf = (world: PortalWorld, title: string) =>
  world.page().getByRole("listitem").filter({ hasText: title });

Given(
  /^the default branch's latest test run (passed|failed) the scenario "([^"]*)"$/,
  function (this: PortalWorld, verdict: Verdict, name: string) {
    this.proved(defaultBranchHoldsFeature(this, FEATURE, scenario(name)), name, verdict);
  },
);

Given(
  "the default branch's latest test run did not run the scenario {string}",
  function (this: PortalWorld, name: string) {
    defaultBranchHoldsFeature(this, FEATURE, scenario(name));
    this.testRun();
  },
);

Given(
  "the scenario {string} is tagged {string}",
  function (this: PortalWorld, name: string, tag: string) {
    defaultBranchHoldsFeature(this, FEATURE, scenario(name, [tag]));
    this.scenario = name;
  },
);

Given("the default branch's latest test run passed it", function (this: PortalWorld) {
  this.proved(this.featurePath, this.scenario, "passed");
});

Given(
  "the default branch's latest test run passed the outline {string} for {string} and failed it for {string}",
  function (this: PortalWorld, outline: string, passing: string, failing: string) {
    const [placeholder = ""] = /<[^<>]+>/.exec(outline) ?? [];
    const path = defaultBranchHoldsFeature(this, FEATURE, [
      "",
      `  Scenario Outline: ${outline}`,
      `    Then it is paid in ${placeholder}`,
      "",
      "    Examples:",
      `      | ${placeholder.slice(1, -1)} |`,
      `      | ${passing} |`,
      `      | ${failing} |`,
    ]);
    this.proved(path, outline.replace(placeholder, passing), "passed");
    this.proved(path, outline.replace(placeholder, failing), "failed");
  },
);

Given(
  "the default branch's latest test run passed {int} and failed {int} of the {int} scenarios of {string}",
  function (this: PortalWorld, passed: number, failed: number, of: number, title: string) {
    const verdicts = [
      ...times<Verdict>(passed, "passed"),
      ...times<Verdict>(failed, "failed"),
      ...times(of - passed - failed, undefined),
    ];
    defaultBranchHoldsProved(this, title, verdicts);
  },
);

Given(
  "{string} has {int} scenarios the latest run passed and {int} tagged {string} it did not run",
  function (this: PortalWorld, title: string, passed: number, tagged: number, tag: string) {
    const verdicts = [...times<Verdict>(passed, "passed"), ...times(tagged, undefined)];
    defaultBranchHoldsProved(this, title, verdicts, [
      ...times(passed, []),
      ...times(tagged, [tag]),
    ]);
  },
);

Given(
  "the epic {string} holds {string} with {int} of {int} passed and {string} with {int} of {int} passed",
  async function (
    this: PortalWorld,
    epic: string,
    first: string,
    firstPassed: number,
    firstOf: number,
    second: string,
    secondPassed: number,
    secondOf: number,
  ) {
    defaultBranchHoldsProved(this, first, passedAndFailed(firstPassed, firstOf));
    defaultBranchHoldsProved(this, second, passedAndFailed(secondPassed, secondOf));
    await epicHolding(this, epic, slug(first), slug(second));
  },
);

Given(
  "the default branch's latest test run passed {int} of its {int} scenarios",
  function (this: PortalWorld, passed: number, of: number) {
    const verdicts = [
      ...times<Verdict>(passed, "passed"),
      ...times<Verdict>(1, "failed"),
      ...times(of - passed - 1, undefined),
    ];
    const titles = ["Paying with a saved card", "Paying by invoice", "Earning points", "Refunds"];
    const each = Math.ceil(of / titles.length);
    titles.forEach((title, at) => {
      defaultBranchHoldsProved(this, title, verdicts.slice(at * each, (at + 1) * each));
    });
  },
);

Given(
  "the default branch's latest test run finished {int} hours ago",
  function (this: PortalWorld, hours: number) {
    this.testRun().finished = new Date(Date.now() - hours * 3_600_000);
  },
);

Given(
  "the default branch's latest test run ran for an earlier commit than the one shown",
  function (this: PortalWorld) {
    const name = "Paying with a saved card";
    this.proved(defaultBranchHoldsFeature(this, FEATURE, scenario(name)), name, "passed");
    this.ranForAnEarlierCommit();
  },
);

Given("the default branch has never had a test run", () => {});

When("I read its feature", async function (this: PortalWorld) {
  await this.open();
  await this.page().getByRole("link", { name: this.feature, exact: true }).click();
});

Then(
  /^I see "([^"]*)" marked as (passed|failed)$/,
  async function (this: PortalWorld, name: string, result: string) {
    if (name === this.feature) {
      const shown = result === "passed" ? "1 of 1 passed" : "0 of 1 passed";
      await rowOf(this, name).getByText(shown, { exact: true }).waitFor();
      return;
    }
    await markedAs(this, name, result);
  },
);

Then("I see {string} marked as not run", async function (this: PortalWorld, name: string) {
  await markedAs(this, name, "not run");
});

Then(
  "I see {string} marked as failed, counted as one scenario",
  async function (this: PortalWorld, name: string) {
    await markedAs(this, name, "failed");
    await rowOf(this, this.feature).getByText("0 of 1 passed", { exact: true }).waitFor();
  },
);

Then(
  "I see {string} with {int} of {int} passed",
  async function (this: PortalWorld, name: string, passed: number, of: number) {
    const shown = `${passed} of ${of} passed`;
    const isEpic = this.plan?.epics.some(({ title }) => title === name);
    const holder = isEpic ? epicOn(this.page(), name) : rowOf(this, name);
    await holder.getByText(shown, { exact: true }).first().waitFor();
  },
);

Then(
  "I see {int} of {int} passed for the whole of the default branch",
  async function (this: PortalWorld, passed: number, of: number) {
    const shown = `${passed} of ${of} passed`;
    await this.page().getByRole("banner").getByText(shown, { exact: true }).waitFor();
  },
);

Then("I see that the tests ran {int} hours ago", async function (this: PortalWorld, hours) {
  await this.page().getByText(`tests ran ${hours} hours ago`).waitFor();
});

Then("I see its results, said to be from an earlier commit", async function (this: PortalWorld) {
  await rowOf(this, this.feature).getByText("1 of 1 passed", { exact: true }).waitFor();
  await this.page().getByText("for an earlier commit").waitFor();
});

Then("I am told the default branch has no test run yet", async function (this: PortalWorld) {
  await this.page().getByText("The default branch has no test run yet").waitFor();
});
