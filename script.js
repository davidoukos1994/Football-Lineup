const formations={"4-3-3":[["GK",50,92],["LB",18,75],["CB",39,76],["CB",61,76],["RB",82,75],["CM",28,56],["CM",50,53],["CM",72,56],["LW",22,29],["ST",50,24],["RW",78,29]],"4-4-2":[["GK",50,92],["LB",18,75],["CB",39,76],["CB",61,76],["RB",82,75],["LM",20,53],["CM",40,55],["CM",60,55],["RM",80,53],["ST",40,27],["ST",60,27]],"4-2-3-1":[["GK",50,92],["LB",18,75],["CB",39,76],["CB",61,76],["RB",82,75],["DM",40,60],["DM",60,60],["LW",22,42],["AM",50,39],["RW",78,42],["ST",50,23]],"3-5-2":[["GK",50,92],["CB",30,76],["CB",50,78],["CB",70,76],["LWB",14,55],["CM",35,56],["CM",50,52],["CM",65,56],["RWB",86,55],["ST",40,27],["ST",60,27]],"3-4-3":[["GK",50,92],["CB",30,76],["CB",50,78],["CB",70,76],["LM",18,56],["CM",40,55],["CM",60,55],["RM",82,56],["LW",24,29],["ST",50,24],["RW",76,29]],"5-3-2":[["GK",50,92],["LWB",12,73],["CB",32,77],["CB",50,79],["CB",68,77],["RWB",88,73],["CM",30,54],["CM",50,51],["CM",70,54],["ST",40,27],["ST",60,27]]};
const KEY="footballCoachV7";const $=id=>document.getElementById(id);
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

/* ===== v7.1 additions: match details + backup/restore ===== */
(function () {
  const EXTRA_KEY = "footballCoachV71Extras";

  function q(id) {
    return document.getElementById(id);
  }

  function typeLabel(value) {
    if (value === "friendly") return "Φιλικό";
    if (value === "cup") return "Κύπελλο";
    return "Πρωτάθλημα";
  }

  function getExtras() {
    return {
      season: q("matchSeasonV71")?.value || "",
      type: q("matchTypeV71")?.value || "league",
      day: q("matchDayV71")?.value || "",
      date: q("matchDateV71")?.value || ""
    };
  }

  function updateMatchInfo() {
    const box = q("matchInfoV71");
    if (!box) return;
    const x = getExtras();
    box.textContent = [x.season, typeLabel(x.type), x.day, x.date].filter(Boolean).join(" • ");
  }

  function saveExtras() {
    localStorage.setItem(EXTRA_KEY, JSON.stringify(getExtras()));
    updateMatchInfo();
  }

  function loadExtras() {
    try {
      const x = JSON.parse(localStorage.getItem(EXTRA_KEY) || "{}");
      if (q("matchSeasonV71") && x.season) q("matchSeasonV71").value = x.season;
      if (q("matchTypeV71") && x.type) q("matchTypeV71").value = x.type;
      if (q("matchDayV71") && x.day) q("matchDayV71").value = x.day;
      if (q("matchDateV71") && x.date) q("matchDateV71").value = x.date;
    } catch (e) {}
    updateMatchInfo();
  }

  function collectAllStorage() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    return data;
  }

  function backup() {
    saveExtras();
    const payload = {
      app: "Football Coach",
      version: "7.1",
      createdAt: new Date().toISOString(),
      localStorage: collectAllStorage()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "football-coach-backup-v7-1.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function restore(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      try {
        const payload = JSON.parse(reader.result);
        if (!payload.localStorage) throw new Error("wrong backup");

        Object.keys(payload.localStorage).forEach((key) => {
          localStorage.setItem(key, payload.localStorage[key]);
        });

        alert("Το restore ολοκληρώθηκε. Η σελίδα θα ανανεωθεί.");
        location.reload();
      } catch (err) {
        alert("Δεν είναι σωστό αρχείο backup.");
      }
    };
    reader.readAsText(file);
  }

  function init() {
    loadExtras();

    ["matchSeasonV71", "matchTypeV71", "matchDayV71", "matchDateV71"].forEach((id) => {
      const el = q(id);
      if (!el) return;
      el.addEventListener("input", saveExtras);
      el.addEventListener("change", saveExtras);
    });

    q("backupV71")?.addEventListener("click", backup);
    q("restoreV71")?.addEventListener("change", restore);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


/* ===== v7.1.1 clear history button ===== */
(function () {
  function initClearHistory() {
    const btn = document.getElementById("clearHistory");
    if (!btn) return;

    btn.addEventListener("click", function () {
      if (!confirm("Να σβηστεί όλο το ιστορικό παικτών και αγώνων; Η τρέχουσα 11άδα δεν θα χαθεί.")) return;

      try {
        if (typeof playerHistory !== "undefined") playerHistory = {};
        if (typeof matchHistory !== "undefined") matchHistory = [];
        if (typeof save === "function") save();
        alert("Το ιστορικό σβήστηκε.");
      } catch (err) {
        alert("Δεν μπόρεσα να σβήσω το ιστορικό.");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClearHistory);
  } else {
    initClearHistory();
  }
})();


/* ===== v7.1.2 History Manager ===== */
(function () {
  let currentTabV712 = "players";

  function q(id) {
    return document.getElementById(id);
  }

  function safeJson(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (err) {
      return fallback;
    }
  }

  function getStorageObject(key) {
    return safeJson(localStorage.getItem(key), null);
  }

  function setStorageObject(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getPossibleAppStates() {
    const states = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = getStorageObject(key);
      if (!value || typeof value !== "object") continue;

      if (
        Array.isArray(value.players) ||
        value.playerHistory ||
        value.matchHistory ||
        Array.isArray(value.matchHistory)
      ) {
        states.push({ key, value });
      }
    }
    return states;
  }

  function extractPlayersHistory() {
    const items = [];

    getPossibleAppStates().forEach(({ key, value }) => {
      if (value.playerHistory && typeof value.playerHistory === "object") {
        Object.values(value.playerHistory).forEach((p) => {
          if (!p) return;
          items.push({
            source: key,
            name: p.name || p.playerName || "Παίκτης",
            matches: p.matches || p.games || 0,
            goals: p.goals || 0,
            assists: p.assists || 0,
            yellow: p.yellow || p.yellows || 0,
            red: p.red || p.reds || 0,
            minutes: p.minutes || 0,
            rating: p.ratingCount ? (p.ratingSum / p.ratingCount).toFixed(1) : (p.avgRating || "-")
          });
        });
      }
    });

    // Also show current players as current match stats if no aggregate exists
    if (!items.length && typeof players !== "undefined" && Array.isArray(players)) {
      players.forEach((p) => {
        items.push({
          source: "τρέχων αγώνας",
          name: p.name || "Παίκτης",
          matches: p.name ? 1 : 0,
          goals: p.goals || 0,
          assists: p.assists || 0,
          yellow: p.yellow || p.yellows || 0,
          red: p.red || p.reds || 0,
          minutes: p.minutes || 0,
          rating: p.rating || "-"
        });
      });
    }

    return items;
  }

  function extractMatchesHistory() {
    const matches = [];

    getPossibleAppStates().forEach(({ key, value }) => {
      if (Array.isArray(value.matchHistory)) {
        value.matchHistory.forEach((m) => matches.push({ source: key, ...m }));
      }
    });

    return matches;
  }

  function renderPlayers() {
    const box = q("historyContentV712");
    const playersHistory = extractPlayersHistory();

    if (!playersHistory.length) {
      box.innerHTML = '<div class="history-card-v712">Δεν υπάρχει ιστορικό παικτών.</div>';
      return;
    }

    box.innerHTML = playersHistory.map((p) => `
      <div class="history-card-v712">
        <b>${escapeHtmlV712(p.name)}</b>
        Αγώνες: ${p.matches} | Γκολ: ${p.goals} | Ασίστ: ${p.assists} | Λεπτά: ${p.minutes}<br>
        Κίτρινες: ${p.yellow} | Κόκκινες: ${p.red} | Μ.Ο.: ${p.rating}
      </div>
    `).join("");
  }

  function renderMatches() {
    const box = q("historyContentV712");
    const matches = extractMatchesHistory();

    if (!matches.length) {
      box.innerHTML = '<div class="history-card-v712">Δεν υπάρχει ιστορικό αγώνων.</div>';
      return;
    }

    box.innerHTML = matches.map((m) => {
      const title = `${m.homeTeam || m.home || "Ομάδα"} ${m.homeScore ?? 0}-${m.awayScore ?? 0} ${m.awayTeam || m.away || "Αντίπαλος"}`;
      const meta = [m.season, m.matchDay, m.matchDate || m.date || m.savedAt, m.formation].filter(Boolean).join(" • ");
      return `
        <div class="history-card-v712">
          <b>${escapeHtmlV712(title)}</b>
          ${escapeHtmlV712(meta || "Αποθηκευμένος αγώνας")}
        </div>
      `;
    }).join("");
  }

  function renderStorage() {
    const box = q("historyContentV712");
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (/history|football|coach|lineup|safe|v7|v8/i.test(key)) {
        keys.push(key);
      }
    }

    if (!keys.length) {
      box.innerHTML = '<div class="history-card-v712">Δεν βρέθηκαν αποθηκευμένα δεδομένα.</div>';
      return;
    }

    box.innerHTML = keys.map((key) => `
      <div class="history-card-v712">
        <b>${escapeHtmlV712(key)}</b>
        ${Math.round((localStorage.getItem(key) || "").length / 1024)} KB
      </div>
    `).join("");
  }

  function render() {
    ["tabPlayersV712", "tabMatchesV712", "tabStorageV712"].forEach((id) => q(id)?.classList.remove("active"));
    if (currentTabV712 === "players") {
      q("tabPlayersV712")?.classList.add("active");
      renderPlayers();
    } else if (currentTabV712 === "matches") {
      q("tabMatchesV712")?.classList.add("active");
      renderMatches();
    } else {
      q("tabStorageV712")?.classList.add("active");
      renderStorage();
    }
  }

  function escapeHtmlV712(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function clearPlayerHistory() {
    if (!confirm("Να σβηστεί μόνο το ιστορικό παικτών;")) return;

    getPossibleAppStates().forEach(({ key, value }) => {
      if (value.playerHistory) {
        value.playerHistory = {};
        setStorageObject(key, value);
      }
    });

    if (typeof playerHistory !== "undefined") {
      playerHistory = {};
    }

    if (typeof save === "function") save();
    render();
    alert("Το ιστορικό παικτών σβήστηκε.");
  }

  function clearMatchHistory() {
    if (!confirm("Να σβηστεί μόνο το ιστορικό αγώνων;")) return;

    getPossibleAppStates().forEach(({ key, value }) => {
      if (Array.isArray(value.matchHistory)) {
        value.matchHistory = [];
        setStorageObject(key, value);
      }
    });

    if (typeof matchHistory !== "undefined") {
      matchHistory = [];
    }

    if (typeof save === "function") save();
    render();
    alert("Το ιστορικό αγώνων σβήστηκε.");
  }

  function clearAllHistory() {
    if (!confirm("Να σβηστεί όλο το ιστορικό παικτών και αγώνων; Η τρέχουσα 11άδα θα μείνει.")) return;

    getPossibleAppStates().forEach(({ key, value }) => {
      if (value.playerHistory) value.playerHistory = {};
      if (Array.isArray(value.matchHistory)) value.matchHistory = [];
      setStorageObject(key, value);
    });

    if (typeof playerHistory !== "undefined") playerHistory = {};
    if (typeof matchHistory !== "undefined") matchHistory = [];

    if (typeof save === "function") save();
    render();
    alert("Όλο το ιστορικό σβήστηκε.");
  }

  function init() {
    q("openHistoryManagerV712")?.addEventListener("click", () => {
      currentTabV712 = "players";
      render();
      q("historyManagerDialogV712")?.showModal();
    });

    q("tabPlayersV712")?.addEventListener("click", () => {
      currentTabV712 = "players";
      render();
    });

    q("tabMatchesV712")?.addEventListener("click", () => {
      currentTabV712 = "matches";
      render();
    });

    q("tabStorageV712")?.addEventListener("click", () => {
      currentTabV712 = "storage";
      render();
    });

    q("clearPlayersHistoryV712")?.addEventListener("click", clearPlayerHistory);
    q("clearMatchesHistoryV712")?.addEventListener("click", clearMatchHistory);
    q("clearAllHistoryV712")?.addEventListener("click", clearAllHistory);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


/* ===== v7.2 quick player popup + stable player stats ===== */
(function () {
  let dragStartedV72 = false;
  let pointerMovedV72 = false;

  function q(id) {
    return document.getElementById(id);
  }

  function ensurePlayerFields(player, index) {
    if (!player) return;
    if (player.name === undefined) player.name = `Παίκτης ${index + 1}`;
    if (player.number === undefined) player.number = String(index + 1);
    if (player.goals === undefined) player.goals = 0;
    if (player.yellow === undefined) player.yellow = 0;
    if (player.red === undefined) player.red = 0;
    if (player.minutes === undefined) player.minutes = 0;
    if (player.rating === undefined) player.rating = "";
  }

  function getPlayerIndexFromElement(el) {
    if (!el) return -1;

    if (el.dataset && el.dataset.index !== undefined) {
      const d = Number(el.dataset.index);
      if (!Number.isNaN(d)) return d;
    }

    const playersEls = Array.from(document.querySelectorAll(".player"));
    return playersEls.indexOf(el);
  }

  function updateSummaryV72(name) {
    const box = q("quickPlayerSummaryV72");
    if (!box) return;

    let found = null;

    try {
      if (typeof playerHistory !== "undefined" && playerHistory) {
        const key = String(name || "").trim().toLowerCase();
        found = playerHistory[key] || Object.values(playerHistory).find((p) => String(p.name || "").trim().toLowerCase() === key);
      }
    } catch (err) {}

    if (found) {
      const avg = found.ratingCount ? (found.ratingSum / found.ratingCount).toFixed(1) : (found.avgRating || "-");
      box.innerHTML = `<b>Ιστορικό παίκτη</b><br>Αγώνες: ${found.matches || found.games || 0} | Γκολ: ${found.goals || 0}<br>Κίτρινες: ${found.yellow || found.yellows || 0} | Κόκκινες: ${found.red || found.reds || 0}<br>Λεπτά: ${found.minutes || 0} | Μ.Ο.: ${avg}`;
    } else {
      box.textContent = "Δεν υπάρχει ακόμα ιστορικό για αυτόν τον παίκτη.";
    }
  }

  function openQuickPlayerV72(index) {
    if (index < 0 || typeof players === "undefined" || !players[index]) return;

    ensurePlayerFields(players[index], index);
    const player = players[index];

    q("quickPlayerIndexV72").value = index;
    q("quickPlayerNameV72").value = player.name || "";
    q("quickPlayerNumberV72").value = player.number || "";
    q("quickPlayerGoalsV72").value = player.goals || 0;
    q("quickPlayerYellowV72").value = player.yellow || player.yellows || 0;
    q("quickPlayerRedV72").value = player.red || player.reds || 0;
    q("quickPlayerMinutesV72").value = player.minutes || 0;
    q("quickPlayerRatingV72").value = player.rating || "";

    updateSummaryV72(player.name);
    q("quickPlayerDialogV72")?.showModal();

    setTimeout(() => q("quickPlayerNameV72")?.focus(), 80);
  }

  function saveQuickPlayerV72() {
    const index = Number(q("quickPlayerIndexV72")?.value);
    if (Number.isNaN(index) || typeof players === "undefined" || !players[index]) return;

    ensurePlayerFields(players[index], index);
    const player = players[index];

    player.name = q("quickPlayerNameV72")?.value.trim() || "";
    player.number = q("quickPlayerNumberV72")?.value || "";
    player.goals = Number(q("quickPlayerGoalsV72")?.value || 0);
    player.yellow = Number(q("quickPlayerYellowV72")?.value || 0);
    player.red = Number(q("quickPlayerRedV72")?.value || 0);
    player.minutes = Number(q("quickPlayerMinutesV72")?.value || 0);
    player.rating = q("quickPlayerRatingV72")?.value || "";

    if (typeof render === "function") {
      render();
    } else if (typeof renderPitch === "function") {
      renderPitch();
      if (typeof save === "function") save();
    }
  }

  function decoratePlayersV72() {
    if (typeof players === "undefined") return;

    document.querySelectorAll(".player").forEach((el, index) => {
      const playerIndex = getPlayerIndexFromElement(el);
      const i = playerIndex >= 0 ? playerIndex : index;
      const player = players[i];
      if (!player) return;

      ensurePlayerFields(player, i);

      el.dataset.index = i;
      el.style.width = "";
      el.style.minWidth = "";
      el.style.maxWidth = "";

      // Add / update goal badge
      let badge = el.querySelector(".player-goal-badge-v72");
      if (player.goals > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "player-goal-badge-v72";
          el.appendChild(badge);
        }
        badge.textContent = `⚽${player.goals}`;
      } else if (badge) {
        badge.remove();
      }

      // Add / update card mark
      let card = el.querySelector(".player-card-v72");
      if ((player.yellow || 0) > 0 || (player.red || 0) > 0) {
        if (!card) {
          card = document.createElement("span");
          card.className = "player-card-v72";
          el.appendChild(card);
        }
        card.classList.toggle("player-card-yellow-v72", (player.yellow || 0) > 0 && (player.red || 0) === 0);
        card.classList.toggle("player-card-red-v72", (player.red || 0) > 0);
      } else if (card) {
        card.remove();
      }
    });
  }

  function attachPlayerClickHandlersV72() {
    document.addEventListener("pointerdown", (event) => {
      const player = event.target.closest && event.target.closest(".player");
      if (!player) return;
      dragStartedV72 = true;
      pointerMovedV72 = false;
    }, true);

    document.addEventListener("pointermove", (event) => {
      if (dragStartedV72) pointerMovedV72 = true;
    }, true);

    document.addEventListener("pointerup", () => {
      setTimeout(() => {
        dragStartedV72 = false;
        pointerMovedV72 = false;
      }, 120);
    }, true);

    document.addEventListener("click", (event) => {
      const player = event.target.closest && event.target.closest(".player");
      if (!player) return;

      // If user dragged, do not open popup
      if (pointerMovedV72) return;

      event.preventDefault();
      event.stopPropagation();

      const index = getPlayerIndexFromElement(player);
      openQuickPlayerV72(index);
    }, true);
  }

  function wrapRenderV72() {
    const oldRender = window.render;
    if (typeof oldRender === "function" && !window.__v72RenderWrapped) {
      window.render = function () {
        oldRender();
        decoratePlayersV72();
      };
      window.__v72RenderWrapped = true;
    }

    const oldRenderPitch = window.renderPitch;
    if (typeof oldRenderPitch === "function" && !window.__v72RenderPitchWrapped) {
      window.renderPitch = function () {
        oldRenderPitch();
        decoratePlayersV72();
      };
      window.__v72RenderPitchWrapped = true;
    }

    decoratePlayersV72();
  }

  function init() {
    q("quickPlayerNameV72")?.addEventListener("input", (event) => updateSummaryV72(event.target.value));
    q("quickSavePlayerV72")?.addEventListener("click", saveQuickPlayerV72);
    attachPlayerClickHandlersV72();
    wrapRenderV72();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
