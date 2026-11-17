#!/bin/zsh
# sync-shadows —— 把全局层实例同步成各工具的影子（自动剥外层代码围栏）
# 用法：
#   sync-shadows.sh          # 同步到所有检测到的工具
#   sync-shadows.sh check    # 只看差异，不写入
# 原则：影子必须用实例 GLOBAL-MASTER.md（不是模板）；母版改动后跑一次即可。
SRC="$HOME/Developer/agent-os/GLOBAL-MASTER.md"
[ -f "$SRC" ] || { echo "找不到实例 $SRC"; exit 1; }

# 剥外层围栏：文件结构固定为首行 ```markdown、末行 ```，直接掐头去尾
STRIPPED=$(tail -n +2 "$SRC" | sed -e '$d')

TARGETS=()
[ -d "$HOME/.claude" ] || command -v claude >/dev/null && TARGETS+=("$HOME/.claude/CLAUDE.md")
[ -d "$HOME/.codex" ] || command -v codex >/dev/null && TARGETS+=("$HOME/.codex/AGENTS.md")

if [ ${#TARGETS[@]} -eq 0 ]; then
  echo "未检测到 claude/codex CLI（~/.claude 或 ~/.codex 均不存在），无从同步。"
  echo "装好任一工具后重跑本脚本即可。"
  exit 0
fi

for t in $TARGETS; do
  if [ "$1" = "check" ]; then
    if [ -f "$t" ] && diff -q <(echo "$STRIPPED") "$t" >/dev/null 2>&1; then
      echo "= $t 已是最新"
    else
      echo "≠ $t 有差异（跑 sync-shadows.sh 写入）"
    fi
  else
    mkdir -p "${t:h}"
    echo "$STRIPPED" > "$t"
    echo "✓ 已同步 $t（$(echo "$STRIPPED" | wc -l | tr -d ' ') 行）"
  fi
done
