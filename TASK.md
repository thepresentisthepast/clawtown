# TASK: ClawTown 两个修复

## 修复1：压缩按钮对已结束会话不显示

文件：`app/sessions/page.tsx`

当前逻辑：上下文使用超50%时显示🧹压缩按钮。
问题：已结束的子代理会话（type=subagent且totalTokens接近contextTokens）点击压缩无效。

修改方案：
- 对于 type 为 "subagent" 或 "cron" 且 totalTokens/contextTokens > 0.95 的会话，不显示压缩按钮
- 改为显示一个灰色标签 "已结束" 或 "已归档"
- 对于活跃会话（type=main, telegram-dm等）保持原有压缩按钮逻辑

具体位置：搜索 `compacting` 和 `🧹 压缩` 找到压缩按钮的代码块，在按钮渲染前加条件判断。

## 修复2：还原activeModel逻辑

文件：`app/api/config/route.ts` 和 `app/page.tsx`

当前逻辑：从jsonl读取最近assistant消息的model字段作为activeModel。
问题：不够优雅，且读取大文件性能差。

修改方案：
1. 在 `app/api/config/route.ts` 中删除 `getActiveModel` 函数
2. 删除 `activeModel: getActiveModel(id)` 这行
3. 在 `app/page.tsx` 中把 `agent.activeModel || agent.model` 改回 `agent.model`
4. 在 `app/page.tsx` 的 Agent interface 中删除 `activeModel?: string | null;`

## 完成后
1. 运行 `npm run build` 确保零错误
2. 运行 `git add -A && git commit -m "fix: 压缩按钮对已结束会话显示已归档 + 还原activeModel" && git push origin main`
