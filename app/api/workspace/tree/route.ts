import { listWorkspaceTree } from "@/lib/services/workspace-service";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tree = await listWorkspaceTree(url.searchParams.get("path") ?? ".", url.searchParams.get("search") ?? "");
    return ok({ tree });
  } catch (error) {
    return fail(error, 400);
  }
}
