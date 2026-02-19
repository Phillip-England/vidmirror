const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadSection = document.getElementById("upload-section");
const effectSection = document.getElementById("effect-section");
const previewSection = document.getElementById("preview-section");
const previewContainer = document.getElementById("preview-container");
const processBtn = document.getElementById("process-btn");
const statusEl = document.getElementById("status");
const downloadLink = document.getElementById("download-link");

let currentFileId = null;
let currentExt = null;
let selectedEffect = null;

// ── Upload ──────────────────────────────────────────────────────────

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) uploadFile(fileInput.files[0]);
});

async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);

  dropZone.innerHTML = "<p>Uploading…</p>";

  const res = await fetch("/upload", { method: "POST", body: form });
  if (!res.ok) {
    dropZone.innerHTML = "<p>Upload failed. Try again.</p>";
    return;
  }

  const data = await res.json();
  currentFileId = data.file_id;
  currentExt = data.ext;

  dropZone.innerHTML = `<p>Uploaded: ${data.filename}</p>`;
  effectSection.classList.remove("hidden");
  downloadLink.classList.add("hidden");
  statusEl.classList.add("hidden");
}

// ── Effect Selection ────────────────────────────────────────────────

document.querySelectorAll(".effect-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".effect-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedEffect = card.dataset.effect;
    showPreview(selectedEffect);
  });
});

// ── Preview ─────────────────────────────────────────────────────────

const PREVIEW_LAYOUTS = {
  horizontal: {
    gridClass: "grid-2h",
    videos: [
      {},
      { transform: "scaleX(-1)" },
    ],
  },
  vertical: {
    gridClass: "grid-2v",
    videos: [
      {},
      { transform: "scaleY(-1)" },
    ],
  },
  quad: {
    gridClass: "grid-4",
    videos: [
      {},
      { transform: "scaleX(-1)" },
      { transform: "scaleY(-1)" },
      { transform: "scale(-1,-1)" },
    ],
  },
  diagonal: {
    gridClass: "grid-4",
    videos: [
      {},
      { transform: "scale(-1,-1)" },
      { transform: "scaleX(-1)" },
      { transform: "scaleY(-1)" },
    ],
  },
  kaleidoscope: {
    gridClass: "grid-4",
    videos: [
      { transform: "scale(-1,-1)" },
      { transform: "scaleY(-1)" },
      { transform: "scaleX(-1)" },
      {},
    ],
  },
  grayscale: {
    gridClass: "grid-1",
    videos: [{ filter: "grayscale(1)" }],
  },
  sepia: {
    gridClass: "grid-1",
    videos: [{ filter: "sepia(1)" }],
  },
  negative: {
    gridClass: "grid-1",
    videos: [{ filter: "invert(1)" }],
  },
  color_swap: {
    gridClass: "grid-1",
    videos: [{ filter: "hue-rotate(180deg) saturate(1.5)" }],
  },
  reverse: {
    gridClass: "grid-1",
    videos: [{}],
  },
  speed_2x: {
    gridClass: "grid-1",
    videos: [{ playbackRate: 2.0 }],
  },
  slow_mo: {
    gridClass: "grid-1",
    videos: [{ playbackRate: 0.5 }],
  },
  blur: {
    gridClass: "grid-1",
    videos: [{ filter: "blur(4px)" }],
  },
  edge_detect: {
    gridClass: "grid-1",
    videos: [{ filter: "grayscale(1) contrast(4) brightness(0.6)" }],
  },
  vignette: {
    gridClass: "grid-1",
    videos: [{}],
  },
  pixelate: {
    gridClass: "grid-1",
    videos: [{}],
  },
  sharpen: {
    gridClass: "grid-1",
    videos: [{ filter: "contrast(1.3)" }],
  },
  emboss: {
    gridClass: "grid-1",
    videos: [{ filter: "grayscale(0.8) contrast(1.5) brightness(1.2)" }],
  },
  retro: {
    gridClass: "grid-1",
    videos: [{ filter: "sepia(0.4) contrast(1.3) saturate(0.7) brightness(0.95)" }],
  },
  glitch: {
    gridClass: "grid-1",
    videos: [{}],
  },
};

function showPreview(effect) {
  previewSection.classList.remove("hidden");
  previewContainer.innerHTML = "";
  previewContainer.className = "";

  const layout = PREVIEW_LAYOUTS[effect];
  previewContainer.classList.add(layout.gridClass);

  const videoEls = [];
  const src = `/preview/${currentFileId}`;

  layout.videos.forEach((cfg) => {
    const vid = document.createElement("video");
    vid.src = src;
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    if (cfg.transform) vid.style.transform = cfg.transform;
    if (cfg.filter) vid.style.filter = cfg.filter;
    if (cfg.playbackRate) vid.dataset.rate = cfg.playbackRate;
    previewContainer.appendChild(vid);
    videoEls.push(vid);
  });

  // Start all videos in sync
  const primary = videoEls[0];
  primary.addEventListener("loadeddata", () => {
    videoEls.forEach((v) => {
      v.currentTime = 0;
      if (v.dataset.rate) v.playbackRate = parseFloat(v.dataset.rate);
      v.play();
    });
    syncVideos(videoEls);
  }, { once: true });
  primary.load();
}

function syncVideos(videos) {
  const primary = videos[0];
  function sync() {
    for (let i = 1; i < videos.length; i++) {
      if (Math.abs(videos[i].currentTime - primary.currentTime) > 0.1) {
        videos[i].currentTime = primary.currentTime;
      }
    }
    requestAnimationFrame(sync);
  }
  requestAnimationFrame(sync);
}

// ── Process ─────────────────────────────────────────────────────────

processBtn.addEventListener("click", async () => {
  if (!currentFileId || !selectedEffect) return;

  processBtn.disabled = true;
  statusEl.textContent = "Processing… this may take a moment.";
  statusEl.classList.remove("hidden");
  downloadLink.classList.add("hidden");

  const form = new FormData();
  form.append("file_id", currentFileId);
  form.append("effect", selectedEffect);

  try {
    const res = await fetch("/process", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json();
      statusEl.textContent = `Error: ${err.detail || "Processing failed"}`;
      return;
    }
    const data = await res.json();
    statusEl.textContent = "Done!";
    downloadLink.href = data.download_url;
    downloadLink.classList.remove("hidden");
  } catch (e) {
    statusEl.textContent = `Error: ${e.message}`;
  } finally {
    processBtn.disabled = false;
  }
});
