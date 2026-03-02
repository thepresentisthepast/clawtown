# ClawTown 漫游逻辑完全重写

## 参考项目
https://github.com/xmanrui/OpenClaw-bot-review

## 核心问题

当前漫游逻辑有严重问题：
1. agent要么一动不动
2. agent面向物体时卡住不动
3. 没有实现正确的持续漫游

## 解决方案

**完全参考OpenClaw-bot-review的实现，逐行对比并修复**

---

## 需要对比的文件

### 1. characters.ts - 核心漫游逻辑
**参考：** `/tmp/OpenClaw-bot-review/lib/pixel-office/engine/characters.ts`
**当前：** `/root/.openclaw/workspace/projects/clawtown/lib/pixel-office/engine/characters.ts`

**关键点：**
- IDLE状态的wanderTimer处理
- wanderCount和wanderLimit机制
- 回到座位休息的逻辑
- 随机选择目标的逻辑

### 2. agentBridge.ts - Agent同步逻辑
**参考：** `/tmp/OpenClaw-bot-review/lib/pixel-office/agentBridge.ts`
**当前：** `/root/.openclaw/workspace/projects/clawtown/lib/pixel-office/agentBridge.ts`

**关键点：**
- syncAgentsToOffice函数
- agent状态映射（working/idle/waiting）
- 子代理同步逻辑

### 3. officeState.ts - 座位分配和agent管理
**参考：** `/tmp/OpenClaw-bot-review/lib/pixel-office/engine/officeState.ts`
**当前：** `/root/.openclaw/workspace/projects/clawtown/lib/pixel-office/engine/officeState.ts`

**关键点：**
- addAgent方法
- 座位分配逻辑
- 子代理管理

---

## 实现步骤

### Step 1: 对比并修复characters.ts

1. 对比IDLE状态的完整逻辑
2. 确保wanderTimer正确倒计时
3. 确保wanderCount和wanderLimit正确工作
4. 确保回到座位休息的逻辑正确
5. 确保随机选择目标的逻辑正确

**关键代码段（参考）：**
```typescript
case CharacterState.IDLE: {
  // ... 碰撞检测等
  
  // Countdown wander timer
  ch.wanderTimer -= dt
  if (ch.wanderTimer <= 0) {
    // Check if we've wandered enough — return to seat for a rest
    if (ch.wanderCount >= ch.wanderLimit && ch.seatId) {
      const seat = seats.get(ch.seatId)
      if (seat) {
        const path = findPath(...)
        if (path.length > 0) {
          ch.path = path
          ch.moveProgress = 0
          ch.state = CharacterState.WALK
          ch.frame = 0
          ch.frameTimer = 0
          break
        }
      }
    }
    
    // Random wander
    if (walkableTiles.length > 0) {
      const target = walkableTiles[Math.floor(Math.random() * walkableTiles.length)]
      const path = findPath(...)
      if (path.length > 0) {
        ch.path = path
        ch.moveProgress = 0
        ch.state = CharacterState.WALK
        ch.frame = 0
        ch.frameTimer = 0
        ch.wanderCount++
      }
    }
    ch.wanderTimer = randomRange(WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC)
  }
  break
}
```

### Step 2: 对比并修复agentBridge.ts

1. 完全参考syncAgentsToOffice函数
2. 确保agent状态正确映射
3. 确保子代理正确同步

### Step 3: 对比并修复officeState.ts

1. 确保addAgent方法正确
2. 确保座位分配逻辑正确
3. 确保子代理管理正确

### Step 4: 测试验证

1. 单个agent持续漫游
2. agent坐下后能起来继续漫游
3. 多个agent同时漫游
4. agent头上显示文字
5. 碰撞交互正常

---

## 验证清单

- [ ] agent持续自由漫游（不卡住）
- [ ] agent可以坐到椅子上休息
- [ ] agent坐下后头上显示文字
- [ ] agent休息后起来继续漫游
- [ ] 多个agent同时漫游
- [ ] agent不会面向物体时卡住
- [ ] 碰撞交互正常
- [ ] build无错误
- [ ] commit并push

---

## 重要提示

**不要自己猜测逻辑，完全参考OpenClaw-bot-review的实现！**

逐行对比，找出差异，修复问题。
