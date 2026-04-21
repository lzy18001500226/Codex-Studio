import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { codexRepository } from "@/lib/repositories/codex-repository";
import { getSettings } from "@/lib/services/settings-service";
import { resolveWorkspacePath } from "@/lib/services/workspace-service";
import type { Approval, CommandRun } from "@/lib/types";
import { COMMAND_TIMEOUT_MS } from "@/lib/config";
import { createId, nowIso } from "@/lib/utils";

const runningProcesses = new Map<string, ChildProcessWithoutNullStreams>();
const allowedGitSubCommands = new Set(["status", "diff", "add", "restore"]);

type CommandPayload = {
  taskId?: string;
  command: string;
  cwd?: string;
  requireApproval?: boolean;
};

function tokenize(command: string) {
  const matches = command.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  return matches.map((token) => token.replace(/^"(.*)"$/, "$1"));
}

function validateAgainstWhitelist(command: string) {
  const settings = getSettings();
  const [executable, subCommand] = tokenize(command);

  if (!settings.allowShellExecution) {
    throw new Error("当前设置禁止执行 shell 命令。");
  }

  if (!executable) {
    throw new Error("命令不能为空。");
  }

  if (!settings.commandWhitelist.includes(executable)) {
    throw new Error(`命令 ${executable} 不在白名单中。`);
  }

  if (executable === "git" && subCommand && !allowedGitSubCommands.has(subCommand)) {
    throw new Error(`Git 子命令 ${subCommand} 不在第一版允许列表中。`);
  }

  return executable;
}

function resolveCommandSpec(command: string) {
  const tokens = tokenize(command);
  const [executable, ...args] = tokens;

  switch (executable) {
    case "ls":
    case "dir":
      return {
        executable: "powershell",
        args: ["-Command", args[0] ? `Get-ChildItem '${args[0]}'` : "Get-ChildItem"]
      };
    case "pwd":
      return {
        executable: "powershell",
        args: ["-Command", "Get-Location"]
      };
    default:
      return { executable, args };
  }
}

function resolveCwd(inputCwd?: string) {
  if (!inputCwd || inputCwd === ".") {
    return resolveWorkspacePath(".").resolved;
  }

  if (path.isAbsolute(inputCwd)) {
    const { workspaceRoot } = resolveWorkspacePath(".");
    const relative = path.relative(workspaceRoot, inputCwd);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("命令执行目录越界。");
    }
    return inputCwd;
  }

  return resolveWorkspacePath(inputCwd).resolved;
}

function requiresApproval(command: string) {
  const [executable, subCommand] = tokenize(command);
  if (executable === "git" && subCommand && (subCommand === "add" || subCommand === "restore")) {
    return true;
  }
  return true;
}

export async function runCommand(payload: CommandPayload): Promise<
  | { type: "approval"; approval: Approval }
  | { type: "completed"; commandRun: CommandRun | null }
> {
  validateAgainstWhitelist(payload.command);
  const settings = getSettings();

  if (payload.requireApproval !== false && settings.approvalRequired && requiresApproval(payload.command)) {
    if (!payload.taskId) {
      throw new Error("需要审批的命令必须关联任务。");
    }

    const approval = codexRepository.addApproval({
      id: createId("approval"),
      taskId: payload.taskId,
      actionType: "command.run",
      actionPayload: JSON.stringify({
        taskId: payload.taskId,
        command: payload.command,
        cwd: payload.cwd
      }),
      status: "pending",
      reviewer: null,
      comment: null,
      createdAt: nowIso(),
      reviewedAt: null
    });

    codexRepository.addStep({
      id: createId("step"),
      taskId: payload.taskId,
      stepType: "approval",
      title: "等待命令审批",
      content: `待审批命令：${payload.command}`,
      status: "waiting",
      createdAt: nowIso()
    });

    codexRepository.updateTask(payload.taskId, {
      status: "waiting_approval",
      updatedAt: nowIso()
    });

    return { type: "approval", approval };
  }

  const commandRun = await executeApprovedCommand(payload);
  return { type: "completed", commandRun };
}

export async function executeApprovedCommand(payload: Required<Pick<CommandPayload, "command">> & CommandPayload) {
  validateAgainstWhitelist(payload.command);
  const cwd = resolveCwd(payload.cwd);
  const spec = resolveCommandSpec(payload.command);

  const commandRun = codexRepository.addCommandRun({
    id: createId("cmd"),
    taskId: payload.taskId ?? null,
    command: payload.command,
    cwd,
    stdout: "",
    stderr: "",
    exitCode: null,
    status: "running",
    startedAt: nowIso(),
    endedAt: null
  });

  if (payload.taskId) {
    codexRepository.updateTask(payload.taskId, {
      status: "running",
      updatedAt: nowIso()
    });
    codexRepository.addStep({
      id: createId("step"),
      taskId: payload.taskId,
      stepType: "command",
      title: "执行命令",
      content: payload.command,
      status: "running",
      createdAt: nowIso()
    });
  }

  const result = await new Promise<CommandRun>((resolve, reject) => {
    const child = spawn(spec.executable, spec.args, {
      cwd,
      stdio: "pipe"
    });

    runningProcesses.set(commandRun.id, child);
    let stdout = "";
    let stderr = "";
    let completed = false;

    const timer = setTimeout(() => {
      child.kill();
      if (!completed) {
        completed = true;
        runningProcesses.delete(commandRun.id);
        const updated = codexRepository.updateCommandRun(commandRun.id, {
          stdout,
          stderr: `${stderr}\n命令执行超时。`.trim(),
          exitCode: -1,
          status: "failed",
          endedAt: nowIso()
        });
        resolve(updated ?? commandRun);
      }
    }, COMMAND_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      if (!completed) {
        completed = true;
        runningProcesses.delete(commandRun.id);
        reject(error);
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (!completed) {
        completed = true;
        runningProcesses.delete(commandRun.id);
        const updated = codexRepository.updateCommandRun(commandRun.id, {
          stdout,
          stderr,
          exitCode: code ?? -1,
          status: code === 0 ? "completed" : "failed",
          endedAt: nowIso()
        });
        resolve(updated ?? commandRun);
      }
    });
  });

  return result;
}

export function stopCommand(commandRunId: string) {
  const child = runningProcesses.get(commandRunId);
  if (!child) {
    return codexRepository.getCommandRun(commandRunId);
  }

  child.kill();
  runningProcesses.delete(commandRunId);
  return codexRepository.updateCommandRun(commandRunId, {
    status: "stopped",
    endedAt: nowIso()
  });
}
