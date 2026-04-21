import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card">
      <h2>页面不存在</h2>
      <p>要查看任务详情，请先在控制台中创建一个任务。</p>
      <div style={{ marginTop: 16 }}>
        <Link className="button-secondary" href="/">
          返回控制台
        </Link>
      </div>
    </div>
  );
}
