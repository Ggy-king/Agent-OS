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

- ✅ **已装可用**（2026-11-17）：方案①的精简自研版 `douyin2text.py`，真实抖音链接实测全链路通过（下载→转录→文案）
- 依赖实装：ffmpeg 9.0.2（brew）、yt-dlp 2026.10.26（python3.12 pip --user）、faster-whisper（pip --user）
- 用法：`python3 skills/douyin2text.py <链接> [--model small]`，输出=视频标题+口播文案

## 实战记录（2026-11-17 首战，4 个坑全踩过）

1. **系统 Python 3.9 锁死 yt-dlp 老版本**→ 用 brew 的 python3.12 `pip install --user --break-system-packages` 装新版；脚本自动探测新版解释器
2. **"Fresh cookies needed" 报错是误导**：yt-dlp 抛它时根本没查 cookie，真死因=抖音 a_bogus 签名算法更新（yt-dlp 已知回归，curl_cffi TLS 伪装也救不了）→ **绕行路=iesdouyin.com/share/video/{id} 分享页解析**（脚本已内置为第三通道）
3. **分享页必须手机 UA** 才吐 SSR 数据（`window._ROUTER_DATA` JSON），桌面 UA 只回 JS 壳；cookie 借 yt-dlp 的 Chrome 解密机制（`extract_cookies_from_browser`）
4. **HuggingFace 下载模型国内超时** → 脚本内置 `HF_ENDPOINT=https://hf-mirror.com` 国内镜像
5. 网络卡顿记得走本机代理（端口见全局层纪律的本机实例，各机不同）
