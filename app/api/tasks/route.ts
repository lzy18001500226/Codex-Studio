import { createTask, listTasks } from "@/lib/services/task-service";
import { createTaskSchema } from "@/lib/validators";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ tasks: listTasks() });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createTaskSchema.parse(await request.json());
    const task = await createTask(body);
    return ok({ task }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
