// Última modificación: 2026-06-04 13:49 (por Codex)
// Versión: 1.0.0

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'script.js');
const source = fs.readFileSync(scriptPath, 'utf8');

class FakeClassList {
  constructor() { this.classes = new Set(); }
  add(...names) { names.forEach(name => this.classes.add(name)); }
  remove(...names) { names.forEach(name => this.classes.delete(name)); }
  contains(name) { return this.classes.has(name); }
  toggle(name, force) {
    if (force === undefined ? !this.classes.has(name) : force) this.classes.add(name);
    else this.classes.delete(name);
  }
}

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.eventListeners = {};
    this.classList = new FakeClassList();
    this.textContent = '';
    this.innerHTML = '';
    this.disabled = false;
    this.value = '';
    this.title = '';
  }
  appendChild(child) { this.children.push(child); return child; }
  contains(child) { return this.children.includes(child); }
  setAttribute(name, value) { this[name] = String(value); }
  getAttribute(name) { return this[name]; }
  remove() { this.removed = true; }
  addEventListener(type, fn) { (this.eventListeners[type] ||= []).push(fn); }
  getBoundingClientRect() { return this.rect || { left: 10, top: 20, width: 800, height: 600 }; }
  closest() { return null; }
  querySelector(selector) {
    if (selector && selector.startsWith('#')) {
      const id = selector.slice(1);
      return this.children.find(child => child.id === id) || null;
    }
    return null;
  }
  focus() {}
  select() {}
}

function loadApp() {
  const elements = new Map();
  const getElement = id => {
    if (!elements.has(id)) elements.set(id, new FakeElement(id));
    return elements.get(id);
  };
  const document = {
    getElementById: getElement,
    createElement: tag => new FakeElement(tag),
    createElementNS: (namespace, tag) => new FakeElement(tag),
    addEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  const context = {
    console,
    document,
    window: {},
    Image: class {},
    FileReader: class {},
    URL: { createObjectURL: () => 'blob:test' },
    Blob: class {},
    confirm: () => true,
    alert: () => {},
    setTimeout,
    clearTimeout,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: scriptPath });
  context.__elements = elements;
  return context;
}

function sameRealm(value) {
  return JSON.parse(JSON.stringify(value));
}

function positions(ctx) {
  return sameRealm(ctx.__correctionTestApi.getState().pins.map(pin => ({ id: pin.id, x: pin.x, y: pin.y })));
}

test('calcula deltaX, deltaY y distancia lineal', () => {
  const ctx = loadApp();
  const result = sameRealm(ctx.__correctionTestApi.calculateLinearDisplacement({ x: 10, y: 20 }, { x: 13, y: 24 }));
  assert.deepEqual(result, { deltaX: 3, deltaY: 4, distance: 5 });
});

test('convierte clics de pantalla a coordenadas de imagen con zoom y paneo', () => {
  const ctx = loadApp();
  ctx.__correctionTestApi.setState({ scale: 2, imagePositionX: 30, imagePositionY: -15 });
  const point = sameRealm(ctx.__correctionTestApi.screenToImageCoordinates({ clientX: 110, clientY: 65 }));
  assert.deepEqual(point, { x: 35, y: 30 });
});

test('confirmación masiva aplica el vector a todas las cámaras y guarda Deshacer antes', () => {
  const ctx = loadApp();
  ctx.__correctionTestApi.setState({
    currentImage: { naturalWidth: 1000, naturalHeight: 1000 },
    pins: [{ id: 1, name: 'A', x: 10, y: 20 }, { id: 2, name: 'B', x: 30, y: 40 }],
  });
  ctx.enterCorrectionMode();
  assert.equal(ctx.__elements.get('correction-status').textContent, 'Seleccione una cámara de referencia');
  ctx.__correctionTestApi.selectCorrectionReference('all', 1);
  assert.equal(ctx.__elements.get('correction-status').textContent, 'Referencia seleccionada: A. Haga clic en el punto corregido');
  ctx.__correctionTestApi.setCorrectionTarget('all', { x: 15, y: 26 });
  assert.equal(ctx.__correctionTestApi.getState().correctionPhase, 'awaiting-confirmation');
  assert.deepEqual(positions(ctx), [{ id: 1, x: 10, y: 20 }, { id: 2, x: 30, y: 40 }]);
  assert.match(ctx.__elements.get('correction-offset').textContent, /Distancia lineal: 7\.81/);
  ctx.__correctionTestApi.confirmCorrection('all');
  assert.deepEqual(positions(ctx), [{ id: 1, x: 15, y: 26 }, { id: 2, x: 35, y: 46 }]);
  assert.equal(ctx.__correctionTestApi.getState().undoStackLength, 1);
  ctx.undoAction();
  assert.deepEqual(positions(ctx), [{ id: 1, x: 10, y: 20 }, { id: 2, x: 30, y: 40 }]);
});

test('cancelación masiva no modifica ninguna cámara', () => {
  const ctx = loadApp();
  ctx.__correctionTestApi.setState({ currentImage: {}, pins: [{ id: 1, name: 'A', x: 10, y: 20 }, { id: 2, name: 'B', x: 30, y: 40 }] });
  ctx.enterCorrectionMode();
  ctx.__correctionTestApi.selectCorrectionReference('all', 1);
  ctx.__correctionTestApi.setCorrectionTarget('all', { x: 99, y: 100 });
  ctx.__correctionTestApi.cancelCorrection('all');
  assert.deepEqual(positions(ctx), [{ id: 1, x: 10, y: 20 }, { id: 2, x: 30, y: 40 }]);
  assert.equal(ctx.__correctionTestApi.getState().undoStackLength, 0);
});

test('confirmación individual aplica el vector solo a una cámara', () => {
  const ctx = loadApp();
  ctx.__correctionTestApi.setState({ currentImage: {}, pins: [{ id: 1, name: 'A', x: 10, y: 20 }, { id: 2, name: 'B', x: 30, y: 40 }] });
  ctx.enterCorrection1Mode();
  ctx.__correctionTestApi.selectCorrectionReference('one', 2);
  ctx.__correctionTestApi.setCorrectionTarget('one', { x: 35, y: 45 });
  ctx.__correctionTestApi.confirmCorrection('one');
  assert.deepEqual(positions(ctx), [{ id: 1, x: 10, y: 20 }, { id: 2, x: 35, y: 45 }]);
});

test('cancelación individual no modifica posiciones', () => {
  const ctx = loadApp();
  ctx.__correctionTestApi.setState({ currentImage: {}, pins: [{ id: 1, name: 'A', x: 10, y: 20 }] });
  ctx.enterCorrection1Mode();
  ctx.__correctionTestApi.selectCorrectionReference('one', 1);
  ctx.__correctionTestApi.setCorrectionTarget('one', { x: 99, y: 100 });
  ctx.__correctionTestApi.cancelCorrection('one');
  assert.deepEqual(positions(ctx), [{ id: 1, x: 10, y: 20 }]);
});

test('el modo corrección usa fases explícitas y no estados/listeners funcionales de arrastre', () => {
  assert.doesNotMatch(source, /correctionDragging|correctionDragStartX|correctionDragStartY|correction1Dragging|correction1DragStartX|correction1DragStartY/);
  assert.match(source, /selecting-reference/);
  assert.match(source, /selecting-target/);
  assert.match(source, /awaiting-confirmation/);
  assert.doesNotMatch(source, /correctionMoveDrag|correctionEndDrag|correction1MoveDrag|correction1EndDrag/);
});
