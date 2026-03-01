import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

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
    // 直接读取 cron/jobs.json 文件
    const cronJobsPath = path.join(OPENCLAW_HOME, "cron", "jobs.json");
    
    let data: { jobs: CronJob[] };
    try {
      const fileContent = fs.readFileSync(cronJobsPath, "utf-8");
      data = JSON.parse(fileContent);
    } catch (err) {
      // 文件不存在或解析失败，返回空列表
      return NextResponse.json({
        agentId,
        agentName: agentId,
        jobs: [],
      });
    }

    const allJobs = data.jobs || [];

    // 过滤出属于该 agent 的任务
    // 1. 检查 agentId 字段（如果存在）
    // 2. 检查 sessionTarget 字段（可能为 "main" 或 "isolated"）
    // 3. 如果 agentId 是 "main"，显示所有 sessionTarget 为 "main" 或 "isolated" 的任务
    const jobs = allJobs.filter((job: any) => {
      // 如果有 agentId 字段，直接匹配
      if (job.agentId) {
        return job.agentId === agentId;
      }
      
      // 如果是 main agent，显示所有任务
      if (agentId === "main") {
        return true;
      }
      
      // 其他 agent 只显示明确指定的任务
      return job.sessionTarget && job.sessionTarget.includes(agentId);
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
