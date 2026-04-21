"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Settings } from "@/lib/types";

type SettingsFormProps = {
  settings: Settings;
};

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    workspaceRoot: settings.workspaceRoot,
    allowShellExecution: settings.allowShellExecution,
    approvalRequired: settings.approvalRequired,
    defaultTestCommand: settings.defaultTestCommand,
    commandWhitelist: settings.commandWhitelist.join(", "),
    mode: settings.mode,
    approvalThreshold: String(settings.approvalThreshold),
    logRetentionDays: String(settings.logRetentionDays)
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function patchField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceRoot: form.workspaceRoot,
          allowShellExecution: form.allowShellExecution,
          approvalRequired: form.approvalRequired,
          defaultTestCommand: form.defaultTestCommand,
          commandWhitelist: form.commandWhitelist
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          mode: form.mode,
          approvalThreshold: Number(form.approvalThreshold),
          logRetentionDays: Number(form.logRetentionDays)
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "设置保存失败。");
      }

      setMessage("设置已更新。");
      router.refresh();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "设置保存失败。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="workspaceRoot">工作区根目录</label>
        <input
          id="workspaceRoot"
          className="input"
          value={form.workspaceRoot}
          onChange={(event) => patchField("workspaceRoot", event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="defaultTestCommand">默认测试命令</label>
        <input
          id="defaultTestCommand"
          className="input"
          value={form.defaultTestCommand}
          onChange={(event) => patchField("defaultTestCommand", event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="commandWhitelist">命令白名单</label>
        <textarea
          id="commandWhitelist"
          className="textarea"
          value={form.commandWhitelist}
          onChange={(event) => patchField("commandWhitelist", event.target.value)}
        />
      </div>

      <div className="grid grid-2">
        <div className="field">
          <label htmlFor="approvalThreshold">审批阈值</label>
          <input
            id="approvalThreshold"
            className="input"
            type="number"
            value={form.approvalThreshold}
            onChange={(event) => patchField("approvalThreshold", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="logRetentionDays">日志保留天数</label>
          <input
            id="logRetentionDays"
            className="input"
            type="number"
            value={form.logRetentionDays}
            onChange={(event) => patchField("logRetentionDays", event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="mode">代理模式</label>
        <select id="mode" className="select" value={form.mode} onChange={(event) => patchField("mode", event.target.value as "mock" | "live")}>
          <option value="mock">模拟代理模式</option>
          <option value="live">真实代理模式占位</option>
        </select>
      </div>

      <div className="checkbox-row">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.allowShellExecution}
            onChange={(event) => patchField("allowShellExecution", event.target.checked)}
          />
          允许执行命令
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.approvalRequired}
            onChange={(event) => patchField("approvalRequired", event.target.checked)}
          />
          所有高风险动作默认审批
        </label>
      </div>

      {message ? <div className="alert">{message}</div> : null}

      <div className="button-row">
        <button className="button" type="submit" disabled={saving}>
          {saving ? "保存中..." : "保存设置"}
        </button>
      </div>
    </form>
  );
}
