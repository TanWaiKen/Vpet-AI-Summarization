# AiPaw - Virtual Pet & Smart Notes Chrome Extension

## 🐾 Overview

- AiPaw is a Chrome extension that creates a virtual pet on your browser while tracking your browsing content in real-time to generate useful notes. The AI-powered pet interacts with users, detects webpage changes, and asks if you need notes. If not, it clears its memory. Additionally, it can recognize text from images and process it through NLP to generate structured notes.

## 🛠️ How It Works

1. The virtual pet appears on your screen.
2. It analyzes the webpage content and determines if notes should be generated.
3. If an image contains text, it extracts it and processes it with NLP.
4. If the user changes the webpage, it asks whether to save notes or clear memory.

## 📜 Manifest.json (Chrome Extension Configuration)
- The manifest.json file is the blueprint of a Chrome extension, defining its settings, permissions, and functionality.

- "manifest_version": 3 – Uses the latest and most secure Chrome extension version.
- "action" – Defines the popup UI (index.html).
- "permissions" – Grants required access for content tracking and camera usage.
<<<<<<< Updated upstream
=======


## Python
1. pip install flask flask-cors transformers torch python-dotenv google-generativeai
>>>>>>> Stashed changes
