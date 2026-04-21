import { runCommand } from "@/lib/services/command-service";
import { runCommandSchema } from "@/lib/validators";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = runCommandSchema.parse(await request.json());
    const result = await runCommand(body);
    return ok(result, result.type === "approval" ? 202 : 200);
  } catch (error) {
    return fail(error, 400);
  }
}
