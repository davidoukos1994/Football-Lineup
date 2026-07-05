
let matchHistory = [];
const formations={"4-3-3":[["GK",50,92],["LB",18,75],["CB",39,76],["CB",61,76],["RB",82,75],["CM",28,56],["CM",50,53],["CM",72,56],["LW",22,29],["ST",50,24],["RW",78,29]],"4-4-2":[["GK",50,92],["LB",18,75],["CB",39,76],["CB",61,76],["RB",82,75],["LM",20,53],["CM",40,55],["CM",60,55],["RM",80,53],["ST",40,27],["ST",60,27]],"4-2-3-1":[["GK",50,92],["LB",18,75],["CB",39,76],["CB",61,76],["RB",82,75],["DM",40,60],["DM",60,60],["LW",22,42],["AM",50,39],["RW",78,42],["ST",50,23]],"3-5-2":[["GK",50,92],["CB",30,76],["CB",50,78],["CB",70,76],["LWB",14,55],["CM",35,56],["CM",50,52],["CM",65,56],["RWB",86,55],["ST",40,27],["ST",60,27]],"3-4-3":[["GK",50,92],["CB",30,76],["CB",50,78],["CB",70,76],["LM",18,56],["CM",40,55],["CM",60,55],["RM",82,56],["LW",24,29],["ST",50,24],["RW",76,29]],"5-3-2":[["GK",50,92],["LWB",12,73],["CB",32,77],["CB",50,79],["CB",68,77],["RWB",88,73],["CM",30,54],["CM",50,51],["CM",70,54],["ST",40,27],["ST",60,27]]};
const KEY="footballCoachV7";
const STORE_KEY = KEY;const $=id=>document.getElementById(id);
let currentFormation="4-3-3",players=Array.from({length:11},(_,i)=>({name:`Παίκτης ${i+1}`,number:String(i+1),goals:0,assists:0,yellow:0,red:0,minutes:0,rating:"",custom:false,x:null,y:null})),subs=["Αναπληρωματικός 1","Αναπληρωματικός 2"],seconds=0,running=false,timer=null,drawMode=false,drawing=false,lines=[],currentLine=null,playerHistory={},matchHistory=[];
const pitch=$("pitch"),canvas=$("drawCanvas"),ctx=canvas.getContext("2d");
function save(){localStorage.setItem(KEY,JSON.stringify({currentFormation,players,subs,seconds,teamName:$("teamName").value,homeTeam:$("homeTeam").value,awayTeam:$("awayTeam").value,homeScore:$("homeScore").value,awayScore:$("awayScore").value,notes:$("notes").value,logo:$("headerLogo").src||"",lines,playerHistory,matchHistory}))}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||"null");if(!d)return;currentFormation=d.currentFormation||currentFormation;players=(d.players?.length===11?d.players:players).map((p,i)=>({...p,number:p.number??String(i+1),goals:p.goals??0,assists:p.assists??0,yellow:p.yellow??0,red:p.red??0,minutes:p.minutes??0,rating:p.rating??""}));subs=d.subs||subs;seconds=d.seconds||0;lines=d.lines||[];playerHistory=d.playerHistory||{};matchHistory=d.matchHistory||[];$("teamName").value=d.teamName||"Η Ομάδα μου";$("homeTeam").value=d.homeTeam||$("teamName").value;$("awayTeam").value=d.awayTeam||"Αντίπαλος";$("homeScore").value=d.homeScore??0;$("awayScore").value=d.awayScore??0;$("notes").value=d.notes||"";$("formation").value=currentFormation;if(d.logo){$("teamLogoPreview").src=d.logo;$("headerLogo").src=d.logo;$("headerLogo").style.display="block"}}catch(e){}}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function keyName(n){return String(n||"").trim().toLowerCase()}
function render(){renderHeader();renderPlayers();renderForm();renderSubs();renderTimer();resizeCanvas();drawAll();save()}
function renderHeader(){$("teamTitle").textContent=$("teamName").value||"Η Ομάδα μου";$("scoreHomeName").textContent=$("homeTeam").value||$("teamName").value||"Ομάδα";$("scoreAwayName").textContent=$("awayTeam").value||"Αντίπαλος";$("scoreHome").textContent=$("homeScore").value||0;$("scoreAway").textContent=$("awayScore").value||0}
function format(s){return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}
function renderTimer(){$("timerDisplay").textContent=format(seconds);$("timerLive").textContent=format(seconds)}
function pos(i){const d=formations[currentFormation][i],p=players[i];return p.custom&&p.x!=null&&p.y!=null?[d[0],p.x,p.y]:d}
function renderPlayers(){const wrap=$("playersOnPitch");wrap.innerHTML="";formations[currentFormation].forEach((_,i)=>{const [position,x,y]=pos(i),p=players[i],el=document.createElement("div");el.className="player";el.style.left=x+"%";el.style.top=y+"%";const card=p.red>0?"red":p.yellow>0?"yellow":"";el.innerHTML=`<span class="num">${esc(p.number)}</span><span class="info"><small>${position}</small>${esc(p.name)}</span><span class="card ${card}"></span>${p.goals>0?`<span class="goals-badge">⚽${p.goals}</span>`:""}`;el.addEventListener("click",e=>{if(el.dataset.dragged==="1"){el.dataset.dragged="0";return}openPlayer(i)});drag(el,i);wrap.appendChild(el)})}
function drag(el,i){let on=false,moved=false;el.addEventListener("pointerdown",e=>{if(drawMode)return;e.preventDefault();on=true;moved=false;el.setPointerCapture(e.pointerId);el.classList.add("dragging")});el.addEventListener("pointermove",e=>{if(!on)return;e.preventDefault();moved=true;el.dataset.dragged="1";const r=pitch.getBoundingClientRect();let x=((e.clientX-r.left)/r.width)*100,y=((e.clientY-r.top)/r.height)*100;x=Math.max(9,Math.min(91,x));y=Math.max(4,Math.min(96,y));players[i].custom=true;players[i].x=+x.toFixed(2);players[i].y=+y.toFixed(2);el.style.left=players[i].x+"%";el.style.top=players[i].y+"%";save()});["pointerup","pointercancel"].forEach(ev=>el.addEventListener(ev,()=>{on=false;el.classList.remove("dragging");setTimeout(()=>{if(!moved)el.dataset.dragged="0"},60)}))}
function openPlayer(i){const p=players[i];$("editIndex").value=i;$("editName").value=p.name;$("editNumber").value=p.number;$("editGoals").value=p.goals||0;$("editAssists").value=p.assists||0;$("editYellow").value=p.yellow||0;$("editRed").value=p.red||0;$("editMinutes").value=p.minutes||0;$("editRating").value=p.rating||"";showStats(p.name);$("playerDialog").showModal();setTimeout(()=>$("editName").focus(),100)}
function showStats(name){const h=playerHistory[keyName(name)];$("playerStats").innerHTML=h?`<b>Ιστορικό:</b><br>Αγώνες: ${h.matches} | Γκολ: ${h.goals} | Ασίστ: ${h.assists}<br>Κίτρινες: ${h.yellow} | Κόκκινες: ${h.red}<br>Λεπτά: ${h.minutes} | Μ.Ο. βαθμολογίας: ${h.ratingCount? (h.ratingSum/h.ratingCount).toFixed(1):"-"}`:"Δεν υπάρχει ακόμα ιστορικό για αυτόν τον παίκτη."}
$("editName").addEventListener("input",e=>showStats(e.target.value));
$("savePlayer").onclick=()=>{const i=+$("editIndex").value,p=players[i];p.name=$("editName").value.trim();p.number=$("editNumber").value;p.goals=+$("editGoals").value||0;p.assists=+$("editAssists").value||0;p.yellow=+$("editYellow").value||0;p.red=+$("editRed").value||0;p.minutes=+$("editMinutes").value||0;p.rating=$("editRating").value;render()}
function renderForm(){const f=$("playersForm");f.innerHTML="";formations[currentFormation].forEach(([position],i)=>{const row=document.createElement("div");row.className="player-row";row.innerHTML=`<strong>${position}</strong><input value="${esc(players[i].name)}"><input value="${esc(players[i].number)}" placeholder="Νο."><button>✎</button>`;const [name,number]=row.querySelectorAll("input");name.oninput=e=>{players[i].name=e.target.value;renderPlayers();save()};number.oninput=e=>{players[i].number=e.target.value;renderPlayers();save()};row.querySelector("button").onclick=()=>openPlayer(i);f.appendChild(row)})}
function renderSubs(){const list=$("subsList"),prev=$("subsPreview");list.innerHTML="";prev.innerHTML="";subs.forEach((s,i)=>{const row=document.createElement("div");row.className="sub-row";row.innerHTML=`<input value="${esc(s)}"><button>×</button>`;row.querySelector("input").oninput=e=>{subs[i]=e.target.value;renderSubs();save()};row.querySelector("button").onclick=()=>{subs.splice(i,1);renderSubs();save()};list.appendChild(row)});subs.filter(Boolean).forEach(s=>{const pill=document.createElement("span");pill.className="sub-pill";pill.textContent=s;prev.appendChild(pill)})}
function updateHistoryFromMatch(){players.forEach(p=>{if(!p.name.trim())return;const k=keyName(p.name);if(!playerHistory[k])playerHistory[k]={name:p.name,matches:0,goals:0,assists:0,yellow:0,red:0,minutes:0,ratingSum:0,ratingCount:0};const h=playerHistory[k];h.name=p.name;h.matches++;h.goals+=+p.goals||0;h.assists+=+p.assists||0;h.yellow+=+p.yellow||0;h.red+=+p.red||0;h.minutes+=+p.minutes||0;if(p.rating){h.ratingSum+=+p.rating;h.ratingCount++}})}
$("saveMatch").onclick=()=>{updateHistoryFromMatch();matchHistory.unshift({date:new Date().toLocaleString("el-GR"),home:$("homeTeam").value,away:$("awayTeam").value,homeScore:$("homeScore").value,awayScore:$("awayScore").value,formation:currentFormation,time:format(seconds),notes:$("notes").value,players:JSON.parse(JSON.stringify(players)),subs:[...subs]});save();alert("Ο αγώνας αποθηκεύτηκε στο ιστορικό.")}
function renderHistory(){const ph=$("playerHistory"),mh=$("matchHistory");ph.innerHTML="";Object.values(playerHistory).sort((a,b)=>b.matches-a.matches).forEach(h=>{const div=document.createElement("div");div.className="history-item";div.innerHTML=`<b>${esc(h.name)}</b><br>Αγώνες: ${h.matches} | Γκολ: ${h.goals} | Ασίστ: ${h.assists} | Λεπτά: ${h.minutes}<br>Κίτρινες: ${h.yellow} | Κόκκινες: ${h.red} | Μ.Ο.: ${h.ratingCount?(h.ratingSum/h.ratingCount).toFixed(1):"-"}`;ph.appendChild(div)});mh.innerHTML="";matchHistory.forEach(m=>{const div=document.createElement("div");div.className="history-item";div.innerHTML=`<b>${esc(m.home)} ${m.homeScore}-${m.awayScore} ${esc(m.away)}</b><br>${m.date} | ${m.formation} | ${m.time}`;mh.appendChild(div)})}
$("openHistory").onclick=()=>{renderHistory();$("historyDialog").showModal()}
function resizeCanvas(){const r=pitch.getBoundingClientRect(),ratio=devicePixelRatio||1;canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);canvas.style.width=r.width+"px";canvas.style.height=r.height+"px";ctx.setTransform(ratio,0,0,ratio,0,0)}
function point(e){const r=pitch.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function arrow(a,b){ctx.strokeStyle="#fff";ctx.fillStyle="#fff";ctx.lineWidth=5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();const ang=Math.atan2(b.y-a.y,b.x-a.x),len=18;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-len*Math.cos(ang-.52),b.y-len*Math.sin(ang-.52));ctx.lineTo(b.x-len*Math.cos(ang+.52),b.y-len*Math.sin(ang+.52));ctx.closePath();ctx.fill()}
function drawAll(){resizeCanvas();ctx.clearRect(0,0,canvas.width,canvas.height);lines.forEach(l=>arrow(l.a,l.b));if(currentLine)arrow(currentLine.a,currentLine.b)}
canvas.onpointerdown=e=>{if(!drawMode)return;drawing=true;currentLine={a:point(e),b:point(e)};canvas.setPointerCapture(e.pointerId)}
canvas.onpointermove=e=>{if(!drawMode||!drawing)return;currentLine.b=point(e);drawAll()}
canvas.onpointerup=()=>{if(!drawMode||!drawing)return;drawing=false;lines.push(currentLine);currentLine=null;drawAll();save()}
window.onresize=()=>{resizeCanvas();drawAll()}
$("formation").onchange=e=>{currentFormation=e.target.value;players=players.map(p=>({...p,custom:false,x:null,y:null}));render()}
$("teamName").oninput=()=>{if(!$("homeTeam").value||$("homeTeam").value==="Η Ομάδα μου")$("homeTeam").value=$("teamName").value;render()}
;["homeTeam","awayTeam","homeScore","awayScore"].forEach(id=>$(id).oninput=render)
$("notes").oninput=save
$("teamLogo").onchange=e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{$("teamLogoPreview").src=reader.result;$("headerLogo").src=reader.result;$("headerLogo").style.display="block";save()};reader.readAsDataURL(file)}
$("addSub").onclick=()=>{subs.push(`Αναπληρωματικός ${subs.length+1}`);renderSubs();save()}
$("openNotes").onclick=()=>$("notesDialog").showModal()
$("toggleDraw").onclick=e=>{drawMode=!drawMode;pitch.classList.toggle("drawing",drawMode);e.target.textContent=drawMode?"Βέλη: On":"Βέλη: Off"}
$("clearDraw").onclick=()=>{lines=[];drawAll();save()}
$("timerStart").onclick=()=>{if(running)return;running=true;timer=setInterval(()=>{seconds++;renderTimer();save()},1000)}
$("timerStop").onclick=()=>{running=false;clearInterval(timer)}
$("timerReset").onclick=()=>{running=false;clearInterval(timer);seconds=0;renderTimer();save()}
$("resetAll").onclick=()=>{if(!confirm("Καθαρισμός τρέχοντος αγώνα; Το ιστορικό θα μείνει."))return;currentFormation="4-3-3";players=Array.from({length:11},(_,i)=>({name:`Παίκτης ${i+1}`,number:String(i+1),goals:0,assists:0,yellow:0,red:0,minutes:0,rating:"",custom:false,x:null,y:null}));subs=[];seconds=0;lines=[];render()}
async function capture(){drawAll();return await html2canvas($("captureArea"),{backgroundColor:"#e2e8f0",scale:2})}
$("exportPng").onclick=async()=>{const c=await capture(),a=document.createElement("a");a.download="football-lineup.png";a.href=c.toDataURL("image/png");a.click()}
$("exportPdf").onclick=async()=>{const c=await capture(),img=c.toDataURL("image/png"),{jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});pdf.addImage(img,"PNG",10,8,190,280);pdf.save("football-lineup.pdf")}
load();render();

/* ===== v8.1 additions: season, match details, backup/restore, match history ===== */

function v81Get(id) {
  return document.getElementById(id);
}

function v81MatchTypeLabel(value) {
  if (value === "friendly") return "Φιλικό";
  if (value === "cup") return "Κύπελλο";
  return "Πρωτάθλημα";
}

function v81ReadOldState() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
  } catch (error) {
    return {};
  }
}

function v81WriteOldState(extra) {
  const current = v81ReadOldState();
  localStorage.setItem(STORE_KEY, JSON.stringify({ ...current, ...extra }));
}

function v81CollectState() {
  return {
    v: "8.1",
    currentFormation,
    players,
    subs,
    lines,
    timerSeconds,
    teamName: v81Get("teamName")?.value || "",
    homeTeam: v81Get("homeTeam")?.value || "",
    awayTeam: v81Get("awayTeam")?.value || "",
    homeScore: v81Get("homeScore")?.value || 0,
    awayScore: v81Get("awayScore")?.value || 0,
    notes: v81Get("notes")?.value || "",
    logo: v81Get("headerLogo")?.src || "",
    season: v81Get("season")?.value || "",
    matchType: v81Get("matchType")?.value || "league",
    matchDay: v81Get("matchDay")?.value || "",
    matchDate: v81Get("matchDate")?.value || "",
    matchHistory
  };
}

function v81ApplyExtraState(data) {
  if (!data) return;

  matchHistory = Array.isArray(data.matchHistory) ? data.matchHistory : [];

  if (v81Get("season")) v81Get("season").value = data.season || v81Get("season").value || "Αθλόπολις 2026-2027";
  if (v81Get("matchType")) v81Get("matchType").value = data.matchType || "league";
  if (v81Get("matchDay")) v81Get("matchDay").value = data.matchDay || "";
  if (v81Get("matchDate")) v81Get("matchDate").value = data.matchDate || "";
}

function v81RenderMatchHeader() {
  const seasonTitle = v81Get("seasonTitle");
  const matchMetaTitle = v81Get("matchMetaTitle");

  if (seasonTitle) {
    seasonTitle.textContent = v81Get("season")?.value || "Αγωνιστική περίοδος";
  }

  if (matchMetaTitle) {
    const type = v81MatchTypeLabel(v81Get("matchType")?.value || "league");
    const day = v81Get("matchDay")?.value || "Αγωνιστική";
    const date = v81Get("matchDate")?.value || "Ημερομηνία";
    matchMetaTitle.textContent = `${type} • ${day} • ${date}`;
  }
}

function v81SaveExtra() {
  v81WriteOldState({
    season: v81Get("season")?.value || "",
    matchType: v81Get("matchType")?.value || "league",
    matchDay: v81Get("matchDay")?.value || "",
    matchDate: v81Get("matchDate")?.value || "",
    matchHistory
  });
}

function v81SaveMatch() {
  const match = {
    id: Date.now(),
    savedAt: new Date().toLocaleString("el-GR"),
    season: v81Get("season")?.value || "",
    matchType: v81Get("matchType")?.value || "league",
    matchDay: v81Get("matchDay")?.value || "",
    matchDate: v81Get("matchDate")?.value || "",
    homeTeam: v81Get("homeTeam")?.value || "",
    awayTeam: v81Get("awayTeam")?.value || "",
    homeScore: v81Get("homeScore")?.value || 0,
    awayScore: v81Get("awayScore")?.value || 0,
    formation: currentFormation,
    timerSeconds,
    timerText: typeof formatTime === "function" ? formatTime(timerSeconds) : String(timerSeconds),
    notes: v81Get("notes")?.value || "",
    players: JSON.parse(JSON.stringify(players || [])),
    subs: JSON.parse(JSON.stringify(subs || []))
  };

  matchHistory.unshift(match);
  v81SaveExtra();
  alert("Ο αγώνας αποθηκεύτηκε στο ιστορικό.");
}

function v81RenderMatchHistory() {
  const list = v81Get("matchHistoryList");
  if (!list) return;

  if (!matchHistory.length) {
    list.innerHTML = "<p>Δεν έχεις αποθηκεύσει ακόμα αγώνα.</p>";
    return;
  }

  list.innerHTML = matchHistory.map((match, index) => {
    const type = v81MatchTypeLabel(match.matchType);
    const title = `${match.homeTeam || "Ομάδα"} ${match.homeScore ?? 0}-${match.awayScore ?? 0} ${match.awayTeam || "Αντίπαλος"}`;
    const meta = `${match.season || ""} • ${type} • ${match.matchDay || ""} • ${match.matchDate || match.savedAt || ""}`;
    return `
      <div class="match-history-item">
        <b>${title}</b>
        <div>${meta}</div>
        <div>Σύστημα: ${match.formation || "-"} • Χρόνος: ${match.timerText || "-"}</div>
        <button type="button" onclick="v81LoadMatch(${index})">Φόρτωση</button>
        <button type="button" onclick="v81DeleteMatch(${index})">Διαγραφή</button>
      </div>
    `;
  }).join("");
}

function v81OpenMatchHistory() {
  v81RenderMatchHistory();
  v81Get("matchHistoryDialog")?.showModal();
}

function v81LoadMatch(index) {
  const match = matchHistory[index];
  if (!match) return;

  if (!confirm("Να φορτωθεί αυτός ο αγώνας στην τρέχουσα οθόνη;")) return;

  currentFormation = match.formation || currentFormation;
  players = Array.isArray(match.players) ? JSON.parse(JSON.stringify(match.players)) : players;
  subs = Array.isArray(match.subs) ? JSON.parse(JSON.stringify(match.subs)) : subs;
  lines = [];
  timerSeconds = Number(match.timerSeconds || 0);

  if (v81Get("formation")) v81Get("formation").value = currentFormation;
  if (v81Get("season")) v81Get("season").value = match.season || "";
  if (v81Get("matchType")) v81Get("matchType").value = match.matchType || "league";
  if (v81Get("matchDay")) v81Get("matchDay").value = match.matchDay || "";
  if (v81Get("matchDate")) v81Get("matchDate").value = match.matchDate || "";
  if (v81Get("homeTeam")) v81Get("homeTeam").value = match.homeTeam || "";
  if (v81Get("awayTeam")) v81Get("awayTeam").value = match.awayTeam || "";
  if (v81Get("homeScore")) v81Get("homeScore").value = match.homeScore ?? 0;
  if (v81Get("awayScore")) v81Get("awayScore").value = match.awayScore ?? 0;
  if (v81Get("notes")) v81Get("notes").value = match.notes || "";

  render();
  v81Get("matchHistoryDialog")?.close();
}

function v81DeleteMatch(index) {
  if (!confirm("Να διαγραφεί αυτός ο αγώνας από το ιστορικό;")) return;
  matchHistory.splice(index, 1);
  v81SaveExtra();
  v81RenderMatchHistory();
}

function v81BackupData() {
  const data = v81CollectState();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "football-coach-backup-v8-1.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function v81RestoreData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);

      currentFormation = data.currentFormation || currentFormation;
      players = Array.isArray(data.players) ? data.players : players;
      subs = Array.isArray(data.subs) ? data.subs : subs;
      lines = Array.isArray(data.lines) ? data.lines : lines;
      timerSeconds = Number(data.timerSeconds || 0);

      if (v81Get("formation")) v81Get("formation").value = currentFormation;
      if (v81Get("teamName")) v81Get("teamName").value = data.teamName || "Η Ομάδα μου";
      if (v81Get("homeTeam")) v81Get("homeTeam").value = data.homeTeam || "";
      if (v81Get("awayTeam")) v81Get("awayTeam").value = data.awayTeam || "";
      if (v81Get("homeScore")) v81Get("homeScore").value = data.homeScore ?? 0;
      if (v81Get("awayScore")) v81Get("awayScore").value = data.awayScore ?? 0;
      if (v81Get("notes")) v81Get("notes").value = data.notes || "";

      v81ApplyExtraState(data);

      if (data.logo && v81Get("headerLogo") && v81Get("teamLogoPreview")) {
        v81Get("headerLogo").src = data.logo;
        v81Get("headerLogo").style.display = "block";
        v81Get("teamLogoPreview").src = data.logo;
      }

      render();
      alert("Το restore ολοκληρώθηκε.");
    } catch (error) {
      alert("Δεν μπόρεσα να διαβάσω το αρχείο backup.");
    }
  };
  reader.readAsText(file);
}

function v81Init() {
  const oldState = v81ReadOldState();
  v81ApplyExtraState(oldState);
  v81RenderMatchHeader();

  ["season", "matchType", "matchDay", "matchDate"].forEach((id) => {
    const el = v81Get(id);
    if (el) {
      el.addEventListener("input", () => {
        v81RenderMatchHeader();
        v81SaveExtra();
      });
      el.addEventListener("change", () => {
        v81RenderMatchHeader();
        v81SaveExtra();
      });
    }
  });

  v81Get("saveMatch")?.addEventListener("click", v81SaveMatch);
  v81Get("openMatchHistory")?.addEventListener("click", v81OpenMatchHistory);
  v81Get("backupData")?.addEventListener("click", v81BackupData);
  v81Get("restoreData")?.addEventListener("change", v81RestoreData);

  const originalRender = window.render;
  if (typeof originalRender === "function" && !window.__v81RenderWrapped) {
    window.render = function() {
      originalRender();
      v81RenderMatchHeader();
      v81SaveExtra();
    };
    window.__v81RenderWrapped = true;
  }
}

v81Init();
