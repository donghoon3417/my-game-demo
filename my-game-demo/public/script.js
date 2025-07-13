const socket = io();
const character = document.getElementById('character');
const gameArea = document.getElementById('game-area');

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

// -----------------------------
// 🧭 방향키 지속 이동 + 대각선
// -----------------------------
const pressedKeys = new Set();
let moveInterval = null;
const speed = 5;

document.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    pressedKeys.add(e.key);
    updateCharacterDirection();
    startMoving();
  }
});

document.addEventListener('keyup', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    pressedKeys.delete(e.key);
    if (pressedKeys.size === 0) stopMoving();
  }
});

// 방향 전환: 좌/우 키만 고려
function updateCharacterDirection() {
  if (pressedKeys.has('ArrowLeft') && !pressedKeys.has('ArrowRight')) {
    character.style.transform = 'scaleX(-1)';
  } else if (pressedKeys.has('ArrowRight') && !pressedKeys.has('ArrowLeft')) {
    character.style.transform = 'scaleX(1)';
  }
}

// 이동 루프 시작
function startMoving() {
  if (moveInterval) return;
  moveInterval = setInterval(() => {
    let x = parseInt(character.style.left) || 0;
    let y = parseInt(character.style.top) || 0;

    if (pressedKeys.has('ArrowLeft'))  x -= speed;
    if (pressedKeys.has('ArrowRight')) x += speed;
    if (pressedKeys.has('ArrowUp'))    y -= speed;
    if (pressedKeys.has('ArrowDown'))  y += speed;

    // 게임 영역 제한
    x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
    y = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

    character.style.left = `${x}px`;
    character.style.top = `${y}px`;

    // 서버로 위치 전송
    socket.emit('drag', { x, y });
  }, 16); // 약 60fps
}

function stopMoving() {
  clearInterval(moveInterval);
  moveInterval = null;
}

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
    character.style.left = `${x}px`;
    character.style.top = `${y}px`;
    socket.emit('drag', { x, y });
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// -----------------------------
// 📱 터치 드래그
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
  character.style.left = `${pos.x}px`;
  character.style.top = `${pos.y}px`;
});
