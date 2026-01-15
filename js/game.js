/* ===============================
   ORNAMENT CATCH GAME
================================ */

const treeArea = document.getElementById("treeArea");

const startBtn = document.querySelector(".btn.start");
const endBtn = document.querySelector(".btn.end");
const leftBtn = document.querySelector(".arrow.left");
const rightBtn = document.querySelector(".arrow.right");
const stopBtn = document.querySelector(".arrow.stop");

/* -------------------------------
   오너먼트 리소스
-------------------------------- */
const ORN_PATH = "../assets/ornaments/";
const ORN_COUNT = 19;

const ORNAMENTS = Array.from({ length: ORN_COUNT }, (_, i) =>
  `${ORN_PATH}orn${i + 1}.png`
);

/* -------------------------------
   게임 상태
-------------------------------- */
let gameRunning = false;
let currentOrnament = null;
let fallInterval = null;

let currentX = 0;
let currentY = 0;

/* -------------------------------
   유틸
-------------------------------- */
function randomOrnament() {
  return ORNAMENTS[Math.floor(Math.random() * ORNAMENTS.length)];
}

/* -------------------------------
   오너먼트 생성
-------------------------------- */
function spawnOrnament() {
  if (!gameRunning) return;

  const img = document.createElement("img");
  img.src = randomOrnament();
  img.classList.add("ornament", "falling");

  const rect = treeArea.getBoundingClientRect();

  currentX = rect.width / 2 - 24; // 오너먼트 절반
  currentY = 0;

  img.style.left = currentX + "px";
  img.style.top = currentY + "px";

  treeArea.appendChild(img);
  currentOrnament = img;

  startFalling();
}

/* -------------------------------
   낙하 로직 (y 자동 증가)
-------------------------------- */
function startFalling() {
  clearInterval(fallInterval);

  fallInterval = setInterval(() => {
    if (!currentOrnament) return;

    currentY += 1; // 낙하 속도

    currentOrnament.style.top = currentY + "px";

    const rect = treeArea.getBoundingClientRect();

    if (currentY > rect.height) {
      clearInterval(fallInterval);
      currentOrnament.remove();
      currentOrnament = null;

      // 다음 오너먼트 자동 생성
      spawnOrnament();
    }
  }, 16); // 약 60fps
}

/* -------------------------------
   컨트롤 버튼
-------------------------------- */

// START
startBtn.addEventListener("click", () => {
  if (gameRunning) return;

  gameRunning = true;
  spawnOrnament();
});

// END
endBtn.addEventListener("click", () => {
  gameRunning = false;
  clearInterval(fallInterval);

  if (currentOrnament) {
    currentOrnament.remove();
    currentOrnament = null;
  }
});

// STOP (현재 멈추고 다음)
stopBtn.addEventListener("click", () => {
  if (!currentOrnament) return;

  // 떨어짐 중단
  clearInterval(fallInterval);

  // 고정 상태로 전환
  currentOrnament.classList.remove("falling");
  currentOrnament.classList.add("placed");


  // 현재 오너먼트 해제
  currentOrnament = null;

  // 다음 오너먼트 생성
  spawnOrnament();
});

// LEFT
leftBtn.addEventListener("click", () => {
  if (!currentOrnament) return;

  currentX -= 20;
  currentX = Math.max(0, currentX);

  currentOrnament.style.left = currentX + "px";
});

// RIGHT
rightBtn.addEventListener("click", () => {
  if (!currentOrnament) return;

  const rect = treeArea.getBoundingClientRect();

  currentX += 20;
  currentX = Math.min(rect.width, currentX);

  currentOrnament.style.left = currentX + "px";
});

/* -------------------------------
   키보드 컨트롤
-------------------------------- */

window.addEventListener("keydown", (e) => {
  if (!currentOrnament) return;

  const rect = treeArea.getBoundingClientRect();
  const STEP = 20;

  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      currentX -= STEP;
      currentX = Math.max(0, currentX);
      currentOrnament.style.left = currentX + "px";
      break;

    case "ArrowRight":
      e.preventDefault();
      currentX += STEP;
      const size = currentOrnament.offsetWidth;
      currentX = Math.min(rect.width - size, currentX);
      currentOrnament.style.left = currentX + "px";
      break;

    case " ":
    case "Enter":
      e.preventDefault();
      stopBtn.click();
      break;
  }
});