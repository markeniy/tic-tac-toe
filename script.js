const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");

const twoPlayersBtn = document.getElementById("twoPlayersBtn");
const aiModeBtn = document.getElementById("aiModeBtn");
const backBtn = document.getElementById("backBtn");
const newRoundBtn = document.getElementById("newRoundBtn");
const resetAllBtn = document.getElementById("resetAllBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleBtnGame = document.getElementById("themeToggleBtnGame");
const soundToggleBtn = document.getElementById("soundToggleBtn");

const statusText = document.getElementById("status");
const modeLabel = document.getElementById("modeLabel");

const scoreXText = document.getElementById("scoreX");
const scoreOText = document.getElementById("scoreO");
const scoreDrawText = document.getElementById("scoreDraw");

const resultModal = document.getElementById("resultModal");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const playAgainBtn = document.getElementById("playAgainBtn");

const cells = Array.from(document.querySelectorAll(".cell"));

const winPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

let board = Array(9).fill("");
let currentPlayer = "X";
let gameActive = false;
let gameMode = "pvp";
let aiThinking = false;
let currentTheme = localStorage.getItem("ticTacToeTheme") || "dark";
let soundEnabled = localStorage.getItem("ticTacToeSound") !== "off";
let audioContext = null;

let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;

loadScores();
updateScoreUI();
applyTheme();
updateSoundButton();

twoPlayersBtn.addEventListener("click", () => startGame("pvp"));
aiModeBtn.addEventListener("click", () => startGame("ai"));
backBtn.addEventListener("click", goToMenu);
newRoundBtn.addEventListener("click", resetBoard);
resetAllBtn.addEventListener("click", resetAll);
themeToggleBtn.addEventListener("click", toggleTheme);
themeToggleBtnGame.addEventListener("click", toggleTheme);
soundToggleBtn.addEventListener("click", toggleSound);
playAgainBtn.addEventListener("click", () => {
  hideModal();
  resetBoard();
});

cells.forEach((cell) => {
  cell.addEventListener("click", () => {
    const index = Number(cell.dataset.index);
    handleCellClick(index);
  });
});

function startGame(mode) {
  gameMode = mode;
  menuScreen.classList.remove("active");
  gameScreen.classList.add("active");
  modeLabel.textContent = mode === "ai" ? "Режим: против компьютера" : "Режим: вдвоём";
  resetBoard();
}

function goToMenu() {
  gameActive = false;
  aiThinking = false;
  gameScreen.classList.remove("active");
  menuScreen.classList.add("active");
  hideModal();
}

function handleCellClick(index) {
  if (!gameActive || aiThinking || board[index] !== "") {
    return;
  }

  makeMove(index, currentPlayer);

  const winnerData = getWinner();
  if (winnerData) {
    finishGameWithWinner(winnerData);
    return;
  }

  if (isDraw()) {
    finishGameWithDraw();
    return;
  }

  switchPlayer();

  if (gameMode === "ai" && currentPlayer === "O" && gameActive) {
    aiThinking = true;
    updateStatus();
    updateBoardState();
    window.setTimeout(aiMove, 450);
  }
}

function makeMove(index, player) {
  board[index] = player;
  const cell = cells[index];

  cell.textContent = player;
  cell.classList.remove("pop", "x", "o");
  cell.classList.add("pop", player.toLowerCase());
  playSound(player === "X" ? "moveX" : "moveO");

  updateBoardState();
}

function switchPlayer() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateStatus();
  updateBoardState();
}

function getWinner() {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;

    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return {
        player: board[a],
        pattern
      };
    }
  }

  return null;
}

function isDraw() {
  return board.every((cell) => cell !== "");
}

function finishGameWithWinner(winnerData) {
  gameActive = false;
  aiThinking = false;
  statusText.textContent = `Победил: ${winnerData.player}`;
  highlightWinner(winnerData.pattern);
  playSound("win");

  if (winnerData.player === "X") {
    scoreX += 1;
  } else {
    scoreO += 1;
  }

  updateScoreUI();
  updateBoardState();
  saveScores();

  const resultTextValue = gameMode === "ai" && winnerData.player === "O"
    ? "Компьютер победил"
    : `Игрок ${winnerData.player} победил`;

  showModal("Победа!", resultTextValue);
}

function finishGameWithDraw() {
  gameActive = false;
  aiThinking = false;
  statusText.textContent = "Ничья";
  playSound("draw");
  scoreDraw += 1;
  updateScoreUI();
  updateBoardState();
  saveScores();
  showModal("Ничья", "Никто не победил в этом раунде");
}

function highlightWinner(pattern) {
  pattern.forEach((index) => {
    cells[index].classList.add("winner");
  });
}

function resetBoard() {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameActive = true;
  aiThinking = false;

  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("winner", "pop", "x", "o");
    cell.disabled = false;
  });

  hideModal();
  updateStatus();
  updateBoardState();
}

function resetAll() {
  resetBoard();
  scoreX = 0;
  scoreO = 0;
  scoreDraw = 0;
  updateScoreUI();
  saveScores();
}

function updateScoreUI() {
  scoreXText.textContent = String(scoreX);
  scoreOText.textContent = String(scoreO);
  scoreDrawText.textContent = String(scoreDraw);
}

function updateStatus() {
  if (aiThinking)  {
    statusText.textContent = "Ход компьютера: O";
    return;
  }

  if (gameMode === "ai") {
    statusText.textContent = currentPlayer === "X" ? "Ваш ход: X" : "Ход компьютера: O";
    return;
  }

  statusText.textContent = `Ход: ${currentPlayer}`;
}

function updateBoardState() {
  cells.forEach((cell, index) => {
    const blockedForAiTurn = gameMode === "ai" && currentPlayer === "O";
    cell.disabled = !gameActive || aiThinking || blockedForAiTurn || board[index] !== "";
  });
}

function saveScores() {
  localStorage.setItem(
    "ticTacToeScores",
    JSON.stringify({
      scoreX,
      scoreO,
      scoreDraw
    })
  );
}

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme();
  localStorage.setItem("ticTacToeTheme", currentTheme);
  playSound("toggle");
}

function applyTheme() {
  document.body.dataset.theme = currentTheme;
  const label = currentTheme === "dark" ? "Тема: тёмная" : "Тема: светлая";
  themeToggleBtn.textContent = label;
  themeToggleBtnGame.textContent = label;
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem("ticTacToeSound", soundEnabled ? "on" : "off");
  updateSoundButton();

  if (soundEnabled) {
    playSound("toggle");
  }
}

function updateSoundButton() {
  soundToggleBtn.textContent = soundEnabled ? "Звук: вкл" : "Звук: выкл";
}

function loadScores() {
  const saved = localStorage.getItem("ticTacToeScores");
  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    scoreX = parsed.scoreX || 0;
    scoreO = parsed.scoreO || 0;
    scoreDraw = parsed.scoreDraw || 0;
  } catch (error) {
    scoreX = 0;
    scoreO = 0;
    scoreDraw = 0;
  }
}

function aiMove() {
  if (!gameActive) {
    aiThinking = false;
    updateBoardState();
    return;
  }

  let move = findWinningMove("O");

  if (move === -1) {
    move = findWinningMove("X");
  }

  if (move === -1 && board[4] === "") {
    move = 4;
  }

  if (move === -1) {
    const corners = [0, 2, 6, 8].filter((index) => board[index] === "");
    if (corners.length > 0) {
      move = corners[Math.floor(Math.random() * corners.length)];
    }
  }

  if (move === -1) {
    const emptyCells = board
      .map((value, index) => (value === "" ? index : null))
      .filter((index) => index !== null);

    move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  aiThinking = false;
  makeMove(move, "O");

  const winnerData = getWinner();
  if (winnerData) {
    finishGameWithWinner(winnerData);
    return;
  }

  if (isDraw()) {
    finishGameWithDraw();
    return;
  }

  switchPlayer();
}

function findWinningMove(player) {
  for (const pattern of winPatterns) {
    const values = pattern.map((index) => board[index]);
    const playerCount = values.filter((value) => value === player).length;
    const emptyCount = values.filter((value) => value === "").length;

    if (playerCount === 2 && emptyCount === 1) {
      for (const index of pattern) {
        if (board[index] === "") {
          return index;
        }
      }
    }
  }

  return -1;
}

function showModal(title, text) {
  resultTitle.textContent = title;
  resultText.textContent = text;
  resultModal.classList.remove("hidden");
  resultModal.setAttribute("aria-hidden", "false");
}

function hideModal() {
  resultModal.classList.add("hidden");
  resultModal.setAttribute("aria-hidden", "true");
}

function playSound(type) {
  if (!soundEnabled) {
    return;
  }

  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const now = context.currentTime;

  if (type === "moveX") {
    tone(context, 392, now, 0.08, "triangle", 0.05);
    tone(context, 523.25, now + 0.04, 0.1, "triangle", 0.03);
    return;
  }

  if (type === "moveO") {
    tone(context, 261.63, now, 0.09, "sine", 0.05);
    tone(context, 329.63, now + 0.05, 0.11, "sine", 0.03);
    return;
  }

  if (type === "win") {
    tone(context, 392, now, 0.12, "triangle", 0.05);
    tone(context, 523.25, now + 0.08, 0.14, "triangle", 0.04);
    tone(context, 659.25, now + 0.16, 0.18, "triangle", 0.03);
    return;
  }

  if (type === "draw") {
    tone(context, 280, now, 0.1, "sine", 0.045);
    tone(context, 240, now + 0.08, 0.13, "sine", 0.04);
    return;
  }

  if (type === "toggle") {
    tone(context, 440, now, 0.06, "square", 0.03);
    tone(context, 660, now + 0.04, 0.08, "square", 0.02);
  }
}

function getAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  return audioContext;
}

function tone(context, frequency, startTime, duration, waveType, volume) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = waveType;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}
