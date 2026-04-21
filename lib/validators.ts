import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "任务标题不能为空"),
  description: z.string().min(1, "任务描述不能为空"),
  workspacePath: z.string().min(1, "工作区路径不能为空"),
  autoRunTests: z.boolean().default(true),
  approvalEnabled: z.boolean().default(true)
});

export const runCommandSchema = z.object({
  taskId: z.string().optional(),
  command: z.string().min(1, "命令不能为空"),
  cwd: z.string().optional(),
  requireApproval: z.boolean().optional().default(true)
});

export const updateFileSchema = z.object({
  path: z.string().min(1, "文件路径不能为空"),
  content: z.string(),
  taskId: z.string().optional()
});

export const approvalActionSchema = z.object({
  reviewer: z.string().min(1).default("local-admin"),
  comment: z.string().optional().default("")
});

export const updateSettingsSchema = z.object({
  workspaceRoot: z.string().min(1),
  allowShellExecution: z.boolean(),
  approvalRequired: z.boolean(),
  defaultTestCommand: z.string().min(1),
  commandWhitelist: z.array(z.string().min(1)),
  mode: z.enum(["mock", "live"]),
  approvalThreshold: z.coerce.number().int().min(1).max(20),
  logRetentionDays: z.coerce.number().int().min(1).max(365)
});

export const runTestSchema = z.object({
  taskId: z.string().min(1, "任务 ID 不能为空"),
  requireApproval: z.boolean().optional().default(true)
});
