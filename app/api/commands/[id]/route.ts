import { codexRepository } from "@/lib/repositories/codex-repository";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const commandRun = codexRepository.getCommandRun(id);
    if (!commandRun) {
      return fail("命令执行记录不存在。", 404);
    }
    return ok({ commandRun });
  } catch (error) {
    return fail(error);
  }
}
