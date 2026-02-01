// ============================================
// J.A.R.V.I.S. FEATURES MODULE
// Tasks + Calculator + Internet Search + Notifications
// NO ES MODULES - GLOBAL WINDOW OBJECT
// ============================================

(function() {
    'use strict';

    // ============================================
    // TASK MANAGER
    // ============================================
    function TaskManager(memory) {
        this.memory = memory;
        this.tasks = [];
        this.reminders = [];
        this.categories = ['personal', 'work', 'shopping', 'health', 'finance'];
        this.loadTasks();
    }

    TaskManager.prototype.loadTasks = async function() {
        var stored = await this.memory.getFact('tasks');
        if (stored) {
            this.tasks = stored;
        }
        this.renderTasks();
    };

    TaskManager.prototype.saveTasks = async function() {
        await this.memory.setFact('tasks', this.tasks);
    };

    TaskManager.prototype.addTask = function(text, options) {
        options = options || {};
        var task = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            text: text,
            completed: false,
            createdAt: Date.now(),
            dueDate: options.dueDate || null,
            priority: options.priority || 'medium',
            category: options.category || 'personal',
            tags: options.tags || [],
            reminders: options.reminders || []
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();

        if (task.dueDate) {
            this.scheduleReminder(task);
        }

        return task;
    };

    TaskManager.prototype.completeTask = function(id) {
        var task = this.tasks.find(function(t) { return t.id === id; });
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? Date.now() : null;
            this.saveTasks();
            this.renderTasks();
        }
    };

    TaskManager.prototype.deleteTask = function(id) {
        this.tasks = this.tasks.filter(function(t) { return t.id !== id; });
        this.saveTasks();
        this.renderTasks();
    };

    TaskManager.prototype.editTask = function(id, updates) {
        var task = this.tasks.find(function(t) { return t.id === id; });
        if (task) {
            Object.assign(task, updates);
            this.saveTasks();
            this.renderTasks();
        }
    };

    TaskManager.prototype.getTasks = function(filter) {
        filter = filter || 'all';
        var today = new Date().setHours(0,0,0,0);
        var now = Date.now();
        
        switch(filter) {
            case 'active':
                return this.tasks.filter(function(t) { return !t.completed; });
            case 'completed':
                return this.tasks.filter(function(t) { return t.completed; });
            case 'today':
                return this.tasks.filter(function(t) {
                    if (!t.dueDate) return false;
                    return new Date(t.dueDate).setHours(0,0,0,0) === today;
                });
            case 'overdue':
                return this.tasks.filter(function(t) {
                    return !t.completed && t.dueDate && t.dueDate < now;
                });
            default:
                return this.tasks;
        }
    };

    TaskManager.prototype.scheduleReminder = function(task) {
        if (!task.dueDate) return;
        var reminderTime = new Date(task.dueDate).getTime() - (15 * 60 * 1000);
        var self = this;
        
        if (reminderTime > Date.now()) {
            setTimeout(function() {
                self.triggerReminder(task);
            }, reminderTime - Date.now());
        }
    };

    TaskManager.prototype.triggerReminder = function(task) {
        if (window.JarvisFeatures && window.JarvisFeatures.notifications) {
            window.JarvisFeatures.notifications.show({
                title: 'Task Reminder',
                message: task.text,
                type: 'warning',
                duration: 10000
            });
        }

        if (window.jarvis && window.jarvis.speak) {
            window.jarvis.speak('Reminder: ' + task.text);
        }
    };

    TaskManager.prototype.renderTasks = function() {
        var container = document.getElementById('task-list');
        if (!container) return;

        var filterBtn = document.querySelector('.filter-btn.active');
        var filter = filterBtn ? filterBtn.dataset.filter : 'all';
        var tasks = this.getTasks(filter);

        var self = this;
        container.innerHTML = tasks.map(function(task) {
            return '<li class="task-item priority-' + task.priority + ' ' + (task.completed ? 'completed' : '') + '" data-id="' + task.id + '">' +
                '<input type="checkbox" class="task-checkbox" ' + (task.completed ? 'checked' : '') + ' ' +
                'onchange="JarvisFeatures.taskManager.completeTask(\'' + task.id + '\')">' +
                '<span class="task-content">' + self.escapeHtml(task.text) + '</span>' +
                (task.dueDate ? '<span class="task-due">' + new Date(task.dueDate).toLocaleDateString() + '</span>' : '') +
                '<button class="task-delete" onclick="JarvisFeatures.taskManager.deleteTask(\'' + task.id + '\')">×</button>' +
                '</li>';
        }).join('');
    };

    TaskManager.prototype.escapeHtml = function(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    TaskManager.prototype.parseTaskFromText = function(text) {
        var datePatterns = [
            /\b(tomorrow|today|tonight)\b/i,
            /\b(next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
            /\b(in\s+(\d+)\s+(days?|hours?|minutes?))\b/i,
            /\b(at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i
        ];

        var dueDate = null;
        for (var i = 0; i < datePatterns.length; i++) {
            var match = text.match(datePatterns[i]);
            if (match) {
                dueDate = this.parseDate(match[0]);
                break;
            }
        }

        var priority = 'medium';
        if (/\b(urgent|asap|important|critical)\b/i.test(text)) priority = 'urgent';
        else if (/\b(low priority|whenever|someday)\b/i.test(text)) priority = 'low';

        var cleanText = text.replace(/\b(remind me to|add task|todo)\b/gi, '').trim();

        return { text: cleanText, dueDate: dueDate, priority: priority };
    };

    TaskManager.prototype.parseDate = function(text) {
        var now = new Date();
        var lower = text.toLowerCase();
        
        if (lower.includes('tomorrow')) {
            return new Date(now.setDate(now.getDate() + 1)).setHours(9,0,0,0);
        }
        if (lower.includes('today')) {
            return now.setHours(17,0,0,0);
        }
        
        return null;
    };

    // ============================================
    // CALCULATOR
    // ============================================
    function Calculator() {
        this.display = '0';
        this.previousValue = null;
        this.operation = null;
        this.newNumber = true;
        this.history = [];
        this.memory = 0;
    }

    Calculator.prototype.input = function(value) {
        if (this.isNumber(value)) {
            this.handleNumber(value);
        } else if (this.isOperator(value)) {
            this.handleOperator(value);
        } else if (value === 'C') {
            this.clear();
        } else if (value === '⌫') {
            this.backspace();
        } else if (value === '=') {
            this.calculate();
        } else if (value === '%') {
            this.percentage();
        } else if (value === '.') {
            this.decimal();
        }
        this.updateDisplay();
    };

    Calculator.prototype.isNumber = function(val) {
        return !isNaN(val) && val !== '.';
    };

    Calculator.prototype.isOperator = function(val) {
        return ['+', '-', '*', '/'].indexOf(val) !== -1;
    };

    Calculator.prototype.handleNumber = function(num) {
        if (this.newNumber) {
            this.display = num;
            this.newNumber = false;
        } else {
            this.display = this.display === '0' ? num : this.display + num;
        }
    };

    Calculator.prototype.handleOperator = function(op) {
        if (this.operation && !this.newNumber) {
            this.calculate();
        }
        
        this.previousValue = parseFloat(this.display);
        this.operation = op;
        this.newNumber = true;
    };

    Calculator.prototype.calculate = function() {
        if (this.operation === null || this.previousValue === null) return;

        var current = parseFloat(this.display);
        var result;

        switch(this.operation) {
            case '+': result = this.previousValue + current; break;
            case '-': result = this.previousValue - current; break;
            case '*': result = this.previousValue * current; break;
            case '/': result = current === 0 ? 'Error' : this.previousValue / current; break;
            default: return;
        }

        this.history.push({
            expression: this.previousValue + ' ' + this.operation + ' ' + current,
            result: result
        });

        this.display = String(this.formatResult(result));
        this.previousValue = null;
        this.operation = null;
        this.newNumber = true;
    };

    Calculator.prototype.formatResult = function(num) {
        if (typeof num !== 'number') return num;
        if (Number.isInteger(num)) return num;
        return parseFloat(num.toFixed(8));
    };

    Calculator.prototype.clear = function() {
        this.display = '0';
        this.previousValue = null;
        this.operation = null;
        this.newNumber = true;
    };

    Calculator.prototype.backspace = function() {
        if (this.display.length > 1) {
            this.display = this.display.slice(0, -1);
        } else {
            this.display = '0';
        }
    };

    Calculator.prototype.percentage = function() {
        var current = parseFloat(this.display);
        this.display = String(current / 100);
    };

    Calculator.prototype.decimal = function() {
        if (this.display.indexOf('.') === -1) {
            this.display += '.';
        }
    };

    Calculator.prototype.updateDisplay = function() {
        var displayEl = document.getElementById('calc-display');
        if (displayEl) {
            displayEl.textContent = this.display;
        }
    };

    Calculator.prototype.evaluateExpression = function(expression) {
        try {
            var sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
            var result = Function('"use strict";return (' + sanitized + ')')();
            return this.formatResult(result);
        } catch (e) {
            return 'Error';
        }
    };

    // ============================================
    // INTERNET SEARCH
    // ============================================
    function InternetSearch() {
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000;
        this.rateLimiter = new Map();
    }

    InternetSearch.prototype.search = async function(query, options) {
        options = options || {};
        var cached = this.getFromCache(query);
        if (cached) return cached;

        if (this.isRateLimited('search')) {
            return { error: 'Rate limit exceeded. Please try again later.' };
        }

        try {
            var results = await Promise.all([
                this.searchDuckDuckGo(query),
                this.searchWikipedia(query),
                options.news ? this.searchNews(query) : null
            ]);

            var combined = this.combineResults(results.filter(function(r) { return r; }));
            this.addToCache(query, combined);
            
            return combined;

        } catch (error) {
            console.error('Search error:', error);
            return { error: 'Search failed. Please check your connection.' };
        }
    };

    InternetSearch.prototype.searchDuckDuckGo = async function(query) {
        try {
            var response = await fetch(
                'https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1&skip_disambig=1',
                { headers: { 'Accept': 'application/json' } }
            );
            
            var data = await response.json();
            
            return {
                source: 'DuckDuckGo',
                abstract: data.AbstractText,
                url: data.AbstractURL,
                related: (data.RelatedTopics || []).slice(0, 5).map(function(t) {
                    var parts = (t.Text || '').split(' - ');
                    return { title: parts[0], description: parts[1] };
                }),
                image: data.Image
            };
        } catch (e) {
            return null;
        }
    };

    InternetSearch.prototype.searchWikipedia = async function(query) {
        try {
            var response = await fetch(
                'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(query)
            );
            
            var data = await response.json();
            
            return {
                source: 'Wikipedia',
                title: data.title,
                extract: data.extract,
                url: data.content_urls && data.content_urls.desktop ? data.content_urls.desktop.page : null,
                image: data.thumbnail ? data.thumbnail.source : null
            };
        } catch (e) {
            return null;
        }
    };

    InternetSearch.prototype.searchNews = async function(query) {
        return null;
    };

    InternetSearch.prototype.getWeather = async function(location) {
        try {
            var geoResponse = await fetch(
                'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(location) + '&count=1'
            );
            var geoData = await geoResponse.json();
            
            if (!geoData.results || !geoData.results[0]) {
                return { error: 'Location not found' };
            }

            var result = geoData.results[0];

            var weatherResponse = await fetch(
                'https://api.open-meteo.com/v1/forecast?latitude=' + result.latitude + 
                '&longitude=' + result.longitude + '&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto'
            );
            
            var weatherData = await weatherResponse.json();
            
            return {
                location: result.name,
                current: weatherData.current_weather,
                daily: weatherData.daily,
                unit: 'celsius'
            };

        } catch (error) {
            return { error: 'Weather service unavailable' };
        }
    };

    InternetSearch.prototype.combineResults = function(results) {
        var combined = {
            sources: [],
            answer: '',
            related: [],
            images: []
        };

        results.forEach(function(result) {
            if (result.abstract || result.extract) {
                combined.answer = result.abstract || result.extract;
            }
            combined.sources.push({ name: result.source, url: result.url });
            if (result.related) {
                combined.related.push.apply(combined.related, result.related);
            }
            if (result.image) {
                combined.images.push(result.image);
            }
        });

        return combined;
    };

    InternetSearch.prototype.getFromCache = function(query) {
        var cached = this.cache.get(query);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        this.cache.delete(query);
        return null;
    };

    InternetSearch.prototype.addToCache = function(query, data) {
        this.cache.set(query, { data: data, timestamp: Date.now() });
    };

    InternetSearch.prototype.isRateLimited = function(action) {
        var lastCall = this.rateLimiter.get(action);
        var now = Date.now();
        
        if (lastCall && now - lastCall < 1000) {
            return true;
        }
        
        this.rateLimiter.set(action, now);
        return false;
    };

    // ============================================
    // NOTIFICATION MANAGER
    // ============================================
    function NotificationManager() {
        this.container = document.getElementById('notification-center');
        this.permission = 'default';
        this.soundEnabled = true;
        this.init();
    }

    NotificationManager.prototype.init = function() {
        var self = this;
        if ('Notification' in window) {
            Notification.requestPermission().then(function(permission) {
                self.permission = permission;
            });
        }
    };

    NotificationManager.prototype.show = function(options) {
        var title = options.title;
        var message = options.message;
        var type = options.type || 'info';
        var duration = options.duration || 5000;
        var actions = options.actions || [];
        var icon = options.icon || null;

        var notif = document.createElement('div');
        notif.className = 'notification ' + type;
        
        var icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

        var actionsHtml = actions.length > 0 ? 
            '<div class="notification-actions">' + 
            actions.map(function(a) { return '<button onclick="' + a.handler + '">' + a.label + '</button>'; }).join('') + 
            '</div>' : '';

        notif.innerHTML = 
            '<div class="notification-icon">' + (icon || icons[type]) + '</div>' +
            '<div class="notification-content">' +
                '<div class="notification-title">' + title + '</div>' +
                '<div class="notification-message">' + message + '</div>' +
                actionsHtml +
            '</div>' +
            '<button class="notification-close">&times;</button>';

        this.container.appendChild(notif);

        var self = this;
        var timeout = setTimeout(function() {
            self.remove(notif);
        }, duration);

        notif.querySelector('.notification-close').addEventListener('click', function() {
            clearTimeout(timeout);
            self.remove(notif);
        });

        if (this.soundEnabled) {
            this.playSound(type);
        }

        if (this.permission === 'granted' && document.hidden) {
            this.showSystemNotification(title, message);
        }

        return notif;
    };

    NotificationManager.prototype.remove = function(notif) {
        notif.style.animation = 'notification-out 0.3s ease forwards';
        setTimeout(function() { notif.remove(); }, 300);
    };

    NotificationManager.prototype.playSound = function(type) {
        try {
            var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            var oscillator = audioCtx.createOscillator();
            var gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            var frequencies = { info: 800, success: 1200, warning: 600, error: 400 };
            oscillator.frequency.value = frequencies[type] || 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch(e) {}
    };

    NotificationManager.prototype.showSystemNotification = function(title, body) {
        new Notification(title, { body: body, icon: '/jarvis-icon.png' });
    };

    NotificationManager.prototype.notifyLowBattery = function() {
        this.show({
            title: 'Power Warning',
            message: 'System battery is running low. Please connect to power.',
            type: 'warning',
            duration: 10000
        });
    };

    // ============================================
    // EXPOSE GLOBAL API
    // ============================================
    window.JarvisFeatures = {
        TaskManager: TaskManager,
        Calculator: Calculator,
        InternetSearch: InternetSearch,
        NotificationManager: NotificationManager,
        
        // Instances (created in app.js)
        taskManager: null,
        calculator: null,
        internet: null,
        notifications: null,
        
        init: function(memory) {
            this.taskManager = new TaskManager(memory);
            this.calculator = new Calculator();
            this.internet = new InternetSearch();
            this.notifications = new NotificationManager();
            
            // Setup calculator buttons
            document.querySelectorAll('.calc-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var val = this.dataset.val;
                    window.JarvisFeatures.calculator.input(val);
                });
            });
            
            // Setup task buttons
            var addTaskBtn = document.getElementById('add-task');
            var newTaskInput = document.getElementById('new-task');
            
            if (addTaskBtn) {
                addTaskBtn.addEventListener('click', function() {
                    var text = newTaskInput.value.trim();
                    if (text) {
                        var parsed = window.JarvisFeatures.taskManager.parseTaskFromText(text);
                        window.JarvisFeatures.taskManager.addTask(parsed.text, {
                            priority: document.getElementById('task-priority').value,
                            dueDate: parsed.dueDate
                        });
                        newTaskInput.value = '';
                    }
                });
            }
            
            // Setup filter buttons
            document.querySelectorAll('.filter-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
                    this.classList.add('active');
                    window.JarvisFeatures.taskManager.renderTasks();
                });
            });
        }
    };

    console.log('✅ JarvisFeatures loaded');
})();
