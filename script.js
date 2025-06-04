// Variables globales
const imagePanel = document.getElementById('image-panel');
const imageWrapper = document.getElementById('image-wrapper');
const dropArea = document.getElementById('drop-area');
const coordinatesList = document.getElementById('coordinates-list');
const statusText = document.getElementById('status-text');
const zoomIndicator = document.getElementById('zoom-indicator');
const zoomDisplay = document.getElementById('zoom-display');
const imageInput = document.getElementById('image-input');
const csvInput = document.getElementById('csv-input');
const notification = document.getElementById('notification');
const notificationTitle = document.getElementById('notification-title');
const notificationMessage = document.getElementById('notification-message');
const zoomModal = document.getElementById('zoom-modal');
const zoomRange = document.getElementById('zoom-range');
const zoomInput = document.getElementById('zoom-input');

// Estado de la aplicación
let currentImage = null;
let currentImageOriginal = null;
let originalFileName = '';
let scale = 1;
const scaleStep = 0.1;
const minScale = 0.1;
const maxScale = 4;
let imagePositionX = 0;
let imagePositionY = 0;
let isDragging = false;
let startX, startY, initialX, initialY;
let isPinMode = false;
let pins = [];
let pinCounter = 0;
let consolidateCounter = 1;

// Configuración del cono de visión
const VISION_RANGE = 150;
const VISION_ANGLE = 72;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  setupMenuSystem();
  setupDragAndDrop();
  setupImageInteraction();
  setupFileInputs();
  setupKeyboardShortcuts();
  setupZoomControls();
  setupListDeletion();
  updateUI();
});

// Sistema de zoom mejorado con centro en panel
function setupZoomControls() {
  zoomDisplay.addEventListener('click', () => {
    if (currentImage) {
      showZoomModal();
    }
  });
  
  document.querySelectorAll('.zoom-preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const zoomValue = parseInt(e.target.getAttribute('data-zoom'));
      setZoomValue(zoomValue);
    });
  });
  
  zoomRange.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    zoomInput.value = value;
  });
  
  zoomInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (value >= 10 && value <= 400) {
      zoomRange.value = value;
    }
  });
  
  document.getElementById('zoom-apply').addEventListener('click', () => {
    const value = parseInt(zoomInput.value);
    if (value >= 10 && value <= 400) {
      updateScale(value / 100);
      hideZoomModal();
    } else {
      showNotification('Error', 'El zoom debe estar entre 10% y 400%');
    }
  });
  
  document.getElementById('zoom-cancel').addEventListener('click', hideZoomModal);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && zoomModal.classList.contains('show')) {
      hideZoomModal();
    }
  });
}

function showZoomModal() {
  const currentZoom = Math.round(scale * 100);
  zoomInput.value = currentZoom;
  zoomRange.value = currentZoom;
  zoomModal.classList.add('show');
  zoomInput.focus();
  zoomInput.select();
}

function hideZoomModal() {
  zoomModal.classList.remove('show');
}

function setZoomValue(percent) {
  zoomInput.value = percent;
  zoomRange.value = percent;
}

function updateScale(newScale) {
  const oldScale = scale;
  scale = Math.min(maxScale, Math.max(minScale, newScale));

  if (currentImage) {
    const panelRect = imagePanel.getBoundingClientRect();
    let pivotX = panelRect.width / 2;
    let pivotY = panelRect.height / 2;
    statusText.textContent = `Zoom: ${Math.round(scale * 100)}% (centrado en panel)`;

    const scaleRatio = scale / oldScale;
    if (scaleRatio !== 1) {
      imagePositionX = pivotX - (pivotX - imagePositionX) * scaleRatio;
      imagePositionY = pivotY - (pivotY - imagePositionY) * scaleRatio;
    }

    // NUEVA IMPLEMENTACIÓN: Zoom sincronizado para imagen y SVG
    updateSynchronizedZoom();
    updateZoomDisplay();
  }
}

function resetView() {
  scale = 1;
  if (currentImage) {
    const panelRect = imagePanel.getBoundingClientRect();
    let pivotX = panelRect.width / 2;
    let pivotY = panelRect.height / 2;

    const imageX = (pivotX - imagePositionX) / scale;
    const imageY = (pivotY - imagePositionY) / scale;

    imagePositionX = pivotX - imageX * scale;
    imagePositionY = pivotY - imageY * scale;

    updateImagePosition();
    updatePinPositions();
    updateZoomDisplay();
    statusText.textContent = `Vista restablecida (100%)`;
  }
}

// Sistema de menús Windows 98
function setupMenuSystem() {
  const menuItems = document.querySelectorAll('.menu-item');
  const toolbarButtons = document.querySelectorAll('.toolbar-button');
  const dropdownItems = document.querySelectorAll('.dropdown-item');

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const menuId = item.getAttribute('data-menu');
      const dropdown = document.getElementById(`menu-${menuId}`);

      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== `menu-${menuId}`) {
          menu.classList.remove('show');
        }
      });
      document.querySelectorAll('.menu-item').forEach(mi => {
        if (mi !== item) {
          mi.classList.remove('active');
        }
      });

      dropdown.classList.toggle('show');
      item.classList.toggle('active');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.remove('show');
    });
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
  });

  [...dropdownItems, ...toolbarButtons].forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (item.classList.contains('disabled')) {
        showNotification('Opción deshabilitada', 'Esta opción no está disponible.');
        return;
      }
      const action = item.getAttribute('data-action');
      executeAction(action);

      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
      document.querySelectorAll('.menu-item').forEach(menuItem => {
        menuItem.classList.remove('active');
      });
    });
  });
}

// Ejecutor de acciones
function executeAction(action) {
  
  switch(action) {
    case 'abrir-imagen':
      imageInput.click();
      break;
    case 'abrir-csv':
      csvInput.click();
      break;
    case 'guardar-imagen':
      consolidateAndSave();
      break;
    case 'guardar-csv':
      downloadCSV();
      break;
    case 'modo-camara':
      if (!currentImage) {
        showNotification('Error', 'Debe cargar una imagen antes de activar el modo cámara');
        return;
      }
      togglePinMode();
      break;
    case 'limpiar-camaras':
      clearPins();
      break;
    case 'actualizar-conos':
      updateSVGCones();
      break;
    case 'zoom-in':
      updateScale(scale + scaleStep);
      break;
    case 'zoom-out':
      updateScale(scale - scaleStep);
      break;
    case 'zoom-reset':
      resetView();
      break;
    case 'zoom-fit':
      fitToWindow();
      break;
    case 'zoom-custom':
      if (currentImage) showZoomModal();
      break;
  }
}

// Manejo de archivos
function setupFileInputs() {
  imageInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleImage(e.target.files[0]);
    }
  });

  csvInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleCSV(e.target.files[0]);
    }
  });
}

function setupListDeletion() {
  coordinatesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-camera-btn')) {
      const index = parseInt(e.target.dataset.index, 10);
      if (!isNaN(index)) {
        removeCamera(index);
      }
    }
  });
}

function updateZoomDisplay() {
  const zoomPercent = Math.round(scale * 100);
  zoomDisplay.textContent = zoomPercent + '%';
  zoomIndicator.textContent = `Zoom: ${zoomPercent}%`;
}

function fitToWindow() {
  if (!currentImage) return;

  const panelRect = imagePanel.getBoundingClientRect();
  const imageWidth = currentImage.naturalWidth;
  const imageHeight = currentImage.naturalHeight;

  const scaleX = (panelRect.width - 40) / imageWidth;
  const scaleY = (panelRect.height - 40) / imageHeight;
  const fitScale = Math.min(scaleX, scaleY, maxScale);

  let pivotX = panelRect.width / 2;
  let pivotY = panelRect.height / 2;

  const imageX = (pivotX - imagePositionX) / scale;
  const imageY = (pivotY - imagePositionY) / scale;

  scale = fitScale;

  imagePositionX = pivotX - imageX * scale;
  imagePositionY = pivotY - imageY * scale;

  updateImagePosition();
  updatePinPositions();
  updateZoomDisplay();
  statusText.textContent = `Vista ajustada a ventana (${Math.round(scale * 100)}%)`;
}

function handleImage(file) {
  const maxSize = 10 * 1024 * 1024;
  if (!file.type.startsWith('image/') || file.size > maxSize) {
    showNotification('Error', 'Archivo inválido. Seleccione una imagen menor a 10MB.');
    return;
  }

  originalFileName = file.name;
  statusText.textContent = 'Cargando imagen...';

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      currentImageOriginal = new Image();
      currentImageOriginal.src = img.src;
      imageWrapper.innerHTML = '';
      imageWrapper.appendChild(img);
      imageWrapper.style.transformOrigin = '0 0';
      currentImage = img;
      
      // CONFIGURACIÓN MEJORADA: Preparar SVG para zoom sincronizado
      const visionLayer = document.getElementById('vision-layer');
      visionLayer.style.width = '100%';
      visionLayer.style.height = '100%';
      visionLayer.style.position = 'absolute';
      visionLayer.style.top = '0';
      visionLayer.style.left = '0';
      visionLayer.style.pointerEvents = 'none';
      visionLayer.style.transformOrigin = '0 0'; // Crucial para sincronización
      visionLayer.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
      
      dropArea.style.display = 'none';
      statusText.textContent = `Imagen cargada: ${img.naturalWidth}x${img.naturalHeight}px - Zoom sincronizado activado`;
      
      resetView();
      clearPins();
      updateUI();
      
      showNotification('Imagen Cargada', `${originalFileName} cargado con zoom sincronizado.`);
    };
  };
  reader.readAsDataURL(file);
}

function handleCSV(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showNotification('Error', 'Seleccione un archivo CSV válido.');
    return;
  }
  
  statusText.textContent = 'Cargando archivo CSV...';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      parseCSVAndCreatePins(e.target.result);
    } catch (error) {
      showNotification('Error', `Error al procesar CSV: ${error.message}`);
      statusText.textContent = 'Error al cargar CSV';
    }
  };
  reader.readAsText(file);
}

function parseCSVAndCreatePins(csvContent) {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('El archivo CSV debe tener al menos una línea de datos además del encabezado.');
  }
  
  const header = lines[0].toLowerCase();
  const expectedHeaders = ['nombre', 'ejex', 'ejey', 'orient', 'tipo'];
  const hasValidHeader = expectedHeaders.every(h => header.includes(h));
  
  if (!hasValidHeader) {
    throw new Error('El CSV debe tener las columnas: Nombre, EjeX, EjeY, Orient, Tipo');
  }
  
  clearPins();
  
  let loadedCount = 0;
  let maxId = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    
    if (values.length < 5) {
      console.warn(`Línea ${i + 1} incompleta, saltando...`);
      continue;
    }
    
    const [nombre, ejeX, ejeY, orient, tipo] = values;
    const x = parseInt(ejeX);
    const y = parseInt(ejeY);
    const orientation = parseFloat(orient);
    
    if (isNaN(x) || isNaN(y) || isNaN(orientation)) {
      console.warn(`Línea ${i + 1} tiene valores inválidos, saltando...`);
      continue;
    }
    
    if (currentImage && (x < 0 || x > currentImage.naturalWidth || y < 0 || y > currentImage.naturalHeight)) {
      console.warn(`Cámara ${nombre} fuera de los límites de la imagen, saltando...`);
      continue;
    }
    
    pinCounter++;
    maxId = Math.max(maxId, pinCounter);
    
    let visionAngle = VISION_ANGLE; // valor por defecto
    if (tipo.toLowerCase() === '360') {
      visionAngle = 360;
    }
    
    const pin = {
      id: pinCounter,
      name: nombre.trim() || `Cam_${pinCounter}`,
      x: x,
      y: y,
      orient: orientation,
      visionAngle: visionAngle
    };
    
    pins.push(pin);
    
    if (currentImage) {
      createPinElement(pin);
      if (visionAngle === 360) {
        drawCircle(pin.x, pin.y, pin.orient, pin.name);
      } else {
        drawCone(pin.x, pin.y, pin.orient, pin.name);
      }
    }
    
    loadedCount++;
  }
  
  pinCounter = maxId;
  
  updateCoordinatesList();
  updateUI();
  
  const message = currentImage ? 
    `${loadedCount} cámaras cargadas desde la CSV` : 
    `${loadedCount} cámaras cargadas. Abra una imagen para visualizarlas.`;
  
  statusText.textContent = message;
  showNotification('CSV Cargado', message);
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

// Drag and drop
function setupDragAndDrop() {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    imagePanel.addEventListener(eventName, preventDefaults, false);
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    imagePanel.addEventListener(eventName, () => {
      if (dropArea.style.display !== 'none') {
        dropArea.classList.add('highlight');
      }
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    imagePanel.addEventListener(eventName, () => {
      dropArea.classList.remove('highlight');
    }, false);
  });
  
  imagePanel.addEventListener('drop', handleDrop, false);
  dropArea.addEventListener('click', () => imageInput.click());
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e) {
  const files = Array.from(e.dataTransfer.files);
  const imageFile = files.find(f => f.type.startsWith('image/'));
  const csvFile = files.find(f => f.name.toLowerCase().endsWith('.csv'));
  
  if (imageFile) {
    handleImage(imageFile);
  } else if (csvFile) {
    handleCSV(csvFile);
  } else {
    showNotification('Error', 'Arrastre una imagen o archivo CSV válido.');
  }
}

// Interacción con imagen
function setupImageInteraction() {
  imagePanel.addEventListener('mousedown', handleMouseDown);
  imagePanel.addEventListener('mousemove', handleMouseMove);
  imagePanel.addEventListener('mouseup', handleMouseUp);
  imagePanel.addEventListener('mouseleave', handleMouseUp);

  // Zoom con rueda del ratón
  imagePanel.addEventListener('wheel', (e) => {
    if (!currentImage) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -scaleStep : scaleStep;
    const newScale = Math.min(maxScale, Math.max(minScale, scale + delta));

    if (newScale !== scale) {
      scale = newScale;
      updateImagePosition();
      updatePinPositions();
      updateZoomDisplay();
      statusText.textContent = `Zoom: ${Math.round(scale * 100)}% (centrado en panel)`;
    }
  });
}

function handleMouseDown(e) {
  if (!currentImage) return;
  
  if (e.target.classList.contains('pin-center')) {
    return;
  }
  
  if (isPinMode) {
    addPin(e);
  } else {
    isDragging = true;
    imagePanel.classList.add('dragging');
    startX = e.clientX;
    startY = e.clientY;
    initialX = imagePositionX;
    initialY = imagePositionY;
  }
}

function handleMouseMove(e) {
  if (!isDragging || !currentImage || isPinMode) return;
  
  e.preventDefault();
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;
  
  imagePositionX = initialX + deltaX;
  imagePositionY = initialY + deltaY;
  
  updateImagePosition();
  updatePinPositions();
}

function handleMouseUp() {
  if (isDragging) {
    isDragging = false;
    imagePanel.classList.remove('dragging');
  }
}

function addPin(e) {
  const rect = imagePanel.getBoundingClientRect();
  
  const x = (e.clientX - rect.left - imagePositionX) / scale;
  const y = (e.clientY - rect.top - imagePositionY) / scale;
  
  const imageX = Math.round(x);
  const imageY = Math.round(y);
  
  if (imageX >= 0 && imageX <= currentImage.naturalWidth && 
      imageY >= 0 && imageY <= currentImage.naturalHeight) {
    
    pinCounter++;
    const pin = {
      id: pinCounter,
      name: `Cam_${pinCounter}`,
      x: imageX,
      y: imageY,
      orient: 0,
      visionAngle: VISION_ANGLE // Valor por defecto
    };
    
    pins.push(pin);
    createPinElement(pin);
    updateCoordinatesList();
    updateUI();
    // Dibujar el cono inmediatamente tras agregar el pin
    renderConesSync();

    statusText.textContent = `${pin.name} agregado en (${imageX}, ${imageY}) - Orient: 0°`;
  }
}

// NUEVA FUNCIÓN: Zoom sincronizado entre imagen y SVG
function updateSynchronizedZoom() {
  // Aplicar transformación conjunta al contenedor que incluye imagen + SVG
  const transform = `translate(${imagePositionX}px, ${imagePositionY}px) scale(${scale})`;
  
  // Actualizar la imagen
  imageWrapper.style.transform = transform;
  
  // Sincronizar el SVG overlay con la misma transformación
  const visionLayer = document.getElementById('vision-layer');
  if (visionLayer) {
    // El SVG se transforma con el mismo contenedor, manteniendo sincronización perfecta
    visionLayer.style.transform = transform;
    visionLayer.style.transformOrigin = '0 0'; // Mantener origen en esquina superior izquierda
  }
  
  // Actualizar pines con nueva escala sincronizada
  updatePinPositionsSync();
  
  // Re-renderizar conos con coordenadas originales (sin recalcular manualmente)
  renderConesSync();
}

// NUEVA FUNCIÓN: Actualizar posiciones de pines sin recalcular coordenadas SVG
function updatePinPositionsSync() {
  pins.forEach(pin => {
    const pinElement = document.querySelector(`[data-pin-id="${pin.id}"]`);
    if (pinElement) {
      // Los pines mantienen sus coordenadas originales de la imagen
      // La transformación del contenedor los coloca automáticamente
      const pinX = pin.x * scale + imagePositionX;
      const pinY = pin.y * scale + imagePositionY;
      
      pinElement.style.left = pinX + 'px';
      pinElement.style.top = pinY + 'px';
      
      // Escalar elementos del pin proporcionalmente
      const pinCenter = pinElement.querySelector('.pin-center');
      if (pinCenter) {
        pinCenter.style.width = `${8 * scale}px`;
        pinCenter.style.height = `${8 * scale}px`;
        pinCenter.style.borderWidth = `${2 * scale}px`;
        pinCenter.style.left = `${-4 * scale}px`;
        pinCenter.style.top = `${-4 * scale}px`;
      }

      const pinLabel = pinElement.querySelector('.pin-label');
      if (pinLabel) {
        pinLabel.style.fontSize = `${9 * scale}px`;
        pinLabel.style.padding = `${1 * scale}px ${3 * scale}px`;
        pinLabel.style.marginTop = `${-6 * scale}px`;
      }

      // Calcular visibilidad optimizada
      const containerWidth = imagePanel.offsetWidth;
      const containerHeight = imagePanel.offsetHeight;
      const visibilityMargin = VISION_RANGE * scale;
      
      const isVisible = pinX >= -visibilityMargin && pinX <= containerWidth + visibilityMargin && 
                       pinY >= -visibilityMargin && pinY <= containerHeight + visibilityMargin;
      
      pinElement.classList.toggle('hidden', !isVisible);
    }
  });
}

// NUEVA FUNCIÓN: Renderizar conos sincronizados usando coordenadas originales
function renderConesSync() {
  const visionLayer = document.getElementById('vision-layer');
  if (!visionLayer) return;
  
  // Limpiar conos anteriores
  const group = visionLayer.querySelector('#vision-group') || 
                document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.innerHTML = '';
  group.id = 'vision-group';
  
  if (!visionLayer.contains(group)) {
    visionLayer.appendChild(group);
  }

  // Configurar viewBox del SVG para que coincida con las dimensiones originales de la imagen
  if (currentImage) {
    visionLayer.setAttribute('viewBox', `0 0 ${currentImage.naturalWidth} ${currentImage.naturalHeight}`);
    visionLayer.style.width = `${currentImage.naturalWidth}px`;
    visionLayer.style.height = `${currentImage.naturalHeight}px`;
  }

  // Renderizar conos usando coordenadas originales de la imagen (sin escalar)
  pins.forEach(pin => {
    const angle = pin.visionAngle || VISION_ANGLE;
    if (angle === 360) {
      drawCircle(pin.x, pin.y, pin.orient, pin.name);
    } else {
      drawCone(pin.x, pin.y, pin.orient, pin.name);
    }
  });
}

function createPinElement(pin) {
  const pinContainer = document.createElement('div');
  pinContainer.className = 'pin';
  pinContainer.dataset.pinId = pin.id;
  pinContainer.title = `${pin.name}: (${pin.x}, ${pin.y}) - Orient: ${pin.orient}° - Tipo: ${pin.visionAngle === 360 ? '360°' : 'Fija'}`;

  const pinCenter = document.createElement('div');
  pinCenter.className = 'pin-center';
  // Tamaño inicial - se ajustará automáticamente con updatePinPositionsSync()
  pinCenter.style.width = `${8}px`;
  pinCenter.style.height = `${8}px`;
  pinCenter.style.borderWidth = `${2}px`;
  pinCenter.style.left = `${-4}px`;
  pinCenter.style.top = `${-4}px`;

  const pinLabel = document.createElement('div');
  pinLabel.className = 'pin-label';
  pinLabel.textContent = pin.name;
  // Tamaño inicial - se ajustará automáticamente con updatePinPositionsSync()
  pinLabel.style.fontSize = `${9}px`;
  pinLabel.style.padding = `${1}px ${3}px`;
  pinLabel.style.marginTop = `${-6}px`;
  
  pinCenter.addEventListener('click', (e) => {
    e.stopPropagation();
    removePin(pin.id);
  });
  
  pinContainer.appendChild(pinCenter);
  pinContainer.appendChild(pinLabel);
  
  imagePanel.appendChild(pinContainer);

  // Usar el método sincronizado para posicionamiento inicial
  updatePinPositionsSync();
  // Renderizar conos inmediatamente cuando se crea el pin
  renderConesSync();
}

// FUNCIÓN CLAVE: Crear cono SVG con tamaño fijo (se escala con CSS transform)
function createVisionCone(pin) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const scaledRadius = VISION_RANGE * scale;
  const size = scaledRadius * 2 + 20;
  
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  svg.style.left = `${-scaledRadius - 10}px`;
  svg.style.top = `${-scaledRadius - 10}px`;
  
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = scaledRadius;
  const angle = pin.visionAngle || VISION_ANGLE;
  
  if (angle === 360) {
    // Cámara 360: crear círculo completo
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', centerX);
    circle.setAttribute('cy', centerY);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'rgba(53, 162, 235, 0.3)'); // Azul para 360°
    circle.setAttribute('stroke', '#3593eb');
    circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);
  } else {
    // Cámara fija: crear sector
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const startAngle = -angle / 2;
    const endAngle = angle / 2;
    const pathData = createSectorPath(centerX, centerY, radius, startAngle, endAngle);
    
    path.setAttribute('d', pathData);
    path.setAttribute('transform', `rotate(${pin.orient} ${centerX} ${centerY})`);
    path.setAttribute('fill', 'rgba(220, 53, 69, 0.3)'); // Rojo para fija
    path.setAttribute('stroke', '#dc3545');
    path.setAttribute('stroke-width', '2');
    svg.appendChild(path);
  }
  
  return svg;
}

function createSectorPath(cx, cy, radius, startAngle, endAngle) {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArcFlag = (endAngle - startAngle <= 180) ? '0' : '1';

  return [
    "M", cx, cy,
    "L", x1, y1,
    "A", radius, radius, 0, largeArcFlag, 1, x2, y2,
    "Z"
  ].join(" ");
}

function drawCircle(x, y, orient, name) {
  console.log('drawCircle', name, x, y, orient);
  const svg = document.getElementById('vision-layer');
  const group = svg.querySelector('#vision-group');
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  el.setAttribute('cx', x);
  el.setAttribute('cy', y);
  el.setAttribute('r', VISION_RANGE);
  el.setAttribute('fill', 'rgba(53,162,235,0.3)');
  el.setAttribute('stroke', '#3593eb');
  el.setAttribute('stroke-width', '2');
  el.setAttribute('vector-effect', 'non-scaling-stroke');
  group.appendChild(el);
}

function drawCone(x, y, orient, name) {
  console.log('drawCone', name, x, y, orient);
  const svg = document.getElementById('vision-layer');
  const group = svg.querySelector('#vision-group');
  const start = -VISION_ANGLE / 2;
  const end = VISION_ANGLE / 2;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d',
    createSectorPath(x, y, VISION_RANGE, start + orient, end + orient));
  path.setAttribute('fill', 'rgba(220,53,69,0.3)');
  path.setAttribute('stroke', '#dc3545');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  group.appendChild(path);
}

function updatePinPosition(pin, pinElement) {
  const pinX = imagePositionX + (pin.x * scale);
  const pinY = imagePositionY + (pin.y * scale);

  pinElement.style.left = pinX + 'px';
  pinElement.style.top = pinY + 'px';

  const pinCenter = pinElement.querySelector('.pin-center');
  if (pinCenter) {
    pinCenter.style.width = `${8 * scale}px`;
    pinCenter.style.height = `${8 * scale}px`;
    pinCenter.style.borderWidth = `${2 * scale}px`;
    pinCenter.style.left = `${-4 * scale}px`;
    pinCenter.style.top = `${-4 * scale}px`;
  }

  const pinLabel = pinElement.querySelector('.pin-label');
  if (pinLabel) {
    pinLabel.style.fontSize = `${9 * scale}px`;
    pinLabel.style.padding = `${1 * scale}px ${3 * scale}px`;
    pinLabel.style.marginTop = `${-6 * scale}px`;
  }

  const containerWidth = imagePanel.offsetWidth;
  const containerHeight = imagePanel.offsetHeight;

  // Calcular visibilidad en el espacio de la imagen real
  const unscaledPinX = pin.x;
  const unscaledPinY = pin.y;
  const unscaledContainerWidth = containerWidth / scale - imagePositionX / scale;
  const unscaledContainerHeight = containerHeight / scale - imagePositionY / scale;
  const unscaledRange = VISION_RANGE;

  const isVisible = unscaledPinX >= -unscaledRange && unscaledPinX <= unscaledContainerWidth + unscaledRange && 
                   unscaledPinY >= -unscaledRange && unscaledPinY <= unscaledContainerHeight + unscaledRange;

  pinElement.classList.toggle('hidden', !isVisible);
}

function removePin(pinId) {
  const index = pins.findIndex(p => p.id === pinId);
  if (index !== -1) {
    removeCamera(index);
  }
}

function removeCamera(index) {
  const removed = pins.splice(index, 1)[0];
  if (!removed) return;

  const pinElement = document.querySelector(`[data-pin-id="${removed.id}"]`);
  if (pinElement) {
    pinElement.remove();
  }

  redrawAll();
  statusText.textContent = 'Cámara eliminada';
}

function redrawAll() {
  updateCoordinatesList();
  updateUI();
  renderConesSync();
  updateSynchronizedZoom();
}

function editPin(pinId) {
  const pin = pins.find(p => p.id === pinId);
  if (!pin) return;

  const newName = prompt('Nombre del punto:', pin.name);
  if (newName === null) return;

  const newOrient = prompt('Orientación (grados):', pin.orient);
  if (newOrient === null) return;

  const newType = prompt('Tipo de cámara:\n"fija" = Cono direccional\n"360" = Visión completa\n\nIngrese tipo:', 
                        pin.visionAngle === 360 ? '360' : 'fija');
  if (newType === null) return;

  const orientValue = parseFloat(newOrient);
  if (isNaN(orientValue)) {
    showNotification('Error', 'La orientación debe ser un número válido');
    return;
  }

  let visionAngle = VISION_ANGLE; // valor por defecto
  if (newType.toLowerCase() === '360') {
    visionAngle = 360;
  }

  const oldName = pin.name;
  const oldOrient = pin.orient;
  const oldType = pin.visionAngle === 360 ? '360°' : 'Fija';
  
  pin.name = newName.trim() || ('Cam_' + pin.id);
  pin.orient = orientValue;
  pin.visionAngle = visionAngle;

  recreatePinWithNewOrientation(pin, pin.name, orientValue);

  updateCoordinatesList();
  updateUI();
  const newTypeDisplay = pin.visionAngle === 360 ? '360°' : 'Fija';
  statusText.textContent = `${pin.name} editado: ${oldName}→${pin.name}, ${oldOrient}°→${pin.orient}°, ${oldType}→${newTypeDisplay}`;
  showNotification('Pin Editado', `${pin.name} actualizado correctamente`);
}

function recreatePinWithNewOrientation(pin, newName, newOrientation) {
  const oldPinElement = document.querySelector(`[data-pin-id="${pin.id}"]`);
  if (oldPinElement) {
    oldPinElement.remove();
  }
  
  pin.name = newName;
  pin.orient = newOrientation;
  
  if (currentImage) {
    createPinElement(pin);
    // Re-renderizar conos con nueva orientación usando método sincronizado
    renderConesSync();
  }
}

function clearPins() {
  pins = [];
  pinCounter = 0;
  document.querySelectorAll('.pin').forEach(pin => pin.remove());
  const vg = document.getElementById('vision-group');
  if (vg) vg.innerHTML = '';
  updateCoordinatesList();
  updateUI();
  statusText.textContent = 'Todas las cámaras eliminadas';
}

function updateSVGCones() {
  if (!currentImage || pins.length === 0) {
    showNotification('Advertencia', 'No hay imagen o cámaras para actualizar');
    return;
  }
  
  // MÉTODO SIMPLIFICADO: usar renderizado sincronizado
  renderConesSync();
  
  statusText.textContent = `${pins.length} conos SVG sincronizados correctamente`;
  showNotification('Conos Actualizados', `${pins.length} conos sincronizados con zoom`);
}

function togglePinMode() {
  if (!currentImage) {
    showNotification('Error', 'Debe cargar una imagen antes de activar el modo cámara');
    return;
  }
  
  isPinMode = !isPinMode;
  updateUI();
  
  const modeText = isPinMode ? 'ACTIVO' : 'Navegación';
  statusText.textContent = `Modo cámara ${modeText}`;
  showNotification('Modo Cámara', `Modo cámara ${modeText.toLowerCase()}`);
  
  if (isPinMode) {
    imagePanel.classList.add('pinning');
    imagePanel.style.cursor = 'crosshair';
  } else {
    imagePanel.classList.remove('pinning');
    imagePanel.style.cursor = 'grab';
  }
}

function updateImagePosition() {
  // MÉTODO SIMPLIFICADO: usar zoom sincronizado
  updateSynchronizedZoom();
}

// FUNCIÓN SIMPLIFICADA: Actualizar posiciones usando método sincronizado
function updatePinPositions() {
  updatePinPositionsSync();
}

function updateCoordinatesList() {
  if (pins.length === 0) {
    coordinatesList.innerHTML = `
      <div style="color: #666; font-size: 10px; padding: 8px;">
        No hay cámaras colocadas.<br><br>
        📋 <strong>Instrucciones:</strong><br>
        • Abra una imagen desde Archivo<br>
        • Active modo cámara (📹)<br>
        • Haga clic para colocar cámaras<br>
        • Doble clic para editar<br><br>
        <strong>Configuración:</strong><br>
        • Alcance: 150px<br>
        • Apertura: 72° / 360°<br><br>
        <strong>Zoom centrado en panel:</strong><br>
        • Rueda del ratón: zoom dinámico<br>
        • Botones: centrado en panel<br>
        • Atajos: Ctrl + +/-/0/F/Z
      </div>
    `;
    return;
  }
  
  coordinatesList.innerHTML = '';
  pins.forEach((pin, idx) => {
    const item = document.createElement('div');
    item.className = 'coordinate-item';
    const tipo = pin.visionAngle === 360 ? '360°' : 'Fija';
    item.innerHTML = `
      <div>
        <span class="coordinate-name">${pin.name}</span>
        <span class="delete-camera-btn" data-index="${idx}" title="Eliminar">🗑️</span>
        <span style="margin-left:4px;">(${tipo})</span>
      </div>
      <div class="coordinate-details">X: ${pin.x}, Y: ${pin.y}</div>
      <div class="coordinate-details">Orient: ${pin.orient}°</div>
    `;
    
    item.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      editPin(pin.id);
    });
    
    item.addEventListener('click', (e) => {
      if (e.detail === 1) {
        centerViewOnPin(pin);
      }
    });
    
    coordinatesList.appendChild(item);
  });
}

function centerViewOnPin(pin) {
  if (!currentImage) return;

  const containerRect = imagePanel.getBoundingClientRect();
  const centerX = containerRect.width / 2;
  const centerY = containerRect.height / 2;

  imagePositionX = centerX - (pin.x * scale);
  imagePositionY = centerY - (pin.y * scale);

  updateImagePosition();
  updatePinPositions();

  statusText.textContent = `Vista centrada en ${pin.name}`;
}

function updateUI() {
  const hasImage = !!currentImage;
  const hasPins = pins.length > 0;

  const menuItems = document.querySelectorAll('[data-action="guardar-imagen"], [data-action="guardar-csv"], [data-action="modo-camara"], [data-action="limpiar-camaras"], [data-action="actualizar-conos"], [data-action="zoom-in"], [data-action="zoom-out"], [data-action="zoom-reset"], [data-action="zoom-fit"], [data-action="zoom-custom"]');

  menuItems.forEach(item => {
    if (['guardar-imagen', 'guardar-csv'].includes(item.getAttribute('data-action'))) {
      item.classList.toggle('disabled', !hasPins);
    } else {
      item.classList.toggle('disabled', !hasImage);
    }
  });

  const modoCamaraBtn = document.getElementById('modo-camara-btn');
  if (modoCamaraBtn) {
    modoCamaraBtn.classList.toggle('active', isPinMode);
    modoCamaraBtn.title = isPinMode ? 'Modo Cámara (ACTIVO)' : 'Modo Cámara';
  }

  updateZoomDisplay();
}

// Funciones de guardado
function downloadCSV() {
  if (pins.length === 0) {
    showNotification('Advertencia', 'No hay cámaras para guardar');
    return;
  }

  let csvContent = 'Nombre,EjeX,EjeY,Orient,Tipo\n';

  pins.forEach(pin => {
    const tipo = pin.visionAngle === 360 ? '360' : 'fija';
    csvContent += `"${pin.name}",${pin.x},${pin.y},${pin.orient},"${tipo}"\n`;
  });

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, 'camaras.csv');

  statusText.textContent = `CSV guardado con ${pins.length} cámaras`;
  showNotification('CSV Guardado', `Archivo guardado con ${pins.length} cámaras`);
}

function consolidateAndSave() {
  if (!currentImage || pins.length === 0) {
    showNotification('Advertencia', 'No hay imagen o cámaras para consolidar');
    return;
  }

  statusText.textContent = 'Consolidando imagen...';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = currentImage.naturalWidth;
  canvas.height = currentImage.naturalHeight;

  ctx.drawImage(currentImageOriginal, 0, 0);

  pins.forEach(pin => {
    drawVisionConeOnCanvas(ctx, pin.x, pin.y, pin.orient, pin.name, pin.visionAngle);
  });

  canvas.toBlob((blob) => {
    const fileName = generateVersionedFileName(originalFileName);
    downloadBlob(blob, fileName);

    statusText.textContent = `Imagen consolidada: ${fileName}`;
    showNotification('Imagen Guardada', `Archivo guardado como: ${fileName}`);
    consolidateCounter++;
  }, 'image/png');
}

function drawVisionConeOnCanvas(ctx, x, y, orientation, label, visionAngle = VISION_ANGLE) {
  ctx.save();

  if (visionAngle === 360) {
    // Cámara 360: dibujar círculo azul
    ctx.fillStyle = 'rgba(53, 162, 235, 0.3)';
    ctx.strokeStyle = '#3593eb';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(x, y, VISION_RANGE, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Cámara fija: dibujar sector rojo
    ctx.fillStyle = 'rgba(220, 53, 69, 0.3)';
    ctx.strokeStyle = '#dc3545';
    ctx.lineWidth = 2;

    const orientRad = (orientation * Math.PI) / 180;
    const halfAngle = (visionAngle / 2) * Math.PI / 180;
    const startAngle = orientRad - halfAngle;
    const endAngle = orientRad + halfAngle;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, VISION_RANGE, startAngle, endAngle);
    ctx.lineTo(x, y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
  }

  // Dibujar punto central
  ctx.fillStyle = visionAngle === 360 ? '#3593eb' : '#dc3545';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Dibujar etiqueta
  if (label && label !== '') {
    ctx.fillStyle = 'black';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const textMetrics = ctx.measureText(label);
    const textWidth = textMetrics.width;
    const textHeight = 14;

    ctx.fillStyle = 'rgba(255, 255, 192, 0.9)';
    ctx.fillRect(x - (textWidth / 2) - 3, y - textHeight - 12, textWidth + 6, textHeight + 6);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - (textWidth / 2) - 3, y - textHeight - 12, textWidth + 6, textHeight + 6);

    ctx.fillStyle = 'black';
    ctx.fillText(label, x, y - 6);
  }

  ctx.restore();
}

function generateVersionedFileName(originalName) {
  const lastDotIndex = originalName.lastIndexOf('.');
  let baseName, extension;

  if (lastDotIndex !== -1) {
    baseName = originalName.substring(0, lastDotIndex);
    extension = originalName.substring(lastDotIndex + 1);
  } else {
    baseName = originalName;
    extension = 'png';
  }

  const versionNumber = consolidateCounter.toString().padStart(4, '0');
  return `${baseName}_camaras_${versionNumber}.${extension}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Atajos de teclado
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key.toLowerCase()) {
        case 'o':
          e.preventDefault();
          imageInput.click();
          break;
        case 's':
          e.preventDefault();
          if (e.shiftKey) {
            downloadCSV();
          } else {
            consolidateAndSave();
          }
          break;
        case '=':
        case '+':
          e.preventDefault();
          if (currentImage) {
            updateScale(scale + scaleStep);
          }
          break;
        case '-':
          e.preventDefault();
          if (currentImage) {
            updateScale(scale - scaleStep);
          }
          break;
        case '0':
          e.preventDefault();
          if (currentImage) {
            resetView();
          }
          break;
      }
    } else {
      switch(e.key.toLowerCase()) {
        case 'p':
          if (currentImage) {
            togglePinMode();
          }
          break;
        case 'f':
          if (currentImage) {
            fitToWindow();
          }
          break;
        case 'z':
          if (currentImage) {
            showZoomModal();
          }
          break;
      }
    }
  });
}

function showNotification(title, message) {
  notificationTitle.textContent = title;
  notificationMessage.textContent = message;
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);

  notification.onclick = () => {
    notification.classList.remove('show');
  };
}

// Hacer funciones accesibles globalmente para eventos
window.removePin = removePin;
window.editPin = editPin;
