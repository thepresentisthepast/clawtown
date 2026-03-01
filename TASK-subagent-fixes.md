# ClawTown 问题修复

## 问题1：子代理会话过滤

### 当前问题
子代理会话在运行结束后（cleanup: delete）会从sessions.json中删除，但前端仍然显示历史记录。

### 解决方案
前端只显示sessions.json中存在的子代理会话（即还在运行的子代理）。

### 实现
`app/sessions/page.tsx` 中的过滤逻辑已经正确：只显示从API返回的sessions，API只返回sessions.json中的记录。

**结论：** 这个问题实际上已经解决了。子代理运行结束后会从sessions.json删除，前端自然不会显示。

---

## 问题2：子代理未使用Claude Code

### 问题描述
子代理在执行ClawTown开发任务时，没有使用Claude Code + MiniMax API的方式，而是自己手写代码。

### 根本原因分析

需要检查：
1. 子代理是否加载了 `coding-agent` skill
2. 子代理的任务描述是否明确要求使用Claude Code
3. 环境变量是否正确配置

### 解决方案

#### 方案1：在任务描述中明确要求使用Claude Code

修改 `sessions_spawn` 的任务描述，明确指示使用Claude Code：

```typescript
sessions_spawn({
  task: `使用Claude Code完成任务。

**必须使用Claude Code：**
1. 先阅读 coding-agent skill（/root/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/skills/coding-agent/SKILL.md）
2. 按照skill中的Claude Code使用方式执行
3. 使用pipe方式传入任务：echo "任务描述" | claude -p --allowedTools "..."
4. 不要自己手写代码，让Claude Code来写

**任务内容：**
${实际任务描述}

**任务文件：** ${taskFilePath}
`,
  label: "...",
  cleanup: "delete",
  runTimeoutSeconds: 600
})
```

#### 方案2：修改AGENTS.md，强调使用Claude Code

在 `AGENTS.md` 的子代理部分添加：

```markdown
### 🤖 Sub-Agent 使用指南

**代码任务必须使用Claude Code：**
- 所有涉及代码编写、修改、重构的任务，必须使用Claude Code
- 不要自己手写代码，Claude Code的代码质量更高
- 参考 coding-agent skill 的使用方式
```

#### 方案3：创建专门的coding子代理配置

在 `cognition.md` 中记录：

```markdown
### Claude Code 调用规范（子代理）

**触发条件：** 任何代码编写/修改任务
**调用方式：**
1. 读取 coding-agent skill
2. 使用pipe方式：`echo "任务" | claude -p --allowedTools "..."`
3. 监督模式：子代理启动Claude Code，定期检查进度，验证build

**环境变量（已配置）：**
- ANTHROPIC_AUTH_TOKEN
- ANTHROPIC_BASE_URL
- ANTHROPIC_MODEL
- API_TIMEOUT_MS
- CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC
```

### 立即修复方案

修改我的 `sessions_spawn` 调用方式，在任务描述开头加上明确指示：

```typescript
const task = `⚠️ 重要：本任务必须使用Claude Code完成，不要自己手写代码！

1. 先阅读 coding-agent skill：/root/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/skills/coding-agent/SKILL.md
2. 按照skill中的方式使用Claude Code
3. 使用pipe方式传入任务描述

---

${实际任务内容}
`;
```

---

## 验证清单

- [ ] 子代理会话在运行结束后不再显示（已自然解决）
- [ ] 下次派发代码任务时，子代理使用Claude Code而非手写
- [ ] 验证Claude Code环境变量配置正确
- [ ] 更新cognition.md记录Claude Code使用规范
