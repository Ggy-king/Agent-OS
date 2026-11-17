# dashboard —— 总控可视化看板

**启动**：`node server.js` → 浏览器开 http://127.0.0.1:9140（Ctrl+C 停止）

**功能**：
- 宪法区：全局层通用纪律/关联图谱/skill 库/维护规则 自动渲染
- 观澜板卡片墙：项目按域分组，卡片显示名字/状态/AGENTS.md 徽标（✓已定稿 / 草稿）/点卡片看打开方式
- 无主之地编年史、office/notes 状态、全局 skill 库表格
- **总控管家对话框**（右下角）：example-model，system=总管身份+观澜板+全局层实时读取——
  问状态、路由任务、登记无主之地，直接在面板里说

**API key**：`dashboard/data/keys.json` 填 `{"provider":"你的某 LLM 服务商key"}`（本文件已 gitignore）；
想复用本机其它项目已有的 key：把那些 keys.json 的绝对路径列进 `dashboard/data/key-paths.json`
（格式 `["~/some/path/keys.json"]`，本机文件已 gitignore，不上传）。
没 key 时其余看板功能照常，仅管家对话不可用。

**依赖**：零依赖，Node ≥ 18。数据全部来自上级目录的 md 文件——**改了 INDEX/GLOBAL-MASTER
刷新页面即生效**（对话的 system 也是每次实时读文件，天然指针式）。
