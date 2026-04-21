import { codexRepository } from "@/lib/repositories/codex-repository";
import { executeApprovedCommand } from "@/lib/services/command-service";
import { finishTaskExecution } from "@/lib/services/agent-service";
import { executeApprovedTest } from "@/lib/services/test-service";
import { nowIso } from "@/lib/utils";

export async function approveAction(approvalId: string, reviewer: string, comment: string) {
  const approval = codexRepository.getApproval(approvalId);
  if (!approval) {
    throw new Error("审批记录不存在。");
  }

  const updated = codexRepository.updateApproval(approvalId, {
    status: "approved",
    reviewer,
    comment,
    reviewedAt: nowIso()
  });

  const payload = JSON.parse(approval.actionPayload) as {
    taskId: string;
    command?: string;
    cwd?: string;
    continueTask?: boolean;
  };

  if (approval.actionType === "command.run" && payload.command) {
    await executeApprovedCommand({
      taskId: payload.taskId,
      command: payload.command,
      cwd: payload.cwd,
      requireApproval: false
    });
  }

  if (approval.actionType === "test.run" && payload.command) {
    await executeApprovedTest(payload.taskId, payload.command, payload.cwd);
    await finishTaskExecution(payload.taskId);
  }

  return updated;
}

export function rejectAction(approvalId: string, reviewer: string, comment: string) {
  const approval = codexRepository.getApproval(approvalId);
  if (!approval) {
    throw new Error("审批记录不存在。");
  }

  const updated = codexRepository.updateApproval(approvalId, {
    status: "rejected",
    reviewer,
    comment,
    reviewedAt: nowIso()
  });

  codexRepository.updateTask(approval.taskId, {
    status: "rejected",
    updatedAt: nowIso(),
    completedAt: nowIso()
  });

  codexRepository.addStep({
    id: `step_reject_${approvalId}`,
    taskId: approval.taskId,
    stepType: "approval",
    title: "审批被拒绝",
    content: comment || "用户拒绝了当前高风险动作。",
    status: "failed",
    createdAt: nowIso()
  });

  codexRepository.updateSessionSummary(
    approval.taskId,
    "任务因审批被拒绝而结束，未继续执行高风险操作。",
    nowIso()
  );

  return updated;
}
