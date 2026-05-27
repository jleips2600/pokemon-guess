/*
  Demo controls.
  Simulates Twitch/StreamElements events
  for standalone GitHub Pages interaction.
*/

window.DEMO_MODE = true;

const DEMO = {

  users: [
    { name: "Ash", id: "1" },
    { name: "Misty", id: "2" },
    { name: "Brock", id: "3" },
    { name: "Gary", id: "4" },
  ],

  settingsSchema: [

    {
      key: "prefix",
      label: "Command Prefix",
      type: "text"
    },

    {
      key: "timeLimit",
      label: "Time Limit",
      type: "number"
    },

    {
      key: "cooldown",
      label: "Cooldown",
      type: "number"
    },

    {
      key: "oneGuessPerPlayer",
      label: "One Guess Per Player",
      type: "checkbox"
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

    {
      key: "gen1",
      label: "Gen 1",
      type: "checkbox"
    },

    {
      key: "gen2",
      label: "Gen 2",
      type: "checkbox"
    },

    {
      key: "gen3",
      label: "Gen 3",
      type: "checkbox"
    },

    {
      key: "gen4",
      label: "Gen 4",
      type: "checkbox"
    },

    {
      key: "gen5",
      label: "Gen 5",
      type: "checkbox"
    },

    {
      key: "gen6",
      label: "Gen 6",
      type: "checkbox"
    },

    {
      key: "gen7",
      label: "Gen 7",
      type: "checkbox"
    },

    {
      key: "gen8",
      label: "Gen 8",
      type: "checkbox"
    },

    {
      key: "gen9",
      label: "Gen 9",
      type: "checkbox"
    },

  ]

};


// ============================================================
//  CHAT
// ============================================================

function addChatMessage(user, message, type = "normal") {

  const msg = document.createElement("div");

  msg.className = `chatMessage ${type}`;

  msg.innerHTML = `
    <span class="chatUser">${user}:</span>
    <span class="chatText">${message}</span>
  `;

  const container = document.getElementById("chatMessages");

  container.appendChild(msg);

  container.scrollTop = container.scrollHeight;

}


// ============================================================
//  CHAT SIMULATION
// ============================================================

function simulateChat(user, userId, message) {

  addChatMessage(user, message);

  window.dispatchEvent(new CustomEvent("onEventReceived", {
    detail: {
      listener: "message",
      event: {
        data: {
          displayName: user,
          userId,
          text: message
        }
      }
    }
  }));

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

      simulateChat(
        user.name,
        user.id,
        guess
      );

    });


  document.getElementById("sendChatBtn")
    .addEventListener("click", () => {

      const input =
        document.getElementById("chatInput");

      const message = input.value.trim();

      if (!message) return;

      const user = DEMO.users[2];

      simulateChat(
        user.name,
        user.id,
        message
      );

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
