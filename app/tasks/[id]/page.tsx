import Link from "next/link";
import { notFound } from "next/navigation";
import { ApprovalActions } from "@/components/approval-actions";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { TaskCommandRunner } from "@/components/task-command-runner";
import { getTaskDetail } from "@/lib/services/task-service";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getTaskDetail(id);
  if (!detail) {
    notFound();
  }

  const pendingApprovals = detail.approvals.filter((approval) => approval.status === "pending");

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>{detail.task.title}</h1>
          <p>{detail.task.description}</p>
        </div>
        <StatusBadge status={detail.task.status} />
      </header>

      <div className="grid" style={{ gridTemplateColumns: "1.05fr 1.2fr 0.95fr" }}>
        <div className="grid">
          <SectionCard title="任务信息" description="基础信息与执行入口。">
            <div className="list">
              <div className="list-item">
                <strong>工作区</strong>
                <p>{detail.task.workspacePath}</p>
              </div>
              <div className="list-item">
                <strong>创建时间</strong>
                <p>{detail.task.createdAt}</p>
              </div>
              <div className="list-item">
                <strong>最近摘要</strong>
                <p>{detail.session?.summary ?? "尚未生成最终摘要。"}</p>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <TaskCommandRunner taskId={detail.task.id} cwd={detail.task.workspacePath} />
            </div>
          </SectionCard>

          <SectionCard title="执行时间线" description="展示计划、命令、测试、审批与结果。">
            {detail.steps.length === 0 ? (
              <div className="empty">当前任务还没有时间线记录。</div>
            ) : (
              <div className="timeline">
                {detail.steps.map((step) => (
                  <div className="timeline-item" key={step.id}>
                    <div className="list-item">
                      <div className="list-item-header">
                        <strong>{step.title}</strong>
                        <StatusBadge status={step.status} />
                      </div>
                      <p>{step.content}</p>
                      <p className="muted">{step.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid">
          <SectionCard title="命令输出" description="记录白名单命令的 stdout / stderr。">
            {detail.commandRuns.length === 0 ? (
              <div className="empty">还没有命令执行记录。</div>
            ) : (
              <div className="list">
                {detail.commandRuns.map((commandRun) => (
                  <div className="list-item" key={commandRun.id}>
                    <div className="list-item-header">
                      <strong>{commandRun.command}</strong>
                      <StatusBadge status={commandRun.status} />
                    </div>
                    <p>执行目录：{commandRun.cwd}</p>
                    <pre className="mono-panel">{[commandRun.stdout, commandRun.stderr].filter(Boolean).join("\n") || "无输出"}</pre>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="文件变更" description="展示本轮代理写入的文件说明与 diff。">
            {detail.fileChanges.length === 0 ? (
              <div className="empty">当前任务没有记录文件变更。</div>
            ) : (
              <div className="list">
                {detail.fileChanges.map((fileChange) => (
                  <div className="list-item" key={fileChange.id}>
                    <div className="list-item-header">
                      <strong>{fileChange.filePath}</strong>
                      <span className="pill">{fileChange.changeType}</span>
                    </div>
                    <pre className="diff-panel">{fileChange.diffText}</pre>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid">
          <SectionCard title="审批面板" description="高风险动作在这里继续或终止。">
            {detail.approvals.length === 0 ? (
              <div className="empty">当前任务尚未触发审批。</div>
            ) : (
              <div className="list">
                {detail.approvals.map((approval) => (
                  <div className="list-item" key={approval.id}>
                    <div className="list-item-header">
                      <strong>{approval.actionType}</strong>
                      <StatusBadge status={approval.status} />
                    </div>
                    <pre className="diff-panel">{approval.actionPayload}</pre>
                    {approval.status === "pending" ? <ApprovalActions approvalId={approval.id} /> : null}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="测试结果" description="最近的测试日志与通过状态。">
            {detail.testRuns.length === 0 ? (
              <div className="empty">当前任务还没有测试结果。</div>
            ) : (
              <div className="list">
                {detail.testRuns.map((testRun) => (
                  <div className="list-item" key={testRun.id}>
                    <div className="list-item-header">
                      <strong>{testRun.command}</strong>
                      <StatusBadge status={testRun.status} />
                    </div>
                    <p>{testRun.startedAt}</p>
                    <pre className="mono-panel">{testRun.output || "无输出"}</pre>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="最终摘要" description="便于截图展示与实验报告整理。">
            <pre className="diff-panel">{detail.session?.summary ?? "等待执行完成后生成摘要。"}</pre>
            {pendingApprovals.length > 0 ? (
              <div className="alert" style={{ marginTop: 14 }}>
                当前仍有 {pendingApprovals.length} 个待审批动作，批准后任务会继续推进。
              </div>
            ) : null}
            <div style={{ marginTop: 14 }}>
              <Link className="button-secondary" href="/workspace">
                打开工作区浏览器
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
