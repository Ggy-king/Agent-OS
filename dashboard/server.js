#!/usr/bin/env node
/**
 * agent-os 总控可视化看板 —— 零依赖 Node 服务（端口 9140）
 * 数据源：本目录上级的 INDEX.md（本机实例）+ GLOBAL-MASTER.md + AGENTS.md（总管身份）
 * /api/chat：总控管家对话（用户在 ⚙ 设置配置的任意 OpenAI 兼容 API）
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

/* ---------- key 探测：dashboard/data/keys.json + 本机可选扩展路径（key-paths.json，gitignore） ---------- */
function findKey() {
  const cands = [
    path.join(__dirname, 'data', 'keys.json'),
    path.join(ROOT, 'dashboard', 'data', 'keys.json'),
  ];
  try { // 本机想让管家复用其它项目已有 key 时，把绝对路径列进 data/key-paths.json（["/path/to/keys.json"]）
    for (const p of JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'key-paths.json'), 'utf8')))
      cands.push(p.replace(/^~/, process.env.HOME || ''));
  } catch {}
  for (const f of cands) {
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      for (const k of ['apiKey', 'api_key', 'token', 'secret', 'key'])
        if (typeof j[k] === 'string' && j[k].length > 20) return { key: j[k], from: f };
      for (const v of Object.values(j))
        if (typeof v === 'string' && v.length > 40 && /^[a-zA-Z0-9.\-_:]+$/.test(v)) return { key: v, from: f };
    } catch {}
  }
  return null;
}

/* ---------- 管家大脑配置（dashboard/data/config.json，gitignore） ---------- */
const CFG_FILE = path.join(__dirname, 'data', 'config.json');
function loadCfg() { try { return JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')); } catch { return null; } }
function saveCfg(c) { fs.mkdirSync(path.dirname(CFG_FILE), { recursive: true }); fs.writeFileSync(CFG_FILE, JSON.stringify(c, null, 2)); }

/* ---------- LLM 端点：只从用户配置（dashboard/data/config.json）读取，不内置任何厂商 ---------- */
function llmEndpoint() {
  const cfg = loadCfg();
  if (cfg && cfg.baseURL && cfg.model && cfg.apiKey)
    return { url: cfg.baseURL.replace(/\/+$/, '') + '/chat/completions', key: cfg.apiKey, model: cfg.model };
  return null;
}

async function chat(body) {
  const ep = llmEndpoint();
  if (!ep) return { ok: false, error: '没找到可用的 API 配置：右上角「⚙ 设置」里填 API 地址/模型名/密钥（任意 OpenAI 兼容接口都行）。' };
  const { url, key, model } = ep;
  const sys = [
    '你是「总控管家」：运行在 agent-os 可视化看板里的体系总览级 AI 助手。',
    '你的职责边界：回答总控级问题（体系状态/项目路由/规矩解释/无主之地登记建议）+ 日常问答。',
    '你只能读下面注入的文件内容，不能写盘；要改文件/做实操时，明确告诉用户去对应项目目录开 AI 会话。',
    '回复风格与通用纪律以注入的全局层（GLOBAL-MASTER）为准——冲突时也是它说了算。',
    '',
    '===== 身份与规矩（总管） =====',
    read(path.join(ROOT, 'AGENTS.md')),
    '===== 观澜板（INDEX.md，本机实例） =====',
    read(path.join(ROOT, 'INDEX.md')),
    '===== 全局层（GLOBAL-MASTER） =====',
    read(path.join(ROOT, 'GLOBAL-MASTER.md')),
    '===== 当前时间 =====',
    new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
  ].join('\n');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: sys }, ...(body.messages || [])], stream: false }),
  });
  const j = await res.json();
  if (j.choices && j.choices[0]) return { ok: true, reply: j.choices[0].message.content, model };
  return { ok: false, error: (model || 'API') + ' 返回异常：' + JSON.stringify(j).slice(0, 300) };
}

/* ---------- 卡片 → 打开目录 ---------- */
const { exec } = require('child_process');
function resolveDir(name) {
  if (!name) return null;
  const p = name === 'agent-os' ? ROOT : path.join(process.env.HOME || '', 'Developer', name);
  const real = path.resolve(p.replace(/^~/, process.env.HOME || ''));
  try { if (!fs.statSync(real).isDirectory()) return null; } catch { return null; }
  return real;
}
function openDir(name, app) {
  const dir = resolveDir(name);
  if (!dir) return { ok: false, error: '找不到目录：' + name + '（只允许打开 ~/Developer 下已存在的项目）' };
  const cmd = app === 'finder' ? `open "${dir}"`
    : app === 'terminal' ? `open -a Terminal "${dir}"`
    : `open -a "Visual Studio Code" "${dir}"`;
  return new Promise(done => exec(cmd, e => done(e ? { ok: false, error: String(e) } : { ok: true, dir, app })));
}

/* ---------- 夜间巡检：git log 哨兵（每天 23:00 自动跑） ---------- */
const { execSync } = require('child_process');
const PATROL_FILE = path.join(__dirname, 'data', 'patrol.json');
function runPatrol() {
  const dev = path.join(process.env.HOME || '', 'Developer');
  let names = [];
  try { names = fs.readdirSync(dev).filter(n => !n.startsWith('.')); } catch { return null; }
  const results = [];
  for (const name of names) {
    const dir = path.join(dev, name);
    try {
      if (!fs.statSync(dir).isDirectory()) continue;
      if (!fs.existsSync(path.join(dir, '.git'))) { results.push({ name, git: false }); continue; }
      // --all 覆盖所有分支：包括其他协作者推上来的提交，不只看自己的
      const sh = `git -C "${dir}" log --all --oneline --since="7 days ago"`;
      const log = execSync(sh + ' | head -3', { encoding: 'utf8', timeout: 15000 });
      const cnt = execSync(sh + ' | wc -l', { encoding: 'utf8', timeout: 15000 }).trim();
      results.push({ name, git: true, commits7d: Number(cnt) || 0,
        last: (log.split('\n')[0] || '').slice(0, 70) });
    } catch (e) { results.push({ name, git: true, commits7d: 0, error: String(e).slice(0, 60) }); }
  }
  const report = { at: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    date: new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10), projects: results };
  fs.mkdirSync(path.dirname(PATROL_FILE), { recursive: true });
  fs.writeFileSync(PATROL_FILE, JSON.stringify(report, null, 2));
  exec(`"${path.join(__dirname, '..', 'tools', 'instance-snap.sh')}"`, () => {}); // 顺手固化实例快照
  return report;
}
setInterval(() => { // 每天 23:00 后跑一次（按上海时间）；电脑休眠错过时，唤醒后 20 分钟内自动补跑
  const now = new Date(Date.now() + 8 * 3600e3);
  const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
  const done = (() => { try { return JSON.parse(read(PATROL_FILE)).date; } catch { return ''; } })();
  if (now.getUTCHours() >= 23 && done !== today) {
    console.log('[夜间巡检] 开始…' + (now.getUTCHours() > 23 ? '（休眠错过，唤醒后补跑）' : ''));
    runPatrol();
  }
}, 20 * 60 * 1000);
runPatrol(); // 启动时先跑一次垫底

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      index: parseIndex(read(path.join(ROOT, 'INDEX.md'))),
      master: parseMaster(read(path.join(ROOT, 'GLOBAL-MASTER.md'))),
      skills: read(path.join(ROOT, 'skills', 'SKILLS.md')),
    }));
  }
  if (url.pathname === '/api/file') {
    const MAP = { manual: '使用手册.md', protocol: 'TEST-PROTOCOL.md', office: 'office/AGENTS.md', notes: 'notes/README.md', skills: 'skills/SKILLS.md', chains: 'UPDATE-CHAINS.md' };
    const f = MAP[url.searchParams.get('f')];
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (!f) return res.end(JSON.stringify({ ok: false, error: '未知文件' }));
    const t = read(path.join(ROOT, f));
    return res.end(JSON.stringify(t ? { ok: true, text: t } : { ok: false, error: '文件不存在: ' + f }));
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
  /* 设置页：配置读写（key 回传只给掩码） */
  if (url.pathname === '/api/config') {
    const cfg = loadCfg();
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        ok: true,
        config: cfg ? {
          baseURL: cfg.baseURL || '', model: cfg.model || '',
          keyMask: cfg.apiKey ? cfg.apiKey.slice(0, 6) + '****' + (cfg.apiKey.length > 12 ? cfg.apiKey.slice(-4) : '') : '',
          hasKey: !!cfg.apiKey,
        } : null,
        codeInstalled: fs.existsSync('/Applications/Visual Studio Code.app'),
      }));
    }
    if (req.method === 'POST') {
      let b = ''; req.on('data', c => b += c);
      req.on('end', () => {
        try {
          const j = JSON.parse(b || '{}');
          if (!j.baseURL || !j.model || !j.apiKey) { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ ok: false, error: '三项都得填：baseURL / model / apiKey' })); }
          saveCfg({ baseURL: j.baseURL.trim(), model: j.model.trim(), apiKey: j.apiKey.trim() });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: String(e) })); }
      });
      return;
    }
  }
  /* 设置页：测试连通（用提交的配置或已存配置，发一句话） */
  if (url.pathname === '/api/test' && req.method === 'POST') {
    let b = ''; req.on('data', c => b += c);
    req.on('end', async () => {
      try {
        const j = JSON.parse(b || '{}');
        const cfg = j.apiKey ? j : loadCfg();
        if (!cfg || !cfg.apiKey) { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ ok: false, error: '没有可测的配置' })); }
        const t0 = Date.now();
        const r = await fetch(cfg.baseURL.replace(/\/+$/, '') + '/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
          body: JSON.stringify({ model: cfg.model, messages: [{ role: 'user', content: '回复两个字：通了' }], stream: false }),
        });
        const out = await r.json();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        if (out.choices && out.choices[0]) res.end(JSON.stringify({ ok: true, sample: out.choices[0].message.content, ms: Date.now() - t0, model: cfg.model }));
        else res.end(JSON.stringify({ ok: false, error: JSON.stringify(out).slice(0, 300) }));
      } catch (e) { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: String(e) })); }
    });
    return;
  }
  /* 夜间巡检结果：GET 读报告，?run=1 手动触发 */
  if (url.pathname === '/api/patrol') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (url.searchParams.get('run') === '1') return res.end(JSON.stringify({ ok: true, report: runPatrol() }));
    try { return res.end(JSON.stringify({ ok: true, report: JSON.parse(read(PATROL_FILE)) })); }
    catch { return res.end(JSON.stringify({ ok: false, error: '还没有巡检报告' })); }
  }
  /* 实例快照手动触发 */
  if (url.pathname === '/api/snap' && req.method === 'POST') {
    exec(`"${path.join(__dirname, '..', 'tools', 'instance-snap.sh')}"`, { cwd: ROOT }, (e, out) => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(e ? { ok: false, error: String(e).slice(0, 120) } : { ok: true, msg: (out || '').trim().split('\n')[0] || '已快照' }));
    });
    return;
  }
  /* 全局总揽：GET 读已有；POST 让 AI 读全部项目 AGENTS.md+office/notes 生成 ≤3000 字总揽 */
  if (url.pathname === '/api/summary') {
    const SUM = path.join(ROOT, 'SUMMARY.md');
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      const t = read(SUM);
      return res.end(JSON.stringify(t ? { ok: true, summary: t, at: fs.statSync(SUM).mtime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) } : { ok: false, error: '还没生成过' }));
    }
    if (req.method === 'POST') {
      const ep = llmEndpoint();
      if (!ep) { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ ok: false, error: '没有可用 API key（⚙ 设置里配一个）' })); }
      // 收集材料：观澜板 + 每个项目 AGENTS.md 前 40 行 + office/notes
      const dev = path.join(process.env.HOME || '', 'Developer');
      let mats = '【观澜板（项目全景）】\n' + read(path.join(ROOT, 'INDEX.md'));
      try {
        for (const name of fs.readdirSync(dev)) {
          const a = path.join(dev, name, 'AGENTS.md');
          if (name.startsWith('.') || !fs.existsSync(a)) continue;
          mats += `\n【项目 ${name}】\n` + read(a).split('\n').slice(0, 40).join('\n');
        }
      } catch {}
      mats += '\n【office 域】\n' + read(path.join(ROOT, 'office', 'AGENTS.md')) + '\n【notes 捕获站】\n' + read(path.join(ROOT, 'notes', 'README.md'));
      fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ep.key },
        body: JSON.stringify({ model: ep.model, stream: false, messages: [{ role: 'user', content:
          '你是"总揽师"。基于以下材料，生成一份不超过 3000 字的全局总揽（简体中文）：\n' +
          '1) 每个项目一段：它是什么+当前状态+近期值得注意的点（各 2-3 句）\n' +
          '2) 项目之间的关联与依赖\n' +
          '3) office/notes 的动态与待分流事项\n' +
          '4) 结尾一节"近期全景一句话"\n直接输出正文（Markdown，可用小节标题），不要开场白。\n\n==== 材料 ====\n' + mats }] }),
      }).then(async r => {
        const j = await r.json();
        if (!(j.choices && j.choices[0])) { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ ok: false, error: JSON.stringify(j).slice(0, 200) })); }
        const summary = j.choices[0].message.content;
        fs.writeFileSync(SUM, summary);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, summary, at: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) }));
      }).catch(e => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: String(e).slice(0, 150) })); });
      return;
    }
  }
  /* 卡片打开目录：code / finder / terminal */
  if (url.pathname === '/api/open' && req.method === 'POST') {
    let b = ''; req.on('data', c => b += c);
    req.on('end', async () => {
      try {
        const j = JSON.parse(b || '{}');
        const r = await openDir(j.name || '', j.app || 'code');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(r));
      } catch (e) { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: String(e) })); }
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
