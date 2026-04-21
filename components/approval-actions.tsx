"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApprovalActionsProps = {
  approvalId: string;
  disabled?: boolean;
};

export function ApprovalActions({ approvalId, disabled }: ApprovalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  async function submit(action: "approve" | "reject") {
    setLoading(action);
    setError("");

    try {
      const response = await fetch(`/api/approvals/${approvalId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer: "local-admin",
          comment: action === "approve" ? "已在界面中批准执行。" : "已在界面中拒绝执行。"
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "审批操作失败。");
      }

      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "审批操作失败。");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="form-grid">
      <div className="button-row">
        <button className="button" disabled={disabled || Boolean(loading)} onClick={() => submit("approve")} type="button">
          {loading === "approve" ? "批准中..." : "允许"}
        </button>
        <button
          className="button-danger"
          disabled={disabled || Boolean(loading)}
          onClick={() => submit("reject")}
          type="button"
        >
          {loading === "reject" ? "拒绝中..." : "拒绝"}
        </button>
      </div>
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
