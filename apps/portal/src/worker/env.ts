export interface Env {
  GITHUB_API_URL: string;
  REPOSITORY: string;
  MAIN: string;
  WORKFLOW: string;
  GITHUB_TOKEN?: string;
  PLAN: D1Database;
}
