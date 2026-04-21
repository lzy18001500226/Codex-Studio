import { rejectAction } from "@/lib/services/approval-service";
import { approvalActionSchema } from "@/lib/validators";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = approvalActionSchema.parse(await request.json());
    const approval = rejectAction(id, body.reviewer, body.comment ?? "");
    return ok({ approval });
  } catch (error) {
    return fail(error, 400);
  }
}
