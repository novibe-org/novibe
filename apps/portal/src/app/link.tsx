import { Anchor } from "@mantine/core";
import { createContext, type MouseEvent, type ReactNode, use } from "react";

export type Address = { branch?: string; feature?: string };

export const BranchInAddress = createContext<string | undefined>(undefined);

export function addressOf({ branch, feature }: Address): string {
  const asked = new URLSearchParams();
  if (branch) asked.set("branch", branch);
  if (feature) asked.set("feature", feature);
  const search = asked.toString();
  return search ? `/?${search}` : "/";
}

const segmentsOf = (path: string) => path.split("/").map(encodeURIComponent).join("/");

export const onGitHub = (repository: string, branch: string, path: string) =>
  `https://github.com/${repository}/blob/${segmentsOf(branch)}/${segmentsOf(path)}`;

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
  to: Omit<Address, "branch">;
  className?: string;
  children: ReactNode;
}) {
  const href = addressOf({ branch: use(BranchInAddress), ...to });
  return (
    <Anchor
      href={href}
      onClick={(event) => go(event, href)}
      className={className}
      underline="never"
    >
      {children}
    </Anchor>
  );
}
