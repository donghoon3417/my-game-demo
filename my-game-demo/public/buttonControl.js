export function setupButtonControls(state) {
  const moveStep = 0.01;
  let isTouch = false; // 모바일 이벤트와 데스크탑 중복 방지

  document.querySelectorAll('#buttons button').forEach(btn => {
    const key = btn.textContent;
    let intervalId = null;

    const start = () => {
      if (['↑', '↓', '←', '→'].includes(key)) {
        state.character.style.backgroundImage = `url('./images/anim11.gif')`;
        intervalId = setInterval(() => {
          const dirMap = { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right' };
          const direction = dirMap[key];

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
        const posX = parseFloat(state.character.style.left) || 0;
        const posY = parseFloat(state.character.style.top) || 0;
        const centerX = (posX + state.character.clientWidth / 2) / state.gameArea.clientWidth;
        const centerY = (posY + state.character.clientHeight / 2) / state.gameArea.clientHeight;

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
      }
    };

    // 🖱️ 데스크탑
    btn.addEventListener('mousedown', () => {
      if (isTouch) return; // 모바일 이벤트와 중복 방지
      start();
    });
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);

    // 📱 모바일
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault(); // 스크롤 방지
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
}
