'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('.score');
const curScoreEl = document.querySelector('.current-score');
const settingsBtn = document.querySelector('.settings__btn');
const closeBtn = document.querySelector('.close-btn');
const overlay = document.querySelector('.overlay');
const settingsWindow = document.querySelector('.settings__window');
const yearEl = document.getElementById('year');

const SIZE = 20;
const INITIAL_TILES = 4;

let snake,
  moved,
  curScore,
  movement,
  appleX,
  appleY,
  blocksArr,
  snakeX,
  snakeY,
  head,
  tail,
  moveSnakeInterval,
  currentScore,
  snakeFlickerInterval;
let score = 0;
let fieldSize = 400;
let speed = 100;
let gameMode = 'regular';

canvas.width = fieldSize;
canvas.height = fieldSize;

const generateSnake = function () {
  snakeX = canvas.width / 2;
  snakeY = canvas.height / 2;

  for (let i = 0; i < INITIAL_TILES; i++) {
    snake.unshift({ x: snakeX, y: snakeY - i * SIZE });
  }

  head = snake.at(-1);
  tail = snake[0];
};

const drawSnake = function () {
  snake.forEach(tile => {
    ctx.beginPath();
    ctx.rect(tile.x, tile.y, SIZE, SIZE);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.closePath();
  });
};

const generateAppleCoords = function () {
  while (
    snake.some(tile => tile.x === appleX && tile.y === appleY) ||
    appleX % SIZE !== 0 ||
    appleY % SIZE !== 0 ||
    blocksArr.some(block => block.x === appleX && block.y === appleY)
  ) {
    appleX = Math.round(Math.random() * (canvas.width - SIZE));
    appleY = Math.round(Math.random() * (canvas.height - SIZE));
  }
};

const drawApple = function () {
  ctx.beginPath();
  ctx.rect(appleX, appleY, SIZE, SIZE);
  ctx.fillStyle = 'red';
  ctx.fill();
  ctx.closePath();
};

const clearCanvas = function () {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const addHandlerControlSnake = function (handler) {
  document.addEventListener('keydown', handler);
};

const generateBlockCoords = function () {
  let blockX, blockY;
  while (
    snake.some(tile => tile.x === blockX && tile.y === blockY) ||
    blockX % SIZE !== 0 ||
    blockY % SIZE !== 0 ||
    blockX === appleX ||
    blockY === appleY ||
    (movement.dir === 'y' &&
      movement.sign === '+' &&
      blockX === head.x &&
      blockY === head.y + SIZE) ||
    (movement.dir === 'y' &&
      movement.sign === '-' &&
      blockX === head.x &&
      blockY === head.y - SIZE) ||
    (movement.dir === 'x' &&
      movement.sign === '+' &&
      blockX === head.x + SIZE &&
      blockY === head.y) ||
    (movement.dir === 'x' &&
      movement.sign === '-' &&
      blockX === head.x - SIZE &&
      blockY === head.y)
  ) {
    blockX = Math.round(Math.random() * (canvas.width - SIZE));
    blockY = Math.round(Math.random() * (canvas.height - SIZE));
  }
  blocksArr.push({ x: blockX, y: blockY });
};

const drawBlocks = function () {
  blocksArr.forEach(block => {
    ctx.beginPath();
    ctx.rect(block.x, block.y, SIZE, SIZE);
    ctx.fillStyle = 'grey';
    ctx.fill();
    ctx.closePath();
  });
};

const controlSnake = function (e) {
  if (!moved) return;
  if (e.key === 'ArrowDown') {
    if (movement.dir === 'y' && movement.sign === '-') return;
    movement.dir = 'y';
    movement.sign = '+';
  }
  if (e.key === 'ArrowUp') {
    if (movement.dir === 'y' && movement.sign === '+') return;
    movement.dir = 'y';
    movement.sign = '-';
  }
  if (e.key === 'ArrowRight') {
    if (movement.dir === 'x' && movement.sign === '-') return;
    movement.dir = 'x';
    movement.sign = '+';
  }
  if (e.key === 'ArrowLeft') {
    if (movement.dir === 'x' && movement.sign === '+') return;
    movement.dir = 'x';
    movement.sign = '-';
  }
  moved = false;
};

const collisionDetectionRegular = function () {
  if (
    head.x < 0 ||
    head.x + SIZE > canvas.width ||
    head.y < 0 ||
    head.y + SIZE > canvas.height ||
    snake.some(
      (tile, i) =>
        head.x === tile.x && head.y === tile.y && i !== snake.indexOf(head)
    )
  ) {
    clearInterval(moveSnakeInterval);
    score = curScore > score ? curScore : score;
    scoreEl.textContent = score;
    alert(`You lost! Score: ${curScore}`);
    init();
    return;
  }
};

const collisionDetectionNoWalls = function () {
  if (
    snake.some(
      (tile, i) =>
        head.x === tile.x && head.y === tile.y && i !== snake.indexOf(head)
    )
  ) {
    clearInterval(moveSnakeInterval);
    score = curScore > score ? curScore : score;
    scoreEl.textContent = score;
    alert(`You lost! Score: ${curScore}`);
    init();
    return;
  }

  if (head.x < 0) {
    head.x = canvas.width - SIZE;
  }
  if (head.x + SIZE > canvas.width) {
    head.x = 0;
  }
  if (head.y < 0) {
    head.y = canvas.height - SIZE;
  }
  if (head.y + SIZE > canvas.height) {
    head.y = 0;
  }
};

const collisionDetectionBlocks = function () {
  if (
    head.x < 0 ||
    head.x + SIZE > canvas.width ||
    head.y < 0 ||
    head.y + SIZE > canvas.height ||
    snake.some(
      (tile, i) =>
        head.x === tile.x && head.y === tile.y && i !== snake.indexOf(head)
    ) ||
    blocksArr.some(block => head.x === block.x && head.y === block.y)
  ) {
    clearInterval(moveSnakeInterval);
    score = curScore > score ? curScore : score;
    scoreEl.textContent = score;
    alert(`You lost! Score: ${curScore}`);
    init();
    return;
  }
};

const moveSnake = function () {
  // Clear
  clearCanvas();

  const tailX = tail.x;
  const tailY = tail.y;

  // Change snake's coordinates
  snake.forEach((tile, i) => {
    if (i === snake.indexOf(head)) return;
    tile.y = snake[i + 1].y;
    tile.x = snake[i + 1].x;
  });
  head[movement.dir] =
    movement.sign === '+'
      ? head[movement.dir] + SIZE
      : head[movement.dir] - SIZE;

  // Eat apples
  if (head.x === appleX && head.y === appleY) {
    curScore++;
    curScoreEl.textContent = curScore;
    generateAppleCoords();
    snake.unshift({ tailX, tailY });
    if (gameMode === 'blocks') {
      generateBlockCoords();
    }
  }

  // Collision detection
  if (gameMode === 'regular') collisionDetectionRegular();
  if (gameMode === 'no-walls') collisionDetectionNoWalls();
  if (gameMode === 'blocks') collisionDetectionBlocks();

  drawSnake();
  drawApple();
  if (gameMode === 'blocks') {
    drawBlocks();
  }

  moved = true;
};

const snakeFlicker = function () {
  clearCanvas();
  setTimeout(drawSnake, 500);
};

const openWindow = function () {
  settingsWindow.classList.remove('hidden');
  overlay.classList.remove('hidden');
};

const closeWindow = function () {
  settingsWindow.classList.add('hidden');
  overlay.classList.add('hidden');
};

const selectSize = function (e) {
  if (!e.target.classList.contains('option-btn--size')) return;
  fieldSize = e.target.dataset.size;
  canvas.width = fieldSize;
  canvas.height = fieldSize;
  snakeX = snakeY = undefined;
  snake = [];
  generateSnake();
  this.querySelectorAll('.option-btn--size').forEach(btn =>
    btn.classList.remove('option-btn--fill')
  );
  e.target.classList.add('option-btn--fill');
};

const selectSpeed = function (e) {
  if (!e.target.classList.contains('option-btn--speed')) return;
  speed = e.target.dataset.speed;
  this.querySelectorAll('.option-btn--speed').forEach(btn =>
    btn.classList.remove('option-btn--fill')
  );
  e.target.classList.add('option-btn--fill');
};

const selectGameMode = function (e) {
  if (!e.target.classList.contains('option-btn--mode')) return;
  gameMode = e.target.dataset.mode;
  this.querySelectorAll('.option-btn--mode').forEach(btn =>
    btn.classList.remove('option-btn--fill')
  );
  e.target.classList.add('option-btn--fill');
};

const initHandler = function (e) {
  if (
    e.key !== 'ArrowUp' &&
    e.key !== 'ArrowDown' &&
    e.key !== 'ArrowLeft' &&
    e.key !== 'ArrowRight'
  )
    return;

  clearInterval(snakeFlickerInterval);
  document.removeEventListener('keydown', initHandler);
  settingsBtn.removeEventListener('click', openWindow);
  drawSnake();
  generateAppleCoords();
  drawApple();
  moveSnakeInterval = setInterval(moveSnake, speed);
  addHandlerControlSnake(controlSnake);
};

const setYear = function () {
  const date = new Date();
  const fullYear = date.getFullYear();
  yearEl.textContent = fullYear;
};

const init = function () {
  (movement = {
    dir: 'y',
    sign: '+',
  }),
    (curScore = 0);
  moved = true;
  curScoreEl.textContent = curScore;
  snake = [];
  blocksArr = [];
  appleX = appleY = undefined;

  generateSnake();
  snakeFlicker();
  snakeFlickerInterval = setInterval(snakeFlicker, 1000);
  document.removeEventListener('keydown', controlSnake);
  document.addEventListener('keydown', initHandler);

  settingsWindow.addEventListener('click', selectSize);
  settingsWindow.addEventListener('click', selectSpeed);
  settingsWindow.addEventListener('click', selectGameMode);

  settingsBtn.addEventListener('click', openWindow);
  closeBtn.addEventListener('click', closeWindow);
  overlay.addEventListener('click', closeWindow);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeWindow();
  });
};
init();
setYear();
