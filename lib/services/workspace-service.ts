import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { codexRepository } from "@/lib/repositories/codex-repository";
import { getSettings } from "@/lib/services/settings-service";
import type { GitStatusSummary, WorkspaceFile, WorkspaceNode } from "@/lib/types";
import { buildLineDiff, createId, nowIso, relativeToRoot } from "@/lib/utils";

function ensureInsideWorkspace(resolvedPath: string, workspaceRoot: string) {
  const relative = path.relative(workspaceRoot, resolvedPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("禁止访问工作区外路径。");
  }
}

export function resolveWorkspacePath(relativePath = ".") {
  const settings = getSettings();
  const workspaceRoot = path.resolve(settings.workspaceRoot);
  const resolved = path.resolve(workspaceRoot, relativePath);
  ensureInsideWorkspace(resolved, workspaceRoot);
  return { workspaceRoot, resolved };
}

function getModifiedPathSet(workspaceRoot: string) {
  try {
    const rows = spawnSync("git", ["status", "--short"], {
      cwd: workspaceRoot,
      encoding: "utf8",
      timeout: 5000
    });

    if (rows.status === 0) {
      const files = rows.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.slice(3).trim().replace(/\\/g, "/"));
      return new Set(files);
    }
  } catch {
    // Ignore git lookup errors and fall back to recorded changes.
  }

  const allTasks = codexRepository.listTasks();
  const changed = new Set<string>();
  for (const task of allTasks) {
    for (const fileChange of codexRepository.listFileChanges(task.id)) {
      changed.add(fileChange.filePath.replace(/\\/g, "/"));
    }
  }
  return changed;
}

export async function listWorkspaceTree(relativePath = ".", search = ""): Promise<WorkspaceNode[]> {
  const { workspaceRoot, resolved } = resolveWorkspacePath(relativePath);
  const modified = getModifiedPathSet(workspaceRoot);

  if (search.trim()) {
    const results: WorkspaceNode[] = [];
    const lower = search.toLowerCase();

    async function walk(current: string) {
      const entries = await fs.readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === ".git" || entry.name === "node_modules") {
          continue;
        }

        const nextPath = path.join(current, entry.name);
        const relativeNodePath = relativeToRoot(workspaceRoot, nextPath);
        if (entry.name.toLowerCase().includes(lower)) {
          results.push({
            name: entry.name,
            path: relativeNodePath,
            type: entry.isDirectory() ? "directory" : "file",
            hasChildren: entry.isDirectory(),
            modified: modified.has(relativeNodePath)
          });
        }

        if (entry.isDirectory()) {
          await walk(nextPath);
        }
      }
    }

    await walk(workspaceRoot);
    return results.slice(0, 120);
  }

  const entries = await fs.readdir(resolved, { withFileTypes: true });
  return entries
    .filter((entry) => entry.name !== ".git" && entry.name !== "node_modules")
    .sort((left, right) => {
      if (left.isDirectory() && !right.isDirectory()) {
        return -1;
      }
      if (!left.isDirectory() && right.isDirectory()) {
        return 1;
      }
      return left.name.localeCompare(right.name, "zh-CN");
    })
    .map((entry) => {
      const nextPath = path.join(resolved, entry.name);
      const relativeNodePath = relativeToRoot(workspaceRoot, nextPath);
      return {
        name: entry.name,
        path: relativeNodePath,
        type: entry.isDirectory() ? "directory" : "file",
        hasChildren: entry.isDirectory(),
        modified: modified.has(relativeNodePath)
      } satisfies WorkspaceNode;
    });
}

export async function readWorkspaceFile(relativePath: string): Promise<WorkspaceFile> {
  const { workspaceRoot, resolved } = resolveWorkspacePath(relativePath);
  const stats = await fs.stat(resolved);
  if (!stats.isFile()) {
    throw new Error("当前路径不是文件。");
  }

  const content = await fs.readFile(resolved, "utf8");
  return {
    path: relativeToRoot(workspaceRoot, resolved),
    content,
    modified: getModifiedPathSet(workspaceRoot).has(relativeToRoot(workspaceRoot, resolved))
  };
}

export async function updateWorkspaceFile(relativePath: string, content: string, taskId?: string) {
  const { workspaceRoot, resolved } = resolveWorkspacePath(relativePath);
  fsSync.mkdirSync(path.dirname(resolved), { recursive: true });
  const beforeContent = fsSync.existsSync(resolved) ? await fs.readFile(resolved, "utf8") : "";
  await fs.writeFile(resolved, content, "utf8");
  const normalizedPath = relativeToRoot(workspaceRoot, resolved);

  if (taskId) {
    codexRepository.addFileChange({
      id: createId("change"),
      taskId,
      filePath: normalizedPath,
      changeType: beforeContent ? "update" : "create",
      beforeContent,
      afterContent: content,
      diffText: buildLineDiff(beforeContent, content),
      createdAt: nowIso()
    });
  }

  return {
    path: normalizedPath,
    beforeContent,
    afterContent: content
  };
}

export async function getWorkspaceDiff(relativePath: string) {
  const file = await readWorkspaceFile(relativePath);
  const tasks = codexRepository.listTasks();

  for (const task of tasks) {
    const match = codexRepository
      .listFileChanges(task.id)
      .find((change) => change.filePath.replace(/\\/g, "/") === file.path.replace(/\\/g, "/"));
    if (match) {
      return match.diffText;
    }
  }

  return buildLineDiff("", file.content);
}

export function getWorkspaceGitStatus(): GitStatusSummary {
  const { workspaceRoot } = resolveWorkspacePath(".");

  try {
    const branch = spawnSync("git", ["branch", "--show-current"], {
      cwd: workspaceRoot,
      encoding: "utf8",
      timeout: 5000
    });
    const status = spawnSync("git", ["status", "--short"], {
      cwd: workspaceRoot,
      encoding: "utf8",
      timeout: 5000
    });
    const lastCommit = spawnSync("git", ["log", "-1", "--pretty=%h %s"], {
      cwd: workspaceRoot,
      encoding: "utf8",
      timeout: 5000
    });

    if (branch.status !== 0 || status.status !== 0) {
      throw new Error("Workspace is not a git repository.");
    }

    const changedFiles = status.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({
        status: line.slice(0, 2).trim(),
        path: line.slice(3).trim().replace(/\\/g, "/")
      }));

    return {
      available: true,
      branch: branch.stdout.trim() || "main",
      changedFiles,
      lastCommit: lastCommit.stdout.trim() || null,
      raw: status.stdout
    };
  } catch {
    return {
      available: false,
      branch: null,
      changedFiles: [],
      lastCommit: null,
      raw: "当前工作区还不是 Git 仓库，Git 状态面板会在初始化仓库后显示。"
    };
  }
}
