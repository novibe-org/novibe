import { Button, NativeSelect, TextInput, Title } from "@mantine/core";
import { type FormEvent, useState } from "react";
import type { Feature, Readable } from "../feature";
import type { Change, Epic } from "../plan";
import classes from "./app.module.css";
import { Rows } from "./list";
import { counted, cx } from "./shown";

export type Changing = (change: Change) => Promise<boolean>;

function Gone({ id }: { id: string }) {
  return (
    <div className={classes.row}>
      <span className={classes.id}>{id}</span>
      <span className={classes.push}>
        <span className={cx(classes.pill, classes.fail)}>no longer on main</span>
      </span>
    </div>
  );
}

function EpicPanel({
  epic,
  byId,
  gone,
  duplicates,
  picked,
}: {
  epic: Epic;
  byId: ReadonlyMap<string, Readable[]>;
  gone: ReadonlySet<string>;
  duplicates: ReadonlySet<string>;
  picked?: string;
}) {
  const held = epic.features.filter((id) => gone.has(id) || byId.has(id));
  return (
    <section aria-label={epic.title} className={classes.panel}>
      <div className={classes.panelHead}>
        <Title order={2} className={classes.panelTitle}>
          {epic.title}
        </Title>
        <span className={classes.count}>{counted(held.length, "feature")}</span>
      </div>
      {held.length === 0 ? (
        <p className={classes.empty}>No features yet.</p>
      ) : (
        <ul className={classes.rows}>
          {held.map((id) =>
            gone.has(id) ? (
              <li key={id} className={classes.feature}>
                <Gone id={id} />
              </li>
            ) : (
              <Rows
                key={id}
                features={byId.get(id) ?? []}
                duplicates={duplicates}
                picked={picked}
              />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

export function Epics({
  epics,
  features,
  gone,
  duplicates,
  picked,
  refused,
  change,
}: {
  epics: Epic[];
  features: Feature[];
  gone: ReadonlySet<string>;
  duplicates: ReadonlySet<string>;
  picked?: string;
  refused?: string;
  change: Changing;
}) {
  const [title, setTitle] = useState("");
  const byId = new Map<string, Readable[]>();
  for (const feature of features) {
    if (!feature.broken && feature.id) {
      byId.set(feature.id, [...(byId.get(feature.id) ?? []), feature]);
    }
  }
  const start = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await change({ change: "start", title })) setTitle("");
  };
  return (
    <fieldset aria-label="epics" className={classes.group}>
      <form className={classes.start} onSubmit={start}>
        <TextInput
          aria-label="Epic title"
          placeholder="The title of a new epic"
          size="xs"
          className={classes.grow}
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
        <Button type="submit" size="xs" variant="default">
          Start epic
        </Button>
      </form>
      {refused && (
        <p role="alert" className={cx(classes.refused, classes.fail)}>
          Refused: {refused}
        </p>
      )}
      {epics.map((epic) => (
        <EpicPanel
          key={epic.id}
          epic={epic}
          byId={byId}
          gone={gone}
          duplicates={duplicates}
          picked={picked}
        />
      ))}
    </fieldset>
  );
}

export function EpicOf({
  feature,
  epics,
  change,
}: {
  feature: Readable;
  epics: Epic[];
  change: Changing;
}) {
  const { id } = feature;
  const holder = id ? epics.find((epic) => epic.features.includes(id)) : undefined;
  const move = (to: string) => {
    if (!id) return;
    void change(
      to ? { change: "pick", feature: id, epic: Number(to) } : { change: "take out", feature: id },
    );
  };
  return (
    <NativeSelect
      label="Epic"
      size="xs"
      className={classes.epicOf}
      disabled={!id}
      description={id ? undefined : "Only a feature with an id can be picked into an epic."}
      value={holder ? String(holder.id) : ""}
      onChange={(event) => move(event.currentTarget.value)}
      data={[
        { value: "", label: "not in any epic" },
        ...epics.map((epic) => ({ value: String(epic.id), label: epic.title })),
      ]}
    />
  );
}
