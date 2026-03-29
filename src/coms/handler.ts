import { getGeminiOpsNote, getOverview } from "./adapters";
import type { Env } from "./types";
import { renderComsPage } from "./ui";

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json;charset=UTF-8" },
  });

export async function handleComs(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");

  if (path === "/coms") {
    return new Response(renderComsPage(), { headers: { "content-type": "text/html;charset=UTF-8" } });
  }

  if (path === "/api/coms/overview") {
    try {
      return json(await getOverview(env));
    } catch (error) {
      return json({ error: (error as Error).message }, 500);
    }
  }

  if (path === "/api/coms/insight") {
    try {
      const overview = await getOverview(env);
      const note = await getGeminiOpsNote(env, overview);
      return json({ note, updatedAt: new Date().toISOString() });
    } catch (error) {
      return json({ error: (error as Error).message }, 500);
    }
  }

  return null;
}
