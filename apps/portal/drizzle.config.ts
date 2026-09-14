import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/worker/tables.ts",
  out: "./migrations",
});
