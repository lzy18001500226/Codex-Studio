import { getSettings, updateSettings } from "@/lib/services/settings-service";
import { updateSettingsSchema } from "@/lib/validators";
import { fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ settings: getSettings() });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = updateSettingsSchema.parse(await request.json());
    const settings = updateSettings(body);
    return ok({ settings });
  } catch (error) {
    return fail(error, 400);
  }
}
