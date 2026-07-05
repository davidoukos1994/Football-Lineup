const formations = {
  "4-3-3": [
    ["GK", 50, 92],
    ["LB", 18, 75], ["CB", 39, 76], ["CB", 61, 76], ["RB", 82, 75],
    ["CM", 28, 56], ["CM", 50, 53], ["CM", 72, 56],
    ["LW", 22, 29], ["ST", 50, 24], ["RW", 78, 29]
  ],
  "4-4-2": [
    ["GK", 50, 92],
    ["LB", 18, 75], ["CB", 39, 76], ["CB", 61, 76], ["RB", 82, 75],
    ["LM", 20, 53], ["CM", 40, 55], ["CM", 60, 55], ["RM", 80, 53],
    ["ST", 40, 27], ["ST", 60, 27]
  ],
  "3-5-2": [
    ["GK", 50, 92],
    ["CB", 30, 76], ["CB", 50, 78], ["CB", 70, 76],
    ["LWB", 14, 55], ["CM", 35, 56], ["CM", 50, 52], ["CM", 65, 56], ["RWB", 86, 55],
    ["ST", 40, 27], ["ST", 60, 27]
  ],
  "4-2-3-1": [
    ["GK", 50, 92],
    ["LB", 18, 75], ["CB", 39, 76], ["CB", 61, 76], ["RB", 82, 75],
    ["DM", 40, 60], ["DM", 60, 60],
    ["LW", 22, 42], ["AM", 50, 39], ["RW", 78, 42],
    ["ST", 50, 23]
  ],
  "3-4-3": [
    ["GK", 50, 92],
    ["CB", 30, 76], ["CB", 50, 78], ["CB", 70, 76],
    ["LM", 18, 56], ["CM", 40, 55], ["CM", 60, 55], ["RM", 82, 56],
    ["LW", 24, 29], ["ST", 50, 24], ["RW", 76, 29]
  ],
  "5-3-2": [
    ["GK", 50, 92],
    ["LWB", 12, 73], ["CB", 32, 77], ["CB", 50, 79], ["CB", 68, 77], ["RWB", 88, 73],
    ["CM", 30, 54], ["CM", 50, 51], ["CM", 70, 54],
    ["ST", 40, 27], ["ST", 60, 27]
  ]
};

let currentFormation = "4-3-3";
let players = Array.from({ length: 11 }, (_, i) => ({ name: `Παίκτης ${i + 1}` }));
let subs = ["Αναπληρωματικός 1", "Αναπληρωματικός 2"];

const pitchPlayers = document.getElementById("playersOnPitch");
const playersForm = document.getElementById("playersForm");
const formationSelect = document.getElementById("formation");
const teamName = document.getElementById("teamName");
const teamTitle = document.getElementById("teamTitle");
const logoInput = document.getElementById("teamLogo");
const logoPreview = document.getElementById("teamLogoPreview");
const headerLogo = document.getElementById("headerLogo");
const subsList = document.getElementById("subsList");
const subsPreview = document.getElementById("subsPreview");

function render() {
  renderPitch();
  renderPlayerInputs();
  renderSubs();
  teamTitle.textContent = teamName.value || "Η Ομάδα μου";
}

function renderPitch() {
  pitchPlayers.innerHTML = "";
  formations[currentFormation].forEach(([position, x, y], index) => {
    const player = document.createElement("button");
    player.className = "player";
    player.type = "button";
    player.style.left = `${x}%`;
    player.style.top = `${y}%`;
    player.innerHTML = `<span><small>${position}</small>${players[index]?.name || ""}</span>`;
    player.title = "Πάτησε για αλλαγή ονόματος";
    player.addEventListener("click", () => {
      const newName = prompt(`Όνομα για θέση ${position}:`, players[index]?.name || "");
      if (newName !== null) {
        players[index].name = newName.trim();
        render();
      }
    });
    pitchPlayers.appendChild(player);
  });
}

function renderPlayerInputs() {
  playersForm.innerHTML = "";
  formations[currentFormation].forEach(([position], index) => {
    const row = document.createElement("div");
    row.className = "player-row";
    row.innerHTML = `
      <strong>${position}</strong>
      <input type="text" value="${escapeHtml(players[index]?.name || "")}" data-index="${index}" />
    `;
    row.querySelector("input").addEventListener("input", (event) => {
      players[index].name = event.target.value;
      renderPitch();
    });
    playersForm.appendChild(row);
  });
}

function renderSubs() {
  subsList.innerHTML = "";
  subsPreview.innerHTML = "";

  subs.forEach((sub, index) => {
    const row = document.createElement("div");
    row.className = "sub-row";
    row.innerHTML = `
      <input type="text" value="${escapeHtml(sub)}" data-index="${index}" />
      <button type="button" aria-label="Διαγραφή">×</button>
    `;
    row.querySelector("input").addEventListener("input", (event) => {
      subs[index] = event.target.value;
      renderSubsPreview();
    });
    row.querySelector("button").addEventListener("click", () => {
      subs.splice(index, 1);
      renderSubs();
    });
    subsList.appendChild(row);
  });

  renderSubsPreview();
}

function renderSubsPreview() {
  subsPreview.innerHTML = "";
  subs.filter(Boolean).forEach((sub) => {
    const pill = document.createElement("span");
    pill.className = "sub-pill";
    pill.textContent = sub;
    subsPreview.appendChild(pill);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

formationSelect.addEventListener("change", (event) => {
  currentFormation = event.target.value;
  render();
});

teamName.addEventListener("input", render);

logoInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    logoPreview.src = reader.result;
    headerLogo.src = reader.result;
    headerLogo.style.display = "block";
  };
  reader.readAsDataURL(file);
});

document.getElementById("addSub").addEventListener("click", () => {
  subs.push(`Αναπληρωματικός ${subs.length + 1}`);
  renderSubs();
});

document.getElementById("reset").addEventListener("click", () => {
  if (!confirm("Θέλεις σίγουρα να καθαρίσουν όλα;")) return;
  currentFormation = "4-3-3";
  formationSelect.value = currentFormation;
  players = Array.from({ length: 11 }, (_, i) => ({ name: `Παίκτης ${i + 1}` }));
  subs = [];
  teamName.value = "Η Ομάδα μου";
  logoInput.value = "";
  logoPreview.removeAttribute("src");
  headerLogo.removeAttribute("src");
  headerLogo.style.display = "none";
  render();
});

document.getElementById("exportImage").addEventListener("click", async () => {
  const area = document.querySelector(".pitch-wrap");
  const canvas = await html2canvas(area, { backgroundColor: "#e2e8f0", scale: 2 });
  const link = document.createElement("a");
  link.download = "football-lineup.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

render();
