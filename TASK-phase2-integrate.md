# Phase 2: 完全集成 Star-Office-UI 到 ClawTown

## 任务概述
将 Star-Office-UI 的像素办公室完全集成到 ClawTown 中，复用 /pixel-office 页面。

## 项目路径
- **Star-Office-UI**: `/root/.openclaw/workspace/projects/Star-Office-UI`
- **ClawTown**: `/root/.openclaw/workspace/projects/clawtown`

## 执行步骤

### 1. 创建 API 路由 (5个接口)

创建以下文件：

**`app/api/star-office/status/route.ts`** - GET /api/star-office/status
- 读取 `data/star-office-state.json`
- 返回状态对象

**`app/api/star-office/set-state/route.ts`** - POST /api/star-office/set-state
- 接收 `{state, detail}`
- 写入 `data/star-office-state.json`

**`app/api/star-office/agents/route.ts`** - GET /api/star-office/agents
- 读取 `data/star-office-agents.json`
- 返回 agents 列表

**`app/api/star-office/yesterday-memo/route.ts`** - GET /api/star-office/yesterday-memo
- 从 memory 目录读取昨日的 .md 文件
- 返回格式化后的 memo

**`app/api/star-office/health/route.ts`** - GET /api/star-office/health
- 健康检查，返回 `{status: "ok", timestamp: ...}`

### 2. 迁移前端资源

```bash
# 创建目录
mkdir -p clawtown/public/star-office

# 复制图片资源 (webp优先)
cp Star-Office-UI/frontend/*.webp clawtown/public/star-office/

# 复制JS文件
cp Star-Office-UI/frontend/game.js clawtown/public/star-office/
cp Star-Office-UI/frontend/layout.js clawtown/public/star-office/
```

### 3. 修改 game.js 中的 API 路径

将以下路径修改为 `/api/star-office/xxx`:
- `/status` → `/api/star-office/status`
- `/set_state` → `/api/star-office/set-state`
- `/agents` → `/api/star-office/agents`
- `/yesterday-memo` → `/api/star-office/yesterday-memo`

### 4. 创建状态文件

```bash
# 创建 data 目录
mkdir -p clawtown/data

# 创建初始状态文件
# data/star-office-state.json
{
  "state": "idle",
  "detail": "等待任务中...",
  "progress": 0,
  "updated_at": "2024-01-01T00:00:00.000Z"
}

# data/star-office-agents.json (默认agent列表)
[
  {
    "agentId": "star",
    "name": "Star",
    "isMain": true,
    "state": "idle",
    "detail": "待命中，随时准备为你服务",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "area": "breakroom",
    "source": "local",
    "joinKey": null,
    "authStatus": "approved",
    "authExpiresAt": null,
    "lastPushAt": null
  }
]
```

### 5. 改造 pixel-office 页面

将 `app/pixel-office/page.tsx` 完全替换为 Star-Office-UI 的前端：

```tsx
'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export default function PixelOfficePage() {
  useEffect(() => {
    // 初始化游戏
    if (typeof window !== 'undefined' && (window as any).initGame) {
      (window as any).initGame()
    }
  }, [])

  return (
    <div className="w-full h-screen bg-[#0f0f1a]">
      {/* 加载 Phaser.js */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"
        strategy="beforeInteractive"
      />
      
      {/* 加载 layout.js */}
      <Script src="/star-office/layout.js" strategy="beforeInteractive" />
      
      {/* 加载 game.js */}
      <Script src="/star-office/game.js" strategy="afterInteractive" 
        onLoad={() => {
          if (typeof window !== 'undefined' && (window as any).initGame) {
            (window as any).initGame()
          }
        }}
      />
      
      {/* 游戏容器 */}
      <div id="game-container" className="w-full h-full"></div>
      
      {/* 加载遮罩 */}
      <div id="loading-overlay" className="absolute inset-0 bg-[#0f0f1a] flex items-center justify-center z-50">
        <div id="loading-progress-container" className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
          <div id="loading-progress-bar" className="h-full bg-yellow-400 transition-all duration-200" style={{width: '0%'}}></div>
        </div>
        <div id="loading-text" className="absolute mt-4 text-yellow-400 text-sm">正在加载 Star 的像素办公室...</div>
      </div>
    </div>
  )
}
```

### 6. 测试验证

```bash
cd clawtown
npm run build
```

### 7. Git 提交

```bash
cd clawtown
git add .
git commit -m "feat: 集成Star-Office-UI到ClawTown"
git push
```

## 注意事项

1. **保留黑色幽默**: game.js 中的 BUBBLE_TEXTS 黑色幽默文字必须保留
2. **使用 Claude Code**: 必须使用 `claude -p` 执行代码修改
3. **工作目录**: 所有命令在 clawtown 目录下执行
4. **API 路径**: 所有 API 调用使用 `/api/star-office/xxx` 格式
