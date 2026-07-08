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


/* ===== v7.3 player history + match save ===== */
(function () {
  const HISTORY_KEY_V73 = "footballCoachV73History";

  function q(id) { return document.getElementById(id); }
  function safeParse(value, fallback) { try { return JSON.parse(value); } catch (err) { return fallback; } }
  function loadHistoryV73() {
    const saved = safeParse(localStorage.getItem(HISTORY_KEY_V73), null);
    return saved && typeof saved === "object" ? { players: saved.players || {}, matches: Array.isArray(saved.matches) ? saved.matches : [] } : { players: {}, matches: [] };
  }
  function saveHistoryV73(history) { localStorage.setItem(HISTORY_KEY_V73, JSON.stringify(history)); }
  function playerKeyV73(name) { return String(name || "").trim().toLowerCase(); }
  function numV73(value) { const n = Number(value || 0); return Number.isFinite(n) ? n : 0; }

  function currentMatchDataV73() {
    const get = (id) => q(id)?.value || "";
    return {
      id: Date.now(),
      savedAt: new Date().toLocaleString("el-GR"),
      season: get("matchSeasonV71") || get("matchSeasonSafe") || "",
      matchType: get("matchTypeV71") || get("matchTypeSafe") || "",
      matchDay: get("matchDayV71") || get("matchDaySafe") || "",
      matchDate: get("matchDateV71") || get("matchDateSafe") || new Date().toLocaleDateString("el-GR"),
      homeTeam: get("homeTeam") || get("teamName") || "Η Ομάδα μου",
      awayTeam: get("awayTeam") || "Αντίπαλος",
      homeScore: get("homeScore") || 0,
      awayScore: get("awayScore") || 0,
      formation: typeof currentFormation !== "undefined" ? currentFormation : "",
      timerSeconds: typeof timerSeconds !== "undefined" ? timerSeconds : 0,
      notes: get("notes") || "",
      players: typeof players !== "undefined" ? JSON.parse(JSON.stringify(players)) : [],
      subs: typeof subs !== "undefined" ? JSON.parse(JSON.stringify(subs)) : []
    };
  }

  function updatePlayerTotalsV73(history, match) {
    match.players.forEach((player, index) => {
      const name = String(player?.name || `Παίκτης ${index + 1}`).trim();
      if (!name) return;
      const key = playerKeyV73(name);
      if (!history.players[key]) {
        history.players[key] = { name, number: String(player?.number || index + 1), matches: 0, goals: 0, assists: 0, yellow: 0, red: 0, minutes: 0, ratingSum: 0, ratingCount: 0 };
      }
      const item = history.players[key];
      item.name = name;
      item.number = String(player?.number || index + 1);
      item.matches += 1;
      item.goals += numV73(player?.goals);
      item.assists += numV73(player?.assists);
      item.yellow += numV73(player?.yellow || player?.yellows);
      item.red += numV73(player?.red || player?.reds);
      item.minutes += numV73(player?.minutes);
      if (player?.rating !== undefined && player.rating !== "") {
        item.ratingSum += numV73(player.rating);
        item.ratingCount += 1;
      }
    });
  }

  function saveCurrentMatchV73() {
    const history = loadHistoryV73();
    const match = currentMatchDataV73();
    history.matches.unshift(match);
    updatePlayerTotalsV73(history, match);
    saveHistoryV73(history);

    try {
      if (typeof matchHistory !== "undefined" && Array.isArray(matchHistory)) matchHistory.unshift(match);
      if (typeof playerHistory !== "undefined" && playerHistory) Object.assign(playerHistory, history.players);
      if (typeof save === "function") save();
    } catch (err) {}

    alert("Ο αγώνας αποθηκεύτηκε και ενημερώθηκαν τα στατιστικά παικτών.");
  }

  function escapeHtmlV73(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }
  function avgRatingV73(player) { return player.ratingCount ? (player.ratingSum / player.ratingCount).toFixed(1) : "-"; }

  function renderPlayerStatsV73() {
    const box = q("playerStatsListV73");
    if (!box) return;
    const history = loadHistoryV73();
    const list = Object.values(history.players).sort((a, b) => ((b.goals || 0) - (a.goals || 0)) || ((b.matches || 0) - (a.matches || 0)));
    if (!list.length) {
      box.innerHTML = '<div class="player-stat-card-v73">Δεν υπάρχουν ακόμα στατιστικά. Πάτησε «Αποθήκευση αγώνα» μετά από έναν αγώνα.</div>';
      return;
    }
    box.innerHTML = list.map((p) => `
      <div class="player-stat-card-v73">
        <b>${escapeHtmlV73(p.name)} ${p.number ? "(" + escapeHtmlV73(p.number) + ")" : ""}</b>
        <div class="player-stat-row-v73">
          <span>Αγώνες: ${p.matches || 0}</span>
          <span>Γκολ: ${p.goals || 0}</span>
          <span>Ασίστ: ${p.assists || 0}</span>
          <span>Λεπτά: ${p.minutes || 0}</span>
          <span>Κίτρινες: ${p.yellow || 0}</span>
          <span>Κόκκινες: ${p.red || 0}</span>
          <span>Μ.Ο.: ${avgRatingV73(p)}</span>
        </div>
      </div>
    `).join("");
  }

  function exportStatsV73() {
    const history = loadHistoryV73();
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "football-player-stats-v7-3.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function clearStatsV73() {
    if (!confirm("Να σβηστούν τα στατιστικά παικτών και οι αποθηκευμένοι αγώνες της v7.3;")) return;
    localStorage.removeItem(HISTORY_KEY_V73);
    renderPlayerStatsV73();
    alert("Τα στατιστικά σβήστηκαν.");
  }

  function init() {
    q("saveMatchV73")?.addEventListener("click", saveCurrentMatchV73);
    q("openPlayerStatsV73")?.addEventListener("click", () => { renderPlayerStatsV73(); q("playerStatsDialogV73")?.showModal(); });
    q("exportStatsV73")?.addEventListener("click", exportStatsV73);
    q("clearPlayerStatsV73")?.addEventListener("click", clearStatsV73);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();


/* ===== v7.3 attendance - button/modal only ===== */
(function () {
  const ATT_KEY_V73 = "footballCoachV73Attendance";

  function q(id) { return document.getElementById(id); }

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (err) { return fallback; }
  }

  function loadAttendanceV73() {
    return safeParse(localStorage.getItem(ATT_KEY_V73), {}) || {};
  }

  function saveAttendanceV73(data) {
    localStorage.setItem(ATT_KEY_V73, JSON.stringify(data));
  }

  function monthKeyV73() {
    const y = q("attendanceYearV73")?.value || new Date().getFullYear();
    const m = String(Number(q("attendanceMonthV73")?.value || 0) + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  function daysInMonthV73() {
    const y = Number(q("attendanceYearV73")?.value || new Date().getFullYear());
    const m = Number(q("attendanceMonthV73")?.value || 0);
    return new Date(y, m + 1, 0).getDate();
  }

  function currentNamesV73() {
    const names = [];
    try {
      if (typeof players !== "undefined" && Array.isArray(players)) {
        players.forEach((p) => {
          const name = String(p?.name || "").trim();
          if (name) names.push(name);
        });
      }
      if (typeof subs !== "undefined" && Array.isArray(subs)) {
        subs.forEach((s) => {
          const name = String(s || "").trim();
          if (name) names.push(name);
        });
      }
    } catch (err) {}
    return [...new Set(names)];
  }

  function ensureMonthV73(syncCurrentPlayers = true) {
    const all = loadAttendanceV73();
    const key = monthKeyV73();

    if (!all[key]) all[key] = { players: [], data: {} };

    if (syncCurrentPlayers) {
      currentNamesV73().forEach((name) => {
        if (!all[key].players.includes(name)) all[key].players.push(name);
      });
    }

    saveAttendanceV73(all);
    return all[key];
  }

  function escapeHtmlV73(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function renderSummaryV73(monthData) {
    let present = 0;
    let absent = 0;

    Object.values(monthData.data || {}).forEach((v) => {
      if (v === "✓") present++;
      if (v === "Χ") absent++;
    });

    const box = q("attendanceSummaryV73");
    if (box) box.textContent = `Παρουσίες: ${present} | Απουσίες: ${absent} | Παίκτες: ${monthData.players.length}`;
  }

  function renderAttendanceV73(syncCurrentPlayers = true) {
    const table = q("attendanceTableV73");
    if (!table) return;

    const all = loadAttendanceV73();
    const key = monthKeyV73();

    let monthData = ensureMonthV73(syncCurrentPlayers);
    const latestAll = loadAttendanceV73();
    monthData = latestAll[key] || monthData;

    const days = daysInMonthV73();

    let html = "<tr><th>Παίκτης</th>";
    for (let d = 1; d <= days; d++) html += `<th>${d}</th>`;
    html += "</tr>";

    monthData.players.forEach((name) => {
      html += `<tr><td>${escapeHtmlV73(name)}</td>`;
      for (let d = 1; d <= days; d++) {
        const cellKey = `${name}|${d}`;
        const value = monthData.data[cellKey] || "";
        const cls = value === "✓" ? "att-present-v73" : value === "Χ" ? "att-absent-v73" : "";
        html += `<td class="att-cell-v73 ${cls}" data-name="${escapeHtmlV73(name)}" data-day="${d}">${value}</td>`;
      }
      html += "</tr>";
    });

    table.innerHTML = html;

    table.querySelectorAll(".att-cell-v73").forEach((td) => {
      td.addEventListener("click", () => {
        const allNow = loadAttendanceV73();
        if (!allNow[key]) allNow[key] = { players: [], data: {} };

        const cellKey = `${td.dataset.name}|${td.dataset.day}`;
        const current = allNow[key].data[cellKey] || "";
        allNow[key].data[cellKey] = current === "" ? "✓" : current === "✓" ? "Χ" : "";

        saveAttendanceV73(allNow);
        renderAttendanceV73(false);
      });
    });

    renderSummaryV73(monthData);
  }

  function setupMonthSelectV73() {
    const monthSelect = q("attendanceMonthV73");
    const yearInput = q("attendanceYearV73");
    if (!monthSelect || !yearInput || monthSelect.dataset.ready === "1") return;

    const labels = ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μάι", "Ιουν", "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"];
    labels.forEach((label, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = label;
      monthSelect.appendChild(option);
    });

    const now = new Date();
    monthSelect.value = now.getMonth();
    yearInput.value = now.getFullYear();
    monthSelect.dataset.ready = "1";
  }

  function openAttendanceV73() {
    setupMonthSelectV73();
    renderAttendanceV73(true);
    q("attendanceDialogV73")?.showModal();
  }

  function addPlayerV73() {
    const name = prompt("Όνομα παίκτη:");
    if (!name || !name.trim()) return;

    const all = loadAttendanceV73();
    const key = monthKeyV73();
    if (!all[key]) all[key] = { players: [], data: {} };

    const clean = name.trim();
    if (!all[key].players.includes(clean)) all[key].players.push(clean);

    saveAttendanceV73(all);
    renderAttendanceV73(false);
  }

  function syncPlayersV73() {
    ensureMonthV73(true);
    renderAttendanceV73(false);
  }

  function clearMonthV73() {
    if (!confirm("Να καθαριστεί το παρουσιολόγιο αυτού του μήνα;")) return;

    const all = loadAttendanceV73();
    const key = monthKeyV73();
    delete all[key];

    saveAttendanceV73(all);
    renderAttendanceV73(true);
  }

  function init() {
    q("openAttendanceV73")?.addEventListener("click", openAttendanceV73);
    q("buildAttendanceV73")?.addEventListener("click", () => renderAttendanceV73(true));
    q("addAttendancePlayerV73")?.addEventListener("click", addPlayerV73);
    q("syncAttendancePlayersV73")?.addEventListener("click", syncPlayersV73);
    q("clearAttendanceMonthV73")?.addEventListener("click", clearMonthV73);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


/* ===== v7.4 roster + match squad ===== */
(function () {
  const ROSTER_KEY_V74 = "footballCoachV74Roster";

  function q(id) { return document.getElementById(id); }
  function safeParse(value, fallback) { try { return JSON.parse(value); } catch (err) { return fallback; } }

  function loadRosterV74() {
    const data = safeParse(localStorage.getItem(ROSTER_KEY_V74), null);
    if (data && typeof data === "object") {
      return {
        roster: Array.isArray(data.roster) ? data.roster : [],
        squad: Array.isArray(data.squad) ? data.squad : []
      };
    }
    return { roster: [], squad: [] };
  }

  function saveRosterV74(data) {
    localStorage.setItem(ROSTER_KEY_V74, JSON.stringify(data));
  }

  function newRosterPlayerV74(name = "") {
    return {
      id: Date.now() + Math.floor(Math.random() * 100000),
      name: name || "",
      number: "",
      positions: "",
      foot: "right",
      minutes: 0,
      goals: 0,
      yellow: 0,
      red: 0
    };
  }

  function escapeHtmlV74(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
  }

  function selectedSquadPlayersV74() {
    const data = loadRosterV74();
    return data.squad.map((id) => data.roster.find((p) => String(p.id) === String(id))).filter(Boolean);
  }

  function syncRosterFromLineupV74() {
    const data = loadRosterV74();
    const existing = new Set(data.roster.map((p) => String(p.name || "").trim().toLowerCase()));

    try {
      if (typeof players !== "undefined" && Array.isArray(players)) {
        players.forEach((p, index) => {
          const name = String(p?.name || "").trim();
          if (!name) return;
          const key = name.toLowerCase();
          if (!existing.has(key)) {
            data.roster.push({
              ...newRosterPlayerV74(name),
              number: String(p?.number || index + 1),
              minutes: Number(p?.minutes || 0),
              goals: Number(p?.goals || 0),
              yellow: Number(p?.yellow || p?.yellows || 0),
              red: Number(p?.red || p?.reds || 0)
            });
            existing.add(key);
          }
        });
      }
    } catch (err) {}

    saveRosterV74(data);
    renderRosterV74();
  }

  function applySquadToLineupV74() {
    const squad = selectedSquadPlayersV74();
    if (!squad.length) {
      alert("Δεν έχεις επιλέξει παίκτες στην αποστολή.");
      return;
    }

    try {
      if (typeof players !== "undefined" && Array.isArray(players)) {
        for (let i = 0; i < players.length; i++) {
          const rp = squad[i];
          if (rp) {
            players[i].name = rp.name || `Παίκτης ${i + 1}`;
            players[i].number = rp.number || String(i + 1);
            players[i].minutes = Number(rp.minutes || 0);
            players[i].goals = Number(rp.goals || 0);
            players[i].yellow = Number(rp.yellow || 0);
            players[i].red = Number(rp.red || 0);
          } else {
            players[i].name = "";
            players[i].number = "";
            players[i].minutes = 0;
            players[i].goals = 0;
            players[i].yellow = 0;
            players[i].red = 0;
          }
        }
      }

      if (typeof subs !== "undefined" && Array.isArray(subs)) {
        subs.length = 0;
        squad.slice(11).forEach((rp) => subs.push(rp.name || ""));
      }

      if (typeof render === "function") render();
      else {
        if (typeof renderPitch === "function") renderPitch();
        if (typeof renderPlayerInputs === "function") renderPlayerInputs();
        if (typeof renderSubs === "function") renderSubs();
        if (typeof save === "function") save();
      }

      alert("Η αποστολή πέρασε αριστερά: πρώτοι 11 στην 11άδα και οι υπόλοιποι αναπληρωματικοί.");
    } catch (err) {
      alert("Δεν μπόρεσα να περάσω την αποστολή.");
    }
  }

  function renderSquadPreviewV74() {
    const box = q("squadPreviewV74");
    if (!box) return;

    const squad = selectedSquadPlayersV74();
    if (!squad.length) {
      box.innerHTML = '<span class="squad-pill-v74">Δεν έχεις επιλέξει αποστολή.</span>';
      return;
    }

    box.innerHTML = squad.map((p, index) => {
      const role = index < 11 ? "11άδα" : "Πάγκος";
      return `<span class="squad-pill-v74">${index + 1}. ${escapeHtmlV74(p.name)} • ${role}${p.positions ? " • " + escapeHtmlV74(p.positions) : ""}</span>`;
    }).join("");
  }

  function renderRosterV74() {
    const table = q("rosterTableV74");
    if (!table) return;
    const data = loadRosterV74();

    let html = `
      <tr>
        <th>Αποστολή</th>
        <th>Ονοματεπώνυμο</th>
        <th>Νο.</th>
        <th>Θέσεις</th>
        <th>Πόδι</th>
        <th>Λεπτά</th>
        <th>Γκολ</th>
        <th>Κίτρινες</th>
        <th>Κόκκινες</th>
        <th>Διαγραφή</th>
      </tr>
    `;

    data.roster.forEach((p, index) => {
      const checked = data.squad.includes(p.id) ? "checked" : "";
      html += `
        <tr data-id="${p.id}">
          <td><input type="checkbox" class="roster-squad-v74" ${checked}></td>
          <td><input class="roster-name-v74" data-field="name" value="${escapeHtmlV74(p.name)}"></td>
          <td><input class="roster-small-v74" data-field="number" value="${escapeHtmlV74(p.number)}"></td>
          <td><input class="roster-positions-v74" data-field="positions" value="${escapeHtmlV74(p.positions)}" placeholder="CM, ST"></td>
          <td>
            <select data-field="foot">
              <option value="right" ${p.foot === "right" ? "selected" : ""}>Δεξί</option>
              <option value="left" ${p.foot === "left" ? "selected" : ""}>Αριστερό</option>
              <option value="both" ${p.foot === "both" ? "selected" : ""}>Και τα δύο</option>
            </select>
          </td>
          <td><input class="roster-small-v74" type="number" min="0" data-field="minutes" value="${Number(p.minutes || 0)}"></td>
          <td><input class="roster-small-v74" type="number" min="0" data-field="goals" value="${Number(p.goals || 0)}"></td>
          <td><input class="roster-small-v74" type="number" min="0" data-field="yellow" value="${Number(p.yellow || 0)}"></td>
          <td><input class="roster-small-v74" type="number" min="0" data-field="red" value="${Number(p.red || 0)}"></td>
          <td><button type="button" class="roster-delete-v74" data-index="${index}">×</button></td>
        </tr>
      `;
    });

    table.innerHTML = html;

    table.querySelectorAll("input[data-field], select[data-field]").forEach((input) => {
      input.addEventListener("input", updateRosterFromTableV74);
      input.addEventListener("change", updateRosterFromTableV74);
    });

    table.querySelectorAll(".roster-squad-v74").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        updateRosterFromTableV74();
        renderSquadPreviewV74();
      });
    });

    table.querySelectorAll(".roster-delete-v74").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dataNow = loadRosterV74();
        const index = Number(btn.dataset.index);
        const removed = dataNow.roster[index];
        if (!removed) return;
        if (!confirm(`Να διαγραφεί ο παίκτης ${removed.name || ""};`)) return;
        dataNow.roster.splice(index, 1);
        dataNow.squad = dataNow.squad.filter((id) => String(id) !== String(removed.id));
        saveRosterV74(dataNow);
        renderRosterV74();
      });
    });

    renderSquadPreviewV74();
  }

  function updateRosterFromTableV74() {
    const data = loadRosterV74();
    const rows = Array.from(document.querySelectorAll("#rosterTableV74 tr[data-id]"));
    const nextSquad = [];

    rows.forEach((row) => {
      const id = Number(row.dataset.id);
      const player = data.roster.find((p) => Number(p.id) === id);
      if (!player) return;

      row.querySelectorAll("input[data-field], select[data-field]").forEach((input) => {
        const field = input.dataset.field;
        if (["minutes", "goals", "yellow", "red"].includes(field)) player[field] = Number(input.value || 0);
        else player[field] = input.value;
      });

      if (row.querySelector(".roster-squad-v74")?.checked) nextSquad.push(player.id);
    });

    data.squad = nextSquad;
    saveRosterV74(data);
    renderSquadPreviewV74();
  }

  function addRosterPlayerV74() {
    const data = loadRosterV74();
    data.roster.push(newRosterPlayerV74(""));
    saveRosterV74(data);
    renderRosterV74();
  }

  function clearSquadV74() {
    if (!confirm("Να καθαριστεί η επιλεγμένη αποστολή;")) return;
    const data = loadRosterV74();
    data.squad = [];
    saveRosterV74(data);
    renderRosterV74();
  }

  function fillSquadSelectV74() {
    const select = q("assignFromSquadV74");
    if (!select) return;

    const squad = selectedSquadPlayersV74();
    select.innerHTML = '<option value="">-- διάλεξε παίκτη --</option>' + squad.map((p, index) =>
      `<option value="${p.id}">${index + 1}. ${escapeHtmlV74(p.name)}${p.positions ? " • " + escapeHtmlV74(p.positions) : ""}</option>`
    ).join("");
  }

  function assignSelectedToQuickPlayerV74(id) {
    const player = selectedSquadPlayersV74().find((p) => String(p.id) === String(id));
    if (!player) return;
    if (q("quickPlayerNameV72")) q("quickPlayerNameV72").value = player.name || "";
    if (q("quickPlayerNumberV72")) q("quickPlayerNumberV72").value = player.number || "";
    if (q("quickPlayerGoalsV72")) q("quickPlayerGoalsV72").value = Number(player.goals || 0);
    if (q("quickPlayerYellowV72")) q("quickPlayerYellowV72").value = Number(player.yellow || 0);
    if (q("quickPlayerRedV72")) q("quickPlayerRedV72").value = Number(player.red || 0);
    if (q("quickPlayerMinutesV72")) q("quickPlayerMinutesV72").value = Number(player.minutes || 0);
  }

  function init() {
    q("openRosterV74")?.addEventListener("click", () => {
      renderRosterV74();
      q("rosterDialogV74")?.showModal();
    });

    q("addRosterPlayerV74")?.addEventListener("click", addRosterPlayerV74);
    q("syncRosterFromLineupV74")?.addEventListener("click", syncRosterFromLineupV74);
    q("applySquadToLineupV74")?.addEventListener("click", applySquadToLineupV74);
    q("clearSquadV74")?.addEventListener("click", clearSquadV74);

    q("assignFromSquadV74")?.addEventListener("focus", fillSquadSelectV74);
    q("assignFromSquadV74")?.addEventListener("click", fillSquadSelectV74);
    q("assignFromSquadV74")?.addEventListener("change", (e) => assignSelectedToQuickPlayerV74(e.target.value));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();


/* ===== v7.4.1 explicit roster save fix ===== */
(function () {
  const ROSTER_KEY_V74 = "footballCoachV74Roster";

  function q(id) {
    return document.getElementById(id);
  }

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (err) {
      return fallback;
    }
  }

  function loadData() {
    const data = safeParse(localStorage.getItem(ROSTER_KEY_V74), null);
    return data && typeof data === "object"
      ? { roster: Array.isArray(data.roster) ? data.roster : [], squad: Array.isArray(data.squad) ? data.squad : [] }
      : { roster: [], squad: [] };
  }

  function saveData(data) {
    localStorage.setItem(ROSTER_KEY_V74, JSON.stringify(data));
  }

  function status(message) {
    const box = q("rosterSaveStatusV741");
    if (!box) return;
    box.textContent = message;
    setTimeout(() => {
      if (box.textContent === message) box.textContent = "";
    }, 2500);
  }

  function ensureRowsHaveIds(data, rows) {
    rows.forEach((row, index) => {
      if (!row.dataset.id || row.dataset.id === "undefined") {
        if (!data.roster[index]) {
          data.roster[index] = {
            id: Date.now() + index + Math.floor(Math.random() * 10000),
            name: "",
            number: "",
            positions: "",
            foot: "right",
            minutes: 0,
            goals: 0,
            yellow: 0,
            red: 0
          };
        }
        row.dataset.id = data.roster[index].id;
      }
    });
  }

  function saveRosterFromTableV741() {
    const table = q("rosterTableV74");
    if (!table) return;

    const oldData = loadData();
    const rows = Array.from(table.querySelectorAll("tr[data-id]"));
    ensureRowsHaveIds(oldData, rows);

    const roster = [];
    const squad = [];

    rows.forEach((row, index) => {
      const existing = oldData.roster.find((p) => String(p.id) === String(row.dataset.id)) || {};
      const player = {
        id: existing.id || Number(row.dataset.id) || Date.now() + index,
        name: "",
        number: "",
        positions: "",
        foot: "right",
        minutes: 0,
        goals: 0,
        yellow: 0,
        red: 0
      };

      row.querySelectorAll("input[data-field], select[data-field]").forEach((input) => {
        const field = input.dataset.field;
        if (["minutes", "goals", "yellow", "red"].includes(field)) {
          player[field] = Number(input.value || 0);
        } else {
          player[field] = input.value || "";
        }
      });

      roster.push(player);

      if (row.querySelector(".roster-squad-v74")?.checked) {
        squad.push(player.id);
      }
    });

    saveData({ roster, squad });

    // If original preview/render functions exist, update preview without rebuilding table
    try {
      if (typeof renderSquadPreviewV74 === "function") renderSquadPreviewV74();
    } catch (err) {}

    status("Το ρόστερ αποθηκεύτηκε.");
  }

  function autosaveOnBlur() {
    const table = q("rosterTableV74");
    if (!table || table.dataset.v741Ready === "1") return;
    table.dataset.v741Ready = "1";

    table.addEventListener("change", saveRosterFromTableV741, true);
    table.addEventListener("blur", (event) => {
      if (event.target && event.target.matches("input[data-field], select[data-field], .roster-squad-v74")) {
        saveRosterFromTableV741();
      }
    }, true);
  }

  function init() {
    q("saveRosterV741")?.addEventListener("click", saveRosterFromTableV741);

    q("openRosterV74")?.addEventListener("click", () => {
      setTimeout(autosaveOnBlur, 300);
    });

    // Also keep checking because table is generated dynamically
    setInterval(autosaveOnBlur, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


/* ===== v7.5 rounds + manual match time ===== */
(function () {
  const ROUNDS_KEY_V75 = "footballCoachV75Rounds";
  const MANUAL_TIME_KEY_V75 = "footballCoachV75ManualTime";

  function q(id) { return document.getElementById(id); }
  function safeParse(value, fallback) { try { return JSON.parse(value); } catch (err) { return fallback; } }
  function loadRoundsV75() { return safeParse(localStorage.getItem(ROUNDS_KEY_V75), []) || []; }
  function saveRoundsV75(rounds) { localStorage.setItem(ROUNDS_KEY_V75, JSON.stringify(rounds)); }
  function escapeHtmlV75(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function saveManualTimeV75() {
    localStorage.setItem(MANUAL_TIME_KEY_V75, q("manualMatchTimeV75")?.value || "");
  }

  function loadManualTimeV75() {
    const value = localStorage.getItem(MANUAL_TIME_KEY_V75) || "";
    if (q("manualMatchTimeV75")) q("manualMatchTimeV75").value = value;
  }

  function parseManualSecondsV75(value) {
    const text = String(value || "").trim();
    if (!text) return null;

    if (/^\d+$/.test(text)) return Number(text) * 60;

    const parts = text.split(":").map(Number);
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      return parts[0] * 60 + parts[1];
    }

    return null;
  }

  function formatTimeV75(seconds) {
    const s = Math.max(0, Number(seconds || 0));
    const m = Math.floor(s / 60);
    const rest = s % 60;
    return `${String(m).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }

  function getManualTimeSecondsV75() {
    return parseManualSecondsV75(q("manualMatchTimeV75")?.value || "");
  }

  function applyManualTimeBeforeSaveV75() {
    const manual = getManualTimeSecondsV75();
    if (manual === null) return;

    try {
      if (typeof timerSeconds !== "undefined") timerSeconds = manual;
      if (typeof renderTimer === "function") renderTimer();
      if (typeof save === "function") save();
    } catch (err) {}
  }

  function renderRoundsV75() {
    const box = q("roundsListV75");
    if (!box) return;

    const rounds = loadRoundsV75();
    if (!rounds.length) {
      box.innerHTML = '<div class="round-card-v75">Δεν έχεις προσθέσει ακόμα αγωνιστικές.</div>';
      return;
    }

    box.innerHTML = rounds.map((round, index) => `
      <div class="round-card-v75">
        <b>${escapeHtmlV75(round.name || "Αγωνιστική")}</b>
        ${round.date ? "Ημερομηνία: " + escapeHtmlV75(round.date) + "<br>" : ""}
        ${round.opponent ? "Αντίπαλος: " + escapeHtmlV75(round.opponent) : ""}
        <div class="round-card-actions-v75">
          <button type="button" data-action="select" data-index="${index}">Επιλογή</button>
          <button type="button" data-action="delete" data-index="${index}">Διαγραφή</button>
        </div>
      </div>
    `).join("");

    box.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        if (btn.dataset.action === "select") selectRoundV75(index);
        if (btn.dataset.action === "delete") deleteRoundV75(index);
      });
    });
  }

  function addRoundV75() {
    const name = q("roundNameV75")?.value.trim() || "";
    const date = q("roundDateV75")?.value || "";
    const opponent = q("roundOpponentV75")?.value.trim() || "";

    if (!name && !date && !opponent) {
      alert("Γράψε τουλάχιστον αγωνιστική, ημερομηνία ή αντίπαλο.");
      return;
    }

    const rounds = loadRoundsV75();
    rounds.push({ id: Date.now(), name, date, opponent });
    saveRoundsV75(rounds);

    if (q("roundNameV75")) q("roundNameV75").value = "";
    if (q("roundDateV75")) q("roundDateV75").value = "";
    if (q("roundOpponentV75")) q("roundOpponentV75").value = "";

    renderRoundsV75();
  }

  function selectRoundV75(index) {
    const round = loadRoundsV75()[index];
    if (!round) return;

    const day = q("matchDayV71") || q("matchDaySafe") || q("matchDay");
    const date = q("matchDateV71") || q("matchDateSafe") || q("matchDate");
    const opponent = q("awayTeam");

    if (day && round.name) day.value = round.name;
    if (date && round.date) date.value = round.date;
    if (opponent && round.opponent) opponent.value = round.opponent;

    ["input", "change"].forEach((eventName) => {
      day?.dispatchEvent(new Event(eventName, { bubbles: true }));
      date?.dispatchEvent(new Event(eventName, { bubbles: true }));
      opponent?.dispatchEvent(new Event(eventName, { bubbles: true }));
    });

    if (typeof render === "function") {
      try { render(); } catch (err) {}
    }

    alert("Η αγωνιστική επιλέχθηκε.");
  }

  function deleteRoundV75(index) {
    const rounds = loadRoundsV75();
    const round = rounds[index];
    if (!round) return;
    if (!confirm(`Να διαγραφεί η αγωνιστική "${round.name || round.opponent || ""}";`)) return;
    rounds.splice(index, 1);
    saveRoundsV75(rounds);
    renderRoundsV75();
  }

  function openRoundsV75() {
    renderRoundsV75();
    q("roundsDialogV75")?.showModal();
  }

  function wrapSaveMatchV75() {
    const saveButton = q("saveMatchV73");
    if (saveButton && saveButton.dataset.v75Wrapped !== "1") {
      saveButton.dataset.v75Wrapped = "1";
      saveButton.addEventListener("click", applyManualTimeBeforeSaveV75, true);
    }
  }

  function init() {
    loadManualTimeV75();

    q("manualMatchTimeV75")?.addEventListener("input", saveManualTimeV75);
    q("manualMatchTimeV75")?.addEventListener("change", saveManualTimeV75);

    q("openRoundsV75")?.addEventListener("click", openRoundsV75);
    q("addRoundV75")?.addEventListener("click", addRoundV75);

    wrapSaveMatchV75();

    // Also expose helper for future code
    window.getManualMatchTimeV75 = function () {
      const manual = getManualTimeSecondsV75();
      return manual === null ? null : { seconds: manual, text: formatTimeV75(manual) };
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();


/* ===== v7.5.1 robust save/load + backup/restore ===== */
(function () {
  const ROBUST_KEY = "footballCoachV751RobustState";
  let saveTimer = null;

  function q(id) { return document.getElementById(id); }

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (err) { return fallback; }
  }

  function allLocalStorage() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      out[key] = localStorage.getItem(key);
    }
    return out;
  }

  function readFormValue(id) {
    const el = q(id);
    return el ? el.value : "";
  }

  function setFormValue(id, value) {
    const el = q(id);
    if (el && value !== undefined && value !== null) el.value = value;
  }

  function collectRobustState() {
    return {
      version: "7.5.1",
      savedAt: new Date().toISOString(),
      currentFormation: typeof currentFormation !== "undefined" ? currentFormation : "",
      players: typeof players !== "undefined" ? players : [],
      subs: typeof subs !== "undefined" ? subs : [],
      lines: typeof lines !== "undefined" ? lines : [],
      timerSeconds: typeof timerSeconds !== "undefined" ? timerSeconds : 0,
      teamName: readFormValue("teamName"),
      homeTeam: readFormValue("homeTeam"),
      awayTeam: readFormValue("awayTeam"),
      homeScore: readFormValue("homeScore"),
      awayScore: readFormValue("awayScore"),
      notes: readFormValue("notes"),
      matchSeasonV71: readFormValue("matchSeasonV71"),
      matchTypeV71: readFormValue("matchTypeV71"),
      matchDayV71: readFormValue("matchDayV71"),
      matchDateV71: readFormValue("matchDateV71"),
      manualMatchTimeV75: readFormValue("manualMatchTimeV75"),
      logo: q("headerLogo")?.src || q("teamLogoPreview")?.src || "",
      localStorage: allLocalStorage()
    };
  }

  function showSaved() {
    let box = q("saveStatusV751");
    if (!box) {
      box = document.createElement("div");
      box.id = "saveStatusV751";
      box.className = "save-status-v751";
      box.textContent = "Αποθηκεύτηκε";
      document.body.appendChild(box);
    }
    box.classList.add("show");
    setTimeout(function(){ box.classList.remove("show"); }, 900);
  }

  function robustSave(show) {
    try {
      localStorage.setItem(ROBUST_KEY, JSON.stringify(collectRobustState()));
      try { if (typeof save === "function") save(); } catch (err) {}
      if (show) showSaved();
      return true;
    } catch (err) {
      alert("Δεν μπόρεσα να αποθηκεύσω. Αν είσαι σε Ιδιωτική περιήγηση, βγες από αυτή. Αν έχεις μεγάλο σήμα ομάδας, βάλε μικρότερη εικόνα.");
      return false;
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){ robustSave(false); }, 250);
  }

  function applyRobustState(state) {
    if (!state || typeof state !== "object") return;

    try {
      if (typeof currentFormation !== "undefined" && state.currentFormation) currentFormation = state.currentFormation;
      if (typeof players !== "undefined" && Array.isArray(state.players) && state.players.length) players = state.players;
      if (typeof subs !== "undefined" && Array.isArray(state.subs)) subs = state.subs;
      if (typeof lines !== "undefined" && Array.isArray(state.lines)) lines = state.lines;
      if (typeof timerSeconds !== "undefined") timerSeconds = Number(state.timerSeconds || 0);
    } catch (err) {}

    setFormValue("teamName", state.teamName);
    setFormValue("homeTeam", state.homeTeam);
    setFormValue("awayTeam", state.awayTeam);
    setFormValue("homeScore", state.homeScore);
    setFormValue("awayScore", state.awayScore);
    setFormValue("notes", state.notes);
    setFormValue("matchSeasonV71", state.matchSeasonV71);
    setFormValue("matchTypeV71", state.matchTypeV71);
    setFormValue("matchDayV71", state.matchDayV71);
    setFormValue("matchDateV71", state.matchDateV71);
    setFormValue("manualMatchTimeV75", state.manualMatchTimeV75);

    if (state.logo && state.logo.startsWith("data:")) {
      if (q("headerLogo")) {
        q("headerLogo").src = state.logo;
        q("headerLogo").style.display = "block";
      }
      if (q("teamLogoPreview")) q("teamLogoPreview").src = state.logo;
    }

    try {
      if (q("formation") && state.currentFormation) q("formation").value = state.currentFormation;
      if (typeof render === "function") render();
      else {
        if (typeof renderPitch === "function") renderPitch();
        if (typeof renderPlayerInputs === "function") renderPlayerInputs();
        if (typeof renderSubs === "function") renderSubs();
        if (typeof renderTimer === "function") renderTimer();
      }
    } catch (err) {}
  }

  function robustLoad() {
    const state = safeParse(localStorage.getItem(ROBUST_KEY), null);
    if (state) applyRobustState(state);
  }

  function backupAll() {
    robustSave(false);
    const payload = collectRobustState();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "football-coach-backup-v7-5-1.json";
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
  }

  function restoreAll(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const payload = JSON.parse(reader.result);
        if (payload.localStorage) {
          Object.keys(payload.localStorage).forEach(function(key) {
            localStorage.setItem(key, payload.localStorage[key]);
          });
        }
        localStorage.setItem(ROBUST_KEY, JSON.stringify(payload));
        alert("Το restore ολοκληρώθηκε. Η σελίδα θα ανανεωθεί.");
        location.reload();
      } catch (err) {
        alert("Δεν είναι σωστό αρχείο backup.");
      }
    };
    reader.readAsText(file);
  }

  function wireLogoSave() {
    const input = q("teamLogo");
    if (!input || input.dataset.v751Ready === "1") return;
    input.dataset.v751Ready = "1";
    input.addEventListener("change", function() {
      setTimeout(function(){ robustSave(true); }, 700);
      setTimeout(function(){ robustSave(false); }, 1600);
    });
  }

  function wireAutoSave() {
    document.addEventListener("input", scheduleSave, true);
    document.addEventListener("change", scheduleSave, true);
    document.addEventListener("click", function(){ setTimeout(scheduleSave, 300); }, true);
    window.addEventListener("beforeunload", function(){ robustSave(false); });
    document.addEventListener("visibilitychange", function(){
      if (document.visibilityState === "hidden") robustSave(false);
    });
    setInterval(function(){ robustSave(false); }, 5000);
    wireLogoSave();
    setInterval(wireLogoSave, 1500);
  }

  function wrapRender() {
    const oldRender = window.render;
    if (typeof oldRender === "function" && !window.__v751RenderWrapped) {
      window.render = function () {
        oldRender();
        scheduleSave();
      };
      window.__v751RenderWrapped = true;
    }
  }

  function init() {
    robustLoad();
    wireAutoSave();
    wrapRender();
    q("backupAllV751")?.addEventListener("click", backupAll);
    q("restoreAllV751")?.addEventListener("change", restoreAll);
    setTimeout(function(){ robustSave(false); }, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.footballCoachSaveNow = function(){ return robustSave(true); };
})();


/* ===== v7.5.2 logo compression + manual save button ===== */
(function () {
  const ROBUST_KEY = "footballCoachV751RobustState";
  const MAX_LOGO_SIZE = 320;
  const JPEG_QUALITY = 0.72;

  function q(id) { return document.getElementById(id); }

  function showMessage(text, warning) {
    let box = document.getElementById("logoStatusV752");
    const input = q("teamLogo");
    if (!box) {
      box = document.createElement("div");
      box.id = "logoStatusV752";
      box.className = "logo-status-v752";
      if (input && input.parentNode) input.parentNode.appendChild(box);
    }
    box.textContent = text;
    box.classList.toggle("logo-warning-v752", !!warning);
  }

  function saveNowV752() {
    try {
      if (typeof window.footballCoachSaveNow === "function") {
        window.footballCoachSaveNow();
        return;
      }
      if (typeof save === "function") save();
      alert("Αποθηκεύτηκε.");
    } catch (err) {
      alert("Δεν μπόρεσα να αποθηκεύσω.");
    }
  }

  function dataUrlSizeKb(dataUrl) {
    return Math.round((String(dataUrl || "").length * 0.75) / 1024);
  }

  function resizeImageFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () {
        const scale = Math.min(1, MAX_LOGO_SIZE / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let output = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        if (dataUrlSizeKb(output) > 250) output = canvas.toDataURL("image/jpeg", 0.55);
        if (dataUrlSizeKb(output) > 350) {
          const smallCanvas = document.createElement("canvas");
          smallCanvas.width = 220;
          smallCanvas.height = 220;
          const smallCtx = smallCanvas.getContext("2d");
          smallCtx.drawImage(img, 0, 0, 220, 220);
          output = smallCanvas.toDataURL("image/jpeg", 0.5);
        }
        callback(output);
      };
      img.onerror = function () { callback(reader.result); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function forceSmallLogoInRobustState(dataUrl) {
    try {
      const state = JSON.parse(localStorage.getItem(ROBUST_KEY) || "{}");
      state.logo = dataUrl;
      localStorage.setItem(ROBUST_KEY, JSON.stringify(state));
    } catch (err) {}
  }

  function applyLogo(dataUrl) {
    const preview = q("teamLogoPreview");
    const header = q("headerLogo");
    if (preview) preview.src = dataUrl;
    if (header) {
      header.src = dataUrl;
      header.style.display = "block";
    }
    forceSmallLogoInRobustState(dataUrl);
    setTimeout(saveNowV752, 200);
    showMessage("Το σήμα μικρύνθηκε και αποθηκεύτηκε (" + dataUrlSizeKb(dataUrl) + " KB).", false);
  }

  function wireCompressedLogo() {
    const input = q("teamLogo");
    if (!input || input.dataset.v752Ready === "1") return;
    input.dataset.v752Ready = "1";

    input.addEventListener("change", function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      showMessage("Μικραίνω το σήμα για να αποθηκευτεί στο κινητό...", false);
      resizeImageFile(file, function (smallDataUrl) {
        applyLogo(smallDataUrl);
        setTimeout(function () { applyLogo(smallDataUrl); }, 1200);
      });
    }, true);
  }

  function patchSaveNow() {
    const oldSaveNow = window.footballCoachSaveNow;
    if (typeof oldSaveNow === "function" && !window.__v752SavePatched) {
      window.footballCoachSaveNow = function () {
        try {
          const logo = q("headerLogo")?.src || q("teamLogoPreview")?.src || "";
          if (logo && logo.startsWith("data:") && dataUrlSizeKb(logo) < 400) {
            forceSmallLogoInRobustState(logo);
          }
        } catch (err) {}
        return oldSaveNow();
      };
      window.__v752SavePatched = true;
    }
  }

  function init() {
    wireCompressedLogo();
    patchSaveNow();

    q("saveNowV752")?.addEventListener("click", function () {
      saveNowV752();
      showMessage("Έγινε χειροκίνητη αποθήκευση.", false);
    });

    setInterval(function () {
      wireCompressedLogo();
      patchSaveNow();
    }, 1500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();


/* ===== v8.1 Dashboard + Player Profiles ===== */
(function(){
  const ROSTER_KEY="footballCoachV74Roster", HISTORY_KEY="footballCoachV73History", ATT_KEY="footballCoachV73Attendance", PROFILES_KEY="footballCoachV81Profiles";
  let activeProfileId=null;

  function q(id){return document.getElementById(id)}
  function parseKey(k,f){try{return JSON.parse(localStorage.getItem(k)||"")}catch(e){return f}}
  function saveKey(k,v){localStorage.setItem(k,JSON.stringify(v)); if(window.FootballCoachStorage) window.FootballCoachStorage.saveNow();}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
  function roster(){const d=parseKey(ROSTER_KEY,{roster:[],squad:[]})||{};return{roster:Array.isArray(d.roster)?d.roster:[],squad:Array.isArray(d.squad)?d.squad:[]}}
  function hist(){const d=parseKey(HISTORY_KEY,{players:{},matches:[]})||{};return{players:d.players||{},matches:Array.isArray(d.matches)?d.matches:[]}}
  function att(){return parseKey(ATT_KEY,{})||{}}
  function profiles(){return parseKey(PROFILES_KEY,{profiles:{}})||{profiles:{}}}
  function saveProfiles(d){saveKey(PROFILES_KEY,d)}
  function monthKey(){const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`}
  function attSummary(){const m=att()[monthKey()];if(!m||!m.data)return{present:0,absent:0,players:0};let present=0,absent=0;Object.values(m.data).forEach(v=>{if(v==="✓")present++;if(v==="Χ")absent++});return{present,absent,players:Array.isArray(m.players)?m.players.length:0}}

  function renderDashboard(){
    const r=roster(), h=hist(), a=attSummary();
    const totalGoals=Object.values(h.players||{}).reduce((s,p)=>s+Number(p.goals||0),0);
    const totalCards=Object.values(h.players||{}).reduce((s,p)=>s+Number(p.yellow||0)+Number(p.red||0),0);
    const cards=[["Παίκτες ρόστερ",r.roster.length],["Αποστολή",r.squad.length],["Αγώνες",h.matches.length],["Γκολ",totalGoals],["Κάρτες",totalCards],["Παρουσίες μήνα",a.present],["Απουσίες μήνα",a.absent],["Παίκτες παρουσιολογίου",a.players]];
    q("dashboardCardsV81").innerHTML=cards.map(([l,v])=>`<div class="dashboard-card-v81"><b>${v}</b><span>${esc(l)}</span></div>`).join("");

    const top=Object.values(h.players||{}).sort((a,b)=>((b.goals||0)-(a.goals||0))||((b.matches||0)-(a.matches||0))).slice(0,8);
    q("dashboardTopPlayersV81").innerHTML=top.length?top.map((p,i)=>`<div class="dashboard-row-v81"><b>${i+1}. ${esc(p.name||"Παίκτης")}</b>Αγώνες: ${p.matches||0} • Γκολ: ${p.goals||0} • Λεπτά: ${p.minutes||0}</div>`).join(""):'<div class="dashboard-row-v81 dashboard-muted-v81">Δεν υπάρχουν ακόμα στατιστικά.</div>';

    const matches=(h.matches||[]).slice(0,6);
    q("dashboardLastMatchesV81").innerHTML=matches.length?matches.map(m=>`<div class="dashboard-row-v81"><b>${esc((m.homeTeam||"Ομάδα")+" "+(m.homeScore??0)+"-"+(m.awayScore??0)+" "+(m.awayTeam||"Αντίπαλος"))}</b>${esc([m.season,m.matchDay,m.matchDate||m.savedAt,m.formation].filter(Boolean).join(" • "))}</div>`).join(""):'<div class="dashboard-row-v81 dashboard-muted-v81">Δεν υπάρχουν αγώνες.</div>';

    const current=att()[monthKey()];
    if(!current||!current.players?.length){q("dashboardAttendanceV81").innerHTML='<div class="dashboard-row-v81 dashboard-muted-v81">Δεν υπάρχει παρουσιολόγιο για τον μήνα.</div>'}
    else{
      q("dashboardAttendanceV81").innerHTML=current.players.slice(0,8).map(name=>{
        let pr=0,ab=0;Object.keys(current.data||{}).forEach(k=>{if(!k.startsWith(name+"|"))return;if(current.data[k]==="✓")pr++;if(current.data[k]==="Χ")ab++});
        return `<div class="dashboard-row-v81"><b>${esc(name)}</b>Παρουσίες: ${pr} • Απουσίες: ${ab}</div>`;
      }).join("");
    }
  }

  function syncProfilesFromRoster(){
    const data=profiles(), r=roster();
    r.roster.forEach(p=>{
      const id=String(p.id||p.name||Date.now());
      if(!data.profiles[id]) data.profiles[id]={id,name:p.name||"",number:p.number||"",positions:p.positions||"",foot:p.foot||"right",birth:"",phone:"",notes:"",photo:"",injuries:[]};
      else Object.assign(data.profiles[id],{name:data.profiles[id].name||p.name||"",number:data.profiles[id].number||p.number||"",positions:data.profiles[id].positions||p.positions||"",foot:data.profiles[id].foot||p.foot||"right"});
    });
    saveProfiles(data); renderProfilesList();
  }

  function renderProfilesList(){
    const data=profiles(), list=Object.values(data.profiles);
    const box=q("profilesListV81");
    box.innerHTML=list.length?list.map(p=>`<div class="profile-card-v81 ${String(p.id)===String(activeProfileId)?"active":""}" data-id="${esc(p.id)}"><b>${esc(p.name||"Χωρίς όνομα")}</b>${esc([p.number,p.positions,p.foot==="left"?"Αριστερό":p.foot==="both"?"Και τα δύο":"Δεξί"].filter(Boolean).join(" • "))}</div>`).join(""):'<div class="profile-card-v81">Πάτα «Συγχρονισμός από ρόστερ».</div>';
    box.querySelectorAll(".profile-card-v81[data-id]").forEach(el=>el.onclick=()=>loadProfile(el.dataset.id));
  }

  function loadProfile(id){
    const p=profiles().profiles[id]; if(!p)return; activeProfileId=id;
    q("profileIdV81").value=p.id; q("profileNameV81").value=p.name||""; q("profileNumberV81").value=p.number||""; q("profileFootV81").value=p.foot||"right"; q("profilePositionsV81").value=p.positions||""; q("profileBirthV81").value=p.birth||""; q("profilePhoneV81").value=p.phone||""; q("profileNotesV81").value=p.notes||"";
    q("profilePhotoPreviewV81").src=p.photo||""; renderInjuries(p); renderProfilesList();
  }

  function currentProfileFromForm(){
    const id=q("profileIdV81").value||String(Date.now());
    return {id,name:q("profileNameV81").value,number:q("profileNumberV81").value,foot:q("profileFootV81").value,positions:q("profilePositionsV81").value,birth:q("profileBirthV81").value,phone:q("profilePhoneV81").value,notes:q("profileNotesV81").value,photo:q("profilePhotoPreviewV81").src||"",injuries:(profiles().profiles[id]?.injuries)||[]};
  }

  function saveProfile(){
    const data=profiles(), p=currentProfileFromForm(); data.profiles[p.id]=p; activeProfileId=p.id; saveProfiles(data); renderProfilesList(); alert("Η καρτέλα αποθηκεύτηκε.");
  }

  function renderInjuries(p){
    const box=q("injuriesListV81"), injuries=p.injuries||[];
    box.innerHTML=injuries.length?injuries.map((x,i)=>`<div class="injury-card-v81"><b>${esc(x.date||"Χωρίς ημερομηνία")}</b>${esc(x.text||"")}<br><button type="button" data-i="${i}">Διαγραφή</button></div>`).join(""):'<div class="injury-card-v81">Δεν υπάρχουν τραυματισμοί.</div>';
    box.querySelectorAll("button[data-i]").forEach(b=>b.onclick=()=>{const data=profiles();data.profiles[p.id].injuries.splice(Number(b.dataset.i),1);saveProfiles(data);loadProfile(p.id)});
  }

  function addInjury(){
    const id=q("profileIdV81").value; if(!id){alert("Διάλεξε πρώτα παίκτη.");return}
    const data=profiles(), p=data.profiles[id]||currentProfileFromForm();
    if(!p.injuries)p.injuries=[];
    p.injuries.unshift({date:q("injuryDateV81").value,text:q("injuryTextV81").value});
    data.profiles[id]=p; saveProfiles(data); q("injuryTextV81").value=""; renderInjuries(p);
  }

  function compressPhoto(file,cb){
    const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const max=420,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.round(img.width*scale),h=Math.round(img.height*scale),c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);cb(c.toDataURL("image/jpeg",0.72))};img.src=r.result};r.readAsDataURL(file);
  }

  function init(){
    q("openDashboardV81")?.addEventListener("click",()=>{renderDashboard();q("dashboardDialogV81")?.showModal()});
    q("openPlayerProfilesV81")?.addEventListener("click",()=>{renderProfilesList();q("playerProfilesDialogV81")?.showModal()});
    q("syncProfilesFromRosterV81")?.addEventListener("click",syncProfilesFromRoster);
    q("saveProfileV81")?.addEventListener("click",saveProfile);
    q("addInjuryV81")?.addEventListener("click",addInjury);
    q("profilePhotoV81")?.addEventListener("change",e=>{const f=e.target.files?.[0];if(f)compressPhoto(f,d=>{q("profilePhotoPreviewV81").src=d;})});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();


/* ===== v8.1 Share / Transfer backup between devices ===== */
(function () {
  const TRANSFER_VERSION = "8.1-share";

  function q(id) { return document.getElementById(id); }

  function setStatus(message, type) {
    const box = q("transferStatusV81S");
    if (!box) return;
    box.textContent = message;
    box.classList.remove("ok", "error");
    if (type) box.classList.add(type);
  }

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (err) { return fallback; }
  }

  function allLocalStorage() {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        out[key] = localStorage.getItem(key);
      }
    } catch (err) {}
    return out;
  }

  async function allIndexedDbData() {
    const out = {};
    try {
      if (window.FootballCoachStorage && typeof window.FootballCoachStorage.exportAll === "function") {
        return await window.FootballCoachStorage.exportAll();
      }
    } catch (err) {}
    return out;
  }

  async function buildTransferPayload() {
    try {
      if (typeof window.footballCoachSaveNow === "function") {
        window.footballCoachSaveNow();
      }
    } catch (err) {}

    try {
      if (window.FootballCoachStorage && typeof window.FootballCoachStorage.saveNow === "function") {
        window.FootballCoachStorage.saveNow();
      }
    } catch (err) {}

    const idb = await allIndexedDbData();
    const ls = allLocalStorage();

    return {
      app: "Football Coach",
      version: TRANSFER_VERSION,
      createdAt: new Date().toISOString(),
      note: "Backup για μεταφορά σε άλλη συσκευή",
      indexedDB: idb,
      localStorage: ls
    };
  }

  function filename() {
    const d = new Date();
    const stamp = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
      String(d.getHours()).padStart(2, "0"),
      String(d.getMinutes()).padStart(2, "0")
    ].join("-");
    return `football-coach-transfer-${stamp}.json`;
  }

  async function createBackupFile() {
    const payload = await buildTransferPayload();
    const text = JSON.stringify(payload, null, 2);
    return new File([text], filename(), { type: "application/json" });
  }

  async function downloadBackup() {
    try {
      setStatus("Δημιουργώ αρχείο backup...", "");
      const file = await createBackupFile();
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Το αρχείο backup δημιουργήθηκε. Μπορείς να το στείλεις όπου θέλεις.", "ok");
    } catch (err) {
      setStatus("Δεν μπόρεσα να δημιουργήσω backup.", "error");
    }
  }

  async function shareBackup() {
    try {
      setStatus("Ετοιμάζω το αρχείο για κοινή χρήση...", "");
      const file = await createBackupFile();

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: "Football Coach Backup",
          text: "Backup δεδομένων Football Coach"
        });
        setStatus("Το αρχείο στάλθηκε/κοινοποιήθηκε.", "ok");
      } else {
        setStatus("Η συσκευή δεν υποστηρίζει απευθείας κοινή χρήση αρχείου. Θα γίνει λήψη backup.", "");
        await downloadBackup();
      }
    } catch (err) {
      if (String(err && err.name) === "AbortError") {
        setStatus("Η κοινή χρήση ακυρώθηκε.", "");
      } else {
        setStatus("Δεν μπόρεσα να κάνω κοινή χρήση. Δοκίμασε «Λήψη αρχείου backup».", "error");
      }
    }
  }

  async function restorePayload(payload) {
    if (!payload || typeof payload !== "object") throw new Error("Λάθος αρχείο.");

    if (payload.localStorage && typeof payload.localStorage === "object") {
      Object.keys(payload.localStorage).forEach((key) => {
        try { localStorage.setItem(key, payload.localStorage[key]); } catch (err) {}
      });
    }

    if (payload.indexedDB && typeof payload.indexedDB === "object") {
      Object.keys(payload.indexedDB).forEach((key) => {
        try { localStorage.setItem(key, payload.indexedDB[key]); } catch (err) {}
      });

      if (window.FootballCoachStorage && typeof window.FootballCoachStorage.saveNow === "function") {
        try { window.FootballCoachStorage.saveNow(); } catch (err) {}
      }
    }

    return true;
  }

  function restoreFromFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const payload = JSON.parse(reader.result);
        await restorePayload(payload);
        setStatus("Το Restore ολοκληρώθηκε. Η σελίδα θα ανανεωθεί.", "ok");
        alert("Το Restore ολοκληρώθηκε. Η σελίδα θα ανανεωθεί.");
        location.reload();
      } catch (err) {
        setStatus("Δεν είναι σωστό αρχείο backup.", "error");
      }
    };
    reader.readAsText(file);
  }

  function init() {
    q("openTransferV81S")?.addEventListener("click", () => {
      setStatus("Έτοιμο για δημιουργία backup ή restore.", "");
      q("transferDialogV81S")?.showModal();
    });

    q("shareBackupV81S")?.addEventListener("click", shareBackup);
    q("downloadBackupV81S")?.addEventListener("click", downloadBackup);
    q("restoreTransferV81S")?.addEventListener("change", restoreFromFile);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();


/* ===== v8.1.1 fixes ===== */
(function(){
 const ROSTER="footballCoachV74Roster", HIST="footballCoachV73History", ATT="footballCoachV73Attendance", PROF="footballCoachV81Profiles", ROUNDS="footballCoachV75Rounds", ROBUST="footballCoachV751RobustState";
 function q(id){return document.getElementById(id)}
 function parse(k,f){try{return JSON.parse(localStorage.getItem(k)||"")}catch(e){return f}}
 function save(k,v){localStorage.setItem(k,JSON.stringify(v));try{if(window.FootballCoachStorage)window.FootballCoachStorage.saveNow()}catch(e){}}
 function st(m,t){const b=q("transferStatusV811");if(b){b.textContent=m;b.classList.remove("ok","error");if(t)b.classList.add(t)}}
 async function idb(){try{if(window.FootballCoachStorage?.exportAll)return await window.FootballCoachStorage.exportAll()}catch(e){}return{}}
 function ls(){const o={};try{for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);o[k]=localStorage.getItem(k)}}catch(e){}return o}
 async function file(){try{if(window.footballCoachSaveNow)window.footballCoachSaveNow(); if(window.FootballCoachStorage)window.FootballCoachStorage.saveNow()}catch(e){} const payload={app:"Football Coach",version:"8.1.1",createdAt:new Date().toISOString(),localStorage:ls(),indexedDB:await idb()}; const txt=JSON.stringify(payload,null,2); const stamp=new Date().toISOString().slice(0,16).replace("T","-").replace(":","-"); return new File([txt],`football-coach-transfer-${stamp}.json`,{type:"application/json"})}
 async function download(){try{st("Δημιουργώ backup...","");const f=await file();const url=URL.createObjectURL(f);const a=document.createElement("a");a.href=url;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);st("Το backup δημιουργήθηκε. Στείλ’ το όπου θέλεις.","ok")}catch(e){st("Δεν μπόρεσα να δημιουργήσω backup.","error")}}
 async function share(){try{st("Ετοιμάζω κοινή χρήση...","");const f=await file();if(navigator.canShare&&navigator.canShare({files:[f]})&&navigator.share){await navigator.share({title:"Football Coach Backup",text:"Backup δεδομένων Football Coach",files:[f]});st("Το backup στάλθηκε.","ok")}else{st("Δεν υποστηρίζεται απευθείας κοινή χρήση. Θα κατέβει αρχείο.","");await download()}}catch(e){if(String(e?.name)==="AbortError")st("Η κοινή χρήση ακυρώθηκε.","");else st("Δεν έγινε κοινή χρήση. Πάτα Λήψη backup.","error")}}
 function restore(ev){const f=ev.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result);const data={...(p.localStorage||{}),...(p.indexedDB||{})};Object.keys(data).forEach(k=>{try{localStorage.setItem(k,data[k])}catch(e){}});try{if(window.FootballCoachStorage)window.FootballCoachStorage.saveNow()}catch(e){};alert("Το restore ολοκληρώθηκε. Η σελίδα θα ανανεωθεί.");location.reload()}catch(e){st("Δεν είναι σωστό αρχείο backup.","error")}};r.readAsText(f)}
 function openTransfer(){st("Έτοιμο. Πάτα Κοινή χρήση ή Λήψη backup.","");(q("transferDialogV811")||q("transferDialogV81S"))?.showModal()}
 function clearDash(){if(!confirm("Να καθαριστούν Dashboard, αγώνες, στατιστικά και παρουσιολόγιο; Το ρόστερ και οι καρτέλες μένουν."))return;save(HIST,{players:{},matches:[]});save(ATT,{});save(ROUNDS,[]);try{const r=parse(ROBUST,null);if(r){r.players=[];r.lines=[];r.timerSeconds=0;r.localStorage=r.localStorage||{};r.localStorage[HIST]=JSON.stringify({players:{},matches:[]});r.localStorage[ATT]=JSON.stringify({});localStorage.setItem(ROBUST,JSON.stringify(r))}}catch(e){}alert("Καθαρίστηκε.");q("dashboardDialogV81")?.close()}
 function delProfile(){const id=q("profileIdV81")?.value;if(!id){alert("Διάλεξε πρώτα παίκτη.");return}const pr=parse(PROF,{profiles:{}});const p=pr.profiles?.[id];if(!p){alert("Δεν βρέθηκε καρτέλα.");return}if(!confirm(`Να διαγραφεί ο παίκτης ${p.name||""};`))return;delete pr.profiles[id];save(PROF,pr);const ro=parse(ROSTER,{roster:[],squad:[]});ro.roster=(ro.roster||[]).filter(x=>String(x.id)!==String(id)&&String(x.name||"").trim().toLowerCase()!==String(p.name||"").trim().toLowerCase());ro.squad=(ro.squad||[]).filter(x=>String(x)!==String(id));save(ROSTER,ro);["profileIdV81","profileNameV81","profileNumberV81","profilePositionsV81","profileBirthV81","profilePhoneV81","profileNotesV81"].forEach(id=>{let e=q(id);if(e)e.value=""});if(q("profilePhotoPreviewV81"))q("profilePhotoPreviewV81").src="";if(q("injuriesListV81"))q("injuriesListV81").innerHTML="";alert("Ο παίκτης διαγράφηκε.")}
 function dashClick(label){label=String(label||"").toLowerCase();if(label.includes("ρόστερ")||label.includes("αποστολή")){q("dashboardDialogV81")?.close();setTimeout(()=>q("openRosterV74")?.click(),100)}else if(label.includes("παρουσ")||label.includes("απουσ")){q("dashboardDialogV81")?.close();setTimeout(()=>q("openAttendanceV73")?.click(),100)}else if(label.includes("αγών")||label.includes("γκολ")||label.includes("κάρτες")){q("dashboardDialogV81")?.close();setTimeout(()=>(q("openPlayerStatsV73")||q("openHistoryManagerV712")||q("openHistory"))?.click(),100)}}
 function clickable(){const b=q("dashboardCardsV81");if(!b||b.dataset.fix811)return;b.dataset.fix811="1";b.addEventListener("click",e=>{const c=e.target.closest(".dashboard-card-v81");if(c)dashClick(c.querySelector("span")?.textContent||c.textContent)})}
 function cleanDefaults(){const h=parse(HIST,null), r=parse(ROSTER,{roster:[]});const real=(r.roster||[]).some(p=>p.name&&!/^Παίκτης\s*\d+$/i.test(String(p.name).trim()));const vals=h&&h.players?Object.values(h.players):[];const only=vals.length&&vals.every(p=>/^Παίκτης\s*\d+$/i.test(String(p.name||"").trim())&&Number(p.goals||0)===0);if(!real&&only)save(HIST,{players:{},matches:[]})}
 function init(){cleanDefaults();q("openTransferV811")?.addEventListener("click",openTransfer);q("openTransferV81S")?.addEventListener("click",openTransfer);q("shareBackupV811")?.addEventListener("click",share);q("downloadBackupV811")?.addEventListener("click",download);q("restoreTransferV811")?.addEventListener("change",restore);q("shareBackupV81S")?.addEventListener("click",share);q("downloadBackupV81S")?.addEventListener("click",download);q("restoreTransferV81S")?.addEventListener("change",restore);q("deleteProfileV811")?.addEventListener("click",delProfile);q("clearDashboardV811")?.addEventListener("click",clearDash);clickable();setInterval(clickable,1000)}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();


/* ===== v8.1.2 default roster + attendance + coach ===== */
(function(){
  const DEFAULT_PLAYERS_V812 = ["Μπαρσακης", "Στατε", "Γεωργαντοπουλος", "Οικονόμου", "Οτσκα", "Κωνσταντινακης", "Σαραπης", "Μπαρδης", "Τσαμουρας", "Χαμης", "Περαι", "Σκουμπρης", "Τανισκιδης", "Ραβανος", "Τογιας", "Λαλζι", "Βασιλείου", "Στυλιαρας", "Χαραλαμπους", "Λεμονης", "Μαγκλαρας", "Χατζηβασιλειου", "Μουτσιος", "Θαλασσινος", "Τζαχολι"];
  const ROSTER_KEY = "footballCoachV74Roster";
  const ATT_KEY = "footballCoachV73Attendance";
  const PROFILES_KEY = "footballCoachV81Profiles";
  const COACH_KEY = "footballCoachV812Coach";
  const SEED_KEY = "footballCoachV812PlayersSeeded";

  function q(id) { return document.getElementById(id); }
  function safeParse(text, fallback) { try { return JSON.parse(text); } catch(e) { return fallback; } }
  function load(key, fallback) { return safeParse(localStorage.getItem(key) || "", fallback); }
  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    try { if (window.FootballCoachStorage) window.FootballCoachStorage.saveNow(); } catch(e) {}
  }
  function norm(name) { return String(name || "").trim().toLowerCase(); }

  function todayMonthKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
  }

  function seedRosterAndAttendance() {
    const rosterData = load(ROSTER_KEY, {roster:[], squad:[]});
    rosterData.roster = Array.isArray(rosterData.roster) ? rosterData.roster : [];
    rosterData.squad = Array.isArray(rosterData.squad) ? rosterData.squad : [];

    const profilesData = load(PROFILES_KEY, {profiles:{}});
    profilesData.profiles = profilesData.profiles || {};

    const existing = new Set(rosterData.roster.map(p => norm(p.name)));
    let added = 0;

    DEFAULT_PLAYERS_V812.forEach((name, index) => {
      if (existing.has(norm(name))) return;

      const id = Date.now() + index + Math.floor(Math.random() * 100000);
      const player = {
        id,
        name,
        number: "",
        positions: "",
        foot: "",
        minutes: 0,
        goals: 0,
        yellow: 0,
        red: 0
      };

      rosterData.roster.push(player);
      profilesData.profiles[String(id)] = {
        id: String(id),
        name,
        number: "",
        positions: "",
        foot: "",
        birth: "",
        phone: "",
        notes: "",
        photo: "",
        injuries: []
      };
      existing.add(norm(name));
      added++;
    });

    save(ROSTER_KEY, rosterData);
    save(PROFILES_KEY, profilesData);

    const attendance = load(ATT_KEY, {});
    const key = todayMonthKey();
    if (!attendance[key]) attendance[key] = {players: [], data: {}};
    attendance[key].players = Array.isArray(attendance[key].players) ? attendance[key].players : [];
    DEFAULT_PLAYERS_V812.forEach(name => {
      if (!attendance[key].players.includes(name)) attendance[key].players.push(name);
    });
    save(ATT_KEY, attendance);

    localStorage.setItem(SEED_KEY, "1");
    try { if (window.FootballCoachStorage) window.FootballCoachStorage.saveNow(); } catch(e) {}

    try { if (typeof renderRosterV74 === "function") renderRosterV74(); } catch(e) {}
  }

  function removeDuplicateTransferButtons() {
    const buttons = Array.from(document.querySelectorAll("#openTransferV811, #openTransferV81S"));
    if (buttons.length <= 1) return;
    let kept = false;
    buttons.forEach(btn => {
      if (!kept && btn.id === "openTransferV811") { kept = true; return; }
      if (!kept && btn.id === "openTransferV81S") { btn.id = "openTransferV811"; btn.textContent = "Αποστολή / Μεταφορά δεδομένων"; kept = true; return; }
      btn.remove();
    });
  }

  function loadCoach() {
    const value = localStorage.getItem(COACH_KEY) || "";
    if (q("coachNameV812")) q("coachNameV812").value = value;
    updateCoachDisplay(value);
  }

  function saveCoach() {
    const value = q("coachNameV812")?.value || "";
    localStorage.setItem(COACH_KEY, value);
    updateCoachDisplay(value);
    try { if (window.FootballCoachStorage) window.FootballCoachStorage.saveNow(); } catch(e) {}
  }

  function updateCoachDisplay(value) {
    let box = document.getElementById("coachDisplayV812");
    const title = document.querySelector("main h1, .app-title, h1");
    if (!box && title) {
      box = document.createElement("div");
      box.id = "coachDisplayV812";
      box.className = "coach-display-v812";
      title.insertAdjacentElement("afterend", box);
    }
    if (box) box.textContent = value ? "Προπονητής: " + value : "";
  }

  function ensureFootBothOptions() {
    document.querySelectorAll("select").forEach(sel => {
      const txt = sel.textContent || "";
      if ((txt.includes("Δεξ") || txt.includes("Αρισ")) && !Array.from(sel.options).some(o => o.value === "both")) {
        const opt = document.createElement("option");
        opt.value = "both";
        opt.textContent = "Και τα δύο";
        sel.appendChild(opt);
      }
    });
  }

  function init() {
    seedRosterAndAttendance();
    removeDuplicateTransferButtons();
    loadCoach();
    q("coachNameV812")?.addEventListener("input", saveCoach);
    q("coachNameV812")?.addEventListener("change", saveCoach);
    ensureFootBothOptions();
    setInterval(() => {
      removeDuplicateTransferButtons();
      ensureFootBothOptions();
    }, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();


/* ===== v8.1.3 clean duplicate/default players everywhere ===== */
(function(){
  const REAL_PLAYERS = ["Μπαρσακης", "Στατε", "Γεωργαντοπουλος", "Οικονόμου", "Οτσκα", "Κωνσταντινακης", "Σαραπης", "Μπαρδης", "Τσαμουρας", "Χαμης", "Περαι", "Σκουμπρης", "Τανισκιδης", "Ραβανος", "Τογιας", "Λαλζι", "Βασιλείου", "Στυλιαρας", "Χαραλαμπους", "Λεμονης", "Μαγκλαρας", "Χατζηβασιλειου", "Μουτσιος", "Θαλασσινος", "Τζαχολι"];
  const ROSTER_KEY = "footballCoachV74Roster";
  const ATT_KEY = "footballCoachV73Attendance";
  const PROFILES_KEY = "footballCoachV81Profiles";
  const HISTORY_KEY = "footballCoachV73History";
  const ROBUST_KEY = "footballCoachV751RobustState";

  function norm(name) {
    return String(name || "").trim().toLowerCase()
      .replace(/ά/g,"α").replace(/έ/g,"ε").replace(/ή/g,"η").replace(/[ίϊΐ]/g,"ι")
      .replace(/ό/g,"ο").replace(/[ύϋΰ]/g,"υ").replace(/ώ/g,"ω");
  }

  function isDefaultPlayer(name) {
    const s = norm(name);
    return /^παικτης\s*\d+$/.test(s) || /^παίκτης\s*\d+$/i.test(String(name || "").trim());
  }

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); } catch(e) { return fallback; }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function cleanAll() {
    const oldRoster = load(ROSTER_KEY, {roster:[], squad:[]});
    const oldList = Array.isArray(oldRoster.roster) ? oldRoster.roster : [];
    const byName = new Map();

    oldList.forEach(p => {
      if (p && p.name && !isDefaultPlayer(p.name) && !byName.has(norm(p.name))) byName.set(norm(p.name), p);
    });

    const roster = REAL_PLAYERS.map((name, index) => {
      const old = byName.get(norm(name)) || {};
      return {
        id: old.id || (Date.now() + index + Math.floor(Math.random() * 10000)),
        name,
        number: old.number || "",
        positions: old.positions || "",
        foot: old.foot || "",
        minutes: Number(old.minutes || 0),
        goals: Number(old.goals || 0),
        yellow: Number(old.yellow || 0),
        red: Number(old.red || 0)
      };
    });

    save(ROSTER_KEY, {roster, squad: []});

    const allowed = new Set(REAL_PLAYERS);
    const attendance = load(ATT_KEY, {});
    Object.keys(attendance).forEach(month => {
      const m = attendance[month];
      if (!m) return;
      m.players = REAL_PLAYERS.slice();
      const newData = {};
      Object.keys(m.data || {}).forEach(k => {
        const name = k.split("|")[0];
        if (allowed.has(name)) newData[k] = m.data[k];
      });
      m.data = newData;
    });
    const d = new Date();
    const cur = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
    if (!attendance[cur]) attendance[cur] = {players: REAL_PLAYERS.slice(), data: {}};
    attendance[cur].players = REAL_PLAYERS.slice();
    save(ATT_KEY, attendance);

    const oldProfiles = load(PROFILES_KEY, {profiles:{}});
    const oldProfByName = new Map();
    Object.values(oldProfiles.profiles || {}).forEach(p => {
      if (p && p.name && !isDefaultPlayer(p.name) && !oldProfByName.has(norm(p.name))) oldProfByName.set(norm(p.name), p);
    });
    const profiles = {};
    roster.forEach(rp => {
      const old = oldProfByName.get(norm(rp.name)) || {};
      profiles[String(rp.id)] = {
        id: String(rp.id),
        name: rp.name,
        number: old.number || rp.number || "",
        positions: old.positions || rp.positions || "",
        foot: old.foot || rp.foot || "",
        birth: old.birth || "",
        phone: old.phone || "",
        notes: old.notes || "",
        photo: old.photo || "",
        injuries: Array.isArray(old.injuries) ? old.injuries : []
      };
    });
    save(PROFILES_KEY, {profiles});

    const history = load(HISTORY_KEY, {players:{}, matches:[]});
    const newHistPlayers = {};
    Object.values(history.players || {}).forEach(p => {
      if (p && p.name && !isDefaultPlayer(p.name) && REAL_PLAYERS.map(norm).includes(norm(p.name))) newHistPlayers[norm(p.name)] = p;
    });
    save(HISTORY_KEY, {players: newHistPlayers, matches: Array.isArray(history.matches) ? history.matches : []});

    try {
      const robust = load(ROBUST_KEY, null);
      if (robust) {
        robust.players = [];
        robust.subs = [];
        robust.localStorage = robust.localStorage || {};
        robust.localStorage[ROSTER_KEY] = JSON.stringify({roster, squad: []});
        robust.localStorage[ATT_KEY] = localStorage.getItem(ATT_KEY);
        robust.localStorage[PROFILES_KEY] = localStorage.getItem(PROFILES_KEY);
        robust.localStorage[HISTORY_KEY] = localStorage.getItem(HISTORY_KEY);
        localStorage.setItem(ROBUST_KEY, JSON.stringify(robust));
      }
    } catch(e) {}

    try {
      if (typeof players !== "undefined" && Array.isArray(players)) {
        players.forEach((p, i) => {
          if (p && isDefaultPlayer(p.name)) { p.name = ""; p.number = ""; }
        });
      }
      if (typeof subs !== "undefined" && Array.isArray(subs)) {
        for (let i=subs.length-1; i>=0; i--) if (isDefaultPlayer(subs[i])) subs.splice(i,1);
      }
      if (typeof render === "function") render();
      else {
        if (typeof renderPitch === "function") renderPitch();
        if (typeof renderPlayerInputs === "function") renderPlayerInputs();
        if (typeof renderSubs === "function") renderSubs();
      }
    } catch(e) {}

    try { if (window.FootballCoachStorage) window.FootballCoachStorage.saveNow(); } catch(e) {}
    try { if (typeof renderRosterV74 === "function") renderRosterV74(); } catch(e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cleanAll);
  else cleanAll();
})();


/* ===== v8.1.4 alphabetical players everywhere ===== */
(function () {
  const ROSTER_KEY = "footballCoachV74Roster";
  const ATT_KEY = "footballCoachV73Attendance";
  const PROFILES_KEY = "footballCoachV81Profiles";
  const ROBUST_KEY = "footballCoachV751RobustState";

  function normalizeGreek(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase("el-GR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function byGreekName(a, b) {
    return normalizeGreek(a?.name || a).localeCompare(normalizeGreek(b?.name || b), "el", {
      sensitivity: "base",
      numeric: true
    });
  }

  function load(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "");
    } catch (err) {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function sortRoster() {
    const data = load(ROSTER_KEY, { roster: [], squad: [] });
    data.roster = Array.isArray(data.roster) ? data.roster : [];
    data.squad = Array.isArray(data.squad) ? data.squad : [];

    data.roster.sort(byGreekName);

    // Keep squad order alphabetic too, based on roster names.
    const rosterById = new Map(data.roster.map((p) => [String(p.id), p]));
    data.squad = data.squad
      .filter((id) => rosterById.has(String(id)))
      .sort((a, b) => byGreekName(rosterById.get(String(a)), rosterById.get(String(b))));

    save(ROSTER_KEY, data);
    return data;
  }

  function sortAttendance() {
    const all = load(ATT_KEY, {});
    Object.keys(all || {}).forEach((month) => {
      if (!all[month]) return;
      all[month].players = Array.isArray(all[month].players) ? all[month].players : [];
      all[month].players.sort(byGreekName);
    });
    save(ATT_KEY, all);
  }

  function sortProfiles() {
    const data = load(PROFILES_KEY, { profiles: {} });
    const entries = Object.entries(data.profiles || {}).sort((a, b) => byGreekName(a[1], b[1]));
    data.profiles = Object.fromEntries(entries);
    save(PROFILES_KEY, data);
  }

  function sortRobust() {
    const data = load(ROBUST_KEY, null);
    if (!data) return;

    if (Array.isArray(data.players)) data.players.sort(byGreekName);
    if (Array.isArray(data.subs)) data.subs.sort(byGreekName);

    data.localStorage = data.localStorage || {};
    data.localStorage[ROSTER_KEY] = localStorage.getItem(ROSTER_KEY);
    data.localStorage[ATT_KEY] = localStorage.getItem(ATT_KEY);
    data.localStorage[PROFILES_KEY] = localStorage.getItem(PROFILES_KEY);

    localStorage.setItem(ROBUST_KEY, JSON.stringify(data));
  }

  function sortAll() {
    sortRoster();
    sortAttendance();
    sortProfiles();
    sortRobust();

    try { if (window.FootballCoachStorage) window.FootballCoachStorage.saveNow(); } catch (err) {}
  }

  function wrapFunction(name, after) {
    const oldFn = window[name];
    if (typeof oldFn !== "function" || oldFn.__alphabeticalWrapped) return;

    const wrapped = function () {
      const result = oldFn.apply(this, arguments);
      setTimeout(after, 50);
      return result;
    };
    wrapped.__alphabeticalWrapped = true;
    window[name] = wrapped;
  }

  function patchRenderers() {
    wrapFunction("renderRosterV74", sortAll);
    wrapFunction("renderAttendanceV73", sortAttendance);
    wrapFunction("renderProfilesList", sortProfiles);
    wrapFunction("renderDashboard", sortAll);
  }

  function observeRosterChanges() {
    document.addEventListener("input", function (event) {
      if (
        event.target &&
        (
          event.target.closest("#rosterTableV74") ||
          event.target.closest("#attendanceTableV73") ||
          event.target.closest("#playerProfilesDialogV81")
        )
      ) {
        clearTimeout(window.__alphabeticalSaveTimer);
        window.__alphabeticalSaveTimer = setTimeout(function () {
          sortAll();
          try { if (typeof renderRosterV74 === "function") renderRosterV74(); } catch (err) {}
        }, 450);
      }
    }, true);

    document.addEventListener("change", function (event) {
      if (
        event.target &&
        (
          event.target.closest("#rosterTableV74") ||
          event.target.closest("#attendanceTableV73") ||
          event.target.closest("#playerProfilesDialogV81")
        )
      ) {
        setTimeout(function () {
          sortAll();
          try { if (typeof renderRosterV74 === "function") renderRosterV74(); } catch (err) {}
        }, 200);
      }
    }, true);
  }

  function init() {
    sortAll();
    patchRenderers();
    observeRosterChanges();

    setTimeout(function () {
      try { if (typeof renderRosterV74 === "function") renderRosterV74(); } catch (err) {}
    }, 400);

    setInterval(patchRenderers, 1500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();


/* ===== v8.1.5 force roster + attendance alphabetical sync ===== */
(function(){
  const REAL_PLAYERS = ["Μπαρσακης", "Στατε", "Γεωργαντοπουλος", "Οικονόμου", "Οτσκα", "Κωνσταντινακης", "Σαραπης", "Μπαρδης", "Τσαμουρας", "Χαμης", "Περαι", "Σκουμπρης", "Τανισκιδης", "Ραβανος", "Τογιας", "Λαλζι", "Βασιλείου", "Στυλιαρας", "Χαραλαμπους", "Λεμονης", "Μαγκλαρας", "Χατζηβασιλειου", "Μουτσιος", "Θαλασσινος", "Τζαχολι"];
  const ROSTER_KEY = "footballCoachV74Roster";
  const ATT_KEY = "footballCoachV73Attendance";
  const PROFILES_KEY = "footballCoachV81Profiles";
  const HISTORY_KEY = "footballCoachV73History";
  const ROBUST_KEY = "footballCoachV751RobustState";

  function cleanText(s) {
    return String(s || "")
      .trim()
      .toLocaleLowerCase("el-GR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function alphaNames(a, b) {
    return cleanText(a).localeCompare(cleanText(b), "el", { sensitivity: "base", numeric: true });
  }

  function alphaPlayers(a, b) {
    return alphaNames(a && a.name ? a.name : a, b && b.name ? b.name : b);
  }

  function isDefaultPlayer(name) {
    const s = cleanText(name);
    return /^παικτης\s*\d+$/.test(s);
  }

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ""); } catch(e) { return fallback; }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const SORTED_NAMES = REAL_PLAYERS.slice().sort(alphaNames);
  const SORTED_SET = new Set(SORTED_NAMES);

  function buildCleanRoster() {
    const old = load(ROSTER_KEY, { roster: [], squad: [] });
    const oldRoster = Array.isArray(old.roster) ? old.roster : [];
    const byName = new Map();

    oldRoster.forEach(p => {
      if (!p || !p.name || isDefaultPlayer(p.name)) return;
      const key = cleanText(p.name);
      if (!byName.has(key)) byName.set(key, p);
    });

    const roster = SORTED_NAMES.map((name, index) => {
      const oldPlayer = byName.get(cleanText(name)) || {};
      return {
        id: oldPlayer.id || (Date.now() + index + Math.floor(Math.random() * 100000)),
        name,
        number: oldPlayer.number || "",
        positions: oldPlayer.positions || "",
        foot: oldPlayer.foot || "",
        minutes: Number(oldPlayer.minutes || 0),
        goals: Number(oldPlayer.goals || 0),
        yellow: Number(oldPlayer.yellow || 0),
        red: Number(oldPlayer.red || 0)
      };
    }).sort(alphaPlayers);

    const rosterById = new Map(roster.map(p => [String(p.id), p]));
    let squad = Array.isArray(old.squad) ? old.squad.filter(id => rosterById.has(String(id))) : [];
    squad = squad.sort((a,b) => alphaPlayers(rosterById.get(String(a)), rosterById.get(String(b))));

    save(ROSTER_KEY, { roster, squad });
    return { roster, squad };
  }

  function syncAttendanceFromRoster(roster) {
    const attendance = load(ATT_KEY, {});
    const rosterNames = roster.map(p => p.name).sort(alphaNames);
    const allowed = new Set(rosterNames);

    Object.keys(attendance).forEach(month => {
      const oldMonth = attendance[month] || {};
      const oldData = oldMonth.data || {};
      const newData = {};

      Object.keys(oldData).forEach(cellKey => {
        const parts = cellKey.split("|");
        const name = parts[0];
        const day = parts.slice(1).join("|");
        if (allowed.has(name) && day) newData[name + "|" + day] = oldData[cellKey];
      });

      attendance[month] = {
        players: rosterNames.slice(),
        data: newData
      };
    });

    const now = new Date();
    const current = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    if (!attendance[current]) attendance[current] = { players: rosterNames.slice(), data: {} };
    attendance[current].players = rosterNames.slice();

    save(ATT_KEY, attendance);
  }

  function syncProfiles(roster) {
    const old = load(PROFILES_KEY, { profiles: {} });
    const oldByName = new Map();

    Object.values(old.profiles || {}).forEach(p => {
      if (!p || !p.name || isDefaultPlayer(p.name)) return;
      if (!oldByName.has(cleanText(p.name))) oldByName.set(cleanText(p.name), p);
    });

    const profiles = {};
    roster.sort(alphaPlayers).forEach(rp => {
      const oldP = oldByName.get(cleanText(rp.name)) || {};
      profiles[String(rp.id)] = {
        id: String(rp.id),
        name: rp.name,
        number: oldP.number || rp.number || "",
        positions: oldP.positions || rp.positions || "",
        foot: oldP.foot || rp.foot || "",
        birth: oldP.birth || "",
        phone: oldP.phone || "",
        notes: oldP.notes || "",
        photo: oldP.photo || "",
        injuries: Array.isArray(oldP.injuries) ? oldP.injuries : []
      };
    });

    save(PROFILES_KEY, { profiles });
  }

  function cleanHistory() {
    const h = load(HISTORY_KEY, { players: {}, matches: [] });
    const cleanPlayers = {};

    Object.values(h.players || {}).forEach(p => {
      if (!p || !p.name || isDefaultPlayer(p.name)) return;
      if (!SORTED_SET.has(p.name)) return;
      cleanPlayers[cleanText(p.name)] = p;
    });

    save(HISTORY_KEY, {
      players: cleanPlayers,
      matches: Array.isArray(h.matches) ? h.matches : []
    });
  }

  function cleanCurrentLineup() {
    try {
      if (typeof players !== "undefined" && Array.isArray(players)) {
        players.forEach((p) => {
          if (p && isDefaultPlayer(p.name)) {
            p.name = "";
            p.number = "";
          }
        });
      }
      if (typeof subs !== "undefined" && Array.isArray(subs)) {
        for (let i = subs.length - 1; i >= 0; i--) {
          if (isDefaultPlayer(subs[i])) subs.splice(i, 1);
        }
      }
    } catch(e) {}
  }

  function syncRobust(rosterData) {
    const robust = load(ROBUST_KEY, null);
    if (!robust) return;

    robust.localStorage = robust.localStorage || {};
    robust.localStorage[ROSTER_KEY] = JSON.stringify(rosterData);
    robust.localStorage[ATT_KEY] = localStorage.getItem(ATT_KEY);
    robust.localStorage[PROFILES_KEY] = localStorage.getItem(PROFILES_KEY);
    robust.localStorage[HISTORY_KEY] = localStorage.getItem(HISTORY_KEY);

    robust.players = Array.isArray(robust.players)
      ? robust.players.filter(p => p && p.name && !isDefaultPlayer(p.name)).sort(alphaPlayers)
      : [];
    robust.subs = Array.isArray(robust.subs)
      ? robust.subs.filter(s => s && !isDefaultPlayer(s)).sort(alphaNames)
      : [];

    localStorage.setItem(ROBUST_KEY, JSON.stringify(robust));
  }

  function forceSyncAll() {
    const rosterData = buildCleanRoster();
    syncAttendanceFromRoster(rosterData.roster);
    syncProfiles(rosterData.roster);
    cleanHistory();
    cleanCurrentLineup();
    syncRobust(rosterData);

    try { if (window.FootballCoachStorage) window.FootballCoachStorage.saveNow(); } catch(e) {}
  }

  function rerenderAll() {
    try { if (typeof renderRosterV74 === "function") renderRosterV74(); } catch(e) {}
    try { if (typeof renderAttendanceV73 === "function") renderAttendanceV73(false); } catch(e) {}
    try { if (typeof renderProfilesList === "function") renderProfilesList(); } catch(e) {}
    try { if (typeof renderDashboard === "function") renderDashboard(); } catch(e) {}
    try { if (typeof render === "function") render(); } catch(e) {}
  }

  function patchAttendanceButtons() {
    const buttons = Array.from(document.querySelectorAll("button"));
    buttons.forEach(btn => {
      const text = (btn.textContent || "").trim();
      if (text.includes("Παίκτες από 11άδα") && !btn.dataset.v815Fixed) {
        btn.dataset.v815Fixed = "1";
        btn.addEventListener("click", function(e) {
          setTimeout(function() {
            forceSyncAll();
            rerenderAll();
          }, 100);
        }, true);
      }
    });
  }

  function patchOpenAttendance() {
    const btn = document.getElementById("openAttendanceV73");
    if (btn && !btn.dataset.v815Fixed) {
      btn.dataset.v815Fixed = "1";
      btn.addEventListener("click", function() {
        forceSyncAll();
        setTimeout(rerenderAll, 150);
      }, true);
    }
  }

  function init() {
    forceSyncAll();
    setTimeout(rerenderAll, 300);
    patchAttendanceButtons();
    patchOpenAttendance();

    setInterval(function() {
      patchAttendanceButtons();
      patchOpenAttendance();
    }, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();



/* removed old unstable roster selector */

/* removed old unstable roster selector */

/* removed old unstable roster selector */

/* removed old unstable roster selector */



/* removed old roster selector */


/* ===== v8.2.1 stable popup roster select + left autocomplete ===== */
(function(){
 const ROSTER_KEY="footballCoachV74Roster"; let activeIndex=null,lastDialog=null;
 const q=id=>document.getElementById(id);
 const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||"")}catch(e){return f}};
 const saveNow=()=>{try{if(typeof save==="function")save()}catch(e){};try{if(window.FootballCoachStorage)window.FootballCoachStorage.saveNow()}catch(e){}};
 const clean=s=>String(s||"").trim().toLocaleLowerCase("el-GR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const roster=()=>{const d=load(ROSTER_KEY,{roster:[]});return (Array.isArray(d.roster)?d.roster:[]).filter(p=>p&&p.name).sort((a,b)=>clean(a.name).localeCompare(clean(b.name),"el",{sensitivity:"base",numeric:true}))};
 const byId=id=>roster().find(p=>String(p.id)===String(id));
 const byName=name=>roster().find(p=>clean(p.name)===clean(name));
 const posList=p=>String(p.positions||"").toUpperCase().replace(/[./|]/g,",").split(/[,\s]+/).map(x=>x.trim()).filter(Boolean);
 const pitchTokens=()=>Array.from(document.querySelectorAll(".player,.player-token,.player-marker,.pitch-player,.player-chip"));
 function idxFromEl(el){if(!el)return null;let raw=el.dataset?.playerIndex||el.dataset?.index||el.getAttribute("data-player-index")||el.getAttribute("data-index");if(raw!==undefined&&raw!==null&&raw!==""){let n=Number(raw);if(Number.isFinite(n))return n}let n=pitchTokens().indexOf(el);return n>=0?n:null}
 function getIdx(){if(activeIndex!==null&&Number.isFinite(Number(activeIndex)))return Number(activeIndex);try{if(typeof editingPlayerIndex!=="undefined"&&editingPlayerIndex!==null&&editingPlayerIndex!==""){let n=Number(editingPlayerIndex);if(Number.isFinite(n))return n}}catch(e){}return null}
 function getPos(i){try{if(i!==null&&typeof players!=="undefined"&&Array.isArray(players)&&players[i])return String(players[i].pos||players[i].position||"").toUpperCase()}catch(e){}let t=pitchTokens()[i]?.textContent||"";let m=t.match(/\b(GK|CB|LB|RB|CM|DM|AM|LW|RW|ST|CF|LWB|RWB)\b/);return m?m[1]:""}
 const dlg=()=>document.querySelector("dialog[open]");
 const popupSelect=()=>{let d=dlg();return d?(q("assignFromSquadV74")||q("quickPlayerSelect")||d.querySelector("select")):null};
 function popupInputs(){let d=dlg()||document;let inputs=Array.from(d.querySelectorAll("input")).filter(el=>el.type!=="file"&&el.type!=="hidden");let name=inputs.find(el=>(el.previousElementSibling?.textContent||"").includes("Όνομα")||(el.id||"").toLowerCase().includes("name"));let num=inputs.find(el=>(el.previousElementSibling?.textContent||"").includes("Αριθ")||(el.id||"").toLowerCase().includes("number"));return{name,num}}
 function clearOnNewDialog(){let d=dlg();if(!d||d===lastDialog)return;lastDialog=d;let {name,num}=popupInputs(); if(name)name.value=""; if(num)num.value=""; let s=popupSelect(); if(s)s.value=""}
 function labelHelp(s){let d=s.closest("dialog")||document;Array.from(d.querySelectorAll("label")).forEach(l=>{let txt=l.textContent||"";if((l.getAttribute("for")||"")===s.id||txt.includes("Επιλογή")||txt.includes("αποστολή"))l.textContent="Επιλογή από ρόστερ"});d.querySelectorAll("#rosterSelectHelpV818,#positionSuggestionV816,#rosterSelectHelpV819,#rosterHelpV820").forEach(e=>e.remove());let h=q("rosterHelpV821");if(!h){h=document.createElement("div");h.id="rosterHelpV821";h.className="roster-help-v821";s.insertAdjacentElement("afterend",h)}h.textContent="Πρώτα προτεινόμενοι για τη θέση, μετά όλο το ρόστερ."}
 function fillSelect(force=false){let s=popupSelect();if(!s)return;let i=getIdx(),pos=getPos(i),all=roster(),rec=pos?all.filter(p=>posList(p).includes(pos)):[],ids=new Set(rec.map(p=>String(p.id))),rest=all.filter(p=>!ids.has(String(p.id)));let sig=JSON.stringify([pos,all.map(p=>[p.id,p.name,p.number,p.positions])]);if(!force&&s.dataset.v821sig===sig){labelHelp(s);return}let val=s.value;let html='<option value="">-- διάλεξε παίκτη από ρόστερ --</option>';if(rec.length){html+=`<optgroup label="Προτεινόμενοι για ${pos}">`+rec.map(p=>`<option value="${p.id}">${p.name}${p.number?" #"+p.number:""}${p.positions?" • "+p.positions:""}</option>`).join("")+"</optgroup>"}html+='<optgroup label="Όλο το ρόστερ">'+rest.map(p=>`<option value="${p.id}">${p.name}${p.number?" #"+p.number:""}${p.positions?" • "+p.positions:""}</option>`).join("")+"</optgroup>";s.innerHTML=html;s.dataset.v821sig=sig;if(val&&all.some(p=>String(p.id)===String(val)))s.value=val;labelHelp(s)}
 function visibleInputs(){return Array.from(document.querySelectorAll("input")).filter(el=>el.type!=="file"&&el.type!=="hidden"&&el.offsetParent&&(((el.placeholder||"").toLowerCase().includes("παίκ"))||((el.placeholder||"").toLowerCase().includes("παικ"))||(el.id||"").toLowerCase().includes("playername")||(el.id||"").toLowerCase().includes("player-name")))}
 function setGlobal(i,p){try{if(i!==null&&typeof players!=="undefined"&&Array.isArray(players)&&players[i]){players[i].name=p.name||"";players[i].number=p.number||""}}catch(e){}}
 function setLeft(i,p){if(i===null)return;let input=visibleInputs()[i];if(!input)return;input.value=p.name||"";input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));let row=input.closest("tr,.player-row,.lineup-row,.player-input-row,div");let n=row?Array.from(row.querySelectorAll("input")).find(el=>el!==input&&(((el.placeholder||"").toLowerCase().includes("no"))||el.type==="number")):null;if(n){n.value=p.number||"";n.dispatchEvent(new Event("input",{bubbles:true}));n.dispatchEvent(new Event("change",{bubbles:true}))}}
 function setPopup(p){let {name,num}=popupInputs();if(name){name.value=p.name||"";name.dispatchEvent(new Event("input",{bubbles:true}));name.dispatchEvent(new Event("change",{bubbles:true}))}if(num){num.value=p.number||"";num.dispatchEvent(new Event("input",{bubbles:true}));num.dispatchEvent(new Event("change",{bubbles:true}))}}
 function fullNames(){pitchTokens().forEach(el=>{el.style.width="auto";el.style.minWidth="104px";el.style.maxWidth="280px";el.style.overflow="visible";el.querySelectorAll("*").forEach(c=>{c.style.whiteSpace="normal";c.style.overflow="visible";c.style.textOverflow="clip"})})}
 function apply(p){let i=getIdx();setGlobal(i,p);setPopup(p);try{if(typeof render==="function")render();else{if(typeof renderPitch==="function")renderPitch();if(typeof renderPlayerInputs==="function")renderPlayerInputs();if(typeof renderSubs==="function")renderSubs()}}catch(e){}setTimeout(()=>{setLeft(i,p);fullNames();saveNow()},120)}
 function wireSelect(){let s=popupSelect();if(!s)return;fillSelect(false);if(s.dataset.v821evt==="1")return;s.dataset.v821evt="1";s.addEventListener("pointerdown",()=>fillSelect(false),true);s.addEventListener("focus",()=>fillSelect(false),true);s.addEventListener("change",()=>{let p=byId(s.value);if(p)apply(p)},true)}
 function box(){let b=q("rosterSuggestionsV821");if(!b){b=document.createElement("div");b.id="rosterSuggestionsV821";b.className="roster-suggestions-v821";document.body.appendChild(b)}return b}
 function show(input,i){let v=clean(input.value),b=box();if(!v){b.style.display="none";return}let ms=roster().filter(p=>clean(p.name).startsWith(v)).slice(0,10);if(!ms.length){b.style.display="none";return}let r=input.getBoundingClientRect();b.style.left=r.left+"px";b.style.top=(r.bottom+4)+"px";b.style.width=Math.max(r.width,220)+"px";b.innerHTML=ms.map(p=>`<div class="roster-suggestion-v821" data-id="${p.id}">${p.name}</div>`).join("");b.style.display="block";b.querySelectorAll(".roster-suggestion-v821").forEach(item=>item.addEventListener("mousedown",e=>{e.preventDefault();let p=byId(item.dataset.id);if(!p)return;activeIndex=i;input.value=p.name;setGlobal(i,p);setLeft(i,p);try{if(typeof render==="function")render()}catch(e){}setTimeout(()=>{setLeft(i,p);fullNames();saveNow()},120);b.style.display="none"}))}
 function wireAuto(){visibleInputs().forEach((input,i)=>{input.removeAttribute("list");if(input.dataset.v821auto==="1")return;input.dataset.v821auto="1";input.addEventListener("input",()=>{activeIndex=i;show(input,i)});input.addEventListener("focus",()=>{activeIndex=i;show(input,i)});input.addEventListener("change",()=>{let p=byName(input.value);if(!p)return;activeIndex=i;setGlobal(i,p);setLeft(i,p);try{if(typeof render==="function")render()}catch(e){}setTimeout(()=>{setLeft(i,p);fullNames();saveNow()},120)})})}
 function init(){document.addEventListener("click",e=>{let token=e.target.closest(".player,.player-token,.player-marker,.pitch-player,.player-chip,[data-player-index],[data-index]");if(token){let idx=idxFromEl(token);if(idx!==null)activeIndex=idx}setTimeout(()=>{clearOnNewDialog();wireSelect();fullNames()},120);let b=q("rosterSuggestionsV821");if(b&&!e.target.closest("#rosterSuggestionsV821")&&!e.target.matches("input"))b.style.display="none"},true);document.addEventListener("focusin",e=>{if(e.target&&e.target.tagName==="SELECT")setTimeout(wireSelect,50)},true);wireAuto();fullNames();setInterval(()=>{wireAuto();if(dlg()){clearOnNewDialog();wireSelect()}fullNames()},900)}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
