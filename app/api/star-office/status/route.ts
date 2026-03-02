import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const statePath = path.join(process.cwd(), 'data', 'star-office-state.json');
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      return NextResponse.json(state);
    }
    return NextResponse.json({
      state: 'idle',
      detail: '等待任务中...',
      progress: 0,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      state: 'idle',
      detail: '等待任务中...',
      progress: 0,
      updated_at: new Date().toISOString()
    });
  }
}
