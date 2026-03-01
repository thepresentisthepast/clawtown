# ClawTown 漫游逻辑重构

## 参考项目
https://github.com/xmanrui/OpenClaw-bot-review

## 核心改动

### 1. 取消房间区分逻辑
- **当前：** 主agent在聊天室，子代理在工作室，休息时去休息室
- **改为：** 所有agent在全空间自由漫游，可以随机坐在任何椅子/沙发上
- **删除：** `isRoaming` 字段、房间映射逻辑、`moveAgentToRoom` 的房间限制

### 2. Agent数量同步
- **当前：** 固定的主agent + 动态子代理
- **改为：** agent数量 = OpenClaw中实际工作的agent数量
- **逻辑：** 参考 `OpenClaw-bot-review/lib/pixel-office/agentBridge.ts`
  - 从API获取所有活跃agent
  - 动态添加/移除agent
  - 所有agent运动逻辑一致

### 3. 统一漫游逻辑
- **所有agent：** 全空间漫游 + 随机坐椅子/沙发
- **参考：** `OpenClaw-bot-review/lib/pixel-office/engine/characters.ts` 的IDLE状态处理
- **保留：** wanderTimer机制、座位分配逻辑

### 4. 碰撞交互（新功能）
- **agent碰到龙虾：**
  - agent停顿，显示惊吓文字（"啊！龙虾！😱"）
  - 龙虾停顿
  - 停顿2-3秒后继续移动
- **agent碰到猫咪：**
  - agent停顿，显示撸猫文字（"好可爱的猫咪~ 🐱"）
  - 猫咪停顿
  - 停顿3-5秒后继续移动
- **实现：** 在update循环中检测碰撞（距离<1格）

---

## 保留的功能（不要改）

### 1. 人物头上的文字
- agent名字显示
- 工具调用时的吐槽文案
- 状态文字（"摸鱼中🐟"、"思考人生中..."）

### 2. 点击交互
- 点击agent显示信息卡片
- 卡片内容：名字、状态、活动、最后更新时间

### 3. Git提交记录
- `/api/git-commits` API
- 显示最近10条提交

---

## 实现步骤

### Step 1: 清理房间逻辑
1. 删除 `Character.isRoaming` 字段
2. 删除 `officeState.setAgentRoaming` 方法
3. 删除 `moveAgentToRoom` 中的房间限制逻辑
4. 删除 `agentBridge.ts` 中的房间映射逻辑

### Step 2: 重构agentBridge
1. 参考 `OpenClaw-bot-review/lib/pixel-office/agentBridge.ts`
2. 实现动态agent同步
3. 所有agent平等对待，没有"主agent"特殊逻辑

### Step 3: 统一漫游逻辑
1. 参考 `OpenClaw-bot-review/lib/pixel-office/engine/characters.ts`
2. 所有agent使用相同的IDLE状态处理
3. 全空间漫游，随机坐椅子/沙发

### Step 4: 实现碰撞交互
1. 在 `characters.ts` 的 `updateCharacter` 中添加碰撞检测
2. 检测agent与猫咪/龙虾的距离
3. 碰撞时：
   - 设置 `ch.collisionTarget` 和 `ch.collisionTimer`
   - 显示对应文字
   - 双方停顿
4. 停顿结束后继续移动

### Step 5: 测试验证
- 测试多个agent同时漫游
- 测试碰撞交互
- 测试点击信息卡片
- 验证build

---

## 碰撞交互实现细节

### Character类型扩展
```typescript
export interface Character {
  // ... 现有字段
  collisionTarget: 'cat' | 'lobster' | null
  collisionTimer: number
  collisionText: string
}
```

### 碰撞检测逻辑
```typescript
// 在updateCharacter的IDLE或WALK状态中
function checkCollision(ch: Character, characters: Map<number, Character>): void {
  if (ch.isCat || ch.isLobster) return
  
  for (const [id, other] of characters) {
    if (other.isCat || other.isLobster) {
      const distance = Math.sqrt(
        Math.pow(ch.x - other.x, 2) + Math.pow(ch.y - other.y, 2)
      )
      
      if (distance < TILE_SIZE) { // 碰撞阈值
        if (other.isCat) {
          ch.collisionTarget = 'cat'
          ch.collisionText = '好可爱的猫咪~ 🐱'
          ch.collisionTimer = 3 + Math.random() * 2 // 3-5秒
        } else if (other.isLobster) {
          ch.collisionTarget = 'lobster'
          ch.collisionText = '啊！龙虾！😱'
          ch.collisionTimer = 2 + Math.random() * 1 // 2-3秒
        }
        
        // 双方停顿
        ch.state = CharacterState.IDLE
        ch.path = []
        other.state = CharacterState.IDLE
        other.path = []
        break
      }
    }
  }
}
```

### 碰撞文字显示
```typescript
// 在renderer中，agent头上显示collisionText
if (ch.collisionTimer > 0) {
  // 显示 ch.collisionText
  ch.collisionTimer -= dt
  if (ch.collisionTimer <= 0) {
    ch.collisionTarget = null
    ch.collisionText = ''
  }
}
```

---

## 验证清单

- [ ] 所有agent在全空间自由漫游
- [ ] agent数量 = 实际活跃agent数量
- [ ] agent可以随机坐任何椅子/沙发
- [ ] agent碰到猫咪时显示撸猫文字并停顿
- [ ] agent碰到龙虾时显示惊吓文字并停顿
- [ ] 人物头上的名字和文字正常显示
- [ ] 点击agent显示信息卡片
- [ ] build无错误
- [ ] commit并push
