// J.A.R.V.I.S. App - Main Controller

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, starting JARVIS...');
    
    // Initialize
    if (!JARVIS.init()) {
        console.error('Core init failed');
        return;
    }
    
    // Setup modules
    JARVIS.Voice.setup();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Restore UI state
    restoreUIState();
    
    // Hide splash
    setTimeout(() => JARVIS.hideSplash(), 1500);
    
    // Check for due reminders periodically
    setInterval(() => {
        if (JARVIS.Features.currentApp === 'reminders') {
            JARVIS.Features.Reminders.checkDue();
        }
    }, 60000); // Every minute
});

// Emergency fallback
setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash && !splash.classList.contains('hidden')) {
        console.warn('Emergency splash hide');
        splash.classList.add('hidden');
        document.getElementById('app')?.classList.remove('hidden');
    }
}, 10000);

function setupEventListeners() {
    // Sidebars
    JARVIS.get('btn-left-menu')?.addEventListener('click', () => toggleSidebar('left'));
    JARVIS.get('btn-right-menu')?.addEventListener('click', () => toggleSidebar('right'));
    JARVIS.get('btn-close-left')?.addEventListener('click', () => toggleSidebar('left'));
    JARVIS.get('btn-close-right')?.addEventListener('click', () => toggleSidebar('right'));
    JARVIS.get('sidebar-backdrop')?.addEventListener('click', closeAllSidebars);
    
    // Theme
    JARVIS.get('theme-select')?.addEventListener('change', (e) => {
        JARVIS.state.settings.theme = e.target.value;
        document.documentElement.setAttribute('data-theme', e.target.value);
        JARVIS.saveData();
    });
    
    // Settings toggles
    JARVIS.get('tts-toggle')?.addEventListener('change', (e) => {
        JARVIS.state.settings.tts = e.target.checked;
        JARVIS.saveData();
    });
    
    JARVIS.get('stt-toggle')?.addEventListener('change', (e) => {
        JARVIS.state.settings.stt = e.target.checked;
        JARVIS.saveData();
    });
    
    JARVIS.get('auto-speak-toggle')?.addEventListener('change', (e) => {
        JARVIS.state.settings.autoSpeak = e.target.checked;
        JARVIS.saveData();
    });
    
    // API
    JARVIS.get('btn-test-api')?.addEventListener('click', testAPI);
    
    // Clear data
    JARVIS.get('btn-clear-data')?.addEventListener('click', () => JARVIS.clearAllData());
    
    // Chat
    JARVIS.get('btn-send')?.addEventListener('click', () => JARVIS.Chat.send());
    JARVIS.get('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') JARVIS.Chat.send();
    });
    
    // Quick chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', handleChipClick);
    });
    
    // Voice
    JARVIS.get('btn-voice')?.addEventListener('click', () => JARVIS.Voice.toggle());
    
    // Camera
    JARVIS.get('btn-camera')?.addEventListener('click', () => JARVIS.Vision.toggle());
    JARVIS.get('btn-close-camera')?.addEventListener('click', () => JARVIS.Vision.close());
    JARVIS.get('btn-capture')?.addEventListener('click', () => JARVIS.Vision.capture());
    
    // Apps drawer
    JARVIS.get('btn-apps')?.addEventListener('click', () => JARVIS.Features.toggleApps());
    JARVIS.get('btn-close-apps')?.addEventListener('click', () => JARVIS.Features.toggleApps());
    
    // App icons
    document.querySelectorAll('.app-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            JARVIS.Features.openApp(icon.dataset.app);
        });
    });
    
    // Close mini apps
    document.querySelectorAll('.close-mini').forEach(btn => {
        btn.addEventListener('click', () => JARVIS.Features.closeMiniApp());
    });
    
    // Calculator
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            JARVIS.Features.Calculator.handle(btn.dataset.val);
        });
    });
    
    // Notebook
    JARVIS.get('btn-new-note')?.addEventListener('click', () => JARVIS.Features.Notebook.new());
    JARVIS.get('btn-save-note')?.addEventListener('click', () => JARVIS.Features.Notebook.save());
    JARVIS.get('btn-delete-note')?.addEventListener('click', () => JARVIS.Features.Notebook.delete());
    
    // Tasks
    JARVIS.get('btn-add-task')?.addEventListener('click', () => JARVIS.Features.Tasks.add());
    
    // Weather
    JARVIS.get('btn-get-weather')?.addEventListener('click', () => JARVIS.Features.Weather.get());
    
    // Reminders
    JARVIS.get('btn-add-reminder')?.addEventListener('click', () => JARVIS.Features.Reminders.add());
    
    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

function restoreUIState() {
    const { settings } = JARVIS.state;
    
    // Restore toggles
    const tts = JARVIS.get('tts-toggle');
    const stt = JARVIS.get('stt-toggle');
    const auto = JARVIS.get('auto-speak-toggle');
    const theme = JARVIS.get('theme-select');
    const model = JARVIS.get('model-id');
    const apiKey = JARVIS.get('api-openrouter');
    
    if (tts) tts.checked = settings.tts;
    if (stt) stt.checked = settings.stt;
    if (auto) auto.checked = settings.autoSpeak;
    if (theme) theme.value = settings.theme;
    if (model) model.value = settings.model;
    if (apiKey) apiKey.value = settings.apiKey || '';
    
    // Apply theme
    if (settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }
    
    // Update API badge
    if (settings.apiKey) {
        const badge = JARVIS.get('badge-openrouter');
        if (badge) {
            badge.textContent = 'CONFIGURED';
            badge.classList.add('online');
        }
    }
}

// Sidebar Functions
function toggleSidebar(side) {
    const sidebar = JARVIS.get('sidebar-' + side);
    const backdrop = JARVIS.get('sidebar-backdrop');
    if (!sidebar) return;
    
    const isActive = sidebar.classList.contains('active');
    closeAllSidebars();
    
    if (!isActive) {
        sidebar.classList.add('active');
        backdrop?.classList.add('active');
        
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(20);
    }
}

function closeAllSidebars() {
    document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('active'));
    JARVIS.get('sidebar-backdrop')?.classList.remove('active');
}

// Quick Chip Handler
function handleChipClick(e) {
    const btn = e.currentTarget;
    const message = btn.dataset.message;
    const action = btn.dataset.action;
    
    if (action) {
        // Open app directly
        switch(action) {
            case 'openCalculator': JARVIS.Features.Calculator.open(); break;
            case 'openNotebook': JARVIS.Features.Notebook.open(); break;
        }
    } else if (message) {
        // Send message
        const input = JARVIS.get('chat-input');
        if (input) {
            input.value = message;
            input.focus();
            // Don't auto-send, let user edit if needed
        }
    }
}

// API Testing
async function testAPI() {
    const keyInput = JARVIS.get('api-openrouter');
    const modelInput = JARVIS.get('model-id');
    const badge = JARVIS.get('badge-openrouter');
    
    if (!keyInput || !badge) return;
    
    const key = keyInput.value.trim();
    const model = modelInput?.value.trim() || 'deepseek/deepseek-chat';
    
    if (!key) {
        badge.textContent = 'OFFLINE';
        badge.classList.remove('online');
        JARVIS.showError('Please enter an API key');
        return;
    }
    
    badge.textContent = 'TESTING...';
    badge.classList.remove('online');
    
    try {
        // Test with a simple request
        const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
            headers: { 'Authorization': 'Bearer ' + key }
        });
        
        if (response.ok) {
            badge.textContent = 'ONLINE';
            badge.classList.add('online');
            
            JARVIS.state.settings.apiKey = key;
            JARVIS.state.settings.model = model;
            JARVIS.saveData();
            
            JARVIS.Voice.speak('OpenRouter connected successfully');
            
            // Close sidebar on mobile
            if (window.innerWidth < 1024) {
                closeAllSidebars();
            }
        } else {
            throw new Error('Invalid API key');
        }
    } catch (e) {
        console.error('API test failed:', e);
        badge.textContent = 'ERROR';
        badge.classList.remove('online');
        JARVIS.showError('Connection failed. Check your API key.');
    }
}

// Chat Module
JARVIS.Chat = {
    async send() {
        const input = JARVIS.get('chat-input');
        const message = input?.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        
        JARVIS.setText('status-text', 'Thinking...');
        
        // Process commands first
        const lower = message.toLowerCase();
        
        // Name command
        if (lower.includes('my name is') || lower.includes('i am')) {
            const match = message.match(/(?:my name is|i am)\s+(\w+)/i);
            if (match) {
                const name = match[1];
                JARVIS.state.memory.user.name = name;
                JARVIS.updateUI();
                JARVIS.saveData();
                this.respond(`Hello ${name}, I've remembered your name.`);
                return;
            }
        }
        
        // Age command
        if (lower.includes('my age is') || lower.match(/\bi am \d+\b/)) {
            const match = message.match(/\d+/);
            if (match) {
                JARVIS.state.memory.user.age = match[0];
                JARVIS.updateUI();
                JARVIS.saveData();
                this.respond(`I've noted your age.`);
                return;
            }
        }
        
        // Location command
        if (lower.includes('i live in') || lower.includes('i am from')) {
            const match = message.match(/(?:i live in|i am from)\s+(.+)/i);
            if (match) {
                JARVIS.state.memory.user.location = match[1].trim();
                JARVIS.updateUI();
                JARVIS.saveData();
                this.respond(`I've noted your location.`);
                return;
            }
        }
        
        // Get AI response
        try {
            const aiResponse = await JARVIS.callOpenRouter([
                { 
                    role: 'system', 
                    content: `You are J.A.R.V.I.S., Tony Stark's AI assistant from Iron Man. Be helpful, witty, and concise. The user's name is ${JARVIS.state.memory.user.name}. Respond in a friendly, slightly formal manner.`
                },
                { role: 'user', content: message }
            ]);
            
            this.respond(aiResponse);
            
        } catch (e) {
            console.error('Chat error:', e);
            this.respond('I apologize, but I encountered an error. ' + e.message);
        }
    },

    addMessage(text, sender) {
        const container = JARVIS.get('messages-container');
        if (!container) return;
        
        // Remove welcome on first user message
        const welcome = container.querySelector('.welcome-msg');
        if (welcome && sender === 'user') {
            welcome.style.opacity = '0';
            setTimeout(() => welcome.remove(), 300);
        }
        
        const div = document.createElement('div');
        div.className = 'message ' + sender;
        
        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        div.innerHTML = JARVIS.escapeHtml(text) + '<span class="message-time">' + time + '</span>';
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        
        // Save to memory
        JARVIS.state.memory.conversations.push({ 
            role: sender, 
            content: text, 
            time: Date.now() 
        });
        
        // Keep only last 100 messages
        if (JARVIS.state.memory.conversations.length > 100) {
            JARVIS.state.memory.conversations.shift();
        }
        
        JARVIS.updateMemoryStats();
        JARVIS.saveData();
    },

    respond(text) {
        this.addMessage(text, 'jarvis');
        JARVIS.setText('status-text', 'Tap microphone to speak');
        
        if (JARVIS.state.settings.autoSpeak) {
            JARVIS.Voice.speak(text);
        }
    }
};

// Global hide toast function
window.hideToast = function() {
    JARVIS.hideToast();
};

console.log('JARVIS App module loaded');
