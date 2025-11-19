<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import logo from "../assets/3.png";
import { 
  createProject, 
  fetchProjects, 
  fetchProjectById, 
  updateProject 
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
const originalImage = new Image(); 
const currentImageSrc = ref<string | null>(null);
const isLoadingImage = ref(false);

// ====== Cursor Personalizado ======
const wrapperRef = ref<HTMLElement | null>(null);
const cursorX = ref(0);
const cursorY = ref(0);
const showCursor = ref(false);

// ======  Undo ======
const historyStack = ref<string[]>([]); 
const historyPointer = ref(-1); 

// ====== tools ======
type RetouchMode = 'smooth' | 'whiten' | 'darken';
type Tool = 'none' | 'crop' | 'brush' | 'eraser' | 'clone' | 'filters' | 'retouch';
const activeTool = ref<Tool>('none');

// --- crop ---
const cropRect = ref({ x: 0, y: 0, width: 0, height: 0 });
const isDraggingRect = ref(false);
const isResizing = ref(false);
const resizeHandle = ref('');
const lastMousePos = ref({ x: 0, y: 0 });

// --- Brush y Eraser ---
const isDrawing = ref(false);
const brushColor = ref('#ffffff');
const brushSize = ref(10);
const brushOpacity = ref(100); 
const eraserSize = ref(20);
const eraserOpacity = ref(100); 

// ---  clone stamp ---
const cloneSource = ref<{x: number, y: number} | null>(null);
const cloneSize = ref(20);
const cloneOffset = ref<{x: number, y: number} | null>(null);

// ---  filtros ---
const filterBrightness = ref(100);
const filterContrast = ref(100);
const filterSaturation = ref(100);
let preFilterImage: HTMLImageElement | null = null;

// --- retouch ---
const retouchMode = ref<RetouchMode>('smooth');
const retouchSize = ref(30);
const retouchStrength = ref(50);

// temp
let tempCanvas: HTMLCanvasElement = document.createElement('canvas');
let tempCtx: CanvasRenderingContext2D | null = tempCanvas.getContext('2d');
let retouchTempCanvas: HTMLCanvasElement = document.createElement('canvas');
let retouchTempCtx: CanvasRenderingContext2D | null = retouchTempCanvas.getContext('2d', { willReadFrequently: true });


const cursorSizeDisplay = computed(() => {
  if (activeTool.value === 'eraser') return Number(eraserSize.value);
  if (activeTool.value === 'brush') return Number(brushSize.value);
  if (activeTool.value === 'clone') return Number(cloneSize.value);
  if (activeTool.value === 'retouch') return Number(retouchSize.value);
  return 0;
});

// --- inicialización ---
onMounted(async () => {
  // intentar obtener contexto principal
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d', { willReadFrequently: true });
  }
  window.addEventListener('keydown', handleKeyboardUndo);
  await initializeEditor();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardUndo);
});

function handleKeyboardUndo(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault();
    undoLastAction();
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
      if (project.thumbnail_url) await loadImageToCanvas(project.thumbnail_url);
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

// --- Historial ---
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

async function loadStateFromHistory(dataUrl: string) {
  return new Promise<void>((resolve) => {
    originalImage.onload = () => {
      if (!canvasRef.value || !ctx) return;
      // restaurar dimensiones
      canvasRef.value.width = originalImage.width;
      canvasRef.value.height = originalImage.height;
      
      ctx.filter = 'none';
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
      
      ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
      ctx.drawImage(originalImage, 0, 0);
      currentImageSrc.value = canvasRef.value.toDataURL();
      resolve();
    };
    originalImage.src = dataUrl;
  });
}

async function loadImageToCanvas(url: string) {
  return new Promise<void>((resolve) => {
    originalImage.onload = () => {
      // asegurar contextos
      if (!canvasRef.value) return;
      if (!ctx) ctx = canvasRef.value.getContext('2d', { willReadFrequently: true });
      if (!ctx) return; // Si sigue fallando, salir

      // ajustar tamaños
      canvasRef.value.width = originalImage.width;
      canvasRef.value.height = originalImage.height;
      tempCanvas.width = originalImage.width;
      tempCanvas.height = originalImage.height;
      retouchTempCanvas.width = originalImage.width;
      retouchTempCanvas.height = originalImage.height;

      // Resetear propiedades
      ctx.filter = 'none';
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
      
      ctx.drawImage(originalImage, 0, 0);
      currentImageSrc.value = canvasRef.value.toDataURL();
      
      // Iniciar historial
      historyStack.value = [];
      historyPointer.value = -1;
      saveStateToHistory(); 
      resolve();
    };
    originalImage.src = url;
  });
}

async function undoLastAction() {
  if (historyPointer.value > 0) {
    historyPointer.value--;
    await loadStateFromHistory(historyStack.value[historyPointer.value]);
    if (activeTool.value === 'crop') setActiveTool('none');
    if (activeTool.value === 'filters') resetFilterSliders();
  }
}

function downloadImage() {
  if (!currentImageSrc.value) return;
  const link = document.createElement('a');
  link.href = currentImageSrc.value;
  link.download = `${projectTitle.value || 'edited-image'}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// logic de tools

function setActiveTool(tool: Tool) {
  if (ctx) {
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none'; 
  }
  if (tempCtx) tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

  if (activeTool.value === 'filters' && tool !== 'filters') {
     if(ctx && canvasRef.value) {
        ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
        ctx.drawImage(originalImage, 0, 0);
     }
  }

  if (activeTool.value === tool) activeTool.value = 'none';
  else activeTool.value = tool;

  if (activeTool.value === 'filters') {
    resetFilterSliders();
    preFilterImage = new Image();
    preFilterImage.src = canvasRef.value?.toDataURL() || '';
  }

  if (activeTool.value === 'crop') {
    if (canvasRef.value) {
      const w = canvasRef.value.width;
      const h = canvasRef.value.height;
      cropRect.value = { x: w * 0.1, y: h * 0.1, width: w * 0.8, height: h * 0.8 };
      drawCropUI();
    }
  } else if (activeTool.value !== 'filters') { 
    if (ctx && canvasRef.value) {
      ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
      ctx.drawImage(originalImage, 0, 0);
    }
  }

  if (activeTool.value !== 'clone') { cloneSource.value = null; cloneOffset.value = null; }
}

// --- filters ---
function resetFilterSliders() { filterBrightness.value = 100; filterContrast.value = 100; filterSaturation.value = 100; }

function updateFiltersPreview() {
  if (!ctx || !canvasRef.value || !preFilterImage) return;
  ctx.filter = `brightness(${filterBrightness.value}%) contrast(${filterContrast.value}%) saturate(${filterSaturation.value}%)`;
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.drawImage(preFilterImage, 0, 0);
}

function applyFilters() {
  if (!ctx || !canvasRef.value) return;
  const newUrl = canvasRef.value.toDataURL();
  ctx.filter = 'none';
  originalImage.src = newUrl;
  originalImage.onload = () => {
    ctx?.clearRect(0, 0, canvasRef.value!.width, canvasRef.value!.height);
    ctx?.drawImage(originalImage, 0, 0);
    currentImageSrc.value = newUrl;
    saveStateToHistory();
    resetFilterSliders();
    preFilterImage = new Image(); preFilterImage.src = newUrl;
  };
}

function cancelFilters() {
  if (!ctx || !canvasRef.value || !preFilterImage) return;
  ctx.filter = 'none';
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.drawImage(preFilterImage, 0, 0);
  setActiveTool('none');
}

// --- RETOQUE ---
function applyRetouchEffect(x: number, y: number) {
  if (!ctx || !canvasRef.value || !retouchTempCanvas || !retouchTempCtx) return;

  const size = Number(retouchSize.value);
  const radius = size / 2;
  const strength = Number(retouchStrength.value) / 100;

  const drawX = Math.max(0, x - radius);
  const drawY = Math.max(0, y - radius);
  const drawWidth = Math.min(size, canvasRef.value.width - drawX);
  const drawHeight = Math.min(size, canvasRef.value.height - drawY);

  if (drawWidth <= 0 || drawHeight <= 0) return;

  // temp
  retouchTempCanvas.width = drawWidth;
  retouchTempCanvas.height = drawHeight;
  retouchTempCtx.clearRect(0, 0, drawWidth, drawHeight);
  retouchTempCtx.filter = 'none';

  // 1. copy original al temporal
  retouchTempCtx.drawImage(originalImage, drawX, drawY, drawWidth, drawHeight, 0, 0, drawWidth, drawHeight);

  // 2. apply effect
  if (retouchMode.value === 'smooth') {
    retouchTempCtx.filter = `blur(${strength * 3}px)`;
    const copy = document.createElement('canvas'); // Copia limpia
    copy.width = drawWidth; copy.height = drawHeight;
    copy.getContext('2d')?.drawImage(retouchTempCanvas, 0, 0);
    
    retouchTempCtx.clearRect(0, 0, drawWidth, drawHeight);
    retouchTempCtx.drawImage(copy, 0, 0);
  } 
  else if (retouchMode.value === 'whiten' || retouchMode.value === 'darken') {
    const imageData = retouchTempCtx.getImageData(0, 0, drawWidth, drawHeight);
    const pixels = imageData.data;
    const adjust = retouchMode.value === 'whiten' ? (1 + strength * 0.5) : (1 - strength * 0.5);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.min(255, pixels[i] * adjust);
      pixels[i+1] = Math.min(255, pixels[i+1] * adjust);
      pixels[i+2] = Math.min(255, pixels[i+2] * adjust);
    }
    retouchTempCtx.putImageData(imageData, 0, 0);
  }

  // 3. stamp
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(retouchTempCanvas, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
  
  retouchTempCtx.filter = 'none';
}

// --- eventos ---
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
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

function onMouseDown(e: MouseEvent) {
  if (activeTool.value === 'none' || activeTool.value === 'filters' || !ctx) return;
  const { x, y } = getMousePos(e);
  lastMousePos.value = { x, y };

  if (activeTool.value === 'crop') {
    handleCropMouseDown(x, y);
  } else if (activeTool.value === 'clone') {
    if (!cloneSource.value) { cloneSource.value = { x, y }; return; }
    isDrawing.value = true;
    cloneOffset.value = { x: cloneSource.value.x - x, y: cloneSource.value.y - y };
    paintCloneStamp(x, y);
  } else if (activeTool.value === 'retouch') {
    isDrawing.value = true;
    applyRetouchEffect(x, y);
  } else if (activeTool.value === 'brush' || activeTool.value === 'eraser') {
    if (!tempCtx) return;
    isDrawing.value = true;
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.beginPath(); tempCtx.moveTo(x, y);
    tempCtx.lineCap = 'round'; tempCtx.lineJoin = 'round';
    tempCtx.globalCompositeOperation = 'source-over';
    if (activeTool.value === 'eraser') {
      tempCtx.lineWidth = Number(eraserSize.value); tempCtx.strokeStyle = '#000000'; 
    } else {
      tempCtx.strokeStyle = brushColor.value; tempCtx.lineWidth = Number(brushSize.value);
    }
    tempCtx.lineTo(x, y); tempCtx.stroke();
    drawTempCanvasToMain();
  }
}

function onMouseMove(e: MouseEvent) {
  updateCursorPos(e);
  if (activeTool.value === 'none' || activeTool.value === 'filters' || !ctx) return;
  const { x, y } = getMousePos(e);

  if (activeTool.value === 'crop') handleCropMouseMove(x, y);
  else if (activeTool.value === 'clone') { if (isDrawing.value && cloneSource.value) paintCloneStamp(x, y); }
  else if (activeTool.value === 'retouch') { if (isDrawing.value) applyRetouchEffect(x, y); }
  else if (activeTool.value === 'brush' || activeTool.value === 'eraser') {
    if (!isDrawing.value || !tempCtx) return;
    tempCtx.lineTo(x, y); tempCtx.stroke(); drawTempCanvasToMain();
  }
}

function onMouseUp() {
  if (activeTool.value === 'crop') handleCropMouseUp();
  else if (['clone', 'retouch', 'brush', 'eraser'].includes(activeTool.value)) {
    if (isDrawing.value) {
      isDrawing.value = false;
      if ((activeTool.value === 'brush' || activeTool.value === 'eraser') && ctx && tempCtx) {
        tempCtx.closePath();
        // Calcular Opacidad (0 a 1)
        const opacityVal = (activeTool.value === 'brush' ? Number(brushOpacity.value) : Number(eraserOpacity.value)) / 100;
        ctx.globalAlpha = opacityVal;
        
        ctx.globalCompositeOperation = (activeTool.value === 'eraser') ? 'destination-out' : 'source-over';
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      }
      updateOriginalImageFromCanvas();
    }
  }
}

function paintCloneStamp(x: number, y: number) {
  if (!ctx || !cloneOffset.value) return;
  const srcX = x + cloneOffset.value.x; const srcY = y + cloneOffset.value.y; const size = Number(cloneSize.value);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, size/2, 0, Math.PI*2); ctx.clip();
  ctx.drawImage(originalImage, srcX-size/2, srcY-size/2, size, size, x-size/2, y-size/2, size, size);
  ctx.restore();
}

function drawTempCanvasToMain() {
  if (!ctx || !canvasRef.value || !tempCanvas) return;
  // 1. Limpiar main y dibujar original
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(originalImage, 0, 0);
  
  // 2. Dibujar temp (stroke actual) con opacidad
  const opacityVal = (activeTool.value === 'brush' ? Number(brushOpacity.value) : Number(eraserOpacity.value)) / 100;
  ctx.globalAlpha = opacityVal;
  // En preview, si es eraser usamos destination-out para ver el efecto real
  ctx.globalCompositeOperation = (activeTool.value === 'eraser') ? 'destination-out' : 'source-over';
  ctx.drawImage(tempCanvas, 0, 0);
  
  // 3. Reset
  ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
}

function updateOriginalImageFromCanvas() {
  if (!canvasRef.value) return;
  const newUrl = canvasRef.value.toDataURL();
  originalImage.src = newUrl;
  originalImage.onload = () => { currentImageSrc.value = newUrl; saveStateToHistory(); };
}

// --- Crop logic ---
function getCropHandle(x: number, y: number) {
  const { x: rx, y: ry, width: rw, height: rh } = cropRect.value; const hs = 25; 
  if (Math.abs(x-rx)<hs && Math.abs(y-ry)<hs) return 'nw'; if (Math.abs(x-(rx+rw))<hs && Math.abs(y-ry)<hs) return 'ne';
  if (Math.abs(x-rx)<hs && Math.abs(y-(ry+rh))<hs) return 'sw'; if (Math.abs(x-(rx+rw))<hs && Math.abs(y-(ry+rh))<hs) return 'se';
  if (Math.abs(x-(rx+rw/2))<hs && Math.abs(y-ry)<hs) return 'n'; if (Math.abs(x-(rx+rw))<hs && Math.abs(y-(ry+rh/2))<hs) return 'e';
  if (Math.abs(x-(rx+rw/2))<hs && Math.abs(y-(ry+rh))<hs) return 's'; if (Math.abs(x-rx)<hs && Math.abs(y-(ry+rh/2))<hs) return 'w';
  return null;
}
function handleCropMouseDown(x: number, y: number) {
  const handle = getCropHandle(x, y); if (handle) { isResizing.value = true; resizeHandle.value = handle; return; }
  const { x: rx, y: ry, width: rw, height: rh } = cropRect.value; if (x>rx && x<rx+rw && y>ry && y<ry+rh) isDraggingRect.value = true;
}
function handleCropMouseMove(x: number, y: number) {
  if (!isDraggingRect.value && !isResizing.value) return;
  const dx = x - lastMousePos.value.x; const dy = y - lastMousePos.value.y; lastMousePos.value = { x, y };
  const cW = canvasRef.value!.width; const cH = canvasRef.value!.height;
  let { x: cx, y: cy, width: cw, height: ch } = cropRect.value;
  if (isDraggingRect.value) { cx += dx; cy += dy; } 
  else if (isResizing.value) {
    if (resizeHandle.value.includes('w')) { cx += dx; cw -= dx; } if (resizeHandle.value.includes('e')) cw += dx;
    if (resizeHandle.value.includes('n')) { cy += dy; ch -= dy; } if (resizeHandle.value.includes('s')) ch += dy;
  }
  cw = Math.max(10, cw); ch = Math.max(10, ch); cx = Math.max(0, Math.min(cx, cW - cw)); cy = Math.max(0, Math.min(cy, cH - ch));
  cw = Math.min(cw, cW - cx); ch = Math.min(ch, cH - cy);
  cropRect.value = { x: cx, y: cy, width: cw, height: ch }; drawCropUI();
}
function handleCropMouseUp() {
  isDraggingRect.value = false; isResizing.value = false; resizeHandle.value = '';
  if (cropRect.value.width < 0) { cropRect.value.x += cropRect.value.width; cropRect.value.width *= -1; }
  if (cropRect.value.height < 0) { cropRect.value.y += cropRect.value.height; cropRect.value.height *= -1; }
  drawCropUI();
}

// --- Utils ---
function onUploadClick() { fileInput.value?.click(); }
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) { const reader = new FileReader(); reader.onload = () => loadImageToCanvas(reader.result as string); reader.readAsDataURL(file); }
}
async function onSaveProject() {
  if(!canvasRef.value) return; if(ctx) { ctx.globalAlpha = 1.0; ctx.filter = 'none'; }
  const finalImage = canvasRef.value.toDataURL();
  try {
    if (currentProjectId.value) await updateProject(currentProjectId.value, projectTitle.value, finalImage);
    else await createProject(projectTitle.value, finalImage);
    router.push("/dashboard/projects");
  } catch(e) { alert("Error saving"); }
}
function onExit() { router.push("/dashboard/projects"); }
function onLogout() { authService.logout(); router.push("/signin"); }
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
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
        <button class="save-btn" @click="onSaveProject">save project</button>
        <button class="exit-btn" @click="onExit">exit</button>
      </div>
    </header>

    <main class="content">
      <section 
        class="image-wrapper" 
        ref="wrapperRef"
        @mouseenter="showCursor = true"
        @mouseleave="showCursor = false"
        :class="{ 'hide-cursor': ['brush', 'eraser', 'clone', 'retouch'].includes(activeTool) }"
      >
        <div v-if="isLoadingImage" class="empty-box"><div class="spinner"></div><p>Loading...</p></div>
        <div v-else-if="!currentImageSrc" class="empty-box"><button class="upload-btn" @click="onUploadClick">upload image</button></div>
        
        <canvas 
          v-show="currentImageSrc" ref="canvasRef" class="main-image-canvas"
          :class="{ 'cursor-crosshair': activeTool === 'crop' }"
          @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp"
        ></canvas>

        <div 
          v-if="showCursor && ['brush', 'eraser', 'clone', 'retouch'].includes(activeTool) && currentImageSrc" 
          class="custom-cursor"
          :style="{
            left: cursorX + 'px', top: cursorY + 'px',
            width: cursorSizeDisplay + 'px', height: cursorSizeDisplay + 'px'
          }"
        ></div>
      </section>

      <aside class="tools-panel">
        <div class="tools-header">
          <div class="thumb"><img v-if="currentImageSrc" :src="currentImageSrc" /></div>
          <span class="tools-title">edit</span>
        </div>

        <div class="tools-buttons">
          <button class="tool-btn undo-btn" @click="undoLastAction" :disabled="historyPointer <= 0" title="Ctrl+Z">Undo</button>

          <button class="tool-btn" :class="{ 'active-tool': activeTool === 'crop' }" @click="setActiveTool('crop')" :disabled="!currentImageSrc">Crop</button>
          <div v-if="activeTool === 'crop'" class="sub-tools fade-in">
            <button class="action-btn apply" @click="applyCrop">Apply</button>
            <button class="action-btn cancel" @click="cancelCrop">Cancel</button>
          </div>

          <button class="tool-btn" :class="{ 'active-tool': activeTool === 'filters' }" @click="setActiveTool('filters')" :disabled="!currentImageSrc">Filters</button>
          <div v-if="activeTool === 'filters'" class="sub-tools fade-in">
            <div class="brush-controls">
              <label>Bright: {{ filterBrightness }}% <input type="range" min="0" max="200" v-model="filterBrightness" @input="updateFiltersPreview"/></label>
              <label>Contrast: {{ filterContrast }}% <input type="range" min="0" max="200" v-model="filterContrast" @input="updateFiltersPreview"/></label>
              <label>Saturate: {{ filterSaturation }}% <input type="range" min="0" max="200" v-model="filterSaturation" @input="updateFiltersPreview"/></label>
            </div>
            <button class="action-btn apply" @click="applyFilters">Apply</button>
            <button class="action-btn cancel" @click="cancelFilters">Cancel</button>
          </div>

          <button class="tool-btn" :class="{ 'active-tool': activeTool === 'retouch' }" @click="setActiveTool('retouch')" :disabled="!currentImageSrc">Retouch</button>
          <div v-if="activeTool === 'retouch'" class="sub-tools fade-in">
             <div class="mode-buttons">
               <button :class="{active: retouchMode==='smooth'}" @click="retouchMode='smooth'">Smooth</button>
               <button :class="{active: retouchMode==='whiten'}" @click="retouchMode='whiten'">Whiten</button>
               <button :class="{active: retouchMode==='darken'}" @click="retouchMode='darken'">Darken</button>
             </div>
             <div class="brush-controls">
              <label>Size: {{ retouchSize }}px <input type="range" min="5" max="100" v-model="retouchSize" class="size-slider"/></label>
              <label>Strength: {{ retouchStrength }}% <input type="range" min="1" max="100" v-model="retouchStrength" class="size-slider"/></label>
             </div>
          </div>

          <button class="tool-btn" :class="{ 'active-tool': activeTool === 'clone' }" @click="setActiveTool('clone')" :disabled="!currentImageSrc">Clone Stamp</button>
          <div v-if="activeTool === 'clone'" class="sub-tools fade-in">
            <p class="hint-text" v-if="!cloneSource">👆 Click to set Source</p>
            <p class="hint-text" v-else>🖊️ Paint to clone</p>
            <div class="brush-controls">
              <label>Size: {{ cloneSize }}px <input type="range" min="5" max="100" v-model="cloneSize" class="size-slider"/></label>
            </div>
            <button class="action-btn cancel" @click="cloneSource = null">Reset Source</button>
          </div>

          <button class="tool-btn" :class="{ 'active-tool': activeTool === 'brush' }" @click="setActiveTool('brush')" :disabled="!currentImageSrc">Brush</button>
          <div v-if="activeTool === 'brush'" class="sub-tools fade-in">
            <div class="brush-controls">
              <label>Color:<input type="color" v-model="brushColor" class="color-picker"/></label>
              <label>Size: {{ brushSize }}px <input type="range" min="1" max="50" v-model="brushSize" class="size-slider"/></label>
              <label>Opacity: {{ brushOpacity }}% <input type="range" min="1" max="100" v-model="brushOpacity" class="size-slider"/></label>
            </div>
          </div>

          <button class="tool-btn" :class="{ 'active-tool': activeTool === 'eraser' }" @click="setActiveTool('eraser')" :disabled="!currentImageSrc">Eraser</button>
          <div v-if="activeTool === 'eraser'" class="sub-tools fade-in">
            <div class="brush-controls">
              <label>Size: {{ eraserSize }}px <input type="range" min="5" max="100" v-model="eraserSize" class="size-slider"/></label>
              <label>Opacity: {{ eraserOpacity }}% <input type="range" min="1" max="100" v-model="eraserOpacity" class="size-slider"/></label>
            </div>
          </div>

          <button class="tool-btn" disabled>Selection (pronto)</button>
        </div>
        <button class="upload-btn small" @click="onUploadClick">replace image</button>
      </aside>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
    </main>
    
    <footer class="bottom-bar">
      <button class="logout-btn" @click="onLogout">log out</button>
    </footer>
  </div>
</template>

<style scoped>
.edit-page { min-height: 100vh; display: flex; flex-direction: column; background: #f9fafb; font-family: 'Inter', sans-serif; }
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 24px 48px 12px; border-bottom: 1px solid #e5e7eb; }
.left-group { display: flex; align-items: center; gap: 30px; }
.logo { height: 88px; width: auto; object-fit: contain; }
.title-input-wrapper { position: relative; display: flex; align-items: center; }
.project-name-input { border: none; background: transparent; font-size: 20px; font-weight: 700; color: #1f2937; padding: 5px 10px; min-width: 200px; outline: none; transition: all 0.2s; border-bottom: 2px solid transparent; }
.project-name-input:focus { border-bottom-color: #22c55e; background-color: rgba(34, 197, 94, 0.05); }
.edit-icon { color: #9ca3af; margin-left: 8px; font-size: 14px; pointer-events: none; }
.top-right { display: flex; gap: 12px; align-items: center; }
.save-btn { background: #22c55e; color: white; padding: 8px 18px; border-radius: 999px; border: none; cursor: pointer; font-weight: 600; }
.exit-btn { background: #e5e7eb; color: #111827; padding: 8px 18px; border-radius: 999px; border: none; cursor: pointer; font-weight: 600; }
.download-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #d1d5db; background: white; color: #374151; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; margin-right: 6px; }
.download-btn:hover { background: #f3f4f6; border-color: #9ca3af; color: #111827; }
.content { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 32px; padding: 32px 48px; }
.image-wrapper { background: white; border-radius: 24px; padding: 24px; display: flex; justify-content: center; align-items: center; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); overflow: hidden; position: relative; min-height: 400px; }
.image-wrapper.hide-cursor { cursor: none; }
.image-wrapper.hide-cursor .main-image-canvas { cursor: none; }
.main-image-canvas { max-width: 100%; max-height: 80vh; object-fit: contain; }
.empty-box { text-align: center; color: #475569; }
.spinner { border: 4px solid rgba(0,0,0,0.1); border-left-color: #22C55E; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px; }
@keyframes spin { to { transform: rotate(360deg); } }
.custom-cursor { position: absolute; border: 1px solid white; outline: 1px solid rgba(0,0,0,0.5); border-radius: 50%; pointer-events: none; transform: translate(-50%, -50%); z-index: 100; }
.tools-panel { background: #ecfdf5; border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 5px 15px rgba(15, 23, 42, 0.05); }
.tools-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #d1fae5; }
.thumb { width: 50px; height: 50px; border-radius: 10px; overflow: hidden; background: #d1fae5; flex-shrink: 0; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.tools-title { font-weight: 800; font-size: 1.2rem; color: #1f2937; }
.tools-buttons { display: flex; flex-direction: column; gap: 10px; flex-grow: 1; }
.tool-btn { width: 100%; background: white; padding: 12px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; color: #4b5563; transition: all 0.2s; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.tool-btn:hover:not(:disabled) { background: #d1fae5; color: #22c55e; transform: translateY(-1px); }
.tool-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.tool-btn.active-tool { background: #22c55e; color: white; transform: translateY(-1px); }
.undo-btn { background: #fef2f2; color: #b91c1c; font-weight: 700; border: 1px solid #fecaca; }
.undo-btn:hover:not(:disabled) { background: #fecaca; color: #991b1b; }
.sub-tools { display: flex; flex-direction: column; gap: 8px; margin-top: -5px; margin-bottom: 10px; animation: fadeIn 0.3s forwards; }
.action-btn { padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.action-btn.apply { background: #10b981; } .action-btn.apply:hover { background: #059669; }
.action-btn.cancel { background: #ef4444; } .action-btn.cancel:hover { background: #dc2626; }
.hint-text { font-size: 0.85rem; color: #666; text-align: center; margin-bottom: 6px; font-style: italic; }
.upload-btn { width: 100%; padding: 12px; border-radius: 999px; border: none; background: #bbf7d0; font-weight: 700; cursor: pointer; }
.upload-btn.small { background: #a7f3d0; margin-top: auto; }
.bottom-bar { padding: 12px 48px 24px; border-top: 1px solid #e5e7eb; }
.logout-btn { padding: 10px 20px; border-radius: 999px; border: none; background: #fee2e2; color: #b91c1c; font-weight: 700; cursor: pointer; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
.cursor-crosshair { cursor: crosshair; }
.brush-controls { background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 8px; }
.brush-controls label { font-size: 0.85rem; font-weight: 600; color: #555; display: flex; align-items: center; justify-content: space-between; }
.color-picker { border: none; width: 30px; height: 30px; padding: 0; cursor: pointer; background: none; }
.size-slider { width: 100px; }
.mode-buttons { display: flex; gap: 5px; justify-content: space-between; margin-bottom: 8px; }
.mode-buttons button { flex: 1; padding: 6px; font-size: 0.8rem; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; }
.mode-buttons button.active { background: #22c55e; color: white; border-color: #22c55e; }
</style>