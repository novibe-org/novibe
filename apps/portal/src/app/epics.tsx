import { Button, Group, Menu, Modal, NativeSelect, Text, TextInput, Title } from "@mantine/core";
import { type FormEvent, useState } from "react";
import type { Feature, Readable } from "../feature";
import type { Change, Epic } from "../plan";
import classes from "./app.module.css";
import type { Over } from "./dragging";
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

function EpicMenu({
  epic,
  epics,
  change,
  rename,
  remove,
}: {
  epic: Epic;
  epics: Epic[];
  change: Changing;
  rename: () => void;
  remove: () => void;
}) {
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
        <Menu.Item onClick={rename}>Rename</Menu.Item>
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
        <Menu.Divider />
        <Menu.Item color="red" onClick={remove}>
          Remove
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

function Renaming({ epic, change, done }: { epic: Epic; change: Changing; done: () => void }) {
  const [title, setTitle] = useState(epic.title);
  const rename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await change({ change: "rename", epic: epic.id, title })) done();
  };
  return (
    <form className={classes.rename} onSubmit={rename}>
      <TextInput
        aria-label="New title"
        size="xs"
        className={classes.grow}
        value={title}
        onChange={(event) => setTitle(event.currentTarget.value)}
      />
      <Button type="submit" size="xs">
        Save
      </Button>
      <Button size="xs" variant="default" onClick={done}>
        Cancel
      </Button>
    </form>
  );
}

function Removing({
  epic,
  held,
  change,
  done,
}: {
  epic: Epic;
  held: number;
  change: Changing;
  done: () => void;
}) {
  const remove = () => {
    done();
    void change({ change: "remove", epic: epic.id });
  };
  return (
    <Modal opened onClose={done} title={`Remove the epic "${epic.title}"?`} size="sm">
      <Text size="sm">
        {held === 0
          ? "It holds no features."
          : `${counted(held, "feature")} in it will be in no epic.`}
      </Text>
      <Group justify="flex-end" mt="md">
        <Button size="xs" variant="default" onClick={done}>
          Cancel
        </Button>
        <Button size="xs" color="red" onClick={remove}>
          Remove
        </Button>
      </Group>
    </Modal>
  );
}

function EpicPanel({
  epic,
  epics,
  byId,
  gone,
  duplicates,
  picked,
  over,
  change,
}: {
  epic: Epic;
  epics: Epic[];
  byId: ReadonlyMap<string, Readable[]>;
  gone: ReadonlySet<string>;
  duplicates: ReadonlySet<string>;
  picked?: string;
  over?: Over;
  change: Changing;
}) {
  const [renaming, setRenaming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const held = epic.features.filter((id) => gone.has(id) || byId.has(id));
  const lineAt = (after: boolean) => (after ? classes.dropAfter : classes.dropBefore);
  const dropOn = (id: string) =>
    over?.moving === "feature" && over.feature === id ? lineAt(over.after) : undefined;
  return (
    <section
      aria-label={epic.title}
      data-epic={epic.id}
      className={cx(
        classes.panel,
        over?.moving === "epic" && lineAt(over.after),
        over?.moving === "feature" && over.feature === undefined && classes.dropInto,
      )}
    >
      <div
        className={cx(classes.panelHead, !renaming && classes.grab)}
        draggable={!renaming}
        data-epic-drag={renaming ? undefined : epic.id}
      >
        {renaming ? (
          <Renaming epic={epic} change={change} done={() => setRenaming(false)} />
        ) : (
          <>
            <Title order={2} className={classes.panelTitle}>
              {epic.title}
            </Title>
            <span className={classes.count}>{counted(held.length, "feature")}</span>
            <span className={classes.push}>
              <EpicMenu
                epic={epic}
                epics={epics}
                change={change}
                rename={() => setRenaming(true)}
                remove={() => setRemoving(true)}
              />
            </span>
          </>
        )}
      </div>
      {removing && (
        <Removing epic={epic} held={held.length} change={change} done={() => setRemoving(false)} />
      )}
      {held.length === 0 ? (
        <p className={classes.empty}>No features yet.</p>
      ) : (
        <ul className={classes.rows}>
          {held.map((id) =>
            gone.has(id) ? (
              <li key={id} className={cx(classes.feature, dropOn(id))} draggable data-feature={id}>
                <Gone id={id} />
              </li>
            ) : (
              <Rows
                key={id}
                features={byId.get(id) ?? []}
                duplicates={duplicates}
                picked={picked}
                drop={dropOn(id)}
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
  over,
  change,
}: {
  epics: Epic[];
  features: Feature[];
  gone: ReadonlySet<string>;
  duplicates: ReadonlySet<string>;
  picked?: string;
  refused?: string;
  over?: Over;
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
          over={over?.epic === epic.id ? over : undefined}
          change={change}
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
