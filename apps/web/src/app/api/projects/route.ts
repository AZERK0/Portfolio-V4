import { getProjectCatalog } from "@/lib/project-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getProjectCatalog(), {
    headers: { "Cache-Control": "no-store" },
  });
}
