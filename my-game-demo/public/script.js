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
  bubbleTimeout: null
};

// 캐릭터 위치 동기화
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

// 채팅 메시지 동기화
socket.on('chat_message', ({ user, message }) => {
  if (user === '나') return;
  appendMessage(`💬 ${user}: ${message}`);
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
  state.bubble.textContent = text;
  state.bubble.style.display = 'block';

  clearTimeout(state.bubbleTimeout);
  state.bubbleTimeout = setTimeout(() => {
    state.bubble.style.display = 'none';
  }, 30000);
}

// 전송 버튼 클릭 시
state.sendBtn.addEventListener('click', async () => {
  const msg = state.chatInput.value.trim();
  if (!msg) return;

  const userMsg = { user: '나', message: msg };

  // 본인에게 출력
  appendMessage(`👤 ${userMsg.user}: ${userMsg.message}`);
  state.chatInput.value = '';

  // 서버로 브로드캐스트 요청
  state.socket.emit('chat_message', userMsg);

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();
    const reply = data.reply ?? '(응답 없음)';

    const aiMsg = { user: 'AI', message: reply };

    // 본인에게 출력 및 말풍선
    appendMessage(`🤖 ${aiMsg.user}: ${aiMsg.message}`);
    showBubble(aiMsg.message);

    // 서버로 AI 메시지도 전송 (다른 사람도 보이게)
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
  const rect = state.character.getBoundingClientRect();
  const parentRect = state.gameArea.getBoundingClientRect();
  state.characterX = rect.left - parentRect.left;
  state.characterY = rect.top - parentRect.top;
  state.character.style.left = `${state.characterX}px`;
  state.character.style.top = `${state.characterY}px`;
});
