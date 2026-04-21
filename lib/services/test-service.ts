import { codexRepository } from "@/lib/repositories/codex-repository";
import { executeApprovedCommand } from "@/lib/services/command-service";
import { getSettings } from "@/lib/services/settings-service";
import type { Approval, TestRun } from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

export async function runTaskTest(taskId: string, requireApproval = true): Promise<
  | { type: "approval"; approval: Approval }
  | { type: "completed"; testRun: TestRun | null }
> {
  const settings = getSettings();
  const task = codexRepository.getTask(taskId);

  if (!task) {
    throw new Error("任务不存在。");
  }

  if (requireApproval && settings.approvalRequired) {
    const approval = codexRepository.addApproval({
      id: createId("approval"),
      taskId,
      actionType: "test.run",
      actionPayload: JSON.stringify({
        taskId,
        command: settings.defaultTestCommand,
        cwd: task.workspacePath
      }),
      status: "pending",
      reviewer: null,
      comment: null,
      createdAt: nowIso(),
      reviewedAt: null
    });

    codexRepository.addStep({
      id: createId("step"),
      taskId,
      stepType: "approval",
      title: "等待测试审批",
      content: `待审批测试命令：${settings.defaultTestCommand}`,
      status: "waiting",
      createdAt: nowIso()
    });

    codexRepository.updateTask(taskId, {
      status: "waiting_approval",
      updatedAt: nowIso()
    });

    return { type: "approval", approval };
  }

  const testRun = await executeApprovedTest(taskId, settings.defaultTestCommand, task.workspacePath);
  return { type: "completed", testRun };
}

export async function executeApprovedTest(taskId: string, command: string, cwd?: string) {
  const startedAt = nowIso();
  const pending = codexRepository.addTestRun({
    id: createId("test"),
    taskId,
    command,
    output: "",
    status: "running",
    startedAt,
    endedAt: null
  });

  codexRepository.updateTask(taskId, {
    status: "testing",
    updatedAt: nowIso()
  });

  codexRepository.addStep({
    id: createId("step"),
    taskId,
    stepType: "test",
    title: "运行测试",
    content: command,
    status: "running",
    createdAt: startedAt
  });

  const commandRun = await executeApprovedCommand({
    taskId,
    command,
    cwd,
    requireApproval: false
  });

  return codexRepository.updateTestRun(pending.id, {
    output: [commandRun.stdout, commandRun.stderr].filter(Boolean).join("\n").trim(),
    status: commandRun.exitCode === 0 ? "passed" : "failed",
    endedAt: nowIso()
  });
}
