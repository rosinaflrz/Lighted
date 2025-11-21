<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import logo from "../assets/images/3.png";
import {
  createProject,
  fetchProjects,
  fetchProjectById,
  updateProject,
} from "../services/projects";
import { authService } from "../services/auth";

// ====== Estado del Proyecto ======
const fileInput = ref<HTMLInputElement | null>(null);
const projectTitle = ref("Cargando...");
const router = useRouter();
const route = useRoute();
const currentProjectId = ref<string | number | null>(null);

// ====== Estado del Canvas ======
const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;

let originalImage: HTMLImageElement | null = null;

const currentImageSrc = ref<string | null>(null);
const isLoadingImage = ref(false);

const isDraggingFile = ref(false);

const wrapperRef = ref<HTMLElement | null>(null);
const cursorX = ref(0);
const cursorY = ref(0);
const showCursor = ref(false);

// ====== Historial (Undo) ======
const historyStack = ref<string[]>([]);
const historyPointer = ref(-1);

// ====== HERRAMIENTAS ======
type RetouchMode = "smooth" | "whiten" | "darken";
type Tool =
  | "none"
  | "crop"
  | "brush"
  | "eraser"
  | "clone"
  | "filters"
  | "retouch";
const activeTool = ref<Tool>("none");

// --- Variables de Herramientas ---
const cropRect = ref({ x: 0, y: 0, width: 0, height: 0 });
const isDraggingRect = ref(false);
const isResizing = ref(false);
const resizeHandle = ref("");
const lastMousePos = ref({ x: 0, y: 0 });

const isDrawing = ref(false);
const brushColor = ref("#ffffff");
const brushSize = ref(10);
const brushOpacity = ref(100);
const eraserSize = ref(20);
const eraserOpacity = ref(100);

const cloneSource = ref<{ x: number; y: number } | null>(null);
const cloneSize = ref(20);
const cloneOffset = ref<{ x: number; y: number } | null>(null);

const filterBrightness = ref(100);
const filterContrast = ref(100);
const filterSaturation = ref(100);
let preFilterImage: HTMLImageElement | null = null;

const retouchMode = ref<RetouchMode>("smooth");
const retouchSize = ref(30);
const retouchStrength = ref(50);

let tempCanvas: HTMLCanvasElement = document.createElement("canvas");
let tempCtx: CanvasRenderingContext2D | null = tempCanvas.getContext("2d");
let retouchTempCanvas: HTMLCanvasElement = document.createElement("canvas");
let retouchTempCtx: CanvasRenderingContext2D | null =
  retouchTempCanvas.getContext("2d", { willReadFrequently: true });

const cursorSizeDisplay = computed(() => {
  if (activeTool.value === "eraser") return Number(eraserSize.value);
  if (activeTool.value === "brush") return Number(brushSize.value);
  if (activeTool.value === "clone") return Number(cloneSize.value);
  if (activeTool.value === "retouch") return Number(retouchSize.value);
  return 0;
});

function loadImageWithCORS(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // SUPER importante: setear crossOrigin ANTES de src
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

// --- Inicialización ---
onMounted(async () => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext("2d", { willReadFrequently: true });
  }
  window.addEventListener("keydown", handleKeyboardUndo);
  await initializeEditor();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyboardUndo);
});

function handleKeyboardUndo(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    undoLastAction();
  }
}

function downloadImage() {
  if (!currentImageSrc.value) return;
  const link = document.createElement("a");
  link.href = currentImageSrc.value;
  link.download = `${projectTitle.value || "edited-image"}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function saveStateToHistory() {
  if (!canvasRef.value) return;
  if (historyPointer.value < historyStack.value.length - 1) {
    historyStack.value.splice(historyPointer.value + 1);
  }
  const currentDataUrl = canvasRef.value.toDataURL();
  if (historyStack.value[historyPointer.value] !== currentDataUrl) {
    historyStack.value.push(currentDataUrl);
    historyPointer.value = historyStack.value.length - 1;
  }
}

function updateOriginalImageFromCanvas() {
  if (!canvasRef.value) return;
  const newUrl = canvasRef.value.toDataURL();
  const img = new Image();
  img.onload = () => {
    originalImage = img;
    currentImageSrc.value = newUrl;
    saveStateToHistory();
  };
  img.src = newUrl;
}

async function loadStateFromHistory(dataUrl: string | undefined) {
  if (!dataUrl) return;
  const img = await loadImageWithCORS(dataUrl).catch(() => null);
  if (!img || !canvasRef.value || !ctx) return;
  originalImage = img;

  canvasRef.value.width = img.width;
  canvasRef.value.height = img.height;

  ctx.filter = "none";
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.drawImage(img, 0, 0);
  currentImageSrc.value = canvasRef.value.toDataURL();
}

async function undoLastAction() {
  if (historyPointer.value > 0) {
    historyPointer.value--;
    await loadStateFromHistory(historyStack.value[historyPointer.value]);
    if (activeTool.value === "crop") setActiveTool("none");
    if (activeTool.value === "filters") resetFilterSliders();
  }
}

async function loadImageToCanvas(url: string) {
  if (!canvasRef.value) return;
  if (!ctx) ctx = canvasRef.value.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  isLoadingImage.value = true;

  try {
    const img = await loadImageWithCORS(url);
    originalImage = img;

    canvasRef.value.width = img.width;
    canvasRef.value.height = img.height;

    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    retouchTempCanvas.width = img.width;
    retouchTempCanvas.height = img.height;

    ctx.filter = "none";
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);

    currentImageSrc.value = canvasRef.value.toDataURL();
    historyStack.value = [];
    historyPointer.value = -1;
    saveStateToHistory();
  } catch (err) {
    console.error("Error loading image into canvas:", err);
    alert("No se pudo cargar la imagen. Revisa CORS / permisos del bucket.");
  } finally {
    isLoadingImage.value = false;
  }
}

async function initializeEditor() {
  try {
    const idFromUrl = route.query.id;
    isLoadingImage.value = true;

    if (idFromUrl) {
      currentProjectId.value = idFromUrl as string;
      const project = await fetchProjectById(idFromUrl as string);
      projectTitle.value = project.title;
      currentImageSrc.value = project.thumbnail_url;

      if (project.thumbnail_url) {
        await loadImageToCanvas(project.thumbnail_url);
      }
    } else {
      const projects = await fetchProjects();
      projectTitle.value = `Proyecto ${projects.length + 1}`;
    }
  } catch (error) {
    console.error(error);
    projectTitle.value = "Proyecto Nuevo";
  } finally {
    isLoadingImage.value = false;
  }
}


function getCropHandle(x: number, y: number) {
  const { x: rx, y: ry, width: rw, height: rh } = cropRect.value;
  const hs = 25;
  if (Math.abs(x - rx) < hs && Math.abs(y - ry) < hs) return "nw";
  if (Math.abs(x - (rx + rw)) < hs && Math.abs(y - ry) < hs) return "ne";
  if (Math.abs(x - rx) < hs && Math.abs(y - (ry + rh)) < hs) return "sw";
  if (Math.abs(x - (rx + rw)) < hs && Math.abs(y - (ry + rh)) < hs) return "se";
  if (Math.abs(x - (rx + rw / 2)) < hs && Math.abs(y - ry) < hs) return "n";
  if (Math.abs(x - (rx + rw)) < hs && Math.abs(y - (ry + rh / 2)) < hs) return "e";
  if (Math.abs(x - (rx + rw / 2)) < hs && Math.abs(y - (ry + rh)) < hs) return "s";
  if (Math.abs(x - rx) < hs && Math.abs(y - (ry + rh / 2)) < hs) return "w";
  return null;
}

function handleCropMouseDown(x: number, y: number) {
  const handle = getCropHandle(x, y);
  if (handle) {
    isResizing.value = true;
    resizeHandle.value = handle;
    return;
  }
  const { x: rx, y: ry, width: rw, height: rh } = cropRect.value;
  if (x > rx && x < rx + rw && y > ry && y < ry + rh)
    isDraggingRect.value = true;
}

function handleCropMouseMove(x: number, y: number) {
  if (!isDraggingRect.value && !isResizing.value) return;
  const dx = x - lastMousePos.value.x;
  const dy = y - lastMousePos.value.y;
  lastMousePos.value = { x, y };

  const cW = canvasRef.value!.width;
  const cH = canvasRef.value!.height;
  let { x: cx, y: cy, width: cw, height: ch } = cropRect.value;

  if (isDraggingRect.value) {
    cx += dx;
    cy += dy;
  } else if (isResizing.value) {
    if (resizeHandle.value.includes("w")) {
      cx += dx;
      cw -= dx;
    }
    if (resizeHandle.value.includes("e")) cw += dx;
    if (resizeHandle.value.includes("n")) {
      cy += dy;
      ch -= dy;
    }
    if (resizeHandle.value.includes("s")) ch += dy;
  }

  cw = Math.max(10, cw);
  ch = Math.max(10, ch);
  cx = Math.max(0, Math.min(cx, cW - cw));
  cy = Math.max(0, Math.min(cy, cH - ch));
  cw = Math.min(cw, cW - cx);
  ch = Math.min(ch, cH - cy);

  cropRect.value = { x: cx, y: cy, width: cw, height: ch };
  drawCropUI();
}

function handleCropMouseUp() {
  isDraggingRect.value = false;
  isResizing.value = false;
  resizeHandle.value = "";
  if (cropRect.value.width < 0) {
    cropRect.value.x += cropRect.value.width;
    cropRect.value.width *= -1;
  }
  if (cropRect.value.height < 0) {
    cropRect.value.y += cropRect.value.height;
    cropRect.value.height *= -1;
  }
  drawCropUI();
}

function paintCloneStamp(x: number, y: number) {
  if (!ctx || !cloneOffset.value || !originalImage) return;
  const srcX = x + cloneOffset.value.x;
  const srcY = y + cloneOffset.value.y;
  const size = Number(cloneSize.value);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(
    originalImage,
    srcX - size / 2,
    srcY - size / 2,
    size,
    size,
    x - size / 2,
    y - size / 2,
    size,
    size
  );
  ctx.restore();
}

function applyRetouchEffect(x: number, y: number) {
  if (
    !ctx ||
    !canvasRef.value ||
    !retouchTempCanvas ||
    !retouchTempCtx ||
    !originalImage
  )
    return;

  const size = Number(retouchSize.value);
  const radius = size / 2;
  const strength = Number(retouchStrength.value) / 100;

  const drawX = Math.max(0, x - radius);
  const drawY = Math.max(0, y - radius);
  const drawWidth = Math.min(size, canvasRef.value.width - drawX);
  const drawHeight = Math.min(size, canvasRef.value.height - drawY);
  if (drawWidth <= 0 || drawHeight <= 0) return;

  retouchTempCanvas.width = drawWidth;
  retouchTempCanvas.height = drawHeight;
  retouchTempCtx.clearRect(0, 0, drawWidth, drawHeight);
  retouchTempCtx.filter = "none";
  retouchTempCtx.drawImage(
    originalImage,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    0,
    0,
    drawWidth,
    drawHeight
  );

  if (retouchMode.value === "smooth") {
    retouchTempCtx.filter = `blur(${strength * 3}px)`;
    retouchTempCtx.clearRect(0, 0, drawWidth, drawHeight);
    retouchTempCtx.drawImage(
      originalImage,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
      0,
      0,
      drawWidth,
      drawHeight
    );
  } else if (retouchMode.value === "whiten" || retouchMode.value === "darken") {
    const imageData = retouchTempCtx.getImageData(
      0,
      0,
      drawWidth,
      drawHeight
    );
    const pixels = imageData.data;
    const adjust =
      retouchMode.value === "whiten"
        ? 1 + strength * 0.5
        : 1 - strength * 0.5;

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.min(255, Math.max(0, pixels[i] * adjust));
      pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] * adjust));
      pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] * adjust));
    }
    retouchTempCtx.putImageData(imageData, 0, 0);
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(retouchTempCanvas, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
  retouchTempCtx.filter = "none";
}

function drawTempCanvasToMain() {
  if (!ctx || !canvasRef.value || !tempCanvas || !originalImage) return;
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(originalImage, 0, 0);

  const op =
    activeTool.value === "brush"
      ? Number(brushOpacity.value)
      : Number(eraserOpacity.value);

  ctx.globalAlpha = op / 100;
  ctx.globalCompositeOperation =
    activeTool.value === "eraser" ? "destination-out" : "source-over";
  ctx.drawImage(tempCanvas, 0, 0);

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
}

function drawCropUI() {
  if (!ctx || !canvasRef.value || activeTool.value !== "crop" || !originalImage)
    return;
  const w = canvasRef.value.width;
  const h = canvasRef.value.height;
  const { x, y, width: cw, height: ch } = cropRect.value;

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(originalImage, 0, 0);

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, w, y);
  ctx.fillRect(0, y + ch, w, h - (y + ch));
  ctx.fillRect(0, y, x, ch);
  ctx.fillRect(x + cw, y, w - (x + cw), ch);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, cw, ch);

  const hs = 16;
  const hhs = 8;
  ctx.fillStyle = "#22C55E";
  ctx.fillRect(x - hhs, y - hhs, hs, hs);
  ctx.fillRect(x + cw - hhs, y - hhs, hs, hs);
  ctx.fillRect(x - hhs, y + ch - hhs, hs, hs);
  ctx.fillRect(x + cw - hhs, y + ch - hhs, hs, hs);
  ctx.fillRect(x + cw / 2 - hhs, y - hhs, hs, hs);
  ctx.fillRect(x + cw - hhs, y + ch / 2 - hhs, hs, hs);
  ctx.fillRect(x + cw / 2 - hhs, y + ch - hhs, hs, hs);
  ctx.fillRect(x - hhs, y + ch / 2 - hhs, hs, hs);
}

// --- EVENTOS MOUSE ---
function updateCursorPos(e: MouseEvent) {
  if (!wrapperRef.value) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  cursorX.value = e.clientX - rect.left;
  cursorY.value = e.clientY - rect.top;
}

function getMousePos(e: MouseEvent) {
  const rect = canvasRef.value!.getBoundingClientRect();
  const scaleX = canvasRef.value!.width / rect.width;
  const scaleY = canvasRef.value!.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function onMouseDown(e: MouseEvent) {
  if (
    activeTool.value === "none" ||
    activeTool.value === "filters" ||
    !ctx ||
    !tempCtx ||
    !tempCanvas ||
    !originalImage
  )
    return;

  const { x, y } = getMousePos(e);
  lastMousePos.value = { x, y };

  if (activeTool.value === "crop") {
    handleCropMouseDown(x, y);
  } else if (activeTool.value === "clone") {
    if (!cloneSource.value) {
      cloneSource.value = { x, y };
      return;
    }
    isDrawing.value = true;
    cloneOffset.value = {
      x: cloneSource.value.x - x,
      y: cloneSource.value.y - y,
    };
    paintCloneStamp(x, y);
  } else if (activeTool.value === "retouch") {
    isDrawing.value = true;
    applyRetouchEffect(x, y);
  } else if (activeTool.value === "brush" || activeTool.value === "eraser") {
    isDrawing.value = true;
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.beginPath();
    tempCtx.moveTo(x, y);
    tempCtx.lineCap = "round";
    tempCtx.lineJoin = "round";
    tempCtx.globalCompositeOperation = "source-over";

    if (activeTool.value === "eraser") {
      tempCtx.lineWidth = Number(eraserSize.value);
      tempCtx.strokeStyle = "#000000";
    } else {
      tempCtx.strokeStyle = brushColor.value;
      tempCtx.lineWidth = Number(brushSize.value);
    }

    tempCtx.lineTo(x, y);
    tempCtx.stroke();
    drawTempCanvasToMain();
  }
}

function onMouseMove(e: MouseEvent) {
  updateCursorPos(e);
  if (
    activeTool.value === "none" ||
    activeTool.value === "filters" ||
    !ctx ||
    !tempCtx ||
    !tempCanvas ||
    !originalImage
  )
    return;

  const { x, y } = getMousePos(e);

  if (activeTool.value === "crop") handleCropMouseMove(x, y);
  else if (activeTool.value === "clone") {
    if (isDrawing.value && cloneSource.value) paintCloneStamp(x, y);
  } else if (activeTool.value === "retouch") {
    if (isDrawing.value) applyRetouchEffect(x, y);
  } else if (activeTool.value === "brush" || activeTool.value === "eraser") {
    if (!isDrawing.value) return;
    tempCtx.lineTo(x, y);
    tempCtx.stroke();
    drawTempCanvasToMain();
  }
}

function onMouseUp() {
  if (activeTool.value === "crop") handleCropMouseUp();
  else if (["clone", "retouch", "brush", "eraser"].includes(activeTool.value)) {
    if (isDrawing.value) {
      isDrawing.value = false;

      if (
        (activeTool.value === "brush" || activeTool.value === "eraser") &&
        ctx &&
        tempCtx
      ) {
        tempCtx.closePath();

        const op =
          activeTool.value === "brush"
            ? Number(brushOpacity.value)
            : Number(eraserOpacity.value);

        ctx.globalAlpha = op / 100;
        ctx.globalCompositeOperation =
          activeTool.value === "eraser" ? "destination-out" : "source-over";
        ctx.drawImage(tempCanvas!, 0, 0);
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";

        tempCtx.clearRect(0, 0, tempCanvas!.width, tempCanvas!.height);
      }

      updateOriginalImageFromCanvas();
    }
  }
}

// --- CONTROL DE HERRAMIENTAS ---
function setActiveTool(tool: Tool) {
  if (ctx) {
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
  }
  if (tempCtx && tempCanvas)
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  if (activeTool.value === "filters" && tool !== "filters") {
    if (ctx && canvasRef.value && originalImage) {
      ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
      ctx.drawImage(originalImage, 0, 0);
    }
  }

  if (activeTool.value === tool) activeTool.value = "none";
  else activeTool.value = tool;

  if (activeTool.value === "filters") {
    resetFilterSliders();
    preFilterImage = new Image();
    preFilterImage.src = canvasRef.value?.toDataURL() || "";
  }

  if (activeTool.value === "crop") {
    if (canvasRef.value) {
      const w = canvasRef.value.width;
      const h = canvasRef.value.height;
      cropRect.value = {
        x: w * 0.1,
        y: h * 0.1,
        width: w * 0.8,
        height: h * 0.8,
      };
      drawCropUI();
    }
  } else if (activeTool.value !== "filters") {
    if (ctx && canvasRef.value && originalImage) {
      ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
      ctx.drawImage(originalImage, 0, 0);
    }
  }

  if (activeTool.value !== "clone") {
    cloneSource.value = null;
    cloneOffset.value = null;
  }
}

// --- FILTROS ---
function resetFilterSliders() {
  filterBrightness.value = 100;
  filterContrast.value = 100;
  filterSaturation.value = 100;
}

function updateFiltersPreview() {
  if (!ctx || !canvasRef.value || !preFilterImage) return;
  const filterString = `brightness(${filterBrightness.value}%) contrast(${filterContrast.value}%) saturate(${filterSaturation.value}%)`;
  ctx.filter = filterString;
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.drawImage(preFilterImage, 0, 0);
}

function applyFilters() {
  if (!ctx || !canvasRef.value) return;
  const newUrl = canvasRef.value.toDataURL();
  ctx.filter = "none";

  const img = new Image();
  img.onload = () => {
    originalImage = img;
    ctx?.clearRect(0, 0, canvasRef.value!.width, canvasRef.value!.height);
    ctx?.drawImage(img, 0, 0);
    currentImageSrc.value = newUrl;
    saveStateToHistory();
    resetFilterSliders();
    preFilterImage = new Image();
    preFilterImage.src = newUrl;
  };
  img.src = newUrl;
}

function cancelFilters() {
  if (!ctx || !canvasRef.value || !preFilterImage) return;
  ctx.filter = "none";
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.drawImage(preFilterImage, 0, 0);
  setActiveTool("none");
}

// --- CROP APPLY / CANCEL ---
async function applyCrop() {
  if (!ctx || !canvasRef.value || !originalImage) return;
  let { x, y, width, height } = cropRect.value;
  if (width < 0) {
    x += width;
    width = Math.abs(width);
  }
  if (height < 0) {
    y += height;
    height = Math.abs(height);
  }
  if (width <= 0 || height <= 0) return;

  const temp = document.createElement("canvas");
  temp.width = width;
  temp.height = height;
  const tCtx = temp.getContext("2d");
  if (!tCtx) return;

  tCtx.drawImage(originalImage, x, y, width, height, 0, 0, width, height);
  const newUrl = temp.toDataURL();

  const img = new Image();
  img.onload = async () => {
    originalImage = img;
    canvasRef.value!.width = width;
    canvasRef.value!.height = height;
    tempCanvas.width = width;
    tempCanvas.height = height;
    retouchTempCanvas.width = width;
    retouchTempCanvas.height = height;

    setActiveTool("none");
    await loadStateFromHistory(newUrl);
    saveStateToHistory();
  };
  img.src = newUrl;
}

function cancelCrop() {
  if (!canvasRef.value || !ctx || !originalImage) return;
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.drawImage(originalImage, 0, 0);
  setActiveTool("none");
}

// --- HANDLERS DE UPLOAD ---
function onUploadClick() {
  fileInput.value?.click();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;

  if (!files || files.length === 0) {
    input.value = "";
    return;
  }

  const file = files[0];

  if (!file || !file.type || !file.type.startsWith("image/")) {
    alert("Por favor sube solo imágenes.");
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    if (typeof reader.result === "string") {
      await loadImageToCanvas(reader.result);
    }
  };
  reader.readAsDataURL(file);

  input.value = "";
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDraggingFile.value = true;
}

function onDragLeave(e: DragEvent) {
  e.preventDefault();
  isDraggingFile.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDraggingFile.value = false;

  const dt = e.dataTransfer;
  if (!dt || !dt.files || dt.files.length === 0) return;

  const file = dt.files[0];

  if (!file || !file.type || !file.type.startsWith("image/")) {
    alert("Por favor sube solo imágenes.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    if (typeof reader.result === "string") {
      await loadImageToCanvas(reader.result);
    }
  };
  reader.readAsDataURL(file);
}

async function onSaveProject() {
  if (!canvasRef.value) return;
  if (ctx) {
    ctx.globalAlpha = 1.0;
    ctx.filter = "none";
  }
  const finalImage = canvasRef.value.toDataURL();

  try {
    if (currentProjectId.value)
      await updateProject(currentProjectId.value, projectTitle.value, finalImage);
    else await createProject(projectTitle.value, finalImage);

    router.push("/dashboard/projects");
  } catch (e) {
    console.error(e);
    alert("Error saving");
  }
}

function onExit() {
  router.push("/dashboard/projects");
}

function onLogout() {
  authService.logout();
  router.push("/signin");
}
</script>

<template>
  <div class="edit-page">
    <header class="top-bar">
      <div class="left-group">
        <img :src="logo" alt="lighted" class="logo" />
        <div class="title-input-wrapper">
          <input v-model="projectTitle" type="text" class="project-name-input" />
          <span class="edit-icon">✎</span>
        </div>
      </div>

      <div class="top-right">
        <button class="download-btn" @click="downloadImage" title="Download Image">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>

        <button class="save-btn" @click="onSaveProject">save project</button>
        <button class="exit-btn" @click="onExit">exit</button>
      </div>
    </header>

    <main class="content">
      <section
        class="image-wrapper"
        ref="wrapperRef"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @mouseenter="showCursor = true"
        @mouseleave="showCursor = false"
        :class="{ 'hide-cursor': ['brush', 'eraser', 'clone', 'retouch'].includes(activeTool) }"
      >
        <div v-if="isLoadingImage" class="empty-box">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>

        <div v-if="isDraggingFile" class="drag-overlay">
          <p>Sueltala aquí!</p>
        </div>

        <div v-else-if="!currentImageSrc" class="empty-box">
          <button class="upload-btn" @click="onUploadClick">upload image</button>
        </div>

        <canvas
          v-show="currentImageSrc"
          ref="canvasRef"
          class="main-image-canvas"
          :class="{ 'cursor-crosshair': activeTool === 'crop' }"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
        ></canvas>

        <div
          v-if="showCursor && ['brush', 'eraser', 'clone', 'retouch'].includes(activeTool) && currentImageSrc"
          class="custom-cursor"
          :style="{
            left: cursorX + 'px',
            top: cursorY + 'px',
            width: cursorSizeDisplay + 'px',
            height: cursorSizeDisplay + 'px',
          }"
        ></div>
      </section>

      <aside class="tools-panel">
        <div class="tools-header">
          <div class="thumb">
            <img v-if="currentImageSrc" :src="currentImageSrc" />
          </div>
          <span class="tools-title">edit</span>
        </div>

        <div class="tools-buttons">
          <button
            class="tool-btn undo-btn"
            @click="undoLastAction"
            :disabled="historyPointer <= 0"
            title="Ctrl+Z"
          >
            Undo
          </button>

          <button
            class="tool-btn"
            :class="{ 'active-tool': activeTool === 'crop' }"
            @click="setActiveTool('crop')"
            :disabled="!currentImageSrc"
          >
            Crop
          </button>
          <div v-if="activeTool === 'crop'" class="sub-tools fade-in">
            <button class="action-btn apply" @click="applyCrop">Apply</button>
            <button class="action-btn cancel" @click="cancelCrop">Cancel</button>
          </div>

          <button
            class="tool-btn"
            :class="{ 'active-tool': activeTool === 'filters' }"
            @click="setActiveTool('filters')"
            :disabled="!currentImageSrc"
          >
            Filters
          </button>
          <div v-if="activeTool === 'filters'" class="sub-tools fade-in">
            <div class="brush-controls">
              <label>
                Bright: {{ filterBrightness }}%
                <input type="range" min="0" max="200"
                  v-model="filterBrightness" @input="updateFiltersPreview" />
              </label>
              <label>
                Contrast: {{ filterContrast }}%
                <input type="range" min="0" max="200"
                  v-model="filterContrast" @input="updateFiltersPreview" />
              </label>
              <label>
                Saturate: {{ filterSaturation }}%
                <input type="range" min="0" max="200"
                  v-model="filterSaturation" @input="updateFiltersPreview" />
              </label>
            </div>
            <button class="action-btn apply" @click="applyFilters">Apply</button>
            <button class="action-btn cancel" @click="cancelFilters">Cancel</button>
          </div>

          <button
            class="tool-btn"
            :class="{ 'active-tool': activeTool === 'retouch' }"
            @click="setActiveTool('retouch')"
            :disabled="!currentImageSrc"
          >
            Retouch
          </button>
          <div v-if="activeTool === 'retouch'" class="sub-tools fade-in">
            <div class="mode-buttons">
              <button :class="{ active: retouchMode === 'smooth' }" @click="retouchMode='smooth'">Smooth</button>
              <button :class="{ active: retouchMode === 'whiten' }" @click="retouchMode='whiten'">Whiten</button>
              <button :class="{ active: retouchMode === 'darken' }" @click="retouchMode='darken'">Darken</button>
            </div>
            <div class="brush-controls">
              <label>
                Size: {{ retouchSize }}px
                <input type="range" min="5" max="100"
                  v-model="retouchSize" class="size-slider" />
              </label>
              <label>
                Strength: {{ retouchStrength }}%
                <input type="range" min="1" max="100"
                  v-model="retouchStrength" class="size-slider" />
              </label>
            </div>
          </div>

          <button
            class="tool-btn"
            :class="{ 'active-tool': activeTool === 'clone' }"
            @click="setActiveTool('clone')"
            :disabled="!currentImageSrc"
          >
            Clone Stamp
          </button>
          <div v-if="activeTool === 'clone'" class="sub-tools fade-in">
            <p class="hint-text" v-if="!cloneSource">👆 Click to set Source</p>
            <p class="hint-text" v-else>🖊️ Paint to clone</p>
            <div class="brush-controls">
              <label>
                Size: {{ cloneSize }}px
                <input type="range" min="5" max="100"
                  v-model="cloneSize" class="size-slider" />
              </label>
            </div>
            <button class="action-btn cancel" @click="cloneSource = null">Reset Source</button>
          </div>

          <button
            class="tool-btn"
            :class="{ 'active-tool': activeTool === 'brush' }"
            @click="setActiveTool('brush')"
            :disabled="!currentImageSrc"
          >
            Brush
          </button>
          <div v-if="activeTool === 'brush'" class="sub-tools fade-in">
            <div class="brush-controls">
              <label>
                Color:
                <input type="color" v-model="brushColor" class="color-picker" />
              </label>
              <label>
                Size: {{ brushSize }}px
                <input type="range" min="1" max="50"
                  v-model="brushSize" class="size-slider"/>
              </label>
              <label>
                Opacity: {{ brushOpacity }}%
                <input type="range" min="1" max="100"
                  v-model="brushOpacity" class="size-slider"/>
              </label>
            </div>
          </div>

          <button
            class="tool-btn"
            :class="{ 'active-tool': activeTool === 'eraser' }"
            @click="setActiveTool('eraser')"
            :disabled="!currentImageSrc"
          >
            Eraser
          </button>
          <div v-if="activeTool === 'eraser'" class="sub-tools fade-in">
            <div class="brush-controls">
              <label>
                Size: {{ eraserSize }}px
                <input type="range" min="5" max="100"
                  v-model="eraserSize" class="size-slider" />
              </label>
              <label>
                Opacity: {{ eraserOpacity }}%
                <input type="range" min="1" max="100"
                  v-model="eraserOpacity" class="size-slider"/>
              </label>
            </div>
          </div>

          <button class="tool-btn" disabled>Selection (pronto)</button>
        </div>

        <button class="upload-btn small" @click="onUploadClick">
          replace image
        </button>
      </aside>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        hidden
        @change="onFileChange"
      />
    </main>

    <footer class="bottom-bar">
      <button class="logout-btn" @click="onLogout">log out</button>
    </footer>
  </div>
</template>

<style scoped src="@/assets/css/editPhoto.css"></style>
