export function setupButtonControls(state) {
  const moveStep = 0.01; // 서버와 동일하게 맞춤

  document.querySelectorAll('#buttons button').forEach(btn => {
    const key = btn.textContent;
    let intervalId = null;

    btn.addEventListener('mousedown', () => {
      if (['↑', '↓', '←', '→'].includes(key)) {
        state.character.style.backgroundImage = `url('./images/anim11.gif')`; // 움직이는 이미지

        intervalId = setInterval(() => {
          moveCharacterLocally(key);
          const dirMap = { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right' };
          const direction = dirMap[key];
          state.socket.emit('move', { direction, step: moveStep });
        }, 50); // 누르고 있는 동안 50ms 간격 이동
      }

      if (key === 'A') {
        const centerX = (state.characterX + state.character.clientWidth / 2) / state.gameArea.clientWidth;
        const centerY = (state.characterY + state.character.clientHeight / 2) / state.gameArea.clientHeight;

        state.character.style.backgroundImage = `url('./images/anim12.gif')`;

        state.socket.emit('drag', {
          x: centerX,
          y: centerY,
          direction: state.currentDirection,
          dragging: false,
          anim: './images/anim12.gif'
        });
      }
    });

    btn.addEventListener('mouseup', () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        state.character.style.backgroundImage = `url('./images/anim1.gif')`; // 정지 이미지
      }
    });

    btn.addEventListener('mouseleave', () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        state.character.style.backgroundImage = `url('./images/anim1.gif')`;
      }
    });
  });

  function moveCharacterLocally(key) {
    const directionMap = { '←': 'left', '→': 'right', '↑': 'up', '↓': 'down' };
    const direction = directionMap[key];
    const step = moveStep;

    if (direction === 'left') state.characterX -= step * state.gameArea.clientWidth;
    if (direction === 'right') state.characterX += step * state.gameArea.clientWidth;
    if (direction === 'up') state.characterY -= step * state.gameArea.clientHeight;
    if (direction === 'down') state.characterY += step * state.gameArea.clientHeight;

    state.characterX = Math.max(0, Math.min(state.characterX, state.gameArea.clientWidth));
    state.characterY = Math.max(0, Math.min(state.characterY, state.gameArea.clientHeight));

    state.currentDirection = direction;
    state.character.style.left = `${state.characterX}px`;
    state.character.style.top = `${state.characterY}px`;
    state.character.style.transform = direction === 'right' ? 'scaleX(-1)' : 'scaleX(1)';
  }
}
