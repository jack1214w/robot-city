#!/bin/bash
# 產生給其他老師的分享包（Mac 用）
#   用法：bash tools/make-share-zip.sh
#   產出：dist/robot-city-分享包-日期-版本.zip（dist/ 不進 git）
# 只打包「已經 commit 的內容」，所以本機的暫存檔、.git 都不會被包進去。
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "還有沒 commit 的修改，請先 commit 再打包（分享包只放已 commit 的內容）。"
  exit 1
fi

rev="$(git rev-parse --short HEAD)"
branch="$(git rev-parse --abbrev-ref HEAD)"
day="$(date +%Y-%m-%d)"
name="robot-city"
zip="dist/robot-city-分享包-${day}-${rev}.zip"

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
git archive --format=tar --prefix="$name/" HEAD | tar -x -C "$tmp"
rm -f "$tmp/$name/.gitignore"
cat > "$tmp/$name/版本.txt" <<TXT
機器人蓋城市 Robot City
打包日期：${day}
版本：${branch} @ ${rev}

先讀「給其他老師-安裝與分享.md」。
TXT

# 雙擊啟動檔一定要有執行權限
[ -x "$tmp/$name/平板連線-啟動.command" ] || chmod +x "$tmp/$name/平板連線-啟動.command"

mkdir -p dist
rm -f "$zip"
# ditto：Mac 內建，會保留執行權限；--norsrc --noextattr 不夾帶 __MACOSX 與本機屬性
ditto -c -k --keepParent --norsrc --noextattr "$tmp/$name" "$zip"
echo "完成：$zip（$(du -h "$zip" | cut -f1)）"
