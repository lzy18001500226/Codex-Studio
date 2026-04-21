import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { listAllTestRuns } from "@/lib/services/task-service";
import { codexRepository } from "@/lib/repositories/codex-repository";

export const dynamic = "force-dynamic";

export default function TestsPage() {
  const testRuns = listAllTestRuns();

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>测试记录</h1>
          <p>集中展示所有任务中的测试命令、输出日志和结果状态。</p>
        </div>
      </header>

      <SectionCard title="测试历史" description="支持从测试记录直接跳转回对应任务详情。">
        {testRuns.length === 0 ? (
          <div className="empty">还没有测试执行记录。</div>
        ) : (
          <div className="list">
            {testRuns.map((testRun) => {
              const task = codexRepository.getTask(testRun.taskId);
              return (
                <div className="list-item" key={testRun.id}>
                  <div className="list-item-header">
                    <div>
                      <strong>{testRun.command}</strong>
                      <p>{task?.title ?? testRun.taskId}</p>
                    </div>
                    <StatusBadge status={testRun.status} />
                  </div>
                  <p>开始时间：{testRun.startedAt}</p>
                  <pre className="mono-panel">{testRun.output || "无输出"}</pre>
                  <Link className="button-secondary" href={`/tasks/${testRun.taskId}`}>
                    查看所属任务
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
