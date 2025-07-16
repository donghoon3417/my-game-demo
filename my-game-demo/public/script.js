const socket = io();
const character = document.getElementById('character');
const gameArea = document.getElementById('game-area');

let characterX = 100;
let characterY = 100;
let currentDirection = 'left';

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

const isMobile = window.innerWidth <= 600;
const speed = isMobile ? 5 : 10;

const pressedKeys = new Set();
let moveAnimationFrame = null;

function updateCharacterFromServer(x, y) {
  characterX = x;
  characterY = y;
  character.style.left = `${x}px`;
  character.style.top = `${y}px`;

  if (currentDirection === 'left') {
    character.style.transform = 'scaleX(1)';
  } else if (currentDirection === 'right') {
    character.style.transform = 'scaleX(-1)';
  }
}

function updateCharacterPosition(x, y) {
  characterX = x;
  characterY = y;
  character.style.left = `${x}px`;
  character.style.top = `${y}px`;

  if (currentDirection === 'left') {
    character.style.transform = 'scaleX(1)';
  } else if (currentDirection === 'right') {
    character.style.transform = 'scaleX(-1)';
  }

  // 캐릭터 중심 좌표 → 비율 좌표로 전송
  const ratioX = (x + character.clientWidth / 2) / gameArea.clientWidth;
  const ratioY = (y + character.clientHeight / 2) / gameArea.clientHeight;

  socket.emit('drag', { x: ratioX, y: ratioY, direction: currentDirection });
}

function normalizeKey(key) {
  const map = {
    'Up': 'ArrowUp',
    'Down': 'ArrowDown',
    'Left': 'ArrowLeft',
    'Right': 'ArrowRight'
  };
  return map[key] || key;
}

document.addEventListener('DOMContentLoaded', () => {
  const rect = character.getBoundingClientRect();
  const parentRect = gameArea.getBoundingClientRect();
  characterX = rect.left - parentRect.left;
  characterY = rect.top - parentRect.top;

  updateCharacterFromServer(characterX, characterY);
});

document.addEventListener('keydown', (e) => {
  const validKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Left', 'Right', 'Up', 'Down'];
  if (validKeys.includes(e.key)) {
    const key = normalizeKey(e.key);
    pressedKeys.add(key);

    if (key === 'ArrowLeft') currentDirection = 'left';
    if (key === 'ArrowRight') currentDirection = 'right';

    startMoving();
  }
});

document.addEventListener('keyup', (e) => {
  const key = normalizeKey(e.key);
  pressedKeys.delete(key);
  if (pressedKeys.size === 0) stopMoving();
});

function startMoving() {
  if (moveAnimationFrame !== null) return;
  moveLoop();
}

function moveLoop() {
  if (isDragging) {
    moveAnimationFrame = requestAnimationFrame(moveLoop);
    return;
  }

  let dx = 0;
  let dy = 0;

  if (pressedKeys.has('ArrowLeft')) dx -= 1;
  if (pressedKeys.has('ArrowRight')) dx += 1;
  if (pressedKeys.has('ArrowUp')) dy -= 1;
  if (pressedKeys.has('ArrowDown')) dy += 1;

  if (dx !== 0 || dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx = (dx / length) * speed;
    dy = (dy / length) * speed;

    let newX = characterX + dx;
    let newY = characterY + dy;

    // 캐릭터 중심이 영역 밖으로 안 나가게 보정
    const halfW = character.clientWidth / 2;
    const halfH = character.clientHeight / 2;

    newX = Math.max(0 + halfW, Math.min(newX, gameArea.clientWidth - halfW));
    newY = Math.max(0 + halfH, Math.min(newY, gameArea.clientHeight - halfH));

    updateCharacterPosition(newX, newY);
  }

  moveAnimationFrame = requestAnimationFrame(moveLoop);
}

function stopMoving() {
  if (moveAnimationFrame !== null) {
    cancelAnimationFrame(moveAnimationFrame);
    moveAnimationFrame = null;
  }
}

// 📱 버튼 이동 처리
const buttons = document.querySelectorAll('#buttons button');
const keyMap = { '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight' };

buttons.forEach(button => {
  const key = keyMap[button.textContent];
  if (!key) return;

  const press = () => {
    pressedKeys.add(key);

    if (key === 'ArrowLeft') {
      currentDirection = 'left';
      character.style.transform = 'scaleX(1)';
    }
    if (key === 'ArrowRight') {
      currentDirection = 'right';
      character.style.transform = 'scaleX(-1)';
    }

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

// 📲 터치 드래그
character.addEventListener('touchstart', (e) => {
  isDragging = true;
  const touch = e.touches[0];
  offsetX = touch.clientX - character.offsetLeft;
  offsetY = touch.clientY - character.offsetTop;
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (isDragging) {
    const touch = e.touches[0];
    let x = touch.clientX - offsetX;
    let y = touch.clientY - offsetY;

    x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
    y = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

    updateCharacterPosition(x, y);
  }
}, { passive: false });

document.addEventListener('touchend', () => {
  isDragging = false;
});

// 📡 서버에서 좌표 수신
socket.on('position', (pos) => {
  if (pos.direction) {
    currentDirection = pos.direction;
  }

  // 비율 좌표를 중심 기준으로 환산
  const centerX = pos.x * gameArea.clientWidth;
  const centerY = pos.y * gameArea.clientHeight;

  const x = centerX - character.clientWidth / 2;
  const y = centerY - character.clientHeight / 2;

  // 보정: 완전히 벗어나는 것 방지
  const safeX = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
  const safeY = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

  updateCharacterFromServer(safeX, safeY);
});
