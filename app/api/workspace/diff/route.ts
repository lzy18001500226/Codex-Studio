import { getWorkspaceDiff } from "@/lib/services/workspace-service";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const targetPath = url.searchParams.get("path");
    if (!targetPath) {
      return fail("缺少 path 参数。", 400);
    }
    const diffText = await getWorkspaceDiff(targetPath);
    return ok({ diffText });
  } catch (error) {
    return fail(error, 400);
  }
}
