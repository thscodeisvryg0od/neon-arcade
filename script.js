/* =========================================================
   COSMIC ARCADE
   ========================================================= */


/* =========================================================
   UZAY ARKA PLANI
========================================================= */

const bgCanvas =
  document.getElementById("spaceBg");

const bgCtx =
  bgCanvas.getContext("2d");

let stars = [];

let bgLast = 0;


function resizeBg() {

  bgCanvas.width = window.innerWidth;

  bgCanvas.height = window.innerHeight;

  stars = Array.from(
    { length: 90 },
    () => ({

      x:
        Math.random() *
        bgCanvas.width,

      y:
        Math.random() *
        bgCanvas.height,

      size:
        Math.random() * 1.8 + 0.3,

      speed:
        Math.random() * 20 + 8,

      alpha:
        Math.random() * 0.6 + 0.2

    })
  );
}


function animateBg(time) {

  const dt =
    Math.min(
      (time - bgLast) / 1000 || 0,
      0.05
    );

  bgLast = time;

  bgCtx.clearRect(
    0,
    0,
    bgCanvas.width,
    bgCanvas.height
  );

  for (const star of stars) {

    star.y +=
      star.speed * dt;

    if (
      star.y >
      bgCanvas.height
    ) {

      star.y = -2;
    }

    bgCtx.globalAlpha =
      star.alpha;

    bgCtx.fillStyle =
      "#ffffff";

    bgCtx.fillRect(
      star.x,
      star.y,
      star.size,
      star.size
    );
  }

  bgCtx.globalAlpha = 1;

  requestAnimationFrame(
    animateBg
  );
}


window.addEventListener(
  "resize",
  resizeBg
);

resizeBg();

requestAnimationFrame(
  animateBg
);


/* =========================================================
   CANVAS
========================================================= */

const canvas =
  document.getElementById(
    "gameCanvas"
  );

const ctx =
  canvas.getContext("2d");


let currentGame = null;

let gameLoopId = 0;

let lastTime = 0;

let score = 0;

let isGameOver = false;

let combo = 1;

let runStats = {};


const input = {

  x: 0,

  y: 0,

  isPressed: false

};


const GAME_NAMES = {

  evasion:
    "CYBER-EVASION",

  scroller:
    "SPACE COLLECTOR",

  jumper:
    "PRECISION JUMPER"

};


/* =========================================================
   ACHIEVEMENTS
========================================================= */

const ACHIEVEMENTS = [

  {
    id: "first",

    icon: "🌟",

    title: "İlk Uçuş",

    desc:
      "İlk oyununu tamamla.",

    check:
      s => s.games >= 1
  },

  {
    id: "score500",

    icon: "🏆",

    title: "500 Kulübü",

    desc:
      "Herhangi bir oyunda 500+ skor yap.",

    check:
      s => s.best >= 500
  },

  {
    id: "combo5",

    icon: "🔥",

    title: "Alev Alan",

    desc:
      "×5 combo'ya ulaş.",

    check:
      s => s.maxCombo >= 5
  },

  {
    id: "crystals",

    icon: "💎",

    title: "Kristal Avcısı",

    desc:
      "Tek koşuda 10 kristal topla.",

    check:
      s => s.crystals >= 10
  },

  {
    id: "perfect10",

    icon: "🎯",

    title: "Tam İsabet",

    desc:
      "10 başarılı jumper hamlesi yap.",

    check:
      s => s.jumps >= 10
  },

  {
    id: "survivor",

    icon: "🛡️",

    title: "Hayatta Kalan",

    desc:
      "Cyber-Evasion'da 60 saniye dayan.",

    check:
      s => s.evasionTime >= 60
  },

  {
    id: "daily",

    icon: "☀️",

    title: "Günlük Görev",

    desc:
      "Bugünün görevini tamamla.",

    check:
      s => s.dailyDone
  },

  {
    id: "level5",

    icon: "🚀",

    title: "Seviye 5",

    desc:
      "Oyuncu seviyesini 5'e çıkar.",

    check:
      s => s.level >= 5
  }

];


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getData() {

  return JSON.parse(

    localStorage.getItem(
      "cosmicData"
    )

    ||

    `{
      "xp":0,
      "games":0,
      "total":0,
      "best":0,
      "maxCombo":1,
      "crystals":0,
      "jumps":0,
      "evasionTime":0,
      "dailyDone":false,
      "settings":{
        "sound":true,
        "vibration":true,
        "particles":true
      }
    }`

  );
}


function saveData(data) {

  localStorage.setItem(
    "cosmicData",
    JSON.stringify(data)
  );

}


/* =========================================================
   LEVEL
========================================================= */

function levelInfo(xp) {

  let level = 1;

  let need = 100;

  while (xp >= need) {

    xp -= need;

    level++;

    need =
      Math.floor(
        100 *
        Math.pow(
          1.12,
          level - 1
        )
      );
  }

  return {

    level,

    xp,

    need

  };

}


/* =========================================================
   OYUN SONU İLERLEME
========================================================= */

function addProgress(points) {

  const data =
    getData();

  data.xp +=
    Math.max(
      0,
      Math.floor(points)
    );

  data.games += 1;

  data.total +=
    Math.max(
      0,
      Math.floor(score)
    );

  data.best =
    Math.max(
      data.best,
      Math.floor(score)
    );

  data.maxCombo =
    Math.max(
      data.maxCombo,
      combo
    );

  data.crystals =
    Math.max(
      data.crystals,
      runStats.crystals || 0
    );

  data.jumps =
    Math.max(
      data.jumps,
      runStats.jumps || 0
    );

  data.evasionTime =
    Math.max(
      data.evasionTime,
      runStats.evasionTime || 0
    );

  const level =
    levelInfo(data.xp);

  data.level =
    level.level;

  saveData(data);

}


/* =========================================================
   HIGH SCORE
========================================================= */

function getHighScore(game) {

  return Number(
    localStorage.getItem(
      "high_" + game
    ) || 0
  );

}


function setHighScore(
  game,
  value
) {

  value =
    Math.floor(value);

  if (
    value >
    getHighScore(game)
  ) {

    localStorage.setItem(
      "high_" + game,
      value
    );
  }

}


/* =========================================================
   MENU UPDATE
========================================================= */

function updateMenu() {

  const data =
    getData();

  const level =
    levelInfo(data.xp);


  document.getElementById(
    "player-level"
  ).textContent =
    `LEVEL ${level.level}`;


  document.getElementById(
    "xp-text"
  ).textContent =
    `${level.xp} / ${level.need}`;


  document.getElementById(
    "xp-fill"
  ).style.width =
    `${Math.min(
      100,
      level.xp /
      level.need *
      100
    )}%`;


  document.getElementById(
    "total-score"
  ).textContent =
    data.total.toLocaleString(
      "tr-TR"
    );


  document.getElementById(
    "games-played"
  ).textContent =
    data.games;


  [
    "evasion",
    "scroller",
    "jumper"

  ].forEach(game => {

    document.getElementById(
      "high-" + game
    ).textContent =
      `BEST ${getHighScore(game)}`;

  });


  updateDaily();

}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function updateDaily() {

  const data =
    getData();

  const target = 300;

  const current =
    Math.min(
      target,
      getHighScore("evasion")
    );


  document.getElementById(
    "daily-progress-text"
  ).textContent =
    `${current} / ${target}`;


  document.getElementById(
    "daily-fill"
  ).style.width =
    `${current / target * 100}%`;


  if (
    current >= target &&
    !data.dailyDone
  ) {

    data.dailyDone = true;

    data.xp += 50;

    saveData(data);

  }

}


/* =========================================================
   CANVAS BOYUTU
========================================================= */

function fitCanvasToScreen() {

  const width =
    Math.min(
      window.innerWidth - 20,
      760
    );

  const height =
    Math.min(
      window.innerHeight * 0.60,
      520
    );


  canvas.width =
    Math.max(
      280,
      width
    );

  canvas.height =
    Math.max(
      300,
      height
    );


  input.x =
    canvas.width / 2;

  input.y =
    canvas.height / 2;

}


window.addEventListener(
  "resize",
  () => {

    if (
      document
        .getElementById(
          "game-screen"
        )
        .classList.contains(
          "active"
        )
    ) {

      fitCanvasToScreen();

    }

  }
);


fitCanvasToScreen();


/* =========================================================
   AUDIO
========================================================= */

let audioCtx = null;


function initAudio() {

  if (
    !getData()
      .settings
      .sound
  ) {

    return;
  }


  if (!audioCtx) {

    audioCtx =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

  }


  if (
    audioCtx.state ===
    "suspended"
  ) {

    audioCtx.resume();

  }

}


function playSound(type) {

  if (
    !getData()
      .settings
      .sound
  ) {

    return;
  }

  if (!audioCtx) {
    return;
  }


  try {

    const osc =
      audioCtx.createOscillator();

    const gain =
      audioCtx.createGain();

    osc.connect(gain);

    gain.connect(
      audioCtx.destination
    );


    const now =
      audioCtx.currentTime;


    if (
      type === "collect"
    ) {

      osc.frequency
        .setValueAtTime(
          520,
          now
        );

      osc.frequency
        .exponentialRampToValueAtTime(
          1040,
          now + 0.1
        );

      gain.gain
        .setValueAtTime(
          0.18,
          now
        );

      gain.gain
        .exponentialRampToValueAtTime(
          0.01,
          now + 0.1
        );

      osc.start();

      osc.stop(
        now + 0.1
      );

    }


    else if (
      type === "hit"
    ) {

      osc.type =
        "sawtooth";

      osc.frequency
        .setValueAtTime(
          150,
          now
        );

      osc.frequency
        .exponentialRampToValueAtTime(
          30,
          now + 0.22
        );

      gain.gain
        .setValueAtTime(
          0.25,
          now
        );

      gain.gain
        .exponentialRampToValueAtTime(
          0.01,
          now + 0.22
        );

      osc.start();

      osc.stop(
        now + 0.22
      );

    }


    else {

      osc.frequency
        .setValueAtTime(
          300,
          now
        );

      osc.frequency
        .exponentialRampToValueAtTime(
          650,
          now + 0.08
        );

      gain.gain
        .setValueAtTime(
          0.13,
          now
        );

      gain.gain
        .exponentialRampToValueAtTime(
          0.01,
          now + 0.08
        );

      osc.start();

      osc.stop(
        now + 0.08
      );

    }

  }

  catch (error) {}

}


/* =========================================================
   VIBRATION
========================================================= */

function vibrate(
  duration = 45
) {

  const data =
    getData();

  if (
    data.settings.vibration &&
    navigator.vibrate
  ) {

    navigator.vibrate(
      duration
    );

  }

}


/* =========================================================
   INPUT
========================================================= */

function handlePointer(e) {

  initAudio();


  const rect =
    canvas.getBoundingClientRect();


  const pointer =
    e.touches?.[0] || e;


  input.x =
    (
      pointer.clientX -
      rect.left
    )
    *
    (
      canvas.width /
      rect.width
    );


  input.y =
    (
      pointer.clientY -
      rect.top
    )
    *
    (
      canvas.height /
      rect.height
    );

}


canvas.addEventListener(
  "pointermove",
  handlePointer
);


canvas.addEventListener(
  "pointerdown",
  e => {

    input.isPressed =
      true;

    handlePointer(e);

  }
);


window.addEventListener(
  "pointerup",
  () => {

    input.isPressed =
      false;

  }
);


/* =========================================================
   SCORE
========================================================= */

function updateScore(
  value
) {

  score = value;

  document.getElementById(
    "score"
  ).textContent =
    Math.floor(score);

}


/* =========================================================
   COMBO
========================================================= */

function setCombo(
  value
) {

  combo =
    Math.max(
      1,
      value
    );


  const element =
    document.getElementById(
      "combo-label"
    );


  element.textContent =
    `COMBO ×${combo}`;


  element.classList.remove(
    "combo-hot"
  );


  void element.offsetWidth;


  element.classList.add(
    "combo-hot"
  );

}


/* =========================================================
   PARTICLE TEXT
========================================================= */

function showFloatingText(
  text,
  x,
  y
) {

  if (
    !getData()
      .settings
      .particles
  ) {

    return;
  }


  const element =
    document.createElement(
      "div"
    );


  element.className =
    "particle-text";


  element.textContent =
    text;


  element.style.left =
    `${Math.min(
      window.innerWidth - 80,
      Math.max(
        10,
        x
      )
    )}px`;


  element.style.top =
    `${Math.max(
      20,
      y
    )}px`;


  document.body.appendChild(
    element
  );


  setTimeout(
    () => element.remove(),
    700
  );

}


/* =========================================================
   PARTICLES
========================================================= */

let particles = [];


function createParticles(
  x,
  y,
  color = "#00f2fe",
  count = 10
) {

  if (
    !getData()
      .settings
      .particles
  ) {

    return;
  }


  for (
    let i = 0;
    i < count;
    i++
  ) {

    particles.push({

      x,

      y,

      vx:
        (
          Math.random() -
          0.5
        ) *
        130,

      vy:
        (
          Math.random() -
          0.5
        ) *
        130,

      life:
        0.45,

      max:
        0.45,

      color,

      size:
        Math.random() *
        3 +
        1

    });

  }

}


function drawParticles(
  dt
) {

  for (
    let i =
      particles.length - 1;
    i >= 0;
    i--
  ) {

    const p =
      particles[i];


    p.life -= dt;

    p.x +=
      p.vx * dt;

    p.y +=
      p.vy * dt;

    p.vy +=
      80 * dt;


    if (
      p.life <= 0
    ) {

      particles.splice(
        i,
        1
      );

      continue;
    }


    ctx.globalAlpha =
      p.life / p.max;

    ctx.fillStyle =
      p.color;

    ctx.fillRect(
      p.x,
      p.y,
      p.size,
      p.size
    );

  }


  ctx.globalAlpha = 1;

}


/* =========================================================
   GAME CONTROL
========================================================= */

function cancelGame() {

  cancelAnimationFrame(
    gameLoopId
  );

  gameLoopId = 0;

  lastTime = 0;

}


function showMenu() {

  cancelGame();


  document
    .getElementById(
      "main-menu"
    )
    .classList.add(
      "active"
    );


  document
    .getElementById(
      "game-screen"
    )
    .classList.remove(
      "active"
    );


  document
    .getElementById(
      "game-over"
    )
    .classList.add(
      "hidden"
    );


  updateMenu();

}


function launchGame(
  game
) {

  initAudio();


  document
    .getElementById(
      "main-menu"
    )
    .classList.remove(
      "active"
    );


  document
    .getElementById(
      "game-screen"
    )
    .classList.add(
      "active"
    );


  currentGame =
    game;


  document.getElementById(
    "game-title"
  ).textContent =
    GAME_NAMES[game];


  document.getElementById(
    "control-hint"
  ).textContent =

    game === "scroller"

      ? "Basılı tut: yüksel • Bırak: düş"

      : game === "jumper"

      ? "Dokun: zıpla"

      : "Sürükle: hareket et";


  restartCurrentGame();

}


function restartCurrentGame() {

  document
    .getElementById(
      "game-over"
    )
    .classList.add(
      "hidden"
    );


  cancelGame();


  score = 0;

  combo = 1;

  particles = [];

  isGameOver = false;


  runStats = {

    crystals: 0,

    jumps: 0,

    evasionTime: 0

  };


  updateScore(0);

  setCombo(1);


  if (
    currentGame ===
    "evasion"
  ) {

    initEvasion();

  }


  if (
    currentGame ===
    "scroller"
  ) {

    initScroller();

  }


  if (
    currentGame ===
    "jumper"
  ) {

    initJumper();

  }

}


/* =========================================================
   GAME OVER
========================================================= */

function triggerGameOver(
  detail = ""
) {

  if (isGameOver) {
    return;
  }


  isGameOver = true;


  playSound("hit");

  vibrate(100);


  setHighScore(
    currentGame,
    score
  );


  addProgress(
    Math.floor(
      score / 10
    ) + 10
  );


  document.getElementById(
    "final-score"
  ).textContent =
    Math.floor(score);


  document.getElementById(
    "result-detail"
  ).textContent =
    detail;


  document
    .getElementById(
      "game-over"
    )
    .classList.remove(
      "hidden"
    );


  updateMenu();

}


/* =========================================================
   1. CYBER EVASION
========================================================= */

let player;

let hazards;

let powerups;

let shieldActive;

let shieldTimer;


function initEvasion() {

  player = {

    x:
      canvas.width / 2,

    y:
      canvas.height / 2,

    radius:
      12

  };


  hazards = [];

  powerups = [];

  shieldActive = false;

  shieldTimer = null;


  loopEvasion();

}


function loopEvasion(
  timestamp
) {

  if (isGameOver) {
    return;
  }


  const dt =
    Math.min(
      (
        timestamp -
        lastTime
      ) / 1000 || 0.016,
      0.04
    );


  lastTime =
    timestamp;


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "rgba(5,9,19,.96)";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  player.x +=
    (
      input.x -
      player.x
    )
    *
    Math.min(
      1,
      9 * dt
    );


  player.y +=
    (
      input.y -
      player.y
    )
    *
    Math.min(
      1,
      9 * dt
    );


  /* POWERUP */

  if (
    Math.random() <
    dt * 0.8 &&
    powerups.length === 0
  ) {

    powerups.push({

      x:
        Math.random() *
        (
          canvas.width -
          50
        ) +
        25,

      y: -15,

      r: 9

    });

  }


  for (
    let i =
      powerups.length - 1;
    i >= 0;
    i--
  ) {

    const p =
      powerups[i];


    p.y +=
      130 * dt;


    ctx.fillStyle =
      "#ffb703";


    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      p.r,
      0,
      Math.PI * 2
    );

    ctx.fill();


    if (
      Math.hypot(
        player.x - p.x,
        player.y - p.y
      )
      <
      player.radius + p.r
    ) {

      shieldActive =
        true;


      clearTimeout(
        shieldTimer
      );


      shieldTimer =
        setTimeout(
          () => {

            shieldActive =
              false;

          },
          4000
        );


      playSound(
        "collect"
      );

      vibrate(35);

      createParticles(
        p.x,
        p.y,
        "#ffb703",
        16
      );


      showFloatingText(
        "SHIELD",
        p.x,
        p.y
      );


      powerups.splice(
        i,
        1
      );


      setCombo(
        combo + 1
      );

    }


    if (
      p.y >
      canvas.height + 20
    ) {

      powerups.splice(
        i,
        1
      );

    }

  }


  /* HAZARDS */

  if (
    Math.random() <
    dt * 4.1
  ) {

    hazards.push({

      x:
        Math.random() *
        canvas.width,

      y: -15,

      r:
        Math.random() *
        8 +
        7,

      s:
        150 +
        Math.random() *
        90

    });

  }


  for (
    let i =
      hazards.length - 1;
    i >= 0;
    i--
  ) {

    const h =
      hazards[i];


    h.y +=
      h.s * dt;


    ctx.fillStyle =
      "#ff0055";


    ctx.shadowBlur =
      14;

    ctx.shadowColor =
      "#ff0055";


    ctx.beginPath();

    ctx.arc(
      h.x,
      h.y,
      h.r,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.shadowBlur = 0;


    const collision =
      Math.hypot(
        player.x - h.x,
        player.y - h.y
      )
      <
      player.radius + h.r;


    if (collision) {

      if (shieldActive) {

        shieldActive =
          false;

        playSound("hit");

        vibrate(45);

        createParticles(
          h.x,
          h.y,
          "#ffb703",
          22
        );

        hazards.splice(
          i,
          1
        );

        setCombo(
          combo + 1
        );

        continue;

      }

      else {

        triggerGameOver(

          `Combo ×${combo} • ${Math.floor(
            runStats.evasionTime
          )} sn`

        );

        return;

      }

    }


    if (
      h.y >
      canvas.height + 30
    ) {

      hazards.splice(
        i,
        1
      );

    }

  }


  runStats.evasionTime +=
    dt;


  updateScore(
    score + dt * 10
  );


  document.getElementById(
    "game-stat-left"
  ).textContent =

    shieldActive

      ? "🛡 KALKAN AKTİF"

      : "SURVIVE";


  document.getElementById(
    "game-stat-right"
  ).textContent =

    `${Math.floor(
      runStats.evasionTime
    )}s`;


  drawParticles(dt);


  /* PLAYER */

  ctx.fillStyle =
    shieldActive
      ? "#ffb703"
      : "#00f2fe";


  ctx.shadowBlur =
    18;

  ctx.shadowColor =
    ctx.fillStyle;


  ctx.beginPath();

  ctx.arc(
    player.x,
    player.y,
    player.radius,
    0,
    Math.PI * 2
  );

  ctx.fill();


  if (shieldActive) {

    ctx.strokeStyle =
      "rgba(255,183,3,.7)";

    ctx.lineWidth = 3;


    ctx.beginPath();

    ctx.arc(
      player.x,
      player.y,
      20,
      0,
      Math.PI * 2
    );

    ctx.stroke();

  }


  ctx.shadowBlur = 0;


  gameLoopId =
    requestAnimationFrame(
      loopEvasion
    );

}


/* =========================================================
   2. SPACE COLLECTOR
========================================================= */

let ship;

let crystals;

let obstacles;

let energy;

let scrollDistance;


function initScroller() {

  ship = {

    x: 55,

    y:
      canvas.height / 2,

    vy: 0,

    size: 12

  };


  crystals = [];

  obstacles = [];

  energy = 100;

  scrollDistance = 0;


  loopScroller();

}


function loopScroller(
  timestamp
) {

  if (isGameOver) {
    return;
  }


  const dt =
    Math.min(
      (
        timestamp -
        lastTime
      ) / 1000 || 0.016,
      0.04
    );


  lastTime =
    timestamp;


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "rgba(5,9,19,.96)";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  const acceleration =
    230;


  if (input.isPressed) {

    ship.vy -=
      acceleration * dt;

    energy -=
      8 * dt;

  }

  else {

    ship.vy +=
      175 * dt;

  }


  ship.vy *=
    Math.pow(
      0.96,
      dt * 60
    );


  ship.y +=
    ship.vy * dt;


  scrollDistance +=
    170 * dt;


  if (
    ship.y < 0 ||
    ship.y > canvas.height ||
    energy <= 0
  ) {

    triggerGameOver(

      `Mesafe ${Math.floor(
        scrollDistance
      )}m • Kristal ${
        runStats.crystals
      }`

    );

    return;

  }


  /* CRYSTALS */

  if (
    Math.random() <
    dt * 1.5
  ) {

    crystals.push({

      x:
        canvas.width + 20,

      y:
        Math.random() *
        (
          canvas.height -
          60
        ) +
        30

    });

  }


  for (
    let i =
      crystals.length - 1;
    i >= 0;
    i--
  ) {

    const c =
      crystals[i];


    c.x -=
      180 * dt;


    ctx.fillStyle =
      "#00f2fe";


    ctx.shadowBlur =
      12;

    ctx.shadowColor =
      "#00f2fe";


    ctx.save();

    ctx.translate(
      c.x,
      c.y
    );

    ctx.rotate(
      Math.PI / 4
    );

    ctx.fillRect(
      -5,
      -5,
      10,
      10
    );

    ctx.restore();


    ctx.shadowBlur = 0;


    if (
      Math.hypot(
        ship.x - c.x,
        ship.y - c.y
      )
      <
      ship.size + 9
    ) {

      crystals.splice(
        i,
        1
      );


      energy =
        Math.min(
          100,
          energy + 24
        );


      runStats.crystals++;


      const gained =
        20 * combo;


      updateScore(
        score + gained
      );


      setCombo(
        combo + 1
      );


      playSound(
        "collect"
      );


      vibrate(25);


      createParticles(
        c.x,
        c.y,
        "#00f2fe",
        14
      );


      showFloatingText(
        `+${gained}`,
        c.x,
        c.y
      );

    }


    else if (
      c.x < -30
    ) {

      crystals.splice(
        i,
        1
      );

    }

  }


  /* OBSTACLES */

  if (
    Math.random() <
    dt * 0.85
  ) {

    obstacles.push({

      x:
        canvas.width + 20,

      y:
        Math.random() *
        (
          canvas.height -
          100
        ),

      w: 22,

      h:
        60 +
        Math.random() *
        55

    });

  }


  for (
    let i =
      obstacles.length - 1;
    i >= 0;
    i--
  ) {

    const o =
      obstacles[i];


    o.x -=
      180 * dt;


    ctx.fillStyle =
      "#ff0055";


    ctx.shadowBlur =
      10;

    ctx.shadowColor =
      "#ff0055";


    ctx.fillRect(
      o.x,
      o.y,
      o.w,
      o.h
    );


    ctx.shadowBlur = 0;


    const collision =

      ship.x +
        ship.size >
        o.x &&

      ship.x -
        ship.size <
        o.x + o.w &&

      ship.y +
        ship.size >
        o.y &&

      ship.y -
        ship.size <
        o.y + o.h;


    if (collision) {

      triggerGameOver(

        `Mesafe ${Math.floor(
          scrollDistance
        )}m • Kristal ${
          runStats.crystals
        }`

      );

      return;

    }


    if (
      o.x < -40
    ) {

      obstacles.splice(
        i,
        1
      );

    }

  }


  /* ENERGY */

  ctx.fillStyle =
    "rgba(255,255,255,.08)";

  ctx.fillRect(
    12,
    12,
    120,
    8
  );


  ctx.fillStyle =
    energy > 30
      ? "#00f2fe"
      : "#ff0055";


  ctx.fillRect(
    12,
    12,
    120 *
      energy /
      100,
    8
  );


  /* SHIP */

  ctx.fillStyle =
    "#4facfe";


  ctx.shadowBlur =
    18;

  ctx.shadowColor =
    "#4facfe";


  ctx.beginPath();

  ctx.arc(
    ship.x,
    ship.y,
    ship.size,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.shadowBlur = 0;


  document.getElementById(
    "game-stat-left"
  ).textContent =
    `ENERGY ${Math.ceil(
      energy
    )}%`;


  document.getElementById(
    "game-stat-right"
  ).textContent =
    `${Math.floor(
      scrollDistance
    )}m`;


  updateScore(
    score + dt * 2
  );


  drawParticles(dt);


  gameLoopId =
    requestAnimationFrame(
      loopScroller
    );

}


/* =========================================================
   3. PRECISION JUMPER
========================================================= */

let angle;

let jumperPlayer;

let center;

let hazardAngles;

let lastJumpState;


function initJumper() {

  const minDimension =
    Math.min(
      canvas.width,
      canvas.height
    );


  center = {

    x:
      canvas.width / 2,

    y:
      canvas.height / 2,

    r:
      minDimension * 0.25

  };


  angle = 0;


  jumperPlayer = {

    size: 9,

    jumping: false,

    jumpHeight: 0,

    jumpStart: 0

  };


  hazardAngles = [

    Math.PI / 2,

    Math.PI,

    (3 * Math.PI) / 2

  ];


  lastJumpState =
    false;


  loopJumper();

}


function loopJumper(
  timestamp
) {

  if (isGameOver) {
    return;
  }


  const dt =
    Math.min(
      (
        timestamp -
        lastTime
      ) / 1000 || 0.016,
      0.04
    );


  lastTime =
    timestamp;


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "rgba(5,9,19,.96)";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  angle +=
    1.55 * dt;


  /* JUMP */

  if (
    input.isPressed &&
    !lastJumpState &&
    !jumperPlayer.jumping
  ) {

    jumperPlayer.jumping =
      true;

    jumperPlayer.jumpHeight =
      46;

    jumperPlayer.jumpStart =
      angle;


    playSound(
      "jump"
    );

    vibrate(25);

  }


  lastJumpState =
    input.isPressed;


  if (
    jumperPlayer.jumping
  ) {

    jumperPlayer.jumpHeight -=
      115 * dt;


    if (
      jumperPlayer.jumpHeight <=
      0
    ) {

      jumperPlayer.jumping =
        false;

      jumperPlayer.jumpHeight =
        0;


      runStats.jumps++;


      updateScore(
        score +
        10 * combo
      );

    }

  }


  /* ORBIT */

  ctx.strokeStyle =
    "rgba(0,242,254,.35)";

  ctx.lineWidth = 3;


  ctx.beginPath();

  ctx.arc(
    center.x,
    center.y,
    center.r,
    0,
    Math.PI * 2
  );

  ctx.stroke();


  const currentRadius =
    center.r +
    jumperPlayer.jumpHeight;


  const px =
    center.x +
    Math.cos(angle) *
    currentRadius;


  const py =
    center.y +
    Math.sin(angle) *
    currentRadius;


  /* HAZARDS */

  for (
    const hazardAngle
    of hazardAngles
  ) {

    const hx =
      center.x +
      Math.cos(
        hazardAngle
      ) *
      center.r;


    const hy =
      center.y +
      Math.sin(
        hazardAngle
      ) *
      center.r;


    ctx.fillStyle =
      "#ff0055";


    ctx.shadowBlur =
      12;

    ctx.shadowColor =
      "#ff0055";


    ctx.beginPath();

    ctx.arc(
      hx,
      hy,
      11,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.shadowBlur = 0;


    const distance =
      Math.hypot(
        px - hx,
        py - hy
      );


    if (
      distance <
      jumperPlayer.size +
      11
    ) {

      triggerGameOver(

        `${runStats.jumps} başarılı zıplama • Combo ×${combo}`

      );

      return;

    }


    if (
      !jumperPlayer.jumping &&
      distance < 28 &&
      Math.abs(
        Math.sin(
          angle -
          hazardAngle
        )
      ) < 0.22
    ) {

      setCombo(
        combo + 1
      );

    }

  }


  /* PLAYER */

  ctx.fillStyle =
    "#00f2fe";


  ctx.shadowBlur =
    18;

  ctx.shadowColor =
    "#00f2fe";


  ctx.beginPath();

  ctx.arc(
    px,
    py,
    jumperPlayer.size,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.shadowBlur = 0;


  document.getElementById(
    "game-stat-left"
  ).textContent =

    jumperPlayer.jumping
      ? "JUMP!"
      : "READY";


  document.getElementById(
    "game-stat-right"
  ).textContent =
    `JUMPS ${runStats.jumps}`;


  drawParticles(dt);


  gameLoopId =
    requestAnimationFrame(
      loopJumper
    );

}


/* =========================================================
   MODAL
========================================================= */

function openModal(
  html
) {

  document.getElementById(
    "modal-content"
  ).innerHTML =
    html;


  document.getElementById(
    "modal"
  ).classList.remove(
    "hidden"
  );

}


function closeModal() {

  document.getElementById(
    "modal"
  ).classList.add(
    "hidden"
  );

}


/* =========================================================
   ACHIEVEMENTS MODAL
========================================================= */

function openAchievements() {

  const data =
    getData();

  const level =
    levelInfo(
      data.xp
    );


  const state = {

    ...data,

    level:
      level.level

  };


  const html = `

    <span class="panel-label">
      COLLECTION
    </span>

    <h2>
      🏆 BAŞARIMLAR
    </h2>

    ${ACHIEVEMENTS.map(
      achievement => {

        const unlocked =
          achievement.check(
            state
          );


        return `

          <div
            class="achievement
            ${
              unlocked
                ? "unlocked"
                : ""
            }"
          >

            <div
              class="achievement-icon"
            >
              ${achievement.icon}
            </div>

            <div>

              <h3>
                ${achievement.title}
              </h3>

              <p>
                ${achievement.desc}
              </p>

            </div>

            <span
              class="achievement-state"
            >
              ${
                unlocked
                  ? "AÇILDI"
                  : "KİLİTLİ"
              }
            </span>

          </div>

        `;

      }
    ).join("")}

  `;


  openModal(
    html
  );

}


/* =========================================================
   SETTINGS
========================================================= */

function openSettings() {

  const data =
    getData();


  const html = `

    <span class="panel-label">
      SYSTEM
    </span>

    <h2>
      ⚙ AYARLAR
    </h2>


    <div class="setting-row">

      <span>
        Ses efektleri
      </span>

      <button
        class="toggle"
        onclick="
          toggleSetting('sound')
        "
      >
        ${
          data.settings.sound
            ? "AÇIK"
            : "KAPALI"
        }
      </button>

    </div>


    <div class="setting-row">

      <span>
        Titreşim
      </span>

      <button
        class="toggle"
        onclick="
          toggleSetting('vibration')
        "
      >
        ${
          data.settings.vibration
            ? "AÇIK"
            : "KAPALI"
        }
      </button>

    </div>


    <div class="setting-row">

      <span>
        Particle efektleri
      </span>

      <button
        class="toggle"
        onclick="
          toggleSetting('particles')
        "
      >
        ${
          data.settings.particles
            ? "AÇIK"
            : "KAPALI"
        }
      </button>

    </div>


    <button
      class="btn danger"
      onclick="resetProgress()"
    >
      TÜM İLERLEMEYİ SIFIRLA
    </button>

  `;


  openModal(
    html
  );

}


/* =========================================================
   SETTINGS TOGGLE
========================================================= */

function toggleSetting(
  key
) {

  const data =
    getData();


  data.settings[key] =
    !data.settings[key];


  saveData(data);


  openSettings();

}


/* =========================================================
   RESET
========================================================= */

function resetProgress() {

  const confirmed =
    confirm(
      "Tüm skorlar, XP ve başarımlar silinsin mi?"
    );


  if (!confirmed) {
    return;
  }


  localStorage.removeItem(
    "cosmicData"
  );


  [
    "evasion",
    "scroller",
    "jumper"

  ].forEach(game => {

    localStorage.removeItem(
      "high_" + game
    );

  });


  closeModal();

  updateMenu();

}


/* =========================================================
   MODAL DIŞINA TIKLAMA
========================================================= */

document
  .getElementById("modal")
  .addEventListener(
    "click",
    event => {

      if (
        event.target.id ===
        "modal"
      ) {

        closeModal();

      }

    }
  );


/* =========================================================
   BAŞLANGIÇ
========================================================= */

updateMenu();