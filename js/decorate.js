/* decorate.js (simplified)
 - features:
   - generate ornament grid
   - drag from grid → drop on tree
   - move placed ornaments (drag)
   - select placed ornament
   - double-click delete
*/

(function () {
  const ORN_COUNT = 17;
  const ORN_PATH = '../assets/ornaments/';
  const ORN_PREFIX = 'orn';
  const ORN_EXT = '.png';

  const ornamentGrid = document.getElementById('ornamentGrid');
  const treeArea = document.getElementById('treeArea');

  let placedItems = []; // {id, src, x, y}
  let dragSrc = null;
  let currentSelectedId = null;

  // unique id
  const uid = () => 'id' + Math.random().toString(36).slice(2, 9);

  /* -----------------------------
      1. 오너먼트 그리드 생성
  ----------------------------- */

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

        /*** --------------------------
             데스크톱 dragstart
        --------------------------- ***/
        slot.addEventListener('dragstart', (e) => {
        dragSrc = src;
        e.dataTransfer.setData('text/plain', src);
        });

        /*** --------------------------
             모바일 pointer drag 지원
        --------------------------- ***/
        slot.addEventListener("pointerdown", (e) => {
        // 모바일 드래그 시작
        dragSrc = src;

        // 드래그 중 표시되는 ghost 이미지
        const ghost = document.createElement("img");
        ghost.src = src;
        ghost.className = "drag-ghost";
        document.body.appendChild(ghost);

        const moveGhost = (ev) => {
            ghost.style.left = ev.clientX + "px";
            ghost.style.top = ev.clientY + "px";
        };

        const endDrag = (ev) => {
            ghost.remove();
            document.removeEventListener("pointermove", moveGhost);
            document.removeEventListener("pointerup", endDrag);

            const rect = treeArea.getBoundingClientRect();
            const inTree = ev.clientX >= rect.left &&
                        ev.clientX <= rect.right &&
                        ev.clientY >= rect.top &&
                        ev.clientY <= rect.bottom;

            if (inTree) {
            const x = ev.clientX - rect.left;
            const y = ev.clientY - rect.top;
            addPlacedItem({ src, x, y });
            }

            dragSrc = null;
        };

        moveGhost(e); 
        document.addEventListener("pointermove", moveGhost);
        document.addEventListener("pointerup", endDrag);
        });

        ornamentGrid.appendChild(slot);
    }
    }


  /* -----------------------------
      2. 트리에 드롭
  ----------------------------- */
  treeArea.addEventListener('dragover', (e) => e.preventDefault());

  treeArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const src = e.dataTransfer.getData('text/plain') || dragSrc;
    if (!src) return;

    const rect = treeArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addPlacedItem({ src, x, y });
  });

  /* -----------------------------
      3. 배치된 오너먼트 DOM 추가
  ----------------------------- */
  function addPlacedItem(item) {
    const newItem = { ...item, id: uid() };
    placedItems.push(newItem);
    renderPlacedItem(newItem);
  }

  function renderPlacedItem(item) {
    const el = document.createElement('img');
    el.src = item.src;
    el.className = 'placed';
    el.dataset.id = item.id;

    el.style.left = item.x + 'px';
    el.style.top = item.y + 'px';
    el.style.transform = 'translate(-50%, -50%)';

    // 선택
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      selectPlaced(item.id);
    });

    // 더블클릭 삭제
    el.addEventListener('dblclick', (ev) => {
      ev.stopPropagation();
      removePlaced(item.id);
    });

    // 드래그 이동
    makeDraggable(el, item);

    treeArea.appendChild(el);
  }

  /* -----------------------------
      4. 선택 처리
  ----------------------------- */
  function selectPlaced(id) {
    if (currentSelectedId === id) return;

    deselectAll();
    currentSelectedId = id;

    const el = treeArea.querySelector(`.placed[data-id="${id}"]`);
    if (el) el.classList.add('selected');
  }

  function deselectAll() {
    currentSelectedId = null;
    const prev = treeArea.querySelector('.placed.selected');
    if (prev) prev.classList.remove('selected');
  }

  // 트리 빈 공간 클릭 → 선택 해제
  window.addEventListener('click', (e) => {
    if (!e.target.classList.contains('placed')) {
      deselectAll();
    }
  });

  /* -----------------------------
      5. 배치된 아이템 삭제
  ----------------------------- */
  function removePlaced(id) {
    placedItems = placedItems.filter((i) => i.id !== id);
    const el = treeArea.querySelector(`.placed[data-id="${id}"]`);
    if (el) el.remove();
    deselectAll();
  }

  /* -----------------------------
      6. 드래그 이동
  ----------------------------- */
  function makeDraggable(el, item) {
    let isDown = false;
    let startX = 0,
      startY = 0;
    let origX = 0,
      origY = 0;

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      selectPlaced(item.id);

      isDown = true;
      el.setPointerCapture?.(e.pointerId);

      startX = e.clientX;
      startY = e.clientY;

      origX = item.x;
      origY = item.y;
      el.style.cursor = 'grabbing';
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDown) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const rect = treeArea.getBoundingClientRect();
      item.x = Math.max(0, Math.min(rect.width, origX + dx));
      item.y = Math.max(0, Math.min(rect.height, origY + dy));

      el.style.left = item.x + 'px';
      el.style.top = item.y + 'px';
    });

    window.addEventListener('pointerup', (e) => {
      if (!isDown) return;
      isDown = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
      el.style.cursor = 'grab';
    });
  }

  /* -----------------------------
      초기 실행
  ----------------------------- */
  buildPalette();

  /* -----------------------------
   7. 이미지 저장 (html2canvas)
----------------------------- */
const saveBtn = document.getElementById('saveImageBtn');
const captureWrapper = document.getElementById('captureWrapper');

saveBtn.addEventListener('click', () => {
  if (!captureWrapper) {
    alert("캡처 대상 요소(captureWrapper)를 찾을 수 없습니다.");
    return;
  }

  html2canvas(captureWrapper, {
    useCORS: true,
    backgroundColor: "#ffffff",
    scale: 3, 
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'my-tree.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error("캡처 오류:", err);
    alert("이미지를 저장하는 중 문제가 발생했습니다.");
  });
});

})();
