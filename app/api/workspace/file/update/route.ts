import { updateWorkspaceFile } from "@/lib/services/workspace-service";
import { updateFileSchema } from "@/lib/validators";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = updateFileSchema.parse(await request.json());
    const result = await updateWorkspaceFile(body.path, body.content, body.taskId);
    return ok({ result });
  } catch (error) {
    return fail(error, 400);
  }
}
