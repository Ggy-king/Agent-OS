# SKILLS —— 全局 skill 库索引

> **登记规则：全局只登记一次，所有项目指针引用，禁止拷贝内容进项目文件。**
> 项目 AGENTS.md 的 skill 清单只写一行"名称（全局 skills/）+ 本项目怎么用"。
> 指针指向的文件改了，所有项目下次读到的都是新版——**指针式=天生实时，无需定时同步**。

## 触发策略（重要：AI 默认不主动调用）

- **默认状态：AI 不自动调任何 skill**——哪怕项目清单里登记了
- **显式触发**：你在话里点名才调（说"grill me"/"拷问我"/"用 xxx skill"）——这是主模式，可控
- **自动触发（可选进阶）**：Claude Code/CodeBuddy 的 skill 支持"Agent Requested"类型——
  在 skill 文件的描述里写清触发词（如"用户想压测方案/说 challenge my thinking 时"），
  AI 按描述自行判断。想要哪个 skill 自动化，在它的 md 里加触发词清单即可
- **人类职责**：全局 skill 库的每个 skill 是干嘛的、什么时候该用，看本索引即可——
  这就是本文件存在的意义

## 已入库

| skill | 状态 | 触发方式 | 一句话 | 详情 |
|---|---|---|---|---|
| grill-me（拷问我） | ✅ 立即可用 | 点名："grill me"/"拷问我" | 动手前让 AI 反向拷问你，治"需求没想清楚就瞎写" | [grill-me.md](grill-me.md) |
| 抖音转文案免费方案 | 📋 三选一待装 | 点名："抖音转文案" | 抖音链接→本地转写文案，全免费（yt-dlp+faster-whisper） | [douyin-free.md](douyin-free.md) |
| LinkDigest | ❌ 不接（付费，用户否决） | — | 付费社媒链接转文本服务，档案留作参考 | [linkdigest.md](linkdigest.md) |

## 候选区（看好但未实测，亲测后才转正——登记纪律）

来自 mattpocock/skills（25 万+星，17 个工程 skill）的候选，与本体系契合度高的：

| 候选 | 干什么 | 为什么心动 |
|---|---|---|
| caveman mode | 超压缩模式，省 75% token | 正是省 token 需求的现成答案 |
| grill-with-docs | grill-me 强化版：对照项目术语表，发现术语冲突立刻指出 | 与"设计文档先行"惯例契合 |
| diagnose | Bug 诊断六步法 | 严谨排障流程 |
| zoom-out | 让 AI 从全局视角解释代码 | 接手老项目利器 |
| git-guardrails | 危险 git 命令（push/reset --hard/clean）执行前拦截 | 公开仓安全相关 |
| write-a-prd | 访谈+代码库探索交互式生成 PRD | 大功能设计先行 |

## 登记新 skill 的流程

1. 在本目录建 `skill名.md`（来源/原文/用法/触发方式/本机接入状态）
2. 上表加一行（状态：立即可用 / 待装依赖 / 候选未实测）
3. 哪个项目用到，在该项目 AGENTS.md 的 skill 清单里登记一行指针
4. **全局登记 ≠ 全项目自动生效**——项目要用必须显式登记指针（避免每个 AI 会话无谓膨胀）
