import { type CSSVariablesResolver, createTheme, type MantineColorsTuple } from "@mantine/core";

const slate: MantineColorsTuple = [
  "#f5f7fa",
  "#eceff3",
  "#e0e5eb",
  "#cdd4dd",
  "#b5bfcb",
  "#97a3b2",
  "#7a8797",
  "#616d7d",
  "#4a5462",
  "#333b46",
];

const harbour: MantineColorsTuple = [
  "#eaf1f8",
  "#d0e0ef",
  "#a9c6e2",
  "#80aad4",
  "#5a8fc5",
  "#3f78b4",
  "#326397",
  "#28507a",
  "#1f3e5f",
  "#162d45",
];

const night: MantineColorsTuple = [
  "#e2e6ec",
  "#bcc3cd",
  "#9aa3b0",
  "#7b8593",
  "#565f6c",
  "#3a414b",
  "#2b3139",
  "#1e2228",
  "#171a1f",
  "#111317",
];

export const theme = createTheme({
  primaryColor: "harbour",
  colors: { slate, harbour, dark: night },
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontSizes: { xs: "11px", sm: "12.5px", md: "14px", lg: "15px", xl: "18px" },
  lineHeights: { xs: "1.4", sm: "1.45", md: "1.5", lg: "1.5", xl: "1.5" },
  spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px" },
  defaultRadius: "sm",
  radius: { xs: "3px", sm: "6px", md: "9px", lg: "12px", xl: "16px" },
});

export const portalVariables: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-body": "#f8f9fb",
    "--mantine-color-text": "#1a1d23",
    "--pt-ink": "#1a1d23",
    "--pt-dim": slate[7],
    "--pt-line": "#e1e5ea",
    "--pt-ground": "#f8f9fb",
    "--pt-panel": "#ffffff",
    "--pt-card": "#f3f5f8",
    "--pt-syntax": harbour[6],
    "--pt-soft": "#a3650f",
    "--pt-pass": "#2e7d32",
    "--pt-fail": "#b3261e",
    "--pt-idle": slate[5],
    "--pt-future": slate[3],
  },
  dark: {
    "--mantine-color-body": night[9],
    "--mantine-color-text": night[0],
    "--pt-ink": night[0],
    "--pt-dim": night[2],
    "--pt-line": night[6],
    "--pt-ground": night[9],
    "--pt-panel": night[8],
    "--pt-card": night[7],
    "--pt-syntax": harbour[3],
    "--pt-soft": "#d99a3c",
    "--pt-pass": "#74c17a",
    "--pt-fail": "#e5736b",
    "--pt-idle": night[3],
    "--pt-future": night[5],
  },
});
