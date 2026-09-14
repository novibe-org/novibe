import { Code, Table, Title } from "@mantine/core";
import { type CSSProperties, Fragment, type ReactNode } from "react";
import type { Examples, Part, Readable, Row, Rule, Scenario, Step } from "../feature";
import classes from "./app.module.css";
import { cx, stemOf } from "./shown";

const BACKLOG_TAG = "@backlog";
const PLACEHOLDER = /(<[^<>]+>)/;

function WithPlaceholders({ text }: { text: string }) {
  let offset = 0;
  return text
    .split(PLACEHOLDER)
    .filter(Boolean)
    .map((piece) => {
      const at = offset;
      offset += piece.length;
      return PLACEHOLDER.test(piece) ? (
        <em key={at} className={classes.placeholder}>
          {piece}
        </em>
      ) : (
        <Fragment key={at}>{piece}</Fragment>
      );
    });
}

function Rows({ rows }: { rows: Row[] }) {
  const [head, ...body] = rows;
  if (!head) return null;
  return (
    <div className={cx(classes.tableScroll, classes.under)}>
      <Table className={classes.gherkin} withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            {head.cells.map(({ column, value }) => (
              <Table.Th key={column}>{value}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {body.map(({ id, cells }) => (
            <Table.Tr key={id}>
              {cells.map(({ column, value }) => (
                <Table.Td key={column}>{value}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}

function StepAsWritten({ step }: { step: Step }) {
  return (
    <>
      <div className={classes.step}>
        <span className={classes.kw}>{step.keyword.trim()}</span>{" "}
        <span className={classes.txt}>
          <WithPlaceholders text={step.text} />
        </span>
      </div>
      {step.docString !== undefined && (
        <div className={classes.under}>
          <Code block className={classes.doc}>
            {step.docString}
          </Code>
        </div>
      )}
      {step.dataTable && <Rows rows={step.dataTable} />}
    </>
  );
}

function ExamplesAsWritten({ examples }: { examples: Examples }) {
  return (
    <>
      <div className={classes.step}>
        <span className={cx(classes.kw, classes.exkw)}>{examples.keyword}:</span>{" "}
        <span className={cx(classes.txt, classes.exname)}>{examples.name}</span>
      </div>
      <Rows rows={examples.rows} />
    </>
  );
}

function ScenarioAsWritten({ scenario, order }: { scenario: Scenario; order: 3 | 4 }) {
  const own = scenario.tags.filter((tag) => tag !== BACKLOG_TAG);
  const keywordWidth = Math.max(
    0,
    ...scenario.steps.map(({ keyword }) => keyword.trim().length),
    ...scenario.examples.map(({ keyword }) => keyword.length + 1),
  );
  return (
    <section aria-label={scenario.name} className={classes.scenario}>
      <Title order={order} className={classes.shead}>
        {scenario.backlog && (
          <>
            <span className={classes.status}>backlog</span>{" "}
          </>
        )}
        <span className={classes.skeyword}>{scenario.keyword}:</span> <span>{scenario.name}</span>
        {own.map((tag) => (
          <Fragment key={tag}>
            {" "}
            <span className={classes.tag}>{tag}</span>
          </Fragment>
        ))}
      </Title>
      {scenario.description && <p className={classes.description}>{scenario.description}</p>}
      {keywordWidth > 0 && (
        <div className={classes.steps} style={{ "--kw": `${keywordWidth}ch` } as CSSProperties}>
          {scenario.steps.map((step) => (
            <StepAsWritten key={step.id} step={step} />
          ))}
          {scenario.examples.map((examples) => (
            <ExamplesAsWritten key={examples.id} examples={examples} />
          ))}
        </div>
      )}
    </section>
  );
}

function RuleAsWritten({ rule }: { rule: Rule }) {
  return (
    <section aria-label={rule.name} className={classes.rule}>
      <Title order={3} className={classes.rhead}>
        <span className={classes.skeyword}>{rule.keyword}:</span> <span>{rule.name}</span>
      </Title>
      {rule.description && <p className={classes.description}>{rule.description}</p>}
      <div className={classes.ruled}>
        <PartsAsWritten parts={rule.parts} scenarioOrder={4} />
      </div>
    </section>
  );
}

function PartsAsWritten({ parts, scenarioOrder }: { parts: Part[]; scenarioOrder: 3 | 4 }) {
  return (
    <>
      {parts.map((part) => {
        if ("rule" in part) return <RuleAsWritten key={part.rule.id} rule={part.rule} />;
        const scenario = "background" in part ? part.background : part.scenario;
        return <ScenarioAsWritten key={scenario.id} scenario={scenario} order={scenarioOrder} />;
      })}
    </>
  );
}

export function AsWritten({ feature, children }: { feature: Readable; children?: ReactNode }) {
  return (
    <article aria-label={feature.title}>
      <div className={classes.meta}>
        <div className={classes.fhead}>
          <Title order={2} className={classes.fid}>
            {feature.id ?? stemOf(feature.file)}
          </Title>
          <span className={classes.push}>
            {!feature.id && <span className={cx(classes.pill, classes.soft)}>no id</span>}
            {feature.backlog && <span className={cx(classes.pill, classes.later)}>backlog</span>}
          </span>
        </div>
        <p className={classes.sub}>{feature.title}</p>
        {feature.tags.length > 0 && (
          <p className={classes.tags}>
            {feature.tags.map((tag) => (
              <span key={tag} className={classes.tag}>
                {tag}
              </span>
            ))}
          </p>
        )}
        <p className={classes.where}>{feature.path}</p>
        {feature.narrative && <p className={classes.narrative}>{feature.narrative}</p>}
        {children}
      </div>
      <PartsAsWritten parts={feature.parts} scenarioOrder={3} />
    </article>
  );
}
