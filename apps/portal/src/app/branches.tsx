import { Button, Menu } from "@mantine/core";
import type { Branches } from "../feature";
import classes from "./app.module.css";
import { addressOf, go } from "./link";

export function BranchMenu({ branches, shown }: { branches: Branches; shown: string }) {
  const item = (name: string) => {
    const to = addressOf({ branch: name === branches.main ? undefined : name });
    return (
      <Menu.Item
        key={name}
        component="a"
        href={to}
        onClick={(event) => go(event, to)}
        className={classes.branch}
      >
        {name}
      </Menu.Item>
    );
  };
  return (
    <Menu position="bottom-start">
      <Menu.Target>
        <Button
          size="compact-xs"
          variant="default"
          className={classes.branch}
          aria-label={`Branch ${shown}`}
        >
          {shown}
        </Button>
      </Menu.Target>
      <Menu.Dropdown className={classes.branches}>
        {item(branches.main)}
        {branches.others.length > 0 && <Menu.Divider role="separator" />}
        {branches.others.map(item)}
      </Menu.Dropdown>
    </Menu>
  );
}
