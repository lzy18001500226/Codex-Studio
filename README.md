# Codex Local Agent Lab

一个基于 Next.js + TypeScript + SQLite 的本地编码代理实验平台，用于教学展示本地代理任务、审批、文件浏览、命令执行和测试闭环。

## 功能概览

- 控制台：创建任务、查看统计卡片、最近任务与待审批项
- 任务详情：展示执行计划、时间线、命令输出、文件 diff、审批面板、测试结果与最终摘要
- 工作区浏览：支持目录树、文件搜索、文件查看与直接保存
- 历史会话：按状态和日期筛选历史任务
- 系统设置：配置工作区根目录、命令白名单、测试命令、审批策略和代理模式
- 测试记录：集中查看所有任务中的测试执行历史

## 技术方案

- 前端与 API：Next.js App Router + TypeScript
- 数据存储：Node 内置 `node:sqlite`，数据库文件默认位于 `data/codex-lab.db`
- 本地执行层：`child_process` 执行命令，文件操作通过 `fs/promises`
- 安全约束：
  - 所有文件路径必须落在工作区根目录内
  - 命令执行必须通过白名单校验
  - 命令和测试默认走审批流程

## 快速启动

1. 安装依赖

```bash
npm install
```

2. 准备环境变量

```bash
copy .env.example .env.local
```

3. 启动开发服务器

```bash
npm run dev
```

4. 打开浏览器

```text
http://localhost:3000
```

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `CODEX_LAB_DB_PATH` | SQLite 数据库路径 | `./data/codex-lab.db` |
| `CODEX_LAB_WORKSPACE_ROOT` | 工作区根目录 | `./workspace/demo-project` |

## 数据库初始化说明

- 项目启动后首次访问页面或 API 时会自动创建 SQLite 数据库与数据表
- 默认会自动写入一条系统设置记录
- 不需要手动执行 Prisma migrate

## 页面说明

- `/`：控制台
- `/tasks/:id`：任务详情页
- `/workspace`：工作区浏览页
- `/history`：历史会话页
- `/tests`：测试记录页
- `/settings`：系统设置页

## 核心 API

详细接口清单见 [docs/api.md](./docs/api.md)。

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `POST /api/tasks/:id/rerun`
- `GET /api/workspace/tree`
- `GET /api/workspace/file`
- `POST /api/workspace/file/update`
- `POST /api/commands/run`
- `GET /api/approvals/pending`
- `POST /api/approvals/:id/approve`
- `POST /api/approvals/:id/reject`
- `POST /api/tests/run`
- `GET /api/settings`
- `POST /api/settings`

## 示例工作区

`workspace/demo-project` 提供了一个最小示例工程：

- `src/index.js`：可直接运行的入口文件
- `tests/smoke.test.js`：默认测试命令
- `.agent-lab/`：任务执行后自动写入的代理说明目录

## 页面截图占位

截图占位说明见 [docs/screenshots/README.md](./docs/screenshots/README.md)。

## 后续扩展建议

- 接入真实 OpenAI API 与工具调用
- 用 WebSocket 推送实时日志和状态变更
- 将当前 SQLite 仓储层切换为 Prisma + SQLite
- 增加多工作区、多用户和更细粒度审批策略
