# 學生簡報產生器

`../../機器人蓋城市-遊戲規則.pptx` 是**產生出來的檔案**，不要直接編輯它——
下次重新產生就會蓋掉你的修改。要改內容請改 `gen.js`。

## 重新產生簡報

```bash
cd tools/deck
npm install          # 只有第一次需要，會裝 pptxgenjs
node gen.js
cp 機器人蓋城市-遊戲規則.pptx ../../
```

## 產生前先看一眼排版

本機沒有 LibreOffice 可以轉圖，所以有一支 `preview.py`：
它直接解析 pptx 裡的投影片 XML，照原本的座標畫成 HTML，用瀏覽器就能檢查有沒有
文字疊在一起、物件掉出版面。

```bash
python3 -I preview.py 機器人蓋城市-遊戲規則.pptx preview.html
```

## 注意事項

- **產生完請關掉 PowerPoint 再做版本控制。** PowerPoint 開著檔案時，
  存檔會把它記憶體裡的舊內容寫回去，蓋掉新產生的版本（2026-11-17 發生過一次）。
- `~$` 開頭的是 PowerPoint 的鎖定檔，已經在 `.gitignore` 裡。
