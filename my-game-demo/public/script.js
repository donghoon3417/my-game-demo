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

// 말풍선 위치 갱신 함수
function updateBubblePosition() {
  const charRect = state.character.getBoundingClientRect();
  const gameRect = state.gameArea.getBoundingClientRect();
  const bubbleX = charRect.left + charRect.width / 2 - gameRect.left;
  const bubbleY = charRect.top - gameRect.top;

  state.bubble.style.left = `${bubbleX}px`;
  state.bubble.style.top = `${bubbleY - 10}px`;
  state.bubble.style.transform = 'translateX(-50%)'; // 좌우 반전 영향 제거
}

// 캐릭터 위치 동기화
socket.on('position', (data) => {
  const { x, y, direction, anim } = data;
  const pixelX = x * gameArea.clientWidth - character.clientWidth / 2;
  const pixelY = y * gameArea.clientHeight - character.clientHeight / 2;

  character.style.left = `${pixelX}px`;
  character.style.top = `${pixelY}px`;
  character.style.backgroundImage = `url('${anim}')`;
  character.style.transform = direction === 'right' ? 'scaleX(-1)' : 'scaleX(1)';

  updateBubblePosition();
});

// 채팅 메시지 동기화
socket.on('chat_message', ({ user, message }) => {
  if (user === '나') return;
  appendMessage(`💬 ${user}: ${message}`);
  if (user === 'AI') showBubble(message);
});

// 컨트롤 연결
setupKeyboardControls(state);
setupDragControls(state);
setupButtonControls(state);

// 채팅창에 메시지 추가
function appendMessage(text) {
  const div = document.createElement('div');
  div.textContent = text;
  state.chatLog.appendChild(div);
  state.chatLog.scrollTop = state.chatLog.scrollHeight;
}

// 말풍선 표시
function showBubble(text) {
  // 기존 추적 제거
  if (bubbleTrackingId) {
    cancelAnimationFrame(bubbleTrackingId);
    bubbleTrackingId = null;
  }

  state.bubble.textContent = text;
  state.bubble.style.display = 'block';

  // 캐릭터 따라 위치 업데이트
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

// 전송 버튼 클릭 시
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

// Enter 키로 전송
state.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    state.sendBtn.click();
  }
});

// 초기 위치 설정
document.addEventListener('DOMContentLoaded', () => {
  const gameAreaWidth = state.gameArea.clientWidth;
  const gameAreaHeight = state.gameArea.clientHeight;

  state.characterX = gameAreaWidth * 0.5 - state.character.clientWidth / 2;
  state.characterY = gameAreaHeight * 0.5 - state.character.clientHeight / 2;

  state.character.style.left = `${state.characterX}px`;
  state.character.style.top = `${state.characterY}px`;

  updateBubblePosition();
});
