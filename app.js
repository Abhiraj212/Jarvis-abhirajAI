/**
 * J.A.R.V.I.S. Application Interface
 * UI interactions and event bindings
 * ============================================
 */

const JARVIS_APP = {
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    init() {
        console.log('Initializing JARVIS APP Interface...');
        
        this.bindNavigation();
        this.bindHeader();
        this.bindDashboard();
        this.bindAssistant();
        this.bindVoice();
        this.bindNotes();
        this.bindReminders();
        this.bindCalculator();
        this.bindWeather();
        this.bindSettings();
        this.bindGlobalShortcuts();
        
        // Start clock
        this.startClock();
        
        // Handle initial route
        this.handleInitialRoute();
        
        console.log('APP Interface ready');
    },
    
    // ==========================================
    // NAVIGATION
    // ==========================================
    
    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const app = e.currentTarget.dataset.app;
                if (app) {
                    JARVIS.navigateTo(app);
                    this.updateActiveNav(app);
                }
            });
        });
    },
    
    updateActiveNav(app) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.app === app);
        });
    },
    
    handleInitialRoute() {
        // Check URL hash or default to dashboard
        const hash = window.location.hash.slice(1);
        const validApps = ['dashboard', 'assistant', 'voice', 'notes', 'reminders', 'calculator', 'weather', 'settings'];
        
        if (hash && validApps.includes(hash)) {
            JARVIS.navigateTo(hash);
            this.updateActiveNav(hash);
        } else {
            JARVIS.navigateTo('dashboard');
        }
    },
    
    // ==========================================
    // HEADER
    // ==========================================
    
    bindHeader() {
        // Theme toggle
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                document.body.classList.toggle('light-theme');
                const isLight = document.body.classList.contains('light-theme');
                JARVIS.data.preferences.theme = isLight ? 'light' : 'dark';
                JARVIS.Storage.local.set('preferences', JARVIS.data.preferences);
            });
        }
        
        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                JARVIS.navigateTo('settings');
                this.updateActiveNav('settings');
            });
        }
        
        // User avatar
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', () => {
                // Show user menu or profile
                JARVIS.notify('Profile settings coming soon', 'info');
            });
        }
    },
    
    startClock() {
        const updateTime = () => {
            const now = new Date();
            
            // Header time
            const timeEl = document.getElementById('header-time');
            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString('en-US', { 
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
            
            // Header date
            const dateEl = document.getElementById('header-date');
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
            }
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    },
    
    // ==========================================
    // DASHBOARD
    // ==========================================
    
    bindDashboard() {
        // Voice button
        const voiceBtn = document.getElementById('dashboard-voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                JARVIS.navigateTo('voice');
                this.updateActiveNav('voice');
            });
        }
        
        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Listen for system updates
        JARVIS.events.on('system:uptime', (uptime) => {
            const uptimeEl = document.getElementById('system-uptime');
            if (uptimeEl) {
                uptimeEl.textContent = JARVIS.formatTime(uptime);
            }
        });
    },
    
    handleQuickAction(action) {
        switch(action) {
            case 'note':
                JARVIS.Features.Notes.openEditor();
                break;
            case 'reminder':
                JARVIS.navigateTo('reminders');
                // Show reminder creation modal
                break;
            case 'calculate':
                JARVIS.navigateTo('calculator');
                break;
            case 'search':
                JARVIS.navigateTo('search');
                break;
        }
    },
    
    // ==========================================
    // ASSISTANT CHAT
    // ==========================================
    
    bindAssistant() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-message');
        
        if (chatInput && sendBtn) {
            // Auto-resize textarea
            chatInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
            
            // Send on Enter (Shift+Enter for new line)
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Send button
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        // Clear chat
        const clearBtn = document.getElementById('clear-chat');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const messages = document.getElementById('chat-messages');
                if (messages) {
                    messages.innerHTML = `
                        <div class="message system-message">
                            <div class="message-content">
                                <p>Conversation cleared. How can I help you?</p>
                            </div>
                        </div>
                    `;
                }
                JARVIS.AI.clearContext();
            });
        }
        
        // Export chat
        const exportBtn = document.getElementById('export-chat');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportChat();
            });
        }
        
        // Listen for AI responses
        JARVIS.events.on('ai:processing:complete', (data) => {
            this.addMessageToChat('jarvis', data.response);
        });
    },
    
    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessageToChat('user', message);
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        
        // Process through JARVIS
        JARVIS.processCommand(message);
    },
    
    addMessageToChat(type, text) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const avatar = type === 'jarvis' ? 'J' : 'U';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${this.escapeHtml(text)}</p>
                <span class="message-time">${time}</span>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    exportChat() {
        const messages = JARVIS.data.history
            .filter(h => h.app === 'assistant')
            .map(h => `[${new Date(h.timestamp).toLocaleString()}] ${h.type.toUpperCase()}: ${h.content}`)
            .join('\n\n');
        
        const blob = new Blob([messages], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jarvis-chat-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        JARVIS.notify('Chat exported', 'success');
    },
    
    // ==========================================
    // VOICE INTERFACE
    // ==========================================
    
    bindVoice() {
        const micBtn = document.getElementById('main-mic-btn');
        const statusEl = document.getElementById('voice-status');
        const transcriptEl = document.getElementById('transcript-text');
        const animationEl = document.getElementById('voice-animation');
        
        if (micBtn) {
            micBtn.addEventListener('click', () => {
                if (JARVIS.Voice.isListening) {
                    JARVIS.Voice.stop();
                } else {
                    JARVIS.Voice.start();
                }
            });
        }
        
        // Listen for voice events
        JARVIS.events.on('voice:start', () => {
            micBtn?.classList.add('listening');
            animationEl?.classList.add('listening');
            if (statusEl) statusEl.textContent = 'Listening...';
            if (transcriptEl) {
                transcriptEl.textContent = '...';
                transcriptEl.classList.add('listening');
            }
        });
        
        JARVIS.events.on('voice:result', (data) => {
            if (transcriptEl) {
                transcriptEl.textContent = data.transcript;
                if (data.isFinal) {
                    transcriptEl.classList.remove('listening');
                }
            }
        });
        
        JARVIS.events.on('voice:end', () => {
            micBtn?.classList.remove('listening');
            animationEl?.classList.remove('listening');
            if (statusEl) statusEl.textContent = 'Tap microphone to start';
        });
        
        // Command chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const text = chip.textContent.replace(/"/g, '');
                JARVIS.processCommand(text);
            });
        });
    },
    
    // ==========================================
    // NOTES
    // ==========================================
    
    bindNotes() {
        // New note button
        const newNoteBtn = document.getElementById('new-note-btn');
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', () => {
                JARVIS.Features.Notes.openEditor();
            });
        }
        
        // Search
        const searchInput = document.getElementById('notes-search');
        if (searchInput) {
            searchInput.addEventListener('input', JARVIS.debounce((e) => {
                const query = e.target.value;
                if (query) {
                    const results = JARVIS.Features.Notes.search(query);
                    this.renderNoteSearchResults(results);
                } else {
                    JARVIS.Features.Notes.render();
                }
            }, 300));
        }
        
        // Listen for note events
        JARVIS.events.on('notes:create', () => {
            JARVIS.Features.Notes.render();
        });
    },
    
    renderNoteSearchResults(results) {
        const container = document.getElementById('notes-grid');
        if (!container) return;
        
        if (results.length === 0) {
            container.innerHTML = '<div class="empty-state">No matching notes found</div>';
            return;
        }
        
        // Render search results (similar to regular render)
        container.innerHTML = results.map(note => `
            <div class="note-card" data-id="${note.id}">
                <div class="note-title">${note.title}</div>
                <div class="note-preview">${note.content}</div>
                <div class="note-meta">
                    <span>${new Date(note.updated).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    },
    
    // ==========================================
    // REMINDERS
    // ==========================================
    
    bindReminders() {
        const newReminderBtn = document.getElementById('new-reminder-btn');
        if (newReminderBtn) {
            newReminderBtn.addEventListener('click', () => {
                this.showReminderModal();
            });
        }
    },
    
    showReminderModal() {
        // Create modal for new reminder
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>New Reminder</h3>
                    <button class="modal-close" onclick="this.closest('.modal-container').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="setting-item">
                        <label>Task</label>
                        <input type="text" id="reminder-task" placeholder="What should I remind you about?">
                    </div>
                    <div class="setting-item">
                        <label>When</label>
                        <input type="datetime-local" id="reminder-time">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-container').remove()">Cancel</button>
                    <button class="btn-primary" onclick="JARVIS_APP.saveReminder()">Set Reminder</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set default time to now + 1 hour
        const timeInput = modal.querySelector('#reminder-time');
        const now = new Date();
        now.setHours(now.getHours() + 1);
        timeInput.value = now.toISOString().slice(0, 16);
    },
    
    saveReminder() {
        const task = document.getElementById('reminder-task').value;
        const time = document.getElementById('reminder-time').value;
        
        if (!task || !time) {
            JARVIS.notify('Please fill in all fields', 'error');
            return;
        }
        
        const dueDate = new Date(time);
        JARVIS.Features.Reminders.create(task, dueDate);
        
        document.querySelector('.modal-container')?.remove();
        JARVIS.notify('Reminder set', 'success');
    },
    
    // ==========================================
    // CALCULATOR
    // ==========================================
    
    bindCalculator() {
        // Calculator is initialized in features.js
        // Additional bindings can be added here
    },
    
    // ==========================================
    // WEATHER
    // ==========================================
    
    bindWeather() {
        const searchBtn = document.getElementById('weather-search-btn');
        const searchInput = document.getElementById('weather-search-input');
        
        if (searchBtn && searchInput) {
            const doSearch = () => {
                const city = searchInput.value.trim();
                if (city) {
                    JARVIS.Features.Weather.fetchWeather(city).then(data => {
                        if (data) {
                            JARVIS.Features.Weather.renderWeather(data);
                            JARVIS.Features.Weather.fetchForecast(city);
                        }
                    });
                }
            };
            
            searchBtn.addEventListener('click', doSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') doSearch();
            });
        }
    },
    
    // ==========================================
    // SETTINGS
    // ==========================================
    
    bindSettings() {
        // Load current settings
        const usernameInput = document.getElementById('setting-username');
        if (usernameInput) {
            usernameInput.value = JARVIS.data.preferences.username || 'Sir';
            usernameInput.addEventListener('change', (e) => {
                JARVIS.data.preferences.username = e.target.value;
                JARVIS.state.currentUser = e.target.value;
                JARVIS.Storage.local.set('preferences', JARVIS.data.preferences);
                JARVIS.notify('Settings saved', 'success');
            });
        }
        
        // Theme setting
        const themeSelect = document.getElementById('setting-theme');
        if (themeSelect) {
            themeSelect.value = JARVIS.data.preferences.theme || 'dark';
            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                JARVIS.data.preferences.theme = theme;
                
                document.body.classList.remove('light-theme', 'dark-theme');
                if (theme === 'light') {
                    document.body.classList.add('light-theme');
                } else if (theme === 'dark') {
                    document.body.classList.add('dark-theme');
                }
                
                JARVIS.Storage.local.set('preferences', JARVIS.data.preferences);
            });
        }
        
        // AI Model setting
        const modelSelect = document.getElementById('setting-ai-model');
        if (modelSelect) {
            // Populate with available models
            modelSelect.innerHTML = Object.entries(JARVIS_CONFIG.AI.MODELS)
                .map(([id, name]) => `<option value="${id}">${name}</option>`)
                .join('');
            
            modelSelect.value = JARVIS_CONFIG.AI.CURRENT_MODEL;
            
            modelSelect.addEventListener('change', (e) => {
                JARVIS_CONFIG.AI.CURRENT_MODEL = e.target.value;
                JARVIS.notify(`Model changed to ${JARVIS_CONFIG.AI.MODELS[e.target.value]}`, 'success');
            });
        }
        
        // API settings
        const apiEndpoint = document.getElementById('setting-api-endpoint');
        const apiKey = document.getElementById('setting-api-key');
        
        if (apiEndpoint) {
            apiEndpoint.value = JARVIS_CONFIG.AI.API.ENDPOINT;
            apiEndpoint.addEventListener('change', (e) => {
                JARVIS_CONFIG.AI.API.ENDPOINT = e.target.value;
            });
        }
        
        if (apiKey) {
            apiKey.value = JARVIS_CONFIG.AI.API.KEY ? '••••••••' : '';
            apiKey.addEventListener('change', (e) => {
                if (e.target.value && e.target.value !== '••••••••') {
                    JARVIS_CONFIG.AI.API.KEY = e.target.value;
                }
            });
        }
        
        // Color picker
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const color = e.target.dataset.color;
                document.documentElement.style.setProperty('--primary', color);
            });
        });
    },
    
    // ==========================================
    // GLOBAL SHORTCUTS
    // ==========================================
    
    bindGlobalShortcuts() {
        // Keyboard shortcuts are partially handled in core.js
        // Additional app-specific shortcuts here
        
        // Ctrl/Cmd + numbers for quick nav
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                const apps = ['dashboard', 'assistant', 'voice', 'notes', 'reminders'];
                const num = parseInt(e.key);
                
                if (num >= 1 && num <= apps.length) {
                    e.preventDefault();
                    const app = apps[num - 1];
                    JARVIS.navigateTo(app);
                    this.updateActiveNav(app);
                }
            }
        });
    },
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    showModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-container').remove()">×</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer"></div>
            </div>
        `;
        
        const footer = modal.querySelector('.modal-footer');
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = btn.class || 'btn-primary';
            button.textContent = btn.text;
            button.onclick = () => {
                if (btn.action) btn.action();
                if (btn.close !== false) modal.remove();
            };
            footer.appendChild(button);
        });
        
        document.body.appendChild(modal);
        return modal;
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => JARVIS_APP.init());
} else {
    JARVIS_APP.init();
}

// Hide splash screen when systems are ready
JARVIS.events.on('system:ready', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        
        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => splash.style.display = 'none', 500);
        }
        
        if (app) {
            app.classList.remove('hidden');
        }
    }, 1500);
});
