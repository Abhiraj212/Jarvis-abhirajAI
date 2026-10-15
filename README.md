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
