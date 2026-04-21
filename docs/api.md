# API 说明

## 任务管理

### `GET /api/tasks`

返回任务列表。

### `POST /api/tasks`

创建任务并立即触发模拟代理执行。

请求体示例：

```json
{
  "title": "修复测试失败",
  "description": "分析项目并修复 failing tests",
  "workspacePath": "C:/demo/workspace",
  "autoRunTests": true,
  "approvalEnabled": true
}
```

### `GET /api/tasks/:id`

返回任务详情，包含步骤、命令、文件变更、审批、测试记录和摘要。

### `DELETE /api/tasks/:id`

删除任务及其关联数据。

### `POST /api/tasks/:id/rerun`

清空任务历史执行记录并重新运行模拟代理。

## 工作区

### `GET /api/workspace/tree?path=.&search=`

- `path`：目录路径，默认 `.`。
- `search`：按文件名搜索。

### `GET /api/workspace/file?path=src/index.js`

返回指定文件内容。

### `POST /api/workspace/file/update`

请求体示例：

```json
{
  "path": "src/index.js",
  "content": "console.log('hello')"
}
```

### `GET /api/workspace/git-status`

返回工作区 Git 分支、变更文件和最近一次提交。

### `GET /api/workspace/diff?path=.agent-lab/task_xxx.md`

返回指定文件的最近 diff 文本。

## 命令执行

### `POST /api/commands/run`

请求体示例：

```json
{
  "taskId": "task_xxx",
  "command": "node src/index.js",
  "cwd": "C:/demo/workspace",
  "requireApproval": true
}
```

### `GET /api/commands/:id`

查询命令执行记录。

### `POST /api/commands/:id/stop`

尝试停止一个仍在运行的命令。

## 审批

### `GET /api/approvals/pending`

返回全部待审批记录。

### `POST /api/approvals/:id/approve`

### `POST /api/approvals/:id/reject`

请求体示例：

```json
{
  "reviewer": "local-admin",
  "comment": "批准执行"
}
```

## 测试

### `POST /api/tests/run`

请求体示例：

```json
{
  "taskId": "task_xxx",
  "requireApproval": true
}
```

### `GET /api/tests/:id`

返回单条测试记录。

## 设置

### `GET /api/settings`

返回平台当前设置。

### `POST /api/settings`

请求体示例：

```json
{
  "workspaceRoot": "C:/demo/workspace",
  "allowShellExecution": true,
  "approvalRequired": true,
  "defaultTestCommand": "node tests/smoke.test.js",
  "commandWhitelist": ["node", "git", "npm"],
  "mode": "mock",
  "approvalThreshold": 3,
  "logRetentionDays": 14
}
```
