const socket = io();
const character = document.getElementById('character');
const gameArea = document.getElementById('game-area');

// -----------------------------
// 📌 내부 좌표 상태 (잔상 방지)
// -----------------------------
let characterX = 100;
let characterY = 100;

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

const speed = 10;
const pressedKeys = new Set();
let moveAnimationFrame = null;

// -----------------------------
// 📌 방향키 이동 처리
// -----------------------------
document.addEventListener('keydown', (e) => {
  const validKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Left', 'Right', 'Up', 'Down'];
  if (validKeys.includes(e.key)) {
    const normalizedKey = normalizeKey(e.key);
    pressedKeys.add(normalizedKey);
    updateCharacterDirection();
    startMoving();
  }
});

document.addEventListener('keyup', (e) => {
  const normalizedKey = normalizeKey(e.key);
  pressedKeys.delete(normalizedKey);
  if (pressedKeys.size === 0) stopMoving();
});

// 방향키 이름 표준화
function normalizeKey(key) {
  const map = {
    'Up': 'ArrowUp',
    'Down': 'ArrowDown',
    'Left': 'ArrowLeft',
    'Right': 'ArrowRight'
  };
  return map[key] || key;
}

// 방향 반전 (좌우 정확히 반대로 수정됨)
function updateCharacterDirection() {
  if (pressedKeys.has('ArrowLeft') && !pressedKeys.has('ArrowRight')) {
    character.style.transform = 'scaleX(1)'; // ← 왼쪽
  } else if (pressedKeys.has('ArrowRight') && !pressedKeys.has('ArrowLeft')) {
    character.style.transform = 'scaleX(-1)'; // → 오른쪽
  }
}

function startMoving() {
  if (moveAnimationFrame !== null) return;
  moveLoop();
}

function moveLoop() {
  let dx = 0;
  let dy = 0;

  if (pressedKeys.has('ArrowLeft')) dx -= 10;
  if (pressedKeys.has('ArrowRight')) dx += 10;
  if (pressedKeys.has('ArrowUp')) dy -= 10;
  if (pressedKeys.has('ArrowDown')) dy += 10;

  if (dx !== 0 || dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx = (dx / length) * speed;
    dy = (dy / length) * speed;

    characterX += dx;
    characterY += dy;

    // 경계 제한
    characterX = Math.max(0, Math.min(characterX, gameArea.clientWidth - character.clientWidth));
    characterY = Math.max(0, Math.min(characterY, gameArea.clientHeight - character.clientHeight));

    character.style.left = `${characterX}px`;
    character.style.top = `${characterY}px`;

    socket.emit('drag', { x: characterX, y: characterY });
  }

  moveAnimationFrame = requestAnimationFrame(moveLoop);
}

function stopMoving() {
  if (moveAnimationFrame !== null) {
    cancelAnimationFrame(moveAnimationFrame);
    moveAnimationFrame = null;
  }
}

// -----------------------------
// 📱 버튼 (모바일 & PC 클릭 지원)
// -----------------------------
const buttons = document.querySelectorAll('#buttons button');

buttons.forEach(button => {
  const dir = button.textContent;

  const keyMap = {
    '↑': 'ArrowUp',
    '↓': 'ArrowDown',
    '←': 'ArrowLeft',
    '→': 'ArrowRight'
  };

  const key = keyMap[dir];

  const press = () => {
    pressedKeys.add(key);
    updateCharacterDirection();
    startMoving();
  };

  const release = () => {
    pressedKeys.delete(key);
    if (pressedKeys.size === 0) stopMoving();
  };

  button.addEventListener('mousedown', press);
  button.addEventListener('mouseup', release);
  button.addEventListener('mouseleave', release);

  button.addEventListener('touchstart', (e) => {
    e.preventDefault();
    press();
  }, { passive: false });

  button.addEventListener('touchend', release);
});

// -----------------------------
// 🧲 마우스 드래그
// -----------------------------
function getRelativePosition(clientX, clientY) {
  const areaRect = gameArea.getBoundingClientRect();
  let x = clientX - areaRect.left - offsetX;
  let y = clientY - areaRect.top - offsetY;

  x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
  y = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

  return { x, y };
}

character.addEventListener('mousedown', (e) => {
  isDragging = true;
  const rect = character.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const { x, y } = getRelativePosition(e.clientX, e.clientY);
    characterX = x;
    characterY = y;
    character.style.left = `${x}px`;
    character.style.top = `${y}px`;
    socket.emit('drag', { x, y });
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// -----------------------------
// 📲 터치 드래그
// -----------------------------
character.addEventListener('touchstart', (e) => {
  isDragging = true;
  const touch = e.touches[0];
  const rect = character.getBoundingClientRect();
  offsetX = touch.clientX - rect.left;
  offsetY = touch.clientY - rect.top;
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (isDragging) {
    const touch = e.touches[0];
    const { x, y } = getRelativePosition(touch.clientX, touch.clientY);
    characterX = x;
    characterY = y;
    character.style.left = `${x}px`;
    character.style.top = `${y}px`;
    socket.emit('drag', { x, y });
  }
}, { passive: false });

document.addEventListener('touchend', () => {
  isDragging = false;
});

// -----------------------------
// 🔄 서버 위치 동기화
// -----------------------------
socket.on('position', (pos) => {
  characterX = pos.x;
  characterY = pos.y;
  character.style.left = `${characterX}px`;
  character.style.top = `${characterY}px`;
});
