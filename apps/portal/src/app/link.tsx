import { Anchor } from "@mantine/core";
import type { MouseEvent, ReactNode } from "react";

export function Link({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  const go = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    window.history.pushState(null, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  return (
    <Anchor href={to} onClick={go} className={className} underline="never">
      {children}
    </Anchor>
  );
}
