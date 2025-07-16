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
    currentAnim = running ? './images/anim11.gif' : './images/anim1.gif';
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

  if (!isDragging) {
    setCharacterAnimation(true);
  } else {
    setCharacterAnimation(false);
  }

  const centerX = x + character.clientWidth / 2;
  const centerY = y + character.clientHeight / 2;
  const ratioX = centerX / gameArea.clientWidth;
  const ratioY = centerY / gameArea.clientHeight;

  socket.emit('drag', {
    x: ratioX,
    y: ratioY,
    direction: currentDirection,
    dragging: isDragging,
    anim: currentAnim
  });
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
  const validKeys = [
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Left', 'Right', 'Up', 'Down', 'a'
  ];
  if (validKeys.includes(e.key)) {
    const key = normalizeKey(e.key);

    if (e.key === 'a') {
      setCharacterAnimation(true, './images/anim12.gif');

      const centerX = characterX + character.clientWidth / 2;
      const centerY = characterY + character.clientHeight / 2;
      const ratioX = centerX / gameArea.clientWidth;
      const ratioY = centerY / gameArea.clientHeight;

      socket.emit('drag', {
        x: ratioX,
        y: ratioY,
        direction: currentDirection,
        dragging: isDragging,
        anim: './images/anim12.gif'
      });

      return;
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
    setCharacterAnimation(false);

    const centerX = characterX + character.clientWidth / 2;
    const centerY = characterY + character.clientHeight / 2;
    const ratioX = centerX / gameArea.clientWidth;
    const ratioY = centerY / gameArea.clientHeight;

    socket.emit('drag', {
      x: ratioX,
      y: ratioY,
      direction: currentDirection,
      dragging: isDragging,
      anim: './images/anim1.gif'
    });

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

  let newX = characterX;
  let newY = characterY;

  if (dx !== 0 || dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx = (dx / length || 0) * speed;
    dy = (dy / length || 0) * speed;

    newX = characterX + dx;
    newY = characterY + dy;

    newX = Math.max(0, Math.min(newX, gameArea.clientWidth - character.clientWidth));
    newY = Math.max(0, Math.min(newY, gameArea.clientHeight - character.clientHeight));
  }

  // 👉 방향키 이동이 있거나, a 키가 눌려있으면 위치/애니메이션 업데이트
  if (dx !== 0 || dy !== 0 || pressedKeys.has('a')) {
    if (pressedKeys.has('a')) {
      setCharacterAnimation(true, './images/anim12.gif');
      currentAnim = './images/anim12.gif'; // ← 이거 꼭 추가!
    }

    updateCharacterPosition(newX, newY); // 💡 여기서 emit도 됨
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
const keyMap = {
  '↑': 'ArrowUp',
  '↓': 'ArrowDown',
  '←': 'ArrowLeft',
  '→': 'ArrowRight',
  'A': 'a'
};

buttons.forEach(button => {
  const key = keyMap[button.textContent];
  if (!key) return;

  const press = () => {
    pressedKeys.add(key);
    if (key === 'ArrowLeft') currentDirection = 'left';
    if (key === 'ArrowRight') currentDirection = 'right';

    if (key === 'a') {
      setCharacterAnimation(true, './images/anim12.gif');
      currentAnim = './images/anim12.gif'; // 👈 명확하게 설정!

      const centerX = characterX + character.clientWidth / 2;
      const centerY = characterY + character.clientHeight / 2;
      const ratioX = centerX / gameArea.clientWidth;
      const ratioY = centerY / gameArea.clientHeight;

      socket.emit('drag', {
        x: ratioX,
        y: ratioY,
        direction: currentDirection,
        dragging: isDragging,
        anim: './images/anim12.gif'
      });
    } else {
      setCharacterAnimation(true);
    startMoving(); // ✅ a 버튼에서도 moveLoop 실행되게 추가
  } else {
    setCharacterAnimation(true);
    startMoving();
  }
};

  const release = () => {
    pressedKeys.delete(key);
    if (key === 'a') {
      pressedKeys.delete('a');  // ← 추가
      setCharacterAnimation(false);

      const centerX = characterX + character.clientWidth / 2;
      const centerY = characterY + character.clientHeight / 2;
      const ratioX = centerX / gameArea.clientWidth;
      const ratioY = centerY / gameArea.clientHeight;

      socket.emit('drag', {
        x: ratioX,
        y: ratioY,
        direction: currentDirection,
        dragging: isDragging,
        anim: './images/anim1.gif'
      });
    }

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

    setCharacterAnimation(false);
    updateCharacterPosition(x, y);
  }
}, { passive: false });

document.addEventListener('touchend', () => {
  isDragging = false;
});

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

    setCharacterAnimation(false);
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
      character.style.backgroundImage = `url('${pos.anim}')`;
    }

    if (pos.dragging) {
      setCharacterAnimation(false);
    } else {
      clearTimeout(window.animTimeout);
      window.animTimeout = setTimeout(() => {
        setCharacterAnimation(false);
      }, 200);
    }

    if (pos.direction === 'left') {
      character.style.transform = 'scaleX(1)';
    } else if (pos.direction === 'right') {
      character.style.transform = 'scaleX(-1)';
    }
  }
});
