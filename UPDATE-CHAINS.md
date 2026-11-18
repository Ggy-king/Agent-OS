# UPDATE-CHAINS —— 更新逻辑链总览（谁更新什么、怎么更新、要不要 AI）

> 回答一个灵魂问题："这些文件到底是静态的还是动态的？哪些要烧 token？我忘了哪个没更新怎么办？"
> 看板 🔧 维护视图渲染的就是本文档。三条铁律：
> ①**自动的永远不用你操心**（巡检/快照）；②**AI 更新的都是大节点**（小活不写）；③**手动同步只有影子一个**。

## 一、全自动（零操心，零 token）

| 对象 | 机制 | 频率 |
|---|---|---|
| dashboard/data/patrol.json（夜间巡检报告） | 看板内置定时器，git log 扫全项目（休眠错过会补跑） | 每晚 23:00 |
| dashboard/data/last-rulescan.json（规矩体检快照） | 巡检顺手跑 `tools/rule-scan.js`：全局影子一致性 + 各项目规矩文件判灯/漂移事件；看板 🔧 维护视图可手动看 | 每晚随巡检 |
| 实例快照（~/.agent-instances.git） | 巡检跑完顺手固化一份；可手动 `tools/instance-snap.sh`（log/show/roll） | 每晚随巡检 |
| dashboard/dashboard.log | 服务自动写 | 持续 |

## 二、AI 更新（大节点才发生，日常小活不写）

| 对象 | 触发时机 | 📋 对 AI 说（复制即用，任何目录任何工具） |
|---|---|---|
| INDEX.md 各项目行 | 接手新项目 / 大版本完成 / 方向变化 | "更新观澜板：把 XX 项目那行改成……" |
| INDEX.md 无主之地 | 干了一件跟任何项目无关的事 | "记入无主之地：日期+事项一句话" |
| TODO.md | 干完活勾对应项 / 新想法入册 | "更新 TODO：XX 项完成 / 新增待办 XX" |
| CHANGELOG.md | 一个版本收口时 | "CHANGELOG 追加 vN.N 段落" |
| skills/（登记新 skill） | 发现好 skill 且项目真要用 | "按 SKILLS.md 登记流程装 skill：XXX，来源 XXX" |
| 项目 AGENTS.md | 该项目 AI 自维护（大节点） | 在该项目目录：'按 AGENTS.md 规矩更新你自己' |

## 三、人类手动（只有两处，都有工具兜底）

| 对象 | 时机 | 操作 |
|---|---|---|
| GLOBAL-MASTER.md（全局纪律） | AI 提议修改，人拍板后 | 直接编辑实例 → **必须跑 `tools/sync-shadows.sh`** 同步影子（⚠ 别裸 cp，会带代码围栏） |
| dashboard/data/config.json（管家 key） | 换 API/key 时 | 看板 ⚙ 设置页填，或直接编辑该文件 |

## 四、静态（写了就不怎么动）

README / DESIGN / INSTALL / TEST-PROTOCOL / UPDATE-CHAINS（本文件）/ 各 *.template.md——
架构级文档，改动=版本级事件，跟着 CHANGELOG 走。

## 五、同步口诀（怕忘就记这句）

**"改宪法→刷影子；改项目→观澜板；其它全自动。"**
拿不准哪个没更新：跑 `tools/sync-shadows.sh check` + 看板 🔧 维护视图。
