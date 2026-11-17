const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";                 // 13.333 x 7.5
pres.author = "機器人蓋城市";
pres.title  = "機器人蓋城市 遊戲規則";

const BG="07211A", PANEL="0E3328", PANEL2="14402F", LINE="1E5546";
const GOLD="D9A441", TEAL="3DBFA5", INK="E6F0EA", MUTED="9FBCB0", DANGER="E4655C";
const C = { white:"F7F9F7", green:"2F9C6E", yellow:"EBC33F", orange:"E4813A", red:"D24A44" };
const CI= { white:"17241E", green:"FFFFFF", yellow:"3A2B04", orange:"FFFFFF", red:"FFF0EE" };
const R = { wood:"A97142", iron:"5E7FA6", stone:"7E8A93", sand:"CFA945" };
const RCH={ wood:"木", iron:"鐵", stone:"石", sand:"沙" };
const F="Microsoft JhengHei", FM="Courier New", M=0.65;

const sh = () => ({ type:"outer", color:"000000", blur:10, offset:2, angle:90, opacity:0.4 });
const noLine = () => ({ type:"none" });
function newSlide(){ const s=pres.addSlide(); s.background={color:BG}; return s; }
function heading(s, kicker, text){
  s.addText(kicker,{x:M,y:0.42,w:11,h:0.28,isTextBox:true,margin:0,fontFace:FM,fontSize:11,bold:true,charSpacing:2.4,color:GOLD});
  s.addText(text,{x:M,y:0.72,w:12.0,h:0.72,isTextBox:true,margin:0,fontFace:F,fontSize:34,bold:true,color:INK});
}
function panel(s,x,y,w,h,fill){
  s.addShape(pres.ShapeType.roundRect,{x,y,w,h,rectRadius:0.12,fill:{color:fill||PANEL},line:{color:LINE,width:1}});
}
function chip(s,kind,x,y,size,fs){
  s.addShape(pres.ShapeType.roundRect,{x,y,w:size,h:size,rectRadius:0.09,fill:{color:R[kind]},line:noLine(),shadow:sh()});
  s.addText(RCH[kind],{x,y,w:size,h:size,isTextBox:true,margin:0,fontFace:F,fontSize:fs||18,bold:true,color:"FFFFFF",align:"center",valign:"middle"});
}
function ghostChip(s,kind,x,y,size,fs){
  s.addShape(pres.ShapeType.roundRect,{x,y,w:size,h:size,rectRadius:0.09,fill:{type:"solid",color:BG,transparency:100},line:{color:R[kind],width:1.5,dashType:"dash"}});
  s.addText(RCH[kind],{x,y,w:size,h:size,isTextBox:true,margin:0,fontFace:F,fontSize:fs||18,bold:true,color:R[kind],align:"center",valign:"middle"});
}
function card(s,o){
  const w=o.w||1.85, h=o.h||2.25;
  s.addShape(pres.ShapeType.roundRect,{x:o.x,y:o.y,w,h,rectRadius:0.12,fill:{color:C[o.c]},line:noLine(),shadow:sh()});
  s.addText(o.tag,{x:o.x+0.14,y:o.y+0.13,w:w-0.28,h:0.24,isTextBox:true,margin:0,fontFace:FM,fontSize:9.5,bold:true,charSpacing:1.6,color:CI[o.c]});
  s.addText(o.name,{x:o.x+0.14,y:o.y+0.4,w:w-0.28,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:o.nameSize||17,bold:true,color:CI[o.c]});
  if(o.sub) s.addText(o.sub,{x:o.x+0.14,y:o.y+0.92,w:w-0.28,h:h-1.35,isTextBox:true,margin:0,fontFace:F,fontSize:11,color:CI[o.c],lineSpacingMultiple:1.15});
  if(o.code) s.addText(o.code,{x:o.x+0.14,y:o.y+h-0.42,w:w-0.28,h:0.3,isTextBox:true,margin:0,fontFace:FM,fontSize:9.5,color:CI[o.c]});
}
function numBox(s,n,x,y,size,fill,ink){
  s.addShape(pres.ShapeType.roundRect,{x,y,w:size,h:size,rectRadius:0.1,fill:{color:fill||GOLD},line:noLine()});
  s.addText(String(n),{x,y,w:size,h:size,isTextBox:true,margin:0,fontFace:FM,fontSize:size*36,bold:true,color:ink||BG,align:"center",valign:"middle"});
}
function arrow(s,x,y,w){
  s.addText("→",{x,y,w:w||0.42,h:0.42,isTextBox:true,margin:0,fontFace:F,fontSize:20,bold:true,color:GOLD,align:"center",valign:"middle"});
}
function boardCell(s,x,y,cell,type,label){
  const fills={open:PANEL2,wall:"091310",tunnel:"195045"};
  s.addShape(pres.ShapeType.roundRect,{x,y,w:cell,h:cell,rectRadius:0.06,fill:{color:fills[type]||PANEL2},
    line:{color:type==="tunnel"?TEAL:(type==="cpu"?GOLD:LINE),width:1,dashType:type==="cpu"?"dash":"solid"}});
  if(label) s.addText(label,{x,y,w:cell,h:cell,isTextBox:true,margin:0,fontFace:FM,fontSize:8,bold:true,align:"center",valign:"middle",
    color:type==="tunnel"?TEAL:(type==="cpu"?GOLD:MUTED)});
}
function robotCell(s,x,y,cell,color,n){
  s.addShape(pres.ShapeType.roundRect,{x:x+cell*0.09,y:y+cell*0.09,w:cell*0.82,h:cell*0.82,rectRadius:0.08,
    fill:{color},line:{color:"FFFFFF",width:1.5},shadow:sh()});
  s.addText(String(n),{x,y,w:cell,h:cell,isTextBox:true,margin:0,fontFace:FM,fontSize:13,bold:true,color:"FFFFFF",align:"center",valign:"middle"});
}

/* ===== Scratch 式 C 形包夾（簡報用的示意圖） ===== */
/* 矮卡片：單行排版，tag 左、名稱中、程式碼右，不會像 card() 那樣疊在一起 */
function flatCard(s,o){
  const w=o.w, h=o.h||0.68;
  s.addShape(pres.ShapeType.roundRect,{x:o.x,y:o.y,w,h,rectRadius:0.1,fill:{color:C[o.c]},line:noLine(),shadow:sh()});
  s.addText(o.tag,{x:o.x+0.12,y:o.y,w:0.5,h,isTextBox:true,margin:0,fontFace:FM,fontSize:8,bold:true,charSpacing:.8,color:CI[o.c],valign:"middle"});
  s.addText(o.name,{x:o.x+0.66,y:o.y,w:w-1.66,h,isTextBox:true,margin:0,fontFace:F,fontSize:14,bold:true,color:CI[o.c],valign:"middle"});
  if(o.code) s.addText(o.code,{x:o.x+w-0.98,y:o.y,w:0.86,h,isTextBox:true,margin:0,fontFace:FM,fontSize:8,color:CI[o.c],valign:"middle",align:"right"});
}
function cShape(s,o){
  const col=C[o.c], x=o.x, y=o.y, w=o.w||3.3, headH=0.95;
  // 頭卡：三行分開放，右側留給夾住張數
  s.addShape(pres.ShapeType.roundRect,{x,y,w,h:headH,rectRadius:0.1,fill:{color:col},line:noLine(),shadow:sh()});
  s.addText(o.tag,{x:x+0.14,y:y+0.08,w:1.2,h:0.22,isTextBox:true,margin:0,fontFace:FM,fontSize:8.5,bold:true,charSpacing:1,color:CI[o.c]});
  s.addText(o.head,{x:x+0.14,y:y+0.3,w:w-1.35,h:0.32,isTextBox:true,margin:0,fontFace:F,fontSize:15,bold:true,color:CI[o.c]});
  if(o.headCode) s.addText(o.headCode,{x:x+0.14,y:y+0.65,w:w-1.35,h:0.24,isTextBox:true,margin:0,fontFace:FM,fontSize:8.5,color:CI[o.c]});
  if(o.badge!==undefined){
    s.addShape(pres.ShapeType.roundRect,{x:x+w-1.12,y:y+0.27,w:0.98,h:0.42,rectRadius:0.21,fill:{color:PANEL},line:{color:CI[o.c],width:1}});
    s.addText(`−  ${o.badge}  +`,{x:x+w-1.12,y:y+0.27,w:0.98,h:0.42,isTextBox:true,margin:0,fontFace:FM,fontSize:10,bold:true,color:INK,align:"center",valign:"middle"});
  }
  // 立柱 + 夾住的卡
  let cy=y+headH+0.1;
  const kidH=0.68, bodyH=o.kids.length*(kidH+0.1);
  s.addShape(pres.ShapeType.rect,{x:x+0.3,y:cy,w:0.1,h:bodyH-0.1,fill:{color:col},line:noLine()});
  o.kids.forEach(k=>{
    flatCard(s,{c:k.c||"white",tag:k.tag||"SEQ",name:k.nm,code:k.code,x:x+0.52,y:cy,w:w-0.72,h:kidH});
    cy+=kidH+0.1;
  });
  // 底部收口
  s.addShape(pres.ShapeType.rect,{x:x+0.3,y:cy-0.1,w:1.1,h:0.13,fill:{color:col},line:noLine()});
  return cy+0.03;
}

/* ===== 綠卡卡面：上行＝條件，下行＝內建動作 ===== */
function ifCard(s,o){
  const x=o.x, y=o.y, w=o.w, h=o.h||1.85, col=C.green, ink=CI.green;
  s.addShape(pres.ShapeType.roundRect,{x,y,w,h,rectRadius:0.12,fill:{color:col},line:noLine(),shadow:sh()});
  s.addText("IF",{x:x+0.18,y:y+0.12,w:1.0,h:0.24,isTextBox:true,margin:0,fontFace:FM,fontSize:9.5,bold:true,charSpacing:1.6,color:ink});
  s.addText(o.cond,{x:x+0.18,y:y+0.4,w:w-0.36,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:o.fs||18,bold:true,color:ink});
  s.addShape(pres.ShapeType.rect,{x:x+0.18,y:y+0.86,w:w-0.36,h:0.014,fill:{color:ink,transparency:65},line:noLine()});
  s.addText(o.act,{x:x+0.18,y:y+0.96,w:w-0.36,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:(o.fs||18)-2,bold:true,color:ink});
  if(o.code) s.addText(o.code,{x:x+0.18,y:y+h-0.42,w:w-0.36,h:0.3,isTextBox:true,margin:0,fontFace:FM,fontSize:9.5,color:ink});
}
/* 矮版：一行一張的綠卡範例 */
function ifRow(s,o){
  const x=o.x,y=o.y,w=o.w,h=0.44;
  s.addShape(pres.ShapeType.roundRect,{x,y,w,h,rectRadius:0.09,fill:{color:C.green},line:noLine()});
  s.addText(o.t,{x:x+0.16,y,w:w-0.32,h,isTextBox:true,margin:0,fontFace:F,fontSize:12.5,bold:true,color:CI.green,valign:"middle"});
}

/* ================= 1 封面 ================= */
{
  const s=newSlide();
  s.addText("ROBOT CITY",{x:M,y:2.0,w:7.4,h:1.0,isTextBox:true,margin:0,fontFace:"Arial",fontSize:52,bold:true,charSpacing:4,color:GOLD});
  s.addText("機器人蓋城市",{x:M,y:3.0,w:7.4,h:0.95,isTextBox:true,margin:0,fontFace:F,fontSize:46,bold:true,color:INK});
  s.addText("用程式指令，蓋出一座城市",{x:M,y:4.0,w:7.4,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:19,color:MUTED});
  s.addText("遊戲規則說明",{x:M,y:1.55,w:7.4,h:0.32,isTextBox:true,margin:0,fontFace:FM,fontSize:12,bold:true,charSpacing:2.6,color:TEAL});
  const ox=8.35,oy=1.75,cell=0.62;
  const layout=[
    ["open","res:wood","open","wall:RAM","open","res:sand"],
    ["res:iron","open","tunnel:SIM","open","res:stone","open"],
    ["open","cpu:CPU","open","res:wood","open","wall:BUS"],
    ["res:stone","open","res:iron","open","robot","open"],
    ["open","wall:ROM","open","res:sand","open","res:iron"],
  ];
  layout.forEach((row,r)=>row.forEach((v,c)=>{
    const x=ox+c*(cell+0.06), y=oy+r*(cell+0.06);
    const [t,lab]=v.split(":");
    if(t==="res"){ boardCell(s,x,y,cell,"open"); chip(s,lab,x+cell*0.16,y+cell*0.16,cell*0.68,12); }
    else if(t==="robot"){ boardCell(s,x,y,cell,"open"); robotCell(s,x,y,cell,"E0564E",1); }
    else boardCell(s,x,y,cell,t,lab);
  }));
  s.addText("jack1214w.github.io/robot-city",{x:M,y:6.55,w:7.4,h:0.34,isTextBox:true,margin:0,fontFace:FM,fontSize:12,color:TEAL});
  s.addNotes("開場：先讓學生看螢幕上的地圖，說明今天每個人都是一台機器人。");
}

/* ================= 2 遊戲目標 ================= */
{
  const s=newSlide();
  heading(s,"THE GOAL","你們是一群要蓋房子的機器人");
  const items=[
    {n:"1",t:"搶資源",d:"指揮機器人在地圖上移動，\n走過有資源的格子就自動撿走。"},
    {n:"2",t:"蓋建築",d:"把資源放上任務卡，\n集滿指定的資源就蓋好了。"},
    {n:"3",t:"拿積分",d:"每棟建築都有分數，\n遊戲結束時分數最高的人獲勝。"},
  ];
  items.forEach((it,i)=>{
    const x=M+i*4.06;
    panel(s,x,1.75,3.76,2.85);
    numBox(s,it.n,x+0.32,2.05,0.62);
    s.addText(it.t,{x:x+1.1,y:2.11,w:2.4,h:0.48,isTextBox:true,margin:0,fontFace:F,fontSize:23,bold:true,color:GOLD});
    s.addText(it.d,{x:x+0.32,y:2.9,w:3.12,h:1.5,isTextBox:true,margin:0,fontFace:F,fontSize:15,color:INK,lineSpacingMultiple:1.35});
  });
  panel(s,M,4.95,12.03,1.75,PANEL2);
  s.addText([
    {text:"最重要的一件事：",options:{bold:true,color:GOLD}},
    {text:"你不能直接用滑鼠把機器人拖到想去的地方。你只能「排好一串指令」，然後按執行，讓機器人自己跑完。",options:{color:INK}},
  ],{x:M+0.36,y:5.32,w:11.3,h:1.0,isTextBox:true,margin:0,fontFace:F,fontSize:16.5,lineSpacingMultiple:1.3});
  s.addNotes("強調：這就是寫程式和直接操作的差別——你要事先想好完整步驟。");
}

/* ================= 3 地圖 ================= */
{
  const s=newSlide();
  heading(s,"THE MAP","地圖上有什麼");
  panel(s,M,1.72,5.85,3.0);
  s.addText("四種資源　走過就撿走",{x:M+0.34,y:1.95,w:5.2,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:17,bold:true,color:GOLD});
  ["wood","iron","stone","sand"].forEach((k,i)=>{
    const x=M+0.4+i*1.36;
    chip(s,k,x,2.55,0.86,22);
    s.addText({wood:"木頭",iron:"鐵礦",stone:"石頭",sand:"沙子"}[k],
      {x:x-0.2,y:3.52,w:1.26,h:0.34,isTextBox:true,margin:0,fontFace:F,fontSize:14,color:INK,align:"center"});
  });
  s.addText("同一格只有一個資源，被拿走就沒了——手腳要快。",
    {x:M+0.34,y:4.02,w:5.2,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:13,color:MUTED});
  panel(s,M+6.18,1.72,5.85,3.0);
  s.addText("三種特殊格子",{x:M+6.52,y:1.95,w:5.2,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:17,bold:true,color:GOLD});
  [
    {t:"wall",lab:"RAM",n:"障礙物",d:"RAM／BUS／ROM 不能通過，\n撞上去就停在原地。"},
    {t:"tunnel",lab:"SIM",n:"地道",d:"踩到就傳送到下一個地道口，\n出口有資源一樣會撿走。"},
    {t:"cpu",lab:"CPU",n:"起始點",d:"機器人一開始站的地方。"},
  ].forEach((c,i)=>{
    const y=2.5+i*0.72;
    boardCell(s,M+6.52,y,0.56,c.t,c.lab);
    s.addText(c.n,{x:M+7.24,y:y-0.03,w:1.3,h:0.32,isTextBox:true,margin:0,fontFace:F,fontSize:15,bold:true,color:INK});
    s.addText(c.d,{x:M+8.42,y:y-0.05,w:3.35,h:0.68,isTextBox:true,margin:0,fontFace:F,fontSize:12,color:MUTED,lineSpacingMultiple:1.2});
  });
  panel(s,M,4.95,12.03,1.72,PANEL2);
  s.addText("每一格都有座標",{x:M+0.36,y:5.15,w:4.0,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:17,bold:true,color:TEAL});
  s.addText("橫的是英文字母、直的是數字。討論路線時直接說「機器人現在在 C4，要往 F4」，全組都聽得懂，比用手指螢幕快多了。",
    {x:M+0.36,y:5.6,w:8.2,h:0.9,isTextBox:true,margin:0,fontFace:F,fontSize:15,color:INK,lineSpacingMultiple:1.3});
  const ox=9.5,oy=5.25,cl=0.4;
  ["A","B","C","D"].forEach((L,c)=>s.addText(L,{x:ox+c*(cl+0.05),y:oy-0.3,w:cl,h:0.26,isTextBox:true,margin:0,fontFace:FM,fontSize:9,color:MUTED,align:"center"}));
  [1,2,3].forEach((n,r)=>{
    s.addText(String(n),{x:ox-0.32,y:oy+r*(cl+0.05),w:0.26,h:cl,isTextBox:true,margin:0,fontFace:FM,fontSize:9,color:MUTED,align:"center",valign:"middle"});
    [0,1,2,3].forEach(c=>{
      const x=ox+c*(cl+0.05), y=oy+r*(cl+0.05);
      if(r===1&&c===2){ boardCell(s,x,y,cl,"open"); robotCell(s,x,y,cl,"2F8FD8",2); }
      else boardCell(s,x,y,cl,"open");
    });
  });
  s.addText("C2",{x:ox+1.5,y:oy+1.4,w:0.8,h:0.28,isTextBox:true,margin:0,fontFace:FM,fontSize:11,bold:true,color:GOLD,align:"center"});
  s.addNotes("讓學生練習念一次座標，之後討論路線會快很多。");
}

/* ================= 4 回合流程 ================= */
{
  const s=newSlide();
  heading(s,"YOUR TURN","輪到你的時候，做四件事");
  const steps=[
    {t:"排程",d:"點下方手牌，把指令放進「程式區」。\n由上往下就是執行順序，最多 6 張。",k:"黃卡可以夾住下面幾張"},
    {t:"執行",d:"按「執行 ▶」，機器人就照著你排的\n順序自己跑完。中途不能改。",k:"看執行紀錄逐行對照"},
    {t:"分配",d:"把撿到的資源放上任務卡，\n或先丟到暫存卡。",k:"想清楚再放"},
    {t:"整理",d:"可以 2 換 1、丟掉不要的手牌，\n然後按「結束回合」換下一個人。",k:"手牌會自動補滿 8 張"},
  ];
  steps.forEach((st,i)=>{
    const x=M+i*3.04;
    panel(s,x,1.75,2.78,4.25);
    numBox(s,i+1,x+0.28,2.02,0.56);
    s.addText(st.t,{x:x+1.0,y:2.08,w:1.6,h:0.44,isTextBox:true,margin:0,fontFace:F,fontSize:22,bold:true,color:GOLD});
    s.addText(st.d,{x:x+0.28,y:2.86,w:2.24,h:1.9,isTextBox:true,margin:0,fontFace:F,fontSize:13.5,color:INK,lineSpacingMultiple:1.3});
    s.addText(st.k,{x:x+0.28,y:5.4,w:2.24,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:11.5,color:TEAL});
    if(i<3) arrow(s,x+2.85,3.6,0.36);
  });
  s.addText("畫面最上方的橫幅會一直告訴你「現在輪到誰、可以做什麼」，忘記了就抬頭看一眼。",
    {x:M,y:6.32,w:12.03,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:14,color:MUTED});
  s.addNotes("第一輪可以帶著全班一起走一次完整回合。");
}

/* ================= 5 五種控制卡 ================= */
{
  const s=newSlide();
  heading(s,"THE CARDS","控制卡，就是程式指令");
  [
    {c:"white", tag:"SEQ", name:"白色卡",sub:"循序結構\n一行一行\n照順序做",code:"move(1)"},
    {c:"yellow",tag:"LOOP",name:"黃色卡",sub:"重複結構\n自己決定\n夾住哪幾張",code:"repeat(3){ }"},
    {c:"green", tag:"IF",  name:"綠色卡",sub:"選擇結構\n如果⋯就⋯\n動作是內建的",code:"if(a){ b() }"},
    {c:"orange",tag:"CALL",name:"橘色卡",sub:"發動\n夾住紅卡\n才有效",code:"call( … )"},
    {c:"red",   tag:"FUNC",name:"紅色卡",sub:"副程式\n很強的\n特殊能力",code:"boost()"},
  ].forEach((cd,i)=>card(s,Object.assign({x:M+i*2.42,y:1.8,w:2.16,h:2.9},cd)));
  panel(s,M,5.02,12.03,1.66,PANEL2);
  s.addText("真正的程式，就是由這四種結構組合出來的",{x:M+0.36,y:5.22,w:7.0,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:17,bold:true,color:GOLD});
  s.addText("不管多複雜的程式——遊戲、網站、機器人——拆開來看，都只是「照順序做」「重複做」「看情況做」「呼叫別人寫好的功能」這四件事在互相組合。今天你排的每一串指令，都是真的在寫程式。",
    {x:M+0.36,y:5.65,w:11.3,h:0.85,isTextBox:true,margin:0,fontFace:F,fontSize:14.5,color:INK,lineSpacingMultiple:1.25});
  s.addNotes("這是整個活動的核心概念，值得停下來多講幾句。");
}

/* ================= 6 白卡 ================= */
{
  const s=newSlide();
  heading(s,"SEQUENCE ／ 循序結構","白色卡：一行一行，照順序做");
  card(s,{c:"white",tag:"SEQ",name:"前進 2",sub:"沿著面對方向走 2 格",code:"move(2)",x:M,y:1.85,w:1.9,h:2.3});
  card(s,{c:"white",tag:"SEQ",name:"右轉",sub:"原地向右轉 90°",code:"turn(90)",x:M+2.1,y:1.85,w:1.9,h:2.3});
  card(s,{c:"white",tag:"SEQ",name:"前進 1",sub:"沿著面對方向走 1 格",code:"move(1)",x:M+4.2,y:1.85,w:1.9,h:2.3});
  s.addText("01 → 02 → 03　機器人會完全照這個順序走",{x:M,y:4.32,w:6.1,h:0.36,isTextBox:true,margin:0,fontFace:FM,fontSize:12,color:GOLD});
  panel(s,M+6.6,1.75,5.43,4.3);
  s.addText("機器人會這樣走",{x:M+6.95,y:1.95,w:4.6,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:16,bold:true,color:GOLD});
  const ox=M+7.0,oy=2.55,cl=0.62;
  const path={"2,0":"start","1,0":"p","0,0":"p","0,1":"end"};
  for(let r=0;r<3;r++)for(let c=0;c<4;c++){
    const x=ox+c*(cl+0.07), y=oy+r*(cl+0.07);
    boardCell(s,x,y,cl,"open");
    const k=r+","+c;
    if(path[k]==="p"||path[k]==="end")
      s.addShape(pres.ShapeType.roundRect,{x:x+cl*0.28,y:y+cl*0.28,w:cl*0.44,h:cl*0.44,rectRadius:0.05,fill:{color:GOLD,transparency:55},line:noLine()});
    if(path[k]==="start") robotCell(s,x,y,cl,"E0564E",1);
  }
  s.addText("前進2（往上兩格）→ 右轉 → 前進1",{x:ox,y:oy+3*(cl+0.07)+0.12,w:4.6,h:0.34,isTextBox:true,margin:0,fontFace:F,fontSize:13,color:INK});
  s.addText("走過的每一格，只要有資源就會自動撿走。",{x:ox,y:oy+3*(cl+0.07)+0.5,w:4.6,h:0.34,isTextBox:true,margin:0,fontFace:F,fontSize:13,color:TEAL});
  s.addText("撞到 RAM、地圖邊界或其他機器人就會停下，後面的步數作廢。",
    {x:M,y:5.05,w:6.4,h:0.9,isTextBox:true,margin:0,fontFace:F,fontSize:14.5,color:INK,lineSpacingMultiple:1.3});
  s.addNotes("提醒：轉彎不會前進，只是換方向；步數算錯是最常見的失誤。");
}

/* ================= 7 黃卡：夾住範圍不同，結果不同 ================= */
{
  const s=newSlide();
  heading(s,"LOOP ／ 重複結構","黃色卡：自己決定要重複哪幾個動作");
  s.addText("放進程式區後，黃卡下面會出現一個凹槽。按卡片右下角的 ＋ ／ − 決定要把下面哪幾張夾進去。",
    {x:M,y:1.55,w:12.03,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:15,color:MUTED});

  // 左：夾 1 張
  panel(s,M,2.05,5.85,4.0,PANEL2);
  s.addText("夾住 1 張",{x:M+0.34,y:2.22,w:3.0,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:18,bold:true,color:GOLD});
  let endY = cShape(s,{c:"yellow",tag:"LOOP",head:"重複 ×2",headCode:"repeat(2){ }",badge:1,
    x:M+0.34,y:2.68,w:3.3,kids:[{nm:"左轉",code:"turn(-90)"}]});
  flatCard(s,{c:"white",tag:"SEQ",name:"左轉",code:"turn(-90)",x:M+0.34,y:endY+0.12,w:3.3});
  s.addShape(pres.ShapeType.roundRect,{x:M+3.92,y:3.3,w:1.78,h:1.5,rectRadius:0.12,fill:{color:TEAL},line:noLine()});
  s.addText("左轉 3 次",{x:M+3.92,y:3.5,w:1.78,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:19,bold:true,color:BG,align:"center"});
  s.addText("(左轉)×2\n＋ 外面那張",{x:M+3.92,y:3.98,w:1.78,h:0.7,isTextBox:true,margin:0,fontFace:F,fontSize:12,color:BG,align:"center",lineSpacingMultiple:1.2});

  // 右：夾 2 張
  panel(s,M+6.18,2.05,5.85,4.0,PANEL2);
  s.addText("夾住 2 張",{x:M+6.52,y:2.22,w:3.0,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:18,bold:true,color:GOLD});
  cShape(s,{c:"yellow",tag:"LOOP",head:"重複 ×2",headCode:"repeat(2){ }",badge:2,
    x:M+6.52,y:2.68,w:3.3,kids:[{nm:"左轉",code:"turn(-90)"},{nm:"左轉",code:"turn(-90)"}]});
  s.addShape(pres.ShapeType.roundRect,{x:M+10.1,y:3.3,w:1.78,h:1.5,rectRadius:0.12,fill:{color:GOLD},line:noLine()});
  s.addText("左轉 4 次",{x:M+10.1,y:3.5,w:1.78,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:19,bold:true,color:BG,align:"center"});
  s.addText("(左轉,左轉)\n×2",{x:M+10.1,y:3.98,w:1.78,h:0.7,isTextBox:true,margin:0,fontFace:F,fontSize:12,color:BG,align:"center",lineSpacingMultiple:1.2});

  panel(s,M,6.2,12.03,0.85,PANEL);
  s.addText([
    {text:"同樣三張卡，",options:{color:INK}},
    {text:"夾住的範圍不同，結果完全不同。",options:{bold:true,color:GOLD}},
    {text:"　排好之後先看一眼凹槽裡有幾張，再按執行。",options:{color:INK}},
  ],{x:M+0.36,y:6.42,w:11.3,h:0.45,isTextBox:true,margin:0,fontFace:F,fontSize:16});
  s.addNotes("這一頁直接對應學生最容易搞混的地方，可以現場在遊戲裡按一次 ＋／− 給全班看。");
}

/* ================= 8 綠卡：如果⋯就⋯ ================= */
{
  const s=newSlide();
  heading(s,"SELECTION ／ 選擇結構","綠色卡：一張卡講完一整句「如果⋯就⋯」");

  // 左：卡片長什麼樣
  panel(s,M,1.8,5.3,4.55,PANEL2);
  ifCard(s,{x:M+0.42,y:2.08,w:4.46,h:1.9,cond:"如果 前方 3 格有障礙",act:"→ 就 清掉前方 3 格的障礙",code:"if(wall3){ clear(3) }",fs:17});
  s.addText("上面那行＝條件　·　下面那行＝條件成立時自動做的動作",
    {x:M+0.42,y:4.08,w:4.46,h:0.34,isTextBox:true,margin:0,fontFace:F,fontSize:12,color:MUTED});
  s.addText("牌堆裡還有這些：",{x:M+0.42,y:4.5,w:4.46,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:13,bold:true,color:GOLD});
  [["如果 前方有資源　→ 就 前進 1",4.84],
   ["如果 前方走不通　→ 就 右轉",5.34],
   ["如果 周圍沒對手　→ 就 前進 3",5.84]].forEach(([t,y])=>ifRow(s,{x:M+0.42,y,w:4.46,t}));

  // 右：兩條路
  const bx=M+5.9, bw=6.13;
  s.addShape(pres.ShapeType.roundRect,{x:bx,y:2.0,w:1.4,h:0.62,rectRadius:0.31,fill:{color:TEAL},line:noLine()});
  s.addText("成立",{x:bx,y:2.0,w:1.4,h:0.62,isTextBox:true,margin:0,fontFace:F,fontSize:17,bold:true,color:BG,align:"center",valign:"middle"});
  arrow(s,bx+1.5,2.1,0.4);
  s.addShape(pres.ShapeType.roundRect,{x:bx+2.0,y:1.88,w:4.13,h:0.88,rectRadius:0.12,fill:{color:PANEL},line:{color:TEAL,width:1.5}});
  s.addText("就做卡片內建的那個動作",{x:bx+2.2,y:2.0,w:3.75,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:15,bold:true,color:TEAL});
  s.addText("這張就是：清掉前方 3 格的障礙",{x:bx+2.2,y:2.34,w:3.75,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:12,color:MUTED});

  s.addShape(pres.ShapeType.roundRect,{x:bx,y:3.1,w:1.4,h:0.62,rectRadius:0.31,fill:{color:DANGER},line:noLine()});
  s.addText("不成立",{x:bx,y:3.1,w:1.4,h:0.62,isTextBox:true,margin:0,fontFace:F,fontSize:15,bold:true,color:"FFFFFF",align:"center",valign:"middle"});
  arrow(s,bx+1.5,3.2,0.4);
  s.addShape(pres.ShapeType.roundRect,{x:bx+2.0,y:2.98,w:4.13,h:0.88,rectRadius:0.12,fill:{color:PANEL},line:{color:DANGER,width:1.5}});
  s.addText("整張跳過，什麼都不做",{x:bx+2.2,y:3.1,w:3.75,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:15,bold:true,color:DANGER});
  s.addText("執行紀錄會寫「否」，這是正常的",{x:bx+2.2,y:3.44,w:3.75,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:12,color:MUTED});

  panel(s,bx,4.1,bw,1.05,PANEL);
  s.addText("動作不能自己挑",{x:bx+0.3,y:4.24,w:5.5,h:0.32,isTextBox:true,margin:0,fontFace:F,fontSize:15.5,bold:true,color:GOLD});
  s.addText("內建的動作是系統隨機發牌決定的。你能決定的是：要不要用這張、把它放在程式的第幾步。",
    {x:bx+0.3,y:4.58,w:5.55,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:12.5,color:INK,lineSpacingMultiple:1.2});

  panel(s,bx,5.3,bw,1.05,PANEL);
  s.addText("不會發出自相矛盾的卡",{x:bx+0.3,y:5.44,w:5.5,h:0.32,isTextBox:true,margin:0,fontFace:F,fontSize:15.5,bold:true,color:GOLD});
  s.addText("牌組只收搭得起來的組合，不會出現「如果前方是障礙 → 前進 3 格」這種永遠做不到的卡。",
    {x:bx+0.3,y:5.78,w:5.55,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:12.5,color:INK,lineSpacingMultiple:1.2});

  s.addNotes("問學生：如果前面那三格剛好沒有障礙，這張卡會怎麼做？（答：整張跳過，什麼都不做）再問：那我可以把它的動作改成前進嗎？（答：不行，動作是卡片內建、隨機發的）");
}

/* ================= 9 橘＋紅 ================= */
{
  const s=newSlide();
  heading(s,"FUNCTION ／ 呼叫副程式","橘卡＋紅卡：紅卡要被夾住才有效");
  card(s,{c:"orange",tag:"CALL",name:"發動",code:"call(",x:M,y:1.85,w:1.75,h:1.95});
  card(s,{c:"red",tag:"FUNC",name:"磁鐵",sub:"吸走四周的資源",code:"magnet()",x:M+1.95,y:1.85,w:1.75,h:1.95});
  card(s,{c:"orange",tag:"CALL",name:"發動",code:")",x:M+3.9,y:1.85,w:1.75,h:1.95});
  s.addShape(pres.ShapeType.roundRect,{x:M,y:3.98,w:5.65,h:0.5,rectRadius:0.25,fill:{color:GOLD},line:noLine()});
  s.addText("橘　→　紅　→　橘　才會生效",{x:M,y:3.98,w:5.65,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:16,bold:true,color:BG,align:"center",valign:"middle"});
  s.addText("排錯順序，紅卡就直接失效——卡浪費掉，機器人什麼都不會做。上方的橫幅會先提醒你。",
    {x:M,y:4.68,w:5.65,h:0.9,isTextBox:true,margin:0,fontFace:F,fontSize:14,color:DANGER,lineSpacingMultiple:1.25});
  panel(s,M+6.18,1.85,5.85,4.6);
  s.addText("八種特殊能力",{x:M+6.52,y:2.0,w:5.2,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:17,bold:true,color:GOLD});
  [["專車接送","瞬間移動到任一空格"],["加速器","直線衝刺最多 4 格"],
   ["磁鐵","吸走上下左右的資源"],["交換卡","和任一位玩家交換位置"],
   ["病毒","偷走別人 1 個資源"],["炸彈","炸掉上下左右的障礙物"],
   ["鑽頭","鑽過前方障礙物到後面"],["路障","放下障礙物擋住別人"]].forEach((p,i)=>{
    const col=i%2, row=(i-col)/2;
    const x=M+6.52+col*2.78, y=2.5+row*0.95;
    s.addShape(pres.ShapeType.roundRect,{x,y:y+0.03,w:0.28,h:0.28,rectRadius:0.06,fill:{color:C.red},line:noLine()});
    s.addText(p[0],{x:x+0.4,y,w:2.2,h:0.32,isTextBox:true,margin:0,fontFace:F,fontSize:14.5,bold:true,color:INK});
    s.addText(p[1],{x:x+0.4,y:y+0.34,w:2.3,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:11.5,color:MUTED});
  });
  s.addNotes("紅卡數量少，抽到要想清楚什麼時機用，而且手上要留著橘卡。");
}

/* ================= 10 任務卡 ================= */
{
  const s=newSlide();
  heading(s,"BUILD ORDERS","蓋房子：任務卡怎麼看");
  panel(s,M,1.8,4.3,3.5,PANEL2);
  s.addText("車站",{x:M+0.34,y:2.05,w:2.2,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:26,bold:true,color:INK});
  s.addText("4 分",{x:M+2.6,y:2.12,w:1.4,h:0.44,isTextBox:true,margin:0,fontFace:F,fontSize:22,bold:true,color:GOLD,align:"right"});
  s.addText("需要的資源",{x:M+0.34,y:2.68,w:3.6,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:12,color:MUTED});
  chip(s,"iron",M+0.34,3.0,0.6,16);
  ghostChip(s,"iron",M+1.02,3.0,0.6,16);
  ghostChip(s,"stone",M+1.7,3.0,0.6,16);
  s.addText("還缺 2 個",{x:M+2.5,y:3.12,w:1.5,h:0.36,isTextBox:true,margin:0,fontFace:F,fontSize:14,bold:true,color:GOLD});
  s.addText([
    {text:"實心 ",options:{color:MUTED}},{text:"＝已經收集到　",options:{color:INK,bold:true}},
    {text:"虛線空心 ",options:{color:MUTED}},{text:"＝還沒拿到",options:{color:INK,bold:true}},
  ],{x:M+0.34,y:3.85,w:3.7,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:13.5});
  s.addText("集滿就立刻得分，並馬上補一張新的任務卡。",{x:M+0.34,y:4.35,w:3.7,h:0.7,isTextBox:true,margin:0,fontFace:F,fontSize:13.5,color:TEAL,lineSpacingMultiple:1.25});
  const bx=M+4.85;
  panel(s,bx,1.8,7.18,3.5);
  s.addText("每個人同時有 2～3 張任務卡",{x:bx+0.36,y:2.05,w:6.4,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:18,bold:true,color:GOLD});
  [["先看再走","出牌前先看任務卡缺什麼，再決定機器人要往哪走。不要先走了才想。"],
   ["看得到別人的","點計分板上任何一個人，就能看他的任務卡。"],
   ["「還差 N」","計分板上的數字，是那個人最接近完成的一張還缺幾個資源。數字愈小愈危險。"]].forEach((t,i)=>{
    const y=2.6+i*0.85;
    s.addShape(pres.ShapeType.roundRect,{x:bx+0.36,y:y+0.04,w:0.28,h:0.28,rectRadius:0.06,fill:{color:TEAL},line:noLine()});
    s.addText(t[0],{x:bx+0.8,y:y-0.02,w:1.85,h:0.36,isTextBox:true,margin:0,fontFace:F,fontSize:15,bold:true,color:INK});
    s.addText(t[1],{x:bx+2.7,y:y-0.02,w:4.2,h:0.72,isTextBox:true,margin:0,fontFace:F,fontSize:13,color:MUTED,lineSpacingMultiple:1.2});
  });
  panel(s,M,5.55,12.03,1.18,PANEL2);
  s.addText([
    {text:"暫存卡：",options:{bold:true,color:DANGER}},
    {text:"用不到的資源可以先放這裡，集滿 2 個可以跟資源庫「2 換 1」換成你要的。但是——",options:{color:INK}},
    {text:"結算時暫存卡上的資源一分都不算。",options:{bold:true,color:DANGER}},
  ],{x:M+0.36,y:5.78,w:11.3,h:0.75,isTextBox:true,margin:0,fontFace:F,fontSize:15,lineSpacingMultiple:1.25});
  s.addNotes("囤在暫存卡上是新手最常犯的錯，記得提醒他們換掉。");
}

/* ================= 11 結束與計分 ================= */
{
  const s=newSlide();
  heading(s,"SCORING","怎麼結束？怎麼算分？");
  panel(s,M,1.8,5.85,2.35);
  s.addText("兩種結束方式（開場老師會宣布）",{x:M+0.34,y:2.02,w:5.2,h:0.36,isTextBox:true,margin:0,fontFace:F,fontSize:16,bold:true,color:GOLD});
  [["積分達標","有人先達到目標分數，遊戲立刻結束"],["資源搶光","地圖上的資源全部被採完"]].forEach((e,i)=>{
    const y=2.55+i*0.72;
    numBox(s,i+1,M+0.36,y,0.42,TEAL,BG);
    s.addText(e[0],{x:M+0.94,y:y-0.02,w:1.6,h:0.36,isTextBox:true,margin:0,fontFace:F,fontSize:15,bold:true,color:INK});
    s.addText(e[1],{x:M+2.5,y:y,w:3.3,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:12.5,color:MUTED});
  });
  panel(s,M+6.18,1.8,5.85,4.35);
  s.addText("結算：三種東西",{x:M+6.52,y:2.02,w:5.2,h:0.36,isTextBox:true,margin:0,fontFace:F,fontSize:16,bold:true,color:GOLD});
  [["已完成的建築","拿任務卡上的完整分數",GOLD],["未完成的任務卡","上面每個已收集的資源算 1 分",TEAL],
   ["暫存卡上的資源","一分都不算",DANGER]].forEach((e,i)=>{
    const y=2.6+i*1.15;
    s.addShape(pres.ShapeType.roundRect,{x:M+6.52,y,w:5.17,h:0.95,rectRadius:0.1,fill:{color:PANEL2},line:noLine()});
    s.addText(e[0],{x:M+6.82,y:y+0.12,w:4.6,h:0.34,isTextBox:true,margin:0,fontFace:F,fontSize:15.5,bold:true,color:e[2]});
    s.addText(e[1],{x:M+6.82,y:y+0.5,w:4.6,h:0.34,isTextBox:true,margin:0,fontFace:F,fontSize:13.5,color:INK});
  });
  panel(s,M,4.5,5.85,1.65,PANEL2);
  s.addText("蓋不完也有分",{x:M+0.34,y:4.68,w:5.2,h:0.36,isTextBox:true,margin:0,fontFace:F,fontSize:16,bold:true,color:TEAL});
  s.addText("時間到還沒蓋完不用難過——放在任務卡上的資源，每一個都還是 1 分。所以「一直把資源放上任務卡」永遠不吃虧。",
    {x:M+0.34,y:5.08,w:5.2,h:1.0,isTextBox:true,margin:0,fontFace:F,fontSize:14,color:INK,lineSpacingMultiple:1.25});
  s.addNotes("這一頁決定學生的策略走向，講清楚再開始。");
}

/* ================= 12 策略 ================= */
{
  const s=newSlide();
  heading(s,"TACTICS","想贏的話，記住這四件事");
  [
    {t:"先想完，再出牌",d:"機器人一旦開始跑就停不下來。出牌前先在心裡走一遍，數清楚要走幾格、往哪轉。"},
    {t:"先確認凹槽夾了幾張",d:"黃卡最容易出錯的地方。按執行前看一眼卡片右下角的數字，確認夾住的是你想要的那幾張。"},
    {t:"資源要放任務卡，不要囤",d:"暫存卡結算不計分。手上有 2 個用不到的，就趕快 2 換 1 換成需要的。"},
    {t:"抬頭看別人的「還差 N」",d:"數字快變成 0 的人隨時會得分。必要時用紅卡去搶、去換位置擋路。"},
  ].forEach((tp,i)=>{
    const x=M+(i%2)*6.18, y=1.8+Math.floor(i/2)*2.45;
    panel(s,x,y,5.85,2.2);
    numBox(s,i+1,x+0.34,y+0.32,0.5);
    s.addText(tp.t,{x:x+1.0,y:y+0.34,w:4.6,h:0.44,isTextBox:true,margin:0,fontFace:F,fontSize:19,bold:true,color:GOLD});
    s.addText(tp.d,{x:x+0.34,y:y+1.05,w:5.17,h:0.95,isTextBox:true,margin:0,fontFace:F,fontSize:14,color:INK,lineSpacingMultiple:1.3});
  });
  s.addText("看不清楚？畫面上每個面板右上角的「－」可以收起來，地圖會自動變大。",
    {x:M,y:6.55,w:12.03,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:14,color:MUTED});
  s.addNotes("這頁可以在第一輪打完之後再回來講，學生比較有感覺。");
}

/* ================= 13 開始 ================= */
{
  const s=newSlide();
  s.addText("準備好了嗎？",{x:M,y:2.3,w:8.0,h:0.9,isTextBox:true,margin:0,fontFace:F,fontSize:44,bold:true,color:INK});
  s.addText("挑一台機器人，決定一開始面對的方向，然後開始蓋你的城市。",
    {x:M,y:3.35,w:7.6,h:0.6,isTextBox:true,margin:0,fontFace:F,fontSize:19,color:MUTED});
  s.addShape(pres.ShapeType.roundRect,{x:M,y:4.35,w:6.4,h:0.85,rectRadius:0.12,fill:{color:PANEL},line:{color:GOLD,width:1.5}});
  s.addText("jack1214w.github.io/robot-city",{x:M,y:4.35,w:6.4,h:0.85,isTextBox:true,margin:0,fontFace:FM,fontSize:19,bold:true,color:GOLD,align:"center",valign:"middle"});
  ["E0564E","2F8FD8","3FA96B","E0A02A","A96BD0","E07A3C","2FB6B0"].forEach((c,i)=>robotCell(s,8.6+i*0.66,2.6,0.6,c,i+1));
  s.addText("祝你蓋出全場最厲害的城市",{x:8.6,y:3.45,w:4.2,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:15,color:TEAL});
  s.addNotes("按「規則」按鈕可以隨時叫出遊戲內的完整規則與卡片說明。");
}

pres.writeFile({ fileName: "機器人蓋城市-遊戲規則.pptx" }).then(f=>console.log("寫出：",f));
