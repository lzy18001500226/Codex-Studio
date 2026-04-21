import { SectionCard } from "@/components/section-card";
import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/services/settings-service";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const settings = getSettings();

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>系统设置</h1>
          <p>配置工作区根目录、命令白名单、默认测试命令、审批阈值和模拟模式。</p>
        </div>
      </header>

      <div className="grid grid-2">
        <SectionCard title="平台配置" description="这些配置会实时写入本地 SQLite 设置表。">
          <SettingsForm settings={settings} />
        </SectionCard>

        <SectionCard title="设计说明" description="用于解释第一版的实现边界。">
          <div className="list">
            <div className="list-item">
              <strong>数据层</strong>
              <p>采用 Node 内置 SQLite 驱动，自动初始化数据表。</p>
            </div>
            <div className="list-item">
              <strong>代理模式</strong>
              <p>当前默认是模拟代理执行器，真实 LLM 接入点已在服务层预留。</p>
            </div>
            <div className="list-item">
              <strong>安全策略</strong>
              <p>所有工作区路径会校验是否越界，命令执行严格走白名单。</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
