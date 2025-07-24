
const gameArea = document.getElementById('gameArea');
const crosshair = document.getElementById('crosshair');
const target = document.getElementById('target');
const timeDisplay = document.getElementById('time');
const hitDisplay = document.getElementById('hit');
const shotsDisplay = document.getElementById('shots');
const accuracyDisplay = document.getElementById('accuracy');
const endMessage = document.getElementById('endMessage');
const restartBtn = document.getElementById('restartBtn');
const sensitivitySlider = document.getElementById('sensitivitySlider');
const modeLabel = document.getElementById('modeLabel');
const stats = document.getElementById('stats');
const hitSound = document.getElementById('hitSound');
const countdownSound = document.getElementById('countdownSound');

let mode = '';
let sensitivity = 1;
let crossX = 400;
let crossY = 300;
let hits = 0;
let shots = 0;
let timeLeft = 60;
let gameRunning = false;
let timer;
let trackingHits = 0;
let trackingTotal = 0;
let trackingLoop;

sensitivitySlider.addEventListener('input', (e) => {
  sensitivity = parseFloat(e.target.value);
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === gameArea) {
    document.addEventListener('mousemove', onMouseMove, false);
  } else {
    document.removeEventListener('mousemove', onMouseMove, false);
  }
});

function onMouseMove(e) {
  if (!gameRunning) return;
  const area = gameArea.getBoundingClientRect();
  crossX += e.movementX * sensitivity;
  crossY += e.movementY * sensitivity;

  crossX = Math.max(0, Math.min(crossX, area.width));
  crossY = Math.max(0, Math.min(crossY, area.height));

  crosshair.style.left = crossX + 'px';
  crosshair.style.top = crossY + 'px';
}

document.addEventListener('click', () => {
  if (!gameRunning || mode !== 'flick') return;
  shots++;
  const crossRect = crosshair.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const isHit = !(
    crossRect.right < targetRect.left ||
    crossRect.left > targetRect.right ||
    crossRect.bottom < targetRect.top ||
    crossRect.top > targetRect.bottom
  );

  if (isHit) {
    hits++;
    hitSound.play();
    moveTarget();
  }

  updateStats();
});

function startMode(selectedMode) {
  mode = selectedMode;
  modeLabel.textContent = mode.toUpperCase();
  sensitivity = parseFloat(sensitivitySlider.value);
  hits = 0;
  shots = 0;
  timeLeft = 60;
  trackingHits = 0;
  trackingTotal = 0;
  updateStats();

  document.getElementById('menu').style.display = 'none';
  gameArea.style.display = 'block';
  stats.style.display = 'block';
  crosshair.style.display = 'block';
  target.style.display = 'block';
  gameRunning = true;

  const area = gameArea.getBoundingClientRect();
  crossX = area.width / 2;
  crossY = area.height / 2;
  crosshair.style.left = crossX + 'px';
  crosshair.style.top = crossY + 'px';

  gameArea.requestPointerLock();

  if (mode === 'flick') moveTarget();
  if (mode === 'tracking') {
    startTrackingMovement();
    trackingLoop = requestAnimationFrame(trackingAnimationLoop);
  }

  timer = setInterval(() => {
    if (timeLeft <= 0) {
      endGame();
      return;
    }
    if (timeLeft <= 5) countdownSound.play();
    timeLeft--;
    timeDisplay.textContent = timeLeft;
  }, 1000);

  updateStats(); // 顯示分數標籤
}

// tracking 準星距離自動計分邏輯
function trackingAnimationLoop() {
  if (!gameRunning || mode !== 'tracking') return;

  const crossRect = crosshair.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const crossCenterX = crossRect.left + crossRect.width / 2;
  const crossCenterY = crossRect.top + crossRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  const dx = crossCenterX - targetCenterX;
  const dy = crossCenterY - targetCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 30) trackingHits++;
  trackingTotal++;

  // 即時顯示追蹤分數（命中時間/經過時間/命中率）
  if (mode === 'tracking') {
    let trackedSeconds = (trackingHits / 60).toFixed(1); // 60幀一秒
    let elapsedSeconds = (trackingTotal / 60).toFixed(1);
    accuracyDisplay.textContent = trackingTotal === 0 ? 0 : Math.round((trackingHits / trackingTotal) * 100);
    hitDisplay.textContent = trackedSeconds;
    shotsDisplay.textContent = elapsedSeconds;
  }

  trackingLoop = requestAnimationFrame(trackingAnimationLoop);
}

// 追蹤球移動
function startTrackingMovement() {
  let posX = 100;
  let direction = 1;
  setInterval(() => {
    if (!gameRunning || mode !== 'tracking') return;
    const areaWidth = gameArea.clientWidth;
    posX += 3 * direction;
    if (posX > areaWidth - 50 || posX < 0) direction *= -1;
    target.style.left = posX + 'px';
    target.style.top = '250px';
  }, 16);
}

// Flick 模式目標移動
function moveTarget() {
  const areaWidth = gameArea.clientWidth;
  const areaHeight = gameArea.clientHeight;
  const size = 50;

  const x = Math.random() * (areaWidth - size);
  const y = Math.random() * (areaHeight - size);

  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
}

function updateStats() {
  if (mode === 'flick') {
    hitDisplay.textContent = hits;
    shotsDisplay.textContent = shots;
    accuracyDisplay.textContent = shots === 0 ? 0 : Math.round((hits / shots) * 100);
  } else if (mode === 'tracking') {
    let trackedSeconds = (trackingHits / 60).toFixed(1);
    let elapsedSeconds = (trackingTotal / 60).toFixed(1);
    accuracyDisplay.textContent = trackingTotal === 0 ? 0 : Math.round((trackingHits / trackingTotal) * 100);
    hitDisplay.textContent = trackedSeconds;
    shotsDisplay.textContent = elapsedSeconds;
  }
}

// 結束遊戲與顯示最終追蹤分數
function endGame() {
  gameRunning = false;
  clearInterval(timer);
  if (trackingLoop) cancelAnimationFrame(trackingLoop);
  target.style.display = 'none';

  if (mode === 'flick') {
    endMessage.innerHTML = `🎯 Flick 模式結束！<br>命中率：${accuracyDisplay.textContent}%<br>命中次數：${hits} 次`;
  } else if (mode === 'tracking') {
    const percentage = trackingTotal > 0 ? Math.round((trackingHits / trackingTotal) * 100) : 0;
    endMessage.innerHTML = `🎯 Tracking 模式結束！<br>平均命中率：${percentage}%<br>(準星在球上總時間比例)`;
  }

  restartBtn.style.display = 'inline-block';
}


function saveHistory(record) {
  let all = JSON.parse(localStorage.getItem('trainerHistory')) || [];
  all.push(record);
  // 最多只留20筆
  if (all.length > 20) all = all.slice(all.length - 20);
  localStorage.setItem('trainerHistory', JSON.stringify(all));
}

function showHistory() {
  const endMessage = document.getElementById('endMessage');
  let all = JSON.parse(localStorage.getItem('trainerHistory')) || [];
  if (!all.length) return;

  // 最近 5 筆（倒序）
  let last5 = all.slice(-5).reverse();
  let html = "<hr><div style='text-align:left;'><b>最近訓練紀錄：</b><ul style='font-size:17px;padding-left:18px'>";
  last5.forEach(e => {
    let modeStr = e.mode === 'flick' ? 'Flick' : 'Tracking';
    let scoreStr = e.mode === 'flick'
      ? `命中${e.hits} 射擊${e.shots} 命中率${e.accuracy}%`
      : `命中率${e.accuracy}% 命中秒數${e.trackedSeconds}s`;
    html += `<li>${e.date} [${modeStr}] ${scoreStr}</li>`;
  });
  html += "</ul></div>";
  endMessage.innerHTML += html;
}

// 覆寫 endGame
const _endGame = endGame;
endGame = function() {
  gameRunning = false;
  clearInterval(timer);
  if (trackingLoop) cancelAnimationFrame(trackingLoop);
  target.style.display = 'none';
  let now = new Date();
  let dateStr = now.toLocaleString('zh-TW', { hour12: false });
  let record = { mode, date: dateStr };

  if (mode === 'flick') {
    record.hits = hits;
    record.shots = shots;
    record.accuracy = shots === 0 ? 0 : Math.round((hits / shots) * 100);
    endMessage.innerHTML = `
    <div style="font-size:30px;color:#00ffcc;margin-bottom:10px;">🎯 Flick 模式結束！</div>
    <div style="font-size:23px;">命中率：${record.accuracy}%<br>命中次數：${hits} / 射擊次數：${shots}</div>`;
  } else if (mode === 'tracking') {
    record.accuracy = trackingTotal > 0 ? Math.round((trackingHits / trackingTotal) * 100) : 0;
    record.trackedSeconds = (trackingHits/60).toFixed(1);
    endMessage.innerHTML = `
    <div style="font-size:30px;color:#00ffcc;margin-bottom:10px;">🎯 Tracking 模式結束！</div>
    <div style="font-size:23px;">平均命中率：${record.accuracy}%<br>追蹤命中時間：${record.trackedSeconds} 秒</div>`;
  }

  restartBtn.style.display = 'inline-block';
  saveHistory(record);
  showHistory();
}
