#!/bin/bash
# 機器人蓋城市 · 平板連線模式啟動檔
# 雙擊這個檔案：會開一個黑色視窗（伺服器），並自動打開老師的投影畫面。
# 上課結束後關掉黑色視窗就好。

cd "$(dirname "$0")" || exit 1

NODE="$(command -v node)"
for p in /opt/homebrew/bin/node /usr/local/bin/node; do
  [ -z "$NODE" ] && [ -x "$p" ] && NODE="$p"
done
if [ -z "$NODE" ]; then
  echo ""
  echo "  找不到 Node.js，伺服器沒辦法啟動。"
  echo "  請到 https://nodejs.org 下載安裝 LTS 版本，再雙擊一次這個檔案。"
  echo ""
  read -r -p "  按 Enter 關閉…"
  exit 1
fi

"$NODE" tools/live/server.js --open
echo ""
read -r -p "  伺服器已停止。按 Enter 關閉…"
