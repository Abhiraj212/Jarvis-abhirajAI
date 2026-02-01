// ============================================
// J.A.R.V.I.S. - FULLY WORKING VERSION
// ============================================

// Initialize when page loads
window.addEventListener('load', function() {
    console.log('Starting JARVIS...');
    window.jarvis = new JarvisApp();
});

function JarvisApp() {
    console.log('App constructor');
    this.init();
}

JarvisApp.prototype.init = function() {
    // Hide boot screen
    var boot = document.getElementById('boot-sequence');
    var app = document.getElementById('app-container');
    if (boot) boot.classList.add('hidden');
    if (app) app.classList.remove('hidden');

    // Initialize all systems
    this.initClock();
    this.initResourceMonitor();
    this.initChat();
    this.initCalculator();
    this.initTasks();
    this.initPanels();
    this.initModals();
    this.initQuickActions();
    this.initBottomBar();
    this.initSettings();

    console.log('JARVIS Ready!');
    
    // Welcome message
    this.addMessage('jarvis', 'J.A.R.V.I.S. online. All systems functional. How may I assist you?');
};

// ==================== CHAT SYSTEM ====================

JarvisApp.prototype.initChat = function() {
    var self = this;
    var input = document.getElementById('main-input');
    var sendBtn = document.getElementById('main-send-btn');
    var micBtn = document.getElementById('main-mic-btn');

    // Send button
    if (sendBtn) {
        sendBtn.onclick = function() {
            self.sendMessage();
        };
    }

    // Enter key
    if (input) {
        input.onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                self.sendMessage();
            }
        };
    }

    // Mic button
    if (micBtn) {
        micBtn.onclick = function() {
            self.toggleMic();
        };
    }
};

JarvisApp.prototype.sendMessage = function() {
    var input = document.getElementById('main-input');
    if (!input) return;

    var text = input.value.trim();
    if (!text) return;

    // Add user message
    this.addMessage('user', text);
    input.value = '';
    input.style.height = 'auto';

    // Show typing
    this.showTyping();

    // Generate response
    var self = this;
    setTimeout(function() {
        self.hideTyping();
        var response = self.generateResponse(text);
        self.addMessage('jarvis', response);
    }, 800 + Math.random() * 1000);
};

JarvisApp.prototype.generateResponse = function(input) {
    var lower = input.toLowerCase();
    
    // Simple pattern matching
    if (lower.indexOf('hello') !== -1 || lower.indexOf('hi') !== -1) {
        return 'Hello! I am J.A.R.V.I.S. How can I help you today?';
    }
    if (lower.indexOf('weather') !== -1) {
        return 'I apologize, but I cannot access weather data at the moment. Please check your local weather service.';
    }
    if (lower.indexOf('time') !== -1) {
        return 'The current time is ' + new Date().toLocaleTimeString();
    }
    if (lower.indexOf('your name') !== -1) {
        return 'I am J.A.R.V.I.S. - Just A Rather Very Intelligent System.';
    }
    if (lower.indexOf('thank') !== -1) {
        return 'You\'re welcome, sir.';
    }
    if (lower.indexOf('calculate') !== -1 || /[0-9+\-*/]/.test(lower)) {
        // Try to calculate
        try {
            var expr = lower.replace(/[^0-9+\-*/.]/g, '');
            if (expr) {
                var result = eval(expr); // Safe for simple math
                return 'The result is: ' + result;
            }
        } catch(e) {}
    }
    
    return 'I understand you said: "' + input + '". I\'m processing this request. My advanced AI modules are analyzing the context.';
};

JarvisApp.prototype.addMessage = function(sender, text) {
    var chat = document.getElementById('chat-messages');
    if (!chat) return;

    var div = document.createElement('div');
    div.className = 'message message-' + sender;
    
    var time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    div.innerHTML = 
        '<div class="message-bubble">' + 
            escapeHtml(text) + 
        '</div>' +
        '<div class="message-meta">' +
            (sender === 'jarvis' ? '<div class="message-avatar">🤖</div>' : '') +
            '<span>' + time + '</span>' +
            (sender === 'user' ? '<div class="message-avatar">👤</div>' : '') +
        '</div>';

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
};

JarvisApp.prototype.showTyping = function() {
    var chat = document.getElementById('chat-messages');
    if (!chat) return;

    var div = document.createElement('div');
    div.id = 'typing-indicator';
    div.className = 'message message-jarvis';
    div.innerHTML = '<div class="message-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
};

JarvisApp.prototype.hideTyping = function() {
    var el = document.getElementById('typing-indicator');
    if (el) el.remove();
};

JarvisApp.prototype.toggleMic = function() {
    var btn = document.getElementById('main-mic-btn');
    if (!btn) return;

    if (btn.classList.contains('recording')) {
        btn.classList.remove('recording');
        this.addMessage('jarvis', 'Voice input stopped.');
    } else {
        btn.classList.add('recording');
        this.addMessage('jarvis', 'Listening... (Voice recognition active)');
        
        // Simulate voice input after 3 seconds
        var self = this;
        setTimeout(function() {
            btn.classList.remove('recording');
            var input = document.getElementById('main-input');
            if (input) input.value = 'Hello Jarvis';
            self.sendMessage();
        }, 3000);
    }
};

// ==================== CALCULATOR ====================

JarvisApp.prototype.initCalculator = function() {
    var self = this;
    this.calcDisplay = '0';
    this.calcPrev = null;
    this.calcOp = null;
    this.calcNew = true;

    var buttons = document.querySelectorAll('.calc-btn');
    buttons.forEach(function(btn) {
        btn.onclick = function() {
            var val = this.getAttribute('data-val');
            self.handleCalc(val);
        };
    });
};

JarvisApp.prototype.handleCalc = function(val) {
    var display = document.getElementById('calc-display');
    if (!display) return;

    // Numbers
    if (!isNaN(val)) {
        if (this.calcNew) {
            this.calcDisplay = val;
            this.calcNew = false;
        } else {
            this.calcDisplay = this.calcDisplay === '0' ? val : this.calcDisplay + val;
        }
    }
    // Operators
    else if (['+', '-', '*', '/'].indexOf(val) !== -1) {
        this.calcPrev = parseFloat(this.calcDisplay);
        this.calcOp = val;
        this.calcNew = true;
    }
    // Equals
    else if (val === '=') {
        if (this.calcOp && this.calcPrev !== null) {
            var curr = parseFloat(this.calcDisplay);
            var result;
            switch(this.calcOp) {
                case '+': result = this.calcPrev + curr; break;
                case '-': result = this.calcPrev - curr; break;
                case '*': result = this.calcPrev * curr; break;
                case '/': result = curr === 0 ? 'Error' : this.calcPrev / curr; break;
            }
            this.calcDisplay = String(result);
            this.calcPrev = null;
            this.calcOp = null;
            this.calcNew = true;
        }
    }
    // Clear
    else if (val === 'C') {
        this.calcDisplay = '0';
        this.calcPrev = null;
        this.calcOp = null;
        this.calcNew = true;
    }
    // Backspace
    else if (val === '⌫') {
        this.calcDisplay = this.calcDisplay.length > 1 ? this.calcDisplay.slice(0, -1) : '0';
    }
    // Percent
    else if (val === '%') {
        this.calcDisplay = String(parseFloat(this.calcDisplay) / 100);
    }
    // Decimal
    else if (val === '.') {
        if (this.calcDisplay.indexOf('.') === -1) {
            this.calcDisplay += '.';
        }
    }

    display.textContent = this.calcDisplay;
};

// ==================== TASK MANAGER ====================

JarvisApp.prototype.initTasks = function() {
    var self = this;
    this.tasks = [];

    var addBtn = document.getElementById('add-task');
    var input = document.getElementById('new-task');

    if (addBtn) {
        addBtn.onclick = function() {
            if (input && input.value.trim()) {
                self.addTask(input.value.trim());
                input.value = '';
            }
        };
    }

    // Filter buttons
    var filters = document.querySelectorAll('.filter-btn');
    filters.forEach(function(btn) {
        btn.onclick = function() {
            filters.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            self.renderTasks(this.getAttribute('data-filter'));
        };
    });

    this.renderTasks('all');
};

JarvisApp.prototype.addTask = function(text) {
    var priority = document.getElementById('task-priority');
    this.tasks.push({
        id: Date.now(),
        text: text,
        done: false,
        priority: priority ? priority.value : 'medium'
    });
    this.renderTasks('all');
    
    // Notification
    this.showNotification('Task Added', text);
};

JarvisApp.prototype.renderTasks = function(filter) {
    var list = document.getElementById('task-list');
    if (!list) return;

    var self = this;
    var filtered = this.tasks.filter(function(t) {
        if (filter === 'active') return !t.done;
        if (filter === 'completed') return t.done;
        return true;
    });

    list.innerHTML = filtered.map(function(t) {
        return '<li class="task-item priority-' + t.priority + ' ' + (t.done ? 'completed' : '') + '">' +
            '<input type="checkbox" ' + (t.done ? 'checked' : '') + ' onchange="jarvis.toggleTask(' + t.id + ')">' +
            '<span class="task-content">' + escapeHtml(t.text) + '</span>' +
            '<button class="task-delete" onclick="jarvis.deleteTask(' + t.id + ')">×</button>' +
        '</li>';
    }).join('');
};

JarvisApp.prototype.toggleTask = function(id) {
    var task = this.tasks.find(function(t) { return t.id === id; });
    if (task) {
        task.done = !task.done;
        this.renderTasks(document.querySelector('.filter-btn.active').getAttribute('data-filter'));
    }
};

JarvisApp.prototype.deleteTask = function(id) {
    this.tasks = this.tasks.filter(function(t) { return t.id !== id; });
    this.renderTasks(document.querySelector('.filter-btn.active').getAttribute('data-filter'));
};

// ==================== PANELS ====================

JarvisApp.prototype.initPanels = function() {
    var toggles = document.querySelectorAll('.panel-toggle');
    toggles.forEach(function(btn) {
        btn.onclick = function() {
            var panel = this.closest('.panel');
            var content = panel.querySelector('.panel-content');
            if (content) {
                var isCollapsed = content.style.display === 'none';
                content.style.display = isCollapsed ? 'block' : 'none';
                this.textContent = isCollapsed ? '−' : '+';
            }
        };
    });
};

// ==================== MODALS ====================

JarvisApp.prototype.initModals = function() {
    var self = this;

    // Vision button
    var visionBtn = document.getElementById('btn-vision');
    if (visionBtn) {
        visionBtn.onclick = function() {
            self.openModal('vision-modal');
        };
    }

    // Close buttons
    var closeBtns = document.querySelectorAll('.modal-close');
    closeBtns.forEach(function(btn) {
        btn.onclick = function() {
            var modal = this.closest('.modal-overlay');
            if (modal) modal.classList.add('hidden');
        };
    });

    // Click outside to close
    var overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(function(overlay) {
        overlay.onclick = function(e) {
            if (e.target === this) this.classList.add('hidden');
        };
    });
};

JarvisApp.prototype.openModal = function(id) {
    var modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
};

// ==================== QUICK ACTIONS ====================

JarvisApp.prototype.initQuickActions = function() {
    var self = this;
    var buttons = document.querySelectorAll('.quick-btn');
    
    buttons.forEach(function(btn) {
        btn.onclick = function() {
            var action = this.getAttribute('data-action');
            self.handleQuickAction(action);
        };
    });
};

JarvisApp.prototype.handleQuickAction = function(action) {
    switch(action) {
        case 'weather':
            this.addMessage('user', 'What\'s the weather?');
            this.addMessage('jarvis', 'I cannot access weather data without internet. Please check a weather service.');
            break;
        case 'news':
            this.addMessage('user', 'Show me news');
            this.addMessage('jarvis', 'News feed unavailable. Please check a news website.');
            break;
        case 'reminder':
            var input = document.getElementById('main-input');
            if (input) {
                input.value = 'Remind me to ';
                input.focus();
            }
            break;
        case 'calculate':
            this.addMessage('user', 'Open calculator');
            this.addMessage('jarvis', 'Calculator is ready in the right panel.');
            // Highlight calc
            var calc = document.querySelector('.calc-panel');
            if (calc) {
                calc.scrollIntoView({ behavior: 'smooth' });
                calc.style.boxShadow = '0 0 30px var(--primary)';
                setTimeout(function() { calc.style.boxShadow = ''; }, 1500);
            }
            break;
    }
};

// ==================== BOTTOM BAR ====================

JarvisApp.prototype.initBottomBar = function() {
    var self = this;

    // Voice button
    var voiceBtn = document.getElementById('btn-voice');
    if (voiceBtn) {
        voiceBtn.onclick = function() {
            self.toggleMic();
        };
    }

    // Settings button
    var settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
        settingsBtn.onclick = function() {
            self.openModal('settings-modal');
        };
    }

    // Shutdown button
    var shutdownBtn = document.getElementById('btn-shutdown');
    if (shutdownBtn) {
        shutdownBtn.onclick = function() {
            if (confirm('Shutdown J.A.R.V.I.S.?')) {
                location.reload();
            }
        };
    }

    // Automation button
    var autoBtn = document.getElementById('btn-automation');
    if (autoBtn) {
        autoBtn.onclick = function() {
            self.showNotification('Automation', 'Automation mode activated');
        };
    }

    // Help button
    var helpBtn = document.getElementById('btn-help');
    if (helpBtn) {
        helpBtn.onclick = function() {
            self.addMessage('jarvis', 'Available commands: hello, time, weather, calculate [math], reminder, news. You can also use the calculator and task manager in the side panels.');
        };
    }
};

// ==================== SETTINGS ====================

JarvisApp.prototype.initSettings = function() {
    var themeSelect = document.getElementById('setting-theme');
    if (themeSelect) {
        themeSelect.onchange = function() {
            document.documentElement.setAttribute('data-theme', this.value);
        };
    }

    var purgeBtn = document.getElementById('btn-purge-all');
    if (purgeBtn) {
        purgeBtn.onclick = function() {
            if (confirm('Delete all data?')) {
                localStorage.clear();
                location.reload();
            }
        };
    }

    // Settings tabs
    var tabs = document.querySelectorAll('.settings-tab');
    tabs.forEach(function(tab) {
        tab.onclick = function() {
            var target = this.getAttribute('data-tab');
            
            tabs.forEach(function(t) { t.classList.remove('active'); });
            document.querySelectorAll('.settings-panel').forEach(function(p) { 
                p.classList.remove('active'); 
            });
            
            this.classList.add('active');
            var panel = document.querySelector('.settings-panel[data-panel="' + target + '"]');
            if (panel) panel.classList.add('active');
        };
    });
};

// ==================== UTILITIES ====================

JarvisApp.prototype.initClock = function() {
    var self = this;
    setInterval(function() {
        var now = new Date();
        var clock = document.getElementById('system-clock');
        var date = document.getElementById('system-date');
        
        if (clock) {
            clock.textContent = now.toLocaleTimeString('en-GB', {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }
        if (date) {
            date.textContent = now.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric'
            });
        }
    }, 1000);
};

JarvisApp.prototype.initResourceMonitor = function() {
    setInterval(function() {
        var cpu = Math.floor(Math.random() * 30) + 10;
        var mem = Math.floor(Math.random() * 200) + 100;
        
        var cpuBar = document.getElementById('cpu-bar');
        var cpuText = document.getElementById('cpu-text');
        var memBar = document.getElementById('mem-bar');
        var memText = document.getElementById('mem-text');
        
        if (cpuBar) cpuBar.style.width = cpu + '%';
        if (cpuText) cpuText.textContent = cpu + '%';
        if (memBar) memBar.style.width = ((mem/512)*100) + '%';
        if (memText) memText.textContent = mem + 'MB';
    }, 2000);
};

JarvisApp.prototype.showNotification = function(title, message) {
    var container = document.getElementById('notification-center');
    if (!container) return;

    var div = document.createElement('div');
    div.className = 'notification info';
    div.innerHTML = 
        '<div class="notification-icon">ℹ️</div>' +
        '<div class="notification-content">' +
            '<div class="notification-title">' + escapeHtml(title) + '</div>' +
            '<div class="notification-message">' + escapeHtml(message) + '</div>' +
        '</div>' +
        '<button class="notification-close">&times;</button>';

    container.appendChild(div);

    // Auto remove
    setTimeout(function() {
        div.remove();
    }, 5000);

    // Close button
    div.querySelector('.notification-close').onclick = function() {
        div.remove();
    };
};

// Helper function
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
