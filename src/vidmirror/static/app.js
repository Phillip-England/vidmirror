const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadSection = document.getElementById("upload-section");
const effectSection = document.getElementById("effect-section");
const previewSection = document.getElementById("preview-section");
const previewContainer = document.getElementById("preview-container");
const processBtn = document.getElementById("process-btn");
const statusEl = document.getElementById("status");
const downloadLink = document.getElementById("download-link");
const processProgress = document.getElementById("process-progress");
const processProgressFill = document.getElementById("process-progress-fill");
const processProgressText = document.getElementById("process-progress-text");
const chunkLengthInput = document.getElementById("chunk-length");
const chunkProcessBtn = document.getElementById("chunk-process-btn");
const chunkStatusEl = document.getElementById("chunk-status");
const chunkDownloadLink = document.getElementById("chunk-download-link");

// Collage elements
const collageDropZone = document.getElementById("collage-drop-zone");
const collageFileInput = document.getElementById("collage-file-input");
const collageUploadSection = document.getElementById("collage-upload-section");
const collageFilesList = document.getElementById("collage-files-list");
const collagePreviewSection = document.getElementById("collage-preview-section");
const collagePreviewContainer = document.getElementById("collage-preview-container");
const collageProcessBtn = document.getElementById("collage-process-btn");
const collageStatusEl = document.getElementById("collage-status");
const collageDownloadLink = document.getElementById("collage-download-link");

let currentFileId = null;
let currentExt = null;
let selectedEffect = null;
let processPollTimer = null;

// Collage state
let collageFileIds = [];
let selectedCollageEffect = null;

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
  processProgress.classList.add("hidden");
  chunkDownloadLink.classList.add("hidden");
  statusEl.classList.add("hidden");
  chunkStatusEl.classList.add("hidden");
}

// ── Collage Upload ──────────────────────────────────────────────────────

collageDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  collageDropZone.classList.add("dragover");
});

collageDropZone.addEventListener("dragleave", () => {
  collageDropZone.classList.remove("dragover");
});

collageDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  collageDropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length) uploadCollageFiles(e.dataTransfer.files);
});

collageFileInput.addEventListener("change", () => {
  if (collageFileInput.files.length) uploadCollageFiles(collageFileInput.files);
});

async function uploadCollageFiles(files) {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }

  collageDropZone.innerHTML = "<p>Uploading…</p>";

  const res = await fetch("/upload_multiple", { method: "POST", body: form });
  if (!res.ok) {
    collageDropZone.innerHTML = "<p>Upload failed. Try again.</p>";
    return;
  }

  const data = await res.json();
  collageFileIds = data.file_ids;

  collageFilesList.innerHTML = "";
  data.file_ids.forEach((id, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "collage-video-thumb";
    
    const video = document.createElement("video");
    video.src = `/preview/${id}`;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    
    wrapper.appendChild(video);
    collageFilesList.appendChild(wrapper);
  });

  collageDropZone.innerHTML = `<p>Uploaded ${data.file_ids.length} videos</p>`;
  collageUploadSection.classList.remove("hidden");
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

// ── Collage Effect Selection ───────────────────────────────────────────

document.querySelectorAll(".collage-card").forEach((card) => {
  card.addEventListener("click", () => {
    const requiredVideos = parseInt(card.dataset.videos);
    if (collageFileIds.length !== requiredVideos) {
      alert(`This collage requires exactly ${requiredVideos} videos. You have ${collageFileIds.length}.`);
      return;
    }
    document.querySelectorAll(".collage-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedCollageEffect = card.dataset.effect;
    showCollagePreview(selectedCollageEffect);
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
  remove_audio: {
    gridClass: "grid-1",
    videos: [{}],
    note: "The downloaded video will not include audio.",
  },
  extract_audio: {
    gridClass: "grid-audio",
    videos: [],
    note: "The download will be an MP3 audio file.",
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

  if (layout.note) {
    previewContainer.classList.add("has-note");
    const note = document.createElement("p");
    note.className = "preview-note";
    note.textContent = layout.note;
    previewContainer.appendChild(note);
  }

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

  if (!videoEls.length) return;

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
  statusEl.textContent = "Starting...";
  statusEl.classList.remove("hidden");
  downloadLink.classList.add("hidden");
  processProgress.classList.remove("hidden");
  setProcessProgress(0, "Preparing video...");

  const form = new FormData();
  form.append("file_id", currentFileId);
  form.append("effect", selectedEffect);

  try {
    const res = await fetch("/process_start", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json();
      statusEl.textContent = `Error: ${err.detail || "Processing failed"}`;
      processProgress.classList.add("hidden");
      processBtn.disabled = false;
      return;
    }
    const data = await res.json();
    pollProcessJob(data.job_id);
  } catch (e) {
    statusEl.textContent = `Error: ${e.message}`;
    processProgress.classList.add("hidden");
    processBtn.disabled = false;
  }
});

function pollProcessJob(jobId) {
  if (processPollTimer) clearTimeout(processPollTimer);

  async function poll() {
    try {
      const res = await fetch(`/process_status/${jobId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Could not read progress");
      }
      const job = await res.json();

      if (job.state === "error") {
        statusEl.textContent = `Error: ${job.error || "Processing failed"}`;
        processProgress.classList.add("hidden");
        processBtn.disabled = false;
        return;
      }

      if (job.state === "done") {
        setProcessProgress(1, "Done.");
        statusEl.textContent = "Done!";
        downloadLink.href = job.download_url;
        downloadLink.textContent = selectedEffect === "extract_audio"
          ? "Download Extracted Audio"
          : "Download Processed Video";
        downloadLink.classList.remove("hidden");
        processBtn.disabled = false;
        return;
      }

      const progress = typeof job.progress === "number" ? job.progress : 0;
      setProcessProgress(progress, buildProgressText(progress, job.eta_seconds));
      statusEl.textContent = "Processing...";
      processPollTimer = setTimeout(poll, 800);
    } catch (e) {
      statusEl.textContent = `Error: ${e.message}`;
      processProgress.classList.add("hidden");
      processBtn.disabled = false;
    }
  }

  poll();
}

function setProcessProgress(progress, text) {
  const pct = Math.max(0, Math.min(progress, 1)) * 100;
  processProgressFill.style.width = `${pct.toFixed(1)}%`;
  processProgressText.textContent = text;
}

function buildProgressText(progress, etaSeconds) {
  const pct = Math.max(0, Math.min(progress, 1)) * 100;
  if (typeof etaSeconds === "number" && Number.isFinite(etaSeconds) && etaSeconds > 0) {
    return `${pct.toFixed(0)}% complete · about ${formatDuration(etaSeconds)} remaining`;
  }
  return `${pct.toFixed(0)}% complete · estimating time remaining`;
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  if (minutes > 0) return `${minutes}m ${remainder}s`;
  return `${remainder}s`;
}

// ── Chunk Process ───────────────────────────────────────────────────

chunkProcessBtn.addEventListener("click", async () => {
  if (!currentFileId) return;

  const clipLength = parseFloat(chunkLengthInput.value);
  if (!Number.isFinite(clipLength) || clipLength <= 0) {
    chunkStatusEl.textContent = "Enter a clip length greater than zero.";
    chunkStatusEl.classList.remove("hidden");
    return;
  }

  chunkProcessBtn.disabled = true;
  chunkProcessBtn.textContent = "Chunking...";
  chunkStatusEl.textContent = "Chunking video... this may take a moment.";
  chunkStatusEl.classList.remove("hidden");
  chunkDownloadLink.classList.add("hidden");

  const form = new FormData();
  form.append("file_id", currentFileId);
  form.append("clip_length", clipLength);

  try {
    const res = await fetch("/process_chunks", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json();
      chunkStatusEl.textContent = `Error: ${err.detail || "Chunking failed"}`;
      return;
    }
    const data = await res.json();
    chunkStatusEl.textContent = `Done. Created ${data.clip_count} clips.`;
    chunkDownloadLink.href = data.download_url;
    chunkDownloadLink.textContent = `Download ${data.clip_count} Video Clips ZIP`;
    chunkDownloadLink.classList.remove("hidden");
  } catch (e) {
    chunkStatusEl.textContent = `Error: ${e.message}`;
  } finally {
    chunkProcessBtn.disabled = false;
    chunkProcessBtn.textContent = "Chunk & Download ZIP";
  }
});

// ── Collage Preview ───────────────────────────────────────────────────

const COLLAGE_LAYOUTS = {
  collage_2x1: { gridClass: "grid-2h" },
  collage_1x2: { gridClass: "grid-2v" },
  collage_2x2: { gridClass: "grid-4" },
  collage_3x2: { gridClass: "grid-6" },
  collage_3x3: { gridClass: "grid-9" },
  collage_4x4: { gridClass: "grid-16" },
};

function showCollagePreview(effect) {
  collagePreviewSection.classList.remove("hidden");
  collagePreviewContainer.innerHTML = "";
  collagePreviewContainer.className = "";

  const layout = COLLAGE_LAYOUTS[effect];
  collagePreviewContainer.classList.add(layout.gridClass);

  collageFileIds.forEach((fileId) => {
    const vid = document.createElement("video");
    vid.src = `/preview/${fileId}`;
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    collagePreviewContainer.appendChild(vid);
  });

  // Start all videos in sync
  const videos = collagePreviewContainer.querySelectorAll("video");
  const primary = videos[0];
  primary.addEventListener("loadeddata", () => {
    videos.forEach((v) => {
      v.currentTime = 0;
      v.play();
    });
    syncVideos(videos);
  }, { once: true });
  primary.load();
}

// ── Collage Process ──────────────────────────────────────────────────

collageProcessBtn.addEventListener("click", async () => {
  if (!collageFileIds.length || !selectedCollageEffect) return;

  collageProcessBtn.disabled = true;
  collageStatusEl.textContent = "Processing… this may take a moment.";
  collageStatusEl.classList.remove("hidden");
  collageDownloadLink.classList.add("hidden");

  const form = new FormData();
  form.append("file_ids", collageFileIds.join(","));
  form.append("effect", selectedCollageEffect);

  try {
    const res = await fetch("/process_collage", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json();
      collageStatusEl.textContent = `Error: ${err.detail || "Processing failed"}`;
      return;
    }
    const data = await res.json();
    collageStatusEl.textContent = "Done!";
    collageDownloadLink.href = data.download_url;
    collageDownloadLink.classList.remove("hidden");
  } catch (e) {
    collageStatusEl.textContent = `Error: ${e.message}`;
  } finally {
    collageProcessBtn.disabled = false;
  }
});
