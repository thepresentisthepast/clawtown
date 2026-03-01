import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OPENCLAW_HOME = process.env.OPENCLAW_HOME || path.join(process.env.HOME || "", ".openclaw");

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ agentId: string; jobId: string }> }
) {
  const { agentId, jobId } = await params;
  
  try {
    // 1. 读取 cron/jobs.json
    const cronJobsPath = path.join(OPENCLAW_HOME, "cron", "jobs.json");
    
    if (!fs.existsSync(cronJobsPath)) {
      return NextResponse.json({ error: "cron/jobs.json 不存在" }, { status: 404 });
    }
    
    const fileContent = fs.readFileSync(cronJobsPath, "utf-8");
    const data = JSON.parse(fileContent);
    
    // 2. 找到要删除的任务
    const jobIndex = data.jobs.findIndex((job: any) => job.id === jobId);
    if (jobIndex === -1) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }
    
    const job = data.jobs[jobIndex];
    const jobName = job.name;
    
    // 3. 从数组中删除
    data.jobs.splice(jobIndex, 1);
    
    // 4. 写回 cron/jobs.json
    fs.writeFileSync(cronJobsPath, JSON.stringify(data, null, 2), "utf-8");
    
    // 5. 清理核心文件中的引用
    const workspacePath = path.join(OPENCLAW_HOME, "workspace");
    const filesToCheck = [
      path.join(workspacePath, "HEARTBEAT.md"),
      path.join(workspacePath, "AGENTS.md"),
      path.join(workspacePath, "cognition.md"),
      path.join(workspacePath, "MEMORY.md"),
    ];
    
    for (const file of filesToCheck) {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, "utf-8");
        
        // 移除包含任务名称或ID的行
        const lines = content.split("\n");
        const filtered = lines.filter(line => {
          const lower = line.toLowerCase();
          const nameLower = jobName.toLowerCase();
          return !lower.includes(nameLower) && !lower.includes(jobId);
        });
        
        if (filtered.length !== lines.length) {
          fs.writeFileSync(file, filtered.join("\n"), "utf-8");
        }
      }
    }
    
    return NextResponse.json({ success: true, deletedJob: jobName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
