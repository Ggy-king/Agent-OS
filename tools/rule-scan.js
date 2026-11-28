#!/usr/bin/env node
/**
 * rule-scan —— 规矩文件体检（零 token 机械扫描，只读 + 自家快照）
 * 两个体检面：
 *   A 全局影子：各 AI 工具的影子文件是否与 GLOBAL-MASTER.md 一致（ok/stale/missing/absent）
 *   B 项目层：各项目根目录规矩文件判灯（🟢权威+指针 / 🔴复制品 / ⚪无文件）+ 与上次快照对比的漂移事件
 *            + AGENTS.md 必备标记点名（清单在 ai-registry.json 的 agents_markers：规范变更改清单→当晚点名所有没跟上的项目）
 * 用法：
 *   node rule-scan.js                 # JSON 输出（看板/巡检用），并更新快照
 *   node rule-scan.js --text          # 人读文本输出
 *   node rule-scan.js --root <dir>    # 指定项目根（测试用，不写快照、不污染真实基线）
 *   node rule-scan.js --snap <file>   # 指定快照文件（默认 dashboard/data/last-rulescan.json，gitignore）
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'ai-registry.json'), 'utf8'));
const MASTER_FILE = path.join(ROOT, 'GLOBAL-MASTER.md');
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const PROJECTS_ROOT = opt('--root') || path.join(os.homedir(), 'Developer');
const SNAP_FILE = opt('--snap') || path.join(ROOT, 'dashboard', 'data', 'last-rulescan.json');
const TEXT = args.includes('--text');
const SKIP_SNAP = !!opt('--root'); // 测试模式不写快照

const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const exp = (p) => p.replace(/^~/, os.homedir());
const now = () => new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

/* 宪法剥外壳 —— 与 sync-shadows.sh 的 tail -n +2 | sed '$d' 逐字同义：
   无条件掐首行（标题行）、去掉末尾空行后再去末行（围栏行）。判定 ok/stale 必须与影子生成算法完全一致 */
function masterStripped() {
  const lines = fs.readFileSync(MASTER_FILE, 'utf8').split('\n');
  lines.shift(); // 掐头（无条件，同 tail -n +2）
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop(); // 末尾空行（文件以 \n 结尾时最后一元素是空串）
  if (lines.length && lines[lines.length - 1].trim() === '```') lines.pop(); // 去尾围栏（同 sed '$d'）
  return lines.join('\n').trim();
}
/* 指针判定：≤3 行且含 @AGENTS.md —— 一行引用，永不漂移 */
function isPointer(content) {
  const lines = content.trim().split('\n');
  return lines.length <= 3 && content.includes('@AGENTS.md');
}

/* ---------- Section A：全局影子体检 ---------- */
function scanGlobal() {
  const master = fs.existsSync(MASTER_FILE) ? masterStripped() : null;
  return REG.tools.map((t) => {
    let installed = (t.detect.dirs || []).map(exp).some((d) => {
      try { return fs.statSync(d).isDirectory(); } catch { return false; }
    });
    if (!installed) {
      for (const c of (t.detect.cmds || [])) {
        try { execSync(`command -v ${c}`, { stdio: 'pipe' }); installed = true; break; } catch {}
      }
    }
    const shadow = exp(t.shadow);
    const exists = fs.existsSync(shadow);
    let status = 'absent'; // 未安装：不算坏
    if (installed) {
      if (!master) status = 'stale'; // 找不到实例宪法，无从核对
      else if (!exists) status = 'missing'; // 已装但没影子 → 裸奔，红
      else status = hash(fs.readFileSync(shadow, 'utf8').trim()) === hash(master) ? 'ok' : 'stale'; // 过期，黄
    }
    return { name: t.name, shadow: t.shadow, installed, shadowExists: exists, status };
  });
}

/* ---------- Section B：项目层扫描 ---------- */
function isWhitelisted(name) {
  if ((REG.whitelist_md || []).includes(name)) return true;
  if (/\.template\.md$/.test(name)) return true; // 模板文件通用豁免
  return false;
}
function scanProjects() {
  let names = [];
  try { names = fs.readdirSync(PROJECTS_ROOT).filter((n) => !n.startsWith('.')).sort(); } catch { return []; }
  const out = [];
  for (const name of names) {
    const dir = path.join(PROJECTS_ROOT, name);
    try { if (!fs.statSync(dir).isDirectory()) continue; } catch { continue; }
    const files = [], contentMap = {};
    let agentsContent = null; // AGENTS.md 原文，供必备标记检查
    for (const f of REG.project_files) {
      const fp = path.join(dir, f);
      if (!fs.existsSync(fp)) continue;
      let content = '';
      try { content = fs.readFileSync(fp, 'utf8'); } catch { continue; }
      if (f === 'AGENTS.md') agentsContent = content;
      const role = f === 'AGENTS.md' ? 'authority' : isPointer(content) ? 'pointer' : 'copy';
      files.push({ file: f, role, hash: hash(content) });
      contentMap[f] = hash(content);
    }
    for (const d of (REG.project_dirs || [])) {
      if (fs.existsSync(path.join(dir, d))) { files.push({ file: d, role: 'dir-rule', hash: 'dir' }); contentMap[d] = 'dir'; }
    }
    /* 未知候选：根目录一级 .md，不在注册表也不在白名单 → 上报等人确认 */
    const unknown = [];
    try {
      for (const n of fs.readdirSync(dir)) {
        if (!/\.md$/i.test(n) || isWhitelisted(n) || REG.project_files.includes(n)) continue;
        const fp = path.join(dir, n);
        try { if (!fs.statSync(fp).isFile()) continue; } catch { continue; }
        let content = '';
        try { content = fs.readFileSync(fp, 'utf8'); } catch { continue; }
        unknown.push(n);
        contentMap[n] = hash(content);
      }
    } catch {}
    const hasCopy = files.some((f) => f.role === 'copy');
    /* 必备标记点名：零 token grep。项目没写 AGENTS.md 的（⚪）不查——gray 已另计 */
    const markers_missing = [];
    if (agentsContent !== null) {
      for (const m of (REG.agents_markers || [])) {
        if (!agentsContent.includes(m.line)) markers_missing.push(m.line + (m.why ? `（${m.why}）` : ''));
      }
    }
    const status = hasCopy ? 'red' : files.length === 0 ? 'gray' : 'ok';
    out.push({
      name,
      status,
      files,
      unknown,
      markers_missing,
      events: { new: [], gone: [], changed: [] },
      _map: contentMap, // 内部字段，输出前剥掉
    });
  }
  return out;
}

/* ---------- 漂移事件：与上次快照对比（新出现/消失/内容变更） ---------- */
function diffEvents(projects, prev) {
  if (!prev || !prev.projects) return 0;
  let n = 0;
  for (const p of projects) {
    const old = prev.projects[p.name] || {};
    for (const k of Object.keys(p._map)) if (!(k in old)) { p.events.new.push(k); n++; }
    for (const k of Object.keys(old)) if (!(k in p._map)) { p.events.gone.push(k); n++; }
    for (const k of Object.keys(p._map)) if (k in old && old[k] !== p._map[k]) { p.events.changed.push(k); n++; }
  }
  return n;
}

/* ---------- 主流程 ---------- */
const scan = { at: now(), root: PROJECTS_ROOT, global: scanGlobal(), projects: scanProjects() };
let prev = null;
try { prev = JSON.parse(fs.readFileSync(SNAP_FILE, 'utf8')); } catch {}
scan.eventCount = diffEvents(scan.projects, prev);
if (!SKIP_SNAP) {
  fs.mkdirSync(path.dirname(SNAP_FILE), { recursive: true });
  fs.writeFileSync(SNAP_FILE, JSON.stringify({
    at: scan.at,
    projects: Object.fromEntries(scan.projects.map((p) => [p.name, p._map])),
  }, null, 2));
}
const outProjects = scan.projects.map(({ _map, ...rest }) => rest);
const result = { at: scan.at, root: scan.root, global: scan.global, projects: outProjects, eventCount: scan.eventCount };

if (TEXT) {
  const gi = (s) => s === 'ok' ? '🟢' : s === 'stale' ? '🟡' : s === 'missing' ? '🔴' : '—';
  const pi = (s) => s === 'ok' ? '🟢' : s === 'red' ? '🔴' : '⚪';
  const L = ['规矩文件体检 —— ' + result.at, '【全局影子】'];
  for (const g of result.global) {
    const note = g.status === 'stale' ? '过期：跑 tools/sync-shadows.sh'
      : g.status === 'missing' ? '已装但没影子（裸奔）：跑 tools/sync-shadows.sh'
      : g.status === 'absent' ? '未安装' : '已同步';
    L.push(`  ${gi(g.status)} ${g.name.padEnd(8)} ${note}`);
  }
  L.push('', `【项目层】${result.projects.length} 个（根：${result.root}）`);
  for (const p of result.projects) {
    const fl = p.files.length ? p.files.map((f) => f.file + (f.role === 'pointer' ? '(指针)' : f.role === 'copy' ? '(复制品!)' : '')).join(' ') : '无规矩文件';
    const ev = [...p.events.new.map((x) => '新:' + x), ...p.events.gone.map((x) => '失:' + x), ...p.events.changed.map((x) => '变:' + x)].join(' ');
    L.push(`  ${pi(p.status)} ${p.name}  ${fl}${ev ? '  ⇡ ' + ev : ''}${p.unknown.length ? '  [未知候选:' + p.unknown.join(',') + ']' : ''}${p.markers_missing.length ? '  [缺标记:' + p.markers_missing.join(' | ') + ']' : ''}`);
  }
  console.log(L.join('\n'));
} else {
  console.log(JSON.stringify(result));
}
