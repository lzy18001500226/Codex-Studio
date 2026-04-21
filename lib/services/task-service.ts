import path from "node:path";
import { codexRepository } from "@/lib/repositories/codex-repository";
import { runSimulatedAgent } from "@/lib/services/agent-service";
import { getSettings } from "@/lib/services/settings-service";
import type { DashboardData, Task } from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

type CreateTaskInput = {
  title: string;
  description: string;
  workspacePath: string;
  autoRunTests: boolean;
  approvalEnabled: boolean;
};

function normalizeWorkspacePath(workspacePath: string) {
  const settings = getSettings();
  if (path.isAbsolute(workspacePath)) {
    return workspacePath;
  }
  return path.resolve(settings.workspaceRoot, workspacePath);
}

export async function createTask(input: CreateTaskInput) {
  const task: Task = {
    id: createId("task"),
    title: input.title,
    description: input.description,
    workspacePath: normalizeWorkspacePath(input.workspacePath),
    status: "planning",
    autoRunTests: input.autoRunTests,
    approvalEnabled: input.approvalEnabled,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null
  };

  codexRepository.createTask(task);
  codexRepository.createSession({
    id: createId("session"),
    taskId: task.id,
    summary: "任务已创建，等待模拟代理执行。",
    createdAt: nowIso(),
    updatedAt: nowIso()
  });

  await runSimulatedAgent(task.id);
  return codexRepository.getTaskDetail(task.id);
}

export async function rerunTask(taskId: string) {
  const task = codexRepository.getTask(taskId);
  if (!task) {
    throw new Error("任务不存在。");
  }

  codexRepository.clearTaskArtifacts(taskId);
  codexRepository.createSession({
    id: createId("session"),
    taskId,
    summary: "任务已重新运行。",
    createdAt: nowIso(),
    updatedAt: nowIso()
  });
  codexRepository.updateTask(taskId, {
    status: "planning",
    updatedAt: nowIso(),
    completedAt: null
  });

  await runSimulatedAgent(taskId);
  return codexRepository.getTaskDetail(taskId);
}

export function getTaskDetail(taskId: string) {
  return codexRepository.getTaskDetail(taskId);
}

export function listTasks() {
  return codexRepository.listTasks();
}

export function deleteTask(taskId: string) {
  codexRepository.deleteTask(taskId);
}

export function getDashboardData(): DashboardData {
  return {
    settings: getSettings(),
    recentTasks: codexRepository.listTasks().slice(0, 6),
    pendingApprovals: codexRepository.listPendingApprovals().slice(0, 6),
    stats: codexRepository.getTaskStats()
  };
}

export function listAllTestRuns() {
  return codexRepository.listAllTestRuns();
}
