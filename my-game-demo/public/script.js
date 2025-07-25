import { setupKeyboardControls } from './keyboardControl.js';
import { setupDragControls } from './dragControl.js';
import { setupButtonControls } from './buttonControl.js';

const socket = io('https://my-game-demo.onrender.com', {
  transports: ['websocket'],
  secure: true,
});

const character = document.getElementById('character');
const gameArea = document.getElementById('game-area');
const bubble = document.getElementById('bubble');
const chatLog = document.getElementById('chat-log');
const sendBtn = document.getElementById('send-btn');
const chatInput = document.getElementById('chat-input');

export const state = {
  character,
  gameArea,
  bubble,
  chatLog,
  sendBtn,
  chatInput,
  socket,
  characterX: 100,
  characterY: 100,
  currentDirection: 'left',
  isDragging: false,
  offsetX: 0,
  offsetY: 0,
  currentAnim: './images/anim1.gif',
  speed: window.innerWidth <= 600 ? 5 : 10,
  pressedKeys: new Set(),
  moveAnimationFrame: null,
  bubbleTimeout: null,
};

let bubbleTrackingId = null;

function updateBubblePosition() {
  const charRect = state.character.getBoundingClientRect();
  const gameRect = state.gameArea.getBoundingClientRect();
  const bubbleX = charRect.left + charRect.width / 2 - gameRect.left;
  const bubbleY = charRect.top - gameRect.top - 90;
  const bubbleWidth = state.bubble.offsetWidth;
  const halfBubble = bubbleWidth / 2;

  let clampedLeft = Math.max(halfBubble, Math.min(bubbleX, gameRect.width - halfBubble));

  state.bubble.style.left = `${clampedLeft}px`;
  state.bubble.style.top = `${bubbleY}px`;
  state.bubble.style.transform = 'translateX(-50%)';
}

socket.on('position', (data) => {
  const { x, y, direction, anim } = data;
  const pixelX = x * gameArea.clientWidth - character.clientWidth / 2;
  const pixelY = y * gameArea.clientHeight - character.clientHeight / 2;

  // ✅ 상태도 갱신
  state.characterX = pixelX;
  state.characterY = pixelY;

  character.style.left = `${pixelX}px`;
  character.style.top = `${pixelY}px`;
  character.style.backgroundImage = `url('${anim}')`;
  character.style.transform = direction === 'right' ? 'scaleX(-1)' : 'scaleX(1)';

  updateBubblePosition();
});

socket.on('chat_message', ({ user, message }) => {
  if (user === '나') return;
  appendMessage(`💬 ${user}: ${message}`);
  if (user === 'AI') showBubble(message);
});

setupKeyboardControls(state);
setupDragControls(state);
setupButtonControls(state);

function appendMessage(text) {
  const div = document.createElement('div');
  div.textContent = text;
  state.chatLog.appendChild(div);
  state.chatLog.scrollTop = state.chatLog.scrollHeight;
}

function showBubble(text) {
  if (bubbleTrackingId) {
    cancelAnimationFrame(bubbleTrackingId);
    bubbleTrackingId = null;
  }

  state.bubble.textContent = text;
  state.bubble.style.display = 'block';

  const update = () => {
    updateBubblePosition();
    bubbleTrackingId = requestAnimationFrame(update);
  };

  update();

  clearTimeout(state.bubbleTimeout);
  state.bubbleTimeout = setTimeout(() => {
    state.bubble.style.display = 'none';
    if (bubbleTrackingId) {
      cancelAnimationFrame(bubbleTrackingId);
      bubbleTrackingId = null;
    }
  }, 30000);
}

state.sendBtn.addEventListener('click', async () => {
  const msg = state.chatInput.value.trim();
  if (!msg) return;

  const userMsg = { user: '나', message: msg };
  appendMessage(`👤 ${userMsg.user}: ${userMsg.message}`);
  state.chatInput.value = '';
  state.socket.emit('chat_message', userMsg);

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    });

    const data = await res.json();
    const reply = data.reply ?? '(응답 없음)';
    const aiMsg = { user: 'AI', message: reply };
    state.socket.emit('chat_message', aiMsg);
  } catch (err) {
    console.error(err);
    appendMessage('❌ 오류 발생: 서버가 응답하지 않습니다.');
  }
});

state.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    state.sendBtn.click();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const gameAreaWidth = state.gameArea.clientWidth;
  const gameAreaHeight = state.gameArea.clientHeight;

  state.characterX = gameAreaWidth * 0.5 - state.character.clientWidth / 2;
  state.characterY = gameAreaHeight * 0.5 - state.character.clientHeight / 2;

  state.character.style.left = `${state.characterX}px`;
  state.character.style.top = `${state.characterY}px`;

  updateBubblePosition();
});
