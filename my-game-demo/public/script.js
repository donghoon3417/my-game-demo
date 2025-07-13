const socket = io();
const character = document.getElementById('character');

socket.on('position', (pos) => {
  character.style.left = `${pos.x}px`;
  character.style.top = `${pos.y}px`;
});

function move(direction) {
  socket.emit('move', { direction });
}