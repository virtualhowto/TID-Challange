let boxData = {};
let currentBox = null;
let guessCount = 0;

async function loadBoxData() {
  const res = await fetch('data.json');
  const data = await res.json();
  boxData = data.boxes;
}
loadBoxData();

function startChallenge() {
  const boxId = document.getElementById('boxIdInput').value.trim();
  loadChallenge(boxId);
}

function loadChallenge(boxId) {
  currentBox = boxData.find(box => box.id === boxId);
  guessCount = 0;
  if (!currentBox) {
    alert('Box not found!');
    return;
  }
  showScreen('guess-screen');
  setupChoices();
}

function setupChoices() {
  const choicesDiv = document.getElementById('choices');
  const hintButtons = document.getElementById('hint-buttons');
  const hintContainer = document.getElementById('hint-container');
  const hintVideo = document.getElementById('hintVideo');
  choicesDiv.innerHTML = "";
  hintButtons.classList.add('hidden');
  hintContainer.classList.add('hidden');
  hintVideo.src = "";

  const options = [currentBox.name];
  while (options.length < 5) {
    const rand = boxData[Math.floor(Math.random() * boxData.length)].name;
    if (!options.includes(rand)) options.push(rand);
  }
  options.sort(() => Math.random() - 0.5); // shuffle

  options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.className = "choice";
    btn.onclick = () => checkGuess(option, btn);
    choicesDiv.appendChild(btn);
  });
}

function checkGuess(selected, button) {
  guessCount++;
  if (selected === currentBox.name) {
    document.getElementById('correctSound').play();
    document.getElementById('itemImage').src = currentBox.itemImage;
    document.getElementById('itemDescription').textContent = currentBox.description;
    saveResult(currentBox.id, guessCount);
    showScreen('success-screen');
  } else {
    document.getElementById('wrongSound').play();
    button.classList.add('shake');
    setTimeout(() => button.classList.remove('shake'), 500);

    if (guessCount === 1) {
      document.getElementById('hint-buttons').classList.remove('hidden');
    }
  }
}

function showHint(number) {
  const hintContainer = document.getElementById('hint-container');
  const hintVideo = document.getElementById('hintVideo');
  hintContainer.classList.remove('hidden');
  hintVideo.src = number === 1 ? currentBox.hint1 : currentBox.hint2;
}

function saveResult(boxId, guesses) {
  const results = JSON.parse(localStorage.getItem('results')) || [];
  results.push({ boxId, guesses, time: new Date().toISOString() });
  localStorage.setItem('results', JSON.stringify(results));
}

function showLeaderboard() {
  const results = JSON.parse(localStorage.getItem('results')) || [];
  results.sort((a, b) => a.guesses - b.guesses);
  const list = document.getElementById('leaderboardList');
  list.innerHTML = '';
  results.forEach(result => {
    const li = document.createElement('li');
    li.textContent = `Box ${result.boxId}: ${result.guesses} guesses – ${new Date(result.time).toLocaleString()}`;
    list.appendChild(li);
  });
  showScreen('leaderboard-screen');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById(id).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const qrScanner = new Html5Qrcode("qr-reader");
  qrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    qrCodeMessage => {
      qrScanner.stop();
      loadChallenge(qrCodeMessage.trim());
    },
    errorMessage => {}
  ).catch(err => console.error(err));
});
