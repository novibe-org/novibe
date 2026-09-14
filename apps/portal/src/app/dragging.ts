import { type DragEvent, useRef, useState } from "react";
import type { Change, Epic } from "../plan";
import type { Changing } from "./epics";
import { droppedBefore } from "./shown";

type Dragged = { kind: "epic"; epic: number } | { kind: "feature"; feature: string; from?: number };

export type Over = { moving: "epic" | "feature"; epic?: number; feature?: string; after: boolean };

const elementOf = (event: DragEvent) =>
  event.target instanceof Element ? event.target : undefined;

const pastMiddle = (event: DragEvent, element: Element) => {
  const box = element.getBoundingClientRect();
  return event.clientY > box.top + box.height / 2;
};

function draggedFrom(event: DragEvent): Dragged | undefined {
  const element = elementOf(event);
  const feature = element?.closest<HTMLElement>("[data-feature]")?.dataset.feature;
  const holder = element?.closest<HTMLElement>("[data-epic]")?.dataset.epic;
  if (feature) {
    return { kind: "feature", feature, from: holder === undefined ? undefined : Number(holder) };
  }
  const head = element?.closest<HTMLElement>("[data-epic-drag]")?.dataset.epicDrag;
  return head === undefined ? undefined : { kind: "epic", epic: Number(head) };
}

function overAt(event: DragEvent, from: Dragged): Over | undefined {
  const element = elementOf(event);
  const section = element?.closest<HTMLElement>("[data-epic]");
  if (from.kind === "epic") {
    if (!section) return undefined;
    return {
      moving: "epic",
      epic: Number(section.dataset.epic),
      after: pastMiddle(event, section),
    };
  }
  if (!section) {
    const out = from.from !== undefined && element?.closest("[data-unassigned]");
    return out ? { moving: "feature", after: false } : undefined;
  }
  const epic = Number(section.dataset.epic);
  const row = element?.closest<HTMLElement>("[data-feature]");
  if (!row) return { moving: "feature", epic, after: true };
  return { moving: "feature", epic, feature: row.dataset.feature, after: pastMiddle(event, row) };
}

function changeFor(from: Dragged, place: Over, epics: Epic[]): Change | undefined {
  if (from.kind === "epic") {
    if (place.epic === undefined) return undefined;
    const order = epics.map(({ id }) => id);
    const move = droppedBefore(order, from.epic, place.epic, place.after);
    return move && { change: "move epic", epic: from.epic, ...move };
  }
  if (place.epic === undefined) {
    return from.from === undefined ? undefined : { change: "take out", feature: from.feature };
  }
  const order = epics.find(({ id }) => id === place.epic)?.features ?? [];
  if (place.epic === from.from) {
    const move = droppedBefore(order, from.feature, place.feature, place.after);
    return move && { change: "move feature", feature: from.feature, ...move };
  }
  const at =
    place.feature === undefined
      ? order.length
      : order.indexOf(place.feature) + (place.after ? 1 : 0);
  return { change: "pick", feature: from.feature, epic: place.epic, before: order[at] };
}

export function useDragging(epics: Epic[], change: Changing) {
  const dragged = useRef<Dragged>(undefined);
  const [over, setOver] = useState<Over>();

  const onDragStart = (event: DragEvent) => {
    const from = draggedFrom(event);
    dragged.current = from;
    if (!from) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "text/plain",
      from.kind === "epic" ? String(from.epic) : from.feature,
    );
  };

  const onDragOver = (event: DragEvent) => {
    const place = dragged.current && overAt(event, dragged.current);
    if (!place) {
      setOver(undefined);
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOver((now) =>
      now?.moving === place.moving &&
      now.epic === place.epic &&
      now.feature === place.feature &&
      now.after === place.after
        ? now
        : place,
    );
  };

  const onDragEnd = () => {
    dragged.current = undefined;
    setOver(undefined);
  };

  const onDrop = (event: DragEvent) => {
    const from = dragged.current;
    const place = from && overAt(event, from);
    onDragEnd();
    if (!from || !place) return;
    event.preventDefault();
    const dropped = changeFor(from, place, epics);
    if (dropped) void change(dropped);
  };

  return { over, dragging: { onDragStart, onDragOver, onDrop, onDragEnd } };
}
