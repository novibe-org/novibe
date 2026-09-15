import { Title } from "@mantine/core";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { Feature, Readable, Run } from "../feature";
import type { Change, Plan, Planned, Refused } from "../plan";
import classes from "./app.module.css";
import { BranchMenu } from "./branches";
import { useDragging } from "./dragging";
import { EpicOf, Epics } from "./epics";
import { type Address, Link } from "./link";
import { FeatureList } from "./list";
import { Passed } from "./progress";
import { AsWritten } from "./reading";
import { agoFrom, counted, duplicateIdsIn, keyOf, scenariosIn } from "./shown";

const NARROW = "(max-width: 900px)";

function addressNow(): Address {
  const asked = new URLSearchParams(window.location.search);
  return { branch: asked.get("branch") ?? undefined, feature: asked.get("feature") ?? undefined };
}

function useAddress(): Address {
  const [address, setAddress] = useState(addressNow);
  useEffect(() => {
    const moved = () => setAddress(addressNow());
    window.addEventListener("popstate", moved);
    return () => window.removeEventListener("popstate", moved);
  }, []);
  return address;
}

function usePlanned(branch: string | undefined) {
  const [answer, setAnswer] = useState<Planned | "failed">();
  const [refused, setRefused] = useState<string>();
  useEffect(() => {
    let shown = true;
    setAnswer(undefined);
    fetch(branch ? `/api/features?${new URLSearchParams({ branch })}` : "/api/features")
      .then(async (response) => {
        if (!response.ok) throw new Error(`features answered ${response.status}`);
        const planned = (await response.json()) as Planned;
        if (shown) setAnswer(planned);
      })
      .catch(() => {
        if (shown) setAnswer("failed");
      });
    return () => {
      shown = false;
    };
  }, [branch]);

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
  const { branch, feature: reading } = useAddress();
  const { answer, refused, change } = usePlanned(branch);
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
        {read && <BranchMenu branches={read.branches} shown={read.branch} />}
        {listed.length > 0 && <span className={classes.totals}>{totalsOf(listed)}</span>}
        <Passed
          parts={listed.flatMap((feature) => (feature.broken ? [] : feature.parts))}
          width={200}
        />
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
