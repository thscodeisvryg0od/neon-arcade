const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas Boyutları
canvas.width = Math.min(window.innerWidth * 0.9, 800);
canvas.height = Math.min(window.innerHeight * 0.7, 500);

let currentGame = null;
let gameLoopId = null;
let score = 0;
let isGameOver = false;

// ── MOUSE / DOKUNMA TAKİBİ ──
const mouse = { x: canvas.width / 2, y: canvas.height / 2, isDown: false };
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('touchmove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.touches[0].clientX - rect.left;
  mouse.y = e.touches[0].clientY - rect.top;
});
window.addEventListener('keydown', (e) => { if (e.code === 'Space') mouse.isDown = true; });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') mouse.isDown = false; });
canvas.addEventListener('mousedown', () => mouse.isDown = true);
canvas.addEventListener('mouseup', () => mouse.isDown = false);

// ── EKRAN KONTROLLERİ ──
function showMenu() {
  cancelAnimationFrame(gameLoopId);
  document.getElementById('main-menu').classList.add('active');
  document.getElementById('game-screen').classList.remove('active');
  document.getElementById('game-over').classList.add('hidden');
}

function launchGame(gameType) {
  document.getElementById('main-menu').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  document.getElementById('game-over').classList.add('hidden');
  
  currentGame = gameType;
  restartCurrentGame();
}

function restartCurrentGame() {
  document.getElementById('game-over').classList.add('hidden');
  cancelAnimationFrame(gameLoopId);
  score = 0;
  isGameOver = false;
  updateScore(0);

  if (currentGame === 'evasion') initEvasion();
  else if (currentGame === 'scroller') initScroller();
  else if (currentGame === 'jumper') initJumper();
}

function updateScore(val) {
  score = val;
  document.getElementById('score').textContent = Math.floor(score);
}

function triggerGameOver() {
  isGameOver = true;
  document.getElementById('final-score').textContent = Math.floor(score);
  document.getElementById('game-over').classList.remove('hidden');
}

/* ===================================================
   OYUN 1: CYBER-EVASION (Top-Down Dodge)
   =================================================== */
let player, hazards;
function initEvasion() {
  player = { x: canvas.width / 2, y: canvas.height / 2, radius: 12 };
  hazards = [];
  loopEvasion();
}

function loopEvasion() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player Takip
  player.x += (mouse.x - player.x) * 0.1;
  player.y += (mouse.y - player.y) * 0.1;

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#66fcf1';
  ctx.fill();

  // Engel Üretme
  if (Math.random() < 0.08) {
    hazards.push({
      x: Math.random() * canvas.width,
      y: -10,
      radius: Math.random() * 15 + 8,
      speed: Math.random() * 3 + 2
    });
  }

  // Engelleri Güncelleme
  for (let i = hazards.length - 1; i >= 0; i--) {
    let h = hazards[i];
    h.y += h.speed;

    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0055';
    ctx.fill();

    // Çarpışma Testi
    let dist = Math.hypot(player.x - h.x, player.y - h.y);
    if (dist < player.radius + h.radius) {
      triggerGameOver();
      return;
    }

    if (h.y > canvas.height + 20) hazards.splice(i, 1);
  }

  updateScore(score + 0.1);
  gameLoopId = requestAnimationFrame(loopEvasion);
}

/* ===================================================
   OYUN 2: SPACE COLLECTOR (2D Side-Scroller)
   =================================================== */
let ship, crystals, obstacles;
function initScroller() {
  ship = { x: 80, y: canvas.height / 2, vy: 0, size: 15 };
  crystals = [];
  obstacles = [];
  loopScroller();
}

function loopScroller() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Yerçekimi & Kontrol
  if (mouse.isDown) ship.vy -= 0.6;
  else ship.vy += 0.4;

  ship.vy *= 0.95;
  ship.y += ship.vy;

  // Ekran Sınırları
  if (ship.y < 0 || ship.y > canvas.height) { triggerGameOver(); return; }

  // Gemi Çizimi
  ctx.fillStyle = '#45a29e';
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, ship.size, 0, Math.PI * 2);
  ctx.fill();

  // Kristal ve Engel Üretimi
  if (Math.random() < 0.03) {
    crystals.push({ x: canvas.width + 20, y: Math.random() * (canvas.height - 40) + 20 });
  }
  if (Math.random() < 0.02) {
    obstacles.push({ x: canvas.width + 20, y: Math.random() * (canvas.height - 60), w: 20, h: 60 });
  }

  // Kristalleri Güncelle
  for (let i = crystals.length - 1; i >= 0; i--) {
    let c = crystals[i];
    c.x -= 3;
    ctx.fillStyle = '#66fcf1';
    ctx.fillRect(c.x, c.y, 10, 10);

    if (Math.hypot(ship.x - c.x, ship.y - c.y) < ship.size + 10) {
      crystals.splice(i, 1);
      updateScore(score + 10);
    } else if (c.x < -20) crystals.splice(i, 1);
  }

  // Engelleri Güncelle
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let o = obstacles[i];
    o.x -= 3;
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(o.x, o.y, o.w, o.h);

    if (ship.x + ship.size > o.x && ship.x - ship.size < o.x + o.w &&
        ship.y + ship.size > o.y && ship.y - ship.size < o.y + o.h) {
      triggerGameOver();
      return;
    }
    if (o.x < -30) obstacles.splice(i, 1);
  }

  gameLoopId = requestAnimationFrame(loopScroller);
}

/* ===================================================
   OYUN 3: PRECISION JUMPER (Döner Platform)
   =================================================== */
let angle, jumperPlayer, center;
function initJumper() {
  center = { x: canvas.width / 2, y: canvas.height / 2, r: 80 };
  angle = 0;
  jumperPlayer = { r: center.r, size: 10, jumping: false, jumpHeight: 0 };
  loopJumper();
}

function loopJumper() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Açısal Hareket
  angle += 0.03;

  // Zıplama Kontrolü
  if (mouse.isDown && !jumperPlayer.jumping) {
    jumperPlayer.jumping = true;
    jumperPlayer.jumpHeight = 50;
  }

  if (jumperPlayer.jumping) {
    jumperPlayer.jumpHeight -= 2;
    if (jumperPlayer.jumpHeight <= 0) {
      jumperPlayer.jumping = false;
      jumperPlayer.jumpHeight = 0;
      updateScore(score + 1);
    }
  }

  // Merkez Daire
  ctx.strokeStyle = '#45a29e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(center.x, center.y, center.r, 0, Math.PI * 2);
  ctx.stroke();

  // Oyuncu Pozisyonu
  let currentR = center.r + jumperPlayer.jumpHeight;
  let px = center.x + Math.cos(angle) * currentR;
  let py = center.y + Math.sin(angle) * currentR;

  ctx.fillStyle = '#66fcf1';
  ctx.beginPath();
  ctx.arc(px, py, jumperPlayer.size, 0, Math.PI * 2);
  ctx.fill();

  // Engel Çizimi (Belirli açıda duran tekil engel)
  let hazardAngle = Math.PI;
  let hx = center.x + Math.cos(hazardAngle) * center.r;
  let hy = center.y + Math.sin(hazardAngle) * center.r;

  ctx.fillStyle = '#ff0055';
  ctx.beginPath();
  ctx.arc(hx, hy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Çarpışma Testi
  let dist = Math.hypot(px - hx, py - hy);
  if (dist < jumperPlayer.size + 12) {
    triggerGameOver();
    return;
  }

  gameLoopId = requestAnimationFrame(loopJumper);
}
