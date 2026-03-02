# ClawTown集成Star-Office-UI任务

## 目标
将Star-Office-UI的像素办公室集成到ClawTown中，作为`/pixel-office`页面的内容，复用3001端口。

## 集成方案

### 方案A：iframe嵌入（快速方案）⚠️
在ClawTown的`/pixel-office`页面中用iframe嵌入Star-Office-UI。

**优点：** 快速，不需要大改
**缺点：** 需要Star-Office-UI后端独立运行（18791端口），不够优雅

### 方案B：完全集成（推荐）✅
将Star-Office-UI的后端和前端完全集成到ClawTown中。

**步骤：**

#### 1. 后端集成
将Star-Office-UI的Python后端改造为Next.js API路由：

**文件结构：**
```
app/api/star-office/
├── status/route.ts          # GET /api/star-office/status
├── set-state/route.ts       # POST /api/star-office/set-state
├── agents/route.ts          # GET /api/star-office/agents
├── yesterday-memo/route.ts  # GET /api/star-office/yesterday-memo
└── health/route.ts          # GET /api/star-office/health
```

**实现方式：**
- 读取`state.json`文件（存放在项目根目录或data目录）
- 实现相同的API接口
- 用TypeScript重写Python逻辑

#### 2. 前端资源迁移
将Star-Office-UI的前端资源复制到ClawTown：

```bash
# 图片资源
cp -r Star-Office-UI/frontend/*.{png,webp,gif,jpg} clawtown/public/star-office/

# JS文件
cp Star-Office-UI/frontend/game.js clawtown/public/star-office/
cp Star-Office-UI/frontend/layout.js clawtown/public/star-office/

# HTML（改造为React组件）
# Star-Office-UI/frontend/index.html → clawtown/app/pixel-office/page.tsx
```

#### 3. 页面改造
将`app/pixel-office/page.tsx`改造为Star-Office-UI的前端：

```tsx
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function PixelOfficePage() {
  return (
    <div className="w-full h-screen">
      {/* 加载Phaser.js */}
      <Script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js" />
      
      {/* 加载layout.js */}
      <Script src="/star-office/layout.js" />
      
      {/* 加载game.js */}
      <Script src="/star-office/game.js" />
      
      {/* 游戏容器 */}
      <div id="game-container"></div>
      
      {/* 状态显示 */}
      <div id="status-text"></div>
      
      {/* 昨日小记 */}
      <div id="memo-container">
        <div id="memo-date"></div>
        <div id="memo-content"></div>
      </div>
    </div>
  );
}
```

#### 4. API路由实现示例

**`app/api/star-office/status/route.ts`:**
```typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const statePath = path.join(process.cwd(), 'data', 'star-office-state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ state: 'idle', message: '' }, { status: 200 });
  }
}
```

**`app/api/star-office/set-state/route.ts`:**
```typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { state, message } = await request.json();
    const statePath = path.join(process.cwd(), 'data', 'star-office-state.json');
    
    const stateData = {
      state,
      message,
      timestamp: Date.now()
    };
    
    fs.writeFileSync(statePath, JSON.stringify(stateData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

## 执行计划

### Phase 1: 快速验证（iframe方案）
1. 修改`app/pixel-office/page.tsx`，用iframe嵌入Star-Office-UI
2. 启动Star-Office-UI后端（18791端口）
3. 验证功能是否正常

### Phase 2: 完全集成（推荐方案）
1. 实现API路由（5个接口）
2. 迁移前端资源
3. 改造pixel-office页面
4. 测试验证
5. 关闭Star-Office-UI独立后端

## 推荐方案

**建议先用Phase 1快速验证**，确认Star-Office-UI的UI和功能符合预期后，再执行Phase 2完全集成。

这样可以：
1. 快速看到效果
2. 避免大量改造后发现不合适
3. 分步实施，降低风险

## 需要禹哥决策

1. 是先用iframe快速验证，还是直接完全集成？
2. 是否需要保留原有的ClawTown像素办公室功能，还是完全替换为Star-Office-UI？
