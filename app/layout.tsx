import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/config";
import { getSettings } from "@/lib/services/settings-service";
import "./globals.css";

export const dynamic = "force-dynamic";

const navigation = [
  { href: "/", label: "控制台" },
  { href: "/history", label: "历史会话" },
  { href: "/workspace", label: "工作区浏览" },
  { href: "/tests", label: "测试记录" },
  { href: "/settings", label: "系统设置" }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  const settings = getSettings();

  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <h1 className="sidebar-title">{APP_NAME}</h1>
            <p className="sidebar-subtitle">本地可运行、可审批、可记录的教学型编码代理实验平台。</p>

            <nav className="nav-list">
              {navigation.map((item) => (
                <Link className="nav-link" href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="workspace-chip">
              <div className="workspace-chip-label">当前工作区</div>
              <div className="workspace-chip-path">{settings.workspaceRoot}</div>
              <div className="workspace-chip-meta">
                <span className="workspace-chip-meta-label">模式</span>
                <span>{settings.mode === "mock" ? "模拟代理" : "真实代理占位"}</span>
              </div>
            </div>
          </aside>

          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
