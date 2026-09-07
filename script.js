const SCRIPT_URL = "URL_WEB_APP_GOOGLE_SCRIPT_ANDA";

// DOM Elements
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");
const leaderboardScreen = document.getElementById("leaderboard-screen");

const playerForm = document.getElementById("player-form");
const usernameInput = document.getElementById("username");
const waInput = document.getElementById("wa-number");

const scoreDisplay = document.getElementById("score-display");
const timerDisplay = document.getElementById("timer-display");
const finalScoreDisplay = document.getElementById("final-score");
const leaderboardList = document.getElementById("leaderboard-list");

const viewLeaderboardBtn = document.getElementById("view-leaderboard-btn");
const endLeaderboardBtn = document.getElementById("end-leaderboard-btn");
const backToMenuBtn = document.getElementById("back-to-menu-btn");
const restartBtn = document.getElementById("restart-btn");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");

// Game State & Config
let currentUser = { username: "", wa: "" };
let score = 0;
let timeLeft = 30;
let gameLoopId = null;
let timerInterval = null;

let player = { x: 140, y: 380, width: 80, height: 14, speed: 7 };
let target = { x: 0, y: 0, radius: 10, speed: 3.5 };
let particles = [];

let moveLeft = false;
let moveRight = false;

// Event: Keyboard Handling
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") moveLeft = true;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") moveRight = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") moveLeft = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") moveRight = false;
});

// Event: Touch & Mouse Button Handling
function bindControl(btn, direction) {
  const start = (e) => {
    e.preventDefault();
    if (direction === "left") moveLeft = true;
    if (direction === "right") moveRight = true;
  };
  const stop = (e) => {
    e.preventDefault();
    if (direction === "left") moveLeft = false;
    if (direction === "right") moveRight = false;
  };

  btn.addEventListener("mousedown", start);
  btn.addEventListener("mouseup", stop);
  btn.addEventListener("mouseleave", stop);
  btn.addEventListener("touchstart", start);
  btn.addEventListener("touchend", stop);
}

bindControl(btnLeft, "left");
bindControl(btnRight, "right");

// Event: Swipe / Drag langsung di Canvas
let touchStartX = 0;
canvas.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const touchX = e.touches[0].clientX;
  const diff = touchX - touchStartX;
  
  if (Math.abs(diff) > 5) {
    if (diff < 0 && player.x > 0) player.x -= player.speed * 1.2;
    if (diff > 0 && player.x + player.width < canvas.width) player.x += player.speed * 1.2;
    touchStartX = touchX;
  }
});

// Event: Submit Form Player
playerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  currentUser.username = usernameInput.value.trim();
  currentUser.wa = waInput.value.trim();

  if (currentUser.username && currentUser.wa) {
    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGame();
  }
});

// Navigation Handlers
function openLeaderboardScreen() {
  startScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  leaderboardScreen.classList.remove("hidden");
  fetchLeaderboard();
}

viewLeaderboardBtn.addEventListener("click", openLeaderboardScreen);
endLeaderboardBtn.addEventListener("click", openLeaderboardScreen);

backToMenuBtn.addEventListener("click", () => {
  leaderboardScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
});

restartBtn.addEventListener("click", () => {
  endScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
});

// Main Functions
function startGame() {
  score = 0;
  timeLeft = 30;
  moveLeft = false;
  moveRight = false;
  particles = [];
  
  player.x = (canvas.width - player.width) / 2;
  scoreDisplay.textContent = score;
  timerDisplay.textContent = `${timeLeft}s`;

  spawnTarget();

  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  if (timerInterval) clearInterval(timerInterval);

  gameLoop();

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `${timeLeft}s`;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function spawnTarget() {
  target.x = Math.random() * (canvas.width - 40) + 20;
  target.y = -10;
  target.speed = 3.5 + Math.floor(score / 50) * 0.5;
}

function createParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      alpha: 1,
      radius: Math.random() * 3 + 1
    });
  }
}

function updateGame() {
  if (moveLeft && player.x > 0) player.x -= player.speed;
  if (moveRight && player.x + player.width < canvas.width) player.x += player.speed;

  target.y += target.speed;

  // Collision Detection
  if (
    target.y + target.radius >= player.y &&
    target.y - target.radius <= player.y + player.height &&
    target.x >= player.x &&
    target.x <= player.x + player.width
  ) {
    score += 10;
    scoreDisplay.textContent = score;
    createParticles(target.x, target.y);
    spawnTarget();
  }

  if (target.y > canvas.height) {
    spawnTarget();
  }

  particles.forEach((p, index) => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.03;
    if (p.alpha <= 0) particles.splice(index, 1);
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Render Papan
  ctx.fillStyle = "#6366f1";
  ctx.beginPath();
  ctx.roundRect(player.x, player.y, player.width, player.height, 6);
  ctx.fill();

  // Render Target
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#f59e0b";
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Render Particles
  particles.forEach((p) => {
    ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function gameLoop() {
  updateGame();
  render();
  gameLoopId = requestAnimationFrame(gameLoop);
}

function endGame() {
  cancelAnimationFrame(gameLoopId);
  clearInterval(timerInterval);

  gameScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");
  finalScoreDisplay.textContent = score;

  saveScore();
}

function saveScore() {
  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "saveScore",
      username: currentUser.username,
      wa: currentUser.wa,
      score: score
    })
  }).catch((err) => console.error("Gagal menyimpan skor:", err));
}

function fetchLeaderboard() {
  leaderboardList.innerHTML = '<li class="loading">Memuat data leaderboard...</li>';

  fetch(SCRIPT_URL)
    .then((res) => res.json())
    .then((data) => {
      leaderboardList.innerHTML = "";
      if (!data || data.length === 0) {
        leaderboardList.innerHTML = '<li class="loading">Belum ada data skor.</li>';
        return;
      }

      data.forEach((entry, index) => {
        const li = document.createElement("li");
        li.textContent = `${entry.username} — ${entry.score} Poin`;
        leaderboardList.appendChild(li);
      });
    })
    .catch((err) => {
      console.error("Gagal memuat leaderboard:", err);
      leaderboardList.innerHTML = '<li class="loading">Gagal memuat leaderboard.</li>';
    });
  }
    
