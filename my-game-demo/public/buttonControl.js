export function setupButtonControls(state) {
  const moveStep = 0.01; // 서버와 동일하게 맞춤

  document.querySelectorAll('#buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.textContent;

      switch (key) {
        case '↑':
          moveCharacterLocally('up');
          state.socket.emit('move', { direction: 'up', step: moveStep });
          break;
        case '↓':
          moveCharacterLocally('down');
          state.socket.emit('move', { direction: 'down', step: moveStep });
          break;
        case '←':
          moveCharacterLocally('left');
          state.socket.emit('move', { direction: 'left', step: moveStep });
          break;
        case '→':
          moveCharacterLocally('right');
          state.socket.emit('move', { direction: 'right', step: moveStep });
          break;
        case 'A':
          const centerX = (state.characterX + state.character.clientWidth / 2) / state.gameArea.clientWidth;
          const centerY = (state.characterY + state.character.clientHeight / 2) / state.gameArea.clientHeight;

          // 본인 화면 즉시 반영
          state.character.style.backgroundImage = `url('./images/anim12.gif')`;

          state.socket.emit('drag', {
            x: centerX,
            y: centerY,
            direction: state.currentDirection,
            dragging: false,
            anim: './images/anim12.gif'
          });
          break;
      }
    });
  });

  function moveCharacterLocally(direction) {
    const step = moveStep;
    if (direction === 'left') state.characterX -= step * state.gameArea.clientWidth;
    if (direction === 'right') state.characterX += step * state.gameArea.clientWidth;
    if (direction === 'up') state.characterY -= step * state.gameArea.clientHeight;
    if (direction === 'down') state.characterY += step * state.gameArea.clientHeight;

    // 범위 제한
    state.characterX = Math.max(0, Math.min(state.characterX, state.gameArea.clientWidth));
    state.characterY = Math.max(0, Math.min(state.characterY, state.gameArea.clientHeight));

    state.currentDirection = direction;
    state.character.style.left = `${state.characterX}px`;
    state.character.style.top = `${state.characterY}px`;
    state.character.style.transform = direction === 'right' ? 'scaleX(-1)' : 'scaleX(1)';
  }
}
