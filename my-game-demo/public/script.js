import { setupKeyboardControls } from './keyboardControl.js';
import { setupDragControls } from './dragControl.js';

const socket = io();
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


function appendMessage(text) {
  const div = document.createElement('div');
  div.textContent = text;
  state.chatLog.appendChild(div);
  state.chatLog.scrollTop = state.chatLog.scrollHeight;
}

function showBubble(text) {
  state.bubble.textContent = text;
  state.bubble.style.display = 'block';

  // ✅ 스타일 설정
  state.bubble.style.maxWidth = '300px';         // 가로 너비 넓힘
  state.bubble.style.minHeight = '60px';         // 최소 높이 줌 (타워형 느낌)
  state.bubble.style.padding = '8px 12px';        // 안쪽 여백
  state.bubble.style.borderRadius = '12px';       // 모서리 둥글게
  state.bubble.style.backgroundColor = '#fff';    // 배경 색 (필요 시)
  state.bubble.style.wordWrap = 'break-word';     // 줄바꿈
  state.bubble.style.whiteSpace = 'pre-wrap';     // 줄 유지
  state.bubble.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)'; // 그림자 (선택)

  clearTimeout(state.bubbleTimeout);
  state.bubbleTimeout = setTimeout(() => {
    state.bubble.style.display = 'none';
  }, 30000); // 30초
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

setupKeyboardControls(state);
setupDragControls(state);
