export function setupButtonControls(state) {
  const moveStep = 0.01;

  document.querySelectorAll('#buttons button').forEach(btn => {
    const key = btn.textContent;
    let intervalId = null;

    const start = () => {
      if (['↑', '↓', '←', '→'].includes(key)) {
        state.character.style.backgroundImage = `url('./images/anim11.gif')`;
        intervalId = setInterval(() => {
          moveCharacterLocally(key);
          const dirMap = { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right' };
          const direction = dirMap[key];
          state.socket.emit('move', {
            direction,
            step: moveStep,
            anim: './images/anim11.gif' // ✅ 서버로 애니메이션도 전송
          });
        }, 50);
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
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        state.character.style.backgroundImage = `url('./images/anim1.gif')`;

        // ✅ 정지 애니메이션도 서버로 전송
        const centerX = (state.characterX + state.character.clientWidth / 2) / state.gameArea.clientWidth;
        const centerY = (state.characterY + state.character.clientHeight / 2) / state.gameArea.clientHeight;

        state.socket.emit('drag', {
          x: centerX,
          y: centerY,
          direction: state.currentDirection,
          dragging: false,
          anim: './images/anim1.gif'
        });
      }
    };

    // 데스크탑
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);

    // 모바일
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      start();
    });
    btn.addEventListener('touchend', stop);
    btn.addEventListener('touchcancel', stop);
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
