# ClawTown 定时任务删除功能

## 需求概述
在定时任务卡片上添加删除按钮，支持删除定时任务并清理核心文件中的相关引用。

---

## 1. 定时任务卡片新增删除按钮

### 位置
在任务卡片底部，与状态信息并列

### UI设计
```tsx
<div className="mt-auto flex items-center justify-between">
  <div className="flex items-center gap-2">
    <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>
      {statusText}
    </span>
    {job.state?.nextRunAtMs && (
      <span className="text-xs text-[var(--text-muted)]">
        下次: {formatRelativeTime(job.state.nextRunAtMs)}
      </span>
    )}
  </div>
  <button
    onClick={() => handleDelete(job.id, job.name)}
    className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition"
  >
    🗑️ 删除
  </button>
</div>
```

---

## 2. 二次确认对话框

### 对话框内容
```tsx
{deleteTarget && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 max-w-md">
      <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ 危险操作</h3>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        确定要删除定时任务 <strong className="text-[var(--text)]">{deleteTarget.name}</strong> 吗？
        此操作将：
      </p>
      <ul className="text-xs text-[var(--text-muted)] mb-4 space-y-1">
        <li>• 从 cron/jobs.json 中删除该任务</li>
        <li>• 清理核心文件中的相关引用（HEARTBEAT.md、AGENTS.md等）</li>
        <li>• 此操作不可撤销</li>
      </ul>
      <div className="flex gap-2">
        <button
          onClick={() => setDeleteTarget(null)}
          className="flex-1 px-4 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm hover:border-[var(--accent)] transition"
        >
          取消
        </button>
        <button
          onClick={confirmDelete}
          className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition"
        >
          确认删除
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 3. 删除API

### `/api/cron-jobs/[agentId]/[jobId]/route.ts`

**DELETE方法实现：**
```typescript
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OPENCLAW_HOME = process.env.OPENCLAW_HOME || path.join(process.env.HOME || "", ".openclaw");

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ agentId: string; jobId: string }> }
) {
  const { agentId, jobId } = await params;
  
  try {
    // 1. 读取 cron/jobs.json
    const cronJobsPath = path.join(OPENCLAW_HOME, "cron", "jobs.json");
    const fileContent = fs.readFileSync(cronJobsPath, "utf-8");
    const data = JSON.parse(fileContent);
    
    // 2. 找到要删除的任务
    const jobIndex = data.jobs.findIndex((job: any) => job.id === jobId);
    if (jobIndex === -1) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }
    
    const job = data.jobs[jobIndex];
    const jobName = job.name;
    
    // 3. 从数组中删除
    data.jobs.splice(jobIndex, 1);
    
    // 4. 写回 cron/jobs.json
    fs.writeFileSync(cronJobsPath, JSON.stringify(data, null, 2), "utf-8");
    
    // 5. 清理核心文件中的引用
    const workspacePath = path.join(OPENCLAW_HOME, "workspace");
    const filesToCheck = [
      path.join(workspacePath, "HEARTBEAT.md"),
      path.join(workspacePath, "AGENTS.md"),
      path.join(workspacePath, "cognition.md"),
      path.join(workspacePath, "MEMORY.md"),
    ];
    
    for (const file of filesToCheck) {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, "utf-8");
        
        // 移除包含任务名称或ID的行
        const lines = content.split("\n");
        const filtered = lines.filter(line => {
          const lower = line.toLowerCase();
          const nameLower = jobName.toLowerCase();
          return !lower.includes(nameLower) && !lower.includes(jobId);
        });
        
        if (filtered.length !== lines.length) {
          fs.writeFileSync(file, filtered.join("\n"), "utf-8");
        }
      }
    }
    
    return NextResponse.json({ success: true, deletedJob: jobName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 4. 前端删除逻辑

### 状态管理
```tsx
const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

const handleDelete = (jobId: string, jobName: string) => {
  setDeleteTarget({ id: jobId, name: jobName });
};

const confirmDelete = async () => {
  if (!deleteTarget) return;
  
  try {
    const res = await fetch(`/api/cron-jobs/${agentId}/${deleteTarget.id}`, {
      method: "DELETE",
    });
    
    if (!res.ok) throw new Error("删除失败");
    
    // 刷新任务列表
    fetchJobs();
    setDeleteTarget(null);
  } catch (e: any) {
    alert("删除失败：" + e.message);
  }
};
```

---

## 5. i18n翻译

### 中文（zh）
```json
{
  "cronJobs": {
    "delete": "删除",
    "deleteConfirm": "确认删除",
    "deleteWarning": "危险操作",
    "deleteMessage": "确定要删除定时任务吗？",
    "deleteActions": [
      "从 cron/jobs.json 中删除该任务",
      "清理核心文件中的相关引用",
      "此操作不可撤销"
    ]
  }
}
```

---

## 6. 验证清单

- [ ] 定时任务卡片显示删除按钮
- [ ] 点击删除按钮弹出二次确认对话框
- [ ] 对话框显示危险操作警告
- [ ] 确认删除后调用DELETE API
- [ ] API成功删除 cron/jobs.json 中的任务
- [ ] API清理核心文件中的相关引用
- [ ] 删除成功后刷新任务列表
- [ ] build无错误
- [ ] commit并push

---

## 7. 注意事项

1. **核心文件清理**：只删除包含任务名称或ID的行，避免误删其他内容
2. **错误处理**：删除失败时显示友好的错误提示
3. **权限检查**：确保有权限写入 cron/jobs.json 和核心文件
4. **原子操作**：先删除任务，再清理文件引用，避免部分失败
5. **日志记录**：可选：记录删除操作到日志文件
