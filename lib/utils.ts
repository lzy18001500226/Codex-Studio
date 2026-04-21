import path from "node:path";
import crypto from "node:crypto";

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function toBool(value: number | boolean) {
  return value === true || value === 1;
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function relativeToRoot(root: string, target: string) {
  return path.relative(root, target).replace(/\\/g, "/") || ".";
}

export function buildSimplePlan(description: string, autoRunTests: boolean) {
  const steps = [
    "审阅任务目标并确定需要的工作区上下文",
    "生成可执行计划并记录到时间线",
    "输出一份工作说明到 `.agent-lab/` 目录"
  ];

  if (autoRunTests) {
    steps.push("在获得审批后运行默认测试命令并汇总结果");
  } else {
    steps.push("跳过测试，直接生成本轮执行摘要");
  }

  const normalized = description.trim() || "未提供额外描述";
  return [
    `任务理解：${normalized}`,
    ...steps.map((step, index) => `${index + 1}. ${step}`)
  ].join("\n");
}

export function createSummary(title: string, workspacePath: string, ranTests: boolean, status: string) {
  return [
    `任务《${title}》已完成模拟代理执行。`,
    `工作区：${workspacePath}`,
    ranTests ? "本轮已记录测试执行结果。" : "本轮未执行测试命令。",
    `最终状态：${status}`
  ].join("\n");
}

export function buildLineDiff(beforeContent: string, afterContent: string) {
  const before = beforeContent.split("\n");
  const after = afterContent.split("\n");
  const m = before.length;
  const n = after.length;
  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (before[i] === after[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const lines: string[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (before[i] === after[j]) {
      lines.push(`  ${before[i]}`);
      i += 1;
      j += 1;
      continue;
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push(`- ${before[i]}`);
      i += 1;
    } else {
      lines.push(`+ ${after[j]}`);
      j += 1;
    }
  }

  while (i < m) {
    lines.push(`- ${before[i]}`);
    i += 1;
  }

  while (j < n) {
    lines.push(`+ ${after[j]}`);
    j += 1;
  }

  return lines.join("\n");
}
