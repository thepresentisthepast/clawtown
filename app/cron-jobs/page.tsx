"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
}

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr: string;
    tz: string;
  };
  payload: {
    message: string;
  };
  state: {
    nextRunAtMs: number;
    lastRunAtMs: number;
    lastStatus: string;
    lastDurationMs: number;
  };
}

interface AgentCronJobs {
  agentId: string;
  agentName: string;
  jobs: CronJob[];
}

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3,
  timeout = 10000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("Unexpected error in fetchWithRetry");
}

// 相对时间格式化
function formatRelativeTime(timestampMs: number): string {
  if (!timestampMs) return "N/A";

  const now = Date.now();
  const diff = timestampMs - now;
  const absDiff = Math.abs(diff);

  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (minutes < 60) {
    return diff > 0 ? `${minutes}分钟后` : `${minutes}分钟前`;
  } else if (hours < 24) {
    return diff > 0 ? `${hours}小时后` : `${hours}小时前`;
  } else {
    return diff > 0 ? `${days}天后` : `${days}天前`;
  }
}

// Cron 表达式解析
function parseCronSchedule(schedule: { kind: string; expr: string; tz: string }): string {
  if (schedule.kind === "cron" && schedule.expr) {
    const expr = schedule.expr;
    const tz = schedule.tz || "UTC";

    // 简单解析 cron 表达式 (分 时 日 月 周)
    const parts = expr.split(" ");
    if (parts.length >= 2) {
      const minute = parts[0];
      const hour = parts[1];

      // 处理特殊字符
      const formatTime = (val: string) => {
        if (val === "*") return "每";
        const num = parseInt(val);
        return isNaN(num) ? val : num.toString().padStart(2, "0");
      };

      return `每天 ${formatTime(hour)}:${formatTime(minute)} (${tz})`;
    }

    return `${expr} (${tz})`;
  }

  return "未知调度";
}

// 获取状态文本和样式
function getStatusInfo(status: string, enabled: boolean, t: (key: string) => string) {
  if (!enabled) {
    return { text: t("cronJobs.disabled"), color: "text-gray-400", bgColor: "bg-gray-500/10" };
  }

  switch (status) {
    case "ok":
    case "success":
      return { text: t("cronJobs.statusOk"), color: "text-green-400", bgColor: "bg-green-500/10" };
    case "error":
    case "failed":
      return { text: t("cronJobs.statusError"), color: "text-red-400", bgColor: "bg-red-500/10" };
    default:
      return { text: t("cronJobs.statusIdle"), color: "text-yellow-400", bgColor: "bg-yellow-500/10" };
  }
}

export default function CronJobsPage() {
  const { t } = useI18n();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithRetry("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleAgentClick = async (agentId: string) => {
    if (selectedAgent === agentId) {
      setSelectedAgent(null);
      setCronJobs([]);
      return;
    }

    setSelectedAgent(agentId);
    setLoadingJobs(true);
    try {
      const res = await fetchWithRetry(`/api/cron-jobs/${agentId}`);
      const data: AgentCronJobs = await res.json();
      setCronJobs(data.jobs || []);
    } catch (err: any) {
      setCronJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-[var(--text-muted)]">{t("common.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-400">{t("common.loadError")}: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">
          ⏰ {t("cronJobs.title")}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {t("cronJobs.selectAgent")}
        </p>
      </div>

      {/* Agent 卡片列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => handleAgentClick(agent.id)}
            className={`p-4 rounded-lg border transition-all text-left ${
              selectedAgent === agent.id
                ? "bg-[var(--accent)]/15 border-[var(--accent)] shadow-lg"
                : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)]/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{agent.emoji}</span>
              <div>
                <div className="font-medium text-[var(--text)]">{agent.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{agent.id}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 定时任务列表 */}
      {selectedAgent && (
        <div className="mt-6">
          <h2 className="text-xl font-bold text-[var(--text)] mb-4">
            🤖 {agents.find((a) => a.id === selectedAgent)?.name} {t("cronJobs.jobsOf")}
          </h2>
          {loadingJobs ? (
            <div className="text-[var(--text-muted)]">{t("common.loading")}</div>
          ) : cronJobs.length === 0 ? (
            <div className="text-[var(--text-muted)]">{t("common.noData")}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cronJobs.map((job) => {
                const statusInfo = getStatusInfo(job.state?.lastStatus || "", job.enabled, t);
                const description = job.payload?.message || "";
                const truncatedDesc = description.length > 100 ? description.slice(0, 100) + "..." : description;

                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] min-h-[180px] flex flex-col"
                    title={job.id}
                  >
                    {/* 顶部：图标 + 名称 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⏰</span>
                      <h4 className="text-base font-semibold text-[var(--text)]">
                        {job.name}
                      </h4>
                    </div>

                    {/* 调度信息 */}
                    <div className="text-sm text-[var(--text-muted)] mb-2">
                      {parseCronSchedule(job.schedule)}
                    </div>

                    {/* 状态和运行时间 */}
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <span className={`${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                      {job.state?.nextRunAtMs && (
                        <span className="text-[var(--text-muted)]">
                          {t("cronJobs.nextRun")}: {formatRelativeTime(job.state.nextRunAtMs)}
                        </span>
                      )}
                    </div>

                    {/* 上次运行 */}
                    {job.state?.lastRunAtMs && (
                      <div className="text-xs text-[var(--text-muted)] mb-2">
                        {t("cronJobs.lastRun")}: {formatRelativeTime(job.state.lastRunAtMs)}
                      </div>
                    )}

                    {/* 描述 */}
                    {truncatedDesc && (
                      <div className="text-sm text-[var(--text-muted)] mt-auto">
                        {truncatedDesc}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
