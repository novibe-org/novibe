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

function mainHoldsFeature(world: PortalWorld, title: string, body: string[]): string {
  world.feature = title;
  world.featurePath = `features/payments/${slug(title)}.feature`;
  world.holds(world.featurePath, featureFile({ title, body }));
  return world.featurePath;
}

function mainHoldsProved(
  world: PortalWorld,
  title: string,
  verdicts: (Verdict | undefined)[],
  tags: string[][] = [],
) {
  const names = verdicts.map((_, at) => `${title}, scenario ${at + 1}`);
  const body = names.flatMap((name, at) => scenario(name, tags[at]));
  const path = mainHoldsFeature(world, title, body);
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
  /^main's latest test run (passed|failed) the scenario "([^"]*)"$/,
  function (this: PortalWorld, verdict: Verdict, name: string) {
    this.proved(mainHoldsFeature(this, FEATURE, scenario(name)), name, verdict);
  },
);

Given(
  "main's latest test run did not run the scenario {string}",
  function (this: PortalWorld, name: string) {
    mainHoldsFeature(this, FEATURE, scenario(name));
    this.testRun();
  },
);

Given(
  "the scenario {string} is tagged {string}",
  function (this: PortalWorld, name: string, tag: string) {
    mainHoldsFeature(this, FEATURE, scenario(name, [tag]));
    this.scenario = name;
  },
);

Given("main's latest test run passed it", function (this: PortalWorld) {
  this.proved(this.featurePath, this.scenario, "passed");
});

Given(
  "main's latest test run passed the outline {string} for {string} and failed it for {string}",
  function (this: PortalWorld, outline: string, passing: string, failing: string) {
    const [placeholder = ""] = /<[^<>]+>/.exec(outline) ?? [];
    const path = mainHoldsFeature(this, FEATURE, [
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
  "main's latest test run passed {int} and failed {int} of the {int} scenarios of {string}",
  function (this: PortalWorld, passed: number, failed: number, of: number, title: string) {
    const verdicts = [
      ...times<Verdict>(passed, "passed"),
      ...times<Verdict>(failed, "failed"),
      ...times(of - passed - failed, undefined),
    ];
    mainHoldsProved(this, title, verdicts);
  },
);

Given(
  "{string} has {int} scenarios the latest run passed and {int} tagged {string} it did not run",
  function (this: PortalWorld, title: string, passed: number, tagged: number, tag: string) {
    const verdicts = [...times<Verdict>(passed, "passed"), ...times(tagged, undefined)];
    mainHoldsProved(this, title, verdicts, [...times(passed, []), ...times(tagged, [tag])]);
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
    mainHoldsProved(this, first, passedAndFailed(firstPassed, firstOf));
    mainHoldsProved(this, second, passedAndFailed(secondPassed, secondOf));
    await epicHolding(this, epic, slug(first), slug(second));
  },
);

Given(
  "main's latest test run finished {int} hours ago",
  function (this: PortalWorld, hours: number) {
    this.testRun().finished = new Date(Date.now() - hours * 3_600_000);
  },
);

Given(
  "main's latest test run ran for an earlier commit than the main shown",
  function (this: PortalWorld) {
    const name = "Paying with a saved card";
    this.proved(mainHoldsFeature(this, FEATURE, scenario(name)), name, "passed");
    this.ranForAnEarlierMain();
  },
);

Given("main has never had a test run", () => {});

When("I read its feature", async function (this: PortalWorld) {
  await this.open();
  await this.page().getByRole("link", { name: this.feature, exact: true }).click();
});

Then(
  /^I see "([^"]*)" marked as (passed|failed)$/,
  async function (this: PortalWorld, name: string, result: string) {
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

Then("I see that the tests ran {int} hours ago", async function (this: PortalWorld, hours) {
  await this.page().getByText(`tests ran ${hours} hours ago`).waitFor();
});

Then("I see its results, said to be from an earlier main", async function (this: PortalWorld) {
  await rowOf(this, this.feature).getByText("1 of 1 passed", { exact: true }).waitFor();
  await this.page().getByText("for an earlier main").waitFor();
});

Then("I am told main has no test run yet", async function (this: PortalWorld) {
  await this.page().getByText("main has no test run yet").waitFor();
});
