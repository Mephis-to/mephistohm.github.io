// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[m]));
}

function nowHHMM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ---------- Boot Terminal ----------
const boot = $("#boot");
const desktop = $("#desktop");
const termOut = $("#termOut");
const termInput = $("#termInput");
const userHost = $("#userHost");

let currentUser = "guest";

function printBoot(line, cls = "") {
  const div = document.createElement("div");
  div.className = "line " + cls;
  div.innerHTML = line;
  termOut.appendChild(div);
  termOut.scrollTop = termOut.scrollHeight;
}

function bootPrompt() {
  userHost.textContent = `${currentUser}@arch`;
}

function bootBanner() {
  printBoot(`<span class="muted">[ ok ]</span> booting arch@rice...`);
  printBoot(`<span class="muted">[ ok ]</span> loading hypr-ish session manager...`);
  printBoot(`<span class="muted">[ ok ]</span> starting tty1`);
  printBoot(``);
  printBoot(`Type <code>help</code> for commands.`);
  printBoot(``);
  bootPrompt();
}

function clearBoot() {
  termOut.innerHTML = "";
}

function enterDesktop() {
  boot.classList.add("hidden");
  desktop.classList.remove("hidden");
  $("#deskUserHost").textContent = `${currentUser}@arch`;
  $("#wmTitle").textContent = `Hypr-ish — ${currentUser}`;
  focusPaint();
}

function handleBootCommand(raw) {
  const input = raw.trim();
  if (!input) return;

  printBoot(
    `<span class="cmd">${escapeHtml(`${currentUser}@arch`)}</span>:<span class="path">~</span>$ ${escapeHtml(input)}`
  );

  const [cmd, ...args] = input.split(/\s+/);

  switch (cmd.toLowerCase()) {
    case "help":
      printBoot(`<span class="muted">Commands:</span> help, login [name], clear, whoami`);
      printBoot(`<span class="muted">Tip:</span> type <code>login</code> to enter the desktop.`);
      break;

    case "whoami":
      printBoot(`${escapeHtml(currentUser)}`);
      break;

    case "clear":
      clearBoot();
      break;

    case "login": {
      const name = args.join(" ").trim() || "henrique";
      currentUser = name;
      bootPrompt();
      printBoot(`<span class="muted">auth:</span> welcome, ${escapeHtml(currentUser)}.`);
      printBoot(`<span class="muted">session:</span> starting desktop...`);
      setTimeout(enterDesktop, 400);
      break;
    }

    default:
      printBoot(`<span class="muted">command not found:</span> ${escapeHtml(cmd)}`);
  }
}

termInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const v = termInput.value;
    termInput.value = "";
    handleBootCommand(v);
  }
});

bootBanner();

// ---------- Desktop clock ----------
const clock = $("#clock");
function tickClock() { clock.textContent = nowHHMM(); }
tickClock();
setInterval(tickClock, 1000);

// ---------- Desktop: Windows + Dock ----------
const paintWin = $("#paintWin");
const miniTermWin = $("#miniTermWin");
const miniOut = $("#miniOut");
const miniInput = $("#miniInput");

$("#btnOpenPaint").addEventListener("click", () => {
  paintWin.classList.remove("hidden");
  focusPaint();
});
$("#btnClosePaint").addEventListener("click", () => paintWin.classList.add("hidden"));

$("#btnOpenTerminal").addEventListener("click", () => {
  miniTermWin.classList.remove("hidden");
  miniInput.focus();
});
$("#btnCloseMiniTerm").addEventListener("click", () => miniTermWin.classList.add("hidden"));

$("#btnLogout").addEventListener("click", logout);

function logout() {
  // reset to boot
  desktop.classList.add("hidden");
  boot.classList.remove("hidden");
  clearBoot();
  currentUser = "guest";
  bootBanner();
  termInput.focus();
}

// ---------- Desktop: Mini terminal ----------
function miniPrint(line, cls = "") {
  const div = document.createElement("div");
  div.className = "line " + cls;
  div.innerHTML = line;
  miniOut.appendChild(div);
  miniOut.scrollTop = miniOut.scrollHeight;
}

function handleMiniCommand(raw) {
  const input = raw.trim();
  if (!input) return;

  miniPrint(
    `<span class="cmd">${escapeHtml(`${currentUser}@arch`)}</span>:<span class="path">~</span>$ ${escapeHtml(input)}`
  );

  const [cmd] = input.split(/\s+/);

  switch (cmd.toLowerCase()) {
    case "help":
      miniPrint(`<span class="muted">Commands:</span> help, neofetch, paint, logout, clear`);
      break;

    case "clear":
      miniOut.innerHTML = "";
      break;

    case "logout":
      logout();
      break;

    case "paint":
      paintWin.classList.remove("hidden");
      focusPaint();
      break;

    case "neofetch":
      miniPrint(`<span class="muted">      /\\</span>   ${escapeHtml(currentUser)}@arch`);
      miniPrint(`<span class="muted">     /  \\</span>   OS: arch@rice (fake)`);
      miniPrint(`<span class="muted">    /\\   \\</span>  WM: Hypr-ish`);
      miniPrint(`<span class="muted">   /      \\</span> Draw: enabled`);
      miniPrint(`<span class="muted">  /  /\\    \\</span> Uptime: yes`);
      break;

    default:
      miniPrint(`<span class="muted">command not found:</span> ${escapeHtml(cmd)}`);
  }
}

miniInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const v = miniInput.value;
    miniInput.value = "";
    handleMiniCommand(v);
  }
});

// ---------- Make windows draggable (simple) ----------
function makeDraggable(winEl, handleSelector = ".win-bar") {
  const handle = winEl.querySelector(handleSelector);
  let dragging = false, startX = 0, startY = 0, startL = 0, startT = 0;

  handle.style.cursor = "grab";

  const onDown = (e) => {
    dragging = true;
    winEl.style.zIndex = String(Date.now());
    const p = getPoint(e);
    startX = p.x; startY = p.y;
    const r = winEl.getBoundingClientRect();
    startL = r.left; startT = r.top;
    handle.style.cursor = "grabbing";
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!dragging) return;
    const p = getPoint(e);
    const dx = p.x - startX;
    const dy = p.y - startY;

    // clamp roughly into viewport
    const newLeft = Math.max(10, Math.min(window.innerWidth - 80, startL + dx));
    const newTop  = Math.max(52, Math.min(window.innerHeight - 80, startT + dy));

    winEl.style.left = `${newLeft}px`;
    winEl.style.top  = `${newTop}px`;
  };

  const onUp = () => {
    dragging = false;
    handle.style.cursor = "grab";
  };

  handle.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);

  // Touch
  handle.addEventListener("touchstart", onDown, { passive:false });
  window.addEventListener("touchmove", onMove, { passive:false });
  window.addEventListener("touchend", onUp);
}

function getPoint(e) {
  if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

makeDraggable(paintWin);
makeDraggable(miniTermWin);

// ---------- Paint (Canvas drawing) ----------
const canvas = $("#canvas");
const ctx = canvas.getContext("2d");

const color = $("#color");
const size = $("#size");
const sizeVal = $("#sizeVal");
const mode = $("#mode");

function resizeCanvasToDisplaySize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  const w = Math.floor(rect.width * dpr);
  const h = Math.floor(rect.height * dpr);

  if (canvas.width !== w || canvas.height !== h) {
    // preserve existing drawing
    const old = document.createElement("canvas");
    old.width = canvas.width;
    old.height = canvas.height;
    old.getContext("2d").drawImage(canvas, 0, 0);

    canvas.width = w;
    canvas.height = h;

    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(1, 1);

    // redraw
    ctx.drawImage(old, 0, 0, old.width, old.height, 0, 0, w, h);
  }
}

window.addEventListener("resize", () => {
  if (!desktop.classList.contains("hidden")) resizeCanvasToDisplaySize();
});

size.addEventListener("input", () => sizeVal.textContent = size.value);

let drawing = false;
let last = null;

function setBrush() {
  const s = Number(size.value);
  ctx.lineWidth = s * (window.devicePixelRatio || 1);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (mode.value === "erase") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color.value;
  }
}

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const p = getPoint(e);
  return {
    x: (p.x - rect.left) * dpr,
    y: (p.y - rect.top) * dpr
  };
}

function startDraw(e) {
  drawing = true;
  setBrush();
  last = canvasPoint(e);
  e.preventDefault();
}

function moveDraw(e) {
  if (!drawing) return;
  setBrush();
  const p = canvasPoint(e);
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  last = p;
  e.preventDefault();
}

function endDraw() {
  drawing = false;
  last = null;
}

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", moveDraw);
window.addEventListener("mouseup", endDraw);

canvas.addEventListener("touchstart", startDraw, { passive:false });
canvas.addEventListener("touchmove", moveDraw, { passive:false });
window.addEventListener("touchend", endDraw);

$("#btnClear").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

$("#btnSave").addEventListener("click", () => {
  // Export at real resolution
  const link = document.createElement("a");
  link.download = `ricepaint_${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

function focusPaint() {
  paintWin.style.zIndex = String(Date.now());
  // ensure canvas is sized properly once visible
  setTimeout(() => {
    resizeCanvasToDisplaySize();
  }, 0);
}

// Start with paint window visible
focusPaint();
