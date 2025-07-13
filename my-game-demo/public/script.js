const socket = io();
const character = document.getElementById('character');

socket.on('position', (pos) => {
  character.style.left = `${pos.x}px`;
  character.style.top = `${pos.y}px`;
});

function move(direction) {
  socket.emit('move', { direction });
}

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
