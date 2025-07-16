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

let currentAnim = './images/anim1.gif'; // 초기값

function setCharacterAnimation(running, overrideAnim = null) {
  if (overrideAnim) {
    currentAnim = overrideAnim;
    character.style.backgroundImage = `url('${overrideAnim}')`;
  } else {
    currentAnim = running
      ? './images/anim11.gif'
      : './images/anim1.gif';
    character.style.backgroundImage = `url('${currentAnim}')`;
  }

  if (currentDirection === 'left') {
    character.style.transform = 'scaleX(1)';
  } else if (currentDirection === 'right') {
    character.style.transform = 'scaleX(-1)';
  }
}

function updateCharacterFromServer(x, y) {
  characterX = x;
  characterY = y;
  character.style.left = `${x}px`;
  character.style.top = `${y}px`;
  setCharacterAnimation(false);
}

function updateCharacterPosition(x, y) {
  characterX = x;
  characterY = y;
  character.style.left = `${x}px`;
  character.style.top = `${y}px`;

  // ✅ 드래그 중일 땐 정지 이미지
  if (!isDragging) {
    setCharacterAnimation(true);
  } else {
    setCharacterAnimation(false);
  }

  const centerX = x + character.clientWidth / 2;
  const centerY = y + character.clientHeight / 2;
  const ratioX = centerX / gameArea.clientWidth;
  const ratioY = centerY / gameArea.clientHeight;

// 예: updateCharacterPosition 함수 안에서
socket.emit('drag', {
  x: ratioX,
  y: ratioY,
  direction: currentDirection,
  dragging: isDragging,
  anim: currentAnim // 👈 현재 애니메이션 상태 전송
});

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
  const validKeys = [
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Left', 'Right', 'Up', 'Down', 'a'
  ];
  if (validKeys.includes(e.key)) {
    const key = normalizeKey(e.key);

    // a 키 특별 처리
    if (e.key === 'a') {
      setCharacterAnimation(true, './images/anim12.gif');
      return; // 방향 이동은 하지 않음
    }

    pressedKeys.add(key);

    if (key === 'ArrowLeft') currentDirection = 'left';
    if (key === 'ArrowRight') currentDirection = 'right';

    setCharacterAnimation(true);
    startMoving();
  }
});

document.addEventListener('keyup', (e) => {
  const key = normalizeKey(e.key);

  if (e.key === 'a') {
    // a 키에서 손을 뗐을 때 기본 정지 이미지로 전환
    setCharacterAnimation(false);
    return;
  }

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
  setCharacterAnimation(false);
}

const buttons = document.querySelectorAll('#buttons button');
const keyMap = { '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight' };

buttons.forEach(button => {
  const key = keyMap[button.textContent];
  if (!key) return;

  const press = () => {
    pressedKeys.add(key);
    if (key === 'ArrowLeft') currentDirection = 'left';
    if (key === 'ArrowRight') currentDirection = 'right';
    setCharacterAnimation(true);
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

    // 👇 드래그 중에는 정지 이미지 유지
    setCharacterAnimation(false);

    updateCharacterPosition(x, y);
  }
}, { passive: false });

document.addEventListener('touchend', () => {
  isDragging = false;
});

// -----------------------------
// 🖱️ 데스크탑 마우스 드래그
// -----------------------------
character.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.clientX - character.offsetLeft;
  offsetY = e.clientY - character.offsetTop;
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;

    x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
    y = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

    setCharacterAnimation(false); // 정지 상태 이미지
    updateCharacterPosition(x, y);
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

socket.on('position', (pos) => {
  if (pos.direction) currentDirection = pos.direction;

  const centerX = pos.x * gameArea.clientWidth;
  const centerY = pos.y * gameArea.clientHeight;
  const x = centerX - character.clientWidth / 2;
  const y = centerY - character.clientHeight / 2;
  const safeX = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
  const safeY = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

  updateCharacterFromServer(safeX, safeY);

  if (!isDragging) {
    if (pos.anim) {
      character.style.backgroundImage = `url('${pos.anim}')`;  // 👈 서버로부터 받은 애니메이션
    }

    if (pos.dragging) {
      setCharacterAnimation(false);
    } else {
      clearTimeout(window.animTimeout);
      window.animTimeout = setTimeout(() => {
        setCharacterAnimation(false);
      }, 200);
    }

    // 좌우 반전도 함께 반영
    if (pos.direction === 'left') {
      character.style.transform = 'scaleX(1)';
    } else if (pos.direction === 'right') {
      character.style.transform = 'scaleX(-1)';
    }
  }
});




