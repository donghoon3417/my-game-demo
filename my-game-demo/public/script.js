const socket = io();
const character = document.getElementById('character');

// 서버에서 좌표를 수신해서 화면에 반영
socket.on('position', (pos) => {
  character.style.left = `${pos.x}px`;
  character.style.top = `${pos.y}px`;
});

// 방향키로 이동
document.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    let direction;
    switch (e.key) {
      case 'ArrowLeft':
        direction = 'left';
        break;
      case 'ArrowRight':
        direction = 'right';
        break;
      case 'ArrowUp':
        direction = 'up';
        break;
      case 'ArrowDown':
        direction = 'down';
        break;
    }
    move(direction);
  }
});

// 서버로 이동 방향 전송
function move(direction) {
  socket.emit('move', { direction });
}

// 마우스 드래그 이동
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

character.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.offsetX;
  offsetY = e.offsetY;
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    character.style.left = `${x}px`;
    character.style.top = `${y}px`;

    // 서버에 drag 좌표 전송
    socket.emit('drag', { x, y });
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});
