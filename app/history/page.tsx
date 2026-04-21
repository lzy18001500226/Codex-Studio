import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { SectionCard } from "@/components/section-card";
import { listTasks } from "@/lib/services/task-service";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams
}: {
  searchParams: Promise<{
    status?: string;
    date?: string;
  }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const tasks = listTasks().filter((task) => {
    const statusMatch = resolvedSearchParams.status ? task.status === resolvedSearchParams.status : true;
    const dateMatch = resolvedSearchParams.date ? task.createdAt.startsWith(resolvedSearchParams.date) : true;
    return statusMatch && dateMatch;
  });

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>历史会话</h1>
          <p>按状态和日期筛选历史任务，查看旧任务的日志、diff 和测试记录。</p>
        </div>
      </header>

      <SectionCard title="筛选条件" description="使用 GET 查询参数保留当前视图，便于分享截图。">
        <form className="grid grid-2" method="GET">
          <div className="field">
            <label htmlFor="status">任务状态</label>
            <select className="select" id="status" name="status" defaultValue={resolvedSearchParams.status ?? ""}>
              <option value="">全部状态</option>
              <option value="planning">规划中</option>
              <option value="waiting_approval">待审批</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="date">创建日期</label>
            <input className="input" id="date" name="date" type="date" defaultValue={resolvedSearchParams.date ?? ""} />
          </div>
          <div className="button-row">
            <button className="button" type="submit">
              应用筛选
            </button>
            <Link className="button-secondary" href="/history">
              重置
            </Link>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="历史任务列表" description="点击任意任务可重新查看详情、审批与日志。">
        {tasks.length === 0 ? (
          <div className="empty">当前筛选条件下没有任务记录。</div>
        ) : (
          <div className="list">
            {tasks.map((task) => (
              <Link className="list-item" href={`/tasks/${task.id}`} key={task.id}>
                <div className="list-item-header">
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
                <p>创建时间：{task.createdAt}</p>
                <p>工作区：{task.workspacePath}</p>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
