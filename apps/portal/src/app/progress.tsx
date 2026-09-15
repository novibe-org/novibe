import type { ReactNode } from "react";
import type { Part } from "../feature";
import classes from "./app.module.css";
import { STATES, tallyOf } from "./shown";

const COLOURED = {
  passed: classes.passed,
  failed: classes.failed,
  "not run": classes.notRun,
  backlog: classes.backlog,
};

export function Passed({
  parts,
  width,
  otherwise = null,
}: {
  parts: Part[];
  width: number;
  otherwise?: ReactNode;
}) {
  const tally = tallyOf(parts);
  if (!tally) return otherwise;
  const total = STATES.reduce((sum, state) => sum + tally[state], 0);
  const present = STATES.filter((state) => tally[state] > 0);
  return (
    <span className={classes.passedOf}>
      <span className={classes.count}>{`${tally.passed} of ${total} passed`}</span>
      <span
        className={classes.progress}
        style={{ width }}
        title={present.map((state) => `${tally[state]} ${state}`).join(" · ")}
        aria-hidden
      >
        {present.map((state) => (
          <i
            key={state}
            className={COLOURED[state]}
            style={{ width: `${(tally[state] / total) * 100}%` }}
          />
        ))}
      </span>
    </span>
  );
}
