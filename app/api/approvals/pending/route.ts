import { codexRepository } from "@/lib/repositories/codex-repository";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ approvals: codexRepository.listPendingApprovals() });
  } catch (error) {
    return fail(error);
  }
}
