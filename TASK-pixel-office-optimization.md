# ClawTown 像素办公室优化任务

## 任务背景
ClawTown项目的像素办公室漫游逻辑已经基本实现，但还需要参数调优和细节优化。

## 项目路径
`/root/.openclaw/workspace/projects/clawtown`

## 待优化项（按优先级）

### 1. 漫游逻辑优化（高优先级）
**问题：** 像素小人会时不时停止，停顿时间较长
**期望：** 停止时间短一点，保持持续移动感
**技术方案：**
- 找到 `WANDER_PAUSE_MIN_SEC` 和 `WANDER_PAUSE_MAX_SEC` 常量
- 将停顿时间从当前值减小到合理范围（建议：MIN 0.5秒，MAX 2秒）
- 测试效果，确保agent保持活跃

### 2. 坐椅子概率优化（高优先级）
**问题：** 坐椅子的概率较低
**期望：** 提高坐到椅子上的概率
**技术方案：**
- 找到 `WANDER_MOVES_BEFORE_REST_MIN` 和 `WANDER_MOVES_BEFORE_REST_MAX` 常量
- 减小这两个值，让agent更频繁地寻找椅子坐下
- 建议：MIN 3, MAX 8（当前可能是更大的值）

### 3. 程序员黑色幽默文字（中优先级）
**需求：** 坐到椅子上后，头顶浮现大模型应用程序员的黑色幽默文字
**实现位置：**
- `characters.ts` 中的 TYPE 状态
- renderer 中显示文字气泡

**文案列表（20条）：**
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

**实现要求：**
- agent坐下后，从文案列表中随机选择一条
- 文字显示在agent头顶，持续3-5秒后消失
- 文字样式：白色文字，半透明黑色背景，圆角矩形气泡

### 4. 模型重叠问题（低优先级）
**问题：** 人物和建筑模型有重叠
**需要检查：**
- 座位坐标是否正确
- walkable tiles 是否正确标记
- 碰撞检测逻辑是否完善

**排查步骤：**
1. 检查 tilemap 中的座位坐标
2. 检查 walkable tiles 的定义
3. 检查 agent 移动时的碰撞检测
4. 如果发现问题，修复坐标或碰撞逻辑

## 技术约束
1. **必须使用Claude Code** — 这是代码任务，必须用Claude Code执行
2. **修改类型定义后必须更新所有引用** — 如果修改了types.ts，必须同步更新所有引用处
3. **测试验证** — 每个优化完成后，运行 `npm run dev` 验证效果
4. **Git提交** — 每个优化项完成后，单独commit，commit message要清晰

## 执行流程
1. 进入项目目录：`cd /root/.openclaw/workspace/projects/clawtown`
2. 按优先级依次处理优化项
3. 每个优化项完成后：
   - 运行 `npm run build` 验证编译
   - Git commit
4. 全部完成后，push到GitHub

## 预期产出
- 4个优化项全部完成
- 代码编译通过
- Git提交记录清晰
- 优化效果符合预期

## 参考文件
- 昨天的实现参考：`https://github.com/xmanrui/OpenClaw-bot-review`
- 待优化问题记录：`memory/2026-03-02-early-morning.md`
