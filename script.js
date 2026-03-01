const wordList = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
  "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
  "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
  "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me"
];

// --- State ---
let currentWords = [];
let currentWordIndex = 0;
let correctWords = 0;
let incorrectWords = 0;
let timerInterval = null;
let timeLeft = 15;
let selectedTime = 15;
let gameStarted = false;
let wpmHistory = [];
let sessionHistory = [];
let mistakeMap = {};

// --- DOM ---
const wordDisplay = document.getElementById("word-display");
const typingInput = document.getElementById("typing-input");
const wpmDisplay = document.getElementById("wpm");
const accuracyDisplay = document.getElementById("accuracy");
const timerDisplay = document.getElementById("timer");
const restartBtn = document.getElementById("restart-btn");
const resultsDiv = document.getElementById("results");
const gradeEl = document.getElementById("grade");
const resultMessage = document.getElementById("result-message");
const resultWpm = document.getElementById("result-wpm");
const resultAccuracy = document.getElementById("result-accuracy");
const resultCorrect = document.getElementById("result-correct");
const resultIncorrect = document.getElementById("result-incorrect");
const personalBestEl = document.getElementById("personal-best");
const statsDiv = document.getElementById("stats");
const canvas = document.getElementById("wpm-graph");
const ctx = canvas.getContext("2d");
const historyBody = document.getElementById("history-body");
// --- Generate words ---

function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (wpmHistory.length < 2) return;

  const max = Math.max(...wpmHistory, 1);
  const w = canvas.width;
  const h = canvas.height;
  const padding = 16;

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + ((h - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();
  }

  // Gradient fill under line
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, "rgba(245, 240, 232, 0.15)");
  gradient.addColorStop(1, "rgba(245, 240, 232, 0)");

  ctx.beginPath();
  wpmHistory.forEach((wpm, i) => {
    const x = padding + (i / (wpmHistory.length - 1)) * (w - padding * 2);
    const y = h - padding - (wpm / max) * (h - padding * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(w - padding, h - padding);
  ctx.lineTo(padding, h - padding);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = "rgba(245, 240, 232, 0.6)";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  wpmHistory.forEach((wpm, i) => {
    const x = padding + (i / (wpmHistory.length - 1)) * (w - padding * 2);
    const y = h - padding - (wpm / max) * (h - padding * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  wpmHistory.forEach((wpm, i) => {
    const x = padding + (i / (wpmHistory.length - 1)) * (w - padding * 2);
    const y = h - padding - (wpm / max) * (h - padding * 2);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#f5f0e8";
    ctx.fill();
  });
}

function generateWords() {
  currentWords = [];
  for (let i = 0; i < 50; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    currentWords.push(wordList[randomIndex]);
  }
}

// --- Render words ---
function renderWords() {
  wordDisplay.innerHTML = "";
  currentWords.forEach((word, index) => {
    const span = document.createElement("span");
    span.textContent = word + " ";
    span.id = "word-" + index;
    wordDisplay.appendChild(span);
  });
  document.getElementById("word-0").classList.add("active");
}

// --- Highlight current word ---
function highlightCurrentWord() {
  document.querySelectorAll("#word-display span").forEach(span => {
    span.classList.remove("active");
  });
  const current = document.getElementById("word-" + currentWordIndex);
  if (current) {
    current.classList.add("active");
    current.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
function updateHistoryTable() {
  historyBody.innerHTML = "";

  if (sessionHistory.length === 0) return;

  // Show most recent first
  [...sessionHistory].reverse().forEach((run, i) => {
    const tr = document.createElement("tr");
    const num = sessionHistory.length - i;

    const pbKey = "pb_" + run.mode;
    const pb = parseInt(localStorage.getItem(pbKey));
    const isPB = run.wpm === pb;

    tr.innerHTML = `
      <td>${num}</td>
      <td>${run.wpm} <span style="color:rgba(245,240,232,0.25);font-size:0.75rem">wpm</span>${isPB ? '<span class="pb-tag">PB</span>' : ''}</td>
      <td>${run.accuracy}%</td>
      <td>${run.mode}s</td>
      <td class="grade-cell grade-${run.grade}">${run.grade}</td>
    `;
    historyBody.appendChild(tr);
  });
}
// --- Update stats ---
function updateStats() {
  const timeElapsed = (selectedTime - timeLeft) / 60;
  const wpm = timeElapsed > 0 ? Math.round(correctWords / timeElapsed) : 0;
  const total = correctWords + incorrectWords;
  const accuracy = total > 0 ? Math.round((correctWords / total) * 100) : 100;
  wpmDisplay.textContent = wpm;
  accuracyDisplay.textContent = accuracy + "%";
}

// --- Start timer ---
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    // Record WPM every second
    const timeElapsed = (selectedTime - timeLeft) / 60;
    const wpm = timeElapsed > 0 ? Math.round(correctWords / timeElapsed) : 0;
    wpmHistory.push(wpm);
    if (wpm >= 100) triggerEffects();
    drawGraph();

    if (timeLeft === 0) {
      endGame();
    }
  }, 1000);
}

// --- End game ---
function endGame() {
  clearInterval(timerInterval);
  typingInput.disabled = true;

  const total = correctWords + incorrectWords;
  const accuracy = total > 0 ? Math.round((correctWords / total) * 100) : 100;
  const timeElapsed = selectedTime / 60;
  const wpm = Math.round(correctWords / timeElapsed);

  let grade, message;
  if (wpm >= 80 && accuracy >= 95)      { grade = "S"; message = "Legendary speed"; }
  else if (wpm >= 60 && accuracy >= 90) { grade = "A"; message = "Excellent typing"; }
  else if (wpm >= 40 && accuracy >= 80) { grade = "B"; message = "Good job"; }
  else if (wpm >= 25)                   { grade = "C"; message = "Keep practicing"; }
  else                                  { grade = "D"; message = "Just getting started"; }

  const pbKey = "pb_" + selectedTime;
  const prevBest = localStorage.getItem(pbKey);
  if (!prevBest || wpm > parseInt(prevBest)) {
    localStorage.setItem(pbKey, wpm);
    personalBestEl.classList.remove("hidden");
  } else {
    personalBestEl.classList.add("hidden");
  }

  gradeEl.textContent = grade;
  resultMessage.textContent = message;
  resultWpm.textContent = wpm;
  resultAccuracy.textContent = accuracy + "%";
  resultCorrect.textContent = correctWords;
  resultIncorrect.textContent = incorrectWords;

  wordDisplay.classList.add("hidden");
  typingInput.classList.add("hidden");
  statsDiv.classList.add("hidden");
  resultsDiv.classList.remove("hidden");
  canvas.classList.remove("hidden");

  sessionHistory.push({
  wpm,
  accuracy,
  grade,
  mode: selectedTime
});
updateHistoryTable();
}
// ---- HEATMAP ENGINE ----

const keyboardLayout = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m']
];

function buildKeyboard() {
  const keyboard = document.getElementById("keyboard");
  keyboard.innerHTML = "";

  keyboardLayout.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("key-row");

    row.forEach(letter => {
      const key = document.createElement("div");
      key.classList.add("key");
      key.id = "key-" + letter;
      key.innerHTML = `
        <span class="key-label">${letter.toUpperCase()}</span>
        <span class="key-count" id="count-${letter}"></span>
      `;
      rowDiv.appendChild(key);
    });

    keyboard.appendChild(rowDiv);
  });
}

function updateHeatmap() {
  if (Object.keys(mistakeMap).length === 0) return;

  const maxMistakes = Math.max(...Object.values(mistakeMap));

  keyboardLayout.flat().forEach(letter => {
    const key = document.getElementById("key-" + letter);
    const countEl = document.getElementById("count-" + letter);
    if (!key) return;

    const count = mistakeMap[letter] || 0;
    const ratio = count / maxMistakes;

    // Reset classes
    key.classList.remove("heat-low", "heat-mid", "heat-high");
    countEl.textContent = "";

    if (count === 0) return;

    countEl.textContent = "×" + count;

    if (ratio < 0.35)       key.classList.add("heat-low");
    else if (ratio < 0.7)   key.classList.add("heat-mid");
    else                    key.classList.add("heat-high");
  });
}

function recordMistakes(typedWord, correctWord) {
  // Compare letter by letter
  for (let i = 0; i < typedWord.length; i++) {
    const typedChar = typedWord[i];
    const correctChar = correctWord[i];
    if (typedChar !== correctChar && /[a-z]/.test(typedChar)) {
      mistakeMap[typedChar] = (mistakeMap[typedChar] || 0) + 1;
    }
  }
  updateHeatmap();
}

// Build keyboard on load
buildKeyboard();
// --- Init ---
function init() {
  currentWordIndex = 0;
  correctWords = 0;
  incorrectWords = 0;
  timeLeft = selectedTime;
  gameStarted = false;
  timerDisplay.textContent = selectedTime;
  wpmDisplay.textContent = 0;
  accuracyDisplay.textContent = "100%";
  typingInput.value = "";
  typingInput.disabled = false;
  typingInput.focus();
  clearInterval(timerInterval);
  wpmHistory = [];
  mistakeMap = {};
  buildKeyboard();

  resultsDiv.classList.add("hidden");
  wordDisplay.classList.remove("hidden");
  typingInput.classList.remove("hidden");
  statsDiv.classList.remove("hidden");

  generateWords();
  renderWords();
}

// --- Typing listener ---
typingInput.addEventListener("input", () => {
  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }

  const typedValue = typingInput.value;
  const currentWord = currentWords[currentWordIndex];
  const currentSpan = document.getElementById("word-" + currentWordIndex);

  if (typedValue.endsWith(" ")) {
    const typedWord = typedValue.trim();

    if (typedWord === currentWord) {
      currentSpan.classList.add("correct");
      correctWords++;
    } else {
      currentSpan.classList.add("incorrect");
      incorrectWords++;
      recordMistakes(typedWord, currentWord);
    }
    

    currentWordIndex++;
    typingInput.value = "";
    highlightCurrentWord();
    updateStats();

    if (currentWordIndex >= currentWords.length) {
      generateWords();
      renderWords();
      currentWordIndex = 0;
    }
    return;
  }

  if (currentWord.startsWith(typedValue)) {
    currentSpan.style.color = "#f5f0e8";
  } else {
    currentSpan.style.color = "rgba(230, 150, 150, 0.9)";
  }
});

// --- Mode selector ---
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTime = parseInt(btn.dataset.time);
    init();
  });
});

ctx.clearRect(0, 0, canvas.width, canvas.height);
// --- Restart ---
restartBtn.addEventListener("click", () => {
  init();
});

// --- Start ---
init();

// ---- EFFECTS ENGINE ----

const glowOverlay = document.getElementById("glow-overlay");
const particleCanvas = document.getElementById("particle-canvas");
const pCtx = particleCanvas.getContext("2d");

// Resize particle canvas to window
function resizeParticleCanvas() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}
resizeParticleCanvas();
window.addEventListener("resize", resizeParticleCanvas);

// --- Particles ---
let particles = [];

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8 - 3;
    this.alpha = 1;
    this.radius = Math.random() * 3 + 1;
    this.color = Math.random() > 0.5 ? "255,245,220" : "200,230,255";
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15;
    this.alpha -= 0.025;
  }
  draw() {
    pCtx.beginPath();
    pCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    pCtx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
    pCtx.fill();
  }
}

function spawnParticles() {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  for (let i = 0; i < 80; i++) {
    particles.push(new Particle(
      cx + (Math.random() - 0.5) * 400,
      cy + (Math.random() - 0.5) * 200
    ));
  }
}

function animateParticles() {
  pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  particles = particles.filter(p => p.alpha > 0);
  particles.forEach(p => { p.update(); p.draw(); });
  if (particles.length > 0) requestAnimationFrame(animateParticles);
}

// --- Glitch ---
let glitchTimeout = null;

function triggerGlitch() {
  const h1 = document.querySelector("h1");
  h1.setAttribute("data-text", h1.textContent);
  h1.classList.add("glitch-active");
  clearTimeout(glitchTimeout);
  glitchTimeout = setTimeout(() => h1.classList.remove("glitch-active"), 1000);
}

// --- Master trigger ---
let effectsActive = false;

function triggerEffects() {
  if (effectsActive) return;
  effectsActive = true;

  // Glow
  glowOverlay.classList.add("active");

  // Particles
  spawnParticles();
  animateParticles();

  // Glitch
  triggerGlitch();

  // Turn off glow after 3s
  setTimeout(() => {
    glowOverlay.classList.remove("active");
    effectsActive = false;
  }, 3000);
}

// --- Reset effects on init ---
const originalInit = init;
function initWithEffects() {
  effectsActive = false;
  glowOverlay.classList.remove("active");
  particles = [];
  pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  originalInit();
}
restartBtn.addEventListener("click", initWithEffects);
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", initWithEffects);
});

