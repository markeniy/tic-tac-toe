const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");

const twoPlayersBtn = document.getElementById("twoPlayersBtn");
const aiModeBtn = document.getElementById("aiModeBtn");
const variantPicker = document.getElementById("variantPicker");
const standardVariantBtn = document.getElementById("standardVariantBtn");
const chaosVariantBtn = document.getElementById("chaosVariantBtn");
const closeVariantPickerBtn = document.getElementById("closeVariantPickerBtn");
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
let pendingMenuMode = null;
let boardLocked = false;
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

twoPlayersBtn.addEventListener("click", () => openVariantPicker("pvp"));
aiModeBtn.addEventListener("click", () => openVariantPicker("ai"));
standardVariantBtn.addEventListener("click", () => startSelectedVariant("standard"));
chaosVariantBtn.addEventListener("click", () => startSelectedVariant("chaos"));
closeVariantPickerBtn.addEventListener("click", closeVariantPicker);
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
  boardSize = isChaosMode() ? 4 : 3;
  winPatterns = buildWinPatterns(boardSize);

  menuScreen.classList.remove("active");
  gameScreen.classList.add("active");
  updateModeLabel();
  updateDifficultyBadge();
  resetBoard();
}

function openVariantPicker(baseMode) {
  pendingMenuMode = baseMode;
  variantPicker.classList.remove("hidden");
}

function closeVariantPicker() {
  pendingMenuMode = null;
  variantPicker.classList.add("hidden");
}

function startSelectedVariant(variant) {
  if (!pendingMenuMode) {
    return;
  }

  if (pendingMenuMode === "pvp") {
    startGame(variant === "chaos" ? "chaos" : "pvp");
  } else {
    startGame(variant === "chaos" ? "chaos-ai" : "ai");
  }

  closeVariantPicker();
}

function goToMenu() {
  gameActive = false;
  aiThinking = false;
  gameScreen.classList.remove("active");
  menuScreen.classList.add("active");
  closeVariantPicker();
  hideModal();
}

function resetBoard() {
  board = Array(boardSize * boardSize).fill("");
  currentPlayer = "X";
  gameActive = true;
  aiThinking = false;
  boardLocked = false;

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
  if (!gameActive || aiThinking || boardLocked || board[index] !== "") {
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

  if (isChaosMode()) {
    removeRandomEmptyCell(() => {
      const chaosWinner = getWinner();
      if (chaosWinner) {
        finishGameWithWinner(chaosWinner);
        return;
      }

      if (isDraw()) {
        finishGameWithDraw();
        return;
      }

      switchPlayer();

      if (isComputerMode() && currentPlayer === "O" && gameActive) {
        aiThinking = true;
        updateStatus();
        updateBoardState();
        window.setTimeout(aiMove, 450);
      }
    });
    return;
  }

  switchPlayer();

  if (isComputerMode() && currentPlayer === "O" && gameActive) {
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

function removeRandomEmptyCell(onComplete) {
  const edgeEmptyCells = getEdgeEmptyCells();
  const emptyCells = board
    .map((value, index) => (value === "" ? index : null))
    .filter((index) => index !== null);

  if (emptyCells.length === 0) {
    return;
  }

  const removableCells = edgeEmptyCells.length > 0 ? edgeEmptyCells : emptyCells;
  const removedIndex = pickRandom(removableCells);
  animateCellRemoval(removedIndex, onComplete);
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
    const blockedForAiTurn = isComputerMode() && currentPlayer === "O";
    cell.disabled = !gameActive || aiThinking || boardLocked || blockedForAiTurn || board[index] !== "";
  });
}

function getWinner() {
  return getWinnerForBoard(board);
}

function getWinnerForBoard(nextBoard) {
  if (isChaosMode()) {
    return getChaosWinnerForBoard(nextBoard);
  }

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
  if (isComputerMode() && winnerData.player === "O") {
    resultMessage = "Компьютер победил";
  }
  if (isChaosMode()) {
    resultMessage = `Игрок ${winnerData.player} собрал линию на поле 4x4`;
    if (isComputerMode() && winnerData.player === "O") {
      resultMessage = "Компьютер собрал линию на поле 4x4";
    }
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

  const text = isChaosMode()
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

  if (isComputerMode()) {
    statusText.textContent = currentPlayer === "X" ? "Ваш ход: X" : "Ход компьютера: O";
    return;
  }

  if (isChaosMode()) {
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

  if (gameMode === "chaos-ai") {
    modeLabel.textContent = "Режим: 4x4 хаос против компьютера";
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
  if (isComputerMode()) {
    difficultyBadge.textContent = `Бот: ${getDifficultyLabel()}`;
    return;
  }

  if (isChaosMode()) {
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

  if (isChaosMode()) {
    removeRandomEmptyCell(() => {
      const chaosWinner = getWinner();
      if (chaosWinner) {
        finishGameWithWinner(chaosWinner);
        return;
      }

      if (isDraw()) {
        finishGameWithDraw();
        return;
      }

      switchPlayer();
    });
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
  if (isChaosMode() && Math.random() < 0.25) {
    return getChaosStrategicMove("O") ?? getRandomMove();
  }

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
  if (isChaosMode()) {
    const chaosWinningMove = getChaosWinningMove("O");
    if (chaosWinningMove !== -1) {
      return chaosWinningMove;
    }

    const chaosBlockMove = getChaosWinningMove("X");
    if (chaosBlockMove !== -1) {
      return chaosBlockMove;
    }

    if (Math.random() < 0.65) {
      const strategicMove = getChaosStrategicMove("O");
      if (strategicMove !== null) {
        return strategicMove;
      }
    }
  }

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
  if (isChaosMode()) {
    const winningMove = getChaosWinningMove("O");
    if (winningMove !== -1) {
      return winningMove;
    }

    const blockMove = getChaosWinningMove("X");
    if (blockMove !== -1) {
      return blockMove;
    }

    const strategicMove = getChaosStrategicMove("O");
    if (strategicMove !== null) {
      return strategicMove;
    }
  }

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

function getChaosWinnerForBoard(nextBoard) {
  for (const pattern of winPatterns) {
    const compressedEntries = pattern
      .map((index) => ({ index, value: nextBoard[index] }))
      .filter((entry) => entry.value !== "blocked");

    const winner = getWinningStreakFromCompressedLine(compressedEntries);
    if (winner) {
      return winner;
    }
  }

  return null;
}

function getWinningStreakFromCompressedLine(compressedEntries) {
  const requiredLength = compressedEntries.length >= 4 ? 4 : 3;

  if (compressedEntries.length < 3) {
    return null;
  }

  let currentPlayer = "";
  let currentPattern = [];

  for (const entry of compressedEntries) {
    if (entry.value === "") {
      currentPlayer = "";
      currentPattern = [];
      continue;
    }

    if (entry.value === currentPlayer) {
      currentPattern.push(entry.index);
    } else {
      currentPlayer = entry.value;
      currentPattern = [entry.index];
    }

    if (currentPattern.length >= requiredLength) {
      return {
        player: currentPlayer,
        pattern: [...currentPattern]
      };
    }
  }

  return null;
}

function getEdgeEmptyCells() {
  const edgeCells = [];

  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== "") {
      continue;
    }

    const row = Math.floor(index / boardSize);
    const col = index % boardSize;
    const isEdge = row === 0 || row === boardSize - 1 || col === 0 || col === boardSize - 1;

    if (isEdge) {
      edgeCells.push(index);
    }
  }

  return edgeCells;
}

function getChaosWinningMove(player) {
  const emptyCells = getEmptyCells();

  for (const index of emptyCells) {
    const nextBoard = board.slice();
    nextBoard[index] = player;

    if (getChaosWinnerForBoard(nextBoard)?.player === player) {
      return index;
    }
  }

  return -1;
}

function getChaosStrategicMove(player) {
  const emptyCells = getEmptyCells();
  let bestScore = -Infinity;
  let bestMoves = [];

  for (const index of emptyCells) {
    const score = evaluateChaosMove(index, player);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [index];
    } else if (score === bestScore) {
      bestMoves.push(index);
    }
  }

  return bestMoves.length > 0 ? pickRandom(bestMoves) : null;
}

function evaluateChaosMove(index, player) {
  const nextBoard = board.slice();
  nextBoard[index] = player;
  const opponent = player === "X" ? "O" : "X";
  let score = 0;

  for (const pattern of winPatterns) {
    if (!pattern.includes(index)) {
      continue;
    }

    const compressedLine = pattern
      .map((cellIndex) => nextBoard[cellIndex])
      .filter((value) => value !== "blocked");

    const playerCount = compressedLine.filter((value) => value === player).length;
    const opponentCount = compressedLine.filter((value) => value === opponent).length;
    const emptyCount = compressedLine.filter((value) => value === "").length;

    if (opponentCount === 0) {
      score += playerCount * 4;
      score += emptyCount;
    }

    if (playerCount === 0) {
      score -= opponentCount * 3;
    }
  }

  const row = Math.floor(index / boardSize);
  const col = index % boardSize;
  if (row > 0 && row < boardSize - 1 && col > 0 && col < boardSize - 1) {
    score += 3;
  }

  return score;
}

function getEmptyCells() {
  return board
    .map((value, index) => (value === "" ? index : null))
    .filter((index) => index !== null);
}

function isChaosMode() {
  return gameMode === "chaos" || gameMode === "chaos-ai";
}

function isComputerMode() {
  return gameMode === "ai" || gameMode === "chaos-ai";
}

function animateCellRemoval(index, onComplete) {
  const cell = cells[index];
  if (!cell) {
    return;
  }

  boardLocked = true;
  updateBoardState();
  cell.classList.add("removing");
  playSound("block");

  window.setTimeout(() => {
    board[index] = "blocked";
    boardLocked = false;
    renderBoard();

    if (typeof onComplete === "function") {
      onComplete();
    }
  }, 650);
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
