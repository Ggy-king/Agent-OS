# INSTALL —— 安装清单（排好序，按工具分叉，做完勾掉）

> **执行者**：本清单由**人类主导**执行；AI 可代为执行单条命令，但每步需人确认
> （唯一例外：模式 A 系的影子 cp 是无风险复制，AI 可直接做）。

## 第 1 步【所有模式通用，已完成】真理目录就位

- [x] agent-os/ 六件套齐：README / DESIGN / GLOBAL-MASTER / INDEX / INSTALL / TEST-PROTOCOL

## 第 2 步【按你的工具三选一或并存】接入

### 模式 A：Claude Code（自动注入）
- [ ] 复制母版为全局层：
      `cp ~/Developer/agent-os/GLOBAL-MASTER.md ~/.claude/CLAUDE.md`
      （去掉外层代码围栏再放；之后每次会话自动生效）

### 模式 A'：Codex（自动注入）
- [ ] 同款影子：GLOBAL-MASTER.md 内容 → `~/.codex/AGENTS.md`（Codex 读 AGENTS.md 标准）

### 模式 A''：Cursor（自动注入）
- [ ] 全局规则：Settings → Rules for AI 粘母版正文；或项目里放 `.cursor/rules`

### 模式 B：纯 VSCode + AI 聊天插件（无自动注入）
- [ ] 无需安装文件。每个新会话第一句发（**全体系唯一入口句**，指向 README 由它带路）：
      > 我的全局规矩和项目地图在 ~/Developer/agent-os/，先读 README.md，按它的指引干活。
      （AI 有读文件能力就会自己接上；若插件无读文件能力，把 README 和 GLOBAL-MASTER 内容直接粘进对话）

### 模式 C：裸 API（某大模型/某 LLM 服务商/任意）
- [ ] GLOBAL-MASTER.md 全文 → system prompt；按任务附加对应项目 AGENTS.md 内容

**影子同步规则**：母版改了，把用到的模式 A/A'/A'' 影子同步一次（一条 cp 命令的事）。

## 第 3 步【所有模式】文档生活域

- [ ] 建 `~/Office/`（PPT/升职汇报/项目起草书/沟通稿）+ 一份薄 AGENTS.md（AI 起草）

## 第 4 步【所有模式】活跃项目逐个补 AGENTS.md

顺序建议：chanGy → xiaoke-app → xiaoke-mac → portctl → 其余
每份流程固定（细则）：
  ① AI 读项目现状 = 目录结构 + README/配置文件 + git log 近 20 条（10 分钟级概览，不跑代码）
  ② AI 起草 50-120 行，**直接写入项目 AGENTS.md，顶部标注【草稿，待人类过目】**
  ③ 人过目修改，删掉草稿标记 = 定稿
  ④ 同步 INDEX.md 对应行
  内容四块：项目是什么 / 特有规矩 / 本项目 skill 清单（任意来源，术语见 README 速览）/
  两条自查——开工自查与交付自查，**定义住在全局层通用纪律里**（日常纪律不定义在安装清单）
- [ ] chanGy
- [ ] xiaoke-app
- [ ] xiaoke-mac
- [ ] portctl
- [ ] exo（已有 AGENTS.md，补对齐即可）
- [ ] 其余"待认领"项目（ChainVenturer / Guanlan 两代 / homeostasis_v5 7 / fundamental-radar-v2）：
      各自 AI 首次进目录自填 INDEX.md 行 + 生成 AGENTS.md

## 第 5 步【可选，以后再说】launcher

- [ ] portctl 式菜单：选项目 → cd → 拉起会话（项目多到菜单都嫌乱再做）
