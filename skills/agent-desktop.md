# agent-desktop —— AI 直接操作桌面 GUI（Vercel 官方 CLI）

> 让 AI"看见"并"操作"桌面应用：读系统无障碍树，每个按钮/输入框都是带编号的格子（ref），
> 用 ref 精确点击/输入。**默认不动鼠标、不抢焦点**——AI 干活时人可以继续用电脑。
> Rust CLI，25.9k star，Apache-2.0，macOS 13+/Win10+/Linux。

## ⚡ 运行协议（AI 第一眼必读，先于一切）

运行前先看下方【运行记录】判断自己是第几次运行：

- **有记录 = 你是第 N 次运行**：照记录里的命令跑。
  🚫 **禁止升级/重装本工具或动其权限配置**。跑不通 → 报错原样给用户，经用户许可后再动。
- **无记录 = 你是第一次运行**：跑完后把实际命令/版本/权限状态/踩的坑**正式追加进【运行记录】**。
- **换电脑 = 台账只是参考**：点名"跑换机适配"统一处理。

## 用法（指针式，不拷贝官方手册）

- **官方操作指南**（循环/ref/验证规则，随版本更新）：AI 首次正式使用前先跑
  `agent-desktop skills get desktop` 拉最新指南照做——咱只存指针，不存内容
- 核心循环：`agent-desktop snapshot --app <应用>` 拿带 ref 的 JSON 树 → `agent-desktop click @ref` /
  `type @ref "文本"` → 再 snapshot 验证
- `agent-desktop status` 看平台与权限；`agent-desktop permissions --guide` 打开系统设置引导
- 权限给的是**启动它的那个 App**（终端/CodeBuddy 宿主）——换宿主要重新拖一次

## 🚫 红线

1. **屏幕隐私**：snapshot/剪贴板/截图读到的一切内容**禁止写进任何会上传的地方**
   （公开仓、日志、记忆文件）；读完即用即弃
2. **高危操作**（删文件/发消息/付款类点击）必须先向用户确认，不做静默高危动作
3. headless 是默认形态；要用 `--headed`（真实鼠标键盘）必须用户明说

## 运行记录（台账：每次运行追加一条）

- **2026-11-21 · 本机 · 第 1 次运行（安装+体检）**
  - 安装：`npm install -g agent-desktop` → v1.3.1，落 `/opt/homebrew/bin/agent-desktop`（brew 源卡，npm 2 秒）
  - `agent-desktop status`：平台 macOS ✓；权限 accessibility/screen_recording 起初 denied → 用户系统设置授权后 **granted**
  - 环境备注：纯 CLI 无依赖纠缠；换机只需 npm 重装+重新授权（授权对象=宿主 App）
- **2026-11-21 · 本机 · 授权后首次真实操作（全链路通）**
  - 实测：launch 计算器 → snapshot 拿 27 个按钮 ref → click 7/加/8/等于 → 回读显示屏 **"15"** ✓（观察→行动→验证完整闭环）
  - **踩坑（重要）**：①**ref/窗口 id 是会话作用域**——每条 CLI 调用独立会话时 id 不共享（`WINDOW_NOT_FOUND`/`No window with id`），跨命令必须带同一个 `--session 名字` ②窗口在屏幕外/最小化时 AX 不暴露（`WINDOW_NOT_FOUND` 但 list-windows 看得见）→ `close-app` 重开即好 ③`-i` 只留可交互节点，**读屏幕数值要全量快照**（去掉 `-i`，数值在 statictext 里）④`launch` 是位置参数（`launch Calculator`），`click` 不带 `--app`
  - 待办：MPS 加速提示来自 ctranslate2（faster-whisper 场景），与本工具无关
- **2026-11-21 · 本机 · 后台模式实测（不打扰用户开发）**
  - **被完全遮挡也能干活**：Finder 全屏盖住计算器后，读树 ✓ 后台点击 ✓ 回读显示屏 ✓——用户屏幕毫无动静。结论：**被盖住没关系，别最小化**（最小化的窗口 AX 不暴露；裸后台启动也不开窗，必须先 `--activate` 开一次窗）
  - **token 实测**：小应用精简树（-i --compact）≈4.6KB（约 1.5-2k token），和一张截图同量级；**大页面（浏览器整页）全量树可能几十 KB，反超截图——禁止整页 dump**。正确姿势=按需查询：`find` 按名字定位 → `--root @ref` 只展开目标区域 → 操作 → 同区域复检
  - 树覆盖范围：原生 App/标准控件=完整；浏览器=有（页面语义化程度决定质量，公司前端是 HTML 可用）；游戏/canvas 自绘=残缺或没有（这类才需要退回截图坐标模式）
