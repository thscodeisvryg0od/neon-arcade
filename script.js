const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Tuval boyut ayarları
canvas.width = Math.min(window.innerWidth * 0.95, 800);
canvas.height = Math.min(window.innerHeight * 0.70, 500);

let currentGame = null;
let gameLoopId = null;
let score = 0;
let isGameOver = false;

// ── SES SENTEZLEYİCİSİ (Web Audio API) ──
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSound(type) {
  if (!audioCtx) audioCtx = new AudioCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'collect') {
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
  } else if (type === 'jump') {
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.start(); osc.stop(audioCtx.currentTime + 0.12);
  }
}

// ── KONTROL MEKANİZMASI ──
const input = { x: canvas.width / 2, y: canvas.height / 2, isPressed: false };

function updateInput(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  input.x = clientX - rect.left;
  input.y = clientY - rect.top;
}

canvas.addEventListener('mousemove', updateInput);
canvas.addEventListener('touchmove', (e) => { updateInput(e); e.preventDefault(); }, { passive: false });
canvas.addEventListener('mousedown', () => { input.isPressed = true; if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); });
canvas.addEventListener('mouseup', () => input.isPressed = false);
canvas.addEventListener('touchstart', (e) => { input.isPressed = true; updateInput(e); if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); });
canvas.addEventListener('touchend', () => input.isPressed = false);

// ── SKOR VE MENÜ KONTROLLERİ ──
function getHighScore(game) { return localStorage.getItem(`high_${game}`) || 0; }
function setHighScore(game, val) {
  if (val > getHighScore(game)) localStorage.setItem(`high_${game}`, Math.floor(val));
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

function launchGame(gameType) {
  document.getElementById('main-menu').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
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
  playSound('hit');
  setHighScore(currentGame, score);
  document.getElementById('final-score').textContent = Math.floor(score);
  document.getElementById('game-over').classList.remove('hidden');
}

/* ===================================================
   OYUN 1: CYBER-EVASION (Gelişmiş Düşmanlar + Kalkan)
   =================================================== */
let player, hazards, powerups, shieldActive;

function initEvasion() {
  player = { x: canvas.width / 2, y: canvas.height / 2, radius: 14 };
  hazards = [];
  powerups = [];
  shieldActive = false;
  loopEvasion();
}

function loopEvasion() {
  if (isGameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Oyuncu Hareketi
  player.x += (input.x - player.x) * 0.12;
  player.y += (input.y - player.y) * 0.12;

  // Oyuncu Çizimi & Kalkan Efekti
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = shieldActive ? '#ffb340' : '#66fcf1';
  ctx.shadowBlur = 15;
  ctx.shadowColor = ctx.fillStyle;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Güçlendirme (Kalkan) Üretimi
  if (Math.random() < 0.003 && powerups.length === 0) {
    powerups.push({ x: Math.random() * (canvas.width - 40) + 20, y: -10, radius: 10 });
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    let p = powerups[i];
    p.y += 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb340';
    ctx.fill();

    if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + p.radius) {
      shieldActive = true;
      playSound('collect');
      powerups.splice(i, 1);
      setTimeout(() => { shieldActive = false; }, 5000);
    }
  }

  // Düşman Üretimi
  if (Math.random() < 0.09) {
    hazards.push({
      x: Math.random() * canvas.width,
      y: -10,
      radius: Math.random() * 12 + 8,
      speed: Math.random() * 3 + 2.5 + (score * 0.01)
    });
  }

  for (let i = hazards.length - 1; i >= 0; i--) {
    let h = hazards[i];
    h.y += h.speed;

    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0055';
    ctx.fill();

    if (Math.hypot(player.x - h.x, player.y - h.y) < player.radius + h.radius) {
      if (shieldActive) {
        shieldActive = false;
        playSound('hit');
        hazards.splice(i, 1);
      } else {
        triggerGameOver();
        return;
      }
    }

    if (h.y > canvas.height + 20) hazards.splice(i, 1);
  }

  updateScore(score + 0.1);
  gameLoopId = requestAnimationFrame(loopEvasion);
}

/* ===================================================
   OYUN 2: SPACE COLLECTOR (Enerji Barı + Kristalleri Topla)
   =================================================== */
let ship, crystals, obstacles, energy;

function initScroller() {
  ship = { x: 80, y: canvas.height / 2, vy: 0, size: 14 };
  crystals = [];
  obstacles = [];
  energy = 100;
  loopScroller();
}

function loopScroller() {
  if (isGameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // İtme & Enerji Azalması
  if (input.isPressed) {
    ship.vy -= 0.55;
    energy -= 0.15;
    playSound('jump');
  } else {
    ship.vy += 0.35;
  }

  ship.vy *= 0.96;
  ship.y += ship.vy;

  if (ship.y < 0 || ship.y > canvas.height || energy <= 0) {
    triggerGameOver();
    return;
  }

  // Gemi Çizimi
  ctx.fillStyle = '#45a29e';
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, ship.size, 0, Math.PI * 2);
  ctx.fill();

  // Enerji Barı Çizimi
  ctx.fillStyle = '#1f2833';
  ctx.fillRect(20, 20, 150, 12);
  ctx.fillStyle = energy > 30 ? '#66fcf1' : '#ff0055';
  ctx.fillRect(20, 20, (energy / 100) * 150, 12);

  // Kristal üretimi
  if (Math.random() < 0.035) {
    crystals.push({ x: canvas.width + 20, y: Math.random() * (canvas.height - 60) + 30 });
  }

  for (let i = crystals.length - 1; i >= 0; i--) {
    let c = crystals[i];
    c.x -= 3.5;
    ctx.fillStyle = '#66fcf1';
    ctx.fillRect(c.x, c.y, 12, 12);

    if (Math.hypot(ship.x - c.x, ship.y - c.y) < ship.size + 12) {
      crystals.splice(i, 1);
      energy = Math.min(100, energy + 20);
      playSound('collect');
      updateScore(score + 15);
    } else if (c.x < -20) crystals.splice(i, 1);
  }

  // Engeller
  if (Math.random() < 0.02) {
    obstacles.push({ x: canvas.width + 20, y: Math.random() * (canvas.height - 80), w: 22, h: 70 });
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let o = obstacles[i];
    o.x -= 3.5;
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
   OYUN 3: PRECISION JUMPER (Zamanlama & Platform Zıplama)
   =================================================== */
let angle, jumperPlayer, center, hazardAngles;

function initJumper() {
  center = { x: canvas.width / 2, y: canvas.height / 2, r: 85 };
  angle = 0;
  jumperPlayer = { r: center.r, size: 10, jumping: false, jumpHeight: 0 };
  hazardAngles = [Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  loopJumper();
}

function loopJumper() {
  if (isGameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  angle += 0.035;

  if (input.isPressed && !jumperPlayer.jumping) {
    jumperPlayer.jumping = true;
    jumperPlayer.jumpHeight = 55;
    playSound('jump');
  }

  if (jumperPlayer.jumping) {
    jumperPlayer.jumpHeight -= 2.5;
    if (jumperPlayer.jumpHeight <= 0) {
      jumperPlayer.jumping = false;
      jumperPlayer.jumpHeight = 0;
      updateScore(score + 1);
    }
  }

  // Merkez Çember
  ctx.strokeStyle = '#45a29e';
  ctx.lineWidth = 5;
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

  // Engeller
  hazardAngles.forEach(hAngle => {
    let hx = center.x + Math.cos(hAngle) * center.r;
    let hy = center.y + Math.sin(hAngle) * center.r;

    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(hx, hy, 12, 0, Math.PI * 2);
    ctx.fill();

    if (Math.hypot(px - hx, py - hy) < jumperPlayer.size + 12) {
      triggerGameOver();
      return;
    }
  });

  gameLoopId = requestAnimationFrame(loopJumper);
}

// Başlangıç Yüklemesi
window.addEventListener('DOMContentLoaded', () => {
  updateHighScoreBadges();
});
