# 平板連線模式 · 開發者說明

老師上課怎麼用寫在根目錄的 `README.md`。這份是給之後改程式的人看的。

## 檔案

| 檔案 | 做什麼 |
|---|---|
| `../../平板連線-啟動.command` | 雙擊用的啟動檔：找到 node，執行 `server.js --open` |
| `server.js` | 送網頁＋轉傳訊息的小伺服器。只用 Node 內建模組，WebSocket 是自己寫的（RFC 6455 文字訊息子集） |
| `hotseat-regression.js` | 熱椅模式回歸測試（在瀏覽器裡跑） |
| `baseline/hashes.txt` | v1.0 跑出來的基準 hash |

## 架構（一句話版）

老師筆電的網頁是**主機**，`G` 只有它有；平板只收「給自己的快照」、送回「意圖」與「選擇」。
`server.js` 完全不懂遊戲，只是傳話筒。細節見 `index.html` 第 9b 節（意圖）、第 8 節（選取）、第 13 節（連線）。

- 熱椅：`send(m)` 直接呼叫 `handle(m)`；`ask()` 直接開本機選取介面
- 平板：`send(m)` 經 WebSocket 到主機的 `handle(m, 座位)`；`ask()` 送到那台平板，30 秒沒回或斷線就用預設值
- 主機每次重畫畫面都會排一次 `syncSoon()`，把每個座位各自的快照送出去（別人的手牌不在裡面）
- 平板收到快照後組出一份鏡像 `G`，用跟熱椅**同一套** render 函式畫

### 伺服器的安全限制

- 主機角色只接受 `127.0.0.1`／`::1`（平板不能冒充老師）
- 房號每次啟動都換，舊 QR code 會被擋
- 靜態檔只送 repo 裡的檔案，任何以 `.` 開頭的路徑（`.git` 等）都不送
- 心跳：每 8 秒 ping，連兩次沒回應就當斷線（平板鎖屏時 Safari 會被凍結，TCP 不一定會斷）

## 熱椅回歸測試

**改到 `index.html` 的遊戲邏輯之後一定要跑。** 它固定亂數種子、透過點畫面上的按鈕玩完好幾個回合，
最後把遊戲狀態壓成一個 hash。跟 v1.0 一樣，就代表熱椅模式的行為沒有被改壞。

1. 啟動伺服器：`node tools/live/server.js`
2. 開 `http://localhost:8080/`，**不要按任何東西**，打開 devtools console
3. 貼上：

   ```js
   await new Promise((ok, no)=>{ const s = document.createElement("script");
     s.src = "/tools/live/hotseat-regression.js?" + Date.now(); s.onload = ok; s.onerror = no;
     document.head.appendChild(s); });
   (await RC_REGRESSION({seed:5, players:4, turns:21, rig:true})).hash
   ```

   一組大約要跑 30～60 秒（背景分頁會更慢，計時器被瀏覽器節流）。

4. 每跑一組要**重新整理頁面**再跑下一組
5. 跟 `baseline/hashes.txt` 比對，每一組都要一模一樣

`rig:true` 會每 5 回合發一次「橘、紅、橘」到每個人手上，保證點地圖、選人這些選取器都有被測到。
病毒（偷資源）因為要別人身上有資源才會觸發，這組測試不一定碰得到，需要的話手動測。

### 怎麼重新產生基準

基準是用 **v1.0**（`git checkout v1.0 -- index.html` 或桌面的離線備份）跑出來的。
只有在**刻意改變熱椅規則**時才需要重新產生，而且要在 commit 訊息裡寫清楚為什麼。

## 做分享包給其他老師

```bash
bash tools/make-share-zip.sh
```

產出 `dist/robot-city-分享包-日期-版本.zip`（`dist/` 不進 git）。只打包**已 commit** 的內容，有沒 commit 的修改會拒絕打包。
壓縮檔解開是一個 `robot-city` 資料夾，裡面多一個 `版本.txt` 記錄日期與 commit。用 `ditto` 壓縮，啟動檔的執行權限會保留。
