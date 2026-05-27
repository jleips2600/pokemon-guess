window.addEventListener("DOMContentLoaded", () => {

  const panel = document.createElement("div");
  panel.id = "demoPanel";

  panel.innerHTML = `
    <button id="startBtn">Start Round</button>
    <button id="correctBtn">Correct Guess</button>
    <button id="wrongBtn">Wrong Guess</button>
    <button id="shinyBtn">Force Shiny</button>
  `;

  document.body.appendChild(panel);

  document.getElementById("startBtn")
    .addEventListener("click", () => {
      GAME.startRound();
    });

  document.getElementById("correctBtn")
    .addEventListener("click", () => {
      GAME.handleChatMessage(
        "Ash",
        "1",
        CONFIG.prefix + SESSION.pokemon.name
      );
    });

  document.getElementById("wrongBtn")
    .addEventListener("click", () => {
      GAME.handleChatMessage(
        "Misty",
        "2",
        CONFIG.prefix + "pikachu"
      );
    });

});
