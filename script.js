import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const video = document.querySelector("#webcam");
const canvas = document.querySelector("#overlay");
const ctx = canvas.getContext("2d");
const startBtn = document.querySelector("#startCamera");
const stopBtn = document.querySelector("#stopCamera");
const placeholder = document.querySelector("#cameraPlaceholder");
const gestureChip = document.querySelector("#gestureChip");
const cameraState = document.querySelector("#cameraState");

const playerScoreEl = document.querySelector("#playerScore");
const aiScoreEl = document.querySelector("#aiScore");
const playerMoveEl = document.querySelector("#playerMove");
const aiMoveEl = document.querySelector("#aiMove");
const playerMoveText = document.querySelector("#playerMoveText");
const aiMoveText = document.querySelector("#aiMoveText");
const resultTitle = document.querySelector("#resultTitle");
const resultMessage = document.querySelector("#resultMessage");
const resultBox = document.querySelector("#resultBox");
const statusText = document.querySelector("#statusText");
const roundLabel = document.querySelector("#roundLabel");

const emoji = { rock: "✊", paper: "✋", scissors: "✌️" };
let handLandmarker = null;
let stream = null;
let running = false;
let lastVideoTime = -1;
let playerScore = 0, aiScore = 0, round = 1;
let candidate = "", candidateSince = 0, lastRoundAt = 0;
const HOLD_MS = 900;
const COOLDOWN_MS = 2200;

async function createHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  });
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);

async function startCamera() {
  startBtn.disabled = true;
  startBtn.textContent = "Starting...";
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera access needs HTTPS or localhost. Open this project using the local server instructions.");
    }
    statusText.textContent = "LOADING AI MODEL";
    if (!handLandmarker) handLandmarker = await createHandLandmarker();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    running = true;
    placeholder.style.display = "none";
    startBtn.textContent = "Camera enabled";
    startBtn.disabled = true;
    stopBtn.disabled = false;
    cameraState.textContent = "CAMERA LIVE";
    cameraState.style.color = "#5ce6a6";
    statusText.textContent = "SHOW YOUR HAND";
    requestAnimationFrame(detectLoop);
  } catch (error) {
    console.error(error);
    statusText.textContent = "CAMERA SETUP NEEDED";
    resultTitle.textContent = "Could not start camera";
    resultMessage.textContent = error.message || "Please allow camera permission and try again.";
    startBtn.disabled = false;
    startBtn.textContent = "Try again";
  }
}

function stopCamera() {
  running = false;
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  video.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  placeholder.style.display = "flex";
  gestureChip.textContent = "✋ Waiting for hand...";
  cameraState.textContent = "CAMERA OFF";
  cameraState.style.color = "";
  startBtn.disabled = false;
  startBtn.textContent = "Enable camera";
  stopBtn.disabled = true;
  statusText.textContent = "READY TO PLAY";
}

function fingerIsUp(landmarks, tip, pip) {
  // In the mirrored preview, compare vertical positions for the four fingers.
  return landmarks[tip].y < landmarks[pip].y - 0.025;
}

function classifyGesture(landmarks) {
  const index = fingerIsUp(landmarks, 8, 6);
  const middle = fingerIsUp(landmarks, 12, 10);
  const ring = fingerIsUp(landmarks, 16, 14);
  const pinky = fingerIsUp(landmarks, 20, 18);
  const count = [index, middle, ring, pinky].filter(Boolean).length;

  // The thumb is deliberately not required, making the gestures easier to detect.
  if (count === 0) return "rock";
  if (count >= 4) return "paper";
  if (index && middle && !ring && !pinky) return "scissors";
  return "unknown";
}

function detectLoop() {
  if (!running) return;
  if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
    lastVideoTime = video.currentTime;
    const results = handLandmarker.detectForVideo(video, performance.now());
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (results.landmarks?.length) {
      const points = results.landmarks[0];
      drawHand(points);
      const gesture = classifyGesture(points);
      if (gesture === "unknown") {
        gestureChip.textContent = "🤚 Try rock, paper or scissors";
        candidate = "";
      } else {
        gestureChip.textContent = `${emoji[gesture]} ${gesture.toUpperCase()} detected`;
        trackGesture(gesture);
      }
    } else {
      gestureChip.textContent = "✋ Show one hand to camera";
      candidate = "";
    }
  }
  requestAnimationFrame(detectLoop);
}

function drawHand(points) {
  const connections = [
    [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],
    [13,17],[17,18],[18,19],[19,20],[0,17]
  ];
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#54e6e1";
  for (const [a,b] of connections) {
    ctx.beginPath();
    ctx.moveTo(points[a].x * canvas.width, points[a].y * canvas.height);
    ctx.lineTo(points[b].x * canvas.width, points[b].y * canvas.height);
    ctx.stroke();
  }
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#a18bff";
    ctx.fill();
  }
}

function trackGesture(gesture) {
  const now = Date.now();
  if (now - lastRoundAt < COOLDOWN_MS) return;
  if (candidate !== gesture) {
    candidate = gesture;
    candidateSince = now;
    statusText.textContent = `HOLD ${gesture.toUpperCase()}`;
    return;
  }
  if (now - candidateSince >= HOLD_MS) {
    playRound(gesture);
    lastRoundAt = now;
    candidate = "";
  }
}

function playRound(playerMove) {
  const moves = ["rock", "paper", "scissors"];
  const aiMove = moves[Math.floor(Math.random() * moves.length)];
  let outcome;
  if (playerMove === aiMove) outcome = "draw";
  else if (
    (playerMove === "rock" && aiMove === "scissors") ||
    (playerMove === "paper" && aiMove === "rock") ||
    (playerMove === "scissors" && aiMove === "paper")
  ) outcome = "win";
  else outcome = "lose";

  if (outcome === "win") playerScore++;
  if (outcome === "lose") aiScore++;
  updateScore();
  showMoves(playerMove, aiMove);
  roundLabel.textContent = `ROUND ${String(round).padStart(2, "0")}`;
  round++;

  if (outcome === "win") {
    resultTitle.textContent = "You win this round!";
    resultMessage.textContent = `${playerMove} beats ${aiMove}. Great move!`;
    resultBox.style.borderColor = "rgba(92,230,166,.4)";
    statusText.textContent = "PLAYER WINS ROUND";
  } else if (outcome === "lose") {
    resultTitle.textContent = "AI wins this round";
    resultMessage.textContent = `${aiMove} beats ${playerMove}. Try again!`;
    resultBox.style.borderColor = "rgba(255,130,150,.4)";
    statusText.textContent = "AI WINS ROUND";
  } else {
    resultTitle.textContent = "It's a draw!";
    resultMessage.textContent = `You both chose ${playerMove}. Have another go.`;
    resultBox.style.borderColor = "rgba(155,131,255,.4)";
    statusText.textContent = "DRAW ROUND";
  }
}

function showMoves(player, ai) {
  playerMoveEl.textContent = emoji[player];
  aiMoveEl.textContent = emoji[ai];
  playerMoveText.textContent = player.toUpperCase();
  aiMoveText.textContent = ai.toUpperCase();
}

function updateScore() {
  playerScoreEl.textContent = playerScore;
  aiScoreEl.textContent = aiScore;
}

document.querySelectorAll(".move-btn").forEach(button => {
  button.addEventListener("click", () => {
    playRound(button.dataset.move);
    lastRoundAt = Date.now();
  });
});

document.querySelector("#resetGame").addEventListener("click", () => {
  playerScore = 0; aiScore = 0; round = 1;
  updateScore();
  roundLabel.textContent = "ROUND 01";
  playerMoveEl.textContent = "✊";
  aiMoveEl.textContent = "🤖";
  playerMoveText.textContent = "—";
  aiMoveText.textContent = "READY";
  resultTitle.textContent = "Show a gesture!";
  resultMessage.textContent = "Rock, paper, or scissors. Hold it steady to play.";
  resultBox.style.borderColor = "";
  statusText.textContent = running ? "SHOW YOUR HAND" : "READY TO PLAY";
  lastRoundAt = 0;
});
