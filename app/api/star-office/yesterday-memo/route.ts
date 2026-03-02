import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getYesterdayDateStr() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

function sanitizeContent(text: string) {
  // Remove OpenID, User ID
  text = text.replace(/ou_[a-f0-9]+/g, '[用户]');
  text = text.replace(/user_id="[^"]+"/g, 'user_id="[隐藏]"');
  // Remove paths
  text = text.replace(/\/root\/[^"\s]+/g, '[路径]');
  // Remove IP addresses
  text = text.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '[IP]');
  // Remove phone numbers and emails
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[邮箱]');
  text = text.replace(/1[3-9]\d{9}/g, '[手机号]');
  return text;
}

function extractMemoFromFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const corePoints: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('#')) continue;
      if (trimmed.startsWith('- ')) {
        corePoints.push(trimmed.substring(2).trim());
      } else if (trimmed.length > 10) {
        corePoints.push(trimmed);
      }
    }
    
    if (!corePoints.length) {
      return "「昨日无事记录」\n\n若有恒，何必三更眠五更起；最无益，莫过一日曝十日寒。";
    }
    
    const selectedPoints = corePoints.slice(0, 3);
    const wisdomQuotes = [
      "「工欲善其事，必先利其器。」",
      "「不积跬步，无以至千里；不积小流，无以成江海。」",
      "「知行合一，方可致远。」",
      "「业精于勤，荒于嬉；行成于思，毁于随。」",
      "「路漫漫其修远兮，吾将上下而求索。」"
    ];
    
    const quote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)];
    const result: string[] = [];
    
    for (let i = 0; i < selectedPoints.length; i++) {
      let point = sanitizeContent(selectedPoints[i]);
      if (point.length > 40) point = point.substring(0, 37) + '...';
      if (point.length <= 20) {
        result.push(`· ${point}`);
      } else {
        for (let j = 0; j < point.length; j += 20) {
          const chunk = point.substring(j, j + 20);
          result.push(j === 0 ? `· ${chunk}` : `  ${chunk}`);
        }
      }
    }
    
    if (quote) {
      if (quote.length <= 20) {
        result.push(`\n${quote}`);
      } else {
        for (let j = 0; j < quote.length; j += 20) {
          const chunk = quote.substring(j, j + 20);
          result.push(j === 0 ? `\n${chunk}` : chunk);
        }
      }
    }
    
    return result.join('\n').trim();
  } catch (e) {
    return "「昨日记录加载失败」\n\n「往者不可谏，来者犹可追。」";
  }
}

export async function GET() {
  try {
    const yesterdayStr = getYesterdayDateStr();
    const memoryDir = path.join(process.cwd(), 'memory');
    const yesterdayFile = path.join(memoryDir, `${yesterdayStr}.md`);
    
    let targetFile = null;
    let targetDate = yesterdayStr;
    
    if (fs.existsSync(yesterdayFile)) {
      targetFile = yesterdayFile;
    } else if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir).filter(f => 
        f.endsWith('.md') && /^\d{4}-\d{2}-\d{2}\.md$/.test(f)
      );
      if (files.length) {
        files.sort().reverse();
        const todayStr = new Date().toISOString().split('T')[0];
        for (const f of files) {
          if (f !== `${todayStr}.md`) {
            targetFile = path.join(memoryDir, f);
            targetDate = f.replace('.md', '');
            break;
          }
        }
      }
    }
    
    if (targetFile && fs.existsSync(targetFile)) {
      const memoContent = extractMemoFromFile(targetFile);
      return NextResponse.json({
        success: true,
        date: targetDate,
        memo: memoContent
      });
    }
    
    return NextResponse.json({
      success: false,
      msg: "没有找到昨日日记"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      msg: String(error)
    }, { status: 500 });
  }
}
