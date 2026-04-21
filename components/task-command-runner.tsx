"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TaskCommandRunnerProps = {
  taskId: string;
  cwd: string;
};

export function TaskCommandRunner({ taskId, cwd }: TaskCommandRunnerProps) {
  const router = useRouter();
  const [command, setCommand] = useState("node src/index.js");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function runCommand() {
    setRunning(true);
    setMessage("");

    try {
      const response = await fetch("/api/commands/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          command,
          cwd,
          requireApproval: true
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "命令执行失败。");
      }

      setMessage(response.status === 202 ? "命令已进入审批队列。" : "命令已执行完成。");
      router.refresh();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "命令执行失败。");
    } finally {
      setRunning(false);
    }
  }

  async function runTest() {
    setRunning(true);
    setMessage("");

    try {
      const response = await fetch("/api/tests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          requireApproval: true
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "测试执行失败。");
      }

      setMessage(response.status === 202 ? "测试已进入审批队列。" : "测试已执行完成。");
      router.refresh();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "测试执行失败。");
    } finally {
      setRunning(false);
    }
  }

  async function rerunTask() {
    setRunning(true);
    setMessage("");
    try {
      const response = await fetch(`/api/tasks/${taskId}/rerun`, {
        method: "POST"
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "任务重跑失败。");
      }
      setMessage("任务已重新运行。");
      router.refresh();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "任务重跑失败。");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="command-input">手动命令</label>
        <input id="command-input" className="input" value={command} onChange={(event) => setCommand(event.target.value)} />
      </div>
      <div className="button-row">
        <button className="button" disabled={running} onClick={runCommand} type="button">
          运行命令
        </button>
        <button className="button-secondary" disabled={running} onClick={runTest} type="button">
          运行测试
        </button>
        <button className="button-secondary" disabled={running} onClick={rerunTask} type="button">
          重新运行任务
        </button>
      </div>
      {message ? <div className="alert">{message}</div> : null}
    </div>
  );
}
