import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { state, detail } = await request.json();
    const statePath = path.join(process.cwd(), 'data', 'star-office-state.json');
    
    const stateData = {
      state: state || 'idle',
      detail: detail || '',
      progress: 0,
      updated_at: new Date().toISOString()
    };
    
    fs.writeFileSync(statePath, JSON.stringify(stateData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
