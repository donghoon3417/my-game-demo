const socket = io();
const character = document.getElementById('character');
const gameArea = document.getElementById('game-area');
const bubble = document.getElementById('bubble');
const chatLog = document.getElementById('chat-log');
const sendBtn = document.getElementById('send-btn');
const chatInput = document.getElementById('chat-input');

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

let currentAnim = './images/anim1.gif';

function setCharacterAnimation(running, overrideAnim = null) {
  let newAnim = overrideAnim || (running ? './images/anim11.gif' : './images/anim1.gif');
  if (newAnim === currentAnim) return;
  currentAnim = newAnim;
  character.style.backgroundImage = `url('${newAnim}')`;
  character.style.transform = currentDirection === 'right' ? 'scaleX(-1)' : 'scaleX(1)';
}

function updateCharacterPosition(x, y) {
  characterX = x;
  characterY = y;
  character.style.left = `${x}px`;
  character.style.top = `${y}px`;

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
  return ({
    'Up': 'ArrowUp',
    'Down': 'ArrowDown',
    'Left': 'ArrowLeft',
    'Right': 'ArrowRight'
  })[key] || key;
}

document.addEventListener('DOMContentLoaded', () => {
  const rect = character.getBoundingClientRect();
  const parentRect = gameArea.getBoundingClientRect();
  characterX = rect.left - parentRect.left;
  characterY = rect.top - parentRect.top;
  updateCharacterPosition(characterX, characterY);
});

document.addEventListener('keydown', (e) => {
  const validKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Left', 'Right', 'Up', 'Down', 'a'];
  if (!validKeys.includes(e.key)) return;

  const key = normalizeKey(e.key);
  pressedKeys.add(key);

  if (key === 'ArrowLeft') currentDirection = 'left';
  if (key === 'ArrowRight') currentDirection = 'right';

  if (key === 'a') {
    setCharacterAnimation(true, './images/anim12.gif');
    socket.emit('drag', {
      x: (characterX + character.clientWidth / 2) / gameArea.clientWidth,
      y: (characterY + character.clientHeight / 2) / gameArea.clientHeight,
      direction: currentDirection,
      dragging: isDragging,
      anim: './images/anim12.gif'
    });
    startMoving();
    return;
  }

  setCharacterAnimation(true);
  startMoving();
});

document.addEventListener('keyup', (e) => {
  const key = normalizeKey(e.key);
  pressedKeys.delete(key);

  if (pressedKeys.size === 0) {
    stopMoving();
    setCharacterAnimation(false);
    socket.emit('drag', {
      x: (characterX + character.clientWidth / 2) / gameArea.clientWidth,
      y: (characterY + character.clientHeight / 2) / gameArea.clientHeight,
      direction: currentDirection,
      dragging: false,
      anim: './images/anim1.gif'
    });
  }
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

  let dx = 0, dy = 0;
  if (pressedKeys.has('ArrowLeft')) dx -= 1;
  if (pressedKeys.has('ArrowRight')) dx += 1;
  if (pressedKeys.has('ArrowUp')) dy -= 1;
  if (pressedKeys.has('ArrowDown')) dy += 1;

  let newX = characterX, newY = characterY;
  if (dx !== 0 || dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx = (dx / length || 0) * speed;
    dy = (dy / length || 0) * speed;

    newX = Math.max(0, Math.min(characterX + dx, gameArea.clientWidth - character.clientWidth));
    newY = Math.max(0, Math.min(characterY + dy, gameArea.clientHeight - character.clientHeight));
  }

  if (dx !== 0 || dy !== 0 || pressedKeys.has('a')) {
    if (pressedKeys.has('a')) {
      if (currentAnim !== './images/anim12.gif') setCharacterAnimation(true, './images/anim12.gif');
    } else {
      if (currentAnim !== './images/anim11.gif') setCharacterAnimation(true, './images/anim11.gif');
    }
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

// 버튼 조작 처리
const buttons = document.querySelectorAll('#buttons button');
const keyMap = { '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight', 'A': 'a' };

buttons.forEach(button => {
  const key = keyMap[button.textContent];
  if (!key) return;

  const press = () => {
    pressedKeys.add(key);
    if (key === 'ArrowLeft') currentDirection = 'left';
    if (key === 'ArrowRight') currentDirection = 'right';

    if (key === 'a') {
      setCharacterAnimation(true, './images/anim12.gif');
      currentAnim = './images/anim12.gif';
      socket.emit('drag', {
        x: (characterX + character.clientWidth / 2) / gameArea.clientWidth,
        y: (characterY + character.clientHeight / 2) / gameArea.clientHeight,
        direction: currentDirection,
        dragging: isDragging,
        anim: './images/anim12.gif'
      });
    } else {
      setCharacterAnimation(true);
    }
    startMoving();
  };

  const release = () => {
    pressedKeys.delete(key);
    if (key === 'a') {
      setCharacterAnimation(false);
      socket.emit('drag', {
        x: (characterX + character.clientWidth / 2) / gameArea.clientWidth,
        y: (characterY + character.clientHeight / 2) / gameArea.clientHeight,
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
  button.addEventListener('touchstart', e => { e.preventDefault(); press(); }, { passive: false });
  button.addEventListener('touchend', release);
});

// 드래그 이벤트 (데스크탑/모바일 공통)
function handleDragStart(e, isTouch = false) {
  isDragging = true;
  const point = isTouch ? e.touches[0] : e;
  offsetX = point.clientX - character.offsetLeft;
  offsetY = point.clientY - character.offsetTop;
  e.preventDefault();
}

function handleDragMove(e, isTouch = false) {
  if (!isDragging) return;
  const point = isTouch ? e.touches[0] : e;
  let x = point.clientX - offsetX;
  let y = point.clientY - offsetY;
  x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
  y = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));
  setCharacterAnimation(false);
  updateCharacterPosition(x, y);
}

function handleDragEnd() {
  isDragging = false;
}

character.addEventListener('mousedown', e => handleDragStart(e));
document.addEventListener('mousemove', e => handleDragMove(e));
document.addEventListener('mouseup', handleDragEnd);

character.addEventListener('touchstart', e => handleDragStart(e, true), { passive: false });
document.addEventListener('touchmove', e => handleDragMove(e, true), { passive: false });
document.addEventListener('touchend', handleDragEnd);

// 서버로부터 위치 수신
socket.on('position', (pos) => {
  if (isDragging || pressedKeys.size > 0) return;

  const centerX = pos.x * gameArea.clientWidth;
  const centerY = pos.y * gameArea.clientHeight;
  const x = Math.max(0, Math.min(centerX - character.clientWidth / 2, gameArea.clientWidth - character.clientWidth));
  const y = Math.max(0, Math.min(centerY - character.clientHeight / 2, gameArea.clientHeight - character.clientHeight));

  characterX = x;
  characterY = y;
  character.style.left = `${x}px`;
  character.style.top = `${y}px`;

  if (!isDragging) {
    if (pos.direction) {
      currentDirection = pos.direction;
    }

    if (pos.anim) {
      currentAnim = pos.anim;
      character.style.backgroundImage = `url('${pos.anim}')`;
    }

    character.style.transform = currentDirection === 'right' ? 'scaleX(-1)' : 'scaleX(1)';

    if (!pos.dragging) {
      clearTimeout(window.animTimeout);
      window.animTimeout = setTimeout(() => {
        setCharacterAnimation(false);
      }, 200);
    }
  }
});

// AI 채팅 처리
sendBtn.addEventListener('click', async () => {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;
  addMessageToLog('나', userMessage);
  chatInput.value = '';
  showBubble(userMessage);

  const aiMessage = await fetchAIResponse(userMessage);
  showBubble(aiMessage);
  addMessageToLog('AI', aiMessage);
});

function addMessageToLog(sender, message) {
  const msgDiv = document.createElement('div');
  msgDiv.textContent = `${sender}: ${message}`;
  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function showBubble(message) {
  bubble.textContent = message;
  bubble.style.display = 'block';
  clearTimeout(bubble._timeout);
  bubble._timeout = setTimeout(() => {
    bubble.style.display = 'none';
  }, 5000);
}

async function fetchAIResponse(message) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_OPENROUTER_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4',
        messages: [
          { role: 'system', content: '사용자의 질문에 친절하게 대답해 주세요.' },
          { role: 'user', content: message }
        ]
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '(AI 응답 없음)';
  } catch (err) {
    console.error(err);
    return '(AI 오류 발생)';
  }
}
