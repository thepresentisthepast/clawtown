# 重构执行计划

## 文件修改清单

### 1. lib/pixel-office/engine/characters.ts
- 删除 `isRoaming: false` 字段初始化（第85行）
- 删除 `if (ch.isRoaming)` 分支逻辑（第183-220行）
- 修改IDLE状态的漫游逻辑：全空间随机移动（删除行列限制）
- 添加碰撞检测函数 `checkCollision()`
- 在updateCharacter中调用碰撞检测

### 2. lib/pixel-office/types.ts
- 删除 `Character` 接口中的 `isRoaming?: boolean` 字段
- 添加碰撞相关字段：
  - `collisionTarget: 'cat' | 'lobster' | null`
  - `collisionTimer: number`
  - `collisionText: string`

### 3. lib/pixel-office/agentBridge.ts
- 删除 `prevAgentRooms` 相关逻辑（第30行及使用处）
- 删除房间判断逻辑（第70-95行）
- 删除 `office.setAgentRoaming()` 调用（第93-97行）
- 删除 `office.moveAgentToRoom()` 调用
- 简化为：只添加/删除agent，不管房间

### 4. lib/pixel-office/engine/officeState.ts
- 删除 `setAgentRoaming()` 方法
- 删除 `moveAgentToRoom()` 方法（或简化为只设置位置，不限制区域）

## 实现顺序
1. 先改types.ts（添加碰撞字段，删除isRoaming）
2. 再改characters.ts（删除isRoaming逻辑，添加碰撞检测）
3. 然后改agentBridge.ts（删除房间逻辑）
4. 最后改officeState.ts（删除相关方法）
5. 测试build
