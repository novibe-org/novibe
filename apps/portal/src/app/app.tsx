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

function useFeatures(): Feature[] | "failed" | undefined {
  const [features, setFeatures] = useState<Feature[] | "failed">();
  useEffect(() => {
    fetch("/api/features")
      .then(async (response) => {
        if (!response.ok) throw new Error(`features answered ${response.status}`);
        setFeatures(((await response.json()) as Features).features);
      })
      .catch(() => setFeatures("failed"));
  }, []);
  return features;
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
  const features = useFeatures();
  const reading = useReading();
  const pane = useRef<HTMLElement>(null);
  const listed = Array.isArray(features) ? features : [];
  const read = listed.find(
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
        <span className={classes.tag}>main</span>
        {listed.length > 0 && <span className={classes.totals}>{totalsOf(listed)}</span>}
      </header>
      <main className={classes.layout}>
        {features === "failed" && <Notice>The portal could not read main.</Notice>}
        {Array.isArray(features) && features.length === 0 && (
          <Notice>Main has no features yet.</Notice>
        )}
        {listed.length > 0 && (
          <>
            <div className={classes.column}>
              <FeatureList features={listed} picked={read?.path} />
            </div>
            <aside ref={pane} className={classes.detail}>
              {read ? (
                <AsWritten feature={read} />
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
