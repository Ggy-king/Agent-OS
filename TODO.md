# TODO —— 全局待办清单（防遗忘；干完一项勾一项）

> 2026-11-17 建。AI 干完活顺手更新本清单；每完成一项勾掉并标日期。

## 人类动作（AI 等拍板）
- [ ] **6 份 AGENTS.md 草稿过目定稿**（chanGy / xiaoke-app / xiaoke-mac / portctl / daily-quote / office）：确认后删"【草稿，待人类过目】"标记 → 然后才能 push GitHub
- [ ] **push GitHub 收官**（依赖上一条；CHANGELOG/模板已就绪）
- [ ] exo AGENTS.md 按新模板对齐（用户说"后续再说"）

## AI 可执行（等触发或按需）
- [ ] **执行门禁最小版（hooks）**：Claude Code PreToolUse 钩子拦截危险操作（rm -rf / git push --force / 读凭据文件）——把"凭据绝不进 git"从纪律变硬拦截。**需用户拍板**（要写 ~/.claude/settings.json，改环境）；合理时机=影子实测通过后顺手配。源自 2026-11-18 外部 AI 评审"有宪法无执行"批评的采纳项
- [x] **影子同步脚本** ✅ 已建（2026-11-17 tools/sync-shadows.sh：剥围栏+工具检测+check 模式）——待影子实测验证
- [ ] **看板管家写盘动作**：管家目前只读不写；嵌入"登记无主之地/改 INDEX 行"的写能力（看板迭代清单里的老项）
- [ ] **巡检智能化 v2**：当前只列"近 7 天活跃项目"；下一步对比 INDEX 卡片内容 hash，精确提示"动了但卡片没更新"的清单
- [ ] **office 域持续实战**：工作流已验证通（2026-11-17 升职演讲实战），等真实文档任务
- [ ] **待认领项目**：ChainVenturer / Guanlan 两代 / homeostasis_v5 7 / fundamental-radar-v2 —— AI 首次进目录自填
- [ ] **其它 CLI 工具的影子接入调研**（出现需求再做）

## 已裁决不做（防止反复提起）
- [x] **执行 Trace 可观测性**：**暂缓（2026-11-18）**——git log 已是变更 trace+交付自查有动文件清单，个人串行会话场景够用；**触发条件=真实出现多 Agent 并行协作**再建，现在建是预支复杂度（外部 AI 评审建议项，判定后择机）
- [x] douyin 字幕优先（B 站/YouTube 抓现成字幕）：**用户裁决 2026-11-17 暂不做**——纯语音转录是本地 CPU，不费 token，只省时间
- [x] LinkDigest 付费方案：用户否决，douyin2text 已替代
- [x] 全项目 MCP 层：徒增工作量，chanGy 已有 mcp_server 按需连

## 维护纪律
- 本清单与 CHANGELOG.md 分工：这里放"将来要做"，CHANGELOG 放"过去做了什么"
- AI 干完活更新对应项；人类每月扫一次（或让管家在巡检里提醒清单积压）
