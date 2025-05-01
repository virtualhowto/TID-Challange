// Full patched script.js with name tracking and TID logic
let boxData = [], currentBox = null, guessCount = 0, commonTIDs = {};

async function loadData() {
  const boxRes = await fetch("data.json");
  const tidRes = await fetch("CommonTIDs.json");
  boxData = (await boxRes.json()).boxes;
  commonTIDs = await tidRes.json();
}
loadData();

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function startWithName() {
  const name = document.getElementById("playerName").value.trim();
  if (!name) {
    alert("Please enter your name");
    return;
  }
  localStorage.setItem("playerName", name);
  showScreen("start-screen");
}

function startChallenge() {
  const id = document.getElementById("boxIdInput").value.trim();
  loadChallenge(id);
}

function loadChallenge(boxId) {
  currentBox = boxData.find(b => b.id === boxId);
  guessCount = 0;
  if (!currentBox) {
    alert("Box not found!");
    return;
  }
  setupChoices();
  showScreen("guess-screen");
}

function setupChoices() {
  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";
  const hintButtons = document.getElementById("hint-buttons");
  hintButtons.classList.remove("hidden");
  document.querySelectorAll("#hint-buttons button").forEach(btn => btn.classList.add("hidden"));
  document.getElementById("hintVideo").src = "";
  document.getElementById("hint-container").classList.add("hidden");

  const options = [currentBox.name];
  while (options.length < 5) {
    const rand = boxData[Math.floor(Math.random() * boxData.length)].name;
    if (!options.includes(rand)) options.push(rand);
  }
  options.sort(() => Math.random() - 0.5);

  options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.onclick = () => checkGuess(option, btn);
    choicesDiv.appendChild(btn);
  });
}

function checkGuess(choice, button) {
  guessCount++;
  if (choice === currentBox.name) {
    document.getElementById("correctSound").play();
    document.getElementById("itemImage").src = currentBox.itemImage;
    document.getElementById("itemDescription").innerText = currentBox.description;
    saveResult(currentBox.id, guessCount);
    showScreen("success-screen");
  } else {
    document.getElementById("wrongSound").play();
    button.classList.add("shake");
    setTimeout(() => button.classList.remove("shake"), 500);

    if (guessCount === 1) {
      document.querySelector('button[onclick="showHint(1)"]').classList.remove("hidden");
    } else if (guessCount === 2) {
      document.querySelector('button[onclick="showHint(2)"]').classList.remove("hidden");
    } else if (guessCount === 3) {
      document.querySelector('button[onclick="selectDetectorModel()"]').classList.remove("hidden");
    }
  }
}

function showHint(number) {
  const video = document.getElementById("hintVideo");
  video.src = number === 1 ? currentBox.hint1 : currentBox.hint2;
  document.getElementById("hint-container").classList.remove("hidden");
}

function saveResult(boxId, guesses) {
  const name = localStorage.getItem("playerName") || "Anonymous";
  const results = JSON.parse(localStorage.getItem("results") || "[]");
  results.push({ boxId, guesses, name, time: new Date().toISOString() });
  localStorage.setItem("results", JSON.stringify(results));
}

function showLeaderboard() {
  const results = JSON.parse(localStorage.getItem("results") || "[]");
  results.sort((a, b) => a.guesses - b.guesses);
  const list = document.getElementById("leaderboardList");
  list.innerHTML = "";
  results.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.name} – Box ${r.boxId}: ${r.guesses} guess(es) – ${new Date(r.time).toLocaleString()}`;
    list.appendChild(li);
  });
  showScreen("leaderboard-screen");
}

function selectDetectorModel() {
  showScreen("model-screen");
  document.getElementById("tidResult").innerText = "";
}

function showTID(modelKey) {
  const key = currentBox.tidKey;
  const tid = commonTIDs[key]?.[modelKey];
  document.getElementById("tidResult").innerText = tid
    ? `Expected TID for ${modelKey.replace(/_/g, " ")}: ${tid}`
    : `No TID available for ${modelKey.replace(/_/g, " ")}`;
}

// Auto-load from URL param or start QR scan

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const boxId = params.get("box");

  if (boxId) {
    currentBox = boxData.find(b => b.id === boxId);
    guessCount = 0;
    if (currentBox) {
      setupChoices();
      showScreen("guess-screen");
    } else {
      alert("Box not found.");
    }
  } else {
    const qrScanner = new Html5Qrcode("qr-reader");
    qrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        qrScanner.stop();
        loadChallenge(decodedText.trim());
      },
      (errorMessage) => {}
    ).catch(err => {
      console.error("Camera error:", err);
      alert("Camera not found or denied. Enter Box ID manually.");
      document.getElementById("qr-reader").style.display = "none";
    });
  }
});
