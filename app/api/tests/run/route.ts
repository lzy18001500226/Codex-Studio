import { runTaskTest } from "@/lib/services/test-service";
import { runTestSchema } from "@/lib/validators";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = runTestSchema.parse(await request.json());
    const result = await runTaskTest(body.taskId, body.requireApproval);
    return ok(result, result.type === "approval" ? 202 : 200);
  } catch (error) {
    return fail(error, 400);
  }
}
