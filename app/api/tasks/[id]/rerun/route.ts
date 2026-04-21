import { rerunTask } from "@/lib/services/task-service";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const task = await rerunTask(id);
    return ok({ task });
  } catch (error) {
    return fail(error, 400);
  }
}
