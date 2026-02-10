/**
 * J.A.R.V.I.S. Features Module
 * Individual app functionality and feature implementations
 * ============================================
 */

// Extend JARVIS with Features
JARVIS.Features = {
    // ==========================================
    // NOTES FEATURE
    // ==========================================
    
    Notes: {
        currentNote: null,
        
        createFromCommand(input) {
            // Extract note content from command
            const patterns = [
                /note that (.*)/i,
                /remember that (.*)/i,
                /save this: (.*)/i,
                /write down (.*)/i,
                /remind me to (.*)/i
            ];
            
            let content = '';
            for (const pattern of patterns) {
                const match = input.match(pattern);
                if (match) {
                    content = match[1];
                    break;
                }
            }
            
            if (!content) {
                // If no pattern matched, remove command words and use rest
                content = input.replace(/\b(note|remember|save|write down|record)\b/gi, '').trim();
            }
            
            if (!content) {
                return "What would you like me to note down?";
            }
            
            const note = this.create(content);
            return `I've noted: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`;
        },
        
        create(content, title = null) {
            if (!content.trim()) return null;
            
            const note = {
                id: JARVIS.generateId(),
                title: title || content.split('\n')[0].substring(0, 50),
                content: content,
                created: Date.now(),
                updated: Date.now(),
                tags: [],
                pinned: false,
                color: null
            };
            
            JARVIS.data.notes.unshift(note);
            JARVIS.Storage.local.set('notes', JARVIS.data.notes);
            
            JARVIS.events.emit('notes:create', note);
            this.updateBadge();
            
            return note;
        },
        
        update(id, updates) {
            const index = JARVIS.data.notes.findIndex(n => n.id === id);
            if (index === -1) return null;
            
            JARVIS.data.notes[index] = {
                ...JARVIS.data.notes[index],
                ...updates,
                updated: Date.now()
            };
            
            JARVIS.Storage.local.set('notes', JARVIS.data.notes);
            JARVIS.events.emit('notes:update', JARVIS.data.notes[index]);
            
            return JARVIS.data.notes[index];
        },
        
        delete(id) {
            const note = JARVIS.data.notes.find(n => n.id === id);
            if (!note) return false;
            
            JARVIS.data.notes = JARVIS.data.notes.filter(n => n.id !== id);
            JARVIS.Storage.local.set('notes', JARVIS.data.notes);
            
            JARVIS.events.emit('notes:delete', note);
            this.updateBadge();
            
            return true;
        },
        
        search(query) {
            const lowerQuery = query.toLowerCase();
            return JARVIS.data.notes.filter(note => 
                note.title.toLowerCase().includes(lowerQuery) ||
                note.content.toLowerCase().includes(lowerQuery) ||
                note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        },
        
        render() {
            const container = document.getElementById('notes-grid');
            if (!container) return;
            
            if (JARVIS.data.notes.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <p>No notes yet. Create your first note!</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = JARVIS.data.notes.map(note => `
                <div class="note-card" data-id="${note.id}" onclick="JARVIS.Features.Notes.openEditor('${note.id}')">
                    <div class="note-title">${this.escapeHtml(note.title)}</div>
                    <div class="note-preview">${this.escapeHtml(note.content)}</div>
                    <div class="note-meta">
                        <span>${new Date(note.updated).toLocaleDateString()}</span>
                        <div class="note-actions" onclick="event.stopPropagation()">
                            <button class="note-action-btn" onclick="JARVIS.Features.Notes.delete('${note.id}')" title="Delete">
                                <svg viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        },
        
        openEditor(noteId = null) {
            this.currentNote = noteId ? JARVIS.data.notes.find(n => n.id === noteId) : null;
            
            // Create modal if not exists
            let modal = document.getElementById('note-editor-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'note-editor-modal';
                modal.className = 'note-editor-overlay';
                modal.innerHTML = `
                    <div class="note-editor">
                        <div class="note-editor-header">
                            <input type="text" class="note-editor-title" placeholder="Note title...">
                            <button class="modal-close" onclick="JARVIS.Features.Notes.closeEditor()">×</button>
                        </div>
                        <div class="note-editor-body">
                            <textarea class="note-editor-content" placeholder="Start typing..."></textarea>
                        </div>
                        <div class="note-editor-footer">
                            <span class="last-saved"></span>
                            <div class="note-editor-actions">
                                <button class="btn-secondary" onclick="JARVIS.Features.Notes.closeEditor()">Cancel</button>
                                <button class="btn-primary" onclick="JARVIS.Features.Notes.saveFromEditor()">Save</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            // Populate fields
            const titleInput = modal.querySelector('.note-editor-title');
            const contentInput = modal.querySelector('.note-editor-content');
            
            if (this.currentNote) {
                titleInput.value = this.currentNote.title;
                contentInput.value = this.currentNote.content;
            } else {
                titleInput.value = '';
                contentInput.value = '';
            }
            
            // Show modal
            modal.classList.add('active');
            contentInput.focus();
            
            // Auto-resize textarea
            contentInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
        },
        
        closeEditor() {
            const modal = document.getElementById('note-editor-modal');
            if (modal) {
                modal.classList.remove('active');
            }
            this.currentNote = null;
        },
        
        saveFromEditor() {
            const modal = document.getElementById('note-editor-modal');
            const title = modal.querySelector('.note-editor-title').value;
            const content = modal.querySelector('.note-editor-content').value;
            
            if (!content.trim()) {
                JARVIS.notify('Note cannot be empty', 'warning');
                return;
            }
            
            if (this.currentNote) {
                this.update(this.currentNote.id, { title, content });
                JARVIS.notify('Note updated', 'success');
            } else {
                this.create(content, title);
                JARVIS.notify('Note created', 'success');
            }
            
            this.closeEditor();
            this.render();
        },
        
        updateBadge() {
            const badge = document.getElementById('notes-badge');
            if (badge) {
                badge.textContent = JARVIS.data.notes.length;
                badge.style.display = JARVIS.data.notes.length > 0 ? 'block' : 'none';
            }
        },
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    },
    
    // ==========================================
    // REMINDERS FEATURE
    // ==========================================
    
    Reminders: {
        checkInterval: null,
        
        createFromCommand(input) {
            // Parse reminder from natural language
            const patterns = [
                /remind me to (.*?) (?:at|on|in) (.*)/i,
                /remind me (?:at|on|in) (.*?) to (.*)/i,
                /remind me (?:that|about) (.*?) (?:at|on|in) (.*)/i
            ];
            
            let task = '';
            let timeStr = '';
            
            for (const pattern of patterns) {
                const match = input.match(pattern);
                if (match) {
                    task = match[1];
                    timeStr = match[2];
                    break;
                }
            }
            
            if (!task || !timeStr) {
                return "I couldn't understand the reminder. Try saying: 'Remind me to [task] at [time]'";
            }
            
            const dueDate = this.parseTime(timeStr);
            if (!dueDate) {
                return "I couldn't understand the time format. Try something like '3 PM' or 'in 30 minutes'.";
            }
            
            const reminder = this.create(task, dueDate);
            return `Reminder set for ${dueDate.toLocaleString()}: "${task}"`;
        },
        
        parseTime(timeStr) {
            const now = new Date();
            const lower = timeStr.toLowerCase();
            
            // Handle "in X minutes/hours"
            const inMatch = lower.match(/in (\d+) (minute|hour|day)s?/);
            if (inMatch) {
                const amount = parseInt(inMatch[1]);
                const unit = inMatch[2];
                const date = new Date(now);
                
                if (unit === 'minute') date.setMinutes(date.getMinutes() + amount);
                if (unit === 'hour') date.setHours(date.getHours() + amount);
                if (unit === 'day') date.setDate(date.getDate() + amount);
                
                return date;
            }
            
            // Handle specific times like "3 PM", "15:30"
            const timeMatch = lower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]) || 0;
                const period = timeMatch[3];
                
                if (period === 'pm' && hours < 12) hours += 12;
                if (period === 'am' && hours === 12) hours = 0;
                
                const date = new Date(now);
                date.setHours(hours, minutes, 0, 0);
                
                // If time has passed, set for tomorrow
                if (date < now) {
                    date.setDate(date.getDate() + 1);
                }
                
                return date;
            }
            
            // Try standard Date parsing
            const parsed = Date.parse(timeStr);
            if (!isNaN(parsed)) {
                return new Date(parsed);
            }
            
            return null;
        },
        
        create(task, dueDate, priority = 'normal') {
            const reminder = {
                id: JARVIS.generateId(),
                task: task,
                due: dueDate.getTime(),
                priority,
                completed: false,
                created: Date.now(),
                notified: false
            };
            
            JARVIS.data.reminders.push(reminder);
            JARVIS.Storage.local.set('reminders', JARVIS.data.reminders);
            
            JARVIS.events.emit('reminders:create', reminder);
            this.updateBadge();
            this.scheduleCheck();
            
            return reminder;
        },
        
        complete(id) {
            const reminder = JARVIS.data.reminders.find(r => r.id === id);
            if (!reminder) return false;
            
            reminder.completed = !reminder.completed;
            JARVIS.Storage.local.set('reminders', JARVIS.data.reminders);
            
            JARVIS.events.emit('reminders:complete', reminder);
            this.render();
            
            return true;
        },
        
        delete(id) {
            JARVIS.data.reminders = JARVIS.data.reminders.filter(r => r.id !== id);
            JARVIS.Storage.local.set('reminders', JARVIS.data.reminders);
            
            JARVIS.events.emit('reminders:delete', { id });
            this.updateBadge();
            this.render();
            
            return true;
        },
        
        checkDue() {
            const now = Date.now();
            const due = JARVIS.data.reminders.filter(r => 
                !r.completed && 
                !r.notified && 
                r.due <= now
            );
            
            due.forEach(reminder => {
                // Show notification
                JARVIS.notify(`Reminder: ${reminder.task}`, 'warning', 10000);
                
                // Speak if voice enabled
                JARVIS.Voice.speak(`Reminder: ${reminder.task}`);
                
                // Mark as notified
                reminder.notified = true;
            });
            
            if (due.length > 0) {
                JARVIS.Storage.local.set('reminders', JARVIS.data.reminders);
                this.render();
            }
        },
        
        scheduleCheck() {
            // Check every minute
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
            }
            
            this.checkInterval = setInterval(() => this.checkDue(), 60000);
        },
        
        render() {
            const container = document.getElementById('reminders-list');
            if (!container) return;
            
            const sorted = JARVIS.data.reminders
                .filter(r => !r.completed)
                .sort((a, b) => a.due - b.due);
            
            if (sorted.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No active reminders. Create one!</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = sorted.map(r => {
                const due = new Date(r.due);
                const isOverdue = due < new Date();
                const timeStr = due.toLocaleString();
                
                return `
                    <div class="reminder-item" data-id="${r.id}">
                        <div class="reminder-checkbox ${r.completed ? 'checked' : ''}" 
                             onclick="JARVIS.Features.Reminders.complete('${r.id}')"></div>
                        <div class="reminder-content">
                            <div class="reminder-text">${this.escapeHtml(r.task)}</div>
                            <div class="reminder-time ${isOverdue ? 'overdue' : ''}">
                                ${isOverdue ? '⚠️ Overdue: ' : '🕐 '}${timeStr}
                            </div>
                        </div>
                        <button class="reminder-delete" onclick="JARVIS.Features.Reminders.delete('${r.id}')" title="Delete">
                            ×
                        </button>
                    </div>
                `;
            }).join('');
        },
        
        updateBadge() {
            const active = JARVIS.data.reminders.filter(r => !r.completed).length;
            const badge = document.getElementById('reminders-badge');
            if (badge) {
                badge.textContent = active;
                badge.style.display = active > 0 ? 'block' : 'none';
            }
        },
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    },
    
    // ==========================================
    // CALCULATOR FEATURE
    // ==========================================
    
    Calculator: {
        currentInput: '0',
        previousInput: '',
        operation: null,
        resetNext: false,
        
        init() {
            this.bindEvents();
        },
        
        bindEvents() {
            document.querySelectorAll('.calc-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const value = e.target.dataset.value;
                    const action = e.target.dataset.action;
                    
                    if (value !== undefined) {
                        this.appendNumber(value);
                    } else if (action) {
                        this.performAction(action);
                    }
                });
            });
        },
        
        appendNumber(num) {
            if (this.resetNext) {
                this.currentInput = '';
                this.resetNext = false;
            }
            
            if (num === '.' && this.currentInput.includes('.')) return;
            if (this.currentInput === '0' && num !== '.') {
                this.currentInput = num;
            } else {
                this.currentInput += num;
            }
            
            this.updateDisplay();
        },
        
        performAction(action) {
            switch(action) {
                case 'clear':
                    this.currentInput = '0';
                    this.previousInput = '';
                    this.operation = null;
                    break;
                case 'delete':
                    this.currentInput = this.currentInput.slice(0, -1) || '0';
                    break;
                case 'percent':
                    this.currentInput = String(parseFloat(this.currentInput) / 100);
                    break;
                case 'divide':
                case 'multiply':
                case 'subtract':
                case 'add':
                    this.setOperation(action);
                    break;
                case 'equals':
                    this.calculate();
                    break;
            }
            
            this.updateDisplay();
        },
        
        setOperation(op) {
            if (this.operation !== null) {
                this.calculate();
            }
            
            this.previousInput = this.currentInput;
            this.operation = op;
            this.resetNext = true;
        },
        
        calculate() {
            if (!this.operation || !this.previousInput) return;
            
            const prev = parseFloat(this.previousInput);
            const current = parseFloat(this.currentInput);
            let result;
            
            switch(this.operation) {
                case 'add': result = prev + current; break;
                case 'subtract': result = prev - current; break;
                case 'multiply': result = prev * current; break;
                case 'divide': result = current !== 0 ? prev / current : 'Error'; break;
                default: return;
            }
            
            this.currentInput = String(result);
            this.operation = null;
            this.previousInput = '';
            this.resetNext = true;
        },
        
        updateDisplay() {
            const inputEl = document.getElementById('calc-input');
            const historyEl = document.getElementById('calc-history');
            
            if (inputEl) inputEl.textContent = this.currentInput;
            if (historyEl) {
                historyEl.textContent = this.operation ? 
                    `${this.previousInput} ${this.getOperatorSymbol(this.operation)}` : '';
            }
        },
        
        getOperatorSymbol(op) {
            const symbols = {
                add: '+',
                subtract: '−',
                multiply: '×',
                divide: '÷'
            };
            return symbols[op] || '';
        }
    },
    
    // ==========================================
    // WEATHER FEATURE
    // ==========================================
    
    Weather: {
        currentLocation: null,
        currentData: null,
        
        async fetchWeather(location = null) {
            if (!JARVIS_CONFIG.APIS.WEATHER.ENABLED) {
                JARVIS.notify('Weather API not configured', 'warning');
                return null;
            }
            
            const city = location || JARVIS_CONFIG.APIS.WEATHER.DEFAULT_CITY;
            const { KEY, ENDPOINT, UNITS } = JARVIS_CONFIG.APIS.WEATHER;
            
            try {
                const response = await fetch(
                    `${ENDPOINT}/weather?q=${encodeURIComponent(city)}&appid=${KEY}&units=${UNITS}`
                );
                
                if (!response.ok) throw new Error('Weather fetch failed');
                
                const data = await response.json();
                this.currentData = data;
                this.currentLocation = city;
                
                JARVIS.events.emit('weather:update', data);
                return data;
                
            } catch (error) {
                console.error('Weather error:', error);
                JARVIS.notify('Failed to fetch weather', 'error');
                return null;
            }
        },
        
        async fetchForecast(location = null) {
            if (!JARVIS_CONFIG.APIS.WEATHER.ENABLED) return null;
            
            const city = location || this.currentLocation || JARVIS_CONFIG.APIS.WEATHER.DEFAULT_CITY;
            const { KEY, ENDPOINT, UNITS } = JARVIS_CONFIG.APIS.WEATHER;
            
            try {
                const response = await fetch(
                    `${ENDPOINT}/forecast?q=${encodeURIComponent(city)}&appid=${KEY}&units=${UNITS}`
                );
                
                if (!response.ok) throw new Error('Forecast fetch failed');
                
                const data = await response.json();
                return data;
                
            } catch (error) {
                console.error('Forecast error:', error);
                return null;
            }
        },
        
        renderWeather(data) {
            if (!data) return;
            
            const temp = Math.round(data.main.temp);
            const description = data.weather[0].description;
            const icon = this.getWeatherIcon(data.weather[0].id);
            
            // Update dashboard
            const tempEl = document.getElementById('weather-temp');
            const descEl = document.getElementById('weather-desc');
            const iconEl = document.getElementById('weather-icon');
            const locEl = document.getElementById('weather-location');
            const humEl = document.getElementById('weather-humidity');
            const windEl = document.getElementById('weather-wind');
            
            if (tempEl) tempEl.textContent = `${temp}°`;
            if (descEl) descEl.textContent = description;
            if (iconEl) iconEl.textContent = icon;
            if (locEl) locEl.textContent = data.name;
            if (humEl) humEl.textContent = `${data.main.humidity}%`;
            if (windEl) windEl.textContent = `${Math.round(data.wind.speed)} mph`;
        },
        
        getWeatherIcon(code) {
            // Weather condition codes from OpenWeatherMap
            if (code >= 200 && code < 300) return '⛈️'; // Thunderstorm
            if (code >= 300 && code < 400) return '🌦️'; // Drizzle
            if (code >= 500 && code < 600) return '🌧️'; // Rain
            if (code >= 600 && code < 700) return '❄️'; // Snow
            if (code >= 700 && code < 800) return '🌫️'; // Atmosphere
            if (code === 800) return '☀️'; // Clear
            if (code === 801) return '🌤️'; // Few clouds
            if (code === 802) return '⛅'; // Scattered clouds
            if (code === 803 || code === 804) return '☁️'; // Clouds
            return '🌡️';
        }
    },
    
    // ==========================================
    // SEARCH FEATURE
    // ==========================================
    
    Search: {
        async perform(query, type = 'web') {
            if (!JARVIS_CONFIG.APIS.SEARCH.ENABLED) {
                // Fallback to browser search
                window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
                return;
            }
            
            // Implement API search if configured
            JARVIS.notify('Searching...', 'info');
        }
    },
    
    // ==========================================
    // CALENDAR FEATURE
    // ==========================================
    
    Calendar: {
        async init() {
            if (!JARVIS_CONFIG.APIS.CALENDAR.ENABLED) return;
            
            // Initialize Google Calendar API
            // This requires additional OAuth setup
        },
        
        async fetchEvents() {
            // Fetch events from calendar API
        },
        
        async createEvent(event) {
            // Create calendar event
        }
    }
};

// Initialize features when ready
JARVIS.events.on('system:ready', () => {
    // Initialize calculator
    JARVIS.Features.Calculator.init();
    
    // Start reminder checking
    JARVIS.Features.Reminders.scheduleCheck();
    
    // Update badges
    JARVIS.Features.Notes.updateBadge();
    JARVIS.Features.Reminders.updateBadge();
    
    // Fetch weather if enabled
    if (JARVIS_CONFIG.APIS.WEATHER.ENABLED) {
        JARVIS.Features.Weather.fetchWeather().then(data => {
            JARVIS.Features.Weather.renderWeather(data);
        });
    }
});
