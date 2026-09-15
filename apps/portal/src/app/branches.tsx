import { Button, Menu } from "@mantine/core";
import classes from "./app.module.css";

export function BranchMenu({ shown }: { shown: string }) {
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
      <Menu.Dropdown>
        <Menu.Item className={classes.branch}>{shown}</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
