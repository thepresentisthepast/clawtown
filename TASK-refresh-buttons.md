# ClawTown 刷新按钮功能

## 需求概述
在会话列表页和会话详情面板添加刷新按钮，方便用户手动刷新数据。

---

## 1. 会话列表页刷新按钮

### 位置
在页面标题区域右上角，"返回"按钮旁边

### UI设计
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold">📋 {agentName} {t("sessions.title")}</h1>
    {agentName !== agentId && (
      <p className="text-xs text-[var(--text-muted)] mt-0.5">Agent ID: {agentId}</p>
    )}
    <p className="text-[var(--text-muted)] text-sm mt-1">
      {filtered.length} {t("sessions.sessionCount")} · {t("sessions.totalToken")}: {(totalTokens / 1000).toFixed(1)}k
    </p>
  </div>
  <div className="flex gap-2">
    <button 
      onClick={fetchSessions}
      disabled={loading}
      className="px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm hover:border-[var(--accent)] transition disabled:opacity-50"
      title="刷新会话列表"
    >
      🔄 {loading ? "刷新中..." : "刷新"}
    </button>
    <Link href="/sessions" className="px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm hover:border-[var(--accent)] transition">
      {t("sessions.backToAgents")}
    </Link>
  </div>
</div>
```

### 功能逻辑
- 点击刷新按钮调用 `fetchSessions()` 函数
- 刷新期间按钮显示"刷新中..."并禁用
- 刷新完成后自动更新会话列表

---

## 2. 会话详情面板刷新按钮

### 位置
在会话详情面板的标题栏右侧，关闭按钮旁边

### UI设计
```tsx
<div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
  <div>
    <h3 className="text-lg font-semibold text-[var(--text)]">
      {getTypeLabel(sessionType).emoji} {getTypeLabel(sessionType).label}
    </h3>
    <p className="text-xs text-[var(--text-muted)] mt-0.5">
      Session ID: {sessionId.slice(0, 8)}...
    </p>
  </div>
  <div className="flex gap-2">
    <button
      onClick={fetchDetail}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs hover:border-[var(--accent)] transition disabled:opacity-50"
      title="刷新消息列表"
    >
      🔄 {loading ? "刷新中..." : "刷新"}
    </button>
    <button
      onClick={onClose}
      className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs hover:border-[var(--accent)] transition"
    >
      ✕ 关闭
    </button>
  </div>
</div>
```

### 功能逻辑
- 点击刷新按钮调用 `fetchDetail()` 函数
- 刷新期间按钮显示"刷新中..."并禁用
- 刷新完成后自动更新消息列表
- 保持当前的展开/收起状态（不重置 `expandedMessages`）

---

## 3. 实现细节

### 会话列表页（`app/sessions/page.tsx`）

**当前代码结构：**
```tsx
function SessionList({ agentId }: { agentId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchSessions = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchWithRetry(`/api/sessions/${agentId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          const filtered = (data.sessions || []).filter((s: Session) =>
            !(s.type === "cron" && s.key.includes(":run:"))
          );
          setSessions(filtered);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [agentId]);
  
  // ...
}
```

**修改点：**
- 在标题区域添加刷新按钮
- 按钮调用 `fetchSessions` 函数
- 刷新期间显示loading状态

### 会话详情面板（`app/sessions/page.tsx` 中的 `SessionDetailPanel`）

**当前代码结构：**
```tsx
function SessionDetailPanel({ agentId, sessionId, onClose }: Props) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchDetail = useCallback(() => {
    setLoading(true);
    fetchWithRetry(`/api/sessions/${agentId}/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setDetail(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [agentId, sessionId]);
  
  // ...
}
```

**修改点：**
- 在标题栏添加刷新按钮
- 按钮调用 `fetchDetail` 函数
- 刷新期间显示loading状态
- 刷新不影响 `expandedMessages` 状态

---

## 4. i18n翻译

### 中文（zh）
```json
{
  "sessions": {
    "refresh": "刷新",
    "refreshing": "刷新中...",
    "refreshList": "刷新会话列表",
    "refreshMessages": "刷新消息列表"
  }
}
```

### 英文（en）
```json
{
  "sessions": {
    "refresh": "Refresh",
    "refreshing": "Refreshing...",
    "refreshList": "Refresh session list",
    "refreshMessages": "Refresh messages"
  }
}
```

---

## 5. 验证清单

- [ ] 会话列表页右上角显示刷新按钮
- [ ] 点击刷新按钮重新获取会话列表
- [ ] 刷新期间按钮显示"刷新中..."并禁用
- [ ] 会话详情面板标题栏显示刷新按钮
- [ ] 点击刷新按钮重新获取消息列表
- [ ] 刷新不影响消息的展开/收起状态
- [ ] 刷新期间按钮显示loading状态
- [ ] build无错误
- [ ] commit并push

---

## 6. 注意事项

1. **loading状态管理：** 刷新期间禁用按钮，避免重复请求
2. **错误处理：** 刷新失败时显示错误提示
3. **状态保持：** 会话详情刷新时不重置展开/收起状态
4. **响应式设计：** 按钮在移动端也要正常显示
5. **用户体验：** 刷新按钮样式与现有按钮保持一致
