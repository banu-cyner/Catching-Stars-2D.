// Ganti dengan URL Google Apps Script milik Anda
const SCRIPT_URL = "URL_WEB_APP_GOOGLE_SCRIPT_ANDA";

// Elemen DOM
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");

const playerForm = document.getElementById("player-form");
const usernameInput = document.getElementById("username");
const waInput = document.getElementById("wa-number");

const scoreDisplay = document.getElementById("score-display");
const timerDisplay = document.getElementById("timer-display");
const finalScoreDisplay = document.getElementById("final-score");
const leaderboardList = document.getElementById("leaderboard-list");
const restartBtn = document.getElementById("restart-btn");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Data Permainan
let currentUser = { username: "", wa: "" };
let score = 0;
let timeLeft = 30;
let gameInterval = null;
let timerInterval = null;

// Objek Pemain & Target (Bintang)
let player = { x: 180, y: 350, width: 40, height: 10, speed: 7 };
let target = { x: 0, y: 0, radius: 10, speed: 3 };
let keys = {};

// Kontrol Keyboard
document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// Event: Form Submit
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

// Event: Restart Button
restartBtn.addEventListener("click", () => {
  endScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  playerForm.reset();
});

// Memulai Game
function startGame() {
  score = 0;
  timeLeft = 30;
  scoreDisplay.textContent = score;
  timerDisplay.textContent = timeLeft;

  resetTarget();

  // Loop utama game
  gameInterval = setInterval(updateGame, 1000 / 60);

  // Timer countdown
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// Menaruh posisi bintang baru secara acak
function resetTarget() {
  target.x = Math.random() * (canvas.width - 20) + 10;
  target.y = 0;
}

// Logika Pergerakan & Render
function updateGame() {
  // Pergerakan Pemain
  if ((keys["ArrowLeft"] || keys["a"]) && player.x > 0) {
    player.x -= player.speed;
  }
  if ((keys["ArrowRight"] || keys["d"]) && player.x + player.width < canvas.width) {
    player.x += player.speed;
  }

  // Pergerakan Target (Jatuh)
  target.y += target.speed;

  // Deteksi Tabrakan (Player menangkap bintang)
  if (
    target.y + target.radius >= player.y &&
    target.x >= player.x &&
    target.x <= player.x + player.width
  ) {
    score += 10;
    scoreDisplay.textContent = score;
    resetTarget();
  }

  // Jika bintang melewati batas bawah
  if (target.y > canvas.height) {
    resetTarget();
  }

  // Render Visual Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gambar Pemain (Papan)
  ctx.fillStyle = "#e94560";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Gambar Target (Bintang Lingkaran)
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
  ctx.fill();
}

// Selesai Permainan
function endGame() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);

  gameScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");
  finalScoreDisplay.textContent = score;

  // Kirim data ke Google Sheets & ambil Leaderboard
  saveScoreToDatabase(currentUser.username, currentUser.wa, score);
}

// Menyimpan Skor ke Google Sheet (POST)
function saveScoreToDatabase(username, wa, score) {
  leaderboardList.innerHTML = "<li>Mengirim skor & memuat leaderboard...</li>";

  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors", // Digunakan agar tidak terkendala aturan CORS pada Apps Script
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "saveScore",
      username: username,
      wa: wa,
      score: score
    })
  })
    .then(() => {
      // Ambil data leaderboard terbaru setelah jeda singkat
      setTimeout(fetchLeaderboard, 1000);
    })
    .catch((error) => {
      console.error("Gagal menyimpan skor:", error);
      leaderboardList.innerHTML = "<li>Gagal memuat leaderboard.</li>";
    });
}

// Mengambil Top 10 Leaderboard (GET)
function fetchLeaderboard() {
  fetch(SCRIPT_URL)
    .then((response) => response.json())
    .then((data) => {
      leaderboardList.innerHTML = "";
      if (data.length === 0) {
        leaderboardList.innerHTML = "<li>Belum ada data.</li>";
        return;
      }

      data.forEach((entry) => {
        const li = document.createElement("li");
        li.textContent = `${entry.username} — ${entry.score} Poin`;
        leaderboardList.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Gagal mengambil leaderboard:", error);
      leaderboardList.innerHTML = "<li>Gagal memperbarui data.</li>";
    });
                            }
