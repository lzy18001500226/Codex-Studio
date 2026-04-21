import { codexRepository } from "@/lib/repositories/codex-repository";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const testRun = codexRepository.getTestRun(id);
    if (!testRun) {
      return fail("测试记录不存在。", 404);
    }
    return ok({ testRun });
  } catch (error) {
    return fail(error);
  }
}
