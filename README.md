# Gesture Arena — AI Rock Paper Scissors

A browser game controlled by hand gestures using MediaPipe Hand Landmarker.

## Features
- Live webcam hand tracking
- Rock, paper, scissors gesture recognition
- Random AI opponent
- Scoreboard and round results
- Manual buttons for testing without a camera
- Camera video is processed in your browser; this project does not upload or record it

## Requirements
- A modern version of Chrome or Edge
- Webcam
- Internet connection for the MediaPipe library and model on first load

## Run on Windows (beginner steps)

1. Download and extract `ai-gesture-rps.zip`.
2. Open the extracted `ai-gesture-rps` folder.
3. Open the folder in VS Code (File → Open Folder).
4. Install the **Live Server** extension by Ritwick Dey in VS Code.
5. Right-click `index.html` and choose **Open with Live Server**.
6. Your browser opens a local address similar to `http://127.0.0.1:5500`.
7. Click **Enable camera**, then choose **Allow** when Chrome asks for camera permission.
8. Hold one hand in the camera view:
   - Rock: close your fingers into a fist
   - Paper: open all four fingers
   - Scissors: raise index and middle fingers; fold ring and little fingers
9. Hold the gesture steady for about one second. The AI will choose a move.

## Alternative: Python local server

If Python is installed:
1. Open Command Prompt inside the extracted project folder.
2. Run: `python -m http.server 8000`
3. Visit `http://localhost:8000` in Chrome.

## Troubleshooting
- **Camera button does nothing:** use `localhost` or `127.0.0.1`, not a file:// URL. Allow camera permission in the browser address bar.
- **No hand detected:** improve lighting, keep one hand fully visible, and move it slightly farther from the camera.
- **Model does not load:** check your internet connection; MediaPipe assets are loaded from public CDNs.
- **Gesture recognition is imperfect:** the simple classifier uses finger positions and may need tuning for different camera angles or hands.

## Project files
- `index.html` — page structure
- `style.css` — gaming interface and responsive layout
- `script.js` — webcam, MediaPipe hand tracking, gesture classification, and game logic

## Note
This is a learning project. The AI opponent currently makes a random move; hand tracking and gesture recognition are performed by MediaPipe in the browser.
