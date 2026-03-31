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
const searchInput = document.getElementById('search-input');
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
let searchQuery = '';

// Configuración del cono de visión
const VISION_RANGE = 150;
const VISION_ANGLE = 72;
const EXPECTED_COLUMNS = ['Nombre', 'EjeX', 'EjeY', 'Orient', 'Tipo', 'Servidor'];

// Estructura de carpetas HIK y DIGIFORT
const SYSTEM_FOLDERS = {};

// Pilas para deshacer y rehacer
const undoStack = [];
const redoStack = [];

function canonicalServerName(name) {
  return name.trim().toUpperCase();
}


// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  setupMenuSystem();
  setupDragAndDrop();
  setupImageInteraction();
  setupFileInputs();
  setupSearch();
  setupKeyboardShortcuts();
  setupZoomControls();
  setupTreeView();
  updateUI();
  generateTreeStructure();
  enableDragAndDropAssignment();
});

// Generar estructura de árbol
function generateTreeStructure() {
  treeContainer.innerHTML = '';

  // NUEVA SECCIÓN: Cámaras sin asignar
  const unassignedCameras = pins.filter(p => !p.server || !SYSTEM_FOLDERS[p.server]);
  if (unassignedCameras.length > 0) {
    const unassignedNode = createTreeNode('Sin Asignar', '❓', true, true);
    unassignedNode.classList.add('unassigned-folder');

    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children expanded';
    childrenContainer.id = 'children-unassigned';

    unassignedCameras.forEach(pin => {
      if (pin.name.toLowerCase().includes(searchQuery)) {
        const cameraNode = createCameraNode(pin);
        childrenContainer.appendChild(cameraNode);
      }
    });

    treeContainer.appendChild(unassignedNode);
    treeContainer.appendChild(childrenContainer);
  }

  // Resto de carpetas del sistema
  Object.keys(SYSTEM_FOLDERS).sort((a, b) => a.localeCompare(b)).forEach(folderName => {
    const folder = SYSTEM_FOLDERS[folderName];
    const folderMatches = folderName.toLowerCase().includes(searchQuery);
    const camerasToShow = folder.cameras.filter(p => p.name.toLowerCase().includes(searchQuery));
    if (searchQuery && !folderMatches && camerasToShow.length === 0) {
      return;
    }
    const folderNode = createTreeNode(folderName, '📁', true, folder.expanded);
    const folderClass = folder.type === 'HIK' ? 'hik-folder' :
                       folder.type === 'DIGIFORT' ? 'digifort-folder' : 'server-folder';
    folderNode.classList.add(folderClass);

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

    updateFolderCameras(folderName, childrenContainer, camerasToShow);
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
  if (!pin.server || !SYSTEM_FOLDERS[pin.server]) {
    node.classList.add('unassigned-camera');
  }
  node.draggable = true;
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

function updateFolderCameras(folderName, container, cameraList = null) {
  const folder = SYSTEM_FOLDERS[folderName];
  const cameras = cameraList || folder.cameras;
  container.innerHTML = '';

  if (cameras.length === 0) {
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
    cameras.forEach(pin => {
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

function filterTree(query) {
  searchQuery = query.toLowerCase();
  updateTreeView();
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

function addServer() {
  let name = prompt('Nombre del nuevo servidor:');
  if (!name) return;
  name = canonicalServerName(name);
  if (SYSTEM_FOLDERS[name]) {
    showNotification('Aviso', 'El servidor ya existe');
    return;
  }
  SYSTEM_FOLDERS[name] = { name: name, type: 'SERVER', cameras: [], expanded: false };
  updateTreeView();
  showNotification('Servidor Agregado', `Servidor "${name}" creado`);
}

function assignCamerasToFolders() {
  // Cambiar de auto-asignación a asignación manual solamente
  if (pins.length === 0) {
    showNotification('Advertencia', 'No hay cámaras para gestionar');
    return;
  }

  // Mostrar diálogo de confirmación para asignación manual
  const confirmed = confirm(
    `Tienes ${pins.length} cámaras sin asignar.\n\n` +
    '¿Deseas abrir el modo de asignación manual?\n\n' +
    '(Las cámaras permanecerán sin asignar hasta que las muevas manualmente)'
  );

  if (confirmed) {
    // Expandir todas las carpetas para facilitar asignación manual
    expandAllFolders();
    showNotification('Modo Manual Activo', 'Arrastra las cámaras a las carpetas deseadas');
    statusText.textContent = 'Modo asignación manual activado - Arrastra cámaras a carpetas';
  }
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

function saveState() {
  const foldersState = {};
  Object.keys(SYSTEM_FOLDERS).forEach(name => {
    foldersState[name] = {
      ...SYSTEM_FOLDERS[name],
      cameras: SYSTEM_FOLDERS[name].cameras.map(p => p.id)
    };
  });
  const state = {
    pins: JSON.parse(JSON.stringify(pins)),
    folders: foldersState
  };
  undoStack.push(state);
  if (undoStack.length > 3) undoStack.shift();
  redoStack.length = 0;
}

function restoreState(state) {
  pins = JSON.parse(JSON.stringify(state.pins));
  Object.keys(SYSTEM_FOLDERS).forEach(k => delete SYSTEM_FOLDERS[k]);
  Object.keys(state.folders).forEach(name => {
    const f = state.folders[name];
    SYSTEM_FOLDERS[name] = { ...f, cameras: [] };
  });
  pins.forEach(pin => {
    const serv = pin.server;
    if (SYSTEM_FOLDERS[serv] && !SYSTEM_FOLDERS[serv].cameras.some(p => p.id === pin.id)) {
      SYSTEM_FOLDERS[serv].cameras.push(pin);
    }
  });
  pinCounter = pins.reduce((m, p) => Math.max(m, p.id), 0);

  document.querySelectorAll('.pin').forEach(p => p.remove());
  const vg = document.getElementById('vision-group');
  if (vg) vg.innerHTML = '';
  pins.forEach(pin => createPinElement(pin));
  renderConesSync();
  updateTreeView();
  updateUI();
}

function undoAction() {
  if (undoStack.length === 0) return;
  const foldersState = {};
  Object.keys(SYSTEM_FOLDERS).forEach(name => {
    foldersState[name] = {
      ...SYSTEM_FOLDERS[name],
      cameras: SYSTEM_FOLDERS[name].cameras.map(p => p.id)
    };
  });
  const current = {
    pins: JSON.parse(JSON.stringify(pins)),
    folders: foldersState
  };
  redoStack.push(current);
  if (redoStack.length > 3) redoStack.shift();
  const state = undoStack.pop();
  restoreState(state);
  statusText.textContent = 'Última acción deshecha';
}

function redoAction() {
  if (redoStack.length === 0) return;
  const foldersState = {};
  Object.keys(SYSTEM_FOLDERS).forEach(name => {
    foldersState[name] = {
      ...SYSTEM_FOLDERS[name],
      cameras: SYSTEM_FOLDERS[name].cameras.map(p => p.id)
    };
  });
  const current = {
    pins: JSON.parse(JSON.stringify(pins)),
    folders: foldersState
  };
  undoStack.push(current);
  if (undoStack.length > 3) undoStack.shift();
  const state = redoStack.pop();
  restoreState(state);
  statusText.textContent = 'Acción rehecha';
}

function assignCameraToFolder(pinId, folderName) {
  saveState();
  folderName = canonicalServerName(folderName);
  const pin = pins.find(p => p.id === pinId);
  if (!pin) return;

  Object.keys(SYSTEM_FOLDERS).forEach(key => {
    const folder = SYSTEM_FOLDERS[key];
    folder.cameras = folder.cameras.filter(p => p.id !== pinId);
  });

  if (!SYSTEM_FOLDERS[folderName]) {
    SYSTEM_FOLDERS[folderName] = { name: folderName, type: 'SERVER', cameras: [], expanded: false };
  }
  if (!SYSTEM_FOLDERS[folderName].cameras.some(p => p.id === pin.id)) {
    SYSTEM_FOLDERS[folderName].cameras.push(pin);
  }
  pin.server = folderName;
  updateTreeView();
}

function enableDragAndDropAssignment() {
  // Hacer cámaras arrastrables
  document.addEventListener('dragstart', (e) => {
    if (e.target.closest('.camera-item')) {
      const pinId = e.target.closest('.camera-item').dataset.pinId;
      e.dataTransfer.setData('text/plain', pinId);
    }
  });

  // Permitir soltar en carpetas
  document.addEventListener('dragover', (e) => {
    if (e.target.closest('.hik-folder, .digifort-folder, .server-folder')) {
      e.preventDefault();
    }
  });

  document.addEventListener('drop', (e) => {
    const folderElement = e.target.closest('.hik-folder, .digifort-folder, .server-folder');
    if (folderElement) {
      e.preventDefault();
      const pinId = parseInt(e.dataTransfer.getData('text/plain'));
      const folderName = folderElement.querySelector('.tree-label').textContent;
      assignCameraToFolder(pinId, folderName);
      showNotification('Cámara Asignada', `Cámara movida a ${folderName}`);
    }
  });
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
    case 'deshacer':
      undoAction();
      break;
    case 'rehacer':
      redoAction();
      break;
    case 'corregir':
      if (isCorrectionMode) {
        exitCorrectionMode(false);
      } else {
        enterCorrectionMode();
      }
      break;
    case 'corregir-1':
      if (isCorrection1Mode) {
        exitCorrection1Mode(false);
      } else {
        enterCorrection1Mode();
      }
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

function setupSearch() {
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterTree(searchInput.value);
    });
  }
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
  const maxSize = 50 * 1024 * 1024;
  if (!file.type.startsWith('image/')) {
    showNotification('Error', 'Archivo inválido. Seleccione una imagen.');
    return;
  }
  if (file.size > maxSize) {
    showNotification('Error', `Imagen demasiado pesada (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo permitido: 50 MB.`);
    return;
  }

  originalFileName = file.name;
  statusText.textContent = 'Cargando imagen...';

  // Usar createObjectURL en lugar de readAsDataURL para evitar duplicar
  // la imagen en memoria como Base64 (~33% más de RAM).
  const objectURL = URL.createObjectURL(file);
  const img = new Image();
  img.src = objectURL;
  img.onload = () => {
    // Liberar el objectURL del blob de carga (la imagen ya está decodificada)
    URL.revokeObjectURL(objectURL);

    // Guardar copia original para la exportación.
    // Se crea desde el mismo blob para no duplicar la cadena Base64.
    currentImageOriginal = new Image();
    currentImageOriginal.src = URL.createObjectURL(file);

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

    showNotification('Imagen Cargada', `${originalFileName} (${(file.size / 1024 / 1024).toFixed(1)} MB) cargado en sistemas HIK & DIGIFORT.`);
  };
  img.onerror = () => {
    URL.revokeObjectURL(objectURL);
    showNotification('Error', 'No se pudo decodificar la imagen. Verifique que el archivo no esté corrupto.');
    statusText.textContent = 'Error al cargar imagen';
  };
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
  saveState();
  const registros = validateAndParseCSV(csvContent);
  clearPins();

  // NO eliminar carpetas existentes
  // Object.keys(SYSTEM_FOLDERS).forEach(k => delete SYSTEM_FOLDERS[k]);

  let loadedCount = 0;
  let maxId = 0;
  let unassignedCount = 0;

  registros.forEach(fila => {
    const nombre = fila.Nombre;
    const x = parseInt(fila.EjeX);
    const y = parseInt(fila.EjeY);
    const orientation = parseFloat(fila.Orient);
    const tipo = fila.Tipo;
    const servidor = fila.Servidor ? canonicalServerName(fila.Servidor) : null; // ← CAMBIO

    // Solo crear carpeta si está especificada en CSV
    if (servidor && !SYSTEM_FOLDERS[servidor]) {
      SYSTEM_FOLDERS[servidor] = { 
        name: servidor, 
        type: 'SERVER', 
        cameras: [], 
        expanded: false 
      };
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
      visionAngle: visionAngle,
      server: servidor  // ← Puede ser null si no se especifica
    };

    pins.push(pin);

    // Solo asignar si hay servidor especificado
    if (servidor && SYSTEM_FOLDERS[servidor]) {
      SYSTEM_FOLDERS[servidor].cameras.push(pin);
    } else {
      unassignedCount++;
    }

    if (currentImage) {
      createPinElement(pin);
      if (visionAngle === 360) {
        drawCircle(pin.x, pin.y, pin.orient, pin.name);
      } else {
        drawCone(pin.x, pin.y, pin.orient, pin.name);
      }
    }

    loadedCount++;
  });

  pinCounter = maxId;

  updateTreeView();
  updateUI();

  const message = currentImage ?
    `${loadedCount} cámaras cargadas (${unassignedCount} sin asignar)` :
    `${loadedCount} cámaras cargadas (${unassignedCount} sin asignar). Abra una imagen para visualizarlas.`;

  statusText.textContent = message;
  showNotification('CSV Cargado', message);
}

function validateAndParseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('El archivo CSV está vacío o sin datos.');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const missing = EXPECTED_COLUMNS.filter(c => !headers.includes(c));
  if (missing.length > 0) {
    throw new Error(`Faltan columnas requeridas: ${missing.join(', ')}`);
  }

  const registros = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length !== headers.length) {
      console.error(`Error en la línea ${i + 1}: cantidad de columnas incorrecta`);
      continue;
    }

    const fila = Object.fromEntries(headers.map((h, j) => [h, values[j] ? values[j].trim() : '']));

    if (isNaN(fila.EjeX) || isNaN(fila.EjeY) || isNaN(fila.Orient)) {
      console.error(`Coordenadas inválidas en la línea ${i + 1}: EjeX=${fila.EjeX}, EjeY=${fila.EjeY}, Orient=${fila.Orient}`);
      continue;
    }

    registros.push(fila);
  }

  return registros;
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

  // En modo corrección, no procesar aquí (lo maneja el handler de capture)
  if (isCorrectionMode || isCorrection1Mode) return;

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
  saveState();
  const rect = imagePanel.getBoundingClientRect();

  const x = (e.clientX - rect.left - imagePositionX) / scale;
  const y = (e.clientY - rect.top - imagePositionY) / scale;

  const imageX = Math.round(x);
  const imageY = Math.round(y);

  if (imageX >= 0 && imageX <= currentImage.naturalWidth &&
      imageY >= 0 && imageY <= currentImage.naturalHeight) {

    pinCounter++;

    // ELIMINAR asignación automática - dejar sin asignar
    const pin = {
      id: pinCounter,
      name: `Cam_${pinCounter}`,
      x: imageX,
      y: imageY,
      orient: 0,
      visionAngle: VISION_ANGLE,
      server: null  // ← CAMBIO: Sin asignación automática
    };

    pins.push(pin);
    createPinElement(pin);

    // NO agregar a ninguna carpeta automáticamente
    // SYSTEM_FOLDERS[folderName].cameras.push(pin); ← ELIMINAR ESTA LÍNEA

    updateTreeView();
    updateUI();
    renderConesSync();

    // Mostrar mensaje indicando que debe asignar manualmente
    statusText.textContent = `${pin.name} creado en (${imageX}, ${imageY}) - Sin asignar (requiere asignación manual)`;
    showNotification('Cámara Creada', `${pin.name} creado. Asígnalo manualmente a una carpeta.`);
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
    // En modo corrección, el clic selecciona la referencia (no elimina)
    if (isCorrectionMode || isCorrection1Mode) return;
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
  saveState();
  const removed = pins.splice(index, 1)[0];
  if (!removed) return;

  const pinElement = document.querySelector(`[data-pin-id="${removed.id}"]`);
  if (pinElement) {
    pinElement.remove();
  }

  if (removed.server && SYSTEM_FOLDERS[removed.server]) {
    SYSTEM_FOLDERS[removed.server].cameras = SYSTEM_FOLDERS[removed.server].cameras.filter(p => p.id !== removed.id);
  } else {
    Object.keys(SYSTEM_FOLDERS).forEach(key => {
      const folder = SYSTEM_FOLDERS[key];
      folder.cameras = folder.cameras.filter(p => p.id !== removed.id);
    });
  }

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

  saveState();

  const newName = prompt('Nombre del punto:', pin.name);
  if (newName === null) return;

  const newOrient = prompt('Orientación (grados):', pin.orient);
  if (newOrient === null) return;

  const newType = prompt('Tipo de cámara:\n"fija" = Cono direccional\n"360" = Visión completa\n\nIngrese tipo:',
    pin.visionAngle === 360 ? '360' : 'fija');
  if (newType === null) return;

  const servers = Object.keys(SYSTEM_FOLDERS)
    .sort((a, b) => a.localeCompare(b))
    .map(s => canonicalServerName(s));
  let serverPrompt = 'Seleccione servidor:\n';
  servers.forEach((s, i) => { serverPrompt += `${i + 1}. ${s}\n`; });
  const currentServer = canonicalServerName(pin.server || servers[0] || '');
  let serverInput = prompt(serverPrompt, currentServer);
  if (serverInput === null) return;
  serverInput = canonicalServerName(serverInput);
  let newServer = '';
  const idx = parseInt(serverInput, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= servers.length) {
    newServer = servers[idx - 1];
  } else if (servers.includes(serverInput)) {
    newServer = serverInput;
  } else {
    showNotification('Error', 'Servidor inválido');
    return;
  }

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
  const oldServer = pin.server;
  if (newServer && newServer !== oldServer) {
    assignCameraToFolder(pin.id, newServer);
  }

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
  saveState();
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

  const menuItems = document.querySelectorAll('[data-action="guardar-imagen"], [data-action="guardar-csv"], [data-action="modo-camara"], [data-action="limpiar-camaras"], [data-action="actualizar-conos"], [data-action="corregir"], [data-action="corregir-1"], [data-action="zoom-in"], [data-action="zoom-out"], [data-action="zoom-reset"], [data-action="zoom-fit"], [data-action="zoom-custom"]');

  menuItems.forEach(item => {
    const action = item.getAttribute('data-action');
    if (['guardar-imagen', 'guardar-csv'].includes(action)) {
      item.classList.toggle('disabled', !hasPins);
    } else if (action === 'corregir' || action === 'corregir-1') {
      item.classList.toggle('disabled', !hasImage || !hasPins);
    } else {
      item.classList.toggle('disabled', !hasImage);
    }
  });

  const undoItem = document.querySelector('[data-action="deshacer"]');
  const redoItem = document.querySelector('[data-action="rehacer"]');
  if (undoItem) undoItem.classList.toggle('disabled', undoStack.length === 0);
  if (redoItem) redoItem.classList.toggle('disabled', redoStack.length === 0);

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

  let csvContent = 'Nombre,EjeX,EjeY,Orient,Tipo,Servidor\n';

  pins.forEach(pin => {
    const tipo = pin.visionAngle === 360 ? '360' : 'fija';
    const servidor = pin.server || 'Sin_Asignar';
    csvContent += `"${pin.name}",${pin.x},${pin.y},${pin.orient},"${tipo}","${servidor}"\n`;
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

  const w = currentImage.naturalWidth;
  const h = currentImage.naturalHeight;
  const totalPixels = w * h;

  // Límite seguro de canvas por navegador:
  // Safari/iOS ~16.7M px, Firefox ~124M px, Chrome ~268M px.
  // Usamos 16M como umbral conservador para máxima compatibilidad.
  const MAX_CANVAS_PIXELS = 16777216; // 4096 * 4096

  let exportW = w;
  let exportH = h;

  if (totalPixels > MAX_CANVAS_PIXELS) {
    const scaleFactor = Math.sqrt(MAX_CANVAS_PIXELS / totalPixels);
    exportW = Math.floor(w * scaleFactor);
    exportH = Math.floor(h * scaleFactor);
    showNotification(
      'Aviso de Exportación',
      `Imagen reducida a ${exportW}x${exportH}px para compatibilidad con el navegador (original: ${w}x${h}px).`
    );
  }

  statusText.textContent = 'Consolidando imagen HIK...';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = exportW;
  canvas.height = exportH;

  // Si se redujo, escalar el contexto proporcionalmente
  if (exportW !== w || exportH !== h) {
    ctx.scale(exportW / w, exportH / h);
  }

  ctx.drawImage(currentImageOriginal, 0, 0);

  pins.forEach(pin => {
    drawVisionConeOnCanvas(ctx, pin.x, pin.y, pin.orient, pin.name, pin.visionAngle);
  });

  canvas.toBlob((blob) => {
    if (!blob) {
      showNotification('Error', 'No se pudo generar la imagen. Intente con una resolución menor.');
      statusText.textContent = 'Error al consolidar imagen';
      return;
    }
    const fileName = generateVersionedFileName(originalFileName);
    downloadBlob(blob, fileName);

    statusText.textContent = `Imagen del sistema consolidada: ${fileName} (${exportW}x${exportH}px)`;
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
    // Escape sale de los modos de corrección
    if (e.key === 'Escape') {
      if (isCorrectionMode) { exitCorrectionMode(false); return; }
      if (isCorrection1Mode) { exitCorrection1Mode(false); return; }
    }

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
        case 'z':
          e.preventDefault();
          undoAction();
          break;
        case 'y':
          e.preventDefault();
          redoAction();
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
        case 'r':
          if (currentImage && pins.length > 0) {
            if (isCorrectionMode) {
              exitCorrectionMode(false);
            } else {
              enterCorrectionMode();
            }
          }
          break;
        case 't':
          if (currentImage && pins.length > 0) {
            if (isCorrection1Mode) {
              exitCorrection1Mode(false);
            } else {
              enterCorrection1Mode();
            }
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

// ========== MODO CORRECCIÓN MASIVA ==========

let isCorrectionMode = false;
let correctionRefPin = null;       // Pin de referencia seleccionado
let correctionDragging = false;    // Está arrastrando la cámara de referencia
let correctionDragStartX = 0;     // Posición screen al empezar drag
let correctionDragStartY = 0;
let correctionOrigX = 0;           // Posición original del pin de referencia (image coords)
let correctionOrigY = 0;
let correctionDeltaX = 0;          // Delta acumulado en coordenadas de imagen
let correctionDeltaY = 0;
let correctionOriginalPositions = [];  // Posiciones originales de todos los pines

const correctionBar = document.getElementById('correction-bar');
const correctionStatus = document.getElementById('correction-status');
const correctionOffset = document.getElementById('correction-offset');
const correctionConfirmBtn = document.getElementById('correction-confirm');
const correctionCancelBtn = document.getElementById('correction-cancel');

function enterCorrectionMode() {
  if (!currentImage) {
    showNotification('Error', 'Debe cargar una imagen antes de corregir posiciones');
    return;
  }
  if (pins.length === 0) {
    showNotification('Error', 'No hay cámaras para corregir');
    return;
  }

  // Desactivar otros modos
  if (isPinMode) togglePinMode();
  if (isCorrection1Mode) exitCorrection1Mode(false);

  isCorrectionMode = true;
  correctionRefPin = null;
  correctionDeltaX = 0;
  correctionDeltaY = 0;

  // Guardar posiciones originales
  correctionOriginalPositions = pins.map(p => ({ id: p.id, x: p.x, y: p.y }));

  // Mostrar barra de corrección
  correctionBar.classList.add('show');
  correctionStatus.textContent = 'Seleccione una cámara de referencia haciendo clic en ella';
  correctionOffset.textContent = '';
  correctionConfirmBtn.disabled = true;

  // Cursor y visual
  imagePanel.classList.add('correction-mode');

  // Botones toolbar/menu
  const corregirBtn = document.getElementById('corregir-btn');
  if (corregirBtn) corregirBtn.classList.add('active');

  statusText.textContent = 'Modo Corrección activo — seleccione una cámara de referencia';
  showNotification('Modo Corrección', 'Haga clic sobre la cámara que desea usar como referencia para la corrección.');
}

function exitCorrectionMode(applyChanges) {
  if (!isCorrectionMode) return;

  if (applyChanges && (correctionDeltaX !== 0 || correctionDeltaY !== 0)) {
    // Guardar estado para undo
    saveState();

    // Aplicar delta a todas las cámaras definitivamente
    pins.forEach(pin => {
      const orig = correctionOriginalPositions.find(o => o.id === pin.id);
      if (orig) {
        pin.x = Math.round(orig.x + correctionDeltaX);
        pin.y = Math.round(orig.y + correctionDeltaY);
      }
    });

    // Actualizar carpetas con las referencias actualizadas
    Object.keys(SYSTEM_FOLDERS).forEach(key => {
      SYSTEM_FOLDERS[key].cameras = SYSTEM_FOLDERS[key].cameras.map(cam => {
        return pins.find(p => p.id === cam.id) || cam;
      });
    });

    statusText.textContent = `Corrección aplicada: ΔX=${Math.round(correctionDeltaX)}, ΔY=${Math.round(correctionDeltaY)} a ${pins.length} cámaras`;
    showNotification('Corrección Aplicada', `${pins.length} cámaras reubicadas (ΔX: ${Math.round(correctionDeltaX)}, ΔY: ${Math.round(correctionDeltaY)})`);
  } else {
    // Revertir a posiciones originales
    if (correctionOriginalPositions.length > 0) {
      pins.forEach(pin => {
        const orig = correctionOriginalPositions.find(o => o.id === pin.id);
        if (orig) {
          pin.x = orig.x;
          pin.y = orig.y;
        }
      });
    }
    statusText.textContent = 'Corrección cancelada — posiciones originales restauradas';
  }

  // Limpiar estado visual
  isCorrectionMode = false;
  correctionRefPin = null;
  correctionDragging = false;
  correctionOriginalPositions = [];
  correctionDeltaX = 0;
  correctionDeltaY = 0;

  correctionBar.classList.remove('show');
  imagePanel.classList.remove('correction-mode');

  // Quitar highlight de referencia
  document.querySelectorAll('.pin-center.correction-ref').forEach(el => {
    el.classList.remove('correction-ref');
  });
  document.querySelectorAll('.pin.correction-preview').forEach(el => {
    el.classList.remove('correction-preview');
  });

  const corregirBtn = document.getElementById('corregir-btn');
  if (corregirBtn) corregirBtn.classList.remove('active');

  // Redibujar
  document.querySelectorAll('.pin').forEach(p => p.remove());
  const vg = document.getElementById('vision-group');
  if (vg) vg.innerHTML = '';
  pins.forEach(pin => createPinElement(pin));
  renderConesSync();
  updateTreeView();
  updateUI();
}

function correctionSelectRef(pinId) {
  correctionRefPin = pins.find(p => p.id === pinId);
  if (!correctionRefPin) return;

  correctionOrigX = correctionRefPin.x;
  correctionOrigY = correctionRefPin.y;

  // Highlight visual
  document.querySelectorAll('.pin-center.correction-ref').forEach(el => {
    el.classList.remove('correction-ref');
  });
  const pinEl = document.querySelector(`.pin[data-pin-id="${pinId}"] .pin-center`);
  if (pinEl) pinEl.classList.add('correction-ref');

  correctionStatus.textContent = `Referencia: ${correctionRefPin.name} — arrástrela a su posición correcta`;
  statusText.textContent = `Cámara de referencia: ${correctionRefPin.name} — arrastre para corregir`;
}

function correctionStartDrag(e, pinId) {
  if (!isCorrectionMode) return;

  // Si no hay referencia, seleccionar esta como referencia
  if (!correctionRefPin) {
    correctionSelectRef(pinId);
    return;
  }

  // Solo se puede arrastrar la cámara de referencia
  if (correctionRefPin.id !== pinId) {
    // Cambiar la referencia a la nueva cámara
    correctionSelectRef(pinId);
    return;
  }

  correctionDragging = true;
  correctionDragStartX = e.clientX;
  correctionDragStartY = e.clientY;

  e.preventDefault();
  e.stopPropagation();
}

function correctionMoveDrag(e) {
  if (!correctionDragging || !correctionRefPin) return;

  e.preventDefault();
  e.stopPropagation();

  // Calcular delta en pixels de pantalla
  const screenDX = e.clientX - correctionDragStartX;
  const screenDY = e.clientY - correctionDragStartY;

  // Convertir a coordenadas de imagen
  const imageDX = screenDX / scale;
  const imageDY = screenDY / scale;

  // Delta total = delta previo (de arrastres anteriores) + delta actual
  // Pero el delta previo ya está aplicado a correctionOriginalPositions
  // Necesitamos recalcular desde las posiciones originales
  const prevDeltaX = correctionDeltaX;
  const prevDeltaY = correctionDeltaY;
  const newDeltaX = prevDeltaX + imageDX;
  const newDeltaY = prevDeltaY + imageDY;

  // Actualizar posiciones de preview (temporal) de TODOS los pines
  pins.forEach(pin => {
    const orig = correctionOriginalPositions.find(o => o.id === pin.id);
    if (orig) {
      pin.x = orig.x + newDeltaX;
      pin.y = orig.y + newDeltaY;
    }
  });

  // Redibujar posiciones
  updatePinPositionsSync();
  renderConesSync();

  // Mostrar offset en la barra
  correctionOffset.textContent = `ΔX: ${Math.round(newDeltaX)}  ΔY: ${Math.round(newDeltaY)}`;
}

function correctionEndDrag(e) {
  if (!correctionDragging || !correctionRefPin) return;

  correctionDragging = false;

  // Calcular delta final de este arrastre
  const screenDX = e.clientX - correctionDragStartX;
  const screenDY = e.clientY - correctionDragStartY;
  const imageDX = screenDX / scale;
  const imageDY = screenDY / scale;

  // Acumular al delta total
  correctionDeltaX += imageDX;
  correctionDeltaY += imageDY;

  // Verificar si hay cambio real
  if (Math.abs(correctionDeltaX) > 0.5 || Math.abs(correctionDeltaY) > 0.5) {
    correctionConfirmBtn.disabled = false;
    correctionStatus.textContent = `Referencia: ${correctionRefPin.name} — confirme o siga ajustando`;

    // Marcar todos los pines no-referencia como preview
    document.querySelectorAll('.pin').forEach(el => {
      const id = parseInt(el.dataset.pinId);
      if (id !== correctionRefPin.id) {
        el.classList.add('correction-preview');
      }
    });
  }

  correctionOffset.textContent = `ΔX: ${Math.round(correctionDeltaX)}  ΔY: ${Math.round(correctionDeltaY)}`;
  statusText.textContent = `Corrección: ΔX=${Math.round(correctionDeltaX)}, ΔY=${Math.round(correctionDeltaY)} — confirme o siga ajustando`;
}

// Interceptar eventos del image-panel en modo corrección
function handleCorrectionMouseDown(e) {
  if (!isCorrectionMode) return false;

  const pinCenter = e.target.closest('.pin-center');
  if (pinCenter) {
    const pinEl = pinCenter.closest('.pin');
    if (pinEl) {
      const pinId = parseInt(pinEl.dataset.pinId);
      correctionStartDrag(e, pinId);
      return true;  // Evento consumido
    }
  }

  // Clic en el panel (no en un pin) — no hacer nada especial,
  // pero podría permitir pan normal si no está arrastrando
  return false;
}

// Integrar modo corrección con handlers existentes.
// Se usa "capture: true" para interceptar antes de los handlers registrados en setupImageInteraction.
imagePanel.addEventListener('mousedown', function(e) {
  if (isCorrectionMode && handleCorrectionMouseDown(e)) {
    e.stopImmediatePropagation();
  }
}, true);

imagePanel.addEventListener('mousemove', function(e) {
  if (isCorrectionMode && correctionDragging) {
    correctionMoveDrag(e);
    e.stopImmediatePropagation();
  }
}, true);

imagePanel.addEventListener('mouseup', function(e) {
  if (isCorrectionMode && correctionDragging) {
    correctionEndDrag(e);
    e.stopImmediatePropagation();
  }
}, true);

imagePanel.addEventListener('mouseleave', function(e) {
  if (isCorrectionMode && correctionDragging) {
    correctionEndDrag(e);
    e.stopImmediatePropagation();
  }
}, true);

// Botones de la barra de corrección
correctionConfirmBtn.addEventListener('click', () => {
  exitCorrectionMode(true);
});

correctionCancelBtn.addEventListener('click', () => {
  exitCorrectionMode(false);
});

// ========== MODO CORRECCIÓN INDIVIDUAL (1 CÁMARA) ==========

let isCorrection1Mode = false;
let correction1TargetPin = null;       // Pin seleccionado para corregir
let correction1Dragging = false;
let correction1DragStartX = 0;
let correction1DragStartY = 0;
let correction1OrigX = 0;
let correction1OrigY = 0;
let correction1DeltaX = 0;
let correction1DeltaY = 0;

const correction1Bar = document.getElementById('correction1-bar');
const correction1Status = document.getElementById('correction1-status');
const correction1Offset = document.getElementById('correction1-offset');
const correction1ConfirmBtn = document.getElementById('correction1-confirm');
const correction1CancelBtn = document.getElementById('correction1-cancel');

function enterCorrection1Mode() {
  if (!currentImage) {
    showNotification('Error', 'Debe cargar una imagen antes de corregir posiciones');
    return;
  }
  if (pins.length === 0) {
    showNotification('Error', 'No hay cámaras para corregir');
    return;
  }

  // Desactivar otros modos
  if (isPinMode) togglePinMode();
  if (isCorrectionMode) exitCorrectionMode(false);

  isCorrection1Mode = true;
  correction1TargetPin = null;
  correction1DeltaX = 0;
  correction1DeltaY = 0;

  correction1Bar.classList.add('show');
  correction1Status.textContent = 'Seleccione la cámara que desea reubicar';
  correction1Offset.textContent = '';
  correction1ConfirmBtn.disabled = true;

  imagePanel.classList.add('correction-mode');

  const corregir1Btn = document.getElementById('corregir1-btn');
  if (corregir1Btn) corregir1Btn.classList.add('active');

  statusText.textContent = 'Modo Corrección Individual — seleccione una cámara';
  showNotification('Corrección Individual', 'Haga clic sobre la cámara que desea reubicar.');
}

function exitCorrection1Mode(applyChanges) {
  if (!isCorrection1Mode) return;

  if (applyChanges && correction1TargetPin && (correction1DeltaX !== 0 || correction1DeltaY !== 0)) {
    saveState();

    // Aplicar delta SOLO a la cámara seleccionada
    correction1TargetPin.x = Math.round(correction1OrigX + correction1DeltaX);
    correction1TargetPin.y = Math.round(correction1OrigY + correction1DeltaY);

    // Actualizar la referencia en carpetas
    Object.keys(SYSTEM_FOLDERS).forEach(key => {
      SYSTEM_FOLDERS[key].cameras = SYSTEM_FOLDERS[key].cameras.map(cam => {
        return cam.id === correction1TargetPin.id ? correction1TargetPin : cam;
      });
    });

    statusText.textContent = `${correction1TargetPin.name} reubicada: ΔX=${Math.round(correction1DeltaX)}, ΔY=${Math.round(correction1DeltaY)}`;
    showNotification('Cámara Reubicada', `${correction1TargetPin.name} movida (ΔX: ${Math.round(correction1DeltaX)}, ΔY: ${Math.round(correction1DeltaY)})`);
  } else {
    // Revertir posición original
    if (correction1TargetPin) {
      correction1TargetPin.x = correction1OrigX;
      correction1TargetPin.y = correction1OrigY;
    }
    statusText.textContent = 'Corrección individual cancelada — posición original restaurada';
  }

  // Limpiar estado
  isCorrection1Mode = false;
  correction1TargetPin = null;
  correction1Dragging = false;
  correction1DeltaX = 0;
  correction1DeltaY = 0;

  correction1Bar.classList.remove('show');
  imagePanel.classList.remove('correction-mode');

  document.querySelectorAll('.pin-center.correction1-target').forEach(el => {
    el.classList.remove('correction1-target');
  });

  const corregir1Btn = document.getElementById('corregir1-btn');
  if (corregir1Btn) corregir1Btn.classList.remove('active');

  // Redibujar
  document.querySelectorAll('.pin').forEach(p => p.remove());
  const vg = document.getElementById('vision-group');
  if (vg) vg.innerHTML = '';
  pins.forEach(pin => createPinElement(pin));
  renderConesSync();
  updateTreeView();
  updateUI();
}

function correction1SelectTarget(pinId) {
  correction1TargetPin = pins.find(p => p.id === pinId);
  if (!correction1TargetPin) return;

  correction1OrigX = correction1TargetPin.x;
  correction1OrigY = correction1TargetPin.y;
  correction1DeltaX = 0;
  correction1DeltaY = 0;

  // Highlight visual
  document.querySelectorAll('.pin-center.correction1-target').forEach(el => {
    el.classList.remove('correction1-target');
  });
  const pinEl = document.querySelector(`.pin[data-pin-id="${pinId}"] .pin-center`);
  if (pinEl) pinEl.classList.add('correction1-target');

  correction1Status.textContent = `Cámara: ${correction1TargetPin.name} — arrástrela a su posición correcta`;
  correction1Offset.textContent = '';
  correction1ConfirmBtn.disabled = true;
  statusText.textContent = `Cámara seleccionada: ${correction1TargetPin.name} — arrastre para reubicar`;
}

function correction1StartDrag(e, pinId) {
  if (!isCorrection1Mode) return;

  if (!correction1TargetPin) {
    correction1SelectTarget(pinId);
    return;
  }

  // Si hace clic en otra cámara, cambiar el objetivo
  if (correction1TargetPin.id !== pinId) {
    // Revertir la anterior a su posición original antes de cambiar
    correction1TargetPin.x = correction1OrigX;
    correction1TargetPin.y = correction1OrigY;
    updatePinPositionsSync();
    renderConesSync();
    correction1SelectTarget(pinId);
    return;
  }

  correction1Dragging = true;
  correction1DragStartX = e.clientX;
  correction1DragStartY = e.clientY;

  e.preventDefault();
  e.stopPropagation();
}

function correction1MoveDrag(e) {
  if (!correction1Dragging || !correction1TargetPin) return;

  e.preventDefault();
  e.stopPropagation();

  const screenDX = e.clientX - correction1DragStartX;
  const screenDY = e.clientY - correction1DragStartY;
  const imageDX = screenDX / scale;
  const imageDY = screenDY / scale;

  const newDeltaX = correction1DeltaX + imageDX;
  const newDeltaY = correction1DeltaY + imageDY;

  // Actualizar posición SOLO de esta cámara
  correction1TargetPin.x = correction1OrigX + newDeltaX;
  correction1TargetPin.y = correction1OrigY + newDeltaY;

  updatePinPositionsSync();
  renderConesSync();

  correction1Offset.textContent = `ΔX: ${Math.round(newDeltaX)}  ΔY: ${Math.round(newDeltaY)}`;
}

function correction1EndDrag(e) {
  if (!correction1Dragging || !correction1TargetPin) return;

  correction1Dragging = false;

  const screenDX = e.clientX - correction1DragStartX;
  const screenDY = e.clientY - correction1DragStartY;
  const imageDX = screenDX / scale;
  const imageDY = screenDY / scale;

  correction1DeltaX += imageDX;
  correction1DeltaY += imageDY;

  if (Math.abs(correction1DeltaX) > 0.5 || Math.abs(correction1DeltaY) > 0.5) {
    correction1ConfirmBtn.disabled = false;
    correction1Status.textContent = `Cámara: ${correction1TargetPin.name} — confirme o siga ajustando`;
  }

  correction1Offset.textContent = `ΔX: ${Math.round(correction1DeltaX)}  ΔY: ${Math.round(correction1DeltaY)}`;
  statusText.textContent = `${correction1TargetPin.name}: ΔX=${Math.round(correction1DeltaX)}, ΔY=${Math.round(correction1DeltaY)} — confirme o siga ajustando`;
}

function handleCorrection1MouseDown(e) {
  if (!isCorrection1Mode) return false;

  const pinCenter = e.target.closest('.pin-center');
  if (pinCenter) {
    const pinEl = pinCenter.closest('.pin');
    if (pinEl) {
      const pinId = parseInt(pinEl.dataset.pinId);
      correction1StartDrag(e, pinId);
      return true;
    }
  }
  return false;
}

// Integrar con capture handlers (compartidos con modo masivo)
imagePanel.addEventListener('mousedown', function(e) {
  if (isCorrection1Mode && handleCorrection1MouseDown(e)) {
    e.stopImmediatePropagation();
  }
}, true);

imagePanel.addEventListener('mousemove', function(e) {
  if (isCorrection1Mode && correction1Dragging) {
    correction1MoveDrag(e);
    e.stopImmediatePropagation();
  }
}, true);

imagePanel.addEventListener('mouseup', function(e) {
  if (isCorrection1Mode && correction1Dragging) {
    correction1EndDrag(e);
    e.stopImmediatePropagation();
  }
}, true);

imagePanel.addEventListener('mouseleave', function(e) {
  if (isCorrection1Mode && correction1Dragging) {
    correction1EndDrag(e);
    e.stopImmediatePropagation();
  }
}, true);

correction1ConfirmBtn.addEventListener('click', () => {
  exitCorrection1Mode(true);
});

correction1CancelBtn.addEventListener('click', () => {
  exitCorrection1Mode(false);
});

// ========== FIN MODO CORRECCIÓN INDIVIDUAL ==========

// ========== FIN MODOS DE CORRECCIÓN ==========

window.removePin = removePin;
window.editPin = editPin;
window.expandAllFolders = expandAllFolders;
window.collapseAllFolders = collapseAllFolders;
window.assignCamerasToFolders = assignCamerasToFolders;
window.addServer = addServer;
window.undoAction = undoAction;
window.redoAction = redoAction;
window.enterCorrectionMode = enterCorrectionMode;
window.exitCorrectionMode = exitCorrectionMode;
window.enterCorrection1Mode = enterCorrection1Mode;
window.exitCorrection1Mode = exitCorrection1Mode;

