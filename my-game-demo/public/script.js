import { setupKeyboardControls } from './keyboardControl.js';
import { setupDragControls } from './dragControl.js';
import { setupButtonControls } from './buttonControl.js'; // ✅ 함수 이름 다르게

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
  bubbleTimeout: null    // ✅ 이 줄 추가
};

// ✅ 여기 아래에 추가!
socket.on('position', (data) => {
  const { x, y, direction, anim } = data;
  const { character, gameArea } = state;

  const pixelX = x * gameArea.clientWidth - character.clientWidth / 2;
  const pixelY = y * gameArea.clientHeight - character.clientHeight / 2;

  character.style.left = `${pixelX}px`;
  character.style.top = `${pixelY}px`;
  character.style.backgroundImage = `url('${anim}')`;
  character.style.transform = direction === 'right' ? 'scaleX(-1)' : 'scaleX(1)';
});

// 그 다음 키보드/드래그/버튼 컨트롤 연결
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
  state.bubble.textContent = text;
  state.bubble.style.display = 'block';

  // ✅ 스타일은 이미 CSS에서 설정되어 있으므로 JS에서는 안 건드려도 됨
  // (불필요한 스타일 지정 제거)

  clearTimeout(state.bubbleTimeout);
  state.bubbleTimeout = setTimeout(() => {
    state.bubble.style.display = 'none';
  }, 30000); // 30초 유지
}


state.sendBtn.addEventListener('click', async () => {
  const msg = state.chatInput.value.trim();
  if (!msg) return;

  appendMessage('👤 나: ' + msg);
  state.chatInput.value = '';

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();
    const reply = data.reply ?? '(응답 없음)';
    appendMessage('🤖 AI: ' + reply);
    showBubble(reply);
  } catch (err) {
    console.error(err);
    appendMessage('❌ 오류 발생: 서버가 응답하지 않습니다.');
  }
});

// ✅ 여기 추가됨: Enter 키로 전송
state.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    state.sendBtn.click();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const rect = state.character.getBoundingClientRect();
  const parentRect = state.gameArea.getBoundingClientRect();
  state.characterX = rect.left - parentRect.left;
  state.characterY = rect.top - parentRect.top;
  state.character.style.left = `${state.characterX}px`;
  state.character.style.top = `${state.characterY}px`;
});

document.querySelectorAll('#buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.textContent;

    if (['↑', '↓', '←', '→'].includes(key)) {
      const dirMap = { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right' };
      state.socket.emit('move', { direction: dirMap[key] });
    } else if (key === 'A') {
      state.socket.emit('drag', {
        x: (state.characterX + state.character.clientWidth / 2) / state.gameArea.clientWidth,
        y: (state.characterY + state.character.clientHeight / 2) / state.gameArea.clientHeight,
        direction: state.currentDirection,
        dragging: false,
        anim: './images/anim12.gif'
      });
    }
  });
});
