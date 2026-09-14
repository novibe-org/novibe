import { Button, Menu, NativeSelect, TextInput, Title } from "@mantine/core";
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

function EpicMenu({ epic, epics, change }: { epic: Epic; epics: Epic[]; change: Changing }) {
  const at = epics.findIndex((other) => other.id === epic.id);
  const before = epics.filter((_, index) => index !== at && index !== at + 1);
  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <Button size="compact-xs" variant="subtle" color="gray">
          Change
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {before.map((other) => (
          <Menu.Item
            key={other.id}
            onClick={() => void change({ change: "move epic", epic: epic.id, before: other.id })}
          >
            Move before {other.title}
          </Menu.Item>
        ))}
        {at < epics.length - 1 && (
          <Menu.Item onClick={() => void change({ change: "move epic", epic: epic.id })}>
            Move to the end
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

function EpicPanel({
  epic,
  epics,
  byId,
  gone,
  duplicates,
  picked,
  change,
}: {
  epic: Epic;
  epics: Epic[];
  byId: ReadonlyMap<string, Readable[]>;
  gone: ReadonlySet<string>;
  duplicates: ReadonlySet<string>;
  picked?: string;
  change: Changing;
}) {
  const held = epic.features.filter((id) => gone.has(id) || byId.has(id));
  return (
    <section aria-label={epic.title} className={classes.panel}>
      <div className={classes.panelHead}>
        <Title order={2} className={classes.panelTitle}>
          {epic.title}
        </Title>
        <span className={classes.count}>{counted(held.length, "feature")}</span>
        <span className={classes.push}>
          <EpicMenu epic={epic} epics={epics} change={change} />
        </span>
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
          epics={epics}
          byId={byId}
          gone={gone}
          duplicates={duplicates}
          picked={picked}
          change={change}
        />
      ))}
    </fieldset>
  );
}

function PlaceIn({
  epic,
  feature,
  features,
  change,
}: {
  epic: Epic;
  feature: string;
  features: Feature[];
  change: Changing;
}) {
  const titleOf = (id: string) =>
    features.find((listed): listed is Readable => !listed.broken && listed.id === id)?.title ?? id;
  const next = epic.features[epic.features.indexOf(feature) + 1];
  return (
    <NativeSelect
      label="Place"
      size="xs"
      className={classes.epicOf}
      value={next ?? ""}
      onChange={(event) =>
        void change({
          change: "move feature",
          feature,
          before: event.currentTarget.value || undefined,
        })
      }
      data={[
        ...epic.features
          .filter((other) => other !== feature)
          .map((other) => ({ value: other, label: `before ${titleOf(other)}` })),
        { value: "", label: "at the end" },
      ]}
    />
  );
}

export function EpicOf({
  feature,
  epics,
  features,
  change,
}: {
  feature: Readable;
  epics: Epic[];
  features: Feature[];
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
    <>
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
      {id && holder && <PlaceIn epic={holder} feature={id} features={features} change={change} />}
    </>
  );
}
