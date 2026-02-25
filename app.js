/**
 * J.A.R.V.I.S. Application Interface
 * UI interactions and event bindings
 * ============================================
 */

const JARVIS_APP = {
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
        
        this.startClock();
        this.handleInitialRoute();
        
        console.log('APP Interface ready');
    },
    
    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const app = e.currentTarget.dataset.app;
                if (app) {
                    this.navigateTo(app);
                    this.updateActiveNav(app);
                }
            });
        });
    },
    
    navigateTo(app) {
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`app-${app}`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        window.location.hash = app;
    },
    
    updateActiveNav(app) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.app === app);
        });
    },
    
    handleInitialRoute() {
        const hash = window.location.hash.slice(1);
        const validApps = ['dashboard', 'assistant', 'voice', 'notes', 'reminders', 'calculator', 'weather', 'settings', 'calendar', 'news', 'search', 'memory'];
        
        if (hash && validApps.includes(hash)) {
            this.navigateTo(hash);
            this.updateActiveNav(hash);
        } else {
            this.navigateTo('dashboard');
        }
    },
    
    bindHeader() {
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                document.body.classList.toggle('light-theme');
                const isLight = document.body.classList.contains('light-theme');
                localStorage.setItem('jarvis_theme', isLight ? 'light' : 'dark');
            });
        }
        
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.navigateTo('settings');
                this.updateActiveNav('settings');
            });
        }
        
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', () => {
                this.showNotification('Profile settings coming soon', 'info');
            });
        }
    },
    
    startClock() {
        const updateTime = () => {
            const now = new Date();
            
            const timeEl = document.getElementById('header-time');
            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString('en-US', { 
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
            
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
    
    bindDashboard() {
        const voiceBtn = document.getElementById('dashboard-voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.navigateTo('voice');
                this.updateActiveNav('voice');
            });
        }
        
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
    },
    
    handleQuickAction(action) {
        switch(action) {
            case 'note':
                this.navigateTo('notes');
                setTimeout(() => document.getElementById('new-note-btn')?.click(), 100);
                break;
            case 'reminder':
                this.navigateTo('reminders');
                setTimeout(() => document.getElementById('new-reminder-btn')?.click(), 100);
                break;
            case 'calculate':
                this.navigateTo('calculator');
                break;
            case 'search':
                this.navigateTo('search');
                break;
        }
    },
    
    bindAssistant() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-message');
        
        if (chatInput && sendBtn) {
            chatInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
            
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        const clearBtn = document.getElementById('clear-chat');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const messages = document.getElementById('chat-messages');
                if (messages) {
                    messages.innerHTML = `
                        <div class="message system-message">
                            <div class="message-content">
                                <p>Conversation cleared. How can I help you?</p>
                                <span class="message-time">Just now</span>
                            </div>
                        </div>
                    `;
                }
            });
        }
        
        const exportBtn = document.getElementById('export-chat');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportChat();
            });
        }
    },
    
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addMessageToChat('user', message);
        input.value = '';
        input.style.height = 'auto';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await this.callAI(message);
            this.hideTypingIndicator();
            this.addMessageToChat('jarvis', response);
            this.speak(response);
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessageToChat('jarvis', 'I apologize, but I encountered an error processing your request. Please check my configuration and try again.');
            console.error('AI Error:', error);
        }
    },
    
    async callAI(message) {
        if (!JARVIS_CONFIG.AI.API.USE_EXTERNAL_API || !JARVIS_CONFIG.AI.API.KEY) {
            return this.getLocalResponse(message);
        }
        
        const response = await fetch(JARVIS_CONFIG.AI.API.ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JARVIS_CONFIG.AI.API.KEY}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'JARVIS AI Assistant'
            },
            body: JSON.stringify({
                model: JARVIS_CONFIG.AI.CURRENT_MODEL,
                messages: [
                    { role: 'system', content: JARVIS_CONFIG.AI.SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ],
                max_tokens: JARVIS_CONFIG.AI.API.MAX_TOKENS,
                temperature: JARVIS_CONFIG.AI.API.TEMPERATURE,
                top_p: JARVIS_CONFIG.AI.API.TOP_P
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    },
    
    getLocalResponse(message) {
        const responses = [
            "I'm currently running in offline mode. Please configure my API settings to enable full AI capabilities.",
            "I understand you're asking about: " + message + ". However, I'm in local mode without AI connection.",
            "To use my full capabilities, please add your API key in the settings.",
            "I'm a prototype version. Connect me to an AI API for intelligent responses."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },
    
    showTypingIndicator() {
        const container = document.getElementById('chat-messages');
        const indicator = document.createElement('div');
        indicator.className = 'message jarvis-message typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="message-avatar">J</div>
            <div class="message-content">
                <p><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></p>
            </div>
        `;
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    },
    
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    },
    
    speak(text) {
        if (!JARVIS_CONFIG.VOICE.SYNTHESIS.ENABLED || !window.speechSynthesis) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = JARVIS_CONFIG.VOICE.SYNTHESIS.RATE;
        utterance.pitch = JARVIS_CONFIG.VOICE.SYNTHESIS.PITCH;
        utterance.volume = JARVIS_CONFIG.VOICE.SYNTHESIS.VOLUME;
        window.speechSynthesis.speak(utterance);
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
        const messages = Array.from(document.querySelectorAll('.message')).map(msg => {
            const isUser = msg.classList.contains('user-message');
            const text = msg.querySelector('.message-content p')?.textContent || '';
            const time = msg.querySelector('.message-time')?.textContent || '';
            return `[${time}] ${isUser ? 'User' : 'JARVIS'}: ${text}`;
        }).join('\n\n');
        
        const blob = new Blob([messages], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jarvis-chat-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Chat exported', 'success');
    },
    
    bindVoice() {
        const micBtn = document.getElementById('main-mic-btn');
        const statusEl = document.getElementById('voice-status');
        const transcriptEl = document.getElementById('transcript-text');
        const animationEl = document.getElementById('voice-animation');
        
        let recognition = null;
        
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onstart = () => {
                micBtn?.classList.add('listening');
                animationEl?.classList.add('listening');
                if (statusEl) statusEl.textContent = 'Listening...';
                if (transcriptEl) {
                    transcriptEl.textContent = '...';
                    transcriptEl.classList.add('listening');
                }
            };
            
            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                
                if (transcriptEl) transcriptEl.textContent = transcript;
                
                if (event.results[0].isFinal) {
                    transcriptEl?.classList.remove('listening');
                    setTimeout(() => this.processVoiceCommand(transcript), 500);
                }
            };
            
            recognition.onend = () => {
                micBtn?.classList.remove('listening');
                animationEl?.classList.remove('listening');
                if (statusEl) statusEl.textContent = 'Tap microphone to start';
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                this.showNotification('Voice recognition error: ' + event.error, 'error');
            };
        }
        
        if (micBtn) {
            micBtn.addEventListener('click', () => {
                if (recognition) {
                    recognition.start();
                } else {
                    this.showNotification('Voice recognition not supported in this browser', 'error');
                }
            });
        }
        
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const text = chip.textContent.replace(/"/g, '');
                this.processVoiceCommand(text);
            });
        });
    },
    
    async processVoiceCommand(text) {
        this.showNotification(`Processing: "${text}"`, 'info');
        
        // Navigate to assistant and send the message
        this.navigateTo('assistant');
        this.updateActiveNav('assistant');
        
        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = text;
                this.sendMessage();
            }
        }, 300);
    },
    
    bindNotes() {
        this.renderNotes();
        
        const newNoteBtn = document.getElementById('new-note-btn');
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', () => {
                this.openNoteEditor();
            });
        }
        
        const searchInput = document.getElementById('notes-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.renderNotes(e.target.value);
            }, 300));
        }
    },
    
    renderNotes(searchQuery = '') {
        const container = document.getElementById('notes-grid');
        if (!container) return;
        
        let notes = JSON.parse(localStorage.getItem('jarvis_notes') || '[]');
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            notes = notes.filter(note => 
                note.title.toLowerCase().includes(query) || 
                note.content.toLowerCase().includes(query)
            );
        }
        
        // Sort by updated date
        notes.sort((a, b) => new Date(b.updated) - new Date(a.updated));
        
        document.getElementById('notes-badge').textContent = notes.length;
        document.getElementById('total-notes').textContent = notes.length;
        
        if (notes.length === 0) {
            container.innerHTML = '<div class="empty-state">No notes yet. Click "New Note" to create one.</div>';
            return;
        }
        
        container.innerHTML = notes.map(note => `
            <div class="note-card" data-id="${note.id}">
                <div class="note-title">${this.escapeHtml(note.title || 'Untitled')}</div>
                <div class="note-preview">${this.escapeHtml(note.content || '')}</div>
                <div class="note-meta">
                    <span>${new Date(note.updated).toLocaleDateString()}</span>
                    <div class="note-actions">
                        <button class="note-action-btn" onclick="JARVIS_APP.editNote('${note.id}')" title="Edit">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button class="note-action-btn" onclick="JARVIS_APP.deleteNote('${note.id}')" title="Delete">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    openNoteEditor(noteId = null) {
        const notes = JSON.parse(localStorage.getItem('jarvis_notes') || '[]');
        const note = noteId ? notes.find(n => n.id === noteId) : null;
        
        const modal = document.createElement('div');
        modal.className = 'note-editor-overlay active';
        modal.innerHTML = `
            <div class="note-editor">
                <div class="note-editor-header">
                    <input type="text" class="note-editor-title" id="note-title" placeholder="Note title..." value="${note ? this.escapeHtml(note.title) : ''}">
                    <button class="modal-close" onclick="this.closest('.note-editor-overlay').remove()">×</button>
                </div>
                <div class="note-editor-body">
                    <textarea class="note-editor-content" id="note-content" placeholder="Start typing...">${note ? this.escapeHtml(note.content) : ''}</textarea>
                </div>
                <div class="note-editor-footer">
                    <span>${note ? 'Last edited: ' + new Date(note.updated).toLocaleString() : 'New note'}</span>
                    <div class="note-editor-actions">
                        <button class="btn-secondary" onclick="this.closest('.note-editor-overlay').remove()">Cancel</button>
                        <button class="btn-primary" id="save-note-btn">Save</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('save-note-btn').addEventListener('click', () => {
            const title = document.getElementById('note-title').value.trim();
            const content = document.getElementById('note-content').value.trim();
            
            if (!title && !content) {
                this.showNotification('Please add a title or content', 'error');
                return;
            }
            
            const now = new Date().toISOString();
            let notes = JSON.parse(localStorage.getItem('jarvis_notes') || '[]');
            
            if (noteId) {
                const index = notes.findIndex(n => n.id === noteId);
                if (index !== -1) {
                    notes[index] = { ...notes[index], title: title || 'Untitled', content, updated: now };
                }
            } else {
                notes.push({
                    id: Date.now().toString(),
                    title: title || 'Untitled',
                    content,
                    created: now,
                    updated: now
                });
            }
            
            localStorage.setItem('jarvis_notes', JSON.stringify(notes));
            modal.remove();
            this.renderNotes();
            this.showNotification('Note saved', 'success');
        });
    },
    
    editNote(id) {
        this.openNoteEditor(id);
    },
    
    deleteNote(id) {
        if (!confirm('Are you sure you want to delete this note?')) return;
        
        let notes = JSON.parse(localStorage.getItem('jarvis_notes') || '[]');
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('jarvis_notes', JSON.stringify(notes));
        this.renderNotes();
        this.showNotification('Note deleted', 'success');
    },
    
    bindReminders() {
        this.renderReminders();
        
        const newReminderBtn = document.getElementById('new-reminder-btn');
        if (newReminderBtn) {
            newReminderBtn.addEventListener('click', () => {
                this.showReminderModal();
            });
        }
    },
    
    renderReminders() {
        const container = document.getElementById('reminders-list');
        if (!container) return;
        
        let reminders = JSON.parse(localStorage.getItem('jarvis_reminders') || '[]');
        reminders.sort((a, b) => new Date(a.time) - new Date(b.time));
        
        document.getElementById('reminders-badge').textContent = reminders.filter(r => !r.completed).length;
        document.getElementById('total-reminders').textContent = reminders.length;
        
        if (reminders.length === 0) {
            container.innerHTML = '<div class="empty-state">No reminders. Click "Add Reminder" to create one.</div>';
            return;
        }
        
        container.innerHTML = reminders.map(reminder => {
            const isOverdue = new Date(reminder.time) < new Date() && !reminder.completed;
            return `
                <div class="reminder-item ${reminder.completed ? 'completed' : ''}" data-id="${reminder.id}">
                    <div class="reminder-checkbox ${reminder.completed ? 'checked' : ''}" onclick="JARVIS_APP.toggleReminder('${reminder.id}')"></div>
                    <div class="reminder-content">
                        <div class="reminder-text">${this.escapeHtml(reminder.text)}</div>
                        <div class="reminder-time ${isOverdue ? 'overdue' : ''}">
                            ${isOverdue ? '⚠️ ' : ''}${new Date(reminder.time).toLocaleString()}
                        </div>
                    </div>
                    <button class="reminder-delete" onclick="JARVIS_APP.deleteReminder('${reminder.id}')" title="Delete">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    },
    
    showReminderModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        modal.style.display = 'flex';
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
        
        const timeInput = modal.querySelector('#reminder-time');
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 60);
        timeInput.value = now.toISOString().slice(0, 16);
        
        modal.querySelector('#reminder-task').focus();
    },
    
    saveReminder() {
        const task = document.getElementById('reminder-task').value.trim();
        const time = document.getElementById('reminder-time').value;
        
        if (!task || !time) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        const reminders = JSON.parse(localStorage.getItem('jarvis_reminders') || '[]');
        reminders.push({
            id: Date.now().toString(),
            text: task,
            time: new Date(time).toISOString(),
            completed: false,
            created: new Date().toISOString()
        });
        
        localStorage.setItem('jarvis_reminders', JSON.stringify(reminders));
        document.querySelector('.modal-container')?.remove();
        this.renderReminders();
        this.showNotification('Reminder set', 'success');
    },
    
    toggleReminder(id) {
        let reminders = JSON.parse(localStorage.getItem('jarvis_reminders') || '[]');
        const index = reminders.findIndex(r => r.id === id);
        if (index !== -1) {
            reminders[index].completed = !reminders[index].completed;
            localStorage.setItem('jarvis_reminders', JSON.stringify(reminders));
            this.renderReminders();
        }
    },
    
    deleteReminder(id) {
        if (!confirm('Are you sure you want to delete this reminder?')) return;
        
        let reminders = JSON.parse(localStorage.getItem('jarvis_reminders') || '[]');
        reminders = reminders.filter(r => r.id !== id);
        localStorage.setItem('jarvis_reminders', JSON.stringify(reminders));
        this.renderReminders();
        this.showNotification('Reminder deleted', 'success');
    },
    
    bindCalculator() {
        let currentInput = '0';
        let previousInput = '';
        let operation = null;
        let shouldResetScreen = false;
        
        const display = document.getElementById('calc-input');
        const history = document.getElementById('calc-history');
        
        const updateDisplay = () => {
            if (display) display.textContent = currentInput;
        };
        
        document.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;
                const action = btn.dataset.action;
                
                if (value !== undefined) {
                    if (currentInput === '0' || shouldResetScreen) {
                        currentInput = value;
                        shouldResetScreen = false;
                    } else {
                        currentInput += value;
                    }
                    updateDisplay();
                } else if (action) {
                    switch(action) {
                        case 'clear':
                            currentInput = '0';
                            previousInput = '';
                            operation = null;
                            if (history) history.textContent = '';
                            updateDisplay();
                            break;
                        case 'delete':
                            currentInput = currentInput.slice(0, -1) || '0';
                            updateDisplay();
                            break;
                        case 'percent':
                            currentInput = (parseFloat(currentInput) / 100).toString();
                            updateDisplay();
                            break;
                        case 'equals':
                            if (operation && previousInput) {
                                const result = this.calculate(parseFloat(previousInput), parseFloat(currentInput), operation);
                                if (history) history.textContent = `${previousInput} ${operation} ${currentInput} =`;
                                currentInput = result.toString();
                                operation = null;
                                previousInput = '';
                                shouldResetScreen = true;
                                updateDisplay();
                            }
                            break;
                        default:
                            if (['add', 'subtract', 'multiply', 'divide'].includes(action)) {
                                if (operation && !shouldResetScreen) {
                                    const result = this.calculate(parseFloat(previousInput), parseFloat(currentInput), operation);
                                    currentInput = result.toString();
                                    updateDisplay();
                                }
                                previousInput = currentInput;
                                operation = action;
                                shouldResetScreen = true;
                                if (history) history.textContent = `${previousInput} ${this.getOperatorSymbol(action)}`;
                            }
                            break;
                    }
                }
            });
        });
    },
    
    calculate(a, b, operation) {
        switch(operation) {
            case 'add': return a + b;
            case 'subtract': return a - b;
            case 'multiply': return a * b;
            case 'divide': return b !== 0 ? a / b : 'Error';
            default: return b;
        }
    },
    
    getOperatorSymbol(operation) {
        const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
        return symbols[operation] || '';
    },
    
    bindWeather() {
        // Load default weather
        this.fetchWeather('New York');
        
        const searchBtn = document.getElementById('weather-search-btn');
        const searchInput = document.getElementById('weather-search-input');
        
        if (searchBtn && searchInput) {
            const doSearch = () => {
                const city = searchInput.value.trim();
                if (city) this.fetchWeather(city);
            };
            
            searchBtn.addEventListener('click', doSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') doSearch();
            });
        }
    },
    
    async fetchWeather(city) {
        if (!JARVIS_CONFIG.APIS.WEATHER.KEY) {
            // Demo mode - show mock data
            this.updateWeatherDisplay({
                city: city,
                temp: Math.floor(Math.random() * 30) + 10,
                condition: 'Partly Cloudy',
                humidity: Math.floor(Math.random() * 50) + 30,
                wind: Math.floor(Math.random() * 20) + 5,
                icon: '⛅'
            });
            return;
        }
        
        try {
            const response = await fetch(
                `${JARVIS_CONFIG.APIS.WEATHER.ENDPOINT}/weather?q=${city}&appid=${JARVIS_CONFIG.APIS.WEATHER.KEY}&units=${JARVIS_CONFIG.APIS.WEATHER.UNITS}`
            );
            const data = await response.json();
            
            this.updateWeatherDisplay({
                city: data.name,
                temp: Math.round(data.main.temp),
                condition: data.weather[0].description,
                humidity: data.main.humidity,
                wind: data.wind.speed,
                icon: this.getWeatherIcon(data.weather[0].main)
            });
        } catch (error) {
            console.error('Weather fetch error:', error);
            this.showNotification('Could not fetch weather data', 'error');
        }
    },
    
    updateWeatherDisplay(data) {
        document.getElementById('weather-location').textContent = data.city;
        document.getElementById('weather-temp').textContent = `${data.temp}°`;
        document.getElementById('weather-desc').textContent = data.condition;
        document.getElementById('weather-icon').textContent = data.icon;
        document.getElementById('weather-humidity').textContent = `${data.humidity}%`;
        document.getElementById('weather-wind').textContent = `${data.wind} mph`;
        
        // Dashboard weather card
        const dashTemp = document.getElementById('weather-temp');
        if (dashTemp) dashTemp.textContent = `${data.temp}°`;
    },
    
    getWeatherIcon(condition) {
        const icons = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '🌨️',
            'Mist': '🌫️',
            'Fog': '🌫️'
        };
        return icons[condition] || '⛅';
    },
    
    bindSettings() {
        // Load saved preferences
        const savedTheme = localStorage.getItem('jarvis_theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }
        
        // Username
        const usernameInput = document.getElementById('setting-username');
        if (usernameInput) {
            const savedName = localStorage.getItem('jarvis_username') || 'Sir';
            usernameInput.value = savedName;
            document.getElementById('user-name').textContent = savedName;
            document.getElementById('user-avatar').querySelector('span').textContent = savedName.charAt(0).toUpperCase();
            
            usernameInput.addEventListener('change', (e) => {
                const name = e.target.value || 'Sir';
                localStorage.setItem('jarvis_username', name);
                document.getElementById('user-name').textContent = name;
                document.getElementById('user-avatar').querySelector('span').textContent = name.charAt(0).toUpperCase();
                this.showNotification('Username updated', 'success');
            });
        }
        
        // Theme
        const themeSelect = document.getElementById('setting-theme');
        if (themeSelect) {
            themeSelect.value = savedTheme || 'dark';
            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                localStorage.setItem('jarvis_theme', theme);
                document.body.classList.remove('light-theme', 'dark-theme');
                if (theme === 'light') document.body.classList.add('light-theme');
                else if (theme === 'dark') document.body.classList.add('dark-theme');
            });
        }
        
        // AI Model - Populate from config
        const modelSelect = document.getElementById('setting-ai-model');
        if (modelSelect) {
            modelSelect.innerHTML = Object.entries(JARVIS_CONFIG.AI.MODELS)
                .map(([id, name]) => `<option value="${id}" ${id === JARVIS_CONFIG.AI.CURRENT_MODEL ? 'selected' : ''}>${name}</option>`)
                .join('');
            
            modelSelect.addEventListener('change', (e) => {
                JARVIS_CONFIG.AI.CURRENT_MODEL = e.target.value;
                this.showNotification(`Model changed to ${JARVIS_CONFIG.AI.MODELS[e.target.value]}`, 'success');
            });
        }
        
        // API Endpoint
        const apiEndpoint = document.getElementById('setting-api-endpoint');
        if (apiEndpoint) {
            apiEndpoint.value = JARVIS_CONFIG.AI.API.ENDPOINT;
            apiEndpoint.addEventListener('change', (e) => {
                JARVIS_CONFIG.AI.API.ENDPOINT = e.target.value;
            });
        }
        
        // API Key
        const apiKey = document.getElementById('setting-api-key');
        if (apiKey) {
            apiKey.value = JARVIS_CONFIG.AI.API.KEY ? '••••••••••••••••' : '';
            apiKey.addEventListener('change', (e) => {
                if (e.target.value && e.target.value !== '••••••••••••••••') {
                    JARVIS_CONFIG.AI.API.KEY = e.target.value;
                    this.showNotification('API Key updated', 'success');
                }
            });
        }
        
        // Voice settings
        const voiceToggle = document.getElementById('setting-voice');
        if (voiceToggle) {
            voiceToggle.checked = JARVIS_CONFIG.VOICE.RECOGNITION.ENABLED;
            voiceToggle.addEventListener('change', (e) => {
                JARVIS_CONFIG.VOICE.RECOGNITION.ENABLED = e.target.checked;
            });
        }
        
        const ttsToggle = document.getElementById('setting-tts');
        if (ttsToggle) {
            ttsToggle.checked = JARVIS_CONFIG.VOICE.SYNTHESIS.ENABLED;
            ttsToggle.addEventListener('change', (e) => {
                JARVIS_CONFIG.VOICE.SYNTHESIS.ENABLED = e.target.checked;
            });
        }
        
        // Color picker
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const color = e.target.dataset.color;
                document.documentElement.style.setProperty('--primary', color);
                localStorage.setItem('jarvis_accent', color);
            });
        });
        
        // Load saved accent color
        const savedAccent = localStorage.getItem('jarvis_accent');
        if (savedAccent) {
            document.documentElement.style.setProperty('--primary', savedAccent);
            document.querySelectorAll('.color-option').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.color === savedAccent);
            });
        }
    },
    
    bindGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                const apps = ['dashboard', 'assistant', 'voice', 'notes', 'reminders'];
                const num = parseInt(e.key);
                
                if (num >= 1 && num <= apps.length) {
                    e.preventDefault();
                    const app = apps[num - 1];
                    this.navigateTo(app);
                    this.updateActiveNav(app);
                }
            }
        });
    },
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => JARVIS_APP.init());
} else {
    JARVIS_APP.init();
}

// Hide splash screen when ready
window.addEventListener('load', () => {
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
    }, 2000);
});
