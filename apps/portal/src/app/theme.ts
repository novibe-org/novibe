import { createTheme, type MantineColorsTuple } from "@mantine/core";

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

export const theme = createTheme({
  primaryColor: "harbour",
  colors: { slate, harbour },
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSizes: { xs: "11px", sm: "13px", md: "14px", lg: "16px", xl: "20px" },
  spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px" },
  defaultRadius: "sm",
  radius: { xs: "2px", sm: "3px", md: "4px", lg: "6px", xl: "8px" },
});
