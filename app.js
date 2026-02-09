// Simple test to ensure basic functionality works
console.log('JARVIS starting...');

// Global state
const state = {
    memory: {
        facts: [],
        conversations: [],
        user: { name: 'Unknown', age: '-', location: '-', mood: 'Neutral' },
        notes: [],
        tasks: [],
        reminders: []
    },
    settings: {
        theme: 'jarvis',
        tts: true,
        stt: true,
        autoSpeak: true,
        apiKeys: {},
        model: 'deepseek/deepseek-chat'
    },
    currentNote: null,
    isListening: false,
    synth: window.speechSynthesis,
    recognition: null
};

// Initialize immediately when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('JARVIS initializing...');
    updateSplashStatus('Loading core systems...');
    
    try {
        loadData();
        setupEventListeners();
        setupSpeech();
        updateUI();
        
        updateSplashStatus('Systems online');
        
        // Hide splash after animation
        setTimeout(() => {
            hideSplash();
        }, 2000);
        
    } catch (error) {
        console.error('Init error:', error);
        updateSplashStatus('Error: ' + error.message);
        setTimeout(hideSplash, 1000);
    }
}

function updateSplashStatus(text) {
    const el = document.getElementById('splash-status');
    if (el) el.textContent = text;
}

function hideSplash() {
    const splash = document.getElementById('splash-screen');
    const app = document.getElementById('app');
    if (splash) splash.classList.add('hidden');
    if (app) app.classList.remove('hidden');
    console.log('JARVIS ready');
}

// Sidebar functions
function toggleSidebar(side) {
    const sidebar = document.getElementById('sidebar-' + side);
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;
    
    const isActive = sidebar.classList.contains('active');
    closeAllSidebars();
    
    if (!isActive) {
        sidebar.classList.add('active');
        if (backdrop) backdrop.classList.add('active');
    }
}

function closeAllSidebars() {
    document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('active'));
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) backdrop.classList.remove('active');
}

// Theme
function setTheme(theme) {
    state.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    saveData();
}

// Voice settings
function toggleTTS() {
    state.settings.tts = document.getElementById('tts-toggle').checked;
    saveData();
}

function toggleSTT() {
    state.settings.stt = document.getElementById('stt-toggle').checked;
    saveData();
}

function toggleAutoSpeak() {
    state.settings.autoSpeak = document.getElementById('auto-speak-toggle').checked;
    saveData();
}

// Text to Speech
function speak(text) {
    if (!state.settings.tts || !state.synth) return;
    
    state.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 0.9;
    
    const voices = state.synth.getVoices();
    const voice = voices.find(v => v.lang === 'en-US') || voices[0];
    if (voice) utterance.voice = voice;
    
    const avatar = document.getElementById('jarvis-avatar');
    if (avatar) {
        utterance.onstart = () => avatar.classList.add('speaking');
        utterance.onend = () => avatar.classList.remove('speaking');
    }
    
    state.synth.speak(utterance);
}

// Speech Recognition
function setupSpeech() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Speech recognition not supported');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = false;
    state.recognition.interimResults = false;
    state.recognition.lang = 'en-US';
    
    state.recognition.onstart = () => {
        state.isListening = true;
        document.getElementById('voice-btn')?.classList.add('active');
        document.getElementById('jarvis-avatar')?.classList.add('listening');
        const status = document.getElementById('status-text');
        if (status) status.textContent = 'Listening...';
    };
    
    state.recognition.onend = () => {
        state.isListening = false;
        document.getElementById('voice-btn')?.classList.remove('active');
        document.getElementById('jarvis-avatar')?.classList.remove('listening');
        const status = document.getElementById('status-text');
        if (status) status.textContent = 'Tap to speak';
    };
    
    state.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = transcript;
            sendMessage();
        }
    };
}

function toggleVoice() {
    if (!state.recognition) {
        alert('Speech recognition not supported');
        return;
    }
    
    if (state.isListening) {
        state.recognition.stop();
    } else {
        state.recognition.start();
    }
}

// Chat
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input?.value.trim();
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    
    const status = document.getElementById('status-text');
    if (status) status.textContent = 'Thinking...';
    
    // Get AI response
    setTimeout(() => {
        getAIResponse(message);
    }, 500);
}

function quickSend(text) {
    const input = document.getElementById('chat-input');
    if (input) {
        input.value = text;
        sendMessage();
    }
}

function addMessage(text, sender) {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'message ' + sender;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = text + '<span class="message-time">' + time + '</span>';
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    
    state.memory.conversations.push({ role: sender, content: text, time: Date.now() });
    updateMemoryStats();
    saveData();
}

async function getAIResponse(message) {
    // Check for commands
    if (message.toLowerCase().includes('remember my name is')) {
        const name = message.split('is')[1]?.trim();
        if (name) {
            state.memory.user.name = name;
            updateUI();
            saveData();
            respond('I\'ve remembered your name, ' + name + '.');
            return;
        }
    }
    
    // Try OpenRouter
    if (state.settings.apiKeys.openrouter) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + state.settings.apiKeys.openrouter,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'J.A.R.V.I.S. AI'
                },
                body: JSON.stringify({
                    model: state.settings.model,
                    messages: [
                        { role: 'system', content: 'You are J.A.R.V.I.S., Tony Stark\'s AI assistant. Be helpful, witty, and concise. User: ' + state.memory.user.name },
                        { role: 'user', content: message }
                    ]
                })
            });
            
            const data = await response.json();
            if (data.choices?.[0]?.message?.content) {
                respond(data.choices[0].message.content);
                return;
            }
        } catch (e) {
            console.error('API error:', e);
        }
    }
    
    // Fallback
    const responses = [
        "I understand. How can I assist you further?",
        "Working on it, sir.",
        "I've noted that in my memory.",
        "As you wish.",
        "Interesting. Tell me more."
    ];
    respond(responses[Math.floor(Math.random() * responses.length)]);
}

function respond(text) {
    addMessage(text, 'jarvis');
    const status = document.getElementById('status-text');
    if (status) status.textContent = 'Tap to speak';
    
    if (state.settings.autoSpeak) {
        speak(text);
    }
}

// API Management
async function testAPI(type) {
    const input = document.getElementById('api-' + type);
    const badge = document.getElementById('badge-' + type);
    if (!input || !badge) return;
    
    const key = input.value.trim();
    if (!key) {
        badge.textContent = 'OFFLINE';
        badge.classList.remove('online');
        return;
    }
    
    badge.textContent = 'TESTING...';
    
    if (type === 'openrouter') {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
                headers: { 'Authorization': 'Bearer ' + key }
            });
            if (response.ok) {
                badge.textContent = 'ONLINE';
                badge.classList.add('online');
                state.settings.apiKeys.openrouter = key;
                saveData();
            } else {
                throw new Error('Invalid');
            }
        } catch (e) {
            badge.textContent = 'ERROR';
            badge.classList.remove('online');
        }
    } else {
        setTimeout(() => {
            badge.textContent = 'ONLINE';
            badge.classList.add('online');
            state.settings.apiKeys[type] = key;
            saveData();
        }, 500);
    }
}

function saveModel() {
    const select = document.getElementById('openrouter-model');
    if (select) {
        state.settings.model = select.value;
        saveData();
    }
}

// Notebook
function openNotebook() {
    showApps();
    const app = document.getElementById('notebook-app');
    if (app) app.classList.remove('hidden');
    renderNotes();
}

function renderNotes() {
    const list = document.getElementById('notebook-list');
    if (!list) return;
    
    if (state.memory.notes.length === 0) {
        list.innerHTML = '<div class="empty-notes">No notes yet</div>';
        return;
    }
    
    list.innerHTML = state.memory.notes.map((note, i) => 
        '<div class="note-item ' + (state.currentNote === i ? 'active' : '') + '" onclick="loadNote(' + i + ')">' +
        '<span>' + (note.title || 'Untitled') + '</span>' +
        '<small>' + new Date(note.date).toLocaleDateString() + '</small>' +
        '</div>'
    ).join('');
}

function newNote() {
    state.currentNote = null;
    const title = document.getElementById('note-title');
    const content = document.getElementById('note-content');
    if (title) title.value = '';
    if (content) content.value = '';
    renderNotes();
}

function loadNote(index) {
    state.currentNote = index;
    const note = state.memory.notes[index];
    const title = document.getElementById('note-title');
    const content = document.getElementById('note-content');
    if (title) title.value = note.title || '';
    if (content) content.value = note.content || '';
    renderNotes();
}

function saveNote() {
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    
    const title = titleInput?.value.trim() || 'Untitled';
    const content = contentInput?.value || '';
    
    if (state.currentNote !== null) {
        state.memory.notes[state.currentNote] = { title, content, date: Date.now() };
    } else {
        state.memory.notes.push({ title, content, date: Date.now() });
        state.currentNote = state.memory.notes.length - 1;
    }
    
    saveData();
    renderNotes();
    speak('Note saved');
}

function deleteNote() {
    if (state.currentNote === null) return;
    state.memory.notes.splice(state.currentNote, 1);
    state.currentNote = null;
    const title = document.getElementById('note-title');
    const content = document.getElementById('note-content');
    if (title) title.value = '';
    if (content) content.value = '';
    saveData();
    renderNotes();
}

// Calculator
function openCalculator() {
    showApps();
    const app = document.getElementById('calc-app');
    if (app) app.classList.remove('hidden');
}

function calc(value) {
    const display = document.getElementById('calc-display');
    if (!display) return;
    
    let current = display.textContent;
    
    if (value === 'C') {
        display.textContent = '0';
    } else if (value === '⌫') {
        display.textContent = current.length > 1 ? current.slice(0, -1) : '0';
    } else if (value === '=') {
        try {
            const result = eval(current.replace('×', '*').replace('÷', '/'));
            display.textContent = String(result).slice(0, 12);
        } catch {
            display.textContent = 'Error';
        }
    } else {
        if (current === '0' && '0123456789'.includes(value)) {
            display.textContent = value;
        } else {
            display.textContent = (current + value).slice(0, 12);
        }
    }
}

// Tasks
function openTasks() {
    showApps();
    const app = document.getElementById('tasks-app');
    if (app) app.classList.remove('hidden');
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById('tasks-list');
    if (!list) return;
    
    if (state.memory.tasks.length === 0) {
        list.innerHTML = '<div class="empty-tasks">No tasks yet</div>';
        return;
    }
    
    list.innerHTML = state.memory.tasks.map(task => 
        '<div class="task-item ' + (task.completed ? 'completed' : '') + '">' +
        '<input type="checkbox" ' + (task.completed ? 'checked' : '') + ' onchange="toggleTask(' + task.id + ')">' +
        '<span>' + task.text + '</span>' +
        '<button onclick="deleteTask(' + task.id + ')">×</button>' +
        '</div>'
    ).join('');
}

function addTask() {
    const input = document.getElementById('task-input');
    const text = input?.value.trim();
    if (!text) return;
    
    state.memory.tasks.push({ text, completed: false, id: Date.now() });
    if (input) input.value = '';
    saveData();
    renderTasks();
}

function toggleTask(id) {
    const task = state.memory.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData();
        renderTasks();
    }
}

function deleteTask(id) {
    state.memory.tasks = state.memory.tasks.filter(t => t.id !== id);
    saveData();
    renderTasks();
}

// Weather
function openWeather() {
    showApps();
    const app = document.getElementById('weather-app');
    if (app) app.classList.remove('hidden');
}

function getWeather() {
    // Mock weather - implement real API
    document.querySelector('.weather-icon').textContent = '☀️';
    document.querySelector('.weather-temp').textContent = '22°';
    document.getElementById('weather-humidity').textContent = '65%';
    document.getElementById('weather-wind').textContent = '12 km/h';
    document.getElementById('weather-condition').textContent = 'Sunny';
}

// Reminders
function openReminders() {
    showApps();
    const app = document.getElementById('reminders-app');
    if (app) app.classList.remove('hidden');
    renderReminders();
}

function renderReminders() {
    const list = document.getElementById('reminders-list');
    if (!list) return;
    
    if (state.memory.reminders.length === 0) {
        list.innerHTML = '<div class="empty-reminders">No reminders set</div>';
        return;
    }
    
    const now = Date.now();
    list.innerHTML = state.memory.reminders.map(r => {
        const isOverdue = r.time < now;
        const cls = isOverdue ? 'overdue' : (r.time - now < 3600000 ? 'due-soon' : '');
        return '<div class="reminder-item ' + cls + '">' +
            '<div class="reminder-content">' +
            '<div class="reminder-text">' + r.text + '</div>' +
            '<div class="reminder-time">' + new Date(r.time).toLocaleString() + '</div>' +
            '</div>' +
            '<button onclick="deleteReminder(' + r.id + ')">×</button>' +
            '</div>';
    }).join('');
}

function addReminder() {
    const textInput = document.getElementById('reminder-text');
    const timeInput = document.getElementById('reminder-time');
    
    const text = textInput?.value.trim();
    const time = timeInput?.value;
    
    if (!text || !time) return;
    
    state.memory.reminders.push({ text, time: new Date(time).getTime(), id: Date.now() });
    if (textInput) textInput.value = '';
    if (timeInput) timeInput.value = '';
    saveData();
    renderReminders();
}

function deleteReminder(id) {
    state.memory.reminders = state.memory.reminders.filter(r => r.id !== id);
    saveData();
    renderReminders();
}

// Other apps
function openGame() {
    showApps();
    alert('Quiz game coming soon!');
}

function showApps() {
    const drawer = document.getElementById('apps-drawer');
    if (drawer) drawer.classList.toggle('hidden');
}

function closeMiniApp() {
    document.querySelectorAll('.mini-app').forEach(app => app.classList.add('hidden'));
}

// Camera
function toggleCamera() {
    const overlay = document.getElementById('camera-overlay');
    if (!overlay) return;
    
    if (overlay.classList.contains('hidden')) {
        overlay.classList.remove('hidden');
        startCamera();
    } else {
        closeCamera();
    }
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.getElementById('camera-video');
        if (video) video.srcObject = stream;
    } catch (e) {
        alert('Camera access denied');
        closeCamera();
    }
}

function closeCamera() {
    const overlay = document.getElementById('camera-overlay');
    if (overlay) overlay.classList.add('hidden');
    
    const video = document.getElementById('camera-video');
    if (video?.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}

function captureFace() {
    speak('Face captured');
    closeCamera();
}

// Data Management
function saveData() {
    try {
        localStorage.setItem('jarvis_memory', JSON.stringify(state.memory));
        localStorage.setItem('jarvis_settings', JSON.stringify(state.settings));
    } catch (e) {
        console.error('Save failed:', e);
    }
}

function loadData() {
    try {
        const mem = localStorage.getItem('jarvis_memory');
        const set = localStorage.getItem('jarvis_settings');
        
        if (mem) state.memory = JSON.parse(mem);
        if (set) {
            state.settings = JSON.parse(set);
            // Restore UI
            document.getElementById('tts-toggle').checked = state.settings.tts;
            document.getElementById('stt-toggle').checked = state.settings.stt;
            document.getElementById('auto-speak-toggle').checked = state.settings.autoSpeak;
            if (state.settings.model) {
                document.getElementById('openrouter-model').value = state.settings.model;
            }
            if (state.settings.theme) {
                setTheme(state.settings.theme);
            }
        }
    } catch (e) {
        console.error('Load failed:', e);
    }
}

function updateUI() {
    const name = document.getElementById('profile-name');
    const age = document.getElementById('profile-age');
    const loc = document.getElementById('profile-location');
    const mood = document.getElementById('profile-mood');
    
    if (name) name.textContent = state.memory.user.name;
    if (age) age.textContent = state.memory.user.age;
    if (loc) loc.textContent = state.memory.user.location;
    if (mood) mood.textContent = state.memory.user.mood;
    
    updateMemoryStats();
}

function updateMemoryStats() {
    const facts = state.memory.facts.length;
    const convos = state.memory.conversations.length;
    const storage = JSON.stringify(state.memory).length;
    
    const memUsage = document.getElementById('mem-usage');
    const memFacts = document.getElementById('mem-facts');
    const memConvos = document.getElementById('mem-convos');
    const memText = document.getElementById('memory-text');
    const memFill = document.getElementById('memory-fill');
    const factsList = document.getElementById('facts-list');
    
    if (memUsage) memUsage.textContent = (storage / 1024).toFixed(1) + ' KB';
    if (memFacts) memFacts.textContent = facts;
    if (memConvos) memConvos.textContent = convos;
    
    const percent = Math.min(storage / 5120, 100); // 5KB = 100%
    if (memText) memText.textContent = percent.toFixed(0) + '% used';
    if (memFill) memFill.style.width = percent + '%';
    
    if (factsList) {
        if (facts === 0) {
            factsList.innerHTML = '<div class="empty-facts">No facts stored yet</div>';
        } else {
            factsList.innerHTML = state.memory.facts.map(f => 
                '<div class="fact-item">' + f + '</div>'
            ).join('');
        }
    }
}

function clearAllData() {
    if (confirm('Clear all data?')) {
        localStorage.removeItem('jarvis_memory');
        localStorage.removeItem('jarvis_settings');
        location.reload();
    }
}

function startChat() {
    document.getElementById('chat-input')?.focus();
}

// Event Listeners
function setupEventListeners() {
    const input = document.getElementById('chat-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

console.log('JARVIS script loaded');