import { deleteTask, getTaskDetail } from "@/lib/services/task-service";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const task = getTaskDetail(id);
    if (!task) {
      return fail("任务不存在。", 404);
    }
    return ok({ task });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deleteTask(id);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
