const bg = document.getElementById("bg");
const canvas = document.getElementById("paint");
const stage = document.getElementById("stage");
const ctx = canvas.getContext("2d");

const sizeInput = document.getElementById("size");
const sizeVal = document.getElementById("sizeVal");
const eraser = document.getElementById("eraser");
const undoBtn = document.getElementById("undoBtn");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");

let currentColor = "#f1c40f"; // un peu par défaut
let drawing = false;
let last = null;
let history = [];

sizeVal.textContent = sizeInput.value;
sizeInput.addEventListener("input", () => (sizeVal.textContent = sizeInput.value));

function saveHistory() {
  try {
    if (history.length >= 30) history.shift();
    history.push(canvas.toDataURL("image/png"));
  } catch {}
}

function undo() {
  const prev = history.pop();
  if (!prev) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = prev;
}

undoBtn.addEventListener("click", undo);

clearBtn.addEventListener("click", () => {
  saveHistory();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function resizeToImage() {
  const rect = bg.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();

  const w = Math.round(rect.width);
  const h = Math.round(rect.height);

  canvas.width = w;
  canvas.height = h;

  const left = rect.left - stageRect.left + stage.scrollLeft;
  const top = rect.top - stageRect.top + stage.scrollTop;

  canvas.style.left = `${left}px`;
  canvas.style.top = `${top}px`;
}

function loadImageFromUrl(url) {
  bg.onload = () => {
    requestAnimationFrame(() => {
      resizeToImage();
      history = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  };
  bg.src = url;
}

window.addEventListener("resize", () => {
  if (bg.src) resizeToImage();
});

function getPoint(evt) {
  const r = canvas.getBoundingClientRect();
  return { x: evt.clientX - r.left, y: evt.clientY - r.top };
}

function strokeLine(a, b) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Number(sizeInput.value);

  if (eraser.checked) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = currentColor;
  }

  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

canvas.addEventListener("pointerdown", (e) => {
  if (!bg.src) return;
  canvas.setPointerCapture(e.pointerId);
  drawing = true;
  last = getPoint(e);
  saveHistory();
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing || !last) return;
  const p = getPoint(e);
  strokeLine(last, p);
  last = p;
});

function stop() { drawing = false; last = null; }
canvas.addEventListener("pointerup", stop);
canvas.addEventListener("pointercancel", stop);

// Légende = sélection couleur
document.querySelectorAll(".legend-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".legend-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentColor = btn.dataset.color;
    eraser.checked = false;
  });
});

exportBtn.addEventListener("click", () => {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const octx = out.getContext("2d");

  const tmp = new Image();
  tmp.onload = () => {
    octx.drawImage(tmp, 0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0);

    const a = document.createElement("a");
    a.download = "douleur_annotation.png";
    a.href = out.toDataURL("image/png");
    a.click();
  };
  tmp.src = bg.src;
});

// IMPORTANT : mets ton fichier dans le repo (ex: bonhomme.jpg) et adapte le nom ici
loadImageFromUrl("bonhomme.jpg");
