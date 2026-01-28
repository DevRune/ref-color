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
      </div>
    `;
  });
}

/* ======================
   TEAM COLORS + RULES
====================== */

function addTeamColor() {
  const name = teamColorName.value.trim();
  if (!name || teamRules[name]) return;

  teamRules[name] = { softDisable: [], hardDisable: [] };
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
  teamRulesContainer = document.getElementById("teamRules");
  teamRulesContainer.innerHTML = "";

  Object.keys(teamRules).forEach(tc => {
    teamRulesContainer.innerHTML += `
      <div class="item">
        <b>${tc}</b>

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
      </div>
    `;
  });
}

/* ======================
   MATCH LOGIC
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

  // Verzamel teamregels
  teams.forEach(tc => {
    const rules = teamRules[tc];
    if (!rules) return;
    rules.softDisable.forEach(c => soft.add(c));
    rules.hardDisable.forEach(c => hard.add(c));
  });

  // Filter beschikbare ref-kleuren
  let beschikbaar = refColors.filter(c => c.available && !hard.has(c.name));

  if (beschikbaar.length === 0) {
    advies.innerHTML = `❌ Geen geschikte referee kleur`;
    return;
  }

  // Perfecte kleuren = geen soft conflict
  let perfect = beschikbaar.filter(c => !soft.has(c.name));

  // Kies lijst voor random keuze
  let kiesUit = perfect.length > 0 ? perfect : beschikbaar;

  // Random keuze
  const gekozen = kiesUit[Math.floor(Math.random() * kiesUit.length)];

  // Toon alle opties + random advies
  let alleOpties = kiesUit.map(c => c.name).join(", ");

  let reden = perfect.length > 0 ? "geen soft conflict" : "soft conflict aanwezig";

  advies.innerHTML = `
    ✅ <b>Advies:</b> ${gekozen.name} <br>
    ℹ️ Beschikbare opties: ${alleOpties} <br>
    ℹ️ Reden: ${reden}
  `;
}