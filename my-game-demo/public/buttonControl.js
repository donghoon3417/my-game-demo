export function setupButtonControls(state) {
  const moveStep = 0.01;
  let isTouch = false;

  document.querySelectorAll('#buttons button').forEach(btn => {
    const key = btn.textContent;
    let intervalId = null;

    const start = () => {
      if (['↑', '↓', '←', '→'].includes(key)) {
        state.character.style.backgroundImage = `url('./images/anim11.gif')`;
        const dirMap = { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right' };
        const direction = dirMap[key];

        intervalId = setInterval(() => {
          moveCharacterLocally(direction);

          const posX = parseFloat(state.character.style.left) || 0;
          const posY = parseFloat(state.character.style.top) || 0;
          const centerX = (posX + state.character.clientWidth / 2) / state.gameArea.clientWidth;
          const centerY = (posY + state.character.clientHeight / 2) / state.gameArea.clientHeight;

          state.socket.emit('move', {
            direction,
            step: moveStep,
            anim: './images/anim11.gif',
            x: centerX,
            y: centerY
          });
        }, 50);
      }

      if (key === 'A') {
        state.character.style.backgroundImage = `url('./images/anim12.gif')`;

        const posX = parseFloat(state.character.style.left) || 0;
        const posY = parseFloat(state.character.style.top) || 0;
        const centerX = (posX + state.character.clientWidth / 2) / state.gameArea.clientWidth;
        const centerY = (posY + state.character.clientHeight / 2) / state.gameArea.clientHeight;

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
      }

      // 모든 키에서 공통적으로 anim1.gif로 복귀
      state.character.style.backgroundImage = `url('./images/anim1.gif')`;

      const posX = parseFloat(state.character.style.left) || 0;
      const posY = parseFloat(state.character.style.top) || 0;
      const centerX = (posX + state.character.clientWidth / 2) / state.gameArea.clientWidth;
      const centerY = (posY + state.character.clientHeight / 2) / state.gameArea.clientHeight;

      state.socket.emit('drag', {
        x: centerX,
        y: centerY,
        direction: state.currentDirection,
        dragging: false,
        anim: './images/anim1.gif'
      });
    };

    // 🖱️ 데스크탑
    btn.addEventListener('mousedown', () => {
      if (isTouch) return;
      start();
    });
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);

    // 📱 모바일
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isTouch = true;
      start();
    });
    btn.addEventListener('touchend', () => {
      stop();
      isTouch = false;
    });
    btn.addEventListener('touchcancel', () => {
      stop();
      isTouch = false;
    });
  });

  function moveCharacterLocally(direction) {
    const step = moveStep;
    let posX = parseFloat(state.character.style.left) || 0;
    let posY = parseFloat(state.character.style.top) || 0;

    if (direction === 'left') posX -= step * state.gameArea.clientWidth;
    if (direction === 'right') posX += step * state.gameArea.clientWidth;
    if (direction === 'up') posY -= step * state.gameArea.clientHeight;
    if (direction === 'down') posY += step * state.gameArea.clientHeight;

    posX = Math.max(0, Math.min(posX, state.gameArea.clientWidth));
    posY = Math.max(0, Math.min(posY, state.gameArea.clientHeight));

    state.currentDirection = direction;
    state.character.style.left = `${posX}px`;
    state.character.style.top = `${posY}px`;
    state.character.style.transform = direction === 'right' ? 'scaleX(-1)' : 'scaleX(1)';
  }
}
