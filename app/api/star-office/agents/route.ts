import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DEFAULT_AGENTS = [
  {
    agentId: "star",
    name: "Star",
    isMain: true,
    state: "idle",
    detail: "待命中，随时准备为你服务",
    updated_at: new Date().toISOString(),
    area: "breakroom",
    source: "local",
    joinKey: null,
    authStatus: "approved",
    authExpiresAt: null,
    lastPushAt: null
  }
];

export async function GET() {
  try {
    const agentsPath = path.join(process.cwd(), 'data', 'star-office-agents.json');
    if (fs.existsSync(agentsPath)) {
      const agents = JSON.parse(fs.readFileSync(agentsPath, 'utf-8'));
      return NextResponse.json(agents);
    }
    // Create default agents file
    fs.writeFileSync(agentsPath, JSON.stringify(DEFAULT_AGENTS, null, 2));
    return NextResponse.json(DEFAULT_AGENTS);
  } catch (error) {
    return NextResponse.json(DEFAULT_AGENTS);
  }
}
