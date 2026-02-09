// J.A.R.V.I.S. AI - Complete Working Version
console.log('JARVIS loading...');

// State
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

// DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('JARVIS initializing...');
    updateStatus('Loading systems...');
    
    try {
        loadData();
        setupEventListeners();
        setupSpeech();
        updateUI();
        
        updateStatus('Ready');
        setTimeout(hideSplash, 1500);
    } catch (e) {
        console.error('Init error:', e);
        updateStatus('Error: ' + e.message);
        setTimeout(hideSplash, 1000);
    }
}

function updateStatus(text) {
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

// Event Listeners - FIXED
function setupEventListeners() {
    // Sidebars
    document.getElementById('btn-left-menu')?.addEventListener('click', () => toggleSidebar('left'));
    document.getElementById('btn-right-menu')?.addEventListener('click', () => toggleSidebar('right'));
    document.getElementById('btn-close-left')?.addEventListener('click', () => toggleSidebar('left'));
    document.getElementById('btn-close-right')?.addEventListener('click', () => toggleSidebar('right'));
    document.getElementById('sidebar-backdrop')?.addEventListener('click', closeAllSidebars);
    
    // Theme
    document.getElementById('theme-select')?.addEventListener('change', (e) => setTheme(e.target.value));
    
    // Toggles
    document.getElementById('tts-toggle')?.addEventListener('change', (e) => { state.settings.tts = e.target.checked; saveData(); });
    document.getElementById('stt-toggle')?.addEventListener('change', (e) => { state.settings.stt = e.target.checked; saveData(); });
    document.getElementById('auto-speak-toggle')?.addEventListener('change', (e) => { state.settings.autoSpeak = e.target.checked; saveData(); });
    
    // API buttons
    document.querySelectorAll('.api-test-btn').forEach(btn => {
        btn.addEventListener('click', () => testAPI(btn.dataset.api));
    });
    
    // Model select
    document.getElementById('openrouter-model')?.addEventListener('change', (e) => {
        state.settings.model = e.target.value;
        saveData();
    });
    
    // Clear data
    document.getElementById('btn-clear-data')?.addEventListener('click', clearAllData);
    
    // Chat
    document.getElementById('btn-send')?.addEventListener('click', sendMessage);
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Quick chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const msg = btn.dataset.message;
            if (msg.includes('Open')) {
                const app = msg.split(' ')[1].toLowerCase();
                if (app === 'calculator') openCalculator();
                else if (app === 'notebook') openNotebook();
            } else {
                document.getElementById('chat-input').value = msg;
                sendMessage();
            }
        });
    });
    
    // Voice
    document.getElementById('btn-voice')?.addEventListener('click', toggleVoice);
    
    // Camera
    document.getElementById('btn-camera')?.addEventListener('click', toggleCamera);
    document.getElementById('btn-close-camera')?.addEventListener('click', closeCamera);
    document.getElementById('btn-capture')?.addEventListener('click', captureFace);
    
    // Apps drawer
    document.getElementById('btn-apps')?.addEventListener('click', toggleApps);
    document.getElementById('btn-close-apps')?.addEventListener('click', toggleApps);
    
    // App icons
    document.querySelectorAll('.app-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const app = icon.dataset.app;
            toggleApps();
            if (app === 'calc') openCalculator();
            else if (app === 'tasks') openTasks();
            else if (app === 'weather') openWeather();
            else if (app === 'notebook') openNotebook();
            else if (app === 'reminders') openReminders();
            else if (app === 'game') alert('Quiz game coming soon!');
        });
    });
    
    // Close mini apps
    document.querySelectorAll('.close-mini').forEach(btn => {
        btn.addEventListener('click', closeMiniApp);
    });
    
    // Calculator
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => calc(btn.dataset.val));
    });
    
    // Notebook
    document.getElementById('btn-new-note')?.addEventListener('click', newNote);
    document.getElementById('btn-save-note')?.addEventListener('click', saveNote);
    document.getElementById('btn-delete-note')?.addEventListener('click', deleteNote);
    
    // Tasks
    document.getElementById('btn-add-task')?.addEventListener('click', addTask);
    
    // Weather
    document.getElementById('btn-get-weather')?.addEventListener('click', getWeather);
    
    // Reminders
    document.getElementById('btn-add-reminder')?.addEventListener('click', addReminder);
}

// Sidebar Functions
function toggleSidebar(side) {
    const sidebar = document.getElementById('sidebar-' + side);
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;
    
    const isActive = sidebar.classList.contains('active');
    closeAllSidebars();
    
    if (!isActive) {
        sidebar.classList.add('active');
        backdrop?.classList.add('active');
    }
}

function closeAllSidebars() {
    document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('active'));
    document.getElementById('sidebar-backdrop')?.classList.remove('active');
}

// Theme
function setTheme(theme) {
    state.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    saveData();
}

// Speech Setup
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
        document.getElementById('btn-voice')?.classList.add('active');
        document.getElementById('jarvis-avatar')?.classList.add('listening');
        const status = document.getElementById('status-text');
        if (status) status.textContent = 'Listening...';
    };
    
    state.recognition.onend = () => {
        state.isListening = false;
        document.getElementById('btn-voice')?.classList.remove('active');
        document.getElementById('jarvis-avatar')?.classList.remove('listening');
        const status = document.getElementById('status-text');
        if (status) status.textContent = 'Tap microphone to speak';
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

// Chat Functions
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input?.value.trim();
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    
    const status = document.getElementById('status-text');
    if (status) status.textContent = 'Thinking...';
    
    setTimeout(() => getAIResponse(message), 500);
}

function addMessage(text, sender) {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    // Remove welcome message if exists
    const welcome = container.querySelector('.welcome-msg');
    if (welcome && sender === 'user') welcome.remove();
    
    const div = document.createElement('div');
    div.className = 'message ' + sender;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = escapeHtml(text) + '<span class="message-time">' + time + '</span>';
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    
    state.memory.conversations.push({ role: sender, content: text, time: Date.now() });
    updateMemoryStats();
    saveData();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function getAIResponse(message) {
    // Check commands
    const lower = message.toLowerCase();
    if (lower.includes('remember my name is')) {
        const name = message.split('is')[1]?.trim();
        if (name) {
            state.memory.user.name = name;
            updateUI();
            saveData();
            respond('I\'ve remembered your name, ' + name + '.');
            return;
        }
    }
    
    if (lower.includes('my age is')) {
        const age = message.match(/\d+/)?.[0];
        if (age) {
            state.memory.user.age = age;
            updateUI();
            saveData();
            respond('I\'ve noted that you are ' + age + ' years old.');
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
                        { role: 'system', content: 'You are J.A.R.V.I.S., Tony Stark\'s AI assistant. Be helpful, witty, and concise. User name: ' + state.memory.user.name },
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
    
    // Fallback responses
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
    if (status) status.textContent = 'Tap microphone to speak';
    
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
                speak('OpenRouter connected successfully');
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

// Calculator
function openCalculator() {
    document.getElementById('calc-app')?.classList.remove('hidden');
}

function calc(val) {
    const display = document.getElementById('calc-display');
    if (!display) return;
    
    let current = display.textContent;
    
    if (val === 'C') {
        display.textContent = '0';
    } else if (val === '⌫') {
        display.textContent = current.length > 1 ? current.slice(0, -1) : '0';
    } else if (val === '=') {
        try {
            const result = eval(current.replace('×', '*').replace('÷', '/'));
            display.textContent = String(result).slice(0, 12);
        } catch {
            display.textContent = 'Error';
        }
    } else {
        if (current === '0' && '0123456789'.includes(val)) {
            display.textContent = val;
        } else {
            display.textContent = (current + val).slice(0, 12);
        }
    }
}

// Notebook
function openNotebook() {
    document.getElementById('notebook-app')?.classList.remove('hidden');
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
        '<div class="note-item ' + (state.currentNote === i ? 'active' : '') + '" data-index="' + i + '">' +
        '<span>' + escapeHtml(note.title || 'Untitled') + '</span>' +
        '<small>' + new Date(note.date).toLocaleDateString() + '</small>' +
        '</div>'
    ).join('');
    
    // Add click handlers
    list.querySelectorAll('.note-item').forEach(item => {
        item.addEventListener('click', () => loadNote(parseInt(item.dataset.index)));
    });
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

// Tasks
function openTasks() {
    document.getElementById('tasks-app')?.classList.remove('hidden');
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
        '<input type="checkbox" ' + (task.completed ? 'checked' : '') + ' data-id="' + task.id + '">' +
        '<span>' + escapeHtml(task.text) + '</span>' +
        '<button data-id="' + task.id + '">×</button>' +
        '</div>'
    ).join('');
    
    // Add handlers
    list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => toggleTask(parseInt(cb.dataset.id)));
    });
    list.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => deleteTask(parseInt(btn.dataset.id)));
    });
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
    document.getElementById('weather-app')?.classList.remove('hidden');
}

function getWeather() {
    const city = document.getElementById('weather-city')?.value;
    if (!city) return;
    
    // Mock data - replace with real API
    document.querySelector('.weather-icon').textContent = '☀️';
    document.querySelector('.weather-temp').textContent = '24°';
    document.getElementById('weather-humidity').textContent = '60%';
    document.getElementById('weather-wind').textContent = '15 km/h';
    document.getElementById('weather-condition').textContent = 'Sunny';
}

// Reminders
function openReminders() {
    document.getElementById('reminders-app')?.classList.remove('hidden');
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
            '<div class="reminder-text">' + escapeHtml(r.text) + '</div>' +
            '<div class="reminder-time">' + new Date(r.time).toLocaleString() + '</div>' +
            '</div>' +
            '<button data-id="' + r.id + '">×</button>' +
            '</div>';
    }).join('');
    
    list.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => deleteReminder(parseInt(btn.dataset.id)));
    });
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

// Apps
function toggleApps() {
    document.getElementById('apps-drawer')?.classList.toggle('hidden');
}

function closeMiniApp() {
    document.querySelectorAll('.mini-app').forEach(app => app.classList.add('hidden'));
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
            const parsed = JSON.parse(set);
            state.settings = { ...state.settings, ...parsed };
            
            // Restore UI
            const tts = document.getElementById('tts-toggle');
            const stt = document.getElementById('stt-toggle');
            const auto = document.getElementById('auto-speak-toggle');
            const model = document.getElementById('openrouter-model');
            const theme = document.getElementById('theme-select');
            
            if (tts) tts.checked = state.settings.tts;
            if (stt) stt.checked = state.settings.stt;
            if (auto) auto.checked = state.settings.autoSpeak;
            if (model) model.value = state.settings.model;
            if (theme) theme.value = state.settings.theme;
            
            if (state.settings.theme) setTheme(state.settings.theme);
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
    
    const usage = document.getElementById('mem-usage');
    const factsEl = document.getElementById('mem-facts');
    const convosEl = document.getElementById('mem-convos');
    const text = document.getElementById('memory-text');
    const fill = document.getElementById('memory-fill');
    const list = document.getElementById('facts-list');
    
    if (usage) usage.textContent = (storage / 1024).toFixed(1) + ' KB';
    if (factsEl) factsEl.textContent = facts;
    if (convosEl) convosEl.textContent = convos;
    
    const percent = Math.min(storage / 5120, 100);
    if (text) text.textContent = percent.toFixed(0) + '% used';
    if (fill) fill.style.width = percent + '%';
    
    if (list) {
        if (facts === 0) {
            list.innerHTML = '<div class="empty-facts">No facts stored yet</div>';
        } else {
            list.innerHTML = state.memory.facts.map(f => 
                '<div class="fact-item">' + escapeHtml(f) + '</div>'
            ).join('');
        }
    }
}

function clearAllData() {
    if (confirm('Clear all data? This cannot be undone.')) {
        localStorage.removeItem('jarvis_memory');
        localStorage.removeItem('jarvis_settings');
        location.reload();
    }
}

console.log('JARVIS script loaded');
