// Variables globales
const imagePanel = document.getElementById('image-panel');
const imageWrapper = document.getElementById('image-wrapper');
const dropArea = document.getElementById('drop-area');
const coordinatesList = document.getElementById('coordinates-list');
const treeContainer = document.getElementById('tree-container');
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

// Estructura de carpetas HIK y DIGIFORT
const SYSTEM_FOLDERS = {};

// Carpetas HIK (1-11)
for (let i = 1; i <= 11; i++) {
  SYSTEM_FOLDERS[`HIK${i}`] = {
    name: `HIK${i}`,
    type: 'HIK',
    cameras: [],
    expanded: false
  };
}

// Carpetas DIGIFORT (1-6)
for (let i = 1; i <= 6; i++) {
  SYSTEM_FOLDERS[`DIGIFORT${i}`] = {
    name: `DIGIFORT${i}`,
    type: 'DIGIFORT',
    cameras: [],
    expanded: false
  };
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  setupMenuSystem();
  setupDragAndDrop();
  setupImageInteraction();
  setupFileInputs();
  setupKeyboardShortcuts();
  setupZoomControls();
  setupTreeView();
  updateUI();
  generateTreeStructure();
});

// Generar estructura de árbol
function generateTreeStructure() {
  treeContainer.innerHTML = '';

  Object.keys(SYSTEM_FOLDERS).forEach(folderName => {
    const folder = SYSTEM_FOLDERS[folderName];
    const folderNode = createTreeNode(folderName, '📁', true, folder.expanded);
    folderNode.classList.add(folder.type === 'HIK' ? 'hik-folder' : 'digifort-folder');

    const toggle = folderNode.querySelector('.tree-toggle');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFolder(folderName);
    });

    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    childrenContainer.id = `children-${folderName}`;
    if (folder.expanded) {
      childrenContainer.classList.add('expanded');
    }

    updateFolderCameras(folderName, childrenContainer);
    treeContainer.appendChild(folderNode);
    treeContainer.appendChild(childrenContainer);
  });
}

function createTreeNode(label, icon, hasChildren = false, expanded = false) {
  const node = document.createElement('div');
  node.className = 'tree-item';

  const toggle = document.createElement('span');
  toggle.className = 'tree-toggle';
  if (hasChildren) {
    toggle.textContent = expanded ? '▼' : '▶';
  } else {
    toggle.classList.add('empty');
  }

  const iconSpan = document.createElement('span');
  iconSpan.className = 'tree-icon';
  iconSpan.textContent = icon;

  const labelSpan = document.createElement('span');
  labelSpan.className = 'tree-label';
  labelSpan.textContent = label;

  node.appendChild(toggle);
  node.appendChild(iconSpan);
  node.appendChild(labelSpan);

  return node;
}

function createCameraNode(pin) {
  const node = document.createElement('div');
  node.className = 'tree-item camera-item';
  if (pin.visionAngle === 360) {
    node.classList.add('camera-360');
  }
  node.dataset.pinId = pin.id;

  const toggle = document.createElement('span');
  toggle.className = 'tree-toggle empty';

  const icon = document.createElement('span');
  icon.className = 'tree-icon';
  icon.textContent = pin.visionAngle === 360 ? '🔵' : '📹';

  const label = document.createElement('span');
  label.className = 'tree-label';
  label.textContent = pin.name;

  const controls = document.createElement('div');
  controls.className = 'camera-controls';

  const editBtn = document.createElement('button');
  editBtn.className = 'camera-btn';
  editBtn.textContent = '✏️';
  editBtn.title = 'Editar cámara';
  editBtn.onclick = (e) => {
    e.stopPropagation();
    editPin(pin.id);
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'camera-btn';
  deleteBtn.textContent = '🗑️';
  deleteBtn.title = 'Eliminar cámara';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    removePin(pin.id);
  };

  const centerBtn = document.createElement('button');
  centerBtn.className = 'camera-btn';
  centerBtn.textContent = '🎯';
  centerBtn.title = 'Centrar vista';
  centerBtn.onclick = (e) => {
    e.stopPropagation();
    centerViewOnPin(pin);
  };

  controls.appendChild(editBtn);
  controls.appendChild(centerBtn);
  controls.appendChild(deleteBtn);

  node.appendChild(toggle);
  node.appendChild(icon);
  node.appendChild(label);
  node.appendChild(controls);

  const info = document.createElement('div');
  info.className = 'camera-info';
  info.textContent = `(${pin.x}, ${pin.y}) - ${pin.orient}° - ${pin.visionAngle === 360 ? '360°' : 'Fija'}`;

  const container = document.createElement('div');
  container.appendChild(node);
  container.appendChild(info);

  node.addEventListener('click', (e) => {
    e.stopPropagation();
    selectCamera(pin.id);
  });

  return container;
}

function updateFolderCameras(folderName, container) {
  const folder = SYSTEM_FOLDERS[folderName];
  container.innerHTML = '';

  if (folder.cameras.length === 0) {
    const emptyNode = document.createElement('div');
    emptyNode.className = 'tree-item';
    emptyNode.style.fontStyle = 'italic';
    emptyNode.style.color = '#666';
    emptyNode.innerHTML = `
      <span class="tree-toggle empty"></span>
      <span class="tree-icon">📝</span>
      <span class="tree-label">Sin cámaras asignadas</span>`;
    container.appendChild(emptyNode);
  } else {
    folder.cameras.forEach(pin => {
      const cameraNode = createCameraNode(pin);
      container.appendChild(cameraNode);
    });
  }
}

function toggleFolder(folderName) {
  const folder = SYSTEM_FOLDERS[folderName];
  folder.expanded = !folder.expanded;

  const childrenContainer = document.getElementById(`children-${folderName}`);
  const toggle = document.querySelector(`[data-folder="${folderName}"] .tree-toggle`);

  if (folder.expanded) {
    childrenContainer.classList.add('expanded');
    if (toggle) toggle.textContent = '▼';
  } else {
    childrenContainer.classList.remove('expanded');
    if (toggle) toggle.textContent = '▶';
  }

  const folderNodes = treeContainer.querySelectorAll('.hik-folder, .digifort-folder');
  folderNodes.forEach(node => {
    if (node.querySelector('.tree-label').textContent === folderName) {
      const nodeToggle = node.querySelector('.tree-toggle');
      nodeToggle.textContent = folder.expanded ? '▼' : '▶';
      node.dataset.folder = folderName;
    }
  });
}

function expandAllFolders() {
  Object.keys(SYSTEM_FOLDERS).forEach(folderName => {
    SYSTEM_FOLDERS[folderName].expanded = true;
  });
  generateTreeStructure();
  statusText.textContent = 'Todas las carpetas HIK y DIGIFORT expandidas';
}

function collapseAllFolders() {
  Object.keys(SYSTEM_FOLDERS).forEach(folderName => {
    SYSTEM_FOLDERS[folderName].expanded = false;
  });
  generateTreeStructure();
  statusText.textContent = 'Todas las carpetas HIK y DIGIFORT contraídas';
}

function assignCamerasToFolders() {
  if (pins.length === 0) {
    showNotification('Advertencia', 'No hay cámaras para asignar');
    return;
  }

  Object.keys(SYSTEM_FOLDERS).forEach(folderName => {
    SYSTEM_FOLDERS[folderName].cameras = [];
  });

  const allFolders = Object.keys(SYSTEM_FOLDERS);
  const totalFolders = allFolders.length;

  pins.forEach((pin, index) => {
    const folderIndex = index % totalFolders;
    const folderName = allFolders[folderIndex];
    SYSTEM_FOLDERS[folderName].cameras.push(pin);
  });

  updateTreeView();
  statusText.textContent = `${pins.length} cámaras distribuidas en ${totalFolders} carpetas del sistema`;
  showNotification('Auto-Asignación', `${pins.length} cámaras distribuidas automáticamente en HIK y DIGIFORT`);
}

function selectCamera(pinId) {
  treeContainer.querySelectorAll('.tree-item').forEach(item => {
    item.classList.remove('selected');
  });

  const cameraNode = treeContainer.querySelector(`[data-pin-id="${pinId}"]`);
  if (cameraNode) {
    cameraNode.classList.add('selected');
  }

  const pin = pins.find(p => p.id === pinId);
  if (pin) {
    centerViewOnPin(pin);
    statusText.textContent = `Cámara seleccionada: ${pin.name}`;
  }
}

function updateTreeView() {
  generateTreeStructure();
}

function assignCameraToFolder(pinId, folderName) {
  const pin = pins.find(p => p.id === pinId);
  if (!pin) return;

  Object.keys(SYSTEM_FOLDERS).forEach(key => {
    const folder = SYSTEM_FOLDERS[key];
    folder.cameras = folder.cameras.filter(p => p.id !== pinId);
  });

  SYSTEM_FOLDERS[folderName].cameras.push(pin);
  updateTreeView();
}

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

function setupTreeView() {
  // Eventos generados dinámicamente en generateTreeStructure
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

      const visionLayer = document.getElementById('vision-layer');
      visionLayer.style.width = '100%';
      visionLayer.style.height = '100%';
      visionLayer.style.position = 'absolute';
      visionLayer.style.top = '0';
      visionLayer.style.left = '0';
      visionLayer.style.pointerEvents = 'none';
      visionLayer.style.transformOrigin = '0 0';
      visionLayer.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);

      dropArea.style.display = 'none';
      statusText.textContent = `Imagen cargada: ${img.naturalWidth}x${img.naturalHeight}px - Sistemas HIK & DIGIFORT activos`;

      resetView();
      clearPins();
      updateUI();

      showNotification('Imagen Cargada', `${originalFileName} cargado en sistemas HIK & DIGIFORT.`);
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

    let visionAngle = VISION_ANGLE;
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

  assignCamerasToFolders();
  updateTreeView();
  updateUI();

  const message = currentImage ?
    `${loadedCount} cámaras cargadas y organizadas en carpetas HIK/DIGIFORT` :
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

function setupImageInteraction() {
  imagePanel.addEventListener('mousedown', handleMouseDown);
  imagePanel.addEventListener('mousemove', handleMouseMove);
  imagePanel.addEventListener('mouseup', handleMouseUp);
  imagePanel.addEventListener('mouseleave', handleMouseUp);

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
      visionAngle: VISION_ANGLE
    };

    pins.push(pin);
    createPinElement(pin);

    const allFolders = Object.keys(SYSTEM_FOLDERS);
    const folderIndex = (pins.length - 1) % allFolders.length;
    const folderName = allFolders[folderIndex];
    SYSTEM_FOLDERS[folderName].cameras.push(pin);

    updateTreeView();
    updateUI();
    renderConesSync();

    statusText.textContent = `${pin.name} agregado en (${imageX}, ${imageY}) - Asignado a ${folderName}`;
  }
}

function updateSynchronizedZoom() {
  const transform = `translate(${imagePositionX}px, ${imagePositionY}px) scale(${scale})`;

  imageWrapper.style.transform = transform;

  const visionLayer = document.getElementById('vision-layer');
  if (visionLayer) {
    visionLayer.style.transform = transform;
    visionLayer.style.transformOrigin = '0 0';
  }

  updatePinPositionsSync();
  renderConesSync();
}

function updatePinPositionsSync() {
  pins.forEach(pin => {
    const pinElement = document.querySelector(`[data-pin-id="${pin.id}"]`);
    if (pinElement) {
      const pinX = pin.x * scale + imagePositionX;
      const pinY = pin.y * scale + imagePositionY;

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
      const visibilityMargin = VISION_RANGE * scale;

      const isVisible = pinX >= -visibilityMargin && pinX <= containerWidth + visibilityMargin &&
                       pinY >= -visibilityMargin && pinY <= containerHeight + visibilityMargin;

      pinElement.classList.toggle('hidden', !isVisible);
    }
  });
}

function renderConesSync() {
  const visionLayer = document.getElementById('vision-layer');
  if (!visionLayer) return;

  const group = visionLayer.querySelector('#vision-group') ||
                document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.innerHTML = '';
  group.id = 'vision-group';

  if (!visionLayer.contains(group)) {
    visionLayer.appendChild(group);
  }

  if (currentImage) {
    visionLayer.setAttribute('viewBox', `0 0 ${currentImage.naturalWidth} ${currentImage.naturalHeight}`);
    visionLayer.style.width = `${currentImage.naturalWidth}px`;
    visionLayer.style.height = `${currentImage.naturalHeight}px`;
  }

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
  if (pin.visionAngle === 360) {
    pinCenter.classList.add('camera-360');
  }
  pinCenter.style.width = `${8}px`;
  pinCenter.style.height = `${8}px`;
  pinCenter.style.borderWidth = `${2}px`;
  pinCenter.style.left = `${-4}px`;
  pinCenter.style.top = `${-4}px`;

  const pinLabel = document.createElement('div');
  pinLabel.className = 'pin-label';
  pinLabel.textContent = pin.name;
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

  updatePinPositionsSync();
  renderConesSync();
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

  Object.keys(SYSTEM_FOLDERS).forEach(key => {
    const folder = SYSTEM_FOLDERS[key];
    folder.cameras = folder.cameras.filter(p => p.id !== removed.id);
  });

  redrawAll();
  statusText.textContent = 'Cámara eliminada del sistema HIK/DIGIFORT';
}

function redrawAll() {
  updateTreeView();
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

  let visionAngle = VISION_ANGLE;
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

  updateTreeView();
  updateUI();
  const newTypeDisplay = pin.visionAngle === 360 ? '360°' : 'Fija';
  statusText.textContent = `${pin.name} editado: ${oldName}→${pin.name}, ${oldOrient}°→${pin.orient}°, ${oldType}→${newTypeDisplay}`;
  showNotification('Pin Editado', `${pin.name} actualizado en sistema HIK/DIGIFORT`);
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
    renderConesSync();
  }
}

function clearPins() {
  pins = [];
  pinCounter = 0;
  document.querySelectorAll('.pin').forEach(pin => pin.remove());
  const vg = document.getElementById('vision-group');
  if (vg) vg.innerHTML = '';

  Object.keys(SYSTEM_FOLDERS).forEach(key => {
    SYSTEM_FOLDERS[key].cameras = [];
  });

  updateTreeView();
  updateUI();
  statusText.textContent = 'Todas las cámaras eliminadas del sistema HIK/DIGIFORT';
}

function updateSVGCones() {
  if (!currentImage || pins.length === 0) {
    showNotification('Advertencia', 'No hay imagen o cámaras para actualizar');
    return;
  }

  renderConesSync();

  statusText.textContent = `${pins.length} conos SVG sincronizados en sistema HIK/DIGIFORT`;
  showNotification('Conos Actualizados', `${pins.length} conos sincronizados con zoom HIK/DIGIFORT`);
}

function togglePinMode() {
  if (!currentImage) {
    showNotification('Error', 'Debe cargar una imagen antes de activar el modo cámara');
    return;
  }

  isPinMode = !isPinMode;
  updateUI();

  const modeText = isPinMode ? 'ACTIVO' : 'Navegación';
  statusText.textContent = `Modo cámara ${modeText} - Sistema HIK/DIGIFORT`;
  showNotification('Modo Cámara', `Modo cámara ${modeText.toLowerCase()} en sistema HIK/DIGIFORT`);

  if (isPinMode) {
    imagePanel.classList.add('pinning');
    imagePanel.style.cursor = 'crosshair';
  } else {
    imagePanel.classList.remove('pinning');
    imagePanel.style.cursor = 'grab';
  }
}

function updateImagePosition() {
  updateSynchronizedZoom();
}

function updatePinPositions() {
  updatePinPositionsSync();
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

  statusText.textContent = `Vista centrada en ${pin.name} (Sistema HIK/DIGIFORT)`;
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

function downloadCSV() {
  if (pins.length === 0) {
    showNotification('Advertencia', 'No hay cámaras para guardar');
    return;
  }

  let csvContent = 'Nombre,EjeX,EjeY,Orient,Tipo,Sistema\n';

  pins.forEach(pin => {
    const tipo = pin.visionAngle === 360 ? '360' : 'fija';
    let sistemaAsignado = 'Sin_Asignar';

    Object.keys(SYSTEM_FOLDERS).forEach(folderName => {
      if (SYSTEM_FOLDERS[folderName].cameras.some(p => p.id === pin.id)) {
        sistemaAsignado = folderName;
      }
    });

    csvContent += `"${pin.name}",${pin.x},${pin.y},${pin.orient},"${tipo}","${sistemaAsignado}"\n`;
  });

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, 'camaras_sistema.csv');

  statusText.textContent = `CSV del sistema guardado con ${pins.length} cámaras`;
  showNotification('CSV Sistema Guardado', `Archivo guardado con ${pins.length} cámaras HIK/DIGIFORT`);
}

function consolidateAndSave() {
  if (!currentImage || pins.length === 0) {
    showNotification('Advertencia', 'No hay imagen o cámaras para consolidar');
    return;
  }

  statusText.textContent = 'Consolidando imagen HIK...';

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

    statusText.textContent = `Imagen del sistema consolidada: ${fileName}`;
    showNotification('Imagen Sistema Guardada', `Archivo guardado como: ${fileName}`);
    consolidateCounter++;
  }, 'image/png');
}

function drawVisionConeOnCanvas(ctx, x, y, orientation, label, visionAngle = VISION_ANGLE) {
  ctx.save();

  if (visionAngle === 360) {
    ctx.fillStyle = 'rgba(53, 162, 235, 0.3)';
    ctx.strokeStyle = '#3593eb';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(x, y, VISION_RANGE, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
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
  return `${baseName}_sistema_${versionNumber}.${extension}`;
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
        case 'e':
          expandAllFolders();
          break;
        case 'c':
          collapseAllFolders();
          break;
        case 'a':
          assignCamerasToFolders();
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

window.removePin = removePin;
window.editPin = editPin;
window.expandAllFolders = expandAllFolders;
window.collapseAllFolders = collapseAllFolders;
window.assignCamerasToFolders = assignCamerasToFolders;

