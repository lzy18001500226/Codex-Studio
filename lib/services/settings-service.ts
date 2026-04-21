import fs from "node:fs";
import path from "node:path";
import { codexRepository } from "@/lib/repositories/codex-repository";
import type { Settings } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export function getSettings() {
  const settings = codexRepository.getSettings();
  fs.mkdirSync(settings.workspaceRoot, { recursive: true });
  return settings;
}

export function updateSettings(input: Omit<Settings, "id" | "updatedAt">) {
  const workspaceRoot = path.resolve(input.workspaceRoot);
  fs.mkdirSync(workspaceRoot, { recursive: true });

  return codexRepository.updateSettings({
    id: "default",
    ...input,
    workspaceRoot,
    updatedAt: nowIso()
  });
}
