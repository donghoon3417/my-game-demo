export function setupKeyboardControls(state) {
  const { character, gameArea, pressedKeys, socket } = state;

  function normalizeKey(key) {
    return ({
      'Up': 'ArrowUp',
      'Down': 'ArrowDown',
      'Left': 'ArrowLeft',
      'Right': 'ArrowRight'
    })[key] || key;
  }

  function updateCharacterPosition(x, y) {
    state.characterX = x;
    state.characterY = y;
    character.style.left = `${x}px`;
    character.style.top = `${y}px`;

    const ratioX = (x + character.clientWidth / 2) / gameArea.clientWidth;
    const ratioY = (y + character.clientHeight / 2) / gameArea.clientHeight;

    socket.emit('drag', {
      x: ratioX,
      y: ratioY,
      direction: state.currentDirection,
      dragging: state.isDragging,
      anim: state.currentAnim
    });
  }

  function setCharacterAnimation(running, overrideAnim = null) {
    let newAnim = overrideAnim || (running ? './images/anim11.gif' : './images/anim1.gif');
    if (newAnim === state.currentAnim) return;
    state.currentAnim = newAnim;
    character.style.backgroundImage = `url('${newAnim}')`;
    character.style.transform = state.currentDirection === 'right' ? 'scaleX(-1)' : 'scaleX(1)';
  }

  function startMoving() {
    if (state.moveAnimationFrame !== null) return;
    moveLoop();
  }

  function moveLoop() {
    if (state.isDragging) {
      state.moveAnimationFrame = requestAnimationFrame(moveLoop);
      return;
    }

    let dx = 0, dy = 0;
    if (pressedKeys.has('ArrowLeft')) dx -= 1;
    if (pressedKeys.has('ArrowRight')) dx += 1;
    if (pressedKeys.has('ArrowUp')) dy -= 1;
    if (pressedKeys.has('ArrowDown')) dy += 1;

    let newX = state.characterX;
    let newY = state.characterY;

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx = (dx / length || 0) * state.speed;
      dy = (dy / length || 0) * state.speed;

      newX = Math.max(0, Math.min(state.characterX + dx, gameArea.clientWidth - character.clientWidth));
      newY = Math.max(0, Math.min(state.characterY + dy, gameArea.clientHeight - character.clientHeight));
    }

    if (dx !== 0 || dy !== 0 || pressedKeys.has('a')) {
      if (pressedKeys.has('a')) {
        if (state.currentAnim !== './images/anim12.gif') setCharacterAnimation(true, './images/anim12.gif');
      } else {
        if (state.currentAnim !== './images/anim11.gif') setCharacterAnimation(true, './images/anim11.gif');
      }
      updateCharacterPosition(newX, newY);
    }

    state.moveAnimationFrame = requestAnimationFrame(moveLoop);
  }

  function stopMoving() {
    if (state.moveAnimationFrame !== null) {
      cancelAnimationFrame(state.moveAnimationFrame);
      state.moveAnimationFrame = null;
    }
    setCharacterAnimation(false);
  }

  document.addEventListener('keydown', (e) => {
    const key = normalizeKey(e.key);
    const validKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a'];
    if (!validKeys.includes(key)) return;

    pressedKeys.add(key);

    if (key === 'ArrowLeft') state.currentDirection = 'left';
    if (key === 'ArrowRight') state.currentDirection = 'right';

    if (key === 'a') {
      setCharacterAnimation(true, './images/anim12.gif');
      socket.emit('drag', {
        x: (state.characterX + character.clientWidth / 2) / gameArea.clientWidth,
        y: (state.characterY + character.clientHeight / 2) / gameArea.clientHeight,
        direction: state.currentDirection,
        dragging: state.isDragging,
        anim: './images/anim12.gif'
      });
    } else {
      setCharacterAnimation(true);
    }

    startMoving();
  });

  document.addEventListener('keyup', (e) => {
    const key = normalizeKey(e.key);
    pressedKeys.delete(key);

    if (pressedKeys.size === 0) {
      stopMoving();
      setCharacterAnimation(false);
      socket.emit('drag', {
        x: (state.characterX + character.clientWidth / 2) / gameArea.clientWidth,
        y: (state.characterY + character.clientHeight / 2) / gameArea.clientHeight,
        direction: state.currentDirection,
        dragging: false,
        anim: './images/anim1.gif'
      });
    }
  });
}
