import { Anchor } from "@mantine/core";
import type { MouseEvent, ReactNode } from "react";

export type Address = { branch?: string; feature?: string };

export function addressOf({ branch, feature }: Address): string {
  const asked = new URLSearchParams();
  if (branch) asked.set("branch", branch);
  if (feature) asked.set("feature", feature);
  const search = asked.toString();
  return search ? `/?${search}` : "/";
}

export function go(event: MouseEvent<HTMLAnchorElement>, to: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  window.history.pushState(null, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function Link({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Anchor href={to} onClick={(event) => go(event, to)} className={className} underline="never">
      {children}
    </Anchor>
  );
}
