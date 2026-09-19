// ── UZAY ARKA PLAN ANİMASYONU ──
const bgCanvas = document.getElementById('spaceBg');
const bgCtx = bgCanvas.getContext('2d');
let stars = [];

function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.1
    });
  }
}
window.addEventListener('resize', resizeBg);
resizeBg();

function animateBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgCtx.fillStyle = '#ffffff';
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > bgCanvas.height) s.y = 0;
    bgCtx.globalAlpha = Math.random() * 0.5 + 0.3;
    bgCtx.fillRect(s.x, s.y, s.size, s.size);
  });
  requestAnimationFrame(animateBg);
}
animateBg();

// ── OYUN CANVAS & KONTROLLER ──
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = Math.min(window.innerWidth * 0.92, 800);
canvas.height = Math.min(window.innerHeight * 0.65, 500);

let currentGame = null;
let gameLoopId = null;
let score = 0;
let isGameOver = false;

// ── SES SENTEZLEYİCİSİ ──
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'collect') {
    osc.frequency.setValueAtTime(520, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1040, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.start(); osc.stop(audioCtx.currentTime + 0.25);
  } else if (type === 'jump') {
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.start(); osc.stop(audioCtx.currentTime + 0.08);
  }
}

// ── DOKUNMATİK & MOUSE İŞLEYİCİSİ ──
const input = { x: canvas.width / 2, y: canvas.height / 2, isPressed: false };

function handlePointer(e) {
  initAudio();
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  input.x = clientX - rect.left;
  input.y = clientY - rect.top;
}

canvas.addEventListener('mousemove', handlePointer);
canvas.addEventListener('touchmove', (e) => { handlePointer(e); }, { passive: true });
canvas.addEventListener('mousedown', (e) => { input.isPressed = true; handlePointer(e); });
canvas.addEventListener('mouseup', () => input.isPressed = false);
canvas.addEventListener('touchstart', (e) => { input.isPressed = true; handlePointer(e); }, { passive: true });
canvas.addEventListener('touchend', () => input.isPressed = false);

// ── SKOR HESAPLAMA & MENÜ ──
function getHighScore(g) { return localStorage.getItem(`high_${g}`) || 0; }
function setHighScore(g, val) {
  if (val > getHighScore(g)) localStorage.setItem(`high_${g}`, Math.floor(val));
}

function updateHighScoreBadges() {
  ['evasion', 'scroller', 'jumper'].forEach(g => {
    const el = document.getElementById(`high-${g}`);
    if (el) el.textContent = `En Yüksek: ${getHighScore(g)}`;
  });
}

function showMenu() {
  cancelAnimationFrame(gameLoopId);
  document.getElementById('main-menu').classList.add('active');
  document.getElementById('game-screen').classList.remove('active');
  document.getElementById('game-over').classList.add('hidden');
  updateHighScoreBadges();
}

function launchGame(g) {
  initAudio();
  document.getElementById('main-menu').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  currentGame = g;
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
  playSound('hit');
  setHighScore(currentGame, score);
  document.getElementById('final-score').textContent = Math.floor(score);
  document.getElementById('game-over').classList.remove('hidden');
}

/* ===================================================
   1. CYBER-EVASION (Top-Down Dodge)
   =================================================== */
let player, hazards, powerups, shieldActive;
function initEvasion() {
  player = { x: canvas.width / 2, y: canvas.height / 2, radius: 14 };
  hazards = []; powerups = []; shieldActive = false;
  loopEvasion();
}

function loopEvasion() {
  if (isGameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.x += (input.x - player.x) * 0.15;
  player.y += (input.y - player.y) * 0.15;

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = shieldActive ? '#ffb703' : '#00f2fe';
  ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
  ctx.fill(); ctx.shadowBlur = 0;

  if (Math.random() < 0.004 && powerups.length === 0) {
    powerups.push({ x: Math.random() * (canvas.width - 40) + 20, y: -10, radius: 10 });
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    let p = powerups[i]; p.y += 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb703'; ctx.fill();

    if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + p.radius) {
      shieldActive = true; playSound('collect'); powerups.splice(i, 1);
      setTimeout(() => { shieldActive = false; }, 4000);
    }
  }

  if (Math.random() < 0.08) {
    hazards.push({
      x: Math.random() * canvas.width, y: -10,
      radius: Math.random() * 10 + 8, speed: Math.random() * 3 + 2.5
    });
  }

  for (let i = hazards.length - 1; i >= 0; i--) {
    let h = hazards[i]; h.y += h.speed;
    ctx.beginPath(); ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0055'; ctx.fill();

    if (Math.hypot(player.x - h.x, player.y - h.y) < player.radius + h.radius) {
      if (shieldActive) { shieldActive = false; playSound('hit'); hazards.splice(i, 1); }
      else { triggerGameOver(); return; }
    }
    if (h.y > canvas.height + 20) hazards.splice(i, 1);
  }

  updateScore(score + 0.1);
  gameLoopId = requestAnimationFrame(loopEvasion);
}

/* ===================================================
   2. SPACE COLLECTOR (2D Side-Scroller Roket)
   =================================================== */
let ship, crystals, obstacles, energy;
function initScroller() {
  ship = { x: 70, y: canvas.height / 2, vy: 0, size: 14 };
  crystals = []; obstacles = []; energy = 100;
  loopScroller();
}

function loopScroller() {
  if (isGameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (input.isPressed) { ship.vy -= 0.5; energy -= 0.12; } 
  else { ship.vy += 0.35; }

  ship.vy *= 0.96; ship.y += ship.vy;

  if (ship.y < 0 || ship.y > canvas.height || energy <= 0) {
    triggerGameOver(); return;
  }

  // Roket Çizimi
  ctx.fillStyle = '#4facfe'; ctx.beginPath();
  ctx.arc(ship.x, ship.y, ship.size, 0, Math.PI * 2); ctx.fill();

  // Enerji Göstergesi
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(15, 15, 120, 10);
  ctx.fillStyle = energy > 30 ? '#00f2fe' : '#ff0055';
  ctx.fillRect(15, 15, (energy / 100) * 120, 10);

  if (Math.random() < 0.03) {
    crystals.push({ x: canvas.width + 20, y: Math.random() * (canvas.height - 40) + 20 });
  }

  for (let i = crystals.length - 1; i >= 0; i--) {
    let c = crystals[i]; c.x -= 3;
    ctx.fillStyle = '#00f2fe'; ctx.fillRect(c.x, c.y, 10, 10);

    if (Math.hypot(ship.x - c.x, ship.y - c.y) < ship.size + 10) {
      crystals.splice(i, 1); energy = Math.min(100, energy + 25);
      playSound('collect'); updateScore(score + 15);
    } else if (c.x < -20) crystals.splice(i, 1);
  }

  if (Math.random() < 0.02) {
    obstacles.push({ x: canvas.width + 20, y: Math.random() * (canvas.height - 70), w: 20, h: 65 });
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let o = obstacles[i]; o.x -= 3;
    ctx.fillStyle = '#ff0055'; ctx.fillRect(o.x, o.y, o.w, o.h);

    if (ship.x + ship.size > o.x && ship.x - ship.size < o.x + o.w &&
        ship.y + ship.size > o.y && ship.y - ship.size < o.y + o.h) {
      triggerGameOver(); return;
    }
    if (o.x < -30) obstacles.splice(i, 1);
  }

  gameLoopId = requestAnimationFrame(loopScroller);
}

/* ===================================================
   3. PRECISION JUMPER (Halka Etrafında Dönme & Zıplama)
   =================================================== */
let angle, jumperPlayer, center, hazardAngles, lastJumpState;
function initJumper() {
  center = { x: canvas.width / 2, y: canvas.height / 2, r: 80 };
  angle = 0;
  jumperPlayer = { r: center.r, size: 10, jumping: false, jumpHeight: 0 };
  hazardAngles = [Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  lastJumpState = false;
  loopJumper();
}

function loopJumper() {
  if (isGameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  angle += 0.035;

  // Dokunma tetikleme tespiti
  if (input.isPressed && !lastJumpState && !jumperPlayer.jumping) {
    jumperPlayer.jumping = true;
    jumperPlayer.jumpHeight = 55;
    playSound('jump');
  }
  lastJumpState = input.isPressed;

  if (jumperPlayer.jumping) {
    jumperPlayer.jumpHeight -= 2.5;
    if (jumperPlayer.jumpHeight <= 0) {
      jumperPlayer.jumping = false;
      jumperPlayer.jumpHeight = 0;
      updateScore(score + 1);
    }
  }

  // Yörünge Çemberi
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
  ctx.lineWidth = 4; ctx.beginPath();
  ctx.arc(center.x, center.y, center.r, 0, Math.PI * 2); ctx.stroke();

  let currentR = center.r + jumperPlayer.jumpHeight;
  let px = center.x + Math.cos(angle) * currentR;
  let py = center.y + Math.sin(angle) * currentR;

  ctx.fillStyle = '#00f2fe'; ctx.beginPath();
  ctx.arc(px, py, jumperPlayer.size, 0, Math.PI * 2); ctx.fill();

  hazardAngles.forEach(hAngle => {
    let hx = center.x + Math.cos(hAngle) * center.r;
    let hy = center.y + Math.sin(hAngle) * center.r;

    ctx.fillStyle = '#ff0055'; ctx.beginPath();
    ctx.arc(hx, hy, 11, 0, Math.PI * 2); ctx.fill();

    if (Math.hypot(px - hx, py - hy) < jumperPlayer.size + 11) {
      triggerGameOver(); return;
    }
  });

  gameLoopId = requestAnimationFrame(loopJumper);
}

window.addEventListener('DOMContentLoaded', () => {
  updateHighScoreBadges();
});
