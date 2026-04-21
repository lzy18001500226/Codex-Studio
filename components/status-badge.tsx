type StatusBadgeProps = {
  status: string;
};

const labelMap: Record<string, string> = {
  pending: "待处理",
  planning: "规划中",
  waiting_approval: "待审批",
  running: "执行中",
  testing: "测试中",
  completed: "已完成",
  failed: "失败",
  rejected: "已拒绝",
  approved: "已批准",
  passed: "通过",
  stopped: "已停止"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`badge ${status}`}>{labelMap[status] ?? status}</span>;
}
