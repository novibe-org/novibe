import { Title } from "@mantine/core";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { Feature, Features, Readable } from "../feature";
import classes from "./app.module.css";
import { Link } from "./link";
import { FeatureList } from "./list";
import { AsWritten } from "./reading";
import { counted, scenariosIn } from "./shown";

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

function useFeatures(): Features | "failed" | undefined {
  const [answer, setAnswer] = useState<Features | "failed">();
  useEffect(() => {
    fetch("/api/features")
      .then(async (response) => {
        if (!response.ok) throw new Error(`features answered ${response.status}`);
        setAnswer((await response.json()) as Features);
      })
      .catch(() => setAnswer("failed"));
  }, []);
  return answer;
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

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className={classes.column}>
      <div className={classes.panel}>
        <p className={classes.empty}>{children}</p>
      </div>
    </div>
  );
}

export function App() {
  const answer = useFeatures();
  const reading = useReading();
  const pane = useRef<HTMLElement>(null);
  const read = answer === "failed" ? undefined : answer;
  const listed = read?.features ?? [];
  const reader = listed.find(
    (feature): feature is Readable => !feature.broken && feature.path === reading,
  );

  useEffect(() => {
    if (!reading) return;
    pane.current?.scrollTo({ top: 0 });
    if (window.matchMedia(NARROW).matches) pane.current?.scrollIntoView({ block: "start" });
  }, [reading]);

  return (
    <>
      <header className={classes.bar}>
        <Title order={1} className={classes.brand}>
          <Link to="/">portal</Link>
        </Title>
        {read && <span className={classes.tag}>{read.ref}</span>}
        {listed.length > 0 && <span className={classes.totals}>{totalsOf(listed)}</span>}
      </header>
      <main className={classes.layout}>
        {answer === "failed" && <Notice>The portal could not read main.</Notice>}
        {read && listed.length === 0 && <Notice>Main has no features yet.</Notice>}
        {listed.length > 0 && (
          <>
            <div className={classes.column}>
              <FeatureList features={listed} picked={reader?.path} />
            </div>
            <aside ref={pane} className={classes.detail}>
              {reader ? (
                <AsWritten feature={reader} />
              ) : (
                <p className={classes.empty}>Pick a feature to read it.</p>
              )}
            </aside>
          </>
        )}
      </main>
    </>
  );
}
