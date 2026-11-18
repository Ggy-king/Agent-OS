# DESIGN —— 架构设计与参考出处

> 防幻觉声明：本文件所有"业界参考"均来自 2026-11-16/17 的真实联网搜索，
> 出处 URL 逐条列在文末。任何论断与出处不符，以出处为准并回改本文件。

## 一、架构总图（两层 AI，坚决不加第三层）

```
第0层 全局层   agent-os/GLOBAL-MASTER.md（母版）
              各工具影子：~/.claude/CLAUDE.md、~/.codex/AGENTS.md、Cursor rules…
              内容：我是谁 + 通用纪律 + 项目关联图谱 + 观澜板指针

第1层 域       目录分组（不是 AI，只是目录！）
              ~/Developer/  代码域
              ~/Office/     文档生活域（PPT/汇报/起草，待建）

第2层 项目层   每个项目目录一份 AGENTS.md（AI 自维护，50-120 行）
              项目是什么 / 特有规矩 / 本项目 skill 清单（任意来源）
              / memory（AI 全权，人类不看）
              进目录 = 自动加载 = worker 上线

第3层 会话     你 cd 进项目直接聊 = 直接进 worker

横向  观澜板   agent-os/INDEX.md（每项目 3 行，总控的眼睛）
```

**为什么只有两层 AI**：中转层损耗上下文，编排质量=主控智力；"域"只是目录分组，
不需要也不应该有"域总控 agent"。人当 router（第一版），AI 总控等几十个项目再说。

## 二、权限阶梯（解决"AI 自己生成的记忆我不想看"）

| 文件 | 谁写 | 人类参与度 |
|---|---|---|
| 全局层母版 | 人类锁定（AI 提议，人拍板） | 只看安装这一次 |
| 项目 AGENTS.md | AI 起草 → 人过目一次 → AI 小改 | 一次过目 |
| 项目 memory/ | AI 完全自治 | 永远不看 |

## 三、跨项目调度为什么不需要 MCP（重要认知，防再偏）

- 总控"知道所有项目"靠读 **INDEX.md 观澜板**——每项目 3 行，10 个项目 30 行，token 可忽略
- 总控深入某项目干活：本地文件读写是**内置能力**（读文件/列目录/搜索），或派 subagent
  进目录干完只带回结论，主控上下文不膨胀
- 本地文件的复制/参考（如"PPT 引用某项目总结"）= 直接读那个 MD，不需要任何协议
- **MCP 的真正岗位 = 接外部服务**（GitHub、数据库、公司内网系统），本架构不依赖它

## 三点五、捕获站：跨界想法与无路径活动（归属三问）

**物理限制先承认**：上下文不可能跨会话搬运——每个新对话都是空白。解法不是"搬上下文"，
是"让结论自己走对门"。想法/活动结束时问一句"这属于谁？"：

```
├─ 属于某项目   → 在项目里问，结论写进该项目 AGENTS.md/memory（长内容放项目目录，AGENTS.md 指针引用）
├─ 属于全局     → 在哪问都行，结论提交全局层候选（人类拍板后进 GLOBAL-MASTER）
├─ 一半一半     → 在项目里问，让 AI 把"通用部分"抽出来单独存，项目里只留项目部分
└─ 说清归属     → 落 ~/Notes/ 日期文件（如 2026-11-17-xxx.md），定期让 AI 归档分流
```

- 混的不是对话，是没归档的结论。`notes/` = 捕获站（承接 EXO E16 缺口探测器的 capture 思想）。
- **"一半一半"抽出的通用部分，暂存处 = agent-os/notes/**：落盘时标注 `[global-candidate]`，
  归档分流时 AI 按标记聚拢成"全局层候选清单"，由人拍板后由作者 AI 迁入 GLOBAL-MASTER.md，
  并删除已迁移的标记行。**候选区就是 notes/，不另设文件**。
- 无路径的一次性活动（装软件/改系统/闲聊决策）→ INDEX.md"无主之地"分区记 1-3 行。
- 分工铁律：**全局层放"永远为真的事"（宪法），观澜板放"发生过的事"（编年史）**。
- notes/ 分流节奏：每周一次，或攒够 10 条，由人喊一声触发（不搞自动定时）。
- 网页版 AI（网页对话工具）是黑盒，不做全量同步：重要产出让它输出 MD 格式、人复制进
  对应位置（一次粘贴换永久沉淀）；其余闲聊不值得归档。架构服务有产出的工作，不是所有聊天。
- **模板/实例分离**：README/DESIGN/INSTALL/AGENTS.md/*.template.md 进 git 可复用；
  INDEX.md 与 GLOBAL-MASTER.md 是本机实例（gitignore）——clone 后从模板复制生成再填写。

## 四、业界参考与出处（全部真实搜索所得）

1. **Claude Code 官方记忆四层**：enterprise → 用户级 `~/.claude/CLAUDE.md` → 项目级 → 子目录级，
   从当前目录向上递归合并加载；另有 auto memory（AI 自写笔记）。
   出处：claude.md（官方文档站" How Claude remembers your project"）；
   层级表细节见 CSDN《Claude Code 记忆系统(Memory)》 blog.csdn.net/2401_86544677；
   加载顺序见 CSDN《OpenClaw 用户必修课：Claude Code 配置系统详解》 blog.csdn.net/coolyoung520。
2. **Cline Memory Bank**：AI 自维护的六文件记忆银行（"我的记忆每次清零，所以必须维护完美文档"，
   《Memory Bank: How to Make Cline an AI Agent That Never Forgets》 cline.ghost.io）；
   官方文档 docs.cline.bot/features/memory-bank；社区拆解 aiagentmemory.org/articles/cline-memory-bank。
3. **SystemSculpt《My AGENTS.md Runs an Operating System, Not a Style Guide》**
   （systemsculpt.com/blog）：AGENTS.md 当操作系统而非风格指南 + skills 写一次全员共享
   + 三层记忆（memory_summary.md ~500 行持久真理）——与本项目构思高度同源。
4. **OpenClaw 灵魂四件套 + 权限阶梯**：workspace=Context Kernel（上下文内核），每次新对话
   按固定流程加载 AGENTS.md（员工手册，人类锁定）/ SOUL.md（AI 可改）/ USER.md（画像）/
   MEMORY.md（完全开放）；每 agent 独立 workspace（multi-agent routing）。
   出处：learnopenclaw.waytoagi.com（课程全景图，"权限阶梯：AGENTS.md>SOUL.md>MEMORY.md"）；
   openclawcn.com/en/docs/concepts/agent（Agent runtime，workspace 机制）；
   openclawcn.com/en/docs/reference/agents.default（默认 workspace=~/.openclaw/workspace）。
5. **AGENTS.md 开放标准**：agents.md（官方站），6 万+ 开源项目采用，Codex/Cursor/Claude Code
   等主流工具都读——本项目项目层文件统一用 AGENTS.md 名，跨工具通用。
6. **Agent OS Dashboard 生态**（佐证方向主流，非直接采用）：
   holaOS 0.1（Dashboard/Sub Agents/Multi Workspaces，creativeainews.com）；
   "Agent OS: Run Claude, Hermes & OpenClaw Together From One Dashboard"（openclawdatabase.com）。
7. **CLI 工具真实文件结构（2026-11-17 查证）**——工具目录里绝大多数是"运行时器官"
   （会话记录/凭据/sqlite 状态/日志，人不管、也跨工具迁不走），**上下文注入点每工具仅 1-2 个**：
   - Codex `~/.codex/`：config.toml、AGENTS.md（全局注入）、auth.json、sessions/、
     history.jsonl、memories/（AI 自记忆）、skills/、agents/、hooks.json、rules/；
     项目级 ./.codex/ 仅放覆盖项。出处：github.com/bigbluebaby/codex2dsh/docs/02-配置全解剖、
     github.com/coolnameismy/cursor_space/docs/codex-home.md、luoluo.help/docs/codex/config。
   - Claude `~/.claude/`：CLAUDE.md、settings.json、memory/、skills/、commands/、subagents/、
     rules/、projects/ 等。官方原话："Most users only edit CLAUDE.md and settings.json.
     The rest is optional." 出处：code.claude.com/docs/en/claude-directory。
   - 推论：**跨工具迁移的只有注入文件内容，工具内脏不迁移**——影子设计的实证基础。
