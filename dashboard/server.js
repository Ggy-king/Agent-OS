#!/usr/bin/env node
/**
 * agent-os 总控可视化看板 —— 零依赖 Node 服务（端口 9140）
 * 数据源：本目录上级的 INDEX.md（本机实例）+ GLOBAL-MASTER.md + AGENTS.md（总管身份）
 * /api/chat：总控管家对话（某 LLM 服务商 example-model，key 按顺序探测多个 keys.json）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 9140;
const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };

/* ---------- INDEX.md 解析：大区/分组/卡片行 ---------- */
function parseIndex(md) {
  const zones = []; let zone = null, group = null, card = null;
  const flushCard = () => {
    if (card && zone) { if (group) group.cards.push(card); else zone.loose.push(card); }
    card = null;
  };
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (/^##\s+/.test(line) && !/^##\s+(常用|模板)/.test(line)) {
      flushCard();
      if (group) { if (zone) zone.groups.push(group); group = null; }
      zone = { title: line.replace(/^##\s+/, ''), desc: [], groups: [], loose: [] };
      zones.push(zone); continue;
    }
    if (!zone) continue;
    if (/^###\s+/.test(line)) { flushCard(); if (group) zone.groups.push(group); group = { title: line.replace(/^###\s+/, ''), cards: [] }; continue; }
    if (/^-\s+\*\*(.+?)\*\*\s*—\s*(.*)$/.test(line)) {
      flushCard();
      const m = line.match(/^-\s+\*\*(.+?)\*\*\s*—\s*(.*)$/);
      card = { name: m[1], text: m[2], extra: [] };
      continue;
    }
    if (/^-\s+/.test(line) && !card) { zone.desc.push(line.replace(/^-\s+/, '')); continue; }
    if (card && line && !/^>/.test(line)) card.extra.push(line);
  }
  flushCard();
  if (group && zone) zone.groups.push(group);
  return zones.filter(z => z.title);
}

/* ---------- GLOBAL-MASTER 解析：纪律条目/图谱 ---------- */
function parseMaster(md) {
  const sec = (title) => {
    const m = md.match(new RegExp('##\\s+' + title + '[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)'));
    return m ? m[1].split('\n').map(s => s.trim()).filter(s => s && s.startsWith('-')).map(s => s.replace(/^-\s+/, '')) : [];
  };
  const isTemplate = /【模板/.test(md.split('\n')[0] || '');
  return { isTemplate, discipline: sec('通用纪律'), graph: sec('项目关联图谱'), skill: sec('全局 skill 库'), board: sec('观澜板维护') };
}

/* ---------- 某 LLM 服务商 key 探测顺序 ---------- */
function findKey() {
  const cands = [
    path.join(__dirname, 'data', 'keys.json'),
    path.join(ROOT, 'dashboard', 'data', 'keys.json'),
    path.join(process.env.HOME || '', 'Developer', 'exo', 'data', 'keys.json'),
    path.join(process.env.HOME || '', 'Developer', 'xiaoke-mac', 'data', 'keys.json'),
  ];
  for (const f of cands) {
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      for (const k of ['provider', 'PROVIDER', 'provider_api_key', 'PROVIDER_API_KEY', 'apiKey', 'model'])
        if (typeof j[k] === 'string' && j[k].length > 20) return { key: j[k], from: f };
      for (const v of Object.values(j))
        if (typeof v === 'string' && v.length > 40 && /^[a-zA-Z0-9.\-_:]+$/.test(v)) return { key: v, from: f };
    } catch {}
  }
  return null;
}

async function chat(body) {
  const found = findKey();
  if (!found) return { ok: false, error: '没找到某 LLM 服务商 API key。把 key 存为 dashboard/data/keys.json（内容如 {"provider":"你的key"}），或在 EXO/xiaoke-mac 的 data/keys.json 里已有也可。' };
  const sys = [
    read(path.join(ROOT, 'AGENTS.md')),
    '--- 观澜板（INDEX.md，本机实例）---', read(path.join(ROOT, 'INDEX.md')),
    '--- 全局层 ---', read(path.join(ROOT, 'GLOBAL-MASTER.md')),
    '当前时间：' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
  ].join('\n\n');
  const res = await fetch('https://https://your-llm-endpoint.example/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + found.key },
    body: JSON.stringify({ model: 'example-model', messages: [{ role: 'system', content: sys }, ...(body.messages || [])], stream: false }),
  });
  const j = await res.json();
  if (j.choices && j.choices[0]) return { ok: true, reply: j.choices[0].message.content, keyFrom: path.basename(path.dirname(found.from)) };
  return { ok: false, error: '某 LLM 服务商返回异常：' + JSON.stringify(j).slice(0, 300) };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      index: parseIndex(read(path.join(ROOT, 'INDEX.md'))),
      master: parseMaster(read(path.join(ROOT, 'GLOBAL-MASTER.md'))),
      skills: read(path.join(__dirname, 'skills', 'SKILLS.md')),
    }));
  }
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(await chat(JSON.parse(body || '{}')))); }
      catch (e) { res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: String(e) })); }
    });
    return;
  }
  let file = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const fp = path.join(__dirname, 'public', path.normalize(file).replace(/^(\.\.[\/\\])+/, ''));
  if (!fp.startsWith(path.join(__dirname, 'public'))) { res.writeHead(403); return res.end('forbidden'); }
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
  try { res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'text/plain; charset=utf-8' }); res.end(fs.readFileSync(fp)); }
  catch { res.writeHead(404); res.end('not found'); }
});

server.listen(PORT, '127.0.0.1', () => console.log(`[agent-os 看板] http://127.0.0.1:${PORT}  （Ctrl+C 停止）`));
