document.querySelectorAll('#buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.textContent;

    switch (key) {
      case '↑':
        state.socket.emit('move', { direction: 'up' });
        break;
      case '↓':
        state.socket.emit('move', { direction: 'down' });
        break;
      case '←':
        state.socket.emit('move', { direction: 'left' });
        break;
      case '→':
        state.socket.emit('move', { direction: 'right' });
        break;
      case 'A':
        // 예: 애니메이션 강제 전환 예시
        state.socket.emit('drag', {
          x: (state.characterX + state.character.clientWidth / 2) / state.gameArea.clientWidth,
          y: (state.characterY + state.character.clientHeight / 2) / state.gameArea.clientHeight,
          direction: state.currentDirection,
          dragging: false,
          anim: './images/anim12.gif'
        });
        break;
    }
  });
});
