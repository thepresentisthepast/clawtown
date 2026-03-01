import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentId: string; sessionId: string }> }
) {
  const { agentId, sessionId } = await params;
  const sessionsDir = path.join(os.homedir(), ".openclaw", "agents", agentId, "sessions");
  const jsonlPath = path.join(sessionsDir, `${sessionId}.jsonl`);

  if (!fs.existsSync(jsonlPath)) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const content = fs.readFileSync(jsonlPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    let sessionMeta: Record<string, unknown> = {};
    const messages: Array<{
      role: string;
      text: string;
      timestamp: string;
      type: string;
      model?: string;
      tokens?: { input?: number; output?: number };
    }> = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        // Session metadata
        if (entry.type === "session") {
          sessionMeta = {
            id: entry.id,
            createdAt: entry.timestamp,
            cwd: entry.cwd,
            version: entry.version,
          };
        }

        // Model changes
        if (entry.type === "model_change") {
          sessionMeta.currentModel = entry.modelId;
          sessionMeta.provider = entry.provider;
        }

        // Message entries (user/assistant/system)
        if (entry.type === "message" && entry.message) {
          const msg = entry.message;
          const role = msg.role;
          if (!role || (role !== "user" && role !== "assistant" && role !== "system")) continue;

          const content = msg.content;
          const text = Array.isArray(content)
            ? content
                .filter((c: { type: string }) => c.type === "text")
                .map((c: { text: string }) => c.text)
                .join("\n")
            : typeof content === "string"
              ? content
              : "";

          if (text && text.length > 0) {
            messages.push({
              role,
              text: text.slice(0, 500),
              timestamp: entry.timestamp,
              type: entry.type,
              model: msg.model,
              tokens: msg.usage
                ? { input: msg.usage.inputTokens, output: msg.usage.outputTokens }
                : undefined,
            });
          }
        }
      } catch {
        // skip malformed lines
      }
    }

    // Return last 50 messages to keep response size reasonable
    const recentMessages = messages.slice(-50);

    return NextResponse.json({
      meta: sessionMeta,
      messageCount: messages.length,
      messages: recentMessages,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
