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
const regionSection = document.getElementById("region-section");
const regionTitle = document.getElementById("region-title");
const regionVideo = document.getElementById("region-video");
const regionOverlay = document.getElementById("region-overlay");
const regionSelectionEl = document.getElementById("region-selection");
const regionReadout = document.getElementById("region-readout");
const regionProcessBtn = document.getElementById("region-process-btn");
const regionProgress = document.getElementById("region-progress");
const regionProgressFill = document.getElementById("region-progress-fill");
const regionProgressText = document.getElementById("region-progress-text");
const regionStatusEl = document.getElementById("region-status");
const regionDownloadLink = document.getElementById("region-download-link");
const shortsSection = document.getElementById("shorts-section");
const shortsVideo = document.getElementById("shorts-video");
const shortsOverlay = document.getElementById("shorts-overlay");
const shortsSelectionEl = document.getElementById("shorts-selection");
const shortsResizeHandle = document.getElementById("shorts-resize-handle");
const shortsReadout = document.getElementById("shorts-readout");
const shortsPreviewVideo = document.getElementById("shorts-preview-video");
const shortsPlayToggleBtn = document.getElementById("shorts-play-toggle-btn");
const shortsStartInput = document.getElementById("shorts-start");
const shortsEndInput = document.getElementById("shorts-end");
const shortsTimeRangeLabel = document.getElementById("shorts-time-range-label");
const shortsDurationLabel = document.getElementById("shorts-duration-label");
const shortsPlayhead = document.getElementById("shorts-playhead");
const shortsLoopToggle = document.getElementById("shorts-loop-toggle");
const shortsEndPreviewDelayInput = document.getElementById("shorts-end-preview-delay");
const shortsSetStartBtn = document.getElementById("shorts-set-start-btn");
const shortsSetEndBtn = document.getElementById("shorts-set-end-btn");
const shortsProcessBtn = document.getElementById("shorts-process-btn");
const shortsProgress = document.getElementById("shorts-progress");
const shortsProgressFill = document.getElementById("shorts-progress-fill");
const shortsProgressText = document.getElementById("shorts-progress-text");
const shortsStatusEl = document.getElementById("shorts-status");
const shortsDownloadLink = document.getElementById("shorts-download-link");

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
let selectedRegionOperation = null;
let regionSelection = { start: 0, size: 0 };
let regionDragStart = 0;
let regionIsDragging = false;
let regionPollTimer = null;
let selectedTool = null;
let shortsPollTimer = null;
let shortsSelection = { x: 0, y: 0, width: 0, height: 0 };
let shortsPointerMode = null;
let shortsPointerStart = null;
let shortsSelectionStart = null;
let shortsVideoDuration = 0;
let shortsPreviewPaused = false;
const SHORTS_ASPECT_RATIO = 9 / 16;

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
  document.querySelectorAll(".effect-card").forEach((card) => card.classList.remove("selected"));
  effectSection.classList.remove("hidden");
  downloadLink.classList.add("hidden");
  processProgress.classList.add("hidden");
  regionSection.classList.add("hidden");
  shortsSection.classList.add("hidden");
  regionDownloadLink.classList.add("hidden");
  regionProgress.classList.add("hidden");
  shortsDownloadLink.classList.add("hidden");
  shortsProgress.classList.add("hidden");
  chunkDownloadLink.classList.add("hidden");
  statusEl.classList.add("hidden");
  regionStatusEl.classList.add("hidden");
  shortsStatusEl.classList.add("hidden");
  chunkStatusEl.classList.add("hidden");
  resetEditorSelection();
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

document.querySelectorAll(".effect-card[data-effect]").forEach((card) => {
  card.addEventListener("click", () => {
    resetEditorSelection();
    document.querySelectorAll(".effect-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedEffect = card.dataset.effect;
    selectedRegionOperation = null;
    selectedTool = null;
    regionSection.classList.add("hidden");
    shortsSection.classList.add("hidden");
    showPreview(selectedEffect);
  });
});

document.querySelectorAll(".region-card").forEach((card) => {
  card.addEventListener("click", () => {
    if (!currentFileId) return;
    resetEditorSelection();
    document.querySelectorAll(".effect-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedEffect = null;
    selectedRegionOperation = card.dataset.regionOperation;
    selectedTool = null;
    previewSection.classList.add("hidden");
    shortsSection.classList.add("hidden");
    showRegionTool(selectedRegionOperation);
  });
});

document.querySelectorAll(".effect-card[data-tool=\"shorts\"]").forEach((card) => {
  card.addEventListener("click", () => {
    if (!currentFileId) return;
    resetEditorSelection();
    document.querySelectorAll(".effect-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedEffect = null;
    selectedRegionOperation = null;
    selectedTool = "shorts";
    previewSection.classList.add("hidden");
    regionSection.classList.add("hidden");
    showShortsTool();
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

function resetEditorSelection() {
  if (processPollTimer) clearTimeout(processPollTimer);
  if (regionPollTimer) clearTimeout(regionPollTimer);
  if (shortsPollTimer) clearTimeout(shortsPollTimer);
  regionVideo.pause();
  shortsVideo.pause();
  shortsPreviewVideo.pause();
}

// ── Row/Column Removal ──────────────────────────────────────────────

function showRegionTool(operation) {
  regionSection.classList.remove("hidden");
  regionTitle.textContent = operation === "remove_column" ? "Remove Column" : "Remove Row";
  regionVideo.src = `/preview/${currentFileId}`;
  regionVideo.muted = true;
  regionVideo.loop = true;
  regionVideo.playsInline = true;
  regionDownloadLink.classList.add("hidden");
  regionProgress.classList.add("hidden");
  regionStatusEl.classList.add("hidden");
  regionProcessBtn.disabled = true;

  regionVideo.addEventListener("loadedmetadata", () => {
    regionVideo.play().catch(() => {});
    setDefaultRegionSelection();
    regionProcessBtn.disabled = false;
  }, { once: true });
  regionVideo.load();
}

function showShortsTool() {
  shortsSection.classList.remove("hidden");
  shortsDownloadLink.classList.add("hidden");
  shortsProgress.classList.add("hidden");
  shortsStatusEl.classList.add("hidden");
  shortsProcessBtn.disabled = true;
  shortsPreviewPaused = false;
  shortsLoopToggle.checked = false;
  shortsEndPreviewDelayInput.value = "2.0";
  updateShortsPlaybackButton();

  const src = `/preview/${currentFileId}`;
  shortsVideo.src = src;
  shortsPreviewVideo.src = src;
  shortsPreviewVideo.muted = true;
  shortsPreviewVideo.loop = true;
  shortsPreviewVideo.playsInline = true;

  shortsVideo.addEventListener("loadedmetadata", () => {
    shortsVideoDuration = shortsVideo.duration || 0;
    configureShortsTimeline(shortsVideoDuration);
    setDefaultShortsSelection();
    renderShortsSelection();
    syncVideos([shortsVideo, shortsPreviewVideo]);
    setShortsPlaybackPaused(false);
    shortsProcessBtn.disabled = false;
  }, { once: true });

  shortsVideo.load();
  shortsPreviewVideo.load();
}

function configureShortsTimeline(duration) {
  const safeDuration = Math.max(duration || 0, 0.1);
  const defaultEnd = Math.min(safeDuration, 30);
  shortsStartInput.max = safeDuration.toFixed(1);
  shortsEndInput.max = safeDuration.toFixed(1);
  shortsStartInput.value = "0";
  shortsEndInput.value = defaultEnd.toFixed(1);
  updateShortsTimeLabels();
  updateShortsPlayhead(0);
}

function updateShortsTimeLabels() {
  const start = parseFloat(shortsStartInput.value) || 0;
  const end = parseFloat(shortsEndInput.value) || 0;
  const length = Math.max(0, end - start);
  shortsTimeRangeLabel.textContent = `${formatTimestamp(start)} - ${formatTimestamp(end)}`;
  shortsDurationLabel.textContent = `Length: ${length.toFixed(1)}s`;
}

function getShortsEndPreviewLead() {
  const raw = parseFloat(shortsEndPreviewDelayInput.value);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(raw, 10));
}

function updateShortsPlayhead(currentTime = 0) {
  const duration = Math.max(shortsVideoDuration || parseFloat(shortsEndInput.max) || 0, 0.1);
  const pct = Math.max(0, Math.min(currentTime / duration, 1)) * 100;
  shortsPlayhead.style.left = `${pct}%`;
}

function updateShortsPlaybackButton() {
  shortsPlayToggleBtn.textContent = shortsPreviewPaused ? "Play Preview" : "Pause Preview";
}

function setShortsPlaybackPaused(paused) {
  shortsPreviewPaused = paused;
  if (paused) {
    shortsVideo.pause();
    shortsPreviewVideo.pause();
  } else {
    shortsVideo.play().catch(() => {});
    shortsPreviewVideo.play().catch(() => {});
  }
  updateShortsPlaybackButton();
}

function seekShortsPreview(targetTime, { leadIn = 0, autoplay = null } = {}) {
  const start = parseFloat(shortsStartInput.value) || 0;
  const end = parseFloat(shortsEndInput.value) || 0;
  const previewTime = Math.max(start, Math.min(targetTime - leadIn, Math.max(end - 0.05, start)));
  shortsVideo.currentTime = previewTime;
  shortsPreviewVideo.currentTime = previewTime;
  updateShortsPlayhead(previewTime);

  const shouldPlay = autoplay === null ? !shortsPreviewPaused : autoplay;
  if (shouldPlay) {
    setShortsPlaybackPaused(false);
  } else {
    setShortsPlaybackPaused(true);
  }
}

function setDefaultShortsSelection() {
  const rect = shortsOverlay.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  let width = rect.height * SHORTS_ASPECT_RATIO;
  let height = rect.height;

  if (width > rect.width) {
    width = rect.width;
    height = width / SHORTS_ASPECT_RATIO;
  }

  shortsSelection = {
    x: Math.max((rect.width - width) / 2, 0),
    y: Math.max((rect.height - height) / 2, 0),
    width,
    height,
  };
}

function clampShortsSelection(next) {
  const rect = shortsOverlay.getBoundingClientRect();
  const maxWidth = rect.width;
  const maxHeight = rect.height;
  const minWidth = Math.max(Math.min(rect.width * 0.18, 140), 72);

  let width = Math.max(minWidth, Math.min(next.width, maxWidth));
  let height = width / SHORTS_ASPECT_RATIO;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * SHORTS_ASPECT_RATIO;
  }

  let x = Math.max(0, Math.min(next.x, maxWidth - width));
  let y = Math.max(0, Math.min(next.y, maxHeight - height));
  return { x, y, width, height };
}

function renderShortsSelection() {
  const normalized = clampShortsSelection(shortsSelection);
  shortsSelection = normalized;
  shortsSelectionEl.style.left = `${normalized.x}px`;
  shortsSelectionEl.style.top = `${normalized.y}px`;
  shortsSelectionEl.style.width = `${normalized.width}px`;
  shortsSelectionEl.style.height = `${normalized.height}px`;
  updateShortsPreview();
  updateShortsReadout();
}

function updateShortsPreview() {
  const rect = shortsOverlay.getBoundingClientRect();
  const frame = document.getElementById("shorts-preview-frame").getBoundingClientRect();
  if (!rect.width || !rect.height || !frame.width || !frame.height) return;

  const scale = frame.width / shortsSelection.width;
  shortsPreviewVideo.style.width = `${rect.width * scale}px`;
  shortsPreviewVideo.style.height = `${rect.height * scale}px`;
  shortsPreviewVideo.style.transform = `translate(${-shortsSelection.x * scale}px, ${-shortsSelection.y * scale}px)`;
}

function updateShortsReadout() {
  const crop = getSourceShortsSelection();
  shortsReadout.textContent = `Crop: x ${crop.x}px, y ${crop.y}px, ${crop.width} x ${crop.height}px`;
}

function getShortsPointerPosition(e) {
  const rect = shortsOverlay.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
    y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
  };
}

function getSourceShortsSelection() {
  const rect = shortsOverlay.getBoundingClientRect();
  if (!rect.width || !rect.height || !shortsVideo.videoWidth || !shortsVideo.videoHeight) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  const scaleX = shortsVideo.videoWidth / rect.width;
  const scaleY = shortsVideo.videoHeight / rect.height;
  return {
    x: Math.round(shortsSelection.x * scaleX),
    y: Math.round(shortsSelection.y * scaleY),
    width: Math.round(shortsSelection.width * scaleX),
    height: Math.round(shortsSelection.height * scaleY),
  };
}

shortsOverlay.addEventListener("pointerdown", (e) => {
  if (selectedTool !== "shorts") return;
  if (e.target === shortsResizeHandle) return;
  shortsPointerMode = "move";
  shortsPointerStart = getShortsPointerPosition(e);
  shortsSelectionStart = { ...shortsSelection };
  shortsOverlay.setPointerCapture(e.pointerId);
  shortsOverlay.classList.add("is-dragging");
  shortsSelectionEl.classList.add("is-dragging");
});

shortsResizeHandle.addEventListener("pointerdown", (e) => {
  if (selectedTool !== "shorts") return;
  e.stopPropagation();
  shortsPointerMode = "resize";
  shortsPointerStart = getShortsPointerPosition(e);
  shortsSelectionStart = { ...shortsSelection };
  shortsOverlay.setPointerCapture(e.pointerId);
  shortsOverlay.classList.add("is-dragging");
  shortsSelectionEl.classList.add("is-dragging");
});

shortsOverlay.addEventListener("pointermove", (e) => {
  if (!shortsPointerMode || !shortsPointerStart || !shortsSelectionStart) return;
  const point = getShortsPointerPosition(e);
  const dx = point.x - shortsPointerStart.x;
  const dy = point.y - shortsPointerStart.y;

  if (shortsPointerMode === "move") {
    shortsSelection = {
      ...shortsSelection,
      x: shortsSelectionStart.x + dx,
      y: shortsSelectionStart.y + dy,
    };
  } else {
    const widthFromX = shortsSelectionStart.width + dx;
    const widthFromY = shortsSelectionStart.width + (dy * SHORTS_ASPECT_RATIO);
    shortsSelection = {
      x: shortsSelectionStart.x,
      y: shortsSelectionStart.y,
      width: Math.max(widthFromX, widthFromY),
      height: 0,
    };
  }

  renderShortsSelection();
});

shortsOverlay.addEventListener("pointerup", (e) => {
  if (!shortsPointerMode) return;
  shortsOverlay.releasePointerCapture(e.pointerId);
  shortsPointerMode = null;
  shortsPointerStart = null;
  shortsSelectionStart = null;
  shortsOverlay.classList.remove("is-dragging");
  shortsSelectionEl.classList.remove("is-dragging");
});

shortsOverlay.addEventListener("pointercancel", () => {
  shortsPointerMode = null;
  shortsPointerStart = null;
  shortsSelectionStart = null;
  shortsOverlay.classList.remove("is-dragging");
  shortsSelectionEl.classList.remove("is-dragging");
});

function setDefaultRegionSelection() {
  const rect = regionOverlay.getBoundingClientRect();
  const axisSize = selectedRegionOperation === "remove_column" ? rect.width : rect.height;
  const size = Math.max(axisSize * 0.16, 12);
  regionSelection = {
    start: Math.max((axisSize - size) / 2, 0),
    size,
  };
  renderRegionSelection();
}

regionOverlay.addEventListener("pointerdown", (e) => {
  if (!selectedRegionOperation) return;
  regionIsDragging = true;
  regionOverlay.setPointerCapture(e.pointerId);
  regionDragStart = getRegionPointerPosition(e);
  regionSelection = { start: regionDragStart, size: 1 };
  renderRegionSelection();
});

regionOverlay.addEventListener("pointermove", (e) => {
  if (!regionIsDragging) return;
  const current = getRegionPointerPosition(e);
  regionSelection = {
    start: Math.min(regionDragStart, current),
    size: Math.abs(current - regionDragStart),
  };
  renderRegionSelection();
});

regionOverlay.addEventListener("pointerup", (e) => {
  if (!regionIsDragging) return;
  regionIsDragging = false;
  regionOverlay.releasePointerCapture(e.pointerId);
  if (regionSelection.size < 6) {
    regionSelection.size = 6;
  }
  renderRegionSelection();
});

regionOverlay.addEventListener("pointercancel", () => {
  regionIsDragging = false;
});

window.addEventListener("resize", () => {
  if (!regionSection.classList.contains("hidden")) {
    setDefaultRegionSelection();
  }
  if (!shortsSection.classList.contains("hidden")) {
    setDefaultShortsSelection();
    renderShortsSelection();
  }
});

function getRegionPointerPosition(e) {
  const rect = regionOverlay.getBoundingClientRect();
  if (selectedRegionOperation === "remove_column") {
    return Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  }
  return Math.max(0, Math.min(e.clientY - rect.top, rect.height));
}

function renderRegionSelection() {
  const rect = regionOverlay.getBoundingClientRect();
  const axisSize = selectedRegionOperation === "remove_column" ? rect.width : rect.height;
  const start = Math.max(0, Math.min(regionSelection.start, axisSize));
  const size = Math.max(1, Math.min(regionSelection.size, axisSize - start));
  regionSelection = { start, size };

  if (selectedRegionOperation === "remove_column") {
    regionSelectionEl.className = "column-selection";
    regionSelectionEl.style.left = `${start}px`;
    regionSelectionEl.style.top = "0";
    regionSelectionEl.style.width = `${size}px`;
    regionSelectionEl.style.height = "100%";
  } else {
    regionSelectionEl.className = "row-selection";
    regionSelectionEl.style.left = "0";
    regionSelectionEl.style.top = `${start}px`;
    regionSelectionEl.style.width = "100%";
    regionSelectionEl.style.height = `${size}px`;
  }

  const sourceSelection = getSourceRegionSelection();
  const label = selectedRegionOperation === "remove_column" ? "Column" : "Row";
  regionReadout.textContent = `${label}: start ${sourceSelection.start}px, remove ${sourceSelection.size}px`;
}

function getSourceRegionSelection() {
  const rect = regionOverlay.getBoundingClientRect();
  const sourceSize = selectedRegionOperation === "remove_column"
    ? regionVideo.videoWidth
    : regionVideo.videoHeight;
  const displaySize = selectedRegionOperation === "remove_column" ? rect.width : rect.height;
  if (!sourceSize || !displaySize) {
    return { start: 0, size: 1 };
  }
  const scale = sourceSize / displaySize;
  const maxRemoval = Math.max(sourceSize - 2, 1);
  const start = Math.max(0, Math.min(Math.round(regionSelection.start * scale), sourceSize - 1));
  const size = Math.max(1, Math.min(Math.round(regionSelection.size * scale), maxRemoval, sourceSize - start));
  return { start, size };
}

regionProcessBtn.addEventListener("click", async () => {
  if (!currentFileId || !selectedRegionOperation) return;

  const sourceSelection = getSourceRegionSelection();
  regionProcessBtn.disabled = true;
  regionStatusEl.textContent = "Starting...";
  regionStatusEl.classList.remove("hidden");
  regionDownloadLink.classList.add("hidden");
  regionProgress.classList.remove("hidden");
  setRegionProgress(0, "Preparing video...");

  const form = new FormData();
  form.append("file_id", currentFileId);
  form.append("operation", selectedRegionOperation);
  form.append("start", sourceSelection.start);
  form.append("size", sourceSelection.size);

  try {
    const res = await fetch("/process_region_start", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json();
      regionStatusEl.textContent = `Error: ${err.detail || "Processing failed"}`;
      regionProgress.classList.add("hidden");
      regionProcessBtn.disabled = false;
      return;
    }
    const data = await res.json();
    pollRegionJob(data.job_id);
  } catch (e) {
    regionStatusEl.textContent = `Error: ${e.message}`;
    regionProgress.classList.add("hidden");
    regionProcessBtn.disabled = false;
  }
});

shortsStartInput.addEventListener("input", () => {
  const start = parseFloat(shortsStartInput.value) || 0;
  let end = parseFloat(shortsEndInput.value) || 0;
  if (start >= end) {
    end = Math.min(shortsVideoDuration, start + 0.1);
    shortsEndInput.value = end.toFixed(1);
  }
  updateShortsTimeLabels();
  seekShortsPreview(start);
});

shortsEndInput.addEventListener("input", () => {
  let start = parseFloat(shortsStartInput.value) || 0;
  let end = parseFloat(shortsEndInput.value) || 0;
  if (end <= start) {
    start = Math.max(0, end - 0.1);
    shortsStartInput.value = start.toFixed(1);
    end = parseFloat(shortsEndInput.value) || end;
  }
  updateShortsTimeLabels();
  seekShortsPreview(end, { leadIn: getShortsEndPreviewLead() });
});

shortsSetStartBtn.addEventListener("click", () => {
  const current = Math.min(shortsVideo.currentTime || 0, Math.max(shortsVideoDuration - 0.1, 0));
  const end = parseFloat(shortsEndInput.value) || 0;
  shortsStartInput.value = Math.min(current, Math.max(end - 0.1, 0)).toFixed(1);
  updateShortsTimeLabels();
  seekShortsPreview(parseFloat(shortsStartInput.value) || 0);
});

shortsSetEndBtn.addEventListener("click", () => {
  const start = parseFloat(shortsStartInput.value) || 0;
  const current = shortsVideo.currentTime || 0;
  shortsEndInput.value = Math.max(current, start + 0.1).toFixed(1);
  if (parseFloat(shortsEndInput.value) > shortsVideoDuration) {
    shortsEndInput.value = shortsVideoDuration.toFixed(1);
  }
  updateShortsTimeLabels();
  seekShortsPreview(parseFloat(shortsEndInput.value) || 0, { leadIn: getShortsEndPreviewLead() });
});

shortsEndPreviewDelayInput.addEventListener("input", () => {
  const normalized = getShortsEndPreviewLead();
  if (shortsEndPreviewDelayInput.value !== "" && Number.isFinite(normalized)) {
    shortsEndPreviewDelayInput.value = normalized.toFixed(1);
  }
  const end = parseFloat(shortsEndInput.value) || 0;
  seekShortsPreview(end, { leadIn: normalized, autoplay: false });
});

shortsVideo.addEventListener("timeupdate", () => {
  const currentTime = shortsVideo.currentTime || 0;
  const end = parseFloat(shortsEndInput.value) || 0;
  if (shortsLoopToggle.checked && end > 0 && currentTime >= end) {
    const loopStart = parseFloat(shortsStartInput.value) || 0;
    shortsVideo.currentTime = loopStart;
    shortsPreviewVideo.currentTime = loopStart;
    updateShortsPlayhead(loopStart);
    if (!shortsPreviewPaused) {
      shortsVideo.play().catch(() => {});
      shortsPreviewVideo.play().catch(() => {});
    }
    return;
  }
  updateShortsPlayhead(currentTime);
});

shortsVideo.addEventListener("pause", () => {
  if (!shortsPreviewPaused) {
    shortsPreviewPaused = true;
    shortsPreviewVideo.pause();
    updateShortsPlaybackButton();
  }
});

shortsVideo.addEventListener("play", () => {
  if (shortsPreviewPaused) {
    shortsPreviewPaused = false;
    shortsPreviewVideo.play().catch(() => {});
    updateShortsPlaybackButton();
  }
});

shortsVideo.addEventListener("seeked", () => {
  updateShortsPlayhead(shortsVideo.currentTime || 0);
});

shortsPlayToggleBtn.addEventListener("click", () => {
  setShortsPlaybackPaused(!shortsPreviewPaused);
});

shortsProcessBtn.addEventListener("click", async () => {
  if (!currentFileId || selectedTool !== "shorts") return;

  const startTime = parseFloat(shortsStartInput.value) || 0;
  const endTime = parseFloat(shortsEndInput.value) || 0;
  const crop = getSourceShortsSelection();

  shortsProcessBtn.disabled = true;
  shortsStatusEl.textContent = "Starting...";
  shortsStatusEl.classList.remove("hidden");
  shortsDownloadLink.classList.add("hidden");
  shortsProgress.classList.remove("hidden");
  setShortsProgress(0, "Preparing short...");

  const form = new FormData();
  form.append("file_id", currentFileId);
  form.append("start_time", startTime);
  form.append("end_time", endTime);
  form.append("crop_x", crop.x);
  form.append("crop_y", crop.y);
  form.append("crop_width", crop.width);
  form.append("crop_height", crop.height);

  try {
    const res = await fetch("/process_short_start", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json();
      shortsStatusEl.textContent = `Error: ${err.detail || "Processing failed"}`;
      shortsProgress.classList.add("hidden");
      shortsProcessBtn.disabled = false;
      return;
    }
    const data = await res.json();
    pollShortsJob(data.job_id);
  } catch (e) {
    shortsStatusEl.textContent = `Error: ${e.message}`;
    shortsProgress.classList.add("hidden");
    shortsProcessBtn.disabled = false;
  }
});

function pollShortsJob(jobId) {
  if (shortsPollTimer) clearTimeout(shortsPollTimer);

  async function poll() {
    try {
      const res = await fetch(`/process_status/${jobId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Could not read progress");
      }
      const job = await res.json();

      if (job.state === "error") {
        shortsStatusEl.textContent = `Error: ${job.error || "Processing failed"}`;
        shortsProgress.classList.add("hidden");
        shortsProcessBtn.disabled = false;
        return;
      }

      if (job.state === "done") {
        setShortsProgress(1, "Done.");
        shortsStatusEl.textContent = "Done!";
        shortsDownloadLink.href = job.download_url;
        shortsDownloadLink.classList.remove("hidden");
        shortsProcessBtn.disabled = false;
        return;
      }

      const progress = typeof job.progress === "number" ? job.progress : 0;
      setShortsProgress(progress, buildProgressText(progress, job.eta_seconds));
      shortsStatusEl.textContent = "Processing...";
      shortsPollTimer = setTimeout(poll, 800);
    } catch (e) {
      shortsStatusEl.textContent = `Error: ${e.message}`;
      shortsProgress.classList.add("hidden");
      shortsProcessBtn.disabled = false;
    }
  }

  poll();
}

function setShortsProgress(progress, text) {
  const pct = Math.max(0, Math.min(progress, 1)) * 100;
  shortsProgressFill.style.width = `${pct.toFixed(1)}%`;
  shortsProgressText.textContent = text;
}

function pollRegionJob(jobId) {
  if (regionPollTimer) clearTimeout(regionPollTimer);

  async function poll() {
    try {
      const res = await fetch(`/process_status/${jobId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Could not read progress");
      }
      const job = await res.json();

      if (job.state === "error") {
        regionStatusEl.textContent = `Error: ${job.error || "Processing failed"}`;
        regionProgress.classList.add("hidden");
        regionProcessBtn.disabled = false;
        return;
      }

      if (job.state === "done") {
        setRegionProgress(1, "Done.");
        regionStatusEl.textContent = "Done!";
        regionDownloadLink.href = job.download_url;
        regionDownloadLink.classList.remove("hidden");
        regionProcessBtn.disabled = false;
        return;
      }

      const progress = typeof job.progress === "number" ? job.progress : 0;
      setRegionProgress(progress, buildProgressText(progress, job.eta_seconds));
      regionStatusEl.textContent = "Processing...";
      regionPollTimer = setTimeout(poll, 800);
    } catch (e) {
      regionStatusEl.textContent = `Error: ${e.message}`;
      regionProgress.classList.add("hidden");
      regionProcessBtn.disabled = false;
    }
  }

  poll();
}

function setRegionProgress(progress, text) {
  const pct = Math.max(0, Math.min(progress, 1)) * 100;
  regionProgressFill.style.width = `${pct.toFixed(1)}%`;
  regionProgressText.textContent = text;
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

function formatTimestamp(totalSeconds) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - (minutes * 60);
  return `${minutes}:${remainder.toFixed(1).padStart(4, "0")}`;
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
