let boxData = [], currentBox = null, guessCount = 0, commonTIDs = {};

async function loadData() {
  const boxRes = await fetch("data.json");
  const tidRes = await fetch("CommonTIDs.json");
  boxData = (await boxRes.json()).boxes;
  commonTIDs = await tidRes.json();
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
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

function checkGuess(choice, button) {
  guessCount++;
  if (choice === currentBox.description) {
  document.getElementById("correctSound")?.play();
  document.getElementById("itemImage").src = currentBox.itemImage;
  document.getElementById("itemDescription").innerText = currentBox.description;
  saveResult(currentBox.id, guessCount);
  document.getElementById("winModal").classList.remove("hidden");
}
  } else {
    document.getElementById("wrongSound")?.play();
    button.classList.add("shake");
    setTimeout(() => button.classList.remove("shake"), 500);

       if (guessCount === 1) {
      document.querySelector('button[onclick="showHint(1)"]').classList.remove("hidden");
    } else if (guessCount === 2) {
      document.querySelector('button[onclick="showHint(2)"]').classList.remove("hidden");
    } else if (guessCount === 3) {
      document.querySelector('button[onclick="showTID()"]').classList.remove("hidden");
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
  const model = localStorage.getItem("detectorModel") || "Unknown";
  fetch("https://sheetdb.io/api/v1/feed8u4d3akfc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{ name, boxId, guesses: String(guesses), model, time: new Date().toISOString() }]
    })
  });
}

function showLeaderboard() {
  fetch("https://sheetdb.io/api/v1/feed8u4d3akfc")
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("leaderboardList");
      list.innerHTML = "";
      data.sort((a, b) => parseInt(a.guesses) - parseInt(b.guesses));
      data.forEach(r => {
        const time = r.time ? new Date(r.time).toLocaleString() : "";
        const li = document.createElement("li");
        li.textContent = `${r.name} – Box ${r.boxId}: ${r.guesses} guess(es) – ${time}`;
        list.appendChild(li);
      });
      showScreen("leaderboard-screen");
    })
    .catch(err => {
      console.error("Leaderboard fetch error:", err);
      alert("Could not load leaderboard.");
    });
}

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

// ✅ New: Button-based QR/code selection
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

function closeWinModal() {
  document.getElementById("winModal").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();

  const name = localStorage.getItem("playerName");
  const model = localStorage.getItem("detectorModel");
  if (!name || !model) {
    alert("Missing player information. Redirecting...");
    window.location.href = "index.html";
    return;
  }

  showScreen("choose-box-screen"); // ✅ now runs after the function is defined
});
