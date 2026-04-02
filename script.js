import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");

const twoPlayersBtn = document.getElementById("twoPlayersBtn");
const aiModeBtn = document.getElementById("aiModeBtn");
const onlineModeBtn = document.getElementById("onlineModeBtn");
const flowModal = document.getElementById("flowModal");
const flowBackBtn = document.getElementById("flowBackBtn");
const flowCloseBtn = document.getElementById("flowCloseBtn");
const flowLocalModeScreen = document.getElementById("flowLocalModeScreen");
const flowAiModeScreen = document.getElementById("flowAiModeScreen");
const flowAiDifficultyScreen = document.getElementById("flowAiDifficultyScreen");
const flowOnlineEntryScreen = document.getElementById("flowOnlineEntryScreen");
const flowOnlineVariantScreen = document.getElementById("flowOnlineVariantScreen");
const flowOnlineJoinScreen = document.getElementById("flowOnlineJoinScreen");
const flowLocalStandardBtn = document.getElementById("flowLocalStandardBtn");
const flowLocalChaosBtn = document.getElementById("flowLocalChaosBtn");
const flowAiStandardBtn = document.getElementById("flowAiStandardBtn");
const flowAiChaosBtn = document.getElementById("flowAiChaosBtn");
const flowEasyDifficultyBtn = document.getElementById("flowEasyDifficultyBtn");
const flowMediumDifficultyBtn = document.getElementById("flowMediumDifficultyBtn");
const flowHardDifficultyBtn = document.getElementById("flowHardDifficultyBtn");
const flowOnlineCreateBtn = document.getElementById("flowOnlineCreateBtn");
const flowOnlineJoinStepBtn = document.getElementById("flowOnlineJoinStepBtn");
const onlineStandardVariantBtn = document.getElementById("onlineStandardVariantBtn");
const onlineChaosVariantBtn = document.getElementById("onlineChaosVariantBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const roomCodeInput = document.getElementById("roomCodeInput");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const onlineConfigHint = document.getElementById("onlineConfigHint");
const onlinePanelMessage = document.getElementById("onlinePanelMessage");
const backBtn = document.getElementById("backBtn");
const newRoundBtn = document.getElementById("newRoundBtn");
const resetAllBtn = document.getElementById("resetAllBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleBtnGame = document.getElementById("themeToggleBtnGame");
const soundToggleBtn = document.getElementById("soundToggleBtn");
const topActions = document.querySelector(".top-actions");
const onlineRoomPanel = document.getElementById("onlineRoomPanel");
const roomCodeBadge = document.getElementById("roomCodeBadge");
const playerBadge = document.getElementById("playerBadge");
const shareLinkInput = document.getElementById("shareLinkInput");
const copyInviteBtn = document.getElementById("copyInviteBtn");
const scoreboard = document.getElementById("scoreboard");
const scoreLabels = scoreboard ? scoreboard.querySelectorAll(".score-box span") : [];

const boardNode = document.getElementById("board");
const statusText = document.getElementById("status");
const resultBanner = document.getElementById("resultBanner");
const modeLabel = document.getElementById("modeLabel");
const difficultyBadge = document.getElementById("difficultyBadge");

const scoreXText = document.getElementById("scoreX");
const scoreOText = document.getElementById("scoreO");
const scoreDrawText = document.getElementById("scoreDraw");

const resultModal = document.getElementById("resultModal");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const playAgainBtn = document.getElementById("playAgainBtn");

const ONLINE_STORAGE_KEY = "ticTacToeOnlineRoles";
const STREAK_STORAGE_KEY = "ticTacToeStreaks";
const ONLINE_ROOM_TTL_MS = 30 * 60 * 1000;
const ANNOUNCER_VOICE_ENABLED = false;
const ANNOUNCER_AUDIO_BASE = "./assets/announcer";
const ANNOUNCER_STREAKS = [
  null,
  null,
  { title: "DOUBLE KILL", speech: "Double kill", file: "double-kill.mp3" },
  { title: "TRIPLE KILL", speech: "Triple kill", file: "triple-kill.mp3" },
  { title: "QUADRA KILL", speech: "Quadra kill", file: "quadra-kill.mp3" },
  { title: "RAMPAGE", speech: "Rampage", file: "rampage.mp3" },
  { title: "DOMINATING", speech: "Dominating", file: "dominating.mp3" },
  { title: "UNSTOPPABLE", speech: "Unstoppable", file: "unstoppable.mp3" },
  { title: "MONSTER KILL", speech: "Monster kill", file: "monster-kill.mp3" },
  { title: "GODLIKE", speech: "Godlike", file: "godlike.mp3" },
  { title: "IMMORTAL", speech: "Immortal", file: "immortal.mp3" }
];
const SUPABASE_CONFIG = window.TIC_TAC_TOE_CONFIG || {};
const hasSupabaseConfig = Boolean(SUPABASE_CONFIG.supabaseUrl && SUPABASE_CONFIG.supabaseAnonKey);
const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_CONFIG.supabaseUrl, SUPABASE_CONFIG.supabaseAnonKey)
  : null;

let cells = [];
let winPatterns = [];
let chaosPatterns = [];
let board = [];
let boardSize = 3;
let currentPlayer = "X";
let gameActive = false;
let gameMode = "pvp";
let aiThinking = false;
let pendingAiVariant = "standard";
let boardLocked = false;
let currentTheme = localStorage.getItem("ticTacToeTheme") || "dark";
let soundEnabled = localStorage.getItem("ticTacToeSound") !== "off";
let botDifficulty = localStorage.getItem("ticTacToeDifficulty") || "medium";
let audioContext = null;
let onlineChannel = null;
let onlineRoomCode = "";
let onlinePlayerSymbol = "";
let onlineState = null;
let onlineResultSignature = "";
let onlineVariant = "standard";
let onlineRemovalTimeoutId = 0;
let activeFlowScreen = "";
let flowHistory = [];

let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;
let winStreak = 0;
let unbeatenStreak = 0;
let streakToastTimeoutId = 0;
let announcerVoice = null;
const announcerAudio = new Map();

const streakToast = document.createElement("div");
streakToast.id = "streakToast";
streakToast.className = "streak-toast hidden";
gameScreen.insertBefore(streakToast, scoreboard);

loadScores();
loadStreaks();
updateScoreUI();
applyTheme();
updateSoundButton();
applyDifficulty();
updateOnlineSetupHint();
applyOnlineVariantButtons();
primeAnnouncerVoices();

if (topActions && themeToggleBtnGame && modeLabel) {
  topActions.insertBefore(themeToggleBtnGame, modeLabel);
}

twoPlayersBtn.addEventListener("click", () => openFlowScreen("local-mode"));
aiModeBtn.addEventListener("click", () => openFlowScreen("ai-mode"));
onlineModeBtn.addEventListener("click", () => openFlowScreen("online-entry"));
flowBackBtn.addEventListener("click", goBackFlowScreen);
flowCloseBtn.addEventListener("click", closeFlowModal);
flowLocalStandardBtn.addEventListener("click", () => {
  closeFlowModal();
  startGame("pvp");
});
flowLocalChaosBtn.addEventListener("click", () => {
  closeFlowModal();
  startGame("chaos");
});
flowAiStandardBtn.addEventListener("click", () => {
  pendingAiVariant = "standard";
  openFlowScreen("ai-difficulty", { pushHistory: true });
});
flowAiChaosBtn.addEventListener("click", () => {
  pendingAiVariant = "chaos";
  openFlowScreen("ai-difficulty", { pushHistory: true });
});
flowEasyDifficultyBtn.addEventListener("click", () => startComputerGame("easy"));
flowMediumDifficultyBtn.addEventListener("click", () => startComputerGame("medium"));
flowHardDifficultyBtn.addEventListener("click", () => startComputerGame("hard"));
flowOnlineCreateBtn.addEventListener("click", () => openFlowScreen("online-variant", { pushHistory: true }));
flowOnlineJoinStepBtn.addEventListener("click", () => openFlowScreen("online-join", { pushHistory: true }));
createRoomBtn.addEventListener("click", createOnlineRoom);
joinRoomBtn.addEventListener("click", joinOnlineRoom);
onlineStandardVariantBtn.addEventListener("click", () => setOnlineVariant("standard"));
onlineChaosVariantBtn.addEventListener("click", () => setOnlineVariant("chaos"));
roomCodeInput.addEventListener("input", () => {
  roomCodeInput.value = normalizeRoomCode(roomCodeInput.value);
});
backBtn.addEventListener("click", goToMenu);
newRoundBtn.addEventListener("click", handleNewRound);
resetAllBtn.addEventListener("click", handleSecondaryAction);
themeToggleBtn.addEventListener("click", toggleTheme);
themeToggleBtnGame.addEventListener("click", toggleTheme);
soundToggleBtn.addEventListener("click", toggleSound);
playAgainBtn.addEventListener("click", () => {
  hideModal();
  if (isOnlineMode()) {
    void resetOnlineRoom();
    return;
  }
  resetBoard();
});
copyInviteBtn.addEventListener("click", copyInviteLink);

if (hasSupabaseConfig) {
  void tryJoinRoomFromUrl();
}

function startGame(mode) {
  gameMode = mode;
  boardSize = isChaosMode() ? 4 : 3;
  winPatterns = buildStandardWinPatterns(boardSize);
  chaosPatterns = isChaosMode() ? buildChaosPatterns(boardSize) : [];

  menuScreen.classList.remove("active");
  gameScreen.classList.add("active");
  updateModeLabel();
  updateDifficultyBadge();
  updateActionButtons();
  updateScoreboardVisibility();
  updateOnlineRoomPanel();
  resetBoard();
}

function openFlowScreen(screen, options = {}) {
  const screens = {
    "local-mode": flowLocalModeScreen,
    "ai-mode": flowAiModeScreen,
    "ai-difficulty": flowAiDifficultyScreen,
    "online-entry": flowOnlineEntryScreen,
    "online-variant": flowOnlineVariantScreen,
    "online-join": flowOnlineJoinScreen
  };

  if (!screens[screen]) {
    return;
  }

  if (options.resetHistory) {
    flowHistory = [];
  } else if (options.pushHistory && activeFlowScreen) {
    flowHistory.push(activeFlowScreen);
  }

  activeFlowScreen = screen;
  Object.values(screens).forEach((node) => node.classList.add("hidden"));
  screens[screen].classList.remove("hidden");
  flowBackBtn.classList.toggle("hidden", flowHistory.length === 0);
  clearOnlinePanelMessage();
  onlineConfigHint.classList.toggle("hidden", hasSupabaseConfig || screen !== "online-entry");
  flowModal.classList.remove("hidden");
  flowModal.setAttribute("aria-hidden", "false");

  if (screen === "online-entry" || screen === "online-join") {
    roomCodeInput.value = roomCodeInput.value || "";
  }

  if (screen === "online-variant") {
    applyOnlineVariantButtons();
  }

  if (screen === "ai-difficulty") {
    syncDifficultyButtons();
  }
}

function goBackFlowScreen() {
  if (flowHistory.length === 0) {
    closeFlowModal();
    return;
  }

  const history = flowHistory.slice();
  const previousScreen = history.pop();
  flowHistory = history;
  openFlowScreen(previousScreen, { resetHistory: true });
  flowHistory = history;
  flowBackBtn.classList.toggle("hidden", flowHistory.length === 0);
}

function closeFlowModal() {
  flowModal.classList.add("hidden");
  flowModal.setAttribute("aria-hidden", "true");
  activeFlowScreen = "";
  flowHistory = [];
  flowBackBtn.classList.add("hidden");
  clearOnlinePanelMessage();
}

function startComputerGame(level) {
  setDifficulty(level);
  closeFlowModal();
  startGame(pendingAiVariant === "chaos" ? "chaos-ai" : "ai");
}

async function createOnlineRoom() {
  if (!ensureOnlineReady()) {
    return;
  }

  setOnlinePanelMessage("Создаю комнату...");
  const selectedBoardSize = onlineVariant === "chaos" ? 4 : 3;

  const roomCode = generateRoomCode();
  const { data, error } = await supabase
    .from("online_rooms")
    .insert({
      room_code: roomCode,
      board: createEmptyBoard(selectedBoardSize),
      current_player: "X",
      status: "waiting",
      winner: null,
      winning_pattern: [],
      board_size: selectedBoardSize
    })
    .select()
    .single();

  if (error) {
    setOnlinePanelMessage("Не получилось создать комнату. Проверь Supabase и SQL-настройку.");
    return;
  }

  persistOnlineRole(roomCode, "X");
  closeFlowModal();
  await startOnlineSession(data, "X");
}

async function joinOnlineRoom() {
  if (!ensureOnlineReady()) {
    return;
  }

  const roomCode = normalizeRoomCode(roomCodeInput.value);
  roomCodeInput.value = roomCode;

  if (!roomCode) {
    setOnlinePanelMessage("Введите код комнаты.");
    return;
  }

  setOnlinePanelMessage("Подключаюсь к комнате...");

  const { data: room, error } = await supabase
    .from("online_rooms")
    .select("*")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (error || !room) {
    setOnlinePanelMessage("Комната не найдена.");
    return;
  }

  if (isOnlineRoomExpired(room)) {
    clearPendingRoomLink();
    clearSavedOnlineRole(roomCode);
    setOnlinePanelMessage("Срок комнаты истёк. Создай новую комнату.");
    return;
  }

  const savedRole = getSavedOnlineRole(roomCode);
  let assignedRole = savedRole;

  if (!assignedRole) {
    if (room.status === "waiting") {
      const { data: joinedRoom, error: joinError } = await supabase
        .from("online_rooms")
        .update({
          status: "playing"
        })
        .eq("room_code", roomCode)
        .eq("status", "waiting")
        .select()
        .single();

      if (joinError || !joinedRoom) {
        setOnlinePanelMessage("Не удалось занять слот игрока O.");
        return;
      }

      persistOnlineRole(roomCode, "O");
      assignedRole = "O";
      closeFlowModal();
      await startOnlineSession(joinedRoom, assignedRole);
      return;
    }

    setOnlinePanelMessage("Комната уже занята. Если это твоя комната, открой её на том же устройстве.");
    return;
  }

  closeFlowModal();
  await startOnlineSession(room, assignedRole);
}

async function startOnlineSession(room, playerSymbol) {
  leaveOnlineRoom({ keepUi: true });

  onlineRoomCode = room.room_code;
  onlinePlayerSymbol = playerSymbol;
  onlineState = room;
  onlineVariant = room.board_size === 4 ? "chaos" : "standard";

  gameMode = getOnlineGameMode(room);
  boardSize = room.board_size || 3;
  winPatterns = buildStandardWinPatterns(boardSize);
  chaosPatterns = isChaosMode() ? buildChaosPatterns(boardSize) : [];

  menuScreen.classList.remove("active");
  gameScreen.classList.add("active");
  updateModeLabel();
  updateDifficultyBadge();
  updateActionButtons();
  updateScoreboardVisibility();
  updateOnlineRoomPanel();
  createBoardCells();
  applyOnlineState(room);
  hideModal();
  clearOnlinePanelMessage();
  subscribeToOnlineRoom(room.room_code);
}

function subscribeToOnlineRoom(roomCode) {
  if (!supabase) {
    return;
  }

  if (onlineChannel) {
    void supabase.removeChannel(onlineChannel);
  }

  onlineChannel = supabase
    .channel(`online-room-${roomCode}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "online_rooms",
        filter: `room_code=eq.${roomCode}`
      },
      (payload) => {
        if (payload.new) {
          applyOnlineState(payload.new);
        }
      }
    )
    .subscribe();
}

async function tryJoinRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const roomCode = normalizeRoomCode(params.get("room") || "");
  if (!roomCode) {
    return;
  }

  roomCodeInput.value = roomCode;
  openFlowScreen("online-join", { resetHistory: true });
  await joinOnlineRoom();
}

function getOnlineRoomTimestamp(room) {
  const source = room?.updated_at || room?.created_at || "";
  const timestamp = Date.parse(source);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isOnlineRoomExpired(room) {
  const timestamp = getOnlineRoomTimestamp(room);
  return !timestamp || Date.now() - timestamp > ONLINE_ROOM_TTL_MS;
}

function clearPendingRoomLink() {
  const url = new URL(window.location.href);
  url.searchParams.delete("room");
  window.history.replaceState({}, "", url);
}

function goToMenu() {
  if (isOnlineMode()) {
    leaveOnlineRoom();
  }

  gameActive = false;
  aiThinking = false;
  boardLocked = false;
  gameScreen.classList.remove("active");
  menuScreen.classList.add("active");
  closeFlowModal();
  hideModal();
  hideResultBanner();
}

function leaveOnlineRoom(options = {}) {
  if (onlineChannel && supabase) {
    void supabase.removeChannel(onlineChannel);
  }

  onlineChannel = null;
  onlineRoomCode = "";
  onlinePlayerSymbol = "";
  onlineState = null;
  onlineResultSignature = "";
  if (onlineRemovalTimeoutId) {
    window.clearTimeout(onlineRemovalTimeoutId);
    onlineRemovalTimeoutId = 0;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("room");
  window.history.replaceState({}, "", url);

  if (!options.keepUi) {
    updateOnlineRoomPanel();
  }
}

function resetBoard() {
  board = createEmptyBoard(boardSize);
  currentPlayer = "X";
  gameActive = true;
  aiThinking = false;
  boardLocked = false;

  createBoardCells();
  hideModal();
  hideResultBanner();
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

  if (isOnlineMode()) {
    void handleOnlineMove(index);
    return;
  }

  makeMove(index, currentPlayer);

  const winnerData = getWinner();
  if (winnerData) {
    if (winnerData.player === "draw") {
      finishGameWithDraw(winnerData.pattern);
      return;
    }
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
        if (chaosWinner.player === "draw") {
          finishGameWithDraw(chaosWinner.pattern);
          return;
        }
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

async function handleOnlineMove(index) {
  if (!onlineState || onlineState.status !== "playing" || currentPlayer !== onlinePlayerSymbol) {
    return;
  }

  if (isOnlineRoomExpired(onlineState)) {
    showResultBanner("Комната истекла из-за неактивности. Создай новую.");
    leaveOnlineRoom();
    goToMenu();
    return;
  }

  boardLocked = true;
  updateBoardState();

  let nextBoard = board.slice();
  nextBoard[index] = onlinePlayerSymbol;
  let winnerData = getWinnerForBoard(nextBoard);
  let draw = !winnerData && isDrawForBoard(nextBoard);
  const nextPlayer = onlinePlayerSymbol === "X" ? "O" : "X";

  const patch = {
    board: nextBoard,
    current_player: nextPlayer,
    winner: null,
    winning_pattern: [],
    status: "playing",
    score_x: onlineState?.score_x ?? 0,
    score_o: onlineState?.score_o ?? 0,
    score_draw: onlineState?.score_draw ?? 0
  };

  if (!winnerData && !draw && isChaosMode()) {
    const removedIndex = pickRandom(getRemovableEmptyCellsForBoard(nextBoard, boardSize));
    if (typeof removedIndex === "number") {
      nextBoard = nextBoard.slice();
      nextBoard[removedIndex] = "blocked";
      patch.board = nextBoard;
      winnerData = getWinnerForBoard(nextBoard);
      draw = !winnerData && isDrawForBoard(nextBoard);
    }
  }

  if (winnerData) {
    patch.winning_pattern = winnerData.pattern;
    patch.status = "finished";
    if (winnerData.player === "draw") {
      patch.winner = "draw";
      patch.score_draw += 1;
    } else {
      patch.winner = winnerData.player;
      if (winnerData.player === "X") {
        patch.score_x += 1;
      } else {
        patch.score_o += 1;
      }
    }
  } else if (draw) {
    patch.winner = "draw";
    patch.status = "finished";
    patch.score_draw += 1;
  }

  const { data, error } = await supabase
    .from("online_rooms")
    .update(patch)
    .eq("room_code", onlineRoomCode)
    .eq("status", "playing")
    .eq("current_player", onlinePlayerSymbol)
    .select()
    .single();

  boardLocked = false;

  if (error || !data) {
    showResultBanner("Ход не применился. Комната уже обновилась у другого игрока.");
    updateBoardState();
    return;
  }

  applyOnlineState(data);
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
    cell.classList.remove("x", "o", "blocked", "winner", "pop", "removing");

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
    const blockedForOnlineTurn = isOnlineMode()
      && (!onlineState || onlineState.status !== "playing" || currentPlayer !== onlinePlayerSymbol);
    cell.disabled = !gameActive
      || aiThinking
      || boardLocked
      || blockedForAiTurn
      || blockedForOnlineTurn
      || board[index] !== "";
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
  handleTrackedOutcome(winnerData.player === "X" ? "win" : "loss");

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

  showResultBanner(resultMessage);
}

function finishGameWithDraw(highlightPattern = []) {
  gameActive = false;
  aiThinking = false;
  statusText.textContent = "Ничья";
  playSound("draw");
  scoreDraw += 1;
  updateScoreUI();
  if (Array.isArray(highlightPattern) && highlightPattern.length > 0) {
    highlightWinner(highlightPattern);
  }
  updateBoardState();
  saveScores();
  handleTrackedOutcome("draw");

  const text = isChaosMode()
    ? "Свободных клеток больше не осталось"
    : "Никто не победил в этом раунде";

  showResultBanner(text);
}

function applyOnlineState(room) {
  const previousBoard = board.slice();
  onlineState = room;
  onlineVariant = room.board_size === 4 ? "chaos" : "standard";
  gameMode = getOnlineGameMode(room);
  boardSize = room.board_size || 3;
  winPatterns = buildStandardWinPatterns(boardSize);
  chaosPatterns = isChaosMode() ? buildChaosPatterns(boardSize) : [];
  const nextBoard = Array.isArray(room.board) ? room.board : createEmptyBoard(boardSize);
  const removedIndex = getOnlineRemovedCellIndex(previousBoard, nextBoard);
  board = nextBoard;
  currentPlayer = room.current_player || "X";
  gameActive = room.status === "playing";
  aiThinking = false;
  boardLocked = false;

  if (onlineRemovalTimeoutId) {
    window.clearTimeout(onlineRemovalTimeoutId);
    onlineRemovalTimeoutId = 0;
  }

  if (cells.length !== board.length) {
    createBoardCells();
  } else {
    if (removedIndex !== -1) {
      const previewBoard = board.slice();
      previewBoard[removedIndex] = "";
      board = previewBoard;
      renderBoard();
      boardLocked = true;
      updateBoardState();

      const cell = cells[removedIndex];
      if (cell) {
        cell.classList.add("removing");
        playSound("block");
      }

      onlineRemovalTimeoutId = window.setTimeout(() => {
        onlineRemovalTimeoutId = 0;
        board = nextBoard;
        boardLocked = false;
        renderBoard();
        finalizeOnlineStateUi(room);
      }, 650);
      return;
    }

    renderBoard();
  }

  finalizeOnlineStateUi(room);
}

function finalizeOnlineStateUi(room) {
  hideModal();
  hideResultBanner();
  updateScoreUI();
  updateStatus();
  updateBoardState();

  if (room.status === "waiting") {
    onlineResultSignature = "";
    statusText.textContent = "Ждём второго игрока. Отправь другу код комнаты.";
    showResultBanner("Комната создана. Второй игрок может зайти по коду или ссылке.");
    return;
  }

  if (room.status === "finished") {
    const resultSignature = `${room.room_code}:${room.winner}:${room.updated_at || ""}`;
    gameActive = false;
    updateBoardState();

    if (room.winner === "draw") {
      statusText.textContent = "Ничья";
      if (Array.isArray(room.winning_pattern)) {
        highlightWinner(room.winning_pattern);
      }
      showResultBanner("Матч завершился вничью.");
      if (onlineResultSignature !== resultSignature) {
        playSound("draw");
        handleTrackedOutcome("draw");
      }
      onlineResultSignature = resultSignature;
      return;
    }

    if (Array.isArray(room.winning_pattern)) {
      highlightWinner(room.winning_pattern);
    }

    statusText.textContent = room.winner === onlinePlayerSymbol
      ? "Ты победил"
      : "Соперник победил";
    showResultBanner(
      room.winner === onlinePlayerSymbol
        ? "Ты победил в онлайн-матче."
        : `Игрок ${room.winner} победил в онлайн-матче.`
    );
    if (onlineResultSignature !== resultSignature) {
      playSound("win");
      handleTrackedOutcome(room.winner === onlinePlayerSymbol ? "win" : "loss");
    }
    onlineResultSignature = resultSignature;
    return;
  }

  onlineResultSignature = "";
}

function highlightWinner(pattern) {
  pattern.forEach((index) => {
    if (cells[index]) {
      cells[index].classList.add("winner");
    }
  });
}

function updateScoreUI() {
  if (isOnlineMode() && onlineState) {
    updateScoreLabels();
    if (onlinePlayerSymbol === "O") {
      scoreXText.textContent = String(onlineState.score_o ?? 0);
      scoreOText.textContent = String(onlineState.score_x ?? 0);
    } else {
      scoreXText.textContent = String(onlineState.score_x ?? 0);
      scoreOText.textContent = String(onlineState.score_o ?? 0);
    }
    scoreDrawText.textContent = String(onlineState.score_draw ?? 0);
    return;
  }

  updateScoreLabels();
  scoreXText.textContent = String(scoreX);
  scoreOText.textContent = String(scoreO);
  scoreDrawText.textContent = String(scoreDraw);
}

function updateScoreLabels() {
  if (!scoreLabels.length) {
    return;
  }

  if (isOnlineMode()) {
    scoreLabels[0].textContent = "Ты";
    scoreLabels[1].textContent = "Соперник";
    scoreLabels[2].textContent = "Ничьи";
    return;
  }

  if (isComputerMode()) {
    scoreLabels[0].textContent = "Ты";
    scoreLabels[1].textContent = "Бот";
    scoreLabels[2].textContent = "Ничьи";
    return;
  }

  scoreLabels[0].textContent = "Крестики";
  scoreLabels[1].textContent = "Нолики";
  scoreLabels[2].textContent = "Ничьи";
}

function updateStatus() {
  if (isOnlineMode()) {
    if (!onlineState || onlineState.status === "waiting") {
      statusText.textContent = "Ждём второго игрока...";
      return;
    }

    if (onlineState.status === "finished") {
      if (onlineState.winner === "draw") {
        statusText.textContent = "Ничья";
        return;
      }

      statusText.textContent = onlineState.winner === onlinePlayerSymbol
        ? "Ты победил"
        : "Соперник победил";
      return;
    }

    statusText.textContent = currentPlayer === onlinePlayerSymbol
      ? `Твой ход: ${onlinePlayerSymbol}`
      : `Ход соперника: ${currentPlayer}`;
    return;
  }

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
  if (gameMode === "online") {
    modeLabel.textContent = "Режим: онлайн 3x3";
    return;
  }

  if (gameMode === "online-chaos") {
    modeLabel.textContent = "Режим: онлайн 4x4 хаос";
    return;
  }

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

function loadStreaks() {
  const saved = localStorage.getItem(STREAK_STORAGE_KEY);
  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    winStreak = parsed.winStreak || 0;
    unbeatenStreak = parsed.unbeatenStreak || 0;
  } catch (error) {
    winStreak = 0;
    unbeatenStreak = 0;
  }
}

function saveStreaks() {
  localStorage.setItem(
    STREAK_STORAGE_KEY,
    JSON.stringify({
      winStreak,
      unbeatenStreak
    })
  );
}

function shouldTrackStreaks() {
  return isComputerMode() || isOnlineMode();
}

function handleTrackedOutcome(outcome) {
  if (!shouldTrackStreaks()) {
    return;
  }

  if (outcome === "win") {
    winStreak += 1;
    unbeatenStreak += 1;
  } else if (outcome === "draw") {
    winStreak = 0;
    unbeatenStreak += 1;
  } else {
    winStreak = 0;
    unbeatenStreak = 0;
  }

  saveStreaks();

  if (outcome === "loss") {
    return;
  }

  if (winStreak >= 2) {
    const announcerEvent = getAnnouncerStreak(winStreak);
    showStreakToast(announcerEvent.title, `Серия побед x${winStreak}`);
    playSound("streak");
    announceStreak(announcerEvent);
    return;
  }

  if (unbeatenStreak >= 3) {
    showStreakToast("NO DEFEAT", `Без поражений x${unbeatenStreak}`);
    playSound("streak");
  }
}

function getAnnouncerStreak(streak) {
  if (streak < ANNOUNCER_STREAKS.length && ANNOUNCER_STREAKS[streak]) {
    return ANNOUNCER_STREAKS[streak];
  }

  return {
    title: `LEGENDARY x${streak}`,
    speech: `Legendary ${streak}`,
    file: "legendary.mp3"
  };
}

function showStreakToast(title, subtitle = "") {
  if (!streakToast) {
    return;
  }

  if (streakToastTimeoutId) {
    window.clearTimeout(streakToastTimeoutId);
  }

  streakToast.innerHTML = `
    <strong class="streak-toast-title">${title}</strong>
    <span class="streak-toast-subtitle">${subtitle}</span>
  `;
  streakToast.classList.remove("hidden", "show");
  void streakToast.offsetWidth;
  streakToast.classList.add("show");

  streakToastTimeoutId = window.setTimeout(() => {
    streakToast.classList.remove("show");
    streakToast.classList.add("hidden");
    streakToastTimeoutId = 0;
  }, 2200);
}

function primeAnnouncerVoices() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const assignVoice = () => {
    announcerVoice = pickAnnouncerVoice(window.speechSynthesis.getVoices());
  };

  assignVoice();
  window.speechSynthesis.addEventListener("voiceschanged", assignVoice, { once: true });
}

function pickAnnouncerVoice(voices) {
  if (!Array.isArray(voices) || voices.length === 0) {
    return null;
  }

  const preferredPatterns = [
    /google us english/i,
    /microsoft david/i,
    /microsoft mark/i,
    /en-us/i,
    /english/i
  ];

  for (const pattern of preferredPatterns) {
    const voice = voices.find((entry) => pattern.test(`${entry.name} ${entry.lang}`));
    if (voice) {
      return voice;
    }
  }

  return voices[0] || null;
}

function announceStreak(announcerEvent) {
  if (announcerEvent?.file && playAnnouncerAudio(announcerEvent.file)) {
    return;
  }

  const text = announcerEvent?.speech || "";
  if (!ANNOUNCER_VOICE_ENABLED || !soundEnabled || !("speechSynthesis" in window) || !text) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = announcerVoice?.lang || "en-US";
    utterance.voice = announcerVoice;
    utterance.rate = 0.92;
    utterance.pitch = 0.78;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    // Ignore announcer failures and keep gameplay uninterrupted.
  }
}

function playAnnouncerAudio(filename) {
  if (!soundEnabled || !filename) {
    return false;
  }

  let audio = announcerAudio.get(filename);
  if (!audio) {
    audio = new Audio(`${ANNOUNCER_AUDIO_BASE}/${filename}`);
    audio.preload = "auto";
    announcerAudio.set(filename, audio);
  }

  try {
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {});
    return true;
  } catch (error) {
    return false;
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
  syncDifficultyButtons();
  updateDifficultyBadge();
}

function syncDifficultyButtons() {
  flowEasyDifficultyBtn.classList.toggle("active", botDifficulty === "easy");
  flowMediumDifficultyBtn.classList.toggle("active", botDifficulty === "medium");
  flowHardDifficultyBtn.classList.toggle("active", botDifficulty === "hard");
}

function updateDifficultyBadge() {
  if (isOnlineMode()) {
    difficultyBadge.textContent = onlineVariant === "chaos"
      ? `Ты: ${onlinePlayerSymbol || "?"} · 4x4`
      : `Ты: ${onlinePlayerSymbol || "?"}`;
    return;
  }

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

function updateActionButtons() {
  if (isOnlineMode()) {
    newRoundBtn.textContent = "Новый матч";
    resetAllBtn.textContent = "Выйти из комнаты";
    return;
  }

  newRoundBtn.textContent = "Новый раунд";
  resetAllBtn.textContent = "Сбросить всё";
}

function updateScoreboardVisibility() {
  scoreboard.classList.remove("hidden");
}

function updateOnlineRoomPanel() {
  const shouldShow = isOnlineMode() && onlineRoomCode;
  onlineRoomPanel.classList.toggle("hidden", !shouldShow);

  if (!shouldShow) {
    return;
  }

  roomCodeBadge.textContent = `Комната: ${onlineRoomCode}`;
  playerBadge.textContent = onlineVariant === "chaos"
    ? `Ты играешь за: ${onlinePlayerSymbol} · 4x4 хаос`
    : `Ты играешь за: ${onlinePlayerSymbol} · 3x3`;
  shareLinkInput.value = `${window.location.origin}${window.location.pathname}?room=${onlineRoomCode}`;
}

function updateOnlineSetupHint() {
  onlineConfigHint.classList.toggle("hidden", hasSupabaseConfig);
}

function setOnlinePanelMessage(text) {
  onlinePanelMessage.textContent = text;
  onlinePanelMessage.classList.toggle("hidden", !text);
}

function clearOnlinePanelMessage() {
  setOnlinePanelMessage("");
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
  const safeMove = board[move] === "" ? move : getRandomMove();

  aiThinking = false;
  makeMove(safeMove, "O");

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

function buildStandardWinPatterns(size) {
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

  const mainDiagonal = [];
  const antiDiagonal = [];

  for (let index = 0; index < size; index += 1) {
    mainDiagonal.push(index * size + index);
    antiDiagonal.push(index * size + (size - 1 - index));
  }

  patterns.push(mainDiagonal, antiDiagonal);

  return patterns;
}

function buildChaosPatterns(size) {
  const patterns = [];

  for (let row = 0; row < size; row += 1) {
    const cells = [];
    for (let col = 0; col < size; col += 1) {
      cells.push(row * size + col);
    }
    patterns.push({ cells, minLength: 2 });
  }

  for (let col = 0; col < size; col += 1) {
    const cells = [];
    for (let row = 0; row < size; row += 1) {
      cells.push(row * size + col);
    }
    patterns.push({ cells, minLength: 2 });
  }

  patterns.push(...buildDiagonalPatterns(size, 3));
  return patterns;
}

function buildDiagonalPatterns(size, minLength) {
  const patterns = [];

  for (let startCol = 0; startCol < size; startCol += 1) {
    const diagonal = [];
    let row = 0;
    let col = startCol;

    while (row < size && col < size) {
      diagonal.push(row * size + col);
      row += 1;
      col += 1;
    }

    if (diagonal.length >= minLength) {
      patterns.push({ cells: diagonal, minLength });
    }
  }

  for (let startRow = 1; startRow < size; startRow += 1) {
    const diagonal = [];
    let row = startRow;
    let col = 0;

    while (row < size && col < size) {
      diagonal.push(row * size + col);
      row += 1;
      col += 1;
    }

    if (diagonal.length >= minLength) {
      patterns.push({ cells: diagonal, minLength });
    }
  }

  for (let startCol = 0; startCol < size; startCol += 1) {
    const diagonal = [];
    let row = 0;
    let col = startCol;

    while (row < size && col >= 0) {
      diagonal.push(row * size + col);
      row += 1;
      col -= 1;
    }

    if (diagonal.length >= minLength) {
      patterns.push({ cells: diagonal, minLength });
    }
  }

  for (let startRow = 1; startRow < size; startRow += 1) {
    const diagonal = [];
    let row = startRow;
    let col = size - 1;

    while (row < size && col >= 0) {
      diagonal.push(row * size + col);
      row += 1;
      col -= 1;
    }

    if (diagonal.length >= minLength) {
      patterns.push({ cells: diagonal, minLength });
    }
  }

  return patterns;
}

function getChaosWinnerForBoard(nextBoard) {
  const winners = [];

  for (const pattern of chaosPatterns) {
    const compressedEntries = pattern.cells
      .map((index) => ({ index, value: nextBoard[index] }))
      .filter((entry) => entry.value !== "blocked");

    const winner = getWinningStreakFromCompressedLine(compressedEntries, pattern.minLength);
    if (winner) {
      winners.push(winner);
    }
  }

  if (winners.length === 0) {
    return null;
  }

  const uniquePlayers = [...new Set(winners.map((winner) => winner.player))];
  if (uniquePlayers.length > 1) {
    return {
      player: "draw",
      pattern: [...new Set(winners.flatMap((winner) => winner.pattern))]
    };
  }

  return winners[0];
}

function getWinningStreakFromCompressedLine(compressedEntries, minLength) {
  if (compressedEntries.length < minLength) {
    return null;
  }

  const requiredLength = compressedEntries.length;

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
  return getEdgeEmptyCellsForBoard(board, boardSize);
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

  for (const pattern of chaosPatterns) {
    if (!pattern.cells.includes(index)) {
      continue;
    }

    const compressedLine = pattern.cells
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
  return gameMode === "chaos" || gameMode === "chaos-ai" || gameMode === "online-chaos";
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

function showResultBanner(text) {
  resultBanner.textContent = text;
  resultBanner.classList.remove("hidden");
}

function hideResultBanner() {
  resultBanner.textContent = "";
  resultBanner.classList.add("hidden");
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
    tapSound(context, now, 980, 0.024, 0.032);
    return;
  }

  if (type === "moveO") {
    tapSound(context, now, 840, 0.026, 0.033);
    return;
  }

  if (type === "block") {
    tone(context, 1420, now, 0.028, "triangle", 0.016, 4200);
    tone(context, 980, now + 0.012, 0.04, "sine", 0.012, 2600);
    tone(context, 1960, now + 0.004, 0.02, "square", 0.006, 5200);
    return;
  }

  if (type === "win") {
    tapSound(context, now, 760, 0.03, 0.026);
    tapSound(context, now + 0.055, 980, 0.04, 0.026);
    tone(context, 1244.51, now + 0.1, 0.2, "triangle", 0.018, 2600);
    return;
  }

  if (type === "draw") {
    tapSound(context, now, 660, 0.03, 0.018);
    tone(context, 560, now + 0.05, 0.16, "triangle", 0.014, 1800);
    return;
  }

  if (type === "toggle") {
    tapSound(context, now, 900, 0.02, 0.018);
    return;
  }

  if (type === "streak") {
    tapSound(context, now, 760, 0.024, 0.022);
    tapSound(context, now + 0.055, 980, 0.028, 0.024);
    tone(context, 1320, now + 0.11, 0.11, "triangle", 0.016, 3000);
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

function tone(context, frequency, startTime, duration, waveType, volume, cutoff = 3200) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const filterNode = context.createBiquadFilter();

  oscillator.type = waveType;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  filterNode.type = "lowpass";
  filterNode.frequency.setValueAtTime(cutoff, startTime);
  filterNode.Q.setValueAtTime(1.1, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.004);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

function tapSound(context, startTime, frequency, duration, volume) {
  tone(context, frequency, startTime, duration, "triangle", volume, 3400);
  tone(context, frequency * 0.52, startTime + 0.001, duration * 0.95, "sine", volume * 0.46, 2200);
  tone(context, frequency * 1.9, startTime, duration * 0.3, "square", volume * 0.18, 5000);
}

function handleNewRound() {
  if (isOnlineMode()) {
    void resetOnlineRoom();
    return;
  }

  resetBoard();
}

function handleSecondaryAction() {
  if (isOnlineMode()) {
    goToMenu();
    return;
  }

  resetAll();
}

async function resetOnlineRoom() {
  if (!supabase || !onlineRoomCode || !onlineState || onlineState.status === "waiting") {
    return;
  }

  if (isOnlineRoomExpired(onlineState)) {
    showResultBanner("Комната истекла из-за неактивности. Создай новую.");
    leaveOnlineRoom();
    goToMenu();
    return;
  }

  boardLocked = true;
  updateBoardState();

  const { data, error } = await supabase
    .from("online_rooms")
    .update({
      board: createEmptyBoard(onlineState.board_size || boardSize || 3),
      current_player: "X",
      status: "playing",
      winner: null,
      winning_pattern: []
    })
    .eq("room_code", onlineRoomCode)
    .select()
    .single();

  boardLocked = false;

  if (error || !data) {
    showResultBanner("Не получилось начать новый матч.");
    updateBoardState();
    return;
  }

  applyOnlineState(data);
}

async function copyInviteLink() {
  if (!shareLinkInput.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
    showResultBanner("Ссылка скопирована.");
  } catch (error) {
    shareLinkInput.select();
    showResultBanner("Скопируй ссылку вручную из поля.");
  }
}

function ensureOnlineReady() {
  if (hasSupabaseConfig) {
    return true;
  }

  setOnlinePanelMessage("Сначала заполни config.js данными своего Supabase-проекта.");
  return false;
}

function normalizeRoomCode(value) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6);
}

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function createEmptyBoard(size) {
  return Array(size * size).fill("");
}

function getOnlineGameMode(room) {
  return room.board_size === 4 ? "online-chaos" : "online";
}

function setOnlineVariant(variant) {
  onlineVariant = variant === "chaos" ? "chaos" : "standard";
  applyOnlineVariantButtons();
}

function applyOnlineVariantButtons() {
  onlineStandardVariantBtn.classList.toggle("secondary-btn", onlineVariant !== "standard");
  onlineChaosVariantBtn.classList.toggle("secondary-btn", onlineVariant !== "chaos");
}

function getEdgeEmptyCellsForBoard(nextBoard, size) {
  const edgeCells = [];

  for (let index = 0; index < nextBoard.length; index += 1) {
    if (nextBoard[index] !== "") {
      continue;
    }

    const row = Math.floor(index / size);
    const col = index % size;
    const isEdge = row === 0 || row === size - 1 || col === 0 || col === size - 1;

    if (isEdge) {
      edgeCells.push(index);
    }
  }

  return edgeCells;
}

function getRemovableEmptyCellsForBoard(nextBoard, size) {
  const edgeCells = getEdgeEmptyCellsForBoard(nextBoard, size);
  const emptyCells = nextBoard
    .map((value, index) => (value === "" ? index : null))
    .filter((index) => index !== null);

  return edgeCells.length > 0 ? edgeCells : emptyCells;
}

function getOnlineRemovedCellIndex(previousBoard, nextBoard) {
  if (!isChaosMode() || previousBoard.length !== nextBoard.length) {
    return -1;
  }

  for (let index = 0; index < nextBoard.length; index += 1) {
    if (previousBoard[index] === "" && nextBoard[index] === "blocked") {
      return index;
    }
  }

  return -1;
}

function persistOnlineRole(roomCode, role) {
  const stored = JSON.parse(localStorage.getItem(ONLINE_STORAGE_KEY) || "{}");
  stored[roomCode] = role;
  localStorage.setItem(ONLINE_STORAGE_KEY, JSON.stringify(stored));
}

function getSavedOnlineRole(roomCode) {
  const stored = JSON.parse(localStorage.getItem(ONLINE_STORAGE_KEY) || "{}");
  return stored[roomCode] || "";
}

function clearSavedOnlineRole(roomCode) {
  const stored = JSON.parse(localStorage.getItem(ONLINE_STORAGE_KEY) || "{}");
  if (!(roomCode in stored)) {
    return;
  }

  delete stored[roomCode];
  localStorage.setItem(ONLINE_STORAGE_KEY, JSON.stringify(stored));
}

function isOnlineMode() {
  return gameMode === "online" || gameMode === "online-chaos";
}
