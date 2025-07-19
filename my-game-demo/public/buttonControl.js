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
          const { x, y } = getCharacterCenterRatio();
          state.socket.emit('move', {
            direction,
            step: moveStep,
            anim: './images/anim11.gif',
            x,
            y
          });
        }, 50);
      }

      if (key === 'A') {
        state.character.style.backgroundImage = `url('./images/anim12.gif')`;
        const { x, y } = getCharacterCenterRatio();
        state.socket.emit('drag', {
          x,
          y,
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

      state.character.style.backgroundImage = `url('./images/anim1.gif')`;
      const { x, y } = getCharacterCenterRatio();
      state.socket.emit('drag', {
        x,
        y,
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
    let posX = state.characterX;
    let posY = state.characterY;

    if (direction === 'left') posX -= step * state.gameArea.clientWidth;
    if (direction === 'right') posX += step * state.gameArea.clientWidth;
    if (direction === 'up') posY -= step * state.gameArea.clientHeight;
    if (direction === 'down') posY += step * state.gameArea.clientHeight;

    posX = Math.max(0, Math.min(posX, state.gameArea.clientWidth - state.character.clientWidth));
    posY = Math.max(0, Math.min(posY, state.gameArea.clientHeight - state.character.clientHeight));

    // ✅ 상태 동기화
    state.characterX = posX;
    state.characterY = posY;
    state.currentDirection = direction;

    state.character.style.left = `${posX}px`;
    state.character.style.top = `${posY}px`;
    state.character.style.transform = direction === 'right' ? 'scaleX(-1)' : 'scaleX(1)';
  }

  function getCharacterCenterRatio() {
    const charRect = state.character.getBoundingClientRect();
    const gameRect = state.gameArea.getBoundingClientRect();

    const centerX = (charRect.left + charRect.width / 2 - gameRect.left) / gameRect.width;
    const centerY = (charRect.top + charRect.height / 2 - gameRect.top) / gameRect.height;

    return { x: centerX, y: centerY };
  }
}
