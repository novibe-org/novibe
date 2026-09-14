import { Title } from "@mantine/core";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { Feature, Readable, Run } from "../feature";
import type { Change, Plan, Planned, Refused } from "../plan";
import classes from "./app.module.css";
import { useDragging } from "./dragging";
import { EpicOf, Epics } from "./epics";
import { Link } from "./link";
import { FeatureList } from "./list";
import { AsWritten } from "./reading";
import { agoFrom, counted, duplicateIdsIn, keyOf, scenariosIn } from "./shown";

const NARROW = "(max-width: 900px)";

const readingNow = () => new URLSearchParams(window.location.search).get("feature") ?? undefined;

function useReading(): string | undefined {
  const [path, setPath] = useState(readingNow);
  useEffect(() => {
    const moved = () => setPath(readingNow());
    window.addEventListener("popstate", moved);
    return () => window.removeEventListener("popstate", moved);
  }, []);
  return path;
}

function usePlanned() {
  const [answer, setAnswer] = useState<Planned | "failed">();
  const [refused, setRefused] = useState<string>();
  useEffect(() => {
    fetch("/api/features")
      .then(async (response) => {
        if (!response.ok) throw new Error(`features answered ${response.status}`);
        setAnswer((await response.json()) as Planned);
      })
      .catch(() => setAnswer("failed"));
  }, []);

  const lastChange = useRef<Promise<boolean>>(Promise.resolve(true));

  const send = async (change: Change): Promise<boolean> => {
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(change),
      });
      const answered = (await response.json()) as Plan | Refused;
      if ("refused" in answered) {
        setRefused(answered.refused);
        return false;
      }
      setRefused(undefined);
      setAnswer((current) =>
        current && current !== "failed" ? { ...current, epics: answered.epics } : current,
      );
      return true;
    } catch {
      setRefused("the portal could not change the plan");
      return false;
    }
  };

  const change = (change: Change): Promise<boolean> => {
    lastChange.current = lastChange.current.then(() => send(change));
    return lastChange.current;
  };

  return { answer, refused, change };
}

function totalsOf(features: Feature[]): string {
  const readable = features.filter((feature): feature is Readable => !feature.broken);
  const broken = features.length - readable.length;
  const scenarios = readable.reduce((count, feature) => count + scenariosIn(feature.parts), 0);
  return [
    counted(readable.length, "feature"),
    counted(scenarios, "scenario"),
    ...(broken ? [`${broken} broken`] : []),
  ].join(" · ");
}

function testsOf(run: Run | null): string {
  if (!run) return "Main has no test run yet";
  return `Tests ran ${agoFrom(run.finished)}${run.earlier ? ", for an earlier main" : ""}`;
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className={classes.panel}>
      <p className={classes.empty}>{children}</p>
    </div>
  );
}

export function App() {
  const { answer, refused, change } = usePlanned();
  const reading = useReading();
  const pane = useRef<HTMLElement>(null);
  const read = answer === "failed" ? undefined : answer;
  const listed = read?.features ?? [];
  const epics = read?.epics ?? [];
  const { over, dragging } = useDragging(epics, change);
  const inAnEpic = new Set(epics.flatMap((epic) => epic.features));
  const rest = listed.filter(
    (feature) => feature.broken || !feature.id || !inAnEpic.has(feature.id),
  );
  const duplicates = duplicateIdsIn(listed);
  const reader = listed.find(
    (feature): feature is Readable => !feature.broken && keyOf(feature, duplicates) === reading,
  );

  const readerKey = reader && keyOf(reader, duplicates);
  useEffect(() => {
    if (!readerKey) return;
    pane.current?.scrollTo({ top: 0 });
    if (window.matchMedia(NARROW).matches) pane.current?.scrollIntoView({ block: "start" });
  }, [readerKey]);

  return (
    <>
      <header className={classes.bar}>
        <Title order={1} className={classes.brand}>
          <Link to="/">portal</Link>
        </Title>
        {read && <span className={classes.tag}>{read.ref}</span>}
        {listed.length > 0 && <span className={classes.totals}>{totalsOf(listed)}</span>}
        {read && <span className={classes.totals}>{testsOf(read.run)}</span>}
      </header>
      <main className={classes.layout} {...dragging}>
        {answer === "failed" && (
          <div className={classes.column}>
            <Notice>The portal could not read main.</Notice>
          </div>
        )}
        {read && (
          <>
            <div className={classes.column}>
              <Epics
                epics={epics}
                features={listed}
                gone={new Set(read.gone)}
                duplicates={duplicates}
                picked={readerKey}
                refused={refused}
                over={over}
                change={change}
              />
              <fieldset aria-label="not in any epic" className={classes.group} data-unassigned>
                {epics.length > 0 && <p className={classes.groupTitle}>Not in any epic</p>}
                {listed.length === 0 ? (
                  <Notice>Main has no features yet.</Notice>
                ) : (
                  <FeatureList
                    features={rest}
                    duplicates={duplicates}
                    picked={readerKey}
                    drop={
                      over?.moving === "feature" && over.epic === undefined
                        ? classes.dropInto
                        : undefined
                    }
                  />
                )}
              </fieldset>
            </div>
            {listed.length > 0 && (
              <aside ref={pane} className={classes.detail}>
                {reader ? (
                  <AsWritten feature={reader}>
                    <EpicOf feature={reader} epics={epics} change={change} />
                  </AsWritten>
                ) : (
                  <p className={classes.empty}>Pick a feature to read it.</p>
                )}
              </aside>
            )}
          </>
        )}
      </main>
    </>
  );
}
