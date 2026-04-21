import { stopCommand } from "@/lib/services/command-service";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const commandRun = stopCommand(id);
    return ok({ commandRun });
  } catch (error) {
    return fail(error, 400);
  }
}
