#!/bin/zsh
# instance-snap —— 实例文件本地版本控制（快照+回滚）
# 原理：独立裸 git 库（~/.agent-instances.git）+ --work-tree 指回本仓库，
#       只跟踪被 .gitignore 排除的本机实例文件——与主仓库完全隔离，永不 push。
# 用法：
#   instance-snap.sh            # 快照（无变化则不动）
#   instance-snap.sh log        # 看历史
#   instance-snap.sh show       # 看最近一次快照的改动
#   instance-snap.sh roll <hash或'HEAD~1'> [文件...]   # 回滚（恢复到指定版本）
GIT_DIR="$HOME/.agent-instances.git"
WT="$HOME/Developer/agent-os"
G=(git --git-dir="$GIT_DIR" --work-tree="$WT")

[ -d "$GIT_DIR" ] || git init --bare -q "$GIT_DIR"
FILES="INDEX.md GLOBAL-MASTER.md dashboard/data/config.json dashboard/data/patrol.json AGENTS.md"

case "$1" in
  log)  $G log --oneline --date=format:'%m-%d %H:%M' --pretty='%h %ad %s' | head -30 ;;
  show) $G show --stat HEAD ;;
  roll)
    shift
    $G checkout "$1" -- ${=@:-INDEX.md GLOBAL-MASTER.md}
    echo "已回滚：$*"; echo "（确认无误后建议再跑一次 instance-snap.sh 固化）" ;;
  *)
    $G add -f ${=FILES} 2>/dev/null
    if $G diff --cached --quiet; then echo "实例无变化，无需快照"
    else $G commit -q -m "snapshot $(date '+%F %H:%M')" && echo "✓ 已快照：${=FILES}" ; fi ;;
esac
