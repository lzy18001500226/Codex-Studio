import { SectionCard } from "@/components/section-card";
import { WorkspaceBrowser } from "@/components/workspace-browser";
import { getWorkspaceGitStatus, listWorkspaceTree } from "@/lib/services/workspace-service";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const [initialNodes, git] = await Promise.all([listWorkspaceTree("."), Promise.resolve(getWorkspaceGitStatus())]);

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>工作区浏览</h1>
          <p>支持目录树懒加载、文件内容查看、文件搜索和直接保存，也能查看当前 Git 状态。</p>
        </div>
      </header>

      <SectionCard title="工作区文件树" description="左侧为懒加载目录树，右侧为文件编辑器。">
        <WorkspaceBrowser initialNodes={initialNodes} />
      </SectionCard>

      <SectionCard title="Git 状态" description="如果工作区已初始化仓库，这里会显示分支和变更。">
        {git.available ? (
          <div className="list">
            <div className="list-item">
              <strong>当前分支</strong>
              <p>{git.branch}</p>
            </div>
            <div className="list-item">
              <strong>最近提交</strong>
              <p>{git.lastCommit ?? "暂无"}</p>
            </div>
            <div className="list-item">
              <strong>变更文件</strong>
              <pre className="diff-panel">
                {git.changedFiles.length === 0
                  ? "当前无未提交改动。"
                  : git.changedFiles.map((item) => `${item.status} ${item.path}`).join("\n")}
              </pre>
            </div>
          </div>
        ) : (
          <div className="alert">{git.raw}</div>
        )}
      </SectionCard>
    </div>
  );
}
