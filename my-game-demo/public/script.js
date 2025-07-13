let isDragging = false;
let offsetX = 0;
let offsetY = 0;

const gameArea = document.getElementById('game-area');

character.addEventListener('mousedown', (e) => {
  isDragging = true;

  // gameArea 내부 좌표 기준으로 offset 계산
  const charRect = character.getBoundingClientRect();
  const areaRect = gameArea.getBoundingClientRect();
  offsetX = e.clientX - charRect.left;
  offsetY = e.clientY - charRect.top;

  e.preventDefault(); // 텍스트 선택 등 방지
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const areaRect = gameArea.getBoundingClientRect();

    // 게임 영역 기준 좌표 계산
    let x = e.clientX - areaRect.left - offsetX;
    let y = e.clientY - areaRect.top - offsetY;

    // 게임 영역 밖으로 나가지 않도록 제한
    x = Math.max(0, Math.min(x, gameArea.clientWidth - character.clientWidth));
    y = Math.max(0, Math.min(y, gameArea.clientHeight - character.clientHeight));

    // 캐릭터 위치 반영
    character.style.left = `${x}px`;
    character.style.top = `${y}px`;

    // 서버로 전송
    socket.emit('drag', { x, y });
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});
