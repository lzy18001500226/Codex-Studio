import Link from "next/link";
import { TaskCreateForm } from "@/components/task-create-form";
import { StatusBadge } from "@/components/status-badge";
import { SectionCard } from "@/components/section-card";
import { getDashboardData } from "@/lib/services/task-service";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const data = getDashboardData();

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>控制台</h1>
          <p>从这里创建编码任务、观察执行状态，并快速跳转到最近的任务、审批和工作区面板。</p>
        </div>
      </header>

      <div className="grid grid-3">
        <div className="card">
          <p>任务总数</p>
          <div className="stat-value">{data.stats.total}</div>
        </div>
        <div className="card">
          <p>待审批任务</p>
          <div className="stat-value">{data.stats.waitingApproval}</div>
        </div>
        <div className="card">
          <p>已完成任务</p>
          <div className="stat-value">{data.stats.completed}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <SectionCard title="新建代理任务" description="创建后会自动写入执行计划，并按设置触发审批与测试。">
          <TaskCreateForm workspaceRoot={data.settings.workspaceRoot} />
        </SectionCard>

        <SectionCard title="当前工作区信息" description="用于展示系统状态与默认策略。">
          <div className="list">
            <div className="list-item">
              <strong>工作区根路径</strong>
              <p>{data.settings.workspaceRoot}</p>
            </div>
            <div className="list-item">
              <strong>默认测试命令</strong>
              <p>{data.settings.defaultTestCommand}</p>
            </div>
            <div className="list-item">
              <strong>审批策略</strong>
              <p>{data.settings.approvalRequired ? "高风险动作默认需要审批" : "允许直接执行"}</p>
            </div>
            <div className="list-item">
              <strong>命令白名单</strong>
              <p>{data.settings.commandWhitelist.join(", ")}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-2">
        <SectionCard title="最近任务" description="快速进入最近一次执行过的会话。">
          {data.recentTasks.length === 0 ? (
            <div className="empty">还没有任务，先在左侧创建一个演示任务。</div>
          ) : (
            <div className="list">
              {data.recentTasks.map((task) => (
                <Link className="list-item" href={`/tasks/${task.id}`} key={task.id}>
                  <div className="list-item-header">
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.description}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                  <p>工作区：{task.workspacePath}</p>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="待审批事项" description="审批通过后，任务会继续执行测试或命令。">
          {data.pendingApprovals.length === 0 ? (
            <div className="empty">当前没有待审批事项。</div>
          ) : (
            <div className="list">
              {data.pendingApprovals.map((approval) => (
                <Link className="list-item" href={`/tasks/${approval.taskId}`} key={approval.id}>
                  <div className="list-item-header">
                    <strong>{approval.actionType}</strong>
                    <StatusBadge status={approval.status} />
                  </div>
                  <p>{approval.actionPayload}</p>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
