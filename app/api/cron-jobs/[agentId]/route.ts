import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

const OPENCLAW_HOME = process.env.OPENCLAW_HOME || path.join(process.env.HOME || "", ".openclaw");

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr: string;
    tz: string;
  };
  sessionTarget: string;
  payload: {
    kind: string;
    message: string;
  };
  state: {
    nextRunAtMs: number;
    lastRunAtMs: number;
    lastStatus: string;
    lastDurationMs: number;
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  try {
    // 调用 openclaw cron list --json
    const { stdout } = await execAsync("openclaw cron list --json", {
      cwd: OPENCLAW_HOME,
    });

    let data: { jobs: CronJob[] };
    try {
      data = JSON.parse(stdout);
    } catch {
      return NextResponse.json({
        agentId,
        agentName: agentId,
        jobs: [],
      });
    }

    const allJobs = data.jobs || [];

    // 过滤出属于该 agent 的任务
    // sessionTarget 格式可能为 "isolated:<agentId>" 或直接是 agentId
    const jobs = allJobs.filter((job: CronJob) => {
      if (!job.sessionTarget) return false;
      return job.sessionTarget.includes(agentId) || job.sessionTarget === agentId;
    });

    // 获取 agent 名称
    let agentName = agentId;
    try {
      const configPath = path.join(OPENCLAW_HOME, "openclaw.json");
      const configContent = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(configContent);
      const agent = config.agents?.find((a: any) => a.id === agentId);
      if (agent?.name) {
        agentName = agent.name;
      }
    } catch {
      // 配置读取失败，使用 agentId 作为名称
    }

    return NextResponse.json({
      agentId,
      agentName,
      jobs,
    });
  } catch (err: any) {
    console.error("Failed to fetch cron jobs:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch cron jobs" },
      { status: 500 }
    );
  }
}
