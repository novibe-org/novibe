import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { portalVariables, theme } from "./theme";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <MantineProvider theme={theme} cssVariablesResolver={portalVariables} defaultColorScheme="auto">
      <App />
    </MantineProvider>,
  );
}
