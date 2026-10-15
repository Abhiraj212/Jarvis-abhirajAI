# J.A.R.V.I.S. v3

A lightweight, mobile-friendly, offline-first personal assistant built with plain HTML, CSS and JavaScript. No build step, package manager, server or account is required for local commands.

## Features
- Responsive dark/light interface for phones and desktops.
- Persistent chat, notes, reminders and explicit personal memory using browser localStorage.
- Local commands for time/date, name, memory, notes, reminders, jokes and safe arithmetic.
- Speech synthesis and optional browser speech recognition when supported.
- Optional OpenRouter chat for open-ended questions. Disabled by default; the key is stored in this browser's localStorage and is never included in source files.
- JSON export/import for personal data.
- Service worker for caching the app when hosted on HTTPS, such as GitHub Pages.

## Run it
1. Open the repository's GitHub Pages URL, or serve the folder from a local static server.
2. On first visit, open Settings and set your preferred name and voice language.
3. Type a message, or tap the microphone if your browser supports speech recognition.
4. Try commands: "remember that I like electronics", "what do you remember?", "note buy jumper wires", "remind me to check the project in 2 hours", "calculate (12 + 8) * 3".
5. Optional: add your own OpenRouter key in Settings and enable online AI. Do not use a key that has been published in a repository.

## Offline and browser notes
- Notes, reminders, memory, basic commands and calculator run locally.
- Speech recognition availability depends on browser/device and may require network access. Text input is always available.
- Spoken replies use voices installed by the browser/operating system; availability and quality vary.
- Reminders can alert while the app is open. A browser page cannot guarantee background alarms after it is closed.
- Online AI requires internet access and may incur provider costs.
- The API key is saved in localStorage for personal testing only. Do not deploy a shared/public instance with your personal key enabled.

## Privacy
Personal data is stored in the current browser profile. Export a backup before clearing browser site data. This project does not send local notes or memory to an external service unless you explicitly submit a prompt while online AI is enabled.

## Development
No dependencies. Main files: index.html, style.css, script.js/app.js, service-worker.js, manifest.json.


## Run a local model from Android Termux

JARVIS can use a local GGUF model through a `llama.cpp` `llama-server` compatible endpoint. The browser UI itself is lightweight; the language model is a separate process.

### Important for a phone with 2 GB RAM
- Start with a tiny **0.5B–1B instruct GGUF**, quantized (for example Q4), and keep context modest (512–1024 tokens/context setting). Larger models may be very slow, crash, or run out of memory.
- Keep several GB free before downloading; model files and temporary/build files need extra space.
- Do not try to train a foundation model on this phone. First run a small model; we can later build a personal JARVIS layer with memory, custom instructions and your own documents.

### Start-up (two Termux sessions)
1. Put your compatible `llama-server` binary and a small `.gguf` model on the phone. How to obtain/build the binary depends on your Android CPU and available storage.
2. In Termux session A, start the model server (replace the paths with your actual files):
   ```sh
   ./llama-server -m "$HOME/models/tiny-instruct.gguf" -c 1024 -t 2 --host 127.0.0.1 --port 8080
   ```
3. In the repository folder, session B:
   ```sh
   pkg install python
   python termux_server.py
   ```
4. Open **http://127.0.0.1:8000** in your Android browser, go to Settings, tick **Use my local model (Termux)**, and save.
5. Test with a short prompt. Keep the app open while using reminders; local model replies may take time.

### GitHub Pages vs Termux
- GitHub Pages can host the static interface, but it cannot host/run the model.
- For a local model on your phone, use the Termux-hosted URL above. The local Python server serves the UI and safely proxies chat requests to `127.0.0.1:8080`, avoiding browser HTTPS/CORS issues.
- Online OpenRouter mode remains optional and separate. Local mode does not require an API key.
- The included proxy binds only to `127.0.0.1`; do not expose it to the internet or change it to listen on all network interfaces.
