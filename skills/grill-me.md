# grill-me（拷问我）—— 需求澄清神器

> 来源：Matt Pocock（TypeScript 圈大神）开源技能库 mattpocock/skills（GitHub 25 万+星）。
> 号称"token 回报率最高的提示词"——全文三句话，专治 AI 瞎写代码。
> 原理：AI 给烂答案多半不是它笨，是**你自己还没想清楚要什么**——所以让它反过来拷问你。

## 原文（英文，Claude Code 里可 `/grill-me` 直调，或粘贴本段）

```text
Interview me relentlessly about every aspect of this plan until we reach a shared
understanding. Walk down each branch of the design tree, resolving dependencies
between decisions one-by-one. For each question, provide your recommended answer.
Ask the questions one at a time. If a question can be answered by exploring the
codebase, explore the codebase instead of asking.
```

## 中文版（给不认英文 prompt 的 AI 用）

```text
毫不留情地面试我这个计划的方方面面，直到我们达成完全共识。沿着设计树的每个分支走，
逐个解决决策之间的依赖关系。每个问题都要附上你推荐的答案。一次只问一个问题。
能通过查看代码库回答的问题，先自己查代码库，不要问我。
```

## 用法

1. 动手做需求**之前**，把这段话+你的需求一起发给 AI
2. AI 变成面试官，一次一个问题地拷问你（每个问题带推荐答案，你只需确认/否决）
3. 拷问结束后让它把共识整理成 PLAN.md
4. （进阶）清空上下文再按 PLAN 执行，避免拷问过程污染执行上下文

## 适用场景

大型重构、新项目立项、技术方案设计、编码前方案审查——**凡是"需求还没想清楚"的场合**。
不适合：一句话能说清的小改动。

## 本机接入状态

- Claude Code：可 `/plugin install mattpocock-skills`（官方插件，未装）
- 其他所有工具：粘贴上方 prompt 即用（零依赖）
- 用过的项目：在项目 AGENTS.md 的 skill 清单里登记一行
