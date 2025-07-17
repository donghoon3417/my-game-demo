const socket = io();
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// 캔버스 사이즈 설정
canvas.width = 500;
canvas.height = 400;

const sprite = new Image();
sprite.src = '/images/anim1.png';// 실제 경로 확인 필요

let frameIndex = 0;
let tickCount = 0;
let ticksPerFrame = 6;
const frameWidth = 50;
const frameHeight = 50;
const numberOfFrames = 4;

let characterX = 100;
let characterY = 100;
let currentDirection = 'right';
let isMoving = false;

const keys = new Set();
const speed = 5;

function drawFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  if (currentDirection === 'left') {
    ctx.translate(characterX + frameWidth / 2, characterY);
    ctx.scale(-1, 1);
    ctx.translate(-characterX - frameWidth / 2, -characterY);
  }

  ctx.drawImage(
    sprite,
    frameIndex * frameWidth, 0,
    frameWidth, frameHeight,
    characterX, characterY,
    frameWidth, frameHeight
  );

  ctx.restore();
}

function updateFrame() {
  if (isMoving) {
    tickCount++;
    if (tickCount > ticksPerFrame) {
      tickCount = 0;
      frameIndex = (frameIndex + 1) % numberOfFrames;
    }
  } else {
    frameIndex = 0;
  }
}

function moveCharacter() {
  let dx = 0, dy = 0;

  // ❗ 좌우 반전 처리
  if (keys.has('ArrowLeft')) dx += speed;   // 왼쪽 키 누르면 오른쪽으로
  if (keys.has('ArrowRight')) dx -= speed;  // 오른쪽 키 누르면 왼쪽으로
  if (keys.has('ArrowUp')) dy -= speed;
  if (keys.has('ArrowDown')) dy += speed;

  if (dx !== 0 || dy !== 0) {
    characterX = Math.max(0, Math.min(characterX + dx, canvas.width - frameWidth));
    characterY = Math.max(0, Math.min(characterY + dy, canvas.height - frameHeight));
    isMoving = true;
    
    if (dx > 0) currentDirection = 'right'; // 반대 처리
    if (dx < 0) currentDirection = 'left';

    socket.emit('drag', {
      x: (characterX + frameWidth / 2) / canvas.width,
      y: (characterY + frameHeight / 2) / canvas.height,
      direction: currentDirection
    });
  } else {
    isMoving = false;
  }
}

function loop() {
  moveCharacter();
  updateFrame();
  drawFrame();
  requestAnimationFrame(loop);
}

sprite.onload = loop;

document.addEventListener('keydown', (e) => keys.add(e.key));
document.addEventListener('keyup', (e) => keys.delete(e.key));

// ❗ 모바일이나 타 클라이언트에서도 실시간 반영
socket.on('position', (data) => {
  const x = data.x * canvas.width - frameWidth / 2;
  const y = data.y * canvas.height - frameHeight / 2;
  characterX = x;
  characterY = y;
  currentDirection = data.direction || 'right';
  drawFrame(); // 실시간 반영
});
