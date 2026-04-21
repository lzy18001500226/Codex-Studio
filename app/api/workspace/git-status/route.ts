import { getWorkspaceGitStatus } from "@/lib/services/workspace-service";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ git: getWorkspaceGitStatus() });
  } catch (error) {
    return fail(error);
  }
}
