// J.A.R.V.I.S. Features - Mini Apps

JARVIS.Features = {
    // App State
    currentApp: null,

    // Calculator
    Calculator: {
        current: '0',
        
        open() {
            this.current = '0';
            JARVIS.get('calc-display').textContent = '0';
            JARVIS.get('calc-app')?.classList.remove('hidden');
            JARVIS.Features.currentApp = 'calculator';
        },

        handle(val) {
            const display = JARVIS.get('calc-display');
            if (!display) return;
            
            let current = display.textContent;
            
            try {
                if (val === 'C') {
                    current = '0';
                } else if (val === '⌫') {
                    current = current.length > 1 ? current.slice(0, -1) : '0';
                } else if (val === '=') {
                    // Safe evaluation
                    const clean = current.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
                    // eslint-disable-next-line no-new-func
                    const result = Function('"use strict"; return (' + clean + ')')();
                    current = String(result).slice(0, 12);
                    if (current === 'Infinity' || current === 'NaN') current = 'Error';
                } else {
                    if (current === '0' && '0123456789'.includes(val)) {
                        current = val;
                    } else {
                        current = (current + val).slice(0, 12);
                    }
                }
                
                display.textContent = current;
            } catch (e) {
                display.textContent = 'Error';
            }
        }
    },

    // Notebook
    Notebook: {
        open() {
            JARVIS.get('notebook-app')?.classList.remove('hidden');
            JARVIS.Features.currentApp = 'notebook';
            this.render();
        },

        render() {
            const list = JARVIS.get('notebook-list');
            if (!list) return;
            
            const { notes } = JARVIS.state.memory;
            const { currentNote } = JARVIS.state;
            
            if (notes.length === 0) {
                list.innerHTML = '<div class="empty-notes">No notes yet. Tap "+ New" to create one.</div>';
                return;
            }
            
            list.innerHTML = notes.map((note, i) => 
                `<div class="note-item ${currentNote === i ? 'active' : ''}" data-index="${i}">
                    <span>${JARVIS.escapeHtml(note.title || 'Untitled')}</span>
                    <small>${new Date(note.date).toLocaleDateString()}</small>
                </div>`
            ).join('');
            
            // Add click handlers
            list.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', () => {
                    JARVIS.state.currentNote = parseInt(item.dataset.index);
                    this.load(JARVIS.state.currentNote);
                });
            });
        },

        load(index) {
            const note = JARVIS.state.memory.notes[index];
            if (!note) return;
            
            const title = JARVIS.get('note-title');
            const content = JARVIS.get('note-content');
            
            if (title) title.value = note.title || '';
            if (content) content.value = note.content || '';
            
            this.render();
        },

        new() {
            JARVIS.state.currentNote = null;
            const title = JARVIS.get('note-title');
            const content = JARVIS.get('note-content');
            
            if (title) title.value = '';
            if (content) content.value = '';
            
            title?.focus();
            this.render();
        },

        save() {
            const titleInput = JARVIS.get('note-title');
            const contentInput = JARVIS.get('note-content');
            
            const title = titleInput?.value.trim() || 'Untitled';
            const content = contentInput?.value || '';
            
            if (!content && title === 'Untitled') {
                JARVIS.showError('Cannot save empty note');
                return;
            }
            
            const { state } = JARVIS;
            
            if (state.currentNote !== null) {
                state.memory.notes[state.currentNote] = { 
                    title, 
                    content, 
                    date: Date.now() 
                };
            } else {
                state.memory.notes.push({ 
                    title, 
                    content, 
                    date: Date.now() 
                });
                state.currentNote = state.memory.notes.length - 1;
            }
            
            JARVIS.saveData();
            this.render();
            JARVIS.Voice.speak('Note saved');
        },

        delete() {
            const { state } = JARVIS;
            if (state.currentNote === null) {
                JARVIS.showError('No note selected');
                return;
            }
            
            if (!confirm('Delete this note?')) return;
            
            state.memory.notes.splice(state.currentNote, 1);
            state.currentNote = null;
            
            const title = JARVIS.get('note-title');
            const content = JARVIS.get('note-content');
            
            if (title) title.value = '';
            if (content) content.value = '';
            
            JARVIS.saveData();
            this.render();
            JARVIS.Voice.speak('Note deleted');
        }
    },

    // Tasks
    Tasks: {
        open() {
            JARVIS.get('tasks-app')?.classList.remove('hidden');
            JARVIS.Features.currentApp = 'tasks';
            this.render();
        },

        render() {
            const list = JARVIS.get('tasks-list');
            if (!list) return;
            
            const { tasks } = JARVIS.state.memory;
            
            if (tasks.length === 0) {
                list.innerHTML = '<div class="empty-tasks">No tasks yet. Add one above!</div>';
                return;
            }
            
            // Sort: incomplete first, then by date
            const sorted = [...tasks].sort((a, b) => {
                if (a.completed === b.completed) return b.id - a.id;
                return a.completed ? 1 : -1;
            });
            
            list.innerHTML = sorted.map(task => 
                `<div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span>${JARVIS.escapeHtml(task.text)}</span>
                    <button>×</button>
                </div>`
            ).join('');
            
            // Add handlers
            list.querySelectorAll('.task-item').forEach(item => {
                const id = parseInt(item.dataset.id);
                const checkbox = item.querySelector('input');
                const deleteBtn = item.querySelector('button');
                
                checkbox?.addEventListener('change', () => this.toggle(id));
                deleteBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.delete(id);
                });
            });
        },

        add() {
            const input = JARVIS.get('task-input');
            const text = input?.value.trim();
            
            if (!text) {
                JARVIS.showError('Please enter a task');
                return;
            }
            
            JARVIS.state.memory.tasks.push({ 
                text, 
                completed: false, 
                id: Date.now() 
            });
            
            if (input) input.value = '';
            JARVIS.saveData();
            this.render();
            
            // Haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(50);
        },

        toggle(id) {
            const task = JARVIS.state.memory.tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                JARVIS.saveData();
                this.render();
                
                if (task.completed && navigator.vibrate) {
                    navigator.vibrate([50, 50, 50]);
                }
            }
        },

        delete(id) {
            JARVIS.state.memory.tasks = JARVIS.state.memory.tasks.filter(t => t.id !== id);
            JARVIS.saveData();
            this.render();
        }
    },

    // Weather
    Weather: {
        open() {
            JARVIS.get('weather-app')?.classList.remove('hidden');
            JARVIS.Features.currentApp = 'weather';
        },

        async get() {
            const cityInput = JARVIS.get('weather-city');
            const city = cityInput?.value.trim();
            
            if (!city) {
                JARVIS.showError('Please enter a city name');
                return;
            }
            
            // Show loading
            JARVIS.setText('weather-condition', 'Loading...');
            
            try {
                // Using OpenWeatherMap free API (you need to add your key)
                const apiKey = JARVIS.state.settings.weatherApiKey || '';
                
                if (!apiKey) {
                    // Demo mode
                    setTimeout(() => {
                        this.showMockData(city);
                    }, 800);
                    return;
                }
                
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
                );
                
                if (!response.ok) throw new Error('City not found');
                
                const data = await response.json();
                this.display(data);
                
            } catch (e) {
                console.error('Weather error:', e);
                // Fallback to mock data for demo
                this.showMockData(city);
            }
        },

        showMockData(city) {
            const conditions = [
                { icon: '☀️', temp: 24, humidity: 45, wind: 12, desc: 'Sunny' },
                { icon: '⛅', temp: 20, humidity: 60, wind: 15, desc: 'Partly Cloudy' },
                { icon: '☁️', temp: 18, humidity: 70, wind: 10, desc: 'Cloudy' },
                { icon: '🌧️', temp: 16, humidity: 85, wind: 20, desc: 'Rainy' }
            ];
            
            const mock = conditions[Math.floor(Math.random() * conditions.length)];
            
            document.querySelector('.weather-icon').textContent = mock.icon;
            document.querySelector('.weather-temp').textContent = mock.temp + '°';
            JARVIS.setText('weather-humidity', mock.humidity + '%');
            JARVIS.setText('weather-wind', mock.wind + ' km/h');
            JARVIS.setText('weather-condition', mock.desc + ' (Demo)');
        },

        display(data) {
            const iconMap = {
                '01d': '☀️', '01n': '🌙',
                '02d': '⛅', '02n': '☁️',
                '03d': '☁️', '03n': '☁️',
                '04d': '☁️', '04n': '☁️',
                '09d': '🌧️', '09n': '🌧️',
                '10d': '🌦️', '10n': '🌧️',
                '11d': '⛈️', '11n': '⛈️',
                '13d': '❄️', '13n': '❄️',
                '50d': '🌫️', '50n': '🌫️'
            };
            
            const icon = iconMap[data.weather[0].icon] || '☀️';
            
            document.querySelector('.weather-icon').textContent = icon;
            document.querySelector('.weather-temp').textContent = Math.round(data.main.temp) + '°';
            JARVIS.setText('weather-humidity', data.main.humidity + '%');
            JARVIS.setText('weather-wind', Math.round(data.wind.speed) + ' km/h');
            JARVIS.setText('weather-condition', data.weather[0].main);
        }
    },

    // Reminders
    Reminders: {
        open() {
            JARVIS.get('reminders-app')?.classList.remove('hidden');
            JARVIS.Features.currentApp = 'reminders';
            this.render();
            this.checkDue();
        },

        render() {
            const list = JARVIS.get('reminders-list');
            if (!list) return;
            
            const { reminders } = JARVIS.state.memory;
            
            if (reminders.length === 0) {
                list.innerHTML = '<div class="empty-reminders">No reminders set</div>';
                return;
            }
            
            const now = Date.now();
            
            // Sort by time
            const sorted = [...reminders].sort((a, b) => a.time - b.time);
            
            list.innerHTML = sorted.map(r => {
                const isOverdue = r.time < now;
                const isDueSoon = !isOverdue && (r.time - now < 3600000); // 1 hour
                const timeStr = new Date(r.time).toLocaleString();
                
                return `<div class="reminder-item ${isOverdue ? 'overdue' : ''} ${isDueSoon ? 'due-soon' : ''}" data-id="${r.id}">
                    <div class="reminder-content">
                        <div class="reminder-text">${JARVIS.escapeHtml(r.text)}</div>
                        <div class="reminder-time">${timeStr}</div>
                    </div>
                    <button>×</button>
                </div>`;
            }).join('');
            
            // Add handlers
            list.querySelectorAll('.reminder-item button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.closest('.reminder-item').dataset.id);
                    this.delete(id);
                });
            });
        },

        add() {
            const textInput = JARVIS.get('reminder-text');
            const timeInput = JARVIS.get('reminder-time');
            
            const text = textInput?.value.trim();
            const timeVal = timeInput?.value;
            
            if (!text) {
                JARVIS.showError('Please enter reminder text');
                return;
            }
            
            if (!timeVal) {
                JARVIS.showError('Please select a time');
                return;
            }
            
            const time = new Date(timeVal).getTime();
            
            if (time < Date.now()) {
                JARVIS.showError('Cannot set reminder in the past');
                return;
            }
            
            JARVIS.state.memory.reminders.push({ 
                text, 
                time, 
                id: Date.now() 
            });
            
            if (textInput) textInput.value = '';
            if (timeInput) timeInput.value = '';
            
            JARVIS.saveData();
            this.render();
            JARVIS.Voice.speak('Reminder set');
            
            // Schedule notification if supported
            this.scheduleNotification(text, time);
        },

        delete(id) {
            JARVIS.state.memory.reminders = JARVIS.state.memory.reminders.filter(r => r.id !== id);
            JARVIS.saveData();
            this.render();
        },

        checkDue() {
            // Check for due reminders
            const now = Date.now();
            const due = JARVIS.state.memory.reminders.filter(r => 
                !r.notified && r.time <= now
            );
            
            due.forEach(r => {
                r.notified = true;
                JARVIS.Voice.speak(`Reminder: ${r.text}`);
            });
            
            if (due.length > 0) {
                JARVIS.saveData();
                this.render();
            }
        },

        scheduleNotification(text, time) {
            // Simple notification using setTimeout (limited when page is backgrounded)
            const delay = time - Date.now();
            if (delay > 0 && delay < 86400000) { // Max 24 hours
                setTimeout(() => {
                    JARVIS.Voice.speak(`Reminder: ${text}`);
                    this.render();
                }, delay);
            }
        }
    },

    // App Drawer
    toggleApps() {
        JARVIS.get('apps-drawer')?.classList.toggle('hidden');
    },

    closeMiniApp() {
        document.querySelectorAll('.mini-app').forEach(app => {
            app.classList.add('hidden');
        });
        JARVIS.Features.currentApp = null;
    },

    openApp(appName) {
        this.toggleApps();
        
        switch(appName) {
            case 'calculator': this.Calculator.open(); break;
            case 'notebook': this.Notebook.open(); break;
            case 'tasks': this.Tasks.open(); break;
            case 'weather': this.Weather.open(); break;
            case 'reminders': this.Reminders.open(); break;
            case 'game': 
                alert('🎮 Quiz Game\n\nComing in next update!\n\nTest your knowledge with AI-generated questions.'); 
                break;
        }
    }
};
