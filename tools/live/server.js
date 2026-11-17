#!/usr/bin/env node
/* =========================================================================
   機器人蓋城市 · 平板連線模式的小伺服器

   只用 Node 內建模組，不需要 npm install、不連外網、學生資料不出教室。

   它只做兩件事：
   1. 把 index.html 送給瀏覽器（老師筆電與學生平板都從這裡開網頁）
   2. 當「傳話筒」：平板說的話轉給老師筆電，老師筆電要說的話轉給指定的平板

   遊戲規則、狀態、判定全部在老師筆電的網頁裡（主機權威），
   這支程式完全不懂遊戲，也不存任何遊戲資料。

   用法：node tools/live/server.js [--port 8080] [--open]
   ========================================================================= */
"use strict";

const http   = require("http");
const fs     = require("fs");
const path   = require("path");
const os     = require("os");
const crypto = require("crypto");
const { execFile } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");          // repo 根目錄
const args = process.argv.slice(2);
const argVal = (k, d)=>{ const i = args.indexOf(k); return i >= 0 && args[i+1] ? args[i+1] : d; };
const START_PORT = +argVal("--port", 8080);
const OPEN = args.includes("--open");

/* 房號：每次啟動都換一個。上一堂課留下的舊分頁、舊 QR code 會被擋在門外。
   去掉容易看錯的 0/O、1/I/L。 */
const ROOM = Array.from({length:4}, ()=>"ABCDEFGHJKMNPQRSTUVWXYZ23456789"[crypto.randomInt(31)]).join("");

/* ---------------------------------------------------------------------- */
/* 區網 IP：給投影畫面的 QR code 用                                        */
/* ---------------------------------------------------------------------- */
function lanIPs(){
  const out = [];
  for(const [name, list] of Object.entries(os.networkInterfaces())){
    for(const a of list || []){
      if(a.family !== "IPv4" || a.internal) continue;
      // 私有網段優先（教室 AP 幾乎一定是這幾種）
      const priv = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address);
      out.push({ ip:a.address, name, priv });
    }
  }
  out.sort((a,b)=>(b.priv - a.priv) || (a.name.startsWith("en") ? -1 : 1));
  return out.map(x=>x.ip);
}

/* ---------------------------------------------------------------------- */
/* 靜態檔案                                                                */
/* ---------------------------------------------------------------------- */
const TYPES = {
  ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8",
  ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml", ".ico":"image/x-icon",
  ".pptx":"application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
function serveStatic(req, res){
  let rel;
  try{ rel = decodeURIComponent(new URL(req.url, "http://x").pathname); }
  catch(e){ res.writeHead(400); res.end(); return; }
  if(rel === "/") rel = "/index.html";
  const file = path.resolve(ROOT, "." + rel);
  // 不准跳出 repo，也不給 .git 之類的隱藏檔
  if(!file.startsWith(ROOT + path.sep) || rel.split("/").some(s=>s.startsWith("."))){
    res.writeHead(404); res.end("not found"); return;
  }
  fs.readFile(file, (err, buf)=>{
    if(err){ res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8"}); res.end("找不到這個檔案"); return; }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",            // 平板永遠拿到最新版，不會卡在舊快取
    });
    res.end(buf);
  });
}

/* ---------------------------------------------------------------------- */
/* 最小 WebSocket（RFC 6455）：只支援文字訊息，夠用就好                      */
/* ---------------------------------------------------------------------- */
const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function wsFrame(opcode, payload){
  const len = payload.length;
  let head;
  if(len < 126){ head = Buffer.from([0x80|opcode, len]); }
  else if(len < 65536){ head = Buffer.alloc(4); head[0]=0x80|opcode; head[1]=126; head.writeUInt16BE(len,2); }
  else{ head = Buffer.alloc(10); head[0]=0x80|opcode; head[1]=127; head.writeBigUInt64BE(BigInt(len),2); }
  return Buffer.concat([head, payload]);
}

class Conn{
  constructor(sock, role, ip){
    this.sock = sock; this.role = role; this.ip = ip;
    this.id = "c" + (++Conn.seq);
    this.buf = Buffer.alloc(0);
    this.frag = [];                 // 分段訊息暫存
    this.alive = true;              // 心跳：上一次 ping 之後有沒有回 pong
    this.closed = false;
    this.onmessage = ()=>{}; this.onclose = ()=>{};
    sock.setNoDelay(true);
    sock.on("data", d=>this.feed(d));
    sock.on("close", ()=>this.finish());
    sock.on("error", ()=>this.finish());
  }
  feed(chunk){
    this.buf = Buffer.concat([this.buf, chunk]);
    for(;;){
      const b = this.buf;
      if(b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0, op = b[0] & 0x0f;
      const masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f, off = 2;
      if(len === 126){ if(b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if(len === 127){ if(b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
      if(len > 4*1024*1024){ this.close(); return; }       // 不收超大訊息
      const need = off + (masked ? 4 : 0) + len;
      if(b.length < need) return;
      let data = b.subarray(off + (masked ? 4 : 0), need);
      if(masked){
        const m = b.subarray(off, off+4);
        data = Buffer.from(data);
        for(let i=0;i<data.length;i++) data[i] ^= m[i & 3];
      }
      this.buf = b.subarray(need);
      if(op === 0x8){ this.close(); return; }                       // close
      if(op === 0x9){ this.raw(0xA, data); continue; }               // ping → pong
      if(op === 0xA){ this.alive = true; continue; }                 // pong
      if(op === 0x1 || op === 0x0){
        this.alive = true;
        this.frag.push(data);
        if(fin){
          const text = Buffer.concat(this.frag).toString("utf8");
          this.frag = [];
          let msg; try{ msg = JSON.parse(text); }catch(e){ continue; }
          this.onmessage(msg);
        }
      }
    }
  }
  raw(op, payload){ if(!this.closed) try{ this.sock.write(wsFrame(op, payload)); }catch(e){} }
  send(obj){ this.raw(0x1, Buffer.from(JSON.stringify(obj), "utf8")); }
  ping(){ this.raw(0x9, Buffer.alloc(0)); }
  close(){ if(!this.closed){ this.raw(0x8, Buffer.alloc(0)); try{ this.sock.end(); }catch(e){} } this.finish(); }
  finish(){
    if(this.closed) return;
    this.closed = true;
    try{ this.sock.destroy(); }catch(e){}
    this.onclose();
  }
}
Conn.seq = 0;

/* ---------------------------------------------------------------------- */
/* 傳話：一台主機（老師筆電）＋多台平板                                     */
/* ---------------------------------------------------------------------- */
let host = null;
const clients = new Map();          // id → Conn

const isLocal = (ip)=>ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";

function attachHost(c){
  if(host) host.close();            // 老師重新整理頁面：新的取代舊的
  host = c;
  c.send({ t:"info", room:ROOM, ips:lanIPs(), port:PORT });
  for(const id of clients.keys()) c.send({ t:"join", cid:id });
  for(const k of clients.values()) k.send({ t:"hostup" });
  c.onmessage = (m)=>{
    if(m.t === "to"){ const k = clients.get(m.cid); if(k) k.send(m.m); }
    else if(m.t === "all"){ for(const k of clients.values()) k.send(m.m); }
    else if(m.t === "kick"){ const k = clients.get(m.cid); if(k) k.close(); }
    else if(m.t === "info"){ c.send({ t:"info", room:ROOM, ips:lanIPs(), port:PORT }); }
  };
  c.onclose = ()=>{
    if(host !== c) return;
    host = null;
    for(const k of clients.values()) k.send({ t:"hostdown" });
    log("老師的畫面關掉了（重新整理或關閉分頁）");
  };
  log("老師的畫面已連上");
}
function attachClient(c){
  clients.set(c.id, c);
  if(host) host.send({ t:"join", cid:c.id }); else c.send({ t:"hostdown" });
  c.onmessage = (m)=>{ if(host) host.send({ t:"from", cid:c.id, m }); else c.send({ t:"hostdown" }); };
  c.onclose = ()=>{
    clients.delete(c.id);
    if(host) host.send({ t:"leave", cid:c.id });
    log(`平板離線（${c.ip}），目前 ${clients.size} 台`);
  };
  log(`平板連上（${c.ip}），目前 ${clients.size} 台`);
}

/* 心跳：平板鎖屏時 Safari 會被凍結，TCP 不一定會斷。
   每 8 秒 ping 一次，連續兩次沒回應就當作斷線，主機才不會一直等。 */
setInterval(()=>{
  for(const c of [host, ...clients.values()]){
    if(!c) continue;
    if(!c.alive){ c.misses = (c.misses||0) + 1; if(c.misses >= 2){ c.close(); continue; } }
    else c.misses = 0;
    c.alive = false;
    c.ping();
  }
}, 8000);

/* ---------------------------------------------------------------------- */
/* HTTP + Upgrade                                                          */
/* ---------------------------------------------------------------------- */
const server = http.createServer((req, res)=>{
  if(req.method !== "GET" && req.method !== "HEAD"){ res.writeHead(405); res.end(); return; }
  serveStatic(req, res);
});

server.on("upgrade", (req, sock)=>{
  const u = new URL(req.url, "http://x");
  const key = req.headers["sec-websocket-key"];
  const role = u.searchParams.get("role");
  const reject = (code, why)=>{ sock.end(`HTTP/1.1 ${code} ${why}\r\n\r\n`); };
  if(u.pathname !== "/ws" || !key) return reject(400, "Bad Request");
  // 主機只能是老師筆電本機，平板不可能冒充老師
  if(role === "host" && !isLocal(req.socket.remoteAddress)) return reject(403, "Forbidden");
  if(role !== "host" && role !== "client") return reject(400, "Bad Request");

  const accept = crypto.createHash("sha1").update(key + GUID).digest("base64");
  sock.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
           + `Sec-WebSocket-Accept: ${accept}\r\n\r\n`);
  const c = new Conn(sock, role, req.socket.remoteAddress);
  if(role === "host") return attachHost(c);
  if(u.searchParams.get("room") !== ROOM){
    // 舊 QR code（上一次啟動的房號）：告訴平板原因再關掉
    c.send({ t:"badroom" });
    setTimeout(()=>c.close(), 300);
    return;
  }
  attachClient(c);
});

/* ---------------------------------------------------------------------- */
/* 啟動：8080 被佔用就往後找                                                */
/* ---------------------------------------------------------------------- */
let PORT = START_PORT;
const log = (s)=>console.log(`[${new Date().toLocaleTimeString("zh-TW",{hour12:false})}] ${s}`);

function listen(){
  server.once("error", (e)=>{
    if(e.code === "EADDRINUSE" && PORT < START_PORT + 20){ PORT++; listen(); return; }
    console.error("伺服器啟動失敗：", e.message); process.exit(1);
  });
  server.listen(PORT, "0.0.0.0", ()=>{
    const ips = lanIPs();
    console.log("");
    console.log("  ┌──────────────────────────────────────────────┐");
    console.log("  │  機器人蓋城市 · 平板連線模式  已經啟動          │");
    console.log("  └──────────────────────────────────────────────┘");
    console.log("");
    console.log(`  老師畫面：http://localhost:${PORT}/?live`);
    console.log(`  房號：${ROOM}`);
    if(ips.length) console.log(`  平板網址：http://${ips[0]}:${PORT}/?join=${ROOM}（投影畫面上有 QR code，不用手打）`);
    else console.log("  ⚠ 找不到區網 IP：筆電好像沒有連上 Wi-Fi");
    console.log("");
    console.log("  上課結束後關掉這個視窗，伺服器就會停止。");
    console.log("");
    if(OPEN) execFile("open", [`http://localhost:${PORT}/?live`], ()=>{});
  });
}
listen();
