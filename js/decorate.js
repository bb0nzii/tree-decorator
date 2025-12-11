/* decorate.js
 - features:
   - generate ornament grid
   - drag from grid -> drop on tree
   - move placed ornaments (drag), select, double-click delete
   - quick toolbar (rotate +/- , scale +/- , delete)
   - save state to localStorage / load state
   - export tree-area to PNG via html2canvas
*/

(function () {
  const ORN_COUNT = 17; // 총 사용할 오너먼트 개수
  const ORN_PATH = '../assets/ornaments/'; // 경로 기준: decorate/index.html 기준 ../assets/ornaments/
  const ORN_PREFIX = 'orn'; // 파일명 패턴: orn1.png ... orn12.png
  const ORN_EXT = '.png';

  const ornamentGrid = document.getElementById('ornamentGrid');
  const treeArea = document.getElementById('treeArea');
  const saveImageBtn = document.getElementById('saveImageBtn');
  const saveStateBtn = document.getElementById('saveStateBtn');
  const loadStateBtn = document.getElementById('loadStateBtn');

  let placedItems = []; // {id, src, x, y, scale, rot}
  let dragSrc = null;   // during drag from palette
  let currentSelectedId = null;
  let toolbarEl = null;

  // util: generate unique id
  const uid = () => 'id' + Math.random().toString(36).slice(2, 9);

  /* ---------- generate ornament palette ---------- */
  function buildPalette() {
    ornamentGrid.innerHTML = '';
    for (let i = 1; i <= ORN_COUNT; i++) {
      const src = `${ORN_PATH}${ORN_PREFIX}${i}${ORN_EXT}`;
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.draggable = true;
      slot.dataset.src = src;

      const img = document.createElement('img');
      img.src = src;
      img.alt = `orn${i}`;
      slot.appendChild(img);

      slot.addEventListener('dragstart', (e) => {
        dragSrc = src;
        try { e.dataTransfer.setData('text/plain', src); } catch (err) {}
      });

      ornamentGrid.appendChild(slot);
    }
  }

  /* ---------- drop to tree ---------- */
  treeArea.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  treeArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain') || dragSrc;
    if (!data) return;

    const rect = treeArea.getBoundingClientRect();
    // compute local coordinates
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addPlacedItem({ src: data, x: x - 24, y: y - 24, scale: 1, rot: 0 });
  });

  /* ---------- create & render placed item ---------- */
  function addPlacedItem(item) {
    const newItem = Object.assign({}, item, { id: uid() });
    placedItems.push(newItem);
    renderPlacedItem(newItem);
    saveStateLocal(); // auto save
  }

  function renderPlacedItem(item) {
    const el = document.createElement('img');
    el.src = item.src;
    el.className = 'placed';
    el.dataset.id = item.id;
    applyTransform(el, item);
    el.style.left = item.x + 'px';
    el.style.top = item.y + 'px';

    // events: select, dblclick remove, drag-to-move
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      selectPlaced(item.id);
    });

    el.addEventListener('dblclick', (ev) => {
      ev.stopPropagation();
      removePlaced(item.id);
    });

    // pointer drag move (works for mouse and touch)
    makeDraggable(el, item);

    treeArea.appendChild(el);
  }

  function applyTransform(el, item) {
    el.style.transform = `translate(-50%,-50%) rotate(${item.rot}deg) scale(${item.scale})`;
    // transform-origin already center in CSS
    el.style.width = (48 * item.scale) + 'px';
    el.style.height = (48 * item.scale) + 'px';
  }

  /* ---------- selection toolbar ---------- */
  function selectPlaced(id) {
    // deselect previous
    if (currentSelectedId === id) return;
    deselectAll();

    currentSelectedId = id;
    const selEl = treeArea.querySelector(`.placed[data-id="${id}"]`);
    if (!selEl) return;
    selEl.classList.add('selected');

    // show toolbar near item
    showToolbar(selEl, id);
  }

  function deselectAll() {
    currentSelectedId = null;
    const prev = treeArea.querySelector('.placed.selected');
    if (prev) prev.classList.remove('selected');
    hideToolbar();
  }

  function showToolbar(el, id) {
    hideToolbar();
    toolbarEl = document.createElement('div');
    toolbarEl.className = 'orn-toolbar';
    toolbarEl.innerHTML = `
      <button data-action="rot-dec">⟲</button>
      <button data-action="rot-inc">⟳</button>
      <button data-action="scale-dec">-</button>
      <button data-action="scale-inc">+</button>
      <button data-action="del">🗑</button>
    `;
    document.body.appendChild(toolbarEl);

    positionToolbar(el, toolbarEl);

    toolbarEl.addEventListener('click', (e) => {
      const act = e.target.closest('button')?.dataset.action;
      if (!act) return;
      handleToolbarAction(act, id);
    });

    // reposition on window resize / scroll
    window.addEventListener('resize', toolbarPosHandler);
    window.addEventListener('scroll', toolbarPosHandler, true);
  }

  function positionToolbar(targetEl, toolbar) {
    const tRect = targetEl.getBoundingClientRect();
    // place toolbar centered above target
    toolbar.style.left = (tRect.left + tRect.width / 2) + 'px';
    toolbar.style.top = (tRect.top) + 'px';
  }
  function toolbarPosHandler() {
    const selEl = treeArea.querySelector(`.placed[data-id="${currentSelectedId}"]`);
    if (selEl && toolbarEl) positionToolbar(selEl, toolbarEl);
  }

  function hideToolbar() {
    if (toolbarEl) {
      toolbarEl.remove();
      toolbarEl = null;
      window.removeEventListener('resize', toolbarPosHandler);
      window.removeEventListener('scroll', toolbarPosHandler, true);
    }
  }

  function handleToolbarAction(action, id) {
    const idx = placedItems.findIndex(i => i.id === id);
    if (idx === -1) return;
    const item = placedItems[idx];

    if (action === 'rot-inc') item.rot += 15;
    if (action === 'rot-dec') item.rot -= 15;
    if (action === 'scale-inc') item.scale = Math.min(2.4, item.scale + 0.1);
    if (action === 'scale-dec') item.scale = Math.max(0.4, item.scale - 0.1);
    if (action === 'del') {
      removePlaced(id);
      return;
    }

    // update DOM
    const el = treeArea.querySelector(`.placed[data-id="${id}"]`);
    if (el) applyTransform(el, item);
    saveStateLocal();
    toolbarPosHandler();
  }

  /* ---------- remove placed ---------- */
  function removePlaced(id) {
    placedItems = placedItems.filter(i => i.id !== id);
    const el = treeArea.querySelector(`.placed[data-id="${id}"]`);
    if (el) el.remove();
    deselectAll();
    saveStateLocal();
  }

  /* ---------- make element draggable inside tree-area ---------- */
  function makeDraggable(el, item) {
    let isDown = false;
    let startX = 0, startY = 0;
    let origX = 0, origY = 0;

    const onPointerDown = (e) => {
      e.preventDefault();
      selectPlaced(item.id);
      isDown = true;
      el.setPointerCapture?.(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      origX = item.x;
      origY = item.y;
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const rect = treeArea.getBoundingClientRect();
      item.x = Math.max(0, Math.min(rect.width, origX + dx));
      item.y = Math.max(0, Math.min(rect.height, origY + dy));
      el.style.left = item.x + 'px';
      el.style.top = item.y + 'px';
      saveStateLocal(); // lightweight enough for small projects
      toolbarPosHandler();
    };

    const onPointerUp = (e) => {
      if (!isDown) return;
      isDown = false;
      try { el.releasePointerCapture(e.pointerId); } catch (e) {}
      el.style.cursor = 'grab';
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  /* ---------- persistence: localStorage ---------- */
  const STORAGE_KEY = 'xmas_decorate_v1';

  function saveStateLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(placedItems));
    } catch (err) {
      console.warn('save failed', err);
    }
  }

  function loadStateLocal() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const list = JSON.parse(raw);
      placedItems = list || [];
      // clear existing DOM placed items
      treeArea.querySelectorAll('.placed').forEach(x => x.remove());
      placedItems.forEach(renderPlacedItem);
    } catch (err) {
      console.warn('load fail', err);
    }
  }

  /* ---------- export image (html2canvas) ---------- */
  function exportTreeImage() {
    // temporarily remove selection visuals and toolbar
    const wasSelected = currentSelectedId;
    deselectAll();

    html2canvas(treeArea, { backgroundColor: null, scale: 2 }).then(canvas => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'my_tree.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // restore selection
      if (wasSelected) selectPlaced(wasSelected);
    }).catch(err => {
      alert('이미지 생성에 실패했습니다.');
      console.error(err);
    });
  }

  /* ---------- helpers: restore from saved items on load ---------- */
  function initFromSavedIfAny() {
    loadStateLocal();
  }

  /* ---------- click outside -> deselect ---------- */
  window.addEventListener('click', (e) => {
    // only if click outside tree placed elements
    if (!e.target.classList?.contains('placed')) {
      deselectAll();
    }
  });

  /* ---------- public bind buttons ---------- */
  saveImageBtn.addEventListener('click', exportTreeImage);
  saveStateBtn.addEventListener('click', () => {
    saveStateLocal();
    alert('현재 트리 상태를 저장했습니다.');
  });
  loadStateBtn.addEventListener('click', () => {
    loadStateLocal();
    alert('저장된 트리 상태를 불러왔습니다.');
  });

  /* ---------- initialization ---------- */
  buildPalette();
  initFromSavedIfAny();

})();