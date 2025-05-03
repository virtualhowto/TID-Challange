let boxData = [], currentBox = null, guessCount = 0, commonTIDs = {};

// Load both data files
async function loadData() {
  const boxRes = await fetch("data.json");
  const tidRes = await fetch("CommonTIDs.json");
  boxData = (await boxRes.json()).boxes;
  commonTIDs = await tidRes.json();
}

// Toggle screen visibility
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id)?.classList.remove("hidden");
}

// Start with manually entered Box ID
function startChallenge() {
  const id = document.getElementById("boxIdInput").value.trim();
  loadChallenge(id);
}

// Load challenge data for a box
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

// Setup guess options
function setupChoices() {
  const choicesDiv = document.getElementById("choices");
  const hintButtons = document.getElementById("hint-buttons");

  if (!choicesDiv || !hintButtons) {
    console.error("Missing required elements for challenge UI.");
    return;
  }

  choicesDiv.innerHTML = "";
  hintButtons.classList.remove("hidden");
  document.querySelectorAll("#hint-buttons button").forEach(btn => btn.classList.add("hidden"));

  const options = [currentBox.description];
  while (options.length < 5) {
    const rand = boxData[Math.floor(Math.random() * boxData.length)].description;
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

// Process guess
function checkGuess(choice, button) {
  guessCount++;

  if (choice === currentBox.description) {
    document.getElementById("correctSound")?.play();
    document.getElementById("itemImage").src = currentBox.itemImage;
    document.getElementById("itemDescription").innerText = currentBox.description;
    saveResult(currentBox.id, guessCount);
    document.getElementById("winModal").classList.remove("hidden");
  } else {
    document.getElementById("wrongSound")?.play();
    button.classList.add("shake");
    setTimeout(() => button.classList.remove("shake"), 500);

    if (guessCount === 1) {
      document.querySelector('button[onclick="showHint(1)"]')?.classList.remove("hidden");
    } else if (guessCount === 2) {
      document.querySelector('button[onclick="showHint(2)"]')?.classList.remove("hidden");
    } else if (guessCount === 3) {
      document.querySelector('button[onclick="showTID()"]')?.classList.remove("hidden");
    }
  }
}

// Show hint video in modal
function showHint(number) {
  const video = document.getElementById("hintVideo");
  video.src = number === 1 ? currentBox.hint1 : currentBox.hint2;
  document.getElementById("hintModal").classList.remove("hidden");
}
function closeHintModal() {
  const modal = document.getElementById("hintModal");
  const video = document.getElementById("hintVideo");
  video.pause();
  video.currentTime = 0;
  modal.classList.add("hidden");
}

// Close win modal
function closeWinModal() {
  document.getElementById("winModal").classList.add("hidden");
}

// Submit result to SheetDB
function saveResult(boxId, guesses) {
  const name = localStorage.getItem("playerName") || "Anonymous";
  const model = localStorage.getItem("detectorModel") || "Unknown";
  const timestamp = new Date().toISOString();

  fetch("https://sheetdb.io/api/v1/feed8u4d3akfc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        Timestamp: timestamp,
        Name: name,
        BoxID: boxId,
        Guesses: String(guesses),
        detectorModel: model
      }]
    })
  });
}

// Load leaderboard from SheetDB
function showLeaderboard() {
  fetch("https://sheetdb.io/api/v1/feed8u4d3akfc")
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("leaderboardList");
      list.innerHTML = "";
      data.sort((a, b) => parseInt(a.Guesses) - parseInt(b.Guesses));
      data.forEach(r => {
        const time = r.Timestamp ? new Date(r.Timestamp).toLocaleString() : "";
        const li = document.createElement("li");
        li.textContent = `${r.Name} – Box ${r.BoxID}: ${r.Guesses} guess(es) – ${time}`;
        list.appendChild(li);
      });
      showScreen("leaderboard-screen");
    })
    .catch(err => {
      console.error("Leaderboard fetch error:", err);
      alert("Could not load leaderboard.");
    });
}

// Show expected TID modal
function showTID() {
  const modelKey = localStorage.getItem("detectorModel");
  const key = currentBox.tidKey;
  const tid = commonTIDs[key]?.[modelKey];
  document.getElementById("tidResult").innerText = tid
    ? `Expected TID for ${modelKey.replace(/_/g, " ")}: ${tid}`
    : `No TID available for ${modelKey.replace(/_/g, " ")}`;
  document.getElementById("tidModal").classList.remove("hidden");
}
function closeTIDModal() {
  document.getElementById("tidModal").classList.add("hidden");
}

// Show manual entry or QR scanner
function showBoxIdInput() {
  showScreen("start-screen");
  document.getElementById("qr-reader").style.display = "none";
}
function startQRScanner() {
  showScreen("start-screen");
  const qrReader = document.getElementById("qr-reader");
  qrReader.style.display = "block";

  Html5Qrcode.getCameras().then(cameras => {
    if (cameras.length > 0) {
      const scanner = new Html5Qrcode("qr-reader");
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          scanner.stop();
          loadChallenge(decodedText.trim());
        }
      );
    } else {
      qrReader.style.display = "none";
      alert("No camera found. You can enter the Box ID manually.");
    }
  }).catch(err => {
    console.error("QR Scanner Error:", err);
    qrReader.style.display = "none";
    alert("Camera not available. Use Box ID instead.");
  });
}

// Ensure DOM is ready before anything runs
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();

  const name = localStorage.getItem("playerName");
  const model = localStorage.getItem("detectorModel");

  if (!name || !model) {
    alert("Missing player information. Redirecting...");
    window.location.href = "index.html";
    return;
  }

  showScreen("choose-box-screen");
});
