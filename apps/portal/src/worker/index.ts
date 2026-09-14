import type { Env } from "./env";
import { featureFilesOnMain } from "./github";
import { parsed } from "./parse";

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== "/api/features") {
      return new Response("not found", { status: 404 });
    }
    try {
      const files = await featureFilesOnMain(env);
      return Response.json({ features: files.map(({ path, text }) => parsed(path, text)) });
    } catch (failure) {
      console.error(failure);
      return Response.json({ error: "could not read main" }, { status: 502 });
    }
  },
} satisfies ExportedHandler<Env>;
