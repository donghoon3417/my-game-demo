const socket = io();
const character = document.getElementById('character');

// 서버에서 좌표 받기
socket.on('position', (pos) => {
  character.style.left = `${pos.x}px`;
  character.style.top = `${pos.y}px`;
});

// 방향키 이동
document.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    let direction;
    switch (e.key) {
      case 'ArrowLeft': direction = 'left'; break;
      case 'ArrowRight': direction = 'right'; break;
      case 'ArrowUp': direction = 'up'; break;
      case 'ArrowDown': direction = 'down'; break;
    }
    socket.emit('move', { direction });
  }
});

// 마우스 드래그
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

character.addEventListener('mousedown', (e) => {
  e.preventDefault(); // 브라우저 기본 동작 방지 (중요)
  isDragging = true;

  const rect = character.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const gameArea = document.getElementById('game-area');
    const areaRect = gameArea.getBoundingClientRect();

    let x = e.clientX - areaRect.left - offsetX;
    let y = e.clientY - areaRect.top - offsetY;

    // 경계 조건 체크
    x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
    y = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

    character.style.left = `${x}px`;
    character.style.top = `${y}px`;

    socket.emit('drag', { x, y });
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});
