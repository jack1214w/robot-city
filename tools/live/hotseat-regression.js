/* =========================================================================
   熱椅模式回歸測試（在瀏覽器裡跑）

   做法：固定亂數種子 → 透過「點畫面上的按鈕」玩完好幾個回合 → 把最後的
   遊戲狀態壓成一份摘要。同一個種子在 v1.0 和新版各跑一次，摘要一模一樣，
   就代表熱椅模式的行為沒有被改壞。

   用法（瀏覽器 devtools 或自動化工具）：
     1. 開啟 index.html（不要按任何東西）
     2. 貼上這整段，然後執行  await RC_REGRESSION({seed:7, players:3, turns:9})
     3. 回傳值的 digest 拿去跟另一個版本比對

   涵蓋：放牌、收回、黃卡夾住 ±、清空、執行、專車接送／路障點地圖、
   交換卡／病毒選人、分配資源、2 換 1、棄牌、結束回合、牌堆洗回。
   ========================================================================= */
window.RC_REGRESSION = async function(opt){
  opt = Object.assign({seed:7, players:3, turns:9, map:"small"}, opt||{});
  // --- 固定亂數 ---
  let s = opt.seed >>> 0;
  Math.random = function(){
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const wait = (ms)=>new Promise(r=>setTimeout(r, ms));
  const q = (s)=>document.querySelector(s);
  const qa = (s)=>[...document.querySelectorAll(s)];
  const click = (e)=>{ if(e){ e.click(); return true; } return false; };
  const trace = [];
  let allocN = 0;

  // --- 開場設定（直接改 cfg，跟手動點設定畫面效果相同） ---
  cfg.mode = "versus"; cfg.count = opt.players; cfg.map = opt.map;
  cfg.speed = "fast"; cfg.time = "no"; cfg.slots = 6; cfg.target = 20; cfg.endMode = "score";
  cfg.enable = {white:true, yellow:true, green:true, red:true};
  if("net" in cfg) cfg.net = "hotseat";
  q("#btnStart").click();
  await wait(50);
  // 開場：1 號機面向右、2 號機面向下，順序往下一位
  click(q('[data-face="0"] [data-dir="1"]'));
  click(q('[data-face="1"] [data-dir="2"]'));
  click(q('[data-d="1"]'));
  await wait(50);

  // 執行中跳出來的選取：一律選第一個可選的
  async function settle(){
    for(let guard=0; guard<4000; guard++){
      if(G.over) return;
      const ov = q("#ov.on");
      if(ov){
        // 分配資源：輪流放任務卡與暫存卡，讓暫存卡累積到能 2 換 1
        if(q("#ovSheet [data-mi]")){
          allocN++;
          const pickBuf = allocN % 3 === 0;
          click(pickBuf ? q('#ovSheet [data-mi="-1"]') : (q('#ovSheet [data-mi="0"]') || q("#ovSheet [data-mi]")));
          trace.push(pickBuf ? "allocB" : "alloc"); await wait(5); continue;
        }
        if(click(q("#ovSheet [data-p]"))){ trace.push("player"); await wait(5); continue; }
        if(click(q("#ovSheet [data-o]"))){ trace.push("steal"); await wait(5); continue; }
      }
      const pick = q("#board .cell.pick");
      if(pick){ trace.push("cell"); pick.click(); await wait(5); continue; }
      if(!G.running && (G.phase === "tidy" || G.phase === "program")) return;
      await wait(20);
    }
    throw new Error("settle 卡住了");
  }

  // rig：在第 0 回合與中途各發一次「橘、紅、橘」到每個人手上，保證每種選取器都會被測到
  const rig = ()=>{
    const reds = ["r_tp","r_sw","r_vr","r_wl"];
    G.players.forEach((p,i)=>p.hand.splice(0, 3, "o_call", reds[(i + G.turns) % 4], "o_call"));
    renderHand();
  };
  for(let t=0; t<opt.turns && !G.over; t++){
    if(opt.rig && t % 5 === 0) rig();
    const handBtns = ()=>qa("#hand .card").filter(b=>!b.disabled && b.style.visibility!=="hidden");
    // 手上有紅卡和兩張橘卡就排成「橘 → 紅 → 橘」，讓選取器（點地圖／選人／偷資源）被測到
    const byG = (g)=>handBtns().find(b=>b.classList.contains("c-"+g));
    const nOrange = handBtns().filter(b=>b.classList.contains("c-orange")).length;
    let called = false;
    if(byG("red") && nOrange >= 2){ byG("orange").click(); byG("red").click(); byG("orange").click(); trace.push("call"); called = true; }
    // 補到 4 張
    for(let k=G.program.length;k<4;k++){ const b = handBtns()[k % 2]; if(b) b.click(); }
    // 每三回合測一次「清空」再重放
    if(t % 3 === 2 && !called){ click(q("#btnClear")); for(let k=0;k<4;k++){ const b = handBtns()[0]; if(b) b.click(); } }
    // 收回第 2 張再放一張回來
    const mcs = qa("#progslots .minicard");
    const rm = called ? mcs[3] : mcs[1];
    if(rm){ rm.click(); const b = handBtns()[1]; if(b) b.click(); }
    // 黃卡：夾住 2 張再減 1
    const plus = qa("#progslots .spanctl .sbtn")[1];
    if(plus){ plus.click(); const p2 = qa("#progslots .spanctl .sbtn")[1]; if(p2 && !p2.disabled) p2.click();
              const m2 = qa("#progslots .spanctl .sbtn")[0]; if(m2 && !m2.disabled) m2.click(); }
    trace.push("prog:" + G.program.map(x=>x.id + (x.span!=null?"/"+x.span:"")).join(","));
    click(q("#btnRun"));
    await wait(30);
    await settle();
    if(G.over) break;
    // 2 換 1
    if(!q("#btnSwap").disabled && t % 2 === 1){
      q("#btnSwap").click(); await wait(5);
      const pips = qa("#ovSheet [data-i]"); if(pips[0]) pips[0].click();
      const pips2 = qa("#ovSheet [data-i]"); if(pips2[1]) pips2[1].click();
      click(q('#ovSheet [data-get="iron"]'));
      trace.push("swap");
      await wait(20); await settle();
    }
    // 棄掉第一張手牌
    click(q("#btnDiscardMode"));
    const hb = qa("#hand .card").filter(b=>b.style.visibility!=="hidden");
    if(hb[0]) hb[0].click();
    if(hb[3]){ hb[3].click(); hb[3] = null; }
    const hb2 = qa("#hand .card").filter(b=>b.style.visibility!=="hidden");
    if(hb2[3]) hb2[3].click();            // 取消剛剛勾的第 4 張
    click(q("#btnDiscardMode"));
    click(q("#btnEnd"));
    await wait(30);
  }

  const digest = JSON.stringify({
    cur:G.cur, round:G.round, turns:G.turns, over:G.over,
    deck:G.deck.length, discard:G.discard.length, mdeck:G.mdeck.length,
    players:G.players.map(p=>({r:p.r,c:p.c,dir:p.dir,score:p.score,hand:p.hand,buffer:p.buffer,
      built:p.built.map(b=>b.nm), missions:p.missions.map(m=>m.b.nm+":"+JSON.stringify(m.have))})),
    board:G.board.cells.map(row=>row.map(c=>(c.type[0])+(c.res?c.res[0]:"-")).join("")),
  });
  // 簡單雜湊，方便肉眼比對
  let h = 0; for(let i=0;i<digest.length;i++) h = (h*31 + digest.charCodeAt(i)) | 0;
  return { hash:(h>>>0).toString(16), trace, digest, log:q("#log").innerText };
};
