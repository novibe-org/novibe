import type { Feature } from "../feature";
import classes from "./app.module.css";
import { Link } from "./link";
import { counted, cx, keyOf, scenariosIn, stemOf } from "./shown";

const titleOf = (feature: Feature) => (feature.broken ? feature.file : feature.title);

const byDomainThenTitle = (a: Feature, b: Feature) =>
  a.domain.localeCompare(b.domain) || titleOf(a).localeCompare(titleOf(b));

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

type Listing = { features: Feature[]; duplicates: ReadonlySet<string>; picked?: string };

export function Rows({ features, duplicates, picked, drop }: Listing & { drop?: string }) {
  return features.map((feature) => {
    const id = feature.broken ? undefined : feature.id;
    return (
      <li
        key={feature.path}
        className={cx(
          classes.feature,
          keyOf(feature, duplicates) === picked && classes.picked,
          drop,
        )}
        draggable={Boolean(id)}
        data-feature={id || undefined}
      >
        <Listed feature={feature} duplicates={duplicates} />
      </li>
    );
  });
}

export function FeatureList({ features, duplicates, picked, drop }: Listing & { drop?: string }) {
  const sorted = [...features].sort(byDomainThenTitle);
  return (
    <div className={cx(classes.panel, drop)}>
      {sorted.length === 0 ? (
        <p className={classes.empty}>Every feature is in an epic.</p>
      ) : (
        <ul className={classes.rows}>
          <Rows features={sorted} duplicates={duplicates} picked={picked} />
        </ul>
      )}
    </div>
  );
}
