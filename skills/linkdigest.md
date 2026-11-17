# LinkDigest —— 社媒链接转 AI 可读文本

> 来源：linkdigest.dev（2026 年 agent 圈流行的托管服务）。
> 解决的问题：AI 擅长读文本、打不开链接——抖音/小红书的分享链接丢给它只会卡壳。
> LinkDigest 把一条社媒链接变成 AI 能直接吃的文本：**文案、口播逐字稿、图上文字 OCR、
> 关键点提炼**，一-ended 闭环（搜索+提取都做）。
> 支持：小红书、抖音、TikTok、YouTube、X、微博（微博走访客页免登录）。

## 形态

1. **REST API**：POST https://linkdigest.dev/api/v1/digest（带 `LINKDIGEST_API_KEY`），
   抖音口播文案约 25 秒返回（先 202 pending 再取结果）
2. **托管 MCP server**：给支持 MCP 的工具直连
3. **Agent skill 文件**：SKILL.md + 仅用 Python 标准库的脚本（Claude Code/Cursor/OpenClaw
   等通用）；部分单链读取（标★）无 key 可首次试用

## 费用

- 按 credits：$5 买 250 credits（支持支付宝，约 ¥36）或 $9/月 500 credits
- 标★的单链读取无需 key 可先试
- **未注册、无 key → 记账状态"待接 key"**

## 本机接入状态

- **待接 key**：注册 linkdigest.dev → 拿 `LINKDIGEST_API_KEY` → 填入环境变量或
  本地 keys 存放处（涉付费，注册前先问人）
- key 到位后：下载它的 agent skill 文件放本目录，或按工具接 MCP
- 接入前替代方案：手动把视频文案复制给 AI（土但免费）
