/* =========================================================
   COSMIC ARCADE — 10 GAME EDITION v3.0
   ========================================================= */

/* =========================================================
   PWA - SERVICE WORKER
========================================================= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

/* =========================================================
   ANIMATED LOADING SCREEN
========================================================= */
const LOADING_STEPS = [
  "Yıldız haritası çiziliyor...",
  "Nebula bulutları oluşturuluyor...",
  "Oyun motoru başlatılıyor...",
  "Ses sistemi kalibre ediliyor...",
  "Arcade hazır!"
];

function runLoadingScreen() {
  const loader = document.getElementById("loader");
  const fill = document.getElementById("loader-fill");
  const status = document.getElementById("loader-status");
  const particleBox = document.getElementById("loader-particles");

  // Loader yoksa direkt menüye geç (fallback)
  if (!loader) {
    document.getElementById("main-menu").classList.add("active");
    updateMenu();
    return;
  }

  // Floating particles
  const particleInterval = setInterval(() => {
    if (!particleBox) return;
    const s = document.createElement("span");
    s.style.left = Math.random() * 100 + "%";
    s.style.top = "100%";
    s.style.animationDuration = (2 + Math.random() * 2) + "s";
    s.style.background = ["#00f2fe", "#9b6cff", "#ff0055", "#ffb703"][
      Math.floor(Math.random() * 4)
    ];
    s.style.boxShadow = `0 0 10px ${s.style.background}`;
    particleBox.appendChild(s);
    setTimeout(() => s.remove(), 4000);
  }, 180);

  let progress = 0;
  let stepIndex = 0;

  const tick = () => {
    progress += progress < 70 ? 8 + Math.random() * 12 : 4 + Math.random() * 8;
    if (progress > 100) progress = 100;

    if (fill) fill.style.width = progress + "%";

    const newStep = Math.min(
      LOADING_STEPS.length - 1,
      Math.floor((progress / 100) * LOADING_STEPS.length)
    );

    if (newStep !== stepIndex && status) {
      stepIndex = newStep;
      status.textContent = LOADING_STEPS[stepIndex];
      status.style.animation = "none";
      void status.offsetWidth;
      status.style.animation = "statusFade 0.6s ease";
    }

    if (progress < 100) {
      setTimeout(tick, 120 + Math.random() * 140);
    } else {
      clearInterval(particleInterval);
      setTimeout(() => {
        loader.classList.add("hide");
        document.getElementById("main-menu").classList.add("active");
        updateMenu();
      }, 550);
    }
  };

  setTimeout(tick, 250);
}

/* =========================================================
   PER-GAME SOUND PROFILES
========================================================= */
const SOUND_PROFILES = {
  evasion:   { base: 880, collect: 1200, hit: 180, wave: "square"   },
  scroller:  { base: 440, collect:  880, hit: 120, wave: "sine"     },
  jumper:    { base: 660, collect:  990, hit: 200, wave: "triangle" },
  snake:     { base: 520, collect:  780, hit: 140, wave: "square"   },
  breaker:   { base: 400, collect:  700, hit: 220, wave: "triangle" },
  flap:      { base: 600, collect:  900, hit: 160, wave: "sine"     },
  pong:      { base: 500, collect:  750, hit: 200, wave: "square"   },
  reflex:    { base: 720, collect: 1080, hit: 240, wave: "sawtooth" },
  memory:    { base: 480, collect:  840, hit: 180, wave: "sine"     },
  sync:      { base: 340, collect:  680, hit: 150, wave: "triangle" }
};

const MEMORY_TONES = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6

/* ---------- SPACE BACKGROUND ---------- */
const bgCanvas = document.getElementById("spaceBg");
const bgCtx = bgCanvas.getContext("2d");
let stars = [], nebulas = [], bgLast = 0;

function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  stars = Array.from({ length: 130 }, () => ({
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height,
    size: Math.random() * 1.9 + 0.3,
    speed: Math.random() * 22 + 6,
    alpha: Math.random() * 0.6 + 0.2,
    hue: Math.random() < 0.15 ? (Math.random() < 0.5 ? 190 : 280) : 0
  }));
  nebulas = [
    { x: bgCanvas.width * 0.2, y: bgCanvas.height * 0.25, r: 380, color: "rgba(0,242,254,.06)", vx: 5, vy: 3 },
    { x: bgCanvas.width * 0.8, y: bgCanvas.height * 0.7,  r: 420, color: "rgba(155,108,255,.06)", vx: -4, vy: -2 },
    { x: bgCanvas.width * 0.55, y: bgCanvas.height * 0.9, r: 320, color: "rgba(255,0,85,.04)", vx: 3, vy: -3 }
  ];
}

function animateBg(time) {
  const dt = Math.min((time - bgLast) / 1000 || 0, 0.05);
  bgLast = time;
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  for (const n of nebulas) {
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    if (n.x < -n.r || n.x > bgCanvas.width + n.r) n.vx *= -1;
    if (n.y < -n.r || n.y > bgCanvas.height + n.r) n.vy *= -1;
    const g = bgCtx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, n.color);
    g.addColorStop(1, "transparent");
    bgCtx.fillStyle = g;
    bgCtx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
  }

  for (const star of stars) {
    star.y += star.speed * dt;
    if (star.y > bgCanvas.height) { star.y = -2; star.x = Math.random() * bgCanvas.width; }
    bgCtx.globalAlpha = star.alpha;
    bgCtx.fillStyle = star.hue ? `hsl(${star.hue}, 100%, 70%)` : "#ffffff";
    bgCtx.fillRect(star.x, star.y, star.size, star.size);
  }
  bgCtx.globalAlpha = 1;
  requestAnimationFrame(animateBg);
}

window.addEventListener("resize", resizeBg);
resizeBg();
requestAnimationFrame(animateBg);

/* ---------- CANVAS ---------- */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let currentGame = null;
let gameLoopId = 0;
let lastTime = 0;
let score = 0;
let isGameOver = false;
let combo = 1;
let runStats = {};
let onSwipe = null;
let onCanvasTap = null;

const input = { x: 0, y: 0, isPressed: false };

const GAME_NAMES = {
  evasion: "CYBER-EVASION",
  scroller: "SPACE COLLECTOR",
  jumper: "PRECISION JUMPER",
  snake: "NEON SNAKE",
  breaker: "NEON BREAKER",
  flap: "CYBER FLAP",
  pong: "NEON PONG",
  reflex: "REFLEX GRID",
  memory: "MEMORY MATRIX",
  sync: "PULSE SYNC"
};

const GAME_IDS = Object.keys(GAME_NAMES);

/* ---------- HELPERS ---------- */
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ---------- ACHIEVEMENTS ---------- */
const ACHIEVEMENTS = [
  { id: "first",     icon: "🌟", title: "İlk Uçuş",      desc: "İlk oyununu tamamla.",                 check: s => s.games >= 1 },
  { id: "score500",  icon: "🏆", title: "500 Kulübü",    desc: "Herhangi bir oyunda 500+ skor yap.",   check: s => s.best >= 500 },
  { id: "combo5",    icon: "🔥", title: "Alev Alan",      desc: "×5 combo'ya ulaş.",                    check: s => s.maxCombo >= 5 },
  { id: "combo10",   icon: "💥", title: "Combo Ustası",  desc: "×10 combo'ya ulaş.",                   check: s => s.maxCombo >= 10 },
  { id: "crystals",  icon: "💎", title: "Kristal Avcısı", desc: "Tek koşuda 10 kristal topla.",         check: s => s.crystals >= 10 },
  { id: "perfect10", icon: "🎯", title: "Tam İsabet",     desc: "10 başarılı jumper hamlesi yap.",      check: s => s.jumps >= 10 },
  { id: "survivor",  icon: "🛡️", title: "Hayatta Kalan",  desc: "Cyber-Evasion'da 60 saniye dayan.",    check: s => s.evasionTime >= 60 },
  { id: "daily",     icon: "☀️", title: "Günlük Görev",   desc: "Bugünün görevini tamamla.",            check: s => s.dailyDone },
  { id: "level5",    icon: "🚀", title: "Seviye 5",        desc: "Oyuncu seviyesini 5'e çıkar.",         check: s => s.level >= 5 },
  { id: "allgames",  icon: "🎮", title: "Koleksiyoner",   desc: "10 oyunun tamamını oyna.",             check: s => Object.keys(s.playedGames || {}).length >= 10 },
  { id: "score2000", icon: "👑", title: "2000 Efsanesi",  desc: "2000+ skor yap.",                      check: s => s.best >= 2000 },
  { id: "level10",   icon: "🌌", title: "Galaktik",        desc: "Seviye 10'a ulaş.",                    check: s => s.level >= 10 }
];

/* ---------- STORAGE ---------- */
function getData() {
  try {
    return JSON.parse(localStorage.getItem("cosmicData") || `{
      "xp":0, "games":0, "total":0, "best":0, "maxCombo":1,
      "crystals":0, "jumps":0, "evasionTime":0, "dailyDone":false,
      "playedGames":{},
      "settings":{ "sound":true, "vibration":true, "particles":true }
    }`);
  } catch (e) {
    return { xp:0, games:0, total:0, best:0, maxCombo:1, crystals:0, jumps:0, evasionTime:0, dailyDone:false, playedGames:{}, settings:{ sound:true, vibration:true, particles:true } };
  }
}
function saveData(data) { localStorage.setItem("cosmicData", JSON.stringify(data)); }

/* ---------- LEVEL ---------- */
function levelInfo(xp) {
  let level = 1, need = 100;
  while (xp >= need) {
    xp -= need;
    level++;
    need = Math.floor(100 * Math.pow(1.12, level - 1));
  }
  return { level, xp, need };
}

/* ---------- PROGRESS ---------- */
function addProgress(points) {
  const data = getData();
  data.xp += Math.max(0, Math.floor(points));
  data.games += 1;
  data.total += Math.max(0, Math.floor(score));
  data.best = Math.max(data.best, Math.floor(score));
  data.maxCombo = Math.max(data.maxCombo, combo);
  data.crystals = Math.max(data.crystals, runStats.crystals || 0);
  data.jumps = Math.max(data.jumps, runStats.jumps || 0);
  data.evasionTime = Math.max(data.evasionTime, runStats.evasionTime || 0);
  data.playedGames = data.playedGames || {};
  data.playedGames[currentGame] = (data.playedGames[currentGame] || 0) + 1;
  data.level = levelInfo(data.xp).level;
  saveData(data);
}

/* ---------- HIGH SCORE ---------- */
function getHighScore(game) { return Number(localStorage.getItem("high_" + game) || 0); }
function setHighScore(game, value) {
  value = Math.floor(value);
  if (value > getHighScore(game)) localStorage.setItem("high_" + game, value);
}

/* ---------- MENU ---------- */
function updateMenu() {
  const data = getData();
  const level = levelInfo(data.xp);

  document.getElementById("player-level").textContent = `LEVEL ${level.level}`;
  document.getElementById("xp-text").textContent = `${level.xp} / ${level.need}`;
  document.getElementById("xp-fill").style.width =
    `${Math.min(100, level.xp / level.need * 100)}%`;
  document.getElementById("total-score").textContent = data.total.toLocaleString("tr-TR");
  document.getElementById("games-played").textContent = data.games;

  GAME_IDS.forEach(game => {
    const el = document.getElementById("high-" + game);
    if (el) el.textContent = `BEST ${getHighScore(game)}`;
  });

  updateDaily();
}

/* ---------- DAILY ---------- */
function updateDaily() {
  const data = getData();
  const target = 300;
  const current = Math.min(target, getHighScore("evasion"));

  document.getElementById("daily-progress-text").textContent = `${current} / ${target}`;
  document.getElementById("daily-fill").style.width = `${current / target * 100}%`;

  if (current >= target && !data.dailyDone) {
    data.dailyDone = true;
    data.xp += 50;
    saveData(data);
  }
}

/* ---------- CANVAS SIZE ---------- */
function fitCanvasToScreen() {
  const width = Math.min(window.innerWidth - 20, 760);
  const height = Math.min(window.innerHeight * 0.60, 520);
  canvas.width = Math.max(280, width);
  canvas.height = Math.max(300, height);
  input.x = canvas.width / 2;
  input.y = canvas.height / 2;
}
window.addEventListener("resize", () => {
  if (document.getElementById("game-screen").classList.contains("active")) {
    fitCanvasToScreen();
  }
});
fitCanvasToScreen();

/* ---------- AUDIO ---------- */
let audioCtx = null;
function initAudio() {
  if (!getData().settings.sound) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playSound(type) {
  if (!getData().settings.sound || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === "collect") {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(); osc.stop(now + 0.1);
    } else if (type === "hit") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(); osc.stop(now + 0.22);
    } else if (type === "score") {
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(990, now + 0.09);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      osc.start(); osc.stop(now + 0.09);
    } else {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.08);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(); osc.stop(now + 0.08);
    }
  } catch (e) {}
}

/* ---------- PER-GAME SOUND ---------- */
function playSoundFor(game, type) {
  if (!getData().settings.sound || !audioCtx) return;
  const profile = SOUND_PROFILES[game] || SOUND_PROFILES.evasion;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = profile.wave;
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    let freq, dur, vol;

    if (type === "collect") {
      freq = profile.collect; dur = 0.11; vol = 0.16;
      osc.frequency.setValueAtTime(freq * 0.7, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + dur);
    } else if (type === "hit") {
      freq = profile.hit; dur = 0.25; vol = 0.22;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + dur);
    } else if (type === "score") {
      freq = profile.base; dur = 0.09; vol = 0.13;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + dur);
    } else {
      freq = profile.base; dur = 0.08; vol = 0.12;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + dur);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now); osc.stop(now + dur);
  } catch (e) {}
}

/* Global playSound'u per-game'e yönlendir */
const _origPlaySound = playSound;
playSound = function (type) {
  if (typeof currentGame !== "undefined" && currentGame) {
    return playSoundFor(currentGame, type);
  }
  return _origPlaySound(type);
};

/* ---------- MEMORY TONES ---------- */
function playMemoryTone(idx) {
  if (!getData().settings.sound || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    osc.type = "sine";
    osc.frequency.value = MEMORY_TONES[idx] || 523.25;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now); osc.stop(now + 0.35);
  } catch (e) {}
}

/* ---------- AMBIENT ---------- */
let ambientOsc = null, ambientGain = null;

function startAmbient(game) {
  if (!getData().settings.sound || !audioCtx) return;
  stopAmbient();
  try {
    const profile = SOUND_PROFILES[game];
    if (!profile) return;
    ambientOsc = audioCtx.createOscillator();
    ambientGain = audioCtx.createGain();
    ambientOsc.type = "sine";
    ambientOsc.frequency.value = profile.base / 4;
    ambientOsc.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    ambientGain.gain.setValueAtTime(0.018, audioCtx.currentTime);
    ambientOsc.start();
  } catch (e) {}
}

function stopAmbient() {
  if (ambientOsc) {
    try { ambientOsc.stop(); ambientOsc.disconnect(); } catch (e) {}
    ambientOsc = null;
  }
  if (ambientGain) {
    try { ambientGain.disconnect(); } catch (e) {}
    ambientGain = null;
  }
}

/* ---------- VIBRATION ---------- */
function vibrate(duration = 45) {
  if (getData().settings.vibration && navigator.vibrate) navigator.vibrate(duration);
}

/* ---------- INPUT ---------- */
let pointerStart = null;

function canvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const ptr = e.touches?.[0] || e;
  return {
    x: (ptr.clientX - rect.left) * (canvas.width / rect.width),
    y: (ptr.clientY - rect.top) * (canvas.height / rect.height)
  };
}

canvas.addEventListener("pointermove", e => {
  const p = canvasCoords(e);
  input.x = p.x;
  input.y = p.y;
});

canvas.addEventListener("pointerdown", e => {
  initAudio();
  input.isPressed = true;
  const p = canvasCoords(e);
  input.x = p.x; input.y = p.y;
  pointerStart = { x: e.clientX, y: e.clientY };
});

window.addEventListener("pointerup", e => {
  input.isPressed = false;
  if (!pointerStart) return;
  const dx = e.clientX - pointerStart.x;
  const dy = e.clientY - pointerStart.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 25 && onCanvasTap) {
    const p = canvasCoords(e);
    onCanvasTap(p.x, p.y);
  } else if (dist >= 25 && onSwipe) {
    onSwipe(dx, dy);
  }
  pointerStart = null;
});

/* ---------- SCORE / COMBO ---------- */
function updateScore(value) {
  const prev = Math.floor(score);
  score = value;
  const el = document.getElementById("score");
  el.textContent = Math.floor(score);
  if (Math.floor(score) > prev) {
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  }
}

function setCombo(value) {
  combo = Math.max(1, value);
  const element = document.getElementById("combo-label");
  element.textContent = `COMBO ×${combo}`;
  element.classList.remove("combo-hot");
  void element.offsetWidth;
  element.classList.add("combo-hot");
}

/* ---------- FLOATING TEXT ---------- */
function showFloatingText(text, x, y) {
  if (!getData().settings.particles) return;
  const el = document.createElement("div");
  el.className = "particle-text";
  el.textContent = text;
  el.style.left = `${Math.min(window.innerWidth - 80, Math.max(10, x))}px`;
  el.style.top = `${Math.max(20, y)}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 750);
}

/* ---------- PARTICLES ---------- */
let particles = [];
function createParticles(x, y, color = "#00f2fe", count = 10) {
  if (!getData().settings.particles) return;
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 150,
      vy: (Math.random() - 0.5) * 150,
      life: 0.5, max: 0.5, color,
      size: Math.random() * 3 + 1
    });
  }
}
function drawParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 80 * dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    ctx.globalAlpha = p.life / p.max;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

/* ---------- GAME CONTROL ---------- */
function cancelGame() {
  cancelAnimationFrame(gameLoopId);
  gameLoopId = 0;
  lastTime = 0;
}

function showMenu() {
  cancelGame();
  stopAmbient();           // 🔥 NEW
  onSwipe = null; onCanvasTap = null;
  document.getElementById("main-menu").classList.add("active");
  document.getElementById("game-screen").classList.remove("active");
  document.getElementById("game-over").classList.add("hidden");
  updateMenu();
}

function launchGame(game) {
  initAudio();
  document.getElementById("main-menu").classList.remove("active");
  document.getElementById("game-screen").classList.add("active");
  currentGame = game;
  document.getElementById("game-title").textContent = GAME_NAMES[game];

  const hints = {
    evasion: "Sürükle: hareket et",
    scroller: "Basılı tut: yüksel • Bırak: düş",
    jumper: "Dokun: zıpla",
    snake: "Swipe: yön değiştir",
    breaker: "Sürükle: raketi kontrol et",
    flap: "Dokun: zıpla",
    pong: "Sürükle: raketi kontrol et",
    reflex: "Dokun: hedefi vur",
    memory: "Diziyi tekrarla",
    sync: "Tam zamanında dokun"
  };

  document.getElementById("control-hint").textContent = hints[game] || "Dokun";

  startAmbient(game);      // 🔥 NEW
  restartCurrentGame();
}

function restartCurrentGame() {
  document.getElementById("game-over").classList.add("hidden");
  document.getElementById("record-badge").classList.add("hidden");
  cancelGame();

  score = 0; combo = 1; particles = [];
  isGameOver = false;
  onSwipe = null; onCanvasTap = null;

  runStats = { crystals: 0, jumps: 0, evasionTime: 0 };

  updateScore(0);
  setCombo(1);

  const inits = {
    evasion: initEvasion, scroller: initScroller, jumper: initJumper,
    snake: initSnake, breaker: initBreaker, flap: initFlap,
    pong: initPong, reflex: initReflex, memory: initMemory, sync: initSync
  };

  if (inits[currentGame]) inits[currentGame]();
}

/* ---------- GAME OVER ---------- */
function triggerGameOver(detail = "") {
  if (isGameOver) return;
  isGameOver = true;

  stopAmbient();           // 🔥 NEW
  playSound("hit");
  vibrate(120);

  const prevHigh = getHighScore(currentGame);
  const isNewRecord = score > prevHigh && score > 0;

  setHighScore(currentGame, score);
  addProgress(Math.floor(score / 10) + 10);

  document.getElementById("final-score").textContent = Math.floor(score);
  document.getElementById("result-detail").textContent = detail;
  document.getElementById("record-badge").classList.toggle("hidden", !isNewRecord);

  document.getElementById("game-over").classList.remove("hidden");
  updateMenu();

  document.getElementById("game-screen").classList.remove("shake");
  void document.getElementById("game-screen").offsetWidth;
  document.getElementById("game-screen").classList.add("shake");
}

/* =========================================================
   1. CYBER-EVASION
========================================================= */
let player, hazards, powerups, shieldActive, shieldTimer;

function initEvasion() {
  player = { x: canvas.width / 2, y: canvas.height / 2, radius: 12 };
  hazards = []; powerups = [];
  shieldActive = false; shieldTimer = null;
  loopEvasion();
}

function loopEvasion(timestamp) {
  if (isGameOver) return;
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.04);
  lastTime = timestamp;

  ctx.fillStyle = "rgba(5,9,19,.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  player.x += (input.x - player.x) * Math.min(1, 9 * dt);
  player.y += (input.y - player.y) * Math.min(1, 9 * dt);

  if (Math.random() < dt * 0.8 && powerups.length === 0) {
    powerups.push({
      x: Math.random() * (canvas.width - 50) + 25,
      y: -15, r: 9
    });
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.y += 130 * dt;
    ctx.fillStyle = "#ffb703";
    ctx.shadowBlur = 12; ctx.shadowColor = "#ffb703";
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + p.r) {
      shieldActive = true;
      clearTimeout(shieldTimer);
      shieldTimer = setTimeout(() => { shieldActive = false; }, 4000);
      playSound("collect"); vibrate(35);
      createParticles(p.x, p.y, "#ffb703", 16);
      showFloatingText("SHIELD", p.x, p.y);
      powerups.splice(i, 1);
      setCombo(combo + 1);
    }
    if (p.y > canvas.height + 20) powerups.splice(i, 1);
  }

  if (Math.random() < dt * 4.1) {
    hazards.push({
      x: Math.random() * canvas.width, y: -15,
      r: Math.random() * 8 + 7, s: 150 + Math.random() * 90
    });
  }

  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.y += h.s * dt;
    ctx.fillStyle = "#ff0055";
    ctx.shadowBlur = 14; ctx.shadowColor = "#ff0055";
    ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    if (Math.hypot(player.x - h.x, player.y - h.y) < player.radius + h.r) {
      if (shieldActive) {
        shieldActive = false;
        playSound("hit"); vibrate(45);
        createParticles(h.x, h.y, "#ffb703", 22);
        hazards.splice(i, 1);
        setCombo(combo + 1);
        continue;
      } else {
        triggerGameOver(`Combo ×${combo} • ${Math.floor(runStats.evasionTime)} sn`);
        return;
      }
    }
    if (h.y > canvas.height + 30) hazards.splice(i, 1);
  }

  runStats.evasionTime += dt;
  updateScore(score + dt * 10);

  document.getElementById("game-stat-left").textContent =
    shieldActive ? "🛡 KALKAN AKTİF" : "SURVIVE";
  document.getElementById("game-stat-right").textContent =
    `${Math.floor(runStats.evasionTime)}s`;

  drawParticles(dt);

  ctx.fillStyle = shieldActive ? "#ffb703" : "#00f2fe";
  ctx.shadowBlur = 18; ctx.shadowColor = ctx.fillStyle;
  ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();

  if (shieldActive) {
    ctx.strokeStyle = "rgba(255,183,3,.7)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(player.x, player.y, 20, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;

  gameLoopId = requestAnimationFrame(loopEvasion);
}

/* =========================================================
   2. SPACE COLLECTOR
========================================================= */
let ship, crystals, obstacles, energy, scrollDistance;

function initScroller() {
  ship = { x: 55, y: canvas.height / 2, vy: 0, size: 12 };
  crystals = []; obstacles = [];
  energy = 100; scrollDistance = 0;
  loopScroller();
}

function loopScroller(timestamp) {
  if (isGameOver) return;
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.04);
  lastTime = timestamp;

  ctx.fillStyle = "rgba(5,9,19,.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const acc = 230;
  if (input.isPressed) { ship.vy -= acc * dt; energy -= 8 * dt; }
  else { ship.vy += 175 * dt; }
  ship.vy *= Math.pow(0.96, dt * 60);
  ship.y += ship.vy * dt;
  scrollDistance += 170 * dt;

  if (ship.y < 0 || ship.y > canvas.height || energy <= 0) {
    triggerGameOver(`Mesafe ${Math.floor(scrollDistance)}m • Kristal ${runStats.crystals}`);
    return;
  }

  if (Math.random() < dt * 1.5) {
    crystals.push({
      x: canvas.width + 20,
      y: Math.random() * (canvas.height - 60) + 30
    });
  }

  for (let i = crystals.length - 1; i >= 0; i--) {
    const c = crystals[i];
    c.x -= 180 * dt;
    ctx.fillStyle = "#00f2fe";
    ctx.shadowBlur = 12; ctx.shadowColor = "#00f2fe";
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    ctx.shadowBlur = 0;

    if (Math.hypot(ship.x - c.x, ship.y - c.y) < ship.size + 9) {
      crystals.splice(i, 1);
      energy = Math.min(100, energy + 24);
      runStats.crystals++;
      const gained = 20 * combo;
      updateScore(score + gained);
      setCombo(combo + 1);
      playSound("collect"); vibrate(25);
      createParticles(c.x, c.y, "#00f2fe", 14);
      showFloatingText(`+${gained}`, c.x, c.y);
    } else if (c.x < -30) crystals.splice(i, 1);
  }

  if (Math.random() < dt * 0.85) {
    obstacles.push({
      x: canvas.width + 20,
      y: Math.random() * (canvas.height - 100),
      w: 22, h: 60 + Math.random() * 55
    });
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= 180 * dt;
    ctx.fillStyle = "#ff0055";
    ctx.shadowBlur = 10; ctx.shadowColor = "#ff0055";
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowBlur = 0;

    if (ship.x + ship.size > o.x && ship.x - ship.size < o.x + o.w &&
        ship.y + ship.size > o.y && ship.y - ship.size < o.y + o.h) {
      triggerGameOver(`Mesafe ${Math.floor(scrollDistance)}m • Kristal ${runStats.crystals}`);
      return;
    }
    if (o.x < -40) obstacles.splice(i, 1);
  }

  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(12, 12, 120, 8);
  ctx.fillStyle = energy > 30 ? "#00f2fe" : "#ff0055";
  ctx.fillRect(12, 12, 120 * energy / 100, 8);

  ctx.fillStyle = "#4facfe";
  ctx.shadowBlur = 18; ctx.shadowColor = "#4facfe";
  ctx.beginPath(); ctx.arc(ship.x, ship.y, ship.size, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  document.getElementById("game-stat-left").textContent = `ENERGY ${Math.ceil(energy)}%`;
  document.getElementById("game-stat-right").textContent = `${Math.floor(scrollDistance)}m`;

  updateScore(score + dt * 2);
  drawParticles(dt);

  gameLoopId = requestAnimationFrame(loopScroller);
}

/* =========================================================
   3. PRECISION JUMPER
========================================================= */
let angle, jumperPlayer, center, hazardAngles, lastJumpState;

function initJumper() {
  const minD = Math.min(canvas.width, canvas.height);
  center = { x: canvas.width / 2, y: canvas.height / 2, r: minD * 0.25 };
  angle = 0;
  jumperPlayer = { size: 9, jumping: false, jumpHeight: 0, jumpStart: 0 };
  hazardAngles = [Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  lastJumpState = false;
  loopJumper();
}

function loopJumper(timestamp) {
  if (isGameOver) return;
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.04);
  lastTime = timestamp;

  ctx.fillStyle = "rgba(5,9,19,.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  angle += 1.55 * dt;

  if (input.isPressed && !lastJumpState && !jumperPlayer.jumping) {
    jumperPlayer.jumping = true;
    jumperPlayer.jumpHeight = 46;
    jumperPlayer.jumpStart = angle;
    playSound("jump"); vibrate(25);
  }
  lastJumpState = input.isPressed;

  if (jumperPlayer.jumping) {
    jumperPlayer.jumpHeight -= 115 * dt;
    if (jumperPlayer.jumpHeight <= 0) {
      jumperPlayer.jumping = false;
      jumperPlayer.jumpHeight = 0;
      runStats.jumps++;
      updateScore(score + 10 * combo);
    }
  }

  ctx.strokeStyle = "rgba(0,242,254,.35)";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(center.x, center.y, center.r, 0, Math.PI * 2); ctx.stroke();

  const currentRadius = center.r + jumperPlayer.jumpHeight;
  const px = center.x + Math.cos(angle) * currentRadius;
  const py = center.y + Math.sin(angle) * currentRadius;

  for (const hAngle of hazardAngles) {
    const hx = center.x + Math.cos(hAngle) * center.r;
    const hy = center.y + Math.sin(hAngle) * center.r;
    ctx.fillStyle = "#ff0055";
    ctx.shadowBlur = 12; ctx.shadowColor = "#ff0055";
    ctx.beginPath(); ctx.arc(hx, hy, 11, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    const dist = Math.hypot(px - hx, py - hy);
    if (dist < jumperPlayer.size + 11) {
      triggerGameOver(`${runStats.jumps} başarılı zıplama • Combo ×${combo}`);
      return;
    }
    if (!jumperPlayer.jumping && dist < 28 &&
        Math.abs(Math.sin(angle - hAngle)) < 0.22) {
      setCombo(combo + 1);
    }
  }

  ctx.fillStyle = "#00f2fe";
  ctx.shadowBlur = 18; ctx.shadowColor = "#00f2fe";
  ctx.beginPath(); ctx.arc(px, py, jumperPlayer.size, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  document.getElementById("game-stat-left").textContent =
    jumperPlayer.jumping ? "JUMP!" : "READY";
  document.getElementById("game-stat-right").textContent = `JUMPS ${runStats.jumps}`;

  drawParticles(dt);
  gameLoopId = requestAnimationFrame(loopJumper);
}

/* =========================================================
   4. NEON SNAKE
========================================================= */
let snakeBody, snakeDir, snakeFood, snakeCell, snakeTimer, snakeSpeed, snakeCols, snakeRows;

function placeSnakeFood() {
  let tries = 0;
  do {
    snakeFood = {
      x: Math.floor(Math.random() * snakeCols),
      y: Math.floor(Math.random() * snakeRows)
    };
    tries++;
  } while (tries < 200 && snakeBody.some(s => s.x === snakeFood.x && s.y === snakeFood.y));
}

function initSnake() {
  snakeCell = 22;
  snakeCols = Math.floor(canvas.width / snakeCell);
  snakeRows = Math.floor(canvas.height / snakeCell);
  const cx = Math.floor(snakeCols / 2);
  const cy = Math.floor(snakeRows / 2);
  snakeBody = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy }
  ];
  snakeDir = { x: 1, y: 0 };
  snakeSpeed = 0.13;
  snakeTimer = 0;
  snakeFood = { x: 0, y: 0 };
  placeSnakeFood();

  onSwipe = (dx, dy) => {
    let nd;
    if (Math.abs(dx) > Math.abs(dy)) nd = { x: dx > 0 ? 1 : -1, y: 0 };
    else nd = { x: 0, y: dy > 0 ? 1 : -1 };
    if (nd.x === -snakeDir.x && nd.y === -snakeDir.y) return;
    if (nd.x === snakeDir.x && nd.y === snakeDir.y) return;
    snakeDir = nd;
  };

  loopSnake();
}

function stepSnake() {
  const head = snakeBody[0];
  const nx = head.x + snakeDir.x;
  const ny = head.y + snakeDir.y;

  if (nx < 0 || nx >= snakeCols || ny < 0 || ny >= snakeRows) {
    triggerGameOver(`Uzunluk ${snakeBody.length} • Combo ×${combo}`);
    return;
  }
  for (let i = 0; i < snakeBody.length; i++) {
    if (snakeBody[i].x === nx && snakeBody[i].y === ny) {
      triggerGameOver(`Uzunluk ${snakeBody.length} • Combo ×${combo}`);
      return;
    }
  }

  snakeBody.unshift({ x: nx, y: ny });

  if (nx === snakeFood.x && ny === snakeFood.y) {
    const gained = 10 * combo;
    updateScore(score + gained);
    setCombo(combo + 1);
    playSound("collect"); vibrate(25);
    createParticles(nx * snakeCell + snakeCell / 2, ny * snakeCell + snakeCell / 2, "#ffb703", 14);
    showFloatingText(`+${gained}`, nx * snakeCell, ny * snakeCell);
    runStats.crystals++;
    placeSnakeFood();
    snakeSpeed = Math.max(0.06, 0.13 - snakeBody.length * 0.002);
  } else {
    snakeBody.pop();
  }
}

function loopSnake(timestamp) {
  if (isGameOver) return;
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.04);
  lastTime = timestamp;

  ctx.fillStyle = "rgba(5,9,19,.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0,242,254,.045)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= snakeCols; i++) {
    ctx.beginPath(); ctx.moveTo(i * snakeCell, 0);
    ctx.lineTo(i * snakeCell, snakeRows * snakeCell); ctx.stroke();
  }
  for (let j = 0; j <= snakeRows; j++) {
    ctx.beginPath(); ctx.moveTo(0, j * snakeCell);
    ctx.lineTo(snakeCols * snakeCell, j * snakeCell); ctx.stroke();
  }

  snakeTimer += dt;
  while (snakeTimer >= snakeSpeed && !isGameOver) {
    snakeTimer -= snakeSpeed;
    stepSnake();
  }
  if (isGameOver) return;

  const fx = snakeFood.x * snakeCell + snakeCell / 2;
  const fy = snakeFood.y * snakeCell + snakeCell / 2;
  const pulse = 1 + Math.sin(timestamp / 200) * 0.15;
  ctx.fillStyle = "#ffb703";
  ctx.shadowBlur = 16; ctx.shadowColor = "#ffb703";
  ctx.beginPath(); ctx.arc(fx, fy, snakeCell * 0.28 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  for (let i = snakeBody.length - 1; i >= 0; i--) {
    const s = snakeBody[i];
    const px = s.x * snakeCell, py = s.y * snakeCell;
    const isHead = i === 0;
    ctx.fillStyle = isHead ? "#00f2fe" : "#4facfe";
    ctx.shadowBlur = isHead ? 18 : 6;
    ctx.shadowColor = isHead ? "#00f2fe" : "#4facfe";
    roundRect(px + 2, py + 2, snakeCell - 4, snakeCell - 4, 5);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  document.getElementById("game-stat-left").textContent = `LEN ${snakeBody.length}`;
  document.getElementById("game-stat-right").textContent = `×${combo}`;

  drawParticles(dt);
  gameLoopId = requestAnimationFrame(loopSnake);
}

/* =========================================================
   5. NEON BREAKER
========================================================= */
let bPaddle, bBall, bBricks, bLaunched;

function initBreaker() {
  bPaddle = { x: canvas.width / 2, y: canvas.height - 25, w: 90, h: 10 };
  bBall = { x: canvas.width / 2, y: canvas.height - 40, vx: 180, vy: -220, r: 7 };
  bLaunched = false;
  bBricks = [];
  const cols = 7, rows = 5, pad = 4, offX = 20, offY = 20;
  const bw = (canvas.width - offX * 2 - pad * (cols - 1)) / cols;
  const bh = 18;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bBricks.push({
        x: offX + c * (bw + pad),
        y: offY + r * (bh + pad),
        w: bw, h: bh, alive: true,
        hue: 190 + r * 25
      });
    }
  }
  loopBreaker();
}

function loopBreaker(timestamp) {
  if (isGameOver) return;
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.04);
  lastTime = timestamp;

  ctx.fillStyle = "rgba(5,9,19,.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const targetX = Math.max(bPaddle.w / 2, Math.min(canvas.width - bPaddle.w / 2, input.x));
  bPaddle.x += (targetX - bPaddle.x) * Math.min(1, 20 * dt);

  if (!bLaunched) {
    bBall.x = bPaddle.x;
    bBall.y = bPaddle.y - 15;
    if (input.isPressed) {
      bLaunched = true;
      playSound("jump");
    }
  } else {
    bBall.x += bBall.vx * dt;
    bBall.y += bBall.vy * dt;

    if (bBall.x < bBall.r) { bBall.x = bBall.r; bBall.vx *= -1; playSound("score"); }
    if (bBall.x > canvas.width - bBall.r) { bBall.x = canvas.width - bBall.r; bBall.vx *= -1; playSound("score"); }
    if (bBall.y < bBall.r) { bBall.y = bBall.r; bBall.vy *= -1; playSound("score"); }

    if (bBall.y + bBall.r > bPaddle.y && bBall.y - bBall.r < bPaddle.y + bPaddle.h &&
        bBall.x > bPaddle.x - bPaddle.w / 2 && bBall.x < bPaddle.x + bPaddle.w / 2 &&
        bBall.vy > 0) {
      bBall.vy = -Math.abs(bBall.vy);
      const hit = (bBall.x - bPaddle.x) / (bPaddle.w / 2);
      bBall.vx = hit * 260;
      playSound("collect");
    }

    if (bBall.y > canvas.height + 20) {
      triggerGameOver(`Skor ${Math.floor(score)} • Kırılan ${runStats.crystals}`);
      return;
    }

    for (let i = 0; i < bBricks.length; i++) {
      const br = bBricks[i];
      if (!br.alive) continue;
      if (bBall.x + bBall.r > br.x && bBall.x - bBall.r < br.x + br.w &&
          bBall.y + bBall.r > br.y && bBall.y - bBall.r < br.y + br.h) {
        br.alive = false;
        bBall.vy *= -1;
        runStats.crystals++;
        const gained = 15 * combo;
        updateScore(score + gained);
        setCombo(combo + 1);
        playSound("collect"); vibrate(20);
        createParticles(br.x + br.w / 2, br.y + br.h / 2, `hsl(${br.hue},100%,60%)`, 12);
        showFloatingText(`+${gained}`, br.x, br.y);
        break;
      }
    }

    const remaining = bBricks.filter(b => b.alive).length;
    if (remaining === 0) {
      initBreaker();
      return;
    }

    document.getElementById("game-stat-left").textContent = `KIRILAN ${runStats.crystals}`;
    document.getElementById("game-stat-right").textContent = `KALAN ${remaining}`;
  }

  for (const br of bBricks) {
    if (!br.alive) continue;
    ctx.fillStyle = `hsl(${br.hue},100%,60%)`;
    ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;
    roundRect(br.x, br.y, br.w, br.h, 4);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#00f2fe";
  ctx.shadowBlur = 15; ctx.shadowColor = "#00f2fe";
  roundRect(bPaddle.x - bPaddle.w / 2, bPaddle.y, bPaddle.w, bPaddle.h, 5);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 18; ctx.shadowColor = "#00f2fe";
  ctx.beginPath(); ctx.arc(bBall.x, bBall.y, bBall.r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  if (!bLaunched) {
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DOKUNARAK BAŞLAT", canvas.width / 2, canvas.height / 2 + 60);
  }

  drawParticles(dt);
  gameLoopId = requestAnimationFrame(loopBreaker);
}

/* =========================================================
   6. CYBER FLAP
========================================================= */
let flapBird, flapPipes, flapTimer, flapLastState;

function initFlap() {
  flapBird = { x: canvas.width * 0.28, y: canvas.height / 2, vy: 0, r: 12, rot: 0 };
  flapPipes = [];
  flapTimer = 0;
  flapLastState = false;
  loopFlap();
}

function loopFlap(timestamp) {
  if (isGameOver) return;
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.04);
  lastTime = timestamp;

  ctx.fillStyle = "rgba(5,9,19,.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  flapBird.vy += 900 * dt;
  flapBird.y += flapBird.vy * dt;
  flapBird.rot = Math.max(-0.5, Math.min(1.2, flapBird.vy / 700));

  if (input.isPressed && !flapLastState) {
    flapBird.vy = -320;
    playSound("jump"); vibrate(20);
  }
  flapLastState = input.isPressed;

  flapTimer += dt;
  if (flapTimer > 1.5) {
    flapTimer = 0;
    const gap = 130;
    const margin = 40;
    const top = margin + Math.random() * (canvas.height - gap - margin * 2);
    flapPipes.push({
      x: canvas.width,
      top,
      bottom: top + gap,
      w: 55,
      passed: false
    });
  }

  const speed = 200 + Math.min(120, score / 4);

  for (let i = flapPipes.length - 1; i >= 0; i--) {
    const p = flapPipes[i];
    p.x -= speed * dt;

    ctx.fillStyle = "#00f2fe";
    ctx.shadowBlur = 12; ctx.shadowColor = "#00f2fe";
    roundRect(p.x, 0, p.w, p.top, 6); ctx.fill();
    roundRect(p.x, p.bottom, p.w, canvas.height - p.bottom, 6); ctx.fill();
    ctx.shadowBlur = 0;

    if (flapBird.x + flapBird.r > p.x && flapBird.x - flapBird.r < p.x + p.w) {
      if (flapBird.y - flapBird.r < p.top || flapBird.y + flapBird.r > p.bottom) {
        triggerGameOver(`Skor ${Math.floor(score)} • ×${combo}`);
        return;
      }
    }

    if (!p.passed && p.x + p.w < flapBird.x) {
      p.passed = true;
      const gained = 10 * combo;
      updateScore(score + gained);
      setCombo(combo + 1);
      playSound("score");
      showFloatingText(`+${gained}`, flapBird.x, flapBird.y - 20);
    }

    if (p.x + p.w < -10) flapPipes.splice(i, 1);
  }

  if (flapBird.y + flapBird.r > canvas.height || flapBird.y - flapBird.r < 0) {
    triggerGameOver(`Skor ${Math.floor(score)}`);
    return;
  }

  ctx.save();
  ctx.translate(flapBird.x, flapBird.y);
  ctx.rotate(flapBird.rot);
  ctx.fillStyle = "#ffb703";
  ctx.shadowBlur = 18; ctx.shadowColor = "#ffb703";
  ctx.beginPath();
  ctx.arc(0, 0, flapBird.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#05050d";
  ctx.beginPath(); ctx.arc(4, -3, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  document.getElementById("game-stat-left").textContent = "FLAP";
  document.getElementById("game-stat-right").textContent = `×${combo}`;

  drawParticles(dt);
  gameLoopId = requestAnimationFrame(loopFlap);
}

/* =========================================================
   7. NEON PONG
========================================================= */
let pPlayer, pAI, pBall, pPlayerScore, pAIScore;

function initPong() {
  pPlayer = { x: canvas.width - 20, y: canvas.height / 2, w: 10, h: 75 };
  pAI = { x: 20, y: canvas.height / 2, w: 10, h: 75 };
  pBall = { x: canvas.width / 2, y: canvas.height / 2, vx: 260, vy: 130, r: 8, speed: 260 };
  pPlayerScore = 0; pAIScore = 0;
  loopPong();
}

function resetPongBall(dir) {
  pBall.x = canvas.width / 2;
  pBall.y = canvas.height / 2;
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
  pBall.speed = 260 + pPlayerScore * 15;
  pBall.vx = Math.cos(angle) * pBall.speed * dir;
  pBall.vy = Math.sin(angle) * pBall.speed;
}

function loopPong(timestamp) {
  if (isGameOver) return;
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.04);
  lastTime = timestamp;

  ctx.fillStyle = "rgba(5,9,19,.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0,242,254,.15)";
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  const targetY = Math.max(pPlayer.h / 2, Math.min(canvas.height - pPlayer.h / 2, input.y));
  pPlayer.y += (targetY - pPlayer.y) * Math.min(1, 20 * dt);

  const aiTarget = pBall.y + (Math.random() - 0.5) * 40;
  pAI.y += (aiTarget - pAI.y) * Math.min(1, 3.2 * dt);
  pAI.y = Math.max(pAI.h / 2, Math.min(canvas.height - pAI.h / 2, pAI.y));

  pBall.x += pBall.vx * dt;
  pBall.y += pBall.vy * dt;

  if (pBall.y < pBall.r) { pBall.y = pBall.r; pBall.vy *= -1; playSound("score"); }
  if (pBall.y > canvas.height - pBall.r) { pBall.y = canvas.height - pBall.r; pBall.vy *= -1; playSound("score"); }

  if (pBall.vx > 0 &&
      pBall.x + pBall.r > pPlayer.x - pPlayer.w / 2 &&
      pBall.x - pBall.r < pPlayer.x + pPlayer.w / 2 &&
      pBall.y > pPlayer.y - pPlayer.h / 2 &&
      pBall.y < pPlayer.y + pPlayer.h / 2) {
    pBall.x = pPlayer.x - pPlayer.w / 2 - pBall.r;
    const hit = (pBall.y - pPlayer.y) / (pPlayer.h / 2);
    pBall.vx = -Math.abs(pBall.vx);
    pBall.vy = hit * 300;
    pBall.speed = Math.min(700, pBall.speed + 15);
    const mag = Math.hypot(pBall.vx, pBall.vy);
    pBall.vx = pBall.vx / mag * pBall.speed;
    pBall.vy = pBall.vy / mag * pBall.speed;
    playSound("collect"); vibrate(15);
    createParticles(pBall.x, pBall.y, "#00f2fe", 8);
  }

  if (pBall.vx < 0 &&
      pBall.x - pBall.r < pAI.x + pAI.w / 2 &&
      pBall.x + pBall.r > pAI.x - pAI.w / 2 &&
      pBall.y > pAI.y - pAI.h / 2 &&
      pBall.y < pAI.y + pAI.h / 2) {
    pBall.x = pAI.x + pAI.w / 2 + pBall.r;
    const hit = (pBall.y - pAI.y) / (pAI.h / 2);
    pBall.vx = Math.abs(pBall.vx);
    pBall.vy = hit * 300;
    playSound("score");
  }

  if (pBall.x < -20) {
    pPlayerScore++;
    const gained = 30 * combo;
    updateScore(score + gained);
    setCombo(combo + 1);
    playSound("collect"); vibrate(40);
    showFloatingText(`+${gained}`, canvas.width / 2, canvas.height / 2);
    createParticles(canvas.width / 2, canvas.height / 2, "#00f2fe", 20);
    resetPongBall(1);
  }

  if (pBall.x > canvas.width + 20) {
    triggerGameOver(`Sen ${pPlayerScore} - AI ${pAIScore} • ×${combo}`);
    return;
  }

  ctx.fillStyle = "#00f2fe";
  ctx.shadowBlur = 15; ctx.shadowColor = "#00f2fe";
  roundRect(pPlayer.x - pPlayer.w / 2, pPlayer.y - pPlayer.h / 2, pPlayer.w, pPlayer.h, 5);
  ctx.fill();

  ctx.fillStyle = "#ff0055";
  ctx.shadowColor = "#ff0055";
  roundRect(pAI.x - pAI.w / 2, pAI.y - pAI.h / 2, pAI.w, pAI.h, 5);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 18; ctx.shadowColor = "#00f2fe";
  ctx.beginPath(); ctx.arc(pBall.x, pBall.y, pBall.r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  document.getElementById("game-stat-left").textContent = `SEN ${pPlayerScore}`;
  document.getElementById("game-stat-right").textContent = `AI ${pAIScore}`;

  drawParticles(dt);
  gameLoopId = requestAnimationFrame(loopPong);
}

/* =========================================================
   8. REFLEX GRID
========================================================= */
let reflexTarget, reflexMaxTime, reflexTimeLeft, reflexActive, reflexSpawnDelay;

function initReflex() {
  reflexTarget = null;
  reflexActive = true;
  reflexSpawnDelay = 0.5;
  reflexMaxTime = 1.8;
  reflexTimeLeft = 0;

  onCanvasTap = (x, y) => {
    if (!reflexTarget) return;
    const dist = Math.hypot(x - reflexTarget.x, y - reflexTarget.y);
    if (dist <= reflexTarget.r + 8) {
      const precision = Math.round(50 * (1 - reflexTimeLeft / reflexMaxTime));
      const gained = (30 + precision) * combo;
      updateScore(score + gained);
      setCombo(combo + 1);
      playSound("collect"); vibrate(25);
      createParticles(reflexTarget.x, reflexTarget.y, "#00f2fe", 18);
      showFloatingText(`+${gained}`, reflexTarget.x, reflexTarget.y);
      reflexTarget = null;
      reflexSpawnDelay = Math.max(0.2, 0.6 - score / 8000);
      reflexMaxTime = Math.max(0.55, 1.8 - score / 2500);
    } else {
      setCombo(1);
      playSound("hit"); vibrate(30);
    }
  };

  loopReflex();
}

function loopReflex(timestamp) {
  if (isGameOver) return;
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.04);
  lastTime = timestamp;

  ctx.fillStyle = "rgba(5,9,19,.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0,242,254,.05)";
  const cellSize = 40;
  for (let x = 0; x < canvas.width; x += cellSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += cellSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  if (!reflexTarget) {
    reflexSpawnDelay -= dt;
    if (reflexSpawnDelay <= 0) {
      const margin = 50;
      reflexTarget = {
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        r: 32
      };
      reflexTimeLeft = reflexMaxTime;
    }
  } else {
    reflexTimeLeft -= dt;
    if (reflexTimeLeft <= 0) {
      triggerGameOver(`Skor ${Math.floor(score)} • ×${combo}`);
      return;
    }

    const progress = reflexTimeLeft / reflexMaxTime;
    const curR = reflexTarget.r * (0.6 + progress * 0.4);

    ctx.strokeStyle = "rgba(0,242,254,.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(reflexTarget.x, reflexTarget.y, curR + 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(reflexTarget.x, reflexTarget.y, curR + 12, -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();

    const grd = ctx.createRadialGradient(reflexTarget.x, reflexTarget.y, 0,
                                          reflexTarget.x, reflexTarget.y, curR);
    grd.addColorStop(0, "rgba(0,242,254,.9)");
    grd.addColorStop(1, "rgba(0,242,254,.15)");
    ctx.fillStyle = grd;
    ctx.shadowBlur = 25; ctx.shadowColor = "#00f2fe";
    ctx.beginPath();
    ctx.arc(reflexTarget.x, reflexTarget.y, curR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(reflexTarget.x, reflexTarget.y, curR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  document.getElementById("game-stat-left").textContent = "TAP!";
  document.getElementById("game-stat-right").textContent = `×${combo}`;

  drawParticles(dt);
  gameLoopId = requestAnimationFrame(loopReflex);
}

/* =========================================================
   9. MEMORY MATRIX
========================================================= */
let memState;
let _memLastHighlight = -1;

function initMemory() {
  memState = {
    sequence: [Math.floor(Math.random() * 4)],
    inputIndex: 0,
    phase: "showing",
    showIndex: 0,
    flashTimer: 0,
    highlight: -1,
    phaseTimer: 0,
    waitingForPlayer: false
  };
  _memLastHighlight = -1;

  onCanvasTap = (x, y) => {
    if (!memState.waitingForPlayer) return;
    const midX = canvas.width / 2, midY = canvas.height / 2;
    let idx = 0;
    if (x > midX) idx += 1;
    if (y > midY) idx += 2;
    handleMemoryInput(idx);
  };

  loopMemory();
}

function handleMemoryInput(idx) {
  memState.highlight = idx;
  memState.flashTimer = 0.25;

  if (idx === memState.sequence[memState.inputIndex]) {
    memState.inputIndex++;
    playSound("score");
    vibrate(15);
    const q = getQuadrantRect(idx);
    createParticles(q.x + q.w / 2, q.y + q.h / 2, "#00f2fe", 8);

    if (memState.inputIndex >= memState.sequence.length) {
      const gained = memState.sequence.length * 20 * combo;
      updateScore(score + gained);
      setCombo(combo + 1);
      showFloatingText(`+${gained}`, canvas.width / 2, canvas.height / 2 - 40);
      playSound("collect"); vibrate(50);

      memState.sequence.push(Math.floor(Math.random() * 4));
      memState.inputIndex = 0;
      memState.phase = "showing";
      memState.showIndex = 0;
      memState.phaseTimer = 0.6;
      memState.waitingForPlayer = false;
    }
  } else {
    triggerGameOver(`Dizi uzunluğu ${memState.sequence.length} • Skor ${Math.floor(score)}`);
  }
}

function getQuadrantRect(idx) {
  const pad = 12;
  const w = (canvas.width - pad * 3) / 2;
  const h = (canvas.height - pad * 3) / 2;
  const cx = idx % 2;
  const cy = Math.floor(idx / 2);
  return {
    x: pad + cx * (w + pad),
    y: pad + cy * (h + pad),
    w, h
  };
}

function loopMemory(timestamp) {
  if (isGameOver) return;
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.04);
  lastTime = timestamp;

  ctx.fillStyle = "rgba(5,9,19,.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const colors = ["#00f2fe", "#9b6cff", "#ffb703", "#ff0055"];
  for (let i = 0; i < 4; i++) {
    const q = getQuadrantRect(i);
    const isHl = memState.highlight === i;
    const c = colors[i];

    if (isHl) {
      ctx.fillStyle = c;
      ctx.shadowBlur = 35; ctx.shadowColor = c;
      ctx.globalAlpha = 0.95;
    } else {
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.15;
      ctx.shadowBlur = 0;
    }
    roundRect(q.x, q.y, q.w, q.h, 14);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    ctx.strokeStyle = c;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    roundRect(q.x, q.y, q.w, q.h, 14);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (memState.flashTimer > 0) {
    memState.flashTimer -= dt;
    if (memState.flashTimer <= 0) memState.highlight = -1;
  }

  // 🔥 Memory tones - highlight değişince tonu çal
  if (memState.highlight !== _memLastHighlight && memState.highlight >= 0) {
    playMemoryTone(memState.highlight);
  }
  _memLastHighlight = memState.highlight;

  if (memState.phase === "showing") {
    if (memState.flashTimer <= 0) {
      if (memState.phaseTimer > 0) {
        memState.phaseTimer -= dt;
        if (memState.phaseTimer <= 0 && memState.showIndex >= memState.sequence.length) {
          memState.phase = "waiting";
          memState.waitingForPlayer = true;
        }
      } else {
        if (memState.showIndex < memState.sequence.length) {
          memState.highlight = memState.sequence[memState.showIndex];
          memState.flashTimer = 0.4;
          memState.showIndex++;
          memState.phaseTimer = 0.25;
        }
      }
    }
  }

  document.getElementById("game-stat-left").textContent =
    memState.phase === "showing" ? "İZLE" : "TEKRARLA";
  document.getElementById("game-stat-right").textContent =
    `${memState.sequence.length} ADIM`;

  drawParticles(dt);
  gameLoopId = requestAnimationFrame(loopMemory);
}

/* =========================================================
   10. PULSE SYNC
========================================================= */
let syncMarker, syncDir, syncSpeed, syncTarget, syncTargetW, syncPulsePhase;

function initSync() {
  syncMarker = 0;
  syncDir = 1;
  syncSpeed = 0.9;
  syncTarget = 0.5;
  syncTargetW = 0.22;
  syncPulsePhase = 0;
  onCanvasTap = handleSyncTap;
  loopSync();
}

function handleSyncTap() {
  const dist = Math.abs(syncMarker - syncTarget);
  const half = syncTargetW / 2;

  if (dist <= half) {
    const precision = 1 - dist / half;
    let label;
    let mult;
    if (precision > 0.85) { label = "PERFECT!"; mult = 4; }
    else if (precision > 0.5) { label = "GREAT!"; mult = 2; }
    else { label = "GOOD"; mult = 1; }

    const gained = Math.round((30 + precision * 40) * mult * combo);
    updateScore(score + gained);
    setCombo(combo + 1);
    playSound("collect"); vibrate(25);
    showFloatingText(`${label} +${gained}`, canvas.width / 2, canvas.height / 2 - 30);
    createParticles(canvas.width / 2, canvas.height * 0.82, "#00f2fe", 20);

    syncTarget = 0.15 + Math.random() * 0.7;
    syncTargetW = Math.max(0.07, 0.22 - score / 15000);
    syncSpeed = Math.min(2.4, 0.9 + score / 4000);
  } else {
    triggerGameOver(`Skor ${Math.floor(score)} • ×${combo}`);
  }
}

function loopSync(timestamp) {
  if (isGameOver) return;
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.04);
  lastTime = timestamp;

  ctx.fillStyle = "rgba(5,9,19,.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  syncMarker += syncDir * syncSpeed * dt;
  if (syncMarker > 1) { syncMarker = 1; syncDir = -1; }
  if (syncMarker < 0) { syncMarker = 0; syncDir = 1; }

  const barY = canvas.height * 0.75;
  const barH = 14;
  const barX = 30;
  const barW = canvas.width - 60;

  ctx.fillStyle = "rgba(255,255,255,.08)";
  roundRect(barX, barY, barW, barH, 7);
  ctx.fill();

  const tStart = barX + (syncTarget - syncTargetW / 2) * barW;
  const tWidth = syncTargetW * barW;
  const grd = ctx.createLinearGradient(tStart, 0, tStart + tWidth, 0);
  grd.addColorStop(0, "rgba(0,242,254,.35)");
  grd.addColorStop(0.5, "rgba(0,242,254,.75)");
  grd.addColorStop(1, "rgba(0,242,254,.35)");
  ctx.fillStyle = grd;
  ctx.shadowBlur = 18; ctx.shadowColor = "#00f2fe";
  roundRect(tStart, barY, tWidth, barH, 7);
  ctx.fill();
  ctx.shadowBlur = 0;

  const tCenter = barX + syncTarget * barW;
  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tCenter, barY - 5);
  ctx.lineTo(tCenter, barY + barH + 5);
  ctx.stroke();

  const markerX = barX + syncMarker * barW;
  ctx.fillStyle = "#ffb703";
  ctx.shadowBlur = 20; ctx.shadowColor = "#ffb703";
  ctx.beginPath();
  ctx.arc(markerX, barY + barH / 2, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(markerX, barY + barH / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  syncPulsePhase += dt * 6;
  ctx.fillStyle = `rgba(0,242,254,${0.5 + Math.sin(syncPulsePhase) * 0.3})`;
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TAM ZAMANINDA DOKUN", canvas.width / 2, barY - 50);

  document.getElementById("game-stat-left").textContent = "SYNC";
  document.getElementById("game-stat-right").textContent = `×${combo}`;

  drawParticles(dt);
  gameLoopId = requestAnimationFrame(loopSync);
}

/* =========================================================
   MODAL
========================================================= */
function openModal(html) {
  document.getElementById("modal-content").innerHTML = html;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function openAchievements() {
  const data = getData();
  const level = levelInfo(data.xp);
  const state = { ...data, level: level.level };

  const html = `
    <span class="panel-label">COLLECTION</span>
    <h2>🏆 BAŞARIMLAR</h2>
    ${ACHIEVEMENTS.map(a => {
      const unlocked = a.check(state);
      return `
        <div class="achievement ${unlocked ? "unlocked" : ""}">
          <div class="achievement-icon">${a.icon}</div>
          <div>
            <h3>${a.title}</h3>
            <p>${a.desc}</p>
          </div>
          <span class="achievement-state">${unlocked ? "AÇILDI" : "KİLİTLİ"}</span>
        </div>
      `;
    }).join("")}
  `;

  openModal(html);
}

function openSettings() {
  const data = getData();
  const html = `
    <span class="panel-label">SYSTEM</span>
    <h2>⚙ AYARLAR</h2>
    <div class="setting-row">
      <span>Ses efektleri</span>
      <button class="toggle" onclick="toggleSetting('sound')">${data.settings.sound ? "AÇIK" : "KAPALI"}</button>
    </div>
    <div class="setting-row">
      <span>Titreşim</span>
      <button class="toggle" onclick="toggleSetting('vibration')">${data.settings.vibration ? "AÇIK" : "KAPALI"}</button>
    </div>
    <div class="setting-row">
      <span>Particle efektleri</span>
      <button class="toggle" onclick="toggleSetting('particles')">${data.settings.particles ? "AÇIK" : "KAPALI"}</button>
    </div>
    <button class="btn danger" onclick="resetProgress()">TÜM İLERLEMEYİ SIFIRLA</button>
  `;
  openModal(html);
}

function toggleSetting(key) {
  const data = getData();
  data.settings[key] = !data.settings[key];
  saveData(data);
  openSettings();
}

function resetProgress() {
  if (!confirm("Tüm skorlar, XP ve başarımlar silinsin mi?")) return;
  localStorage.removeItem("cosmicData");
  GAME_IDS.forEach(game => localStorage.removeItem("high_" + game));
  closeModal();
  updateMenu();
}

document.getElementById("modal").addEventListener("click", e => {
  if (e.target.id === "modal") closeModal();
});

/* =========================================================
   TOP-ACTION MOUSE TRACKING (Radial gradient follow)
========================================================= */
document.querySelectorAll(".top-action").forEach(btn => {
  btn.addEventListener("pointermove", e => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
    btn.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
  });
});

/* =========================================================
   BAŞLANGIÇ
========================================================= */
runLoadingScreen();