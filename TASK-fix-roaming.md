# ClawTown 漫游逻辑修复

## 问题1：子代理没有出现

**现象：** 创建子代理后，像素办公室中没有出现新人物

**原因：** 重构时删除了子代理检测逻辑

**解决方案：**
1. 恢复 `/api/agent-activity` 中的子代理检测逻辑
2. 从 `/root/.openclaw/agents/main/sessions/` 读取所有session文件
3. 识别子代理session（文件名包含 `subagent:`）
4. 检查最近5分钟有更新的子代理
5. 返回子代理列表

**参考代码（f237fcb版本）：**
```typescript
// 从session文件中检测活跃子代理
const sessionFiles = await fs.readdir(agentSessionsDir)
for (const file of sessionFiles) {
  if (file.includes('subagent:')) {
    const filePath = path.join(agentSessionsDir, file)
    const stat = await fs.stat(filePath)
    const timeDiff = Date.now() - stat.mtimeMs
    
    if (timeDiff < 5 * 60 * 1000) { // 5分钟内有更新
      const label = extractSubagentLabel(file)
      subagents.push({
        id: extractSubagentId(file),
        label,
        status: 'working',
        activity: '执行任务',
        lastUpdate: stat.mtimeMs
      })
    }
  }
}
```

---

## 问题2：像素小人坐下后不动

**现象：** agent坐到椅子上后就不再移动了

**原因：** 重构时删除了漫游逻辑中的持续触发机制

**分析：**
- 参考项目（OpenClaw-bot-review）中，agent在IDLE状态下会持续触发wanderTimer
- wanderTimer倒计时到0时，会随机选择新目标移动
- 但重构后可能删除了这部分逻辑

**解决方案：**
1. 检查 `lib/pixel-office/engine/characters.ts` 中的IDLE状态处理
2. 确保wanderTimer正常倒计时
3. 确保wanderTimer到0时触发新的移动
4. 参考 `OpenClaw-bot-review/lib/pixel-office/engine/characters.ts` 的实现

**关键代码（参考）：**
```typescript
case CharacterState.IDLE: {
  // ... 其他逻辑
  
  // Countdown wander timer
  ch.wanderTimer -= dt
  if (ch.wanderTimer <= 0) {
    // Check if we've wandered enough — return to seat for a rest
    if (ch.wanderCount >= ch.wanderLimit && ch.seatId) {
      // 回到座位休息
    }
    
    if (walkableTiles.length > 0) {
      // 随机选择新目标
      const target = walkableTiles[Math.floor(Math.random() * walkableTiles.length)]
      const path = findPath(ch.tileCol, ch.tileRow, target.col, target.row, tileMap, blockedTiles)
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

---

## 验证清单

- [ ] 创建子代理后，像素办公室中出现新人物
- [ ] agent坐下后会继续起来走动
- [ ] agent在全空间自由漫游
- [ ] 碰撞交互正常工作
- [ ] build无错误
- [ ] commit并push
