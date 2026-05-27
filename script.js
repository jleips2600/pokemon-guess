// ============================================================
//  CONFIG
// ============================================================
const TOTAL_GENS = 9;
const SHINY_RATE = 1 / 100;

const CONFIG = {
  prefix:                        "?",
  timeLimit:                     30,
  cooldown:                      0,
  startMode:                     "auto",
  startTrigger:                  "!start",
  channelPointsRedemption:       "Pokemon Guess",

  oneGuessPerPlayer:             true,

  colorPrimary:                  "#ffcb05",
  colorSecondary:                "#2a75bb",
  colorTertiary:                 "#13288d",

  jwtToken:                      "",
  statsCommand:                  "!pokedex",
  resetCommand:                  "!resetallpokedex",

  gen1: true,
  gen2: true,
  gen3: true,
  gen4: true,
  gen5: true,
  gen6: true,
  gen7: true,
  gen8: true,
  gen9: true,
};


// ============================================================
//  OWNER
// ============================================================
const OWNER = {
  id:        null,
  name:      null,
  accountId: null,
};


// ============================================================
//  SESSION
// ============================================================
const SESSION = {
  state:             "idle",
  isEditorMode:      false,
  pokemon:           null,
  isShiny:           false,
  timeLeft:          0,
  timerTimeline:     null,
  cooldownTimer:     null,
  pokemons:          [],
  splitTitle:        null,
  splitTitleStroke:  null,
  splitTitleStroke2: null,
  roundGuessers:     [],
  sparkleTimeline:   null,
  

  is(s)  { return this.state === s; },
  set(s) {
    console.log("[SESSION] " + this.state + " -> " + s);
    this.state = s;
  },
};


// ============================================================
//  DOM
// ============================================================
const DOM = {
  pokemonImage:           document.getElementById("pokemonImage"),
  starContainer:          document.getElementById("starContainer"),
  star1:                  document.getElementById("star1"),
  star2:                  document.getElementById("star2"),
  star3:                  document.getElementById("star3"),
  star4:                  document.getElementById("star4"),
  star5:                  document.getElementById("star5"),
  flash:                  document.getElementById("flash"),
  ring:                   document.getElementById("ring"),
  pokemonImageContainer:  document.getElementById("pokemonImageContainer"),
  pokeball:               document.getElementById("pokeball"),
  timerBar:               document.getElementById("timerBar"),
  timerBarContainer:      document.getElementById("timerBarContainer"),
  messagePill:            document.getElementById("messagePill"),
  winPill:                document.getElementById("winPill"),
  winPillRank:            document.getElementById("winPillRank"),
  winPillName:            document.getElementById("winPillName"),
  winPillScore:           document.getElementById("winPillScore"),
  losePill:               document.getElementById("losePill"),
  losePillName:           document.getElementById("losePillName"),
  title:                  document.getElementById("title"),
  titleStroke:            document.getElementById("titleStroke"),
  titleStroke2:           document.getElementById("titleStroke2"),
  mainContainer:          document.getElementById("mainContainer"),
  displayContainer:       document.getElementById("displayContainer"),
};


// ============================================================
//  STORE
// ============================================================
const STORE = {
  key:      "pokemonGuessData",
  users:    [],
  genCache: {},

  async load() {
    let stored = null;
    try {
      stored = await SE_API.store.get(this.key);
    } catch (err) {
      console.error("[STORE] Load failed:", err);
    }

    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      this.users    = Array.isArray(stored.users) ? stored.users : [];
      this.genCache = (stored.genCache && typeof stored.genCache === "object") ? stored.genCache : {};
      console.log("[STORE] Loaded " + this.users.length + " users, " + Object.keys(this.genCache).length + "/" + TOTAL_GENS + " gens cached");
    } else {
      this.users    = [];
      this.genCache = {};
      console.log("[STORE] No data found — starting fresh");
      await this.save();
    }
  },

  async save() {
    if (SESSION.isEditorMode) {
      console.log("[STORE] Editor mode — skipping save");
      return;
    }
    try {
      await SE_API.store.set(this.key, {
        genCache: this.genCache,
        users:    this.users,
      });
    } catch (err) {
      console.warn("[STORE] Save failed — changes are in-memory only:", err);
    }
  },

  getUser(userId) {
    if (!Array.isArray(this.users)) return null;
    return this.users.find(e => e.userId === userId) ?? null;
  },

  upsertUser(name, userId) {
    let entry = this.getUser(userId);
    if (!entry) {
      entry = {
        userId,
        userName: name,
        pokedex:  [],
        caught:   0,
        score:    0,
        shiny:    0,
      };
      this.users.push(entry);
    }
    return entry;
  },

  getRank(userId) {
    if (!Array.isArray(this.users) || this.users.length === 0) return 1;
    const sorted = [...this.users].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const idx    = sorted.findIndex(e => e.userId === userId);
    return idx === -1 ? this.users.length : idx + 1;
  },

  reset() {
    this.users = [];
    this.save();
  },
};


// ============================================================
//  API
// ============================================================
const API = {

  async fetchGen(genNum) {
    const url = "https://pokeapi.co/api/v2/generation/" + genNum;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gen fetch failed: " + res.status);
    const data = await res.json();
    return data.pokemon_species.map(p => ({
      name: formatPokemonName(p.name),
      id:   parseInt(p.url.split("/").filter(Boolean).pop(), 10),
    }));
  },

  getPokemonImageUrl(id, isShiny = false) {
    const base = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
    return isShiny ? base + "shiny/" + id + ".png" : base + id + ".png";
  },

  async botSay(message) {
    if (!message || typeof message !== "string") return false;
    if (!CONFIG.jwtToken) return false;

    let trimmed = message.trim().substring(0, 500);
    if (!trimmed) return false;

    try {
      const url = "https://api.streamelements.com/kappa/v2/bot/" + OWNER.accountId + "/say";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Accept":        "application/json",
          "Content-Type":  "application/json;charset=utf-8",
          "Authorization": "Bearer " + CONFIG.jwtToken,
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (res.ok) {
        console.log("[BOT] -> " + trimmed.substring(0, 100));
        return true;
      }

      if      (res.status === 401) console.error("[BOT] Invalid/expired JWT");
      else if (res.status === 429) console.warn("[BOT] Rate limited");
      else                         console.error("[BOT] Failed: " + res.status);

      return false;

    } catch (err) {
      console.error("[BOT] Network error:", err);
      return false;
    }
  },
};


// ============================================================
//  HELPERS
// ============================================================
const formatNumber = (n) => {
  n = Number(n);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, "")    + "k";
  return n.toString();
};

function loadScript(src) {
  return new Promise(resolve => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

const POKEMON_HYPHEN_KEEP = {
  "porygon-z":  "Porygon-Z",
  "jangmo-o":   "Jangmo-o",
  "hakamo-o":   "Hakamo-o",
  "kommo-o":    "Kommo-o",
  "ho-oh":      "Ho-Oh",
  "chi-yu":     "Chi-Yu",
  "ting-lu":    "Ting-Lu",
  "chien-pao":  "Chien-Pao",
  "wo-chien":   "Wo-Chien",
};

function formatPokemonName(slug) {
  if (POKEMON_HYPHEN_KEEP[slug]) return POKEMON_HYPHEN_KEEP[slug];
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}


// ============================================================
//  STAR BURST
// ============================================================
function starBurst() {

  const x = gsap.getProperty(DOM.pokeball, "x");
  const y = gsap.getProperty(DOM.pokeball, "y");

  gsap.set(DOM.starContainer, { x, y });
  gsap.set(DOM.ring, { clearProps: "all" });
  gsap.set(DOM.ring, { x, y, scaleY: 0.3 });

  const stars = [
    { el: DOM.star1, scale: 0.7,  x: gsap.utils.random(-60, -75), y: gsap.utils.random(-10, -25), dur: gsap.utils.random(.20, .30) },
    { el: DOM.star2, scale: 1.0,  x: gsap.utils.random(-45, -55), y: gsap.utils.random(-30, -45), dur: gsap.utils.random(.25, .35) },
    { el: DOM.star3, scale: 1.3,  x: gsap.utils.random(-10, 10),  y: gsap.utils.random(-60, -75), dur: gsap.utils.random(.45, .55) },
    { el: DOM.star4, scale: 1.0,  x: gsap.utils.random(45, 55),   y: gsap.utils.random(-30, -45), dur: gsap.utils.random(.25, .35) },
    { el: DOM.star5, scale: 0.7,  x: gsap.utils.random(60, 75),   y: gsap.utils.random(-10, -25), dur: gsap.utils.random(.20, .30) },
  ];

  gsap.set(stars.map(s => s.el), { clearProps: "all" });

  gsap.to(DOM.pokeball, {
    duration: 0.1,
    scale: "+=0.05",
    y: "+=3",
    ease: "power2.out",
    yoyo: true,
    repeat: 1,
  });

  gsap.to(DOM.ring, {
    duration: 0.25,
    scale: 1.5,
    autoAlpha: 0,
  });

  stars.forEach(({ el, scale, x, y, dur }) => {
    gsap.timeline()
      .set(el, { autoAlpha: 1, rotation: gsap.utils.random(-90, 90) })
      .to(el, {
        autoAlpha: 1,
        scale,
        x, y,
        rotation: "+=" + gsap.utils.random(0, 90),
        duration: dur,
        ease: "power2.out",
      })
      .to(el, {
        scale: 0,
        rotation: gsap.utils.random(-90, 90),
        x: "+=x",
        y: "+=y",
        duration: 0.15,
        ease: "power2.in",
      });
  });
}


// ============================================================
//  GAME
// ============================================================
const GAME = {

  async init() {
    console.log("[GAME] Initializing...");

    await Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/SplitText.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/Physics2DPlugin.min.js"),
    ]);

    gsap.registerPlugin(SplitText, Physics2DPlugin);

    document.documentElement.style.setProperty("--color-primary",   CONFIG.colorPrimary);
    document.documentElement.style.setProperty("--color-secondary", CONFIG.colorSecondary);
    document.documentElement.style.setProperty("--color-tertiary",  CONFIG.colorTertiary);

    await STORE.load();

    const cachedGenCount = Object.keys(STORE.genCache).length;
    if (cachedGenCount < TOTAL_GENS) {
      console.log("[GAME] Cache has " + cachedGenCount + "/" + TOTAL_GENS + " gens — fetching missing...");
      const missingGens = [];
      for (let i = 1; i <= TOTAL_GENS; i++) {
        if (!STORE.genCache[i]) missingGens.push(i);
      }
      await Promise.all(
        missingGens.map(async (genNum) => {
          try {
            const pokemon = await API.fetchGen(genNum);
            STORE.genCache[genNum] = pokemon;
            console.log("[GAME] Cached gen " + genNum + " (" + pokemon.length + " pokemon)");
          } catch (err) {
            console.error("[GAME] Failed to fetch gen " + genNum + ":", err);
          }
        })
      );
      await STORE.save();
    } else {
      console.log("[GAME] All " + TOTAL_GENS + " gens cached");
    }

    SESSION.pokemons = [];
    for (let i = 1; i <= TOTAL_GENS; i++) {
      if (CONFIG["gen" + i] && STORE.genCache[i]) {
        SESSION.pokemons.push(...STORE.genCache[i]);
      }
    }
    console.log("[GAME] " + SESSION.pokemons.length + " pokemon ready from selected gens");

    SESSION.splitTitle        = new SplitText(DOM.title,        { type: "chars, words" });
    SESSION.splitTitleStroke  = new SplitText(DOM.titleStroke,  { type: "chars, words" });
    SESSION.splitTitleStroke2 = new SplitText(DOM.titleStroke2, { type: "chars, words" });

    SESSION.set("idle");
    console.log("[GAME] Ready" + (SESSION.isEditorMode ? " [EDITOR MODE — scores will not be saved]" : ""));

    if (CONFIG.startMode === "auto") {
      GAME.startRound();
    } else {
      console.log("[GAME] Waiting for trigger — mode: " + CONFIG.startMode);
    }
  },

  startCooldown() {
    SESSION.set("cooldown");
    console.log("[GAME] Cooldown started (" + CONFIG.cooldown + "s)");
    SESSION.cooldownTimer = gsap.delayedCall(CONFIG.cooldown, () => GAME.afterCooldown());
  },

  afterCooldown() {
    SESSION.cooldownTimer = null;
    console.log("[GAME] Cooldown complete");
    SESSION.set("idle");

    if (CONFIG.startMode === "auto") {
      console.log("[GAME] Auto-starting next round");
      GAME.startRound();
    } else {
      const triggerHint = CONFIG.startMode === "chatCommand"
        ? "trigger: \"" + CONFIG.startTrigger + "\" in chat"
        : "channel point redemption: \"" + CONFIG.channelPointsRedemption + "\"";
      console.log("[GAME] Idle — waiting for " + triggerHint);
    }
  },

  pickRandomPokemon() {
    if (!SESSION.pokemons.length) {
      console.warn("[GAME] Pokemon list empty — no gens selected or cache missing");
      return null;
    }
    return SESSION.pokemons[Math.floor(Math.random() * SESSION.pokemons.length)];
  },

  startRound() {
    if (!SESSION.is("idle")) return;
    SESSION.set("active");

    SESSION.isShiny      = Math.random() < SHINY_RATE;


    if (SESSION.isShiny) {
      API.botSay("✨✨ A SHINY Pokémon approaches.. Type "
        + CONFIG.prefix + "PokemonName to guess! "
        + CONFIG.timeLimit + "s on the clock.");
    } else {
      API.botSay("🎮 Who's that Pokémon? Type "
        + CONFIG.prefix + "PokemonName to guess! "
        + CONFIG.timeLimit + "s on the clock.");
    }

    SESSION.roundGuessers = [];

    gsap.set(
      [DOM.pokemonImageContainer, DOM.pokemonImage, DOM.timerBarContainer,
       DOM.timerBar, DOM.winPill, DOM.losePill,
       DOM.title, DOM.titleStroke, DOM.titleStroke2],
      { clearProps: "all" }
    );
    gsap.set(
      [SESSION.splitTitle.chars,       SESSION.splitTitleStroke.chars,  SESSION.splitTitleStroke2.chars,
       SESSION.splitTitle.words,       SESSION.splitTitleStroke.words,  SESSION.splitTitleStroke2.words],
      { rotation: 0, scale: 1, autoAlpha: 1, y: 0 }
    );

    DOM.winPill.style.width = "auto";

    SESSION.pokemon                        = this.pickRandomPokemon();
    DOM.pokemonImage.src                   = API.getPokemonImageUrl(SESSION.pokemon.id, SESSION.isShiny);
    DOM.pokemonImage.style.filter          = "brightness(0)";

    let newAngles = Array.from(
      { length: SESSION.splitTitle.chars.length },
      () => gsap.utils.random(-15, 15)
    );

    SESSION.timerTimeline = gsap.timeline();

    SESSION.timerTimeline
      .set(".title", { autoAlpha: 1 })
      .from(SESSION.splitTitle.words,        { autoAlpha: 0, scale: 0, y: 50, stagger: 1, ease: "power3.in" })
      .from(SESSION.splitTitleStroke.words,  { autoAlpha: 0, scale: 0, y: 50, stagger: 1, ease: "power2.in" }, "<")
      .from(SESSION.splitTitleStroke2.words, { autoAlpha: 0, scale: 0, y: 50, stagger: 1, delay: 0.05, ease: "power1.in" }, "<")
      .from(DOM.pokemonImageContainer, { autoAlpha: 0, scale: 0, duration: 1, ease: "back.out(2)", onComplete: startSparkles }, "+=.5")
      .from(DOM.timerBarContainer,     { autoAlpha: 0, duration: 1, scaleX: 0, ease: "back.out(2)" }, "<")
      .to(
        [SESSION.splitTitle.chars, SESSION.splitTitleStroke.chars, SESSION.splitTitleStroke2.chars],
        {
          delay: 1,
          rotation: (i) => newAngles[i % SESSION.splitTitle.chars.length],
          duration: 1,
          onRepeat: () => {
            newAngles = Array.from(
              { length: SESSION.splitTitle.chars.length },
              () => gsap.utils.random(-15, 15)
            );
          },
          ease: "elastic",
          repeat: -1,
          repeatRefresh: true,
        }
      )
      .to(DOM.timerBar, {
        width: 0,
        duration: CONFIG.timeLimit,
        onUpdate: function () {
          SESSION.timeLeft = CONFIG.timeLimit - this.time();
        },
        ease: "none",
        onComplete: () => gsap.delayedCall(.25, () => GAME.timerEnd()),
      }, "<");

  },

  timerEnd() {

    if (!SESSION.is("active")) return;
    SESSION.set("revealing");

    SESSION.timerTimeline.pause();

    DOM.losePillName.textContent = SESSION.pokemon.name + " got away!";

    gsap.timeline()
      .to(DOM.pokemonImageContainer,  { scale: 1.1, duration: 0.2, ease: "power1.out", yoyo: true, repeat: 1 })
      .set(DOM.pokemonImage,          { filter: "none", delay: 0.1 }, "<")
      .to(DOM.timerBarContainer,      { autoAlpha: 0, width: 0, duration: 0.25 })
      .add(() => {}, "+=0.5")
      .fromTo(DOM.losePill,
        { autoAlpha: 0, width: 0 },
        { autoAlpha: 1, width: "auto", duration: 0.5 }
      )
      .to(DOM.pokemonImage, {autoAlpha: 0, delay: 1.5, duration: 0.5, ease: "power3.in", filter: "blur(10px)", x: gsap.utils.random([-300, 300])  })
      .add(() => gsap.delayedCall(3, () => GAME.endRound()));
  },

  correctGuess(name, userId) {
    if (!SESSION.is("active")) return;
    SESSION.set("revealing");

    const entry      = STORE.upsertUser(name, userId);
    const alreadyCaught = entry.pokedex.includes(SESSION.pokemon.name);
    const pointValue = SESSION.isShiny ? 10 : 1;

    entry.caught += 1;
    if (SESSION.isShiny) entry.shiny += 1;
    entry.score  += pointValue;

    if (!alreadyCaught) {
      entry.pokedex.push(SESSION.pokemon.name);
    }

    STORE.save();

    const pokeballXdelta = gsap.utils.random(-300, 300);

    DOM.winPillName.textContent  = name;
    DOM.winPillScore.textContent = formatNumber(entry.score - pointValue);

    SESSION.timerTimeline.pause();

    gsap.timeline()
      .to(DOM.pokemonImageContainer,  { scale: 1.1, duration: 0.2, ease: "power1.out", yoyo: true, repeat: 1 })
      .set(DOM.pokemonImage,          { filter: "none", delay: 0.1 }, "<")
      .to(DOM.timerBarContainer,      { autoAlpha: 0, width: 0, duration: 0.25 })
      .add(() => {}, "+=0.25")
      .from(DOM.winPill,              { autoAlpha: 0, width: 0, duration: 0.5, ease: "power3.in" })

      // THROW POKEBALL ANIMATION
      .set(DOM.pokeball, {
        x: 0,
        y: 200,
        autoAlpha: 1,
        rotation: 0,
        scale: 1
      })

      .to(DOM.pokeball, {
        duration: 0.45,
        x: pokeballXdelta,
        y: -300,
        scale: .8,
        rotation: -pokeballXdelta / 300 * 360,
        ease: "power2.out",
      })

      .to(DOM.pokeball, {
        duration: 0.25,
        x: 0,
        y: -100,
        scale: .6,
        rotation: -pokeballXdelta / 300 * gsap.utils.random(540, 720),
        ease: "power2.in",
      })

      // IMPACT SQUASH
      .to(DOM.pokeball, {
        duration: 0.12,
        scaleX: .7,
        scaleY: 0.5,
        ease: "power1.in"
      })

      // BOUNCE UP
      .to(DOM.pokeball, {
        duration: 0.18,
        x: pokeballXdelta * .25,
        y: -200,
        scale: .6,
        rotation: -Math.sign(pokeballXdelta) * gsap.utils.random(-45, 45),
        ease: "power2.out"
      })

      .set(DOM.flash, {
        x: pokeballXdelta * .25,
        y: -190,
        scale: 0,
        autoAlpha: 1,
      })
      .to(DOM.flash, {
        scale: 1,
        autoAlpha: 1,
        duration: .5,
        ease: "power2.in",
        onComplete: () => {
          gsap.to(DOM.flash, {
            scale: 2,
            autoAlpha: 0,
            duration: 0.5,
            ease: "power2.out"
          });
        }
      })

      .set(DOM.pokemonImage, {
        delay: 0.15,
        filter: "brightness(0) invert(1)",
      }, "<")

      .to(DOM.pokemonImage, {
        duration: 0.25,
        scaleX: 0.5,
        scaleY: 1.5,
        ease: "power1.in"
      })

      .to(DOM.pokemonImage, {
        x: pokeballXdelta * .25,
        y: -200,
        scale: 0,
        ease: "power2.out"
      }, "<")

      // DROP
      .to(DOM.pokeball, {
        duration: 0.5,
        y: 100,
        ease: "bounce.out"
      })

      .set(DOM.pokeball, { transformOrigin: "50% 75%" })

      // WIGGLE
      .to(DOM.pokeball, { delay: 1, rotation: 20, duration: 0.2,
        onStart: () => {
          gsap.to(DOM.pokeball, {
            duration: 0.2,
            delay: 0.1,
            y: "+=3",
            scaleX: "+=0.025",
            scaleY: "-=0.025",
            ease: "power1.inOut",
            yoyo: true,
            repeat: 5,
          });
        }
      })
      .to(DOM.pokeball, { rotation: -20, duration: 0.2 })
      .to(DOM.pokeball, { rotation: 17,  duration: 0.2 })
      .to(DOM.pokeball, { rotation: -13, duration: 0.2 })
      .to(DOM.pokeball, { rotation: 7,   duration: 0.2 })
      .to(DOM.pokeball, { rotation: 0,   duration: 0.2 })

      .to(DOM.pokeball, { duration: .5 })

      .call(() => {
        
        starBurst();

        const scoreRect = DOM.winPillScore.getBoundingClientRect();
        const ballRect  = DOM.pokeball.getBoundingClientRect();

        const deltaX = scoreRect.right - 32 - (ballRect.left + ballRect.width / 2);
        const deltaY = (scoreRect.top + scoreRect.height / 2) - 15 - (ballRect.top + ballRect.height / 2);

        const currentX = gsap.getProperty(DOM.pokeball, "x");
        const currentY = gsap.getProperty(DOM.pokeball, "y");

        gsap.timeline()
        .to(DOM.pokeball, {
          delay: 1.5,
          x: currentX + deltaX,
          y: currentY + deltaY,
          duration: 0.5,
          ease: "power2.in",
          scale: 0.2,
          zIndex: 9999,
          autoAlpha: 0
        })
        .to(DOM.winPillScore, {
          yoyo: true,
          repeat: 1,
          fontSize: "+=5",
          duration: 0.25,
          ease: "power3.inOut",
          onRepeat: () => {
            DOM.winPillScore.textContent = formatNumber(entry.score);
          },
          onComplete: () => {
            if (alreadyCaught) {
              this.showMessage(name + " caught " + SESSION.pokemon.name + "!", 3000);
            } else {
              this.showMessage(name + " caught " + SESSION.pokemon.name + "! Added to Pokédex!", 3000);
            }
            gsap.delayedCall(5, () => GAME.endRound(true));
          }
        });
      })

      
  },

  endRound(winnerRound = false) {

    SESSION.timerTimeline.kill();

    gsap.timeline()
      .to(DOM.pokemonImageContainer,                      { scale: 0, duration: 1, ease: "back.in(2)" })
      .to(DOM.pokeball,                                   { scale: 0, duration: 1, x: 0, y: 0, ease: "back.in(2)" }, "<")
      .to([DOM.title, DOM.titleStroke, DOM.titleStroke2], { autoAlpha: 0, y: 35, duration: 1, ease: "back.in(4)" }, "<")
      .to(DOM.timerBarContainer,                          { autoAlpha: 0, onComplete: () => GAME.startCooldown() });

    if (winnerRound) {
      gsap.to(DOM.winPill,  { autoAlpha: 0, y: -45, duration: 1, ease: "back.in(4)" });
    } else {
      gsap.to(DOM.losePill, { autoAlpha: 0, y: -45, duration: 1, ease: "back.in(4)" });
    }

    stopSparkles();
  },

  getStats(name, userId) {
    const entry = STORE.getUser(userId);
    if (!entry) {
      API.botSay(name + " has no stats yet — start guessing!");
      return;
    }
    const rank = STORE.getRank(userId);
    API.botSay(
      `${name} | Rank: ${rank} | ` +
      `Caught: ${entry.caught} | ` +
      `Shinies: ${entry.shiny} | ` +
      `Score: ${entry.score} | ` +
      `Pokédex: ${entry.pokedex.length}`
    );
  },

  showMessage(message, duration = 3000) {
    gsap.set(DOM.messagePill, { clearProps: "all" });
    DOM.messagePill.textContent = message;

    gsap.timeline()
      .from(DOM.messagePill, {
        autoAlpha: 0,
        y: 50,
        duration: 1,
        delay: 1,
        ease: "power2.out",
      })
      .to(DOM.messagePill, {
        autoAlpha: 0,
        //y: -50,
        scale: 0,
        duration: .5,
        delay: duration / 1000,
        ease: "power2.in",
      });
  },

  resetScores() {
    STORE.reset();
    API.botSay("All scores have been reset for the Pokémon Guess Widget.");
  },

  handleChatMessage(user, userId, message) {
    console.log("[CHAT]", user, userId, message);

    switch (message.toLowerCase()) {
      case CONFIG.statsCommand:
        this.getStats(user, userId);
        return;
      case CONFIG.resetCommand:
        if (userId === OWNER.id) this.resetScores();
        return;
      case CONFIG.startTrigger:
        if (CONFIG.startMode === "chatCommand" && SESSION.is("idle")) {
          GAME.startRound();
        }
        return;
    }

    if (!message.startsWith(CONFIG.prefix)) return;
    if (!SESSION.is("active"))              return;

    if (SESSION.roundGuessers.includes(userId)) {
      if (CONFIG.oneGuessPerPlayer) return;
    } else {
      SESSION.roundGuessers.push(userId);
    }

    const pokemonNameNorm = SESSION.pokemon.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const guess = message
      .slice(CONFIG.prefix.length)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (!guess) return;

    if (guess === pokemonNameNorm) {
      this.correctGuess(user, userId);
    }
  },
};


// ============================================================
//  WIDGET EVENTS
// ============================================================
window.addEventListener("onWidgetLoad", function (obj) {
  const { fieldData, channel, overlay } = obj.detail;

  Object.assign(CONFIG, fieldData);
  Object.freeze(CONFIG);

  OWNER.id        = channel.providerId;
  OWNER.name      = channel.userName;
  OWNER.accountId = channel.id;

  SESSION.isEditorMode = overlay.isEditorMode;

  GAME.init();
});

window.addEventListener("onEventReceived", function (obj) {
  const { listener, event } = obj.detail;
  if (!event || !listener) return;

  const data   = event.data;
  const user   = data?.displayName || "Unknown";
  const userId = data?.userId;

  if (event.listener === "widget-button") {
    if (event.field === "testRound") GAME.startRound();
    return;
  }

  if (listener === "message") {
    GAME.handleChatMessage(user, userId, data?.text);
    return;
  }

  if (listener === "event" && event.type === "channelPointsRedemption") {
    if (CONFIG.startMode === "channelPointRedemption" &&
        data?.redemption === CONFIG.channelPointsRedemption &&
        SESSION.is("idle")) {
      GAME.startRound();
    }
  }
});

// ============================================================
//  SHINY SPARKLE SYSTEM
// ============================================================
function createSparkles(count = 1) {
  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement("div");
    sparkle.className = "sparkle";
    DOM.mainContainer.appendChild(sparkle);

    // === IMPROVED POSITIONING ===
    const angle = Math.random() * Math.PI * 2;        // random direction
    const distance = gsap.utils.random(50, 200);      // bigger spread
    
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance * 0.75;     // slightly flatter (looks nicer)

    const scale   = gsap.utils.random(0.5, 1.2);
    const inDur   = gsap.utils.random(0.4, 1.2);
    const holdDur = gsap.utils.random(0.2, 0.5);
    const outDur  = gsap.utils.random(0.3, 1.1);
    const totalDur = inDur + holdDur + outDur;

    gsap.timeline()
      .set(sparkle, { 
        x, 
        y, 
        scale: 0, 
        autoAlpha: 0
      })
      .to(sparkle, {
        x: `+=${gsap.utils.random(-5, 5)}`,
        y: `+=${gsap.utils.random(-5, 5)}`,
        duration: totalDur,
        ease: "none"
      })
      .to(sparkle, {
        autoAlpha: 0.75,
        scale,
        duration: inDur,
        ease: "back.out(1.4)",
      }, "<")
      .to(sparkle, {
        delay: holdDur,
        autoAlpha: 0,
        scale: 0,
        duration: outDur,
        ease: "power2.in",
        onComplete: () => sparkle.remove(),
      });
  }
}

function startSparkles() {
    if (SESSION.sparkleTimeline) SESSION.sparkleTimeline.kill();

    // Initial burst

    // Repeating timeline - creates sparkles periodically
    SESSION.sparkleTimeline = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    SESSION.sparkleTimeline.call(() => {
        if (SESSION.isShiny && SESSION.state === "active") {
            createSparkles(gsap.utils.random(1,2));
        }
    });
}

function stopSparkles() {
    if (SESSION.sparkleTimeline) {
        SESSION.sparkleTimeline.kill();
        SESSION.sparkleTimeline = null;
    }
}