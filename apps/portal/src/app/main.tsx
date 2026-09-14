import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { theme } from "./theme";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>,
  );
}
