const socket = io();
const character = document.getElementById('character');
const gameArea = document.getElementById('game-area');

let characterX = 100;
let characterY = 100;

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

const speed = 10;
const pressedKeys = new Set();
let moveAnimationFrame = null;

function updateCharacterPosition(x, y) {
  characterX = x;
  characterY = y;
  character.style.left = `${x}px`;
  character.style.top = `${y}px`;
  socket.emit('drag', { x, y });
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

document.addEventListener('keydown', (e) => {
  const validKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Left', 'Right', 'Up', 'Down'];
  if (validKeys.includes(e.key)) {
    const key = normalizeKey(e.key);
    pressedKeys.add(key);
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
    return; // 드래그 중이면 키보드 이동 중단
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

    newX = Math.max(0, Math.min(newX, gameArea.clientWidth - character.clientWidth));
    newY = Math.max(0, Math.min(newY, gameArea.clientHeight - character.clientHeight));

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

/*
// 🖱 마우스 드래그
character.addEventListener('mousedown', (e) => {
  isDragging = true;
  const rect = character.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  e.preventDefault();
});


document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;

    x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
    y = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

    updateCharacterPosition(x, y);
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// 📲 터치 드래그
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
*/
// 🔄 서버 위치 동기화
socket.on('position', (pos) => {
  if (!isDragging) {
    updateCharacterPosition(pos.x, pos.y);
  }
});
