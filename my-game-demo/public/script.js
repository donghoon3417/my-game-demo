let isDragging = false;
let offsetX = 0;
let offsetY = 0;

const gameArea = document.getElementById('game-area');

// 공통 위치 계산 함수
function getRelativePosition(clientX, clientY) {
  const areaRect = gameArea.getBoundingClientRect();
  let x = clientX - areaRect.left - offsetX;
  let y = clientY - areaRect.top - offsetY;

  x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
  y = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

  return { x, y };
}

// 마우스 시작
character.addEventListener('mousedown', (e) => {
  isDragging = true;
  const charRect = character.getBoundingClientRect();
  offsetX = e.clientX - charRect.left;
  offsetY = e.clientY - charRect.top;
  e.preventDefault();
});

// 마우스 이동
document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const { x, y } = getRelativePosition(e.clientX, e.clientY);
    character.style.left = `${x}px`;
    character.style.top = `${y}px`;
    socket.emit('drag', { x, y });
  }
});

// 마우스 끝
document.addEventListener('mouseup', () => {
  isDragging = false;
});

// 터치 시작
character.addEventListener('touchstart', (e) => {
  isDragging = true;
  const touch = e.touches[0];
  const charRect = character.getBoundingClientRect();
  offsetX = touch.clientX - charRect.left;
  offsetY = touch.clientY - charRect.top;
  e.preventDefault();
}, { passive: false });

// 터치 이동
document.addEventListener('touchmove', (e) => {
  if (isDragging) {
    const touch = e.touches[0];
    const { x, y } = getRelativePosition(touch.clientX, touch.clientY);
    character.style.left = `${x}px`;
    character.style.top = `${y}px`;
    socket.emit('drag', { x, y });
  }
}, { passive: false });

// 터치 끝
document.addEventListener('touchend', () => {
  isDragging = false;
});
