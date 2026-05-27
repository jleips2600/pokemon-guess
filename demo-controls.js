/*
  Demo controls.
  Simulates Twitch/StreamElements events
  for standalone GitHub Pages interaction.
*/

window.DEMO_MODE = true;

const DEMO = {

  users: [
    { name: "Pokemon Trainer", id: "0", color: "#7FE7D6" },
    { name: "Ash", id: "1", color: "#FF3B30" },
    { name: "Misty", id: "2", color: "#007C91" },
    { name: "Brock", id: "3", color: "#556B2F" },
    { name: "Gary", id: "4", color: "#5B2C83" },
  ],

  settingsSchema: [
    
    {
      key: "prefix",
      label: "Guess Prefix",
      type: "text"
    },

    {
      key: "colorPrimary",
      label: "Primary Color",
      type: "color"
    },

    {
      key: "colorSecondary",
      label: "Secondary Color",
      type: "color"
    },

    {
      key: "colorTertiary",
      label: "Tertiary Color",
      type: "color"
    },

  ]

};


// ============================================================
//  CHAT
// ============================================================

function addChatMessage(name, color, message, type = "normal") {

  const msg = document.createElement("div");

  msg.className = `chatMessage ${type}`;

  msg.innerHTML = `
    <span class="chatUser" style="color: ${color};">${name}:</span>
    <span class="chatText">${message}</span>
  `;

  const container = document.getElementById("chatMessages");

  container.appendChild(msg);

  container.scrollTop = container.scrollHeight;

}

// ============================================================
//  SETTINGS PANEL
// ============================================================

function buildSettingsPanel() {

  const panel = document.getElementById("settingsPanel");

  DEMO.settingsSchema.forEach(setting => {

    const row = document.createElement("div");

    row.className = "settingRow";

    const label = document.createElement("label");

    label.textContent = setting.label;

    const input = document.createElement("input");

    input.type = setting.type;

    if (setting.type === "checkbox") {

      input.checked = CONFIG[setting.key];

    } else {

      input.value = CONFIG[setting.key];

    }

    input.addEventListener("input", () => {

      CONFIG[setting.key] =
        setting.type === "number"
          ? Number(input.value)
          : setting.type === "checkbox"
            ? input.checked
            : input.value;

      applyConfigChanges();

    });

    row.appendChild(label);
    row.appendChild(input);

    panel.appendChild(row);

  });

}


// ============================================================
//  APPLY CONFIG CHANGES
// ============================================================

function applyConfigChanges() {

  document.documentElement.style.setProperty(
    "--color-primary",
    CONFIG.colorPrimary
  );

  document.documentElement.style.setProperty(
    "--color-secondary",
    CONFIG.colorSecondary
  );

  document.documentElement.style.setProperty(
    "--color-tertiary",
    CONFIG.colorTertiary
  );

}


// ============================================================
//  BUTTON EVENTS
// ============================================================

function bindDemoButtons() {

  document.getElementById("correctGuessBtn")
    .addEventListener("click", () => {

      if (!SESSION.pokemon) return;

      const user = DEMO.users[0];

      const guess =
        CONFIG.prefix + SESSION.pokemon.name;

      addChatMessage(user.name, user.color, guess);

      GAME.correctGuess(user.name, user.id);
    });


  document.getElementById("sendChatBtn")
    .addEventListener("click", () => {

      const input = document.getElementById("chatInput");

      const message = input.value.trim();

      if (!message) return;

      const user = DEMO.users[0];

      addChatMessage(user.name, user.color, message);


      input.value = "";

    });

}


// ============================================================
//  INITIALIZE
// ============================================================

window.addEventListener("DOMContentLoaded", () => {

  buildSettingsPanel();

  bindDemoButtons();

});

// ============================================================
//  MOCK CHAT
// ============================================================

setInterval(() => {
  const user = DEMO.users[1 + Math.floor(Math.random() * 3)];
  addChatMessage(user.name, user.color, CONFIG.prefix + GAME.pickRandomPokemon().name);
}, 4000);
