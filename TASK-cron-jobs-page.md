# ClawTown 新功能：定时任务列表

## 需求概述
在侧边栏"技能列表"下方新增"定时任务"导航项，点击后显示所有agent卡片，点击agent卡片后展示该agent的定时任务列表。

---

## 1. 侧边栏导航新增

### 位置
在"📦 技能列表"下方新增：
- ⏰ 定时任务 (`/cron-jobs`)

### 文件修改
`app/sidebar.tsx` 或 `app/layout.tsx`

---

## 2. 定时任务列表页 (`/cron-jobs`)

### 页面结构
```
┌─────────────────────────────────────┐
│ ⏰ 定时任务                         │
│ 选择Agent查看定时任务                │
├─────────────────────────────────────┤
│ ┌─────┐  ┌─────┐  ┌─────┐          │
│ │ 🤖  │  │ 🤖  │  │ 🤖  │          │
│ │酪酪 │  │子代理│  │...  │          │
│ └─────┘  └─────┘  └─────┘          │
└─────────────────────────────────────┘
```

### Agent卡片点击后
展开显示该agent的定时任务列表：

```
┌─────────────────────────────────────┐
│ 🤖 酪酪 的定时任务                   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ⏰ 晚餐确认-禹哥                  │ │
│ │ 每天 19:00 (Asia/Shanghai)      │ │
│ │ 状态: ✅ 正常 | 下次: 2小时后     │ │
│ │ 检查晚餐提醒...                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⏰ 每晚复盘-禹哥                  │ │
│ │ 每天 20:00 (Asia/Shanghai)      │ │
│ │ 状态: ✅ 正常 | 下次: 3小时后     │ │
│ │ 每晚复盘时间...                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 定时任务卡片信息
- **名称**：任务名称（如 `晚餐确认-禹哥`）
- **ID**：任务ID（可选，鼠标悬停显示）
- **调度表达式**：cron表达式 + 时区（如 `每天 19:00 (Asia/Shanghai)`）
- **状态**：✅ 正常 / ❌ 错误 / ⏸️ 禁用
- **下次运行**：相对时间（如 `2小时后`）
- **上次运行**：相对时间（如 `22小时前`）
- **描述**：任务的payload.message（截取前100字符）

---

## 3. API设计

### `/api/cron-jobs/[agentId]` - 获取agent的定时任务列表

**实现方式：**
使用 `exec` 调用 `openclaw cron list --json` 命令

**返回格式：**
```json
{
  "agentId": "main",
  "agentName": "酪酪",
  "jobs": [
    {
      "id": "39ab949a-1198-4d7c-862d-8aaa04cc47a1",
      "name": "晚餐确认-禹哥",
      "enabled": true,
      "schedule": {
        "kind": "cron",
        "expr": "0 19 * * *",
        "tz": "Asia/Shanghai"
      },
      "sessionTarget": "isolated",
      "payload": {
        "kind": "agentTurn",
        "message": "检查晚餐提醒..."
      },
      "state": {
        "nextRunAtMs": 1772362800000,
        "lastRunAtMs": 1772276400008,
        "lastStatus": "ok",
        "lastDurationMs": 17682
      }
    }
  ]
}
```

**实现逻辑：**
```typescript
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  
  try {
    // 调用 openclaw cron list --json
    const { stdout } = await execAsync("openclaw cron list --json");
    const data = JSON.parse(stdout);
    
    // 过滤出属于该agent的任务（根据sessionTarget或其他字段）
    // 注意：OpenClaw的cron任务可能没有明确的agentId字段
    // 可能需要根据实际情况调整过滤逻辑
    
    const jobs = data.jobs || [];
    
    // 获取agent名称
    const configRes = await fetch(`http://localhost:3001/api/config`);
    const configData = await configRes.json();
    const agent = configData.agents?.find((a: any) => a.id === agentId);
    const agentName = agent?.name || agentId;
    
    return NextResponse.json({
      agentId,
      agentName,
      jobs
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 4. 前端页面实现

### 文件结构
```
app/
  cron-jobs/
    page.tsx          # 定时任务列表页
  api/
    cron-jobs/
      [agentId]/
        route.ts      # 定时任务列表API
```

### 页面交互
1. 初始状态：显示所有agent卡片（复用 `/api/config` 获取agent列表）
2. 点击agent卡片：展开显示该agent的定时任务卡片
3. 定时任务卡片：不可点击，纯展示

### 样式要求
- 复用现有的卡片样式（参考 `/skills` 页面）
- 状态用不同颜色区分（✅ 绿色 / ❌ 红色 / ⏸️ 灰色）
- 时间显示用相对时间（如 `2小时后`、`22小时前`）

---

## 5. 时间格式化

### 相对时间显示
```typescript
function formatRelativeTime(timestampMs: number): string {
  const now = Date.now();
  const diff = timestampMs - now;
  const absDiff = Math.abs(diff);
  
  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);
  
  if (minutes < 60) {
    return diff > 0 ? `${minutes}分钟后` : `${minutes}分钟前`;
  } else if (hours < 24) {
    return diff > 0 ? `${hours}小时后` : `${hours}小时前`;
  } else {
    return diff > 0 ? `${days}天后` : `${days}天前`;
  }
}
```

### Cron表达式解析
```typescript
function parseCronSchedule(schedule: any): string {
  if (schedule.kind === "cron") {
    const expr = schedule.expr; // "0 19 * * *"
    const tz = schedule.tz || "UTC";
    
    // 简单解析（可以用库如 cron-parser）
    const parts = expr.split(" ");
    const minute = parts[0];
    const hour = parts[1];
    
    return `每天 ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} (${tz})`;
  }
  
  return "未知调度";
}
```

---

## 6. i18n翻译

### 中文（zh）
```json
{
  "cronJobs": {
    "title": "定时任务",
    "selectAgent": "选择Agent查看定时任务",
    "jobsOf": "的定时任务",
    "status": "状态",
    "nextRun": "下次运行",
    "lastRun": "上次运行",
    "schedule": "调度",
    "enabled": "启用",
    "disabled": "禁用",
    "statusOk": "正常",
    "statusError": "错误",
    "statusIdle": "空闲"
  }
}
```

### 英文（en）
```json
{
  "cronJobs": {
    "title": "Cron Jobs",
    "selectAgent": "Select an agent to view cron jobs",
    "jobsOf": "'s Cron Jobs",
    "status": "Status",
    "nextRun": "Next Run",
    "lastRun": "Last Run",
    "schedule": "Schedule",
    "enabled": "Enabled",
    "disabled": "Disabled",
    "statusOk": "OK",
    "statusError": "Error",
    "statusIdle": "Idle"
  }
}
```

---

## 7. 注意事项

1. **Agent过滤**：OpenClaw的cron任务可能没有明确的agentId字段，需要根据实际情况调整过滤逻辑
2. **权限问题**：`openclaw cron list` 命令可能需要特定权限，确保API能正常调用
3. **错误处理**：命令执行失败时显示友好的错误提示
4. **性能优化**：cron list可能返回大量数据，考虑缓存或分页
5. **时区处理**：正确显示时区信息，避免混淆

---

## 8. 验证清单

- [ ] 侧边栏新增"定时任务"导航项
- [ ] `/cron-jobs` 页面显示所有agent卡片
- [ ] 点击agent卡片展开显示定时任务列表
- [ ] 定时任务卡片显示名称、调度、状态、时间
- [ ] API `/api/cron-jobs/[agentId]` 返回正确数据
- [ ] 时间显示为相对时间（如 `2小时后`）
- [ ] 状态用不同颜色区分
- [ ] build无错误
- [ ] commit并push

---

## 9. 参考命令

```bash
# 列出所有定时任务
openclaw cron list

# JSON格式输出
openclaw cron list --json

# 查看特定任务详情
openclaw cron status <job-id>
```
