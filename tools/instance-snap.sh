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
    [ -n "$($G rev-parse --verify -q HEAD)" ] || { echo "快照库还没有任何提交，无从回滚"; exit 1; }
    # 裸库下 checkout <hash> -- 文件 不可靠，改用 show 直写；只回滚清单里实际存在的文件
    for f in ${=FILES}; do
      $G show "$1:$f" > "$WT/$f" 2>/dev/null && echo "✓ 已回滚 $f" || echo "✗ $f 在 $1 中不存在（跳过）"
    done
    echo "回滚目标：$1" ;;
  *)
    for f in ${=FILES}; do [ -e "$WT/$f" ] && $G add -f "$f"; done  # 逐个判断存在性：git add 任一 pathspec 不存在会整体失败
    if $G diff --cached --quiet; then echo "实例无变化，无需快照"
    else $G commit -q -m "snapshot $(date '+%F %H:%M')" && echo "✓ 已快照" ; fi ;;
esac
