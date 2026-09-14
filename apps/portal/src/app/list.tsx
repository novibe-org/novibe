import { Title } from "@mantine/core";
import type { Feature } from "../feature";
import classes from "./app.module.css";
import { Link } from "./link";
import { counted, cx, keyOf, scenariosIn, stemOf } from "./shown";

const titleOf = (feature: Feature) => (feature.broken ? feature.file : feature.title);

function byDomain(features: Feature[]): [string, Feature[]][] {
  const sorted = [...features].sort(
    (a, b) => a.domain.localeCompare(b.domain) || titleOf(a).localeCompare(titleOf(b)),
  );
  const domains = new Map<string, Feature[]>();
  for (const feature of sorted) {
    const listed = domains.get(feature.domain);
    if (listed) listed.push(feature);
    else domains.set(feature.domain, [feature]);
  }
  return [...domains];
}

function Listed({ feature, duplicates }: { feature: Feature; duplicates: ReadonlySet<string> }) {
  if (feature.broken) {
    return (
      <div className={classes.row}>
        <span className={classes.domain}>{feature.domain}</span>
        <span className={classes.id}>{feature.file}</span>
        <span className={classes.push}>
          <span className={cx(classes.pill, classes.fail)}>broken</span>
        </span>
      </div>
    );
  }
  return (
    <div className={classes.row}>
      <span className={classes.domain}>{feature.domain}</span>
      {feature.id ? (
        <span className={classes.id}>{feature.id}</span>
      ) : (
        <>
          <span className={classes.id}>{stemOf(feature.file)}</span>
          <span className={cx(classes.pill, classes.soft)}>no id</span>
        </>
      )}
      <Link
        to={`/?feature=${encodeURIComponent(keyOf(feature, duplicates))}`}
        className={classes.title}
      >
        {feature.title}
      </Link>
      <span className={classes.push}>
        {feature.backlog && <span className={cx(classes.pill, classes.later)}>backlog</span>}
        <span className={classes.count}>{counted(scenariosIn(feature.parts), "scenario")}</span>
      </span>
    </div>
  );
}

export function FeatureList({
  features,
  duplicates,
  picked,
}: {
  features: Feature[];
  duplicates: ReadonlySet<string>;
  picked?: string;
}) {
  return (
    <>
      {byDomain(features).map(([domain, listed]) => (
        <section key={domain} aria-label={domain} className={classes.panel}>
          <div className={classes.panelHead}>
            <Title order={2} className={classes.panelTitle}>
              {domain}
            </Title>
            <span className={classes.count}>{counted(listed.length, "feature")}</span>
          </div>
          <ul className={classes.rows}>
            {listed.map((feature) => (
              <li
                key={feature.path}
                className={cx(
                  classes.feature,
                  keyOf(feature, duplicates) === picked && classes.picked,
                )}
              >
                <Listed feature={feature} duplicates={duplicates} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
