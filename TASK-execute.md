# ClawTown 像素办公室优化 - 执行任务

## 项目路径
`/root/.openclaw/workspace/projects/clawtown`

## 任务1: 漫游逻辑优化（减小停顿时间）

### 当前值
文件: `lib/pixel-office/constants.ts`
```typescript
export const WANDER_PAUSE_MIN_SEC = 1.0
export const WANDER_PAUSE_MAX_SEC = 8.0
```

### 目标值
- WANDER_PAUSE_MIN_SEC = 0.5
- WANDER_PAUSE_MAX_SEC = 2.0

### 操作
修改 constants.ts 中的这两个常量值。

---

## 任务2: 坐椅子概率优化（提高坐椅子频率）

### 当前值
```typescript
export const WANDER_MOVES_BEFORE_REST_MIN = 3
export const WANDER_MOVES_BEFORE_REST_MAX = 6
```

### 目标值
- WANDER_MOVES_BEFORE_REST_MIN = 2
- WANDER_MOVES_BEFORE_REST_MAX = 5

### 操作
修改 constants.ts 中的这两个常量值。

---

## 任务3: 程序员黑色幽默文字（坐椅子后显示文案）

### 需求
agent坐下后，从程序员黑色幽默文案列表中随机选择一条，显示在头顶气泡中，持续3-5秒后消失。

### 实现位置
1. `lib/pixel-office/types.ts` - Character接口添加 `programmerQuote: string | null` 和 `programmerQuoteTimer: number`
2. `lib/pixel-office/engine/characters.ts` - 坐下时随机设置文案
3. `lib/pixel-office/engine/renderer.ts` - 渲染文字气泡（使用renderPhotoComments类似的逻辑）
4. `lib/pixel-office/constants.ts` - 添加 PROGRAMMER_QUOTES 数组

### 文案列表
```typescript
const PROGRAMMER_QUOTES = [
  "// 下次再改",
  "谁写的屎山",
  "temperature:0",
  "又是token超了",
  "这个bug不是我写的",
  "能跑就行，别动了",
  "context window爆了",
  "prompt太长了",
  "hallucination又来了",
  "为什么又404了",
  "API rate limit...",
  "这个模型太贵了",
  "fine-tune还是RAG?",
  "embedding维度不对",
  "向量数据库炸了",
  "LangChain又更新了",
  "这个agent又死循环了",
  "function calling失败",
  "streaming卡住了",
  "部署又挂了"
];
```

### 样式要求
- 白色文字
- 半透明黑色背景
- 圆角矩形气泡
- 显示3-5秒后消失

---

## 任务4: 模型重叠问题排查

### 需要检查
1. 座位坐标是否正确（tilemap中的座位位置）
2. walkable tiles是否正确标记
3. 碰撞检测逻辑

### 排查步骤
1. 检查 `lib/pixel-office/layout/layoutSerializer.ts` 中座位坐标设置
2. 检查 walkable tiles 的定义
3. 如果发现问题，修复坐标或碰撞逻辑

### 可能的修复
- 调整座位坐标偏移
- 调整碰撞检测阈值

---

## 执行要求

1. 每个任务完成后:
   - 运行 `npm run build` 验证编译
   - `git add . && git commit -m "任务描述"`
   
2. 全部完成后:
   - `git push`

3. 使用 Claude Code 执行时，请确保:
   - 使用 `--model MiniMax-M2.5`
   - 使用 `--allowedTools` 预授权所有需要的工具
   - 在项目目录下运行
