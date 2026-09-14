import { Anchor, Badge, Code, Container, Group, List, Stack, Text, Title } from "@mantine/core";
import { type MouseEvent, type ReactNode, useEffect, useState } from "react";
import type { Feature, Part, Readable, Scenario } from "../feature";

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
        setFeatures(((await response.json()) as { features: Feature[] }).features);
      })
      .catch(() => setFeatures("failed"));
  }, []);
  return features;
}

function Link({ to, children }: { to: string; children: ReactNode }) {
  const go = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.history.pushState(null, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  return (
    <Anchor href={to} onClick={go}>
      {children}
    </Anchor>
  );
}

const titleOf = (feature: Feature) => (feature.broken ? feature.file : feature.title);

function byDomain(features: Feature[]): [string, Feature[]][] {
  const sorted = [...features].sort(
    (a, b) => a.domain.localeCompare(b.domain) || titleOf(a).localeCompare(titleOf(b)),
  );
  const domains = new Map<string, Feature[]>();
  for (const feature of sorted) {
    domains.set(feature.domain, [...(domains.get(feature.domain) ?? []), feature]);
  }
  return [...domains];
}

function Marks({ feature }: { feature: Readable }) {
  return (
    <>
      {feature.id ? (
        <Code>{feature.id}</Code>
      ) : (
        <Badge color="slate" variant="light" tt="none">
          no id
        </Badge>
      )}
      {feature.backlog && (
        <Badge variant="light" tt="none">
          backlog
        </Badge>
      )}
    </>
  );
}

function Listed({ feature }: { feature: Feature }) {
  if (feature.broken) {
    return (
      <Group gap="xs">
        <Text>{feature.file}</Text>
        <Badge color="red" variant="light" tt="none">
          broken
        </Badge>
      </Group>
    );
  }
  return (
    <Group gap="xs">
      <Link to={`/?feature=${encodeURIComponent(feature.path)}`}>{feature.title}</Link>
      <Marks feature={feature} />
    </Group>
  );
}

function Features({ features }: { features: Feature[] }) {
  if (features.length === 0) return <Text>Main has no features yet.</Text>;
  return (
    <Stack gap="lg">
      {byDomain(features).map(([domain, listed]) => (
        <section key={domain} aria-label={domain}>
          <Title order={2} size="h4" mb="xs">
            {domain}
          </Title>
          <List listStyleType="none" spacing={4}>
            {listed.map((feature) => (
              <List.Item key={feature.path}>
                <Listed feature={feature} />
              </List.Item>
            ))}
          </List>
        </section>
      ))}
    </Stack>
  );
}

function ScenarioAsWritten({ scenario }: { scenario: Scenario }) {
  return (
    <section aria-label={scenario.name}>
      <Group gap="xs">
        <Title order={4} size="h5">
          {scenario.keyword}: {scenario.name}
        </Title>
        {scenario.backlog && (
          <Badge variant="light" tt="none">
            backlog
          </Badge>
        )}
      </Group>
      <List listStyleType="none" spacing={2} pl="md">
        {scenario.steps.map((step) => (
          <List.Item key={step.id}>
            {step.keyword}
            {step.text}
          </List.Item>
        ))}
      </List>
    </section>
  );
}

function PartsAsWritten({ parts }: { parts: Part[] }) {
  return (
    <Stack gap="md">
      {parts.map((part) =>
        "rule" in part ? (
          <section key={part.rule.id} aria-label={part.rule.name}>
            <Title order={3} size="h4" mb="sm">
              {part.rule.keyword}: {part.rule.name}
            </Title>
            <Stack pl="md">
              <PartsAsWritten parts={part.rule.parts} />
            </Stack>
          </section>
        ) : (
          <ScenarioAsWritten key={part.scenario.id} scenario={part.scenario} />
        ),
      )}
    </Stack>
  );
}

function AsWritten({ feature }: { feature: Readable }) {
  return (
    <article aria-label={feature.title}>
      <Stack gap="md">
        <Group gap="xs">
          <Title order={2} size="h3">
            {feature.title}
          </Title>
          <Marks feature={feature} />
        </Group>
        <Text size="sm" c="dimmed">
          {feature.path}
        </Text>
        <Text style={{ whiteSpace: "pre-wrap" }}>{feature.narrative}</Text>
        <PartsAsWritten parts={feature.parts} />
      </Stack>
    </article>
  );
}

function Shown({ features, reading }: { features: Feature[]; reading?: string }) {
  const read = features.find(
    (feature): feature is Readable => !feature.broken && feature.path === reading,
  );
  return read ? <AsWritten feature={read} /> : <Features features={features} />;
}

export function App() {
  const features = useFeatures();
  const reading = useReading();
  return (
    <Container size="md" py="md">
      <Title order={1} size="h3" mb="md">
        <Link to="/">Features on main</Link>
      </Title>
      {features === "failed" && <Text>The portal could not read main.</Text>}
      {Array.isArray(features) && <Shown features={features} reading={reading} />}
    </Container>
  );
}
