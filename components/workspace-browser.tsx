"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { WorkspaceNode } from "@/lib/types";

type WorkspaceBrowserProps = {
  initialNodes: WorkspaceNode[];
};

type TreeMap = Record<string, WorkspaceNode[]>;

function normalizeQuery(value: string) {
  return value.trim();
}

export function WorkspaceBrowser({ initialNodes }: WorkspaceBrowserProps) {
  const [tree, setTree] = useState<TreeMap>({ ".": initialNodes });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ ".": true });
  const [selectedPath, setSelectedPath] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<WorkspaceNode[]>([]);
  const [fileContent, setFileContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const activeNodes = useMemo(() => (searchResults.length > 0 ? searchResults : tree["."] ?? []), [searchResults, tree]);

  async function fetchTree(targetPath: string) {
    const response = await fetch(`/api/workspace/tree?path=${encodeURIComponent(targetPath)}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "目录读取失败。");
    }
    setTree((current) => ({ ...current, [targetPath]: payload.tree }));
  }

  async function openNode(node: WorkspaceNode) {
    setMessage("");
    if (node.type === "directory") {
      const nextExpanded = !expanded[node.path];
      setExpanded((current) => ({ ...current, [node.path]: nextExpanded }));
      if (nextExpanded && !tree[node.path]) {
        setLoading(true);
        try {
          await fetchTree(node.path);
        } catch (caughtError) {
          setMessage(caughtError instanceof Error ? caughtError.message : "目录读取失败。");
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    setSelectedPath(node.path);
    setLoading(true);
    try {
      const response = await fetch(`/api/workspace/file?path=${encodeURIComponent(node.path)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "文件读取失败。");
      }
      setFileContent(payload.file.content);
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "文件读取失败。");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    const query = normalizeQuery(search);
    if (!query) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/workspace/tree?search=${encodeURIComponent(query)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "搜索失败。");
      }
      setSearchResults(payload.tree);
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "搜索失败。");
    } finally {
      setLoading(false);
    }
  }

  async function saveFile() {
    if (!selectedPath) {
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/workspace/file/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: selectedPath,
          content: fileContent
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "文件保存失败。");
      }
      setMessage(`已保存 ${payload.result.path}`);
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "文件保存失败。");
    } finally {
      setLoading(false);
    }
  }

  function renderChildren(parentPath: string, depth = 0): ReactNode {
    const nodes = parentPath === "." ? activeNodes : tree[parentPath] ?? [];
    return nodes.map((node) => (
      <div key={`${parentPath}:${node.path}`}>
        <button
          className="tree-node"
          style={{ paddingLeft: 10 + depth * 18 }}
          type="button"
          onClick={() => openNode(node)}
        >
          <span>{node.type === "directory" ? (expanded[node.path] ? "▾" : "▸") : "•"}</span>
          <span className="tree-node-label">{node.name}</span>
          {node.modified ? <span className="pill">已修改</span> : null}
        </button>
        {node.type === "directory" && expanded[node.path] ? renderChildren(node.path, depth + 1) : null}
      </div>
    ));
  }

  return (
    <div className="two-column-panel">
      <div className="workspace-tree">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="workspace-search">文件搜索</label>
            <div className="button-row">
              <input
                id="workspace-search"
                className="input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="输入文件名关键字"
              />
              <button className="button-secondary" type="button" onClick={handleSearch}>
                搜索
              </button>
            </div>
          </div>
          <div>{renderChildren(".")}</div>
        </div>
      </div>

      <div className="split-view">
        <div className="card">
          <div className="editor-header">
            <div>
              <h2>文件内容</h2>
              <p>{selectedPath || "请选择左侧文件"}</p>
            </div>
            <div className="button-row">
              <button className="button" type="button" onClick={saveFile} disabled={!selectedPath || loading}>
                保存文件
              </button>
            </div>
          </div>
          <textarea
            className="textarea"
            style={{ minHeight: 420, marginTop: 14 }}
            value={fileContent}
            onChange={(event) => setFileContent(event.target.value)}
            placeholder="打开文件后即可查看和编辑内容。"
          />
        </div>

        <div className="card">
          <h2>提示</h2>
          <p>工作区页面支持目录树懒加载、文件查看、文件搜索和直接保存。</p>
          {message ? <div className="alert" style={{ marginTop: 14 }}>{message}</div> : null}
          {loading ? <div className="alert" style={{ marginTop: 14 }}>正在处理请求，请稍候…</div> : null}
        </div>
      </div>
    </div>
  );
}
