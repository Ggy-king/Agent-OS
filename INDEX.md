# INDEX —— 观澜板（总控的眼睛）【本机实例，gitignore 不上传】

> 空白模板见 INDEX.template.md。每台电脑一份自己的实例。
> 每个项目 3 行以内。AI 干完活顺手更新自己那行；你扫一眼知全部。
> 深入细节：进该项目目录看它的 AGENTS.md（该项目 AI 自维护）。
> 「待认领」= 还没有 AI 进去过，下次进目录时让 AI 自己填自己的行。

## 代码域 ~/Developer/

### 小可双子（AI 伴侣）
- **xiaoke-app** — 旧手机改造 AI 伴侣 App（角色铃木），Android+网页版；v1.4 已发（记忆v1/情绪/EdgeTTS），记忆 v2 网页版已实现待移植；AGENTS.md 已建（草稿待人过目）
- **xiaoke-mac** — 小可 Mac 主机端：Node 服务(8100)+Ollama qwen3:14B 主力，云/本地双大脑、三层记忆；阶段2 ✅ E2E 全绿，下一步阶段3 常开化；AGENTS.md 已建（草稿待人过目）

### 量化（缠论/行情）
- **chanGy** — 私有主仓：缠论量化系统（Python+天勤 tqsdk），实盘监控/复盘/统计全套；近期主线 Agent v2/RAG/MCP；AGENTS.md 已建（草稿待人过目，含公私仓分界硬约束）
- **chanGy-public** — 公开镜像 github.com/Ggy-king/chanGy；已过全历史隐私审计；**改动前必过审计三件套**
- **fundamental-radar-v2** — 基本面雷达（Python），小工具；待认领

### 个人基建
- **agent-os** — 这台电脑的 AI 总控母版（原生，git 基线 v1.0；实验一律在 agent-os-lab 做）；**可视化看板已上线**：dashboard/ 目录 `node server.js` → http://127.0.0.1:9140（卡片墙+管家对话）
- **agent-os-lab** — agent-os 实验场：架构试验性改动只在这里迭代，验证通过经人拍板才合并回原生
- **exo** — 全能装备库（skill 库来源之一）：prompts/ 装备 + 软件容器（7310）+ library/ 素材库；**AGENTS.md 已有**（早期版本，后续按新模板对齐）
- **portctl** — 端口管家（9123）：零依赖单文件 Node，扫描/停止/一键拉起本机服务；AGENTS.md 已建（草稿待人过目）。启动/停止别的服务前先问它
- **daily-quote** — 每日一言极简 CLI（Python 13 行），agent-os 新项目接入演练项目；AGENTS.md 已建（草稿待人过目）

### 待认领（AI 首次进入时自填本行）
- **ChainVenturer** — 大型 JS/TS 项目（3 万+ 文件），用途待填
- **Guanlan / Guanlan-pro** — 前端项目（两代？），用途待填
- **homeostasis_v5 7** — 目录名带空格，性质待填

## 无主之地（无路径活动的编年史）

> 跟所有项目都无关的一次性活动记这里，每条 1-3 行。
> 全局层放"永远为真的事"（宪法），这里放"发生过的事"（编年史）——谁也不污染谁。

- 2026-11-17 手环购买决策（无项目归属的典型）：全流程三轮比价+查证后定案 小米手环11 标准版·黑色，NFC 版经碰一碰支付价值重估后改推 278 NFC 版；E23 装备实战+两处规则修正入册
- 2026-11-17 agent-os 冷启动实验 #1/#2（7/10→8/10，缺陷全回写）——详细记录见 agent-os/TEST-PROTOCOL.md

## 文档生活域 ~/Office/（已建）

- 用途：PPT、升职/业绩汇报、项目起草书、沟通稿——非代码类产出；AGENTS.md 草稿已建待人过目
- 工作流：跨项目取资料 → 生成 → 回写本域 → 更新本板（见 DESIGN.md 第三节）

## 捕获站 ~/Notes/（已建）

- 跨界想法的落点：归属三问走不通时先落 `YYYY-MM-DD-主题.md`，标注 [global-candidate] 的行
  待人拍板后迁全局层；分流节奏每周一次或攒够 10 条（格式见 ~/Notes/README.md）
