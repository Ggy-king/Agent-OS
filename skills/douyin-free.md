# 抖音链接转文案 —— 免费方案（替代付费的 LinkDigest）

> 用户裁决：付费不做。以下方案全部免费、本地跑、数据不出门。
> 共同原理：yt-dlp 解析抖音短链（v.douyin.com 自动展开）→ 下载视频/音频 →
> faster-whisper 本地语音转文字。抖音几乎没现成字幕，所以转写是保底路径。

## 候选方案（按推荐排序）

### ① video-to-text（agent skill，最贴近咱的体系）
- 来源：SkillsMP（bennytsai1234）社区 skill
- 设计聪明点：**能抓现成字幕就绝不浪费算力**——YouTube/B 站直接抓字幕秒出；
  抖音没字幕才走本地语音识别保底
- 依赖：yt-dlp、ffmpeg、faster-whisper（脚本启动自动检查，缺什么明确提示）
- 支持 v.douyin.com 短链自动展开

### ② 抖音视频解析（SkillHub 社区 skill）
- 来源：SkillHub @indiv-black_amico/douyin-video-parser v1.5.0（免费）
- 全链路一条命令：拿直链 → 下载 → 转写 → 分析 → 输出带时间戳逐字稿+连贯稿+HTML 报告

### ③ Video DL & Transcribe（GUI 工具，不想碰命令行时用）
- 来源：github.com/CokeloveMiyo/vedio
- 图形界面双击即用；支持 YouTube/B站/抖音（自动从分享文案提取链接）
- 数据不上云；转写模型 base 约 150MB 首次自动下载
- 注意：作者主推 Windows（macOS 可用命令行方式跑）

## 本机接入状态

- **未安装**。装任何一个前需确认依赖（Python 3.10+、ffmpeg、faster-whisper）——
  按全局纪律"不擅自装依赖，先问"，等人类点头再装
- 装好后在 SKILLS.md 登记转正，并把 LinkDigest 档案归档
