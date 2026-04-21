import path from "node:path";
import { codexRepository } from "@/lib/repositories/codex-repository";
import { getSettings } from "@/lib/services/settings-service";
import { runTaskTest } from "@/lib/services/test-service";
import { updateWorkspaceFile } from "@/lib/services/workspace-service";
import type { Task } from "@/lib/types";
import { buildSimplePlan, createId, createSummary, nowIso } from "@/lib/utils";

async function writeAgentNote(task: Task) {
  const plan = buildSimplePlan(task.description, task.autoRunTests);
  const notePath = path.join(".agent-lab", `${task.id}.md`).replace(/\\/g, "/");
  const noteContent = [
    `# ${task.title}`,
    "",
    "## 任务描述",
    task.description,
    "",
    "## 执行计划",
    plan
  ].join("\n");

  await updateWorkspaceFile(notePath, noteContent, task.id);

  codexRepository.addStep({
    id: createId("step"),
    taskId: task.id,
    stepType: "file_change",
    title: "写入代理工作说明",
    content: `已生成 ${notePath}`,
    status: "completed",
    createdAt: nowIso()
  });
}

export async function runSimulatedAgent(taskId: string) {
  const task = codexRepository.getTask(taskId);
  if (!task) {
    throw new Error("任务不存在。");
  }

  const settings = getSettings();
  const startedAt = nowIso();

  codexRepository.addStep({
    id: createId("step"),
    taskId,
    stepType: "plan",
    title: "生成执行计划",
    content: buildSimplePlan(task.description, task.autoRunTests),
    status: "completed",
    createdAt: startedAt
  });

  codexRepository.updateTask(taskId, {
    status: "running",
    updatedAt: nowIso()
  });

  codexRepository.addStep({
    id: createId("step"),
    taskId,
    stepType: "result",
    title: "检查工作区与运行模式",
    content: `当前模式：${settings.mode}；工作区：${task.workspacePath}`,
    status: "completed",
    createdAt: nowIso()
  });

  await writeAgentNote(task);

  if (task.autoRunTests) {
    await runTaskTest(taskId, task.approvalEnabled);
    return codexRepository.getTask(taskId);
  }

  await finishTaskExecution(taskId);
  return codexRepository.getTask(taskId);
}

export async function finishTaskExecution(taskId: string) {
  const detail = codexRepository.getTaskDetail(taskId);
  if (!detail) {
    throw new Error("任务不存在。");
  }

  const latestTest = detail.testRuns[0];
  const finalStatus =
    latestTest?.status === "failed"
      ? "failed"
      : detail.approvals.some((item) => item.status === "rejected")
        ? "rejected"
        : "completed";

  const summary = createSummary(
    detail.task.title,
    detail.task.workspacePath,
    Boolean(latestTest),
    finalStatus
  );

  codexRepository.updateTask(taskId, {
    status: finalStatus,
    updatedAt: nowIso(),
    completedAt: nowIso()
  });

  codexRepository.updateSessionSummary(taskId, summary, nowIso());

  codexRepository.addStep({
    id: createId("step"),
    taskId,
    stepType: "result",
    title: "生成最终摘要",
    content: summary,
    status: finalStatus === "completed" ? "completed" : "failed",
    createdAt: nowIso()
  });

  return codexRepository.getTask(taskId);
}
