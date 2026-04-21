"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TaskCreateFormProps = {
  workspaceRoot: string;
};

export function TaskCreateForm({ workspaceRoot }: TaskCreateFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("演示任务：分析工作区并执行测试");
  const [description, setDescription] = useState("请快速分析当前示例工作区，写出执行计划，并在审批后运行默认测试。");
  const [workspacePath, setWorkspacePath] = useState(workspaceRoot);
  const [autoRunTests, setAutoRunTests] = useState(true);
  const [approvalEnabled, setApprovalEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          workspacePath,
          autoRunTests,
          approvalEnabled
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "创建任务失败。");
      }

      router.push(`/tasks/${payload.task.task.id}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "创建任务失败。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="task-title">任务标题</label>
        <input id="task-title" className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="task-description">任务描述</label>
        <textarea
          id="task-description"
          className="textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="workspace-path">工作区路径</label>
        <input
          id="workspace-path"
          className="input"
          value={workspacePath}
          onChange={(event) => setWorkspacePath(event.target.value)}
        />
      </div>

      <div className="checkbox-row">
        <label className="checkbox">
          <input type="checkbox" checked={autoRunTests} onChange={(event) => setAutoRunTests(event.target.checked)} />
          自动运行测试
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={approvalEnabled}
            onChange={(event) => setApprovalEnabled(event.target.checked)}
          />
          启用审批
        </label>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="button-row">
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "正在创建..." : "创建任务并启动模拟代理"}
        </button>
      </div>
    </form>
  );
}
