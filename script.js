const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");

const twoPlayersBtn = document.getElementById("twoPlayersBtn");
const aiModeBtn = document.getElementById("aiModeBtn");
const chaosModeBtn = document.getElementById("chaosModeBtn");
const backBtn = document.getElementById("backBtn");
const newRoundBtn = document.getElementById("newRoundBtn");
const resetAllBtn = document.getElementById("resetAllBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleBtnGame = document.getElementById("themeToggleBtnGame");
const soundToggleBtn = document.getElementById("soundToggleBtn");
const easyDifficultyBtn = document.getElementById("easyDifficultyBtn");
const mediumDifficultyBtn = document.getElementById("mediumDifficultyBtn");
const hardDifficultyBtn = document.getElementById("hardDifficultyBtn");

const boardNode = document.getElementById("board");
const statusText = document.getElementById("status");
const modeLabel = document.getElementById("modeLabel");
const difficultyBadge = document.getElementById("difficultyBadge");

const scoreXText = document.getElementById("scoreX");
const scoreOText = document.getElementById("scoreO");
const scoreDrawText = document.getElementById("scoreDraw");

const resultModal = document.getElementById("resultModal");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const playAgainBtn = document.getElementById("playAgainBtn");

let cells = [];
let winPatterns = [];
let board = [];
let boardSize = 3;
let currentPlayer = "X";
let gameActive = false;
let gameMode = "pvp";
let aiThinking = false;
let currentTheme = localStorage.getItem("ticTacToeTheme") || "dark";
let soundEnabled = localStorage.getItem("ticTacToeSound") !== "off";
let botDifficulty = localStorage.getItem("ticTacToeDifficulty") || "medium";
let audioContext = null;

let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;

loadScores();
updateScoreUI();
applyTheme();
updateSoundButton();
applyDifficulty();

twoPlayersBtn.addEventListener("click", () => startGame("pvp"));
aiModeBtn.addEventListener("click", () => startGame("ai"));
chaosModeBtn.addEventListener("click", () => startGame("chaos"));
backBtn.addEventListener("click", goToMenu);
newRoundBtn.addEventListener("click", resetBoard);
resetAllBtn.addEventListener("click", resetAll);
themeToggleBtn.addEventListener("click", toggleTheme);
themeToggleBtnGame.addEventListener("click", toggleTheme);
soundToggleBtn.addEventListener("click", toggleSound);
easyDifficultyBtn.addEventListener("click", () => setDifficulty("easy"));
mediumDifficultyBtn.addEventListener("click", () => setDifficulty("medium"));
hardDifficultyBtn.addEventListener("click", () => setDifficulty("hard"));
playAgainBtn.addEventListener("click", () => {
  hideModal();
  resetBoard();
});

function startGame(mode) {
  gameMode = mode;
  boardSize = gameMode === "chaos" ? 4 : 3;
  winPatterns = buildWinPatterns(boardSize);

  menuScreen.classList.remove("active");
  gameScreen.classList.add("active");
  updateModeLabel();
  updateDifficultyBadge();
  resetBoard();
}

function goToMenu() {
  gameActive = false;
  aiThinking = false;
  gameScreen.classList.remove("active");
  menuScreen.classList.add("active");
  hideModal();
}

function resetBoard() {
  board = Array(boardSize * boardSize).fill("");
  currentPlayer = "X";
  gameActive = true;
  aiThinking = false;

  createBoardCells();
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

function createBoardCells() {
  boardNode.innerHTML = "";
  boardNode.style.setProperty("--board-size", String(boardSize));
  cells = [];

  for (let index = 0; index < board.length; index += 1) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.index = String(index);
    cell.setAttribute("aria-label", `Клетка ${index + 1}`);
    cell.addEventListener("click", () => handleCellClick(index));
    boardNode.appendChild(cell);
    cells.push(cell);
  }

  renderBoard();
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

  if (gameMode === "chaos") {
    removeRandomEmptyCell();

    const chaosWinner = getWinner();
    if (chaosWinner) {
      finishGameWithWinner(chaosWinner);
      return;
    }

    if (isDraw()) {
      finishGameWithDraw();
      return;
    }
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
  cell.classList.remove("pop", "x", "o", "blocked");
  cell.classList.add("pop", player.toLowerCase());
  playSound(player === "X" ? "moveX" : "moveO");

  updateBoardState();
}

function removeRandomEmptyCell() {
  const emptyCells = board
    .map((value, index) => (value === "" ? index : null))
    .filter((index) => index !== null);

  if (emptyCells.length === 0) {
    return;
  }

  const removedIndex = pickRandom(emptyCells);
  board[removedIndex] = "blocked";
  playSound("block");
  renderBoard();
}

function switchPlayer() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateStatus();
  updateBoardState();
}

function renderBoard() {
  cells.forEach((cell, index) => {
    const value = board[index];
    cell.textContent = value === "blocked" ? "" : value;
    cell.classList.remove("x", "o", "blocked");

    if (value === "X") {
      cell.classList.add("x");
    } else if (value === "O") {
      cell.classList.add("o");
    } else if (value === "blocked") {
      cell.classList.add("blocked");
    }
  });

  updateBoardState();
}

function updateBoardState() {
  cells.forEach((cell, index) => {
    const blockedForAiTurn = gameMode === "ai" && currentPlayer === "O";
    cell.disabled = !gameActive || aiThinking || blockedForAiTurn || board[index] !== "";
  });
}

function getWinner() {
  return getWinnerForBoard(board);
}

function getWinnerForBoard(nextBoard) {
  for (const pattern of winPatterns) {
    const [first, ...rest] = pattern;
    const firstValue = nextBoard[first];

    if (!firstValue || firstValue === "blocked") {
      continue;
    }

    if (rest.every((index) => nextBoard[index] === firstValue)) {
      return {
        player: firstValue,
        pattern
      };
    }
  }

  return null;
}

function isDraw() {
  return board.every((cell) => cell !== "") && !getWinner();
}

function isDrawForBoard(nextBoard) {
  return nextBoard.every((cell) => cell !== "") && !getWinnerForBoard(nextBoard);
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

  let resultMessage = `Игрок ${winnerData.player} победил`;
  if (gameMode === "ai" && winnerData.player === "O") {
    resultMessage = "Компьютер победил";
  }
  if (gameMode === "chaos") {
    resultMessage = `Игрок ${winnerData.player} собрал линию на поле 4x4`;
  }

  showModal("Победа!", resultMessage);
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

  const text = gameMode === "chaos"
    ? "Свободных клеток больше не осталось"
    : "Никто не победил в этом раунде";

  showModal("Ничья", text);
}

function highlightWinner(pattern) {
  pattern.forEach((index) => {
    cells[index].classList.add("winner");
  });
}

function updateScoreUI() {
  scoreXText.textContent = String(scoreX);
  scoreOText.textContent = String(scoreO);
  scoreDrawText.textContent = String(scoreDraw);
}

function updateStatus() {
  if (aiThinking) {
    statusText.textContent = "Ход компьютера: O";
    return;
  }

  if (gameMode === "ai") {
    statusText.textContent = currentPlayer === "X" ? "Ваш ход: X" : "Ход компьютера: O";
    return;
  }

  if (gameMode === "chaos") {
    statusText.textContent = `Ход ${currentPlayer}. После хода исчезнет пустая клетка`;
    return;
  }

  statusText.textContent = `Ход: ${currentPlayer}`;
}

function updateModeLabel() {
  if (gameMode === "ai") {
    modeLabel.textContent = "Режим: против компьютера";
    return;
  }

  if (gameMode === "chaos") {
    modeLabel.textContent = "Режим: 4x4 исчезающие клетки";
    return;
  }

  modeLabel.textContent = "Режим: вдвоём";
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

function setDifficulty(level) {
  botDifficulty = level;
  localStorage.setItem("ticTacToeDifficulty", botDifficulty);
  applyDifficulty();
  updateDifficultyBadge();
  playSound("toggle");
}

function applyDifficulty() {
  easyDifficultyBtn.classList.toggle("active", botDifficulty === "easy");
  mediumDifficultyBtn.classList.toggle("active", botDifficulty === "medium");
  hardDifficultyBtn.classList.toggle("active", botDifficulty === "hard");
  updateDifficultyBadge();
}

function updateDifficultyBadge() {
  if (gameMode === "ai") {
    difficultyBadge.textContent = `Бот: ${getDifficultyLabel()}`;
    return;
  }

  if (gameMode === "chaos") {
    difficultyBadge.textContent = "Особый режим";
    return;
  }

  difficultyBadge.textContent = "Локальная игра";
}

function getDifficultyLabel() {
  if (botDifficulty === "easy") {
    return "лёгкий";
  }

  if (botDifficulty === "hard") {
    return "сложный";
  }

  return "средний";
}

function aiMove() {
  if (!gameActive) {
    aiThinking = false;
    updateBoardState();
    return;
  }

  const move = getAiMove();

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

function getAiMove() {
  if (botDifficulty === "easy") {
    return getEasyMove();
  }

  if (botDifficulty === "hard") {
    return getHardMove();
  }

  return getMediumMove();
}

function getEasyMove() {
  const randomChance = Math.random();

  if (randomChance < 0.7) {
    return getRandomMove();
  }

  const winningMove = findWinningMove("O");
  if (winningMove !== -1) {
    return winningMove;
  }

  if (randomChance < 0.9) {
    return getRandomMove();
  }

  const blockMove = findWinningMove("X");
  if (blockMove !== -1) {
    return blockMove;
  }

  return getRandomMove();
}

function getMediumMove() {
  if (Math.random() < 0.35) {
    return getRandomMove();
  }

  const winningMove = findWinningMove("O");
  if (winningMove !== -1) {
    return winningMove;
  }

  const blockMove = findWinningMove("X");
  if (blockMove !== -1) {
    return blockMove;
  }

  if (Math.random() < 0.5) {
    const tacticalMoves = getStrategicMoves();
    if (tacticalMoves.length > 0) {
      return pickRandom(tacticalMoves);
    }
  }

  return getRandomMove();
}

function getHardMove() {
  const result = minimax(board.slice(), "O", 0);
  return typeof result.index === "number" ? result.index : getRandomMove();
}

function findWinningMove(player) {
  for (const pattern of winPatterns) {
    const values = pattern.map((index) => board[index]);
    const playerCount = values.filter((value) => value === player).length;
    const emptyCount = values.filter((value) => value === "").length;

    if (playerCount === boardSize - 1 && emptyCount === 1) {
      for (const index of pattern) {
        if (board[index] === "") {
          return index;
        }
      }
    }
  }

  return -1;
}

function getStrategicMoves() {
  const moves = [];

  const centerIndex = Math.floor(board.length / 2);
  if (board[centerIndex] === "") {
    moves.push(centerIndex);
  }

  const corners = [0, boardSize - 1, board.length - boardSize, board.length - 1]
    .filter((index, position, array) => array.indexOf(index) === position)
    .filter((index) => board[index] === "");

  moves.push(...corners);

  const sides = board
    .map((value, index) => (value === "" ? index : null))
    .filter((index) => index !== null && !moves.includes(index));

  moves.push(...sides);
  return moves;
}

function getRandomMove() {
  const emptyCells = board
    .map((value, index) => (value === "" ? index : null))
    .filter((index) => index !== null);

  return pickRandom(emptyCells);
}

function minimax(nextBoard, player, depth) {
  const winnerData = getWinnerForBoard(nextBoard);

  if (winnerData?.player === "O") {
    return { score: 10 - depth };
  }

  if (winnerData?.player === "X") {
    return { score: depth - 10 };
  }

  if (isDrawForBoard(nextBoard)) {
    return { score: 0 };
  }

  const moves = [];

  for (let index = 0; index < nextBoard.length; index += 1) {
    if (nextBoard[index] !== "") {
      continue;
    }

    const move = { index };
    nextBoard[index] = player;

    if (player === "O") {
      move.score = minimax(nextBoard, "X", depth + 1).score;
    } else {
      move.score = minimax(nextBoard, "O", depth + 1).score;
    }

    nextBoard[index] = "";
    moves.push(move);
  }

  if (player === "O") {
    let bestScore = -Infinity;
    let bestMoves = [];

    for (const move of moves) {
      if (move.score > bestScore) {
        bestScore = move.score;
        bestMoves = [move];
      } else if (move.score === bestScore) {
        bestMoves.push(move);
      }
    }

    return pickRandom(bestMoves);
  }

  let bestScore = Infinity;
  let bestMoves = [];

  for (const move of moves) {
    if (move.score < bestScore) {
      bestScore = move.score;
      bestMoves = [move];
    } else if (move.score === bestScore) {
      bestMoves.push(move);
    }
  }

  return pickRandom(bestMoves);
}

function buildWinPatterns(size) {
  const patterns = [];

  for (let row = 0; row < size; row += 1) {
    const pattern = [];
    for (let col = 0; col < size; col += 1) {
      pattern.push(row * size + col);
    }
    patterns.push(pattern);
  }

  for (let col = 0; col < size; col += 1) {
    const pattern = [];
    for (let row = 0; row < size; row += 1) {
      pattern.push(row * size + col);
    }
    patterns.push(pattern);
  }

  const leftDiagonal = [];
  const rightDiagonal = [];

  for (let index = 0; index < size; index += 1) {
    leftDiagonal.push(index * size + index);
    rightDiagonal.push(index * size + (size - 1 - index));
  }

  patterns.push(leftDiagonal, rightDiagonal);
  return patterns;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
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

  if (type === "block") {
    tone(context, 196, now, 0.06, "square", 0.04);
    tone(context, 146.83, now + 0.04, 0.08, "square", 0.03);
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
