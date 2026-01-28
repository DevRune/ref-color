/* ======================
   DATA + STORAGE
====================== */

const DEFAULT_REF_COLORS = [];
const DEFAULT_TEAM_RULES = {};

let refColors = JSON.parse(localStorage.getItem("refColors")) || DEFAULT_REF_COLORS;
let teamRules = JSON.parse(localStorage.getItem("teamRules")) || DEFAULT_TEAM_RULES;

function save() {
  localStorage.setItem("refColors", JSON.stringify(refColors));
  localStorage.setItem("teamRules", JSON.stringify(teamRules));
}

/* ======================
   INIT
====================== */

renderRefColors();
renderTeamSelectors();
renderTeamRules();

/* ======================
   REFEREE COLORS
====================== */

function addRefColor() {
  const name = refName.value.trim();
  if (!name) return;

  refColors.push({ name, available: true });
  refName.value = "";
  save();
  renderRefColors();
  renderTeamRules();
}

function toggleAvailable(name) {
  refColors = refColors.map(c =>
    c.name === name ? { ...c, available: !c.available } : c
  );
  save();
}

function renderRefColors() {
  refList.innerHTML = "";
  refColors.forEach(c => {
    refList.innerHTML += `
      <div class="item">
        <label>
          <input class="checkbox" type="checkbox"
            ${c.available ? "checked" : ""}
            onchange="toggleAvailable('${c.name}')">
          ${c.name}
        </label>
        <button onclick="deleteRefColor('${c.name}')">❌ Verwijder</button>
      </div>
    `;
  });
}

function deleteRefColor(name) {
  if (!confirm(`Weet je zeker dat je ${name} wilt verwijderen?`)) return;
  refColors = refColors.filter(c => c.name !== name);
  save();
  renderRefColors();
  renderTeamRules();
  renderTeamSelectors();
}

/* ======================
   TEAM COLORS + RULES
====================== */

function addTeamColor() {
  const name = teamColorName.value.trim();
  if (!name || teamRules[name]) return;

  teamRules[name] = { softDisable: [], hardDisable: [], keeperSoft: [], keeperHard: [] };
  teamColorName.value = "";
  save();
  renderTeamRules();
  renderTeamSelectors();
}

function toggleRule(teamColor, type, refColor) {
  const list = teamRules[teamColor][type];
  if (list.includes(refColor)) {
    teamRules[teamColor][type] = list.filter(c => c !== refColor);
  } else {
    list.push(refColor);
  }
  save();
}

function renderTeamRules() {
  const teamRulesContainer = document.getElementById("teamRules");
  teamRulesContainer.innerHTML = "";

  Object.keys(teamRules).forEach(tc => {
    teamRulesContainer.innerHTML += `
      <div class="item">
        <b onclick="toggleTeamRules('${tc}')" style="cursor:pointer;">${tc} ▼</b>
        <div id="rules-${tc}" style="display:block; margin-left:10px;">
          <div class="small">Soft-disable referee kleuren</div>
          ${refColors.map(r => `
            <label class="small">
              <input type="checkbox"
                ${teamRules[tc].softDisable.includes(r.name) ? "checked" : ""}
                onchange="toggleRule('${tc}','softDisable','${r.name}')">
              ${r.name}
            </label>
          `).join("")}
          <div class="small">Hard-disable referee kleuren</div>
          ${refColors.map(r => `
            <label class="small">
              <input type="checkbox"
                ${teamRules[tc].hardDisable.includes(r.name) ? "checked" : ""}
                onchange="toggleRule('${tc}','hardDisable','${r.name}')">
              ${r.name}
            </label>
          `).join("")}
          <div class="small">Keeper soft-disable</div>
          ${refColors.map(r => `
            <label class="small">
              <input type="checkbox"
                ${teamRules[tc].keeperSoft.includes(r.name) ? "checked" : ""}
                onchange="toggleRule('${tc}','keeperSoft','${r.name}')">
              ${r.name}
            </label>
          `).join("")}
          <div class="small">Keeper hard-disable</div>
          ${refColors.map(r => `
            <label class="small">
              <input type="checkbox"
                ${teamRules[tc].keeperHard.includes(r.name) ? "checked" : ""}
                onchange="toggleRule('${tc}','keeperHard','${r.name}')">
              ${r.name}
            </label>
          `).join("")}
        </div>
      </div>
    `;
  });
}

// Toggle functie
function toggleTeamRules(tc) {
  const el = document.getElementById(`rules-${tc}`);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
}

/* ======================
   MATCH LOGIC (ref + keeper)
====================== */

function renderTeamSelectors() {
  [teamA, teamB].forEach(sel => {
    sel.innerHTML = "";
    Object.keys(teamRules).forEach(tc => {
      sel.innerHTML += `<option>${tc}</option>`;
    });
  });
}

function bepaalKleur() {
  const teams = [teamA.value, teamB.value];
  let soft = new Set();
  let hard = new Set();

  // Verzamel team rules
  teams.forEach(tc => {
    const rules = teamRules[tc];
    if (!rules) return;

    rules.softDisable.forEach(c => soft.add(c));
    rules.hardDisable.forEach(c => hard.add(c));
  });

  // Keeperkleuren soft-disabled
  const keeperColors = [keeperA.value.trim(), keeperB.value.trim()].filter(c => c);
  keeperColors.forEach(c => soft.add(c));

  // Filter beschikbare ref-kleuren
  let beschikbaar = refColors.filter(c => c.available && !hard.has(c.name));

  if (beschikbaar.length === 0) {
    advies.innerHTML = `❌ Geen geschikte referee kleur`;
    return;
  }

  // Perfecte kleuren = geen soft conflict
  let perfect = beschikbaar.filter(c => !soft.has(c.name));
  let kiesUit = perfect.length > 0 ? perfect : beschikbaar;

  const gekozen = kiesUit[Math.floor(Math.random() * kiesUit.length)];
  let alleOpties = kiesUit.map(c => c.name).join(", ");
  let reden = perfect.length > 0 ? "geen soft conflict" : "soft conflict aanwezig";

  advies.innerHTML = `
    ✅ <b>Advies:</b> ${gekozen.name} <br>
    ℹ️ Beschikbare opties: ${alleOpties} <br>
    ℹ️ Reden: ${reden}
    ℹ️ Soft: ${soft}
    ℹ️ Hard: ${hard}
  `;
}
