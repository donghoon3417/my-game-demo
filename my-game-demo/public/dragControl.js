export function setupDragControls(state) {
  const { character, gameArea, socket } = state;

  function updateCharacterPosition(x, y) {
    state.characterX = x;
    state.characterY = y;
    character.style.left = `${x}px`;
    character.style.top = `${y}px`;

    const centerX = x + character.clientWidth / 2;
    const centerY = y + character.clientHeight / 2;
    const ratioX = centerX / gameArea.clientWidth;
    const ratioY = centerY / gameArea.clientHeight;

    socket.emit('drag', {
      x: ratioX,
      y: ratioY,
      direction: state.currentDirection,
      dragging: state.isDragging,
      anim: './images/anim1.gif'
    });
  }

  function handleDragStart(e, isTouch = false) {
    state.isDragging = true;
    const point = isTouch ? e.touches[0] : e;
    state.offsetX = point.clientX - character.offsetLeft;
    state.offsetY = point.clientY - character.offsetTop;
    e.preventDefault();
  }

  function handleDragMove(e, isTouch = false) {
    if (!state.isDragging) return;
    const point = isTouch ? e.touches[0] : e;
    let x = point.clientX - state.offsetX;
    let y = point.clientY - state.offsetY;

    x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
    y = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

    updateCharacterPosition(x, y);
  }

  function handleDragEnd() {
    state.isDragging = false;
  }

  character.addEventListener('mousedown', e => handleDragStart(e));
  document.addEventListener('mousemove', e => handleDragMove(e));
  document.addEventListener('mouseup', handleDragEnd);

  character.addEventListener('touchstart', e => handleDragStart(e, true), { passive: false });
  document.addEventListener('touchmove', e => handleDragMove(e, true), { passive: false });
  document.addEventListener('touchend', handleDragEnd);
}
