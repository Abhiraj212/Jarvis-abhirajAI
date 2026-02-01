// ============================================
// J.A.R.V.I.S. MAIN APPLICATION CONTROLLER
// Glues all modules together - NO ES IMPORTS
// ============================================

(function() {
    'use strict';

    // Wait for all scripts to load
    window.addEventListener('DOMContentLoaded', function() {
        // Verify all modules loaded
        if (!window.JarvisCore || !window.JarvisFeatures || !window.JarvisVoiceVision) {
            console.error('Required modules not loaded!');
            alert('Failed to load J.A.R.V.I.S. modules. Check console.');
            return;
        }

        // Initialize J.A.R.V.I.S. Application
        window.jarvis = new JarvisApp();
    });

    // ============================================
    // MAIN APPLICATION CLASS
    // ============================================
    function JarvisApp() {
        this.version = '2.0.0';
        this.initialized = false;
        this.currentTheme = 'jarvis';
        this.userPreferences = {};
        
        // Core Systems (from JarvisCore)
        this.brain = null;
        this.memory = null;
        this.intent = null;
        this.response = null;
        this.learning = null;
        this.emotion = null;
        
        // Feature Systems (from JarvisFeatures)
        this.modules = null;
        
        // Voice/Vision (from JarvisVoiceVision)
        this.voice = null;
        this.wakeWord = null;
        this.vision = null;
        
        // UI References
        this.ui = {
            bootScreen: document.getElementById('boot-sequence'),
            appContainer: document.getElementById('app-container'),
            chatMessages: document.getElementById('chat-messages'),
            mainInput: document.getElementById('main-input'),
            micBtn: document.getElementById('main-mic-btn'),
            sendBtn: document.getElementById('main-send-btn')
        };
        
        // Conversation Context
        this.conversationContext = {
            history: [],
            currentTopic: null,
            userMood: 'neutral',
            lastInteraction: null,
            sessionStart: Date.now()
        };

        this.init();
    }

    JarvisApp.prototype.init = async function() {
        console.log('🚀 J.A.R.V.I.S. v' + this.version + ' Initializing...');
        
        await this.performBootSequence();
        await this.initializeCoreSystems();
        await this.initializeFeatures();
        await this.initializeVoiceVision();
        this.setupEventListeners();
        this.startSystemLoops();
        this.completeInitialization();
    };

    JarvisApp.prototype.performBootSequence = async function() {
        var steps = [
            { msg: 'Loading kernel modules...', progress: 10, delay: 200 },
            { msg: 'Initializing memory banks...', progress: 25, delay: 300 },
            { msg: 'Mounting emotional core...', progress: 40, delay: 250 },
            { msg: 'Calibrating voice synthesis...', progress: 55, delay: 400 },
            { msg: 'Establishing secure connection...', progress: 70, delay: 300 },
            { msg: 'Loading user preferences...', progress: 85, delay: 200 },
            { msg: 'System ready. Awaiting command.', progress: 100, delay: 500 }
        ];

        var bootLog = document.getElementById('boot-log');
        var bootBar = document.getElementById('boot-bar');
        var bootStatus = document.getElementById('boot-status');

        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            bootStatus.textContent = step.msg;
            bootBar.style.width = step.progress + '%';
            
            var logEntry = document.createElement('div');
            logEntry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + step.msg;
            bootLog.appendChild(logEntry);
            bootLog.scrollTop = bootLog.scrollHeight;
            
            await this.sleep(step.delay);
        }

        await this.sleep(500);
    };

    JarvisApp.prototype.initializeCoreSystems = async function() {
        // Initialize Memory
        this.memory = new JarvisCore.MemoryManager({
            maxFacts: 10000,
            maxHistory: 1000,
            compressionEnabled: true
        });
        await this.memory.initialize();

        // Initialize Emotional Core
        this.emotion = new JarvisCore.EmotionalCore({
            baseline: 'neutral',
            volatility: 0.3,
            empathyLevel: 0.8
        });

        // Initialize Intent Processor
        this.intent = new JarvisCore.IntentProcessor({
            fuzzyMatching: true,
            confidenceThreshold: 0.7,
            useContext: true
        });

        // Initialize Learning Engine
        this.learning = new JarvisCore.LearningEngine({
            autoLearn: true,
            confirmationRequired: false,
            maxConfidence: 1.0
        });

        // Initialize Response Generator
        this.response = new JarvisCore.ResponseGenerator({
            personality: 'professional',
            useEmojis: true,
            maxLength: 500,
            creativity: 0.7
        });

        // Initialize Brain
        this.brain = new JarvisCore.JarvisBrain({
            memory: this.memory,
            emotion: this.emotion,
            intent: this.intent,
            response: this.response,
            learning: this.learning
        });

        var self = this;
        this.brain.on('status', function(status) {
            self.updateStatus(status);
        });
        
        this.brain.on('typing', function(isTyping) {
            if (isTyping) self.showTypingIndicator();
            else self.hideTypingIndicator();
        });
        
        this.brain.on('speak', function(text) {
            self.addMessage('jarvis', text);
            if (self.userPreferences.voiceEnabled) {
                self.speak(text);
            }
        });
    };

    JarvisApp.prototype.initializeFeatures = async function() {
        JarvisFeatures.init(this.memory);
        this.modules = JarvisFeatures;
    };

    JarvisApp.prototype.initializeVoiceVision = async function() {
        JarvisVoiceVision.init({
            voice: {
                language: 'en-US',
                pitch: 0.9,
                rate: 1.1,
                volume: 1.0
            },
            wake: {
                keywords: ['hey jarvis', 'jarvis', 'okay jarvis'],
                sensitivity: 0.8
            },
            vision: {
                detectionInterval: 100,
                recognitionThreshold: 0.6
            }
        });

        this.voice = JarvisVoiceVision.voice;
        this.wakeWord = JarvisVoiceVision.wakeWord;
        this.vision = JarvisVoiceVision.vision;
    };

    JarvisApp.prototype.setupEventListeners = function() {
        var self = this;

        // Boot transition
        setTimeout(function() {
            self.ui.bootScreen.style.opacity = '0';
            setTimeout(function() {
                self.ui.bootScreen.classList.add('hidden');
                self.ui.appContainer.classList.remove('hidden');
                self.speak("All systems operational. Welcome back, sir.");
            }, 500);
        }, 500);

        // Input handling
        this.ui.mainInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                self.handleUserInput();
            }
            self.autoResizeTextarea();
        });

        this.ui.sendBtn.addEventListener('click', function() {
            self.handleUserInput();
        });

        // Mic button
        this.ui.micBtn.addEventListener('click', function() {
            self.toggleVoiceInput();
        });

        // Panel toggles
        document.querySelectorAll('.panel-toggle').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var panel = e.target.closest('.panel').querySelector('.panel-content');
                panel.classList.toggle('collapsed');
                e.target.textContent = panel.classList.contains('collapsed') ? '+' : '−';
            });
        });

        // Settings modal
        document.getElementById('btn-settings').addEventListener('click', function() {
            document.getElementById('settings-modal').classList.remove('hidden');
        });

        document.querySelectorAll('.modal-close').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.target.closest('.modal-overlay').classList.add('hidden');
            });
        });

        // Settings tabs
        document.querySelectorAll('.settings-tab').forEach(function(tab) {
            tab.addEventListener('click', function(e) {
                var targetPanel = e.target.dataset.tab;
                
                document.querySelectorAll('.settings-tab').forEach(function(t) { t.classList.remove('active'); });
                document.querySelectorAll('.settings-panel').forEach(function(p) { p.classList.remove('active'); });
                
                e.target.classList.add('active');
                document.querySelector('.settings-panel[data-panel="' + targetPanel + '"]').classList.add('active');
            });
        });

        // Theme switching
        document.getElementById('setting-theme').addEventListener('change', function(e) {
            self.setTheme(e.target.value);
        });

        // Quick actions
        document.querySelectorAll('.quick-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                self.executeQuickAction(e.target.dataset.action);
            });
        });

        // Vision modal
        document.getElementById('btn-vision').addEventListener('click', function() {
            document.getElementById('vision-modal').classList.remove('hidden');
            self.vision.start();
        });

        // Purge data
        document.getElementById('btn-purge-all').addEventListener('click', function() {
            if (confirm('Purge all data? This cannot be undone.')) {
                self.memory.clear();
                location.reload();
            }
        });

        // Context menu
        document.addEventListener('contextmenu', function(e) {
            if (e.target.closest('.message-bubble')) {
                e.preventDefault();
                self.showContextMenu(e, e.target.closest('.message'));
            }
        });

        document.addEventListener('click', function() {
            document.getElementById('context-menu').classList.add('hidden');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'k') {
                    e.preventDefault();
                    self.ui.mainInput.focus();
                } else if (e.key === 'm') {
                    e.preventDefault();
                    self.toggleVoiceInput();
                } else if (e.key === ',') {
                    e.preventDefault();
                    document.getElementById('settings-modal').classList.remove('hidden');
                }
            }
        });
    };

    JarvisApp.prototype.startSystemLoops = function() {
        var self = this;
        
        setInterval(function() { self.updateClock(); }, 1000);
        setInterval(function() { self.updateResourceMonitor(); }, 2000);
        setInterval(function() { self.emotion.decay(); }, 5000);
        setInterval(function() { self.memory.save(); }, 30000);
        setInterval(function() { self.checkConnection(); }, 10000);
    };

    JarvisApp.prototype.completeInitialization = function() {
        this.initialized = true;
        this.loadUserPreferences();
        this.updateMemoryDisplay();
        
        this.modules.notifications.show({
            title: 'System Online',
            message: 'J.A.R.V.I.S. is ready to assist you.',
            type: 'success',
            duration: 3000
        });
    };

    JarvisApp.prototype.handleUserInput = function(text) {
        var input = text || this.ui.mainInput.value.trim();
        if (!input) return;

        if (!text) this.ui.mainInput.value = '';
        this.autoResizeTextarea();

        this.addMessage('user', input);
        this.conversationContext.history.push({ 
            role: 'user', 
            content: input, 
            timestamp: Date.now() 
        });
        
        this.showTypingIndicator();

        var self = this;
        
        this.brain.process(input, {
            context: this.conversationContext,
            emotion: this.emotion.getState(),
            memory: this.memory
        }).then(function(response) {
            self.hideTypingIndicator();
            self.addMessage('jarvis', response.text, response.metadata);
            
            self.conversationContext.history.push({ 
                role: 'assistant', 
                content: response.text, 
                timestamp: Date.now() 
            });
            self.conversationContext.lastInteraction = Date.now();
            
            self.updateEmotionDisplay();
            self.updateMemoryDisplay();
        }).catch(function(error) {
            self.hideTypingIndicator();
            self.addMessage('jarvis', 'I apologize, but I encountered an error processing your request.');
            console.error('Processing error:', error);
        });
    };

    JarvisApp.prototype.addMessage = function(sender, text, metadata) {
        var messageDiv = document.createElement('div');
        messageDiv.className = 'message message-' + sender;
        
        var bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        if (sender === 'jarvis' && text.indexOf('```') !== -1) {
            bubble.innerHTML = this.formatCodeBlocks(text);
        } else {
            bubble.textContent = text;
        }
        
        var meta = document.createElement('div');
        meta.className = 'message-meta';
        
        var time = document.createElement('span');
        time.textContent = new Date().toLocaleTimeString();
        
        var avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
        
        meta.appendChild(sender === 'jarvis' ? avatar : time);
        meta.appendChild(sender === 'jarvis' ? time : avatar);
        
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(meta);
        
        this.ui.chatMessages.appendChild(messageDiv);
        this.ui.chatMessages.scrollTop = this.ui.chatMessages.scrollHeight;
    };

    JarvisApp.prototype.formatCodeBlocks = function(text) {
        return text
            .replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
                return '<div class="code-block">' +
                    '<div class="code-header">' +
                        '<span class="code-lang">' + (lang || 'code') + '</span>' +
                        '<button class="code-copy" onclick="jarvis.copyCode(this)">Copy</button>' +
                    '</div>' +
                    '<pre><code>' + code.trim().replace(/</g, '&lt;') + '</code></pre>' +
                '</div>';
            })
            .replace(/\n/g, '<br>');
    };

    JarvisApp.prototype.showTypingIndicator = function() {
        var indicator = document.createElement('div');
        indicator.className = 'message message-jarvis typing-message';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = 
            '<div class="message-bubble" style="padding: 20px;">' +
                '<div class="typing-indicator"><span></span><span></span><span></span></div>' +
            '</div>';
        this.ui.chatMessages.appendChild(indicator);
        this.ui.chatMessages.scrollTop = this.ui.chatMessages.scrollHeight;
    };

    JarvisApp.prototype.hideTypingIndicator = function() {
        var indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    };

    JarvisApp.prototype.toggleVoiceInput = function() {
        var self = this;
        
        if (this.voice.isListening) {
            this.voice.stop();
            this.ui.micBtn.classList.remove('recording');
        } else {
            this.ui.micBtn.classList.add('recording');
            
            this.voice.start(function(transcript) {
                self.handleUserInput(transcript);
                self.ui.micBtn.classList.remove('recording');
            });
        }
    };

    JarvisApp.prototype.speak = function(text) {
        var cleanText = text
            .replace(/```[\s\S]*?```/g, 'Code block.')
            .replace(/[#*_`]/g, '');
        this.voice.speak(cleanText);
    };

    JarvisApp.prototype.updateClock = function() {
        var now = new Date();
        var timeStr = this.userPreferences.timeFormat === '24' 
            ? now.toLocaleTimeString('en-GB')
            : now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
        
        document.getElementById('system-clock').textContent = timeStr;
        document.getElementById('system-date').textContent = now.toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
    };

    JarvisApp.prototype.updateResourceMonitor = function() {
        var cpu = Math.floor(Math.random() * 30) + 10;
        var mem = Math.floor(Math.random() * 200) + 100;
        
        document.getElementById('cpu-bar').style.width = cpu + '%';
        document.getElementById('cpu-text').textContent = cpu + '%';
        document.getElementById('mem-bar').style.width = ((mem/512)*100) + '%';
        document.getElementById('mem-text').textContent = mem + 'MB';
    };

    JarvisApp.prototype.updateEmotionDisplay = function() {
        var state = this.emotion.getState();
        document.getElementById('current-emotion').textContent = state.emoji;
    };

    JarvisApp.prototype.updateMemoryDisplay = function() {
        var stats = this.memory.getStats();
        document.getElementById('mem-facts').textContent = stats.facts;
    };

    JarvisApp.prototype.checkConnection = function() {
        var isOnline = navigator.onLine;
        var connStatus = document.getElementById('connection-status');
        var connText = connStatus.querySelector('.conn-text');
        var connDot = connStatus.querySelector('.conn-dot');
        
        if (isOnline) {
            connText.textContent = 'ONLINE';
            connStatus.style.borderColor = 'var(--success)';
            connStatus.style.color = 'var(--success)';
            connDot.style.background = 'var(--success)';
        } else {
            connText.textContent = 'OFFLINE';
            connStatus.style.borderColor = 'var(--warning)';
            connStatus.style.color = 'var(--warning)';
            connDot.style.background = 'var(--warning)';
        }
    };

    JarvisApp.prototype.executeQuickAction = function(action) {
        switch(action) {
            case 'weather':
                this.handleUserInput("What's the weather like?");
                break;
            case 'news':
                this.handleUserInput("Show me today's headlines");
                break;
            case 'reminder':
                this.ui.mainInput.value = "Remind me to ";
                this.ui.mainInput.focus();
                break;
            case 'calculate':
                document.querySelector('.calc-panel').scrollIntoView({ behavior: 'smooth' });
                break;
        }
    };

    JarvisApp.prototype.setTheme = function(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        this.memory.setPreference('theme', themeName);
    };

    JarvisApp.prototype.showContextMenu = function(e, messageElement) {
        var menu = document.getElementById('context-menu');
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.classList.remove('hidden');
    };

    JarvisApp.prototype.autoResizeTextarea = function() {
        var textarea = this.ui.mainInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    };

    JarvisApp.prototype.sleep = function(ms) {
        return new Promise(function(resolve) { setTimeout(resolve, ms); });
    };

    JarvisApp.prototype.loadUserPreferences = function() {
        var prefs = this.memory.getPreferences();
        this.userPreferences = Object.assign({
            voiceEnabled: true,
            theme: 'jarvis',
            timeFormat: '24',
            language: 'en-US'
        }, prefs);
        
        this.setTheme(this.userPreferences.theme);
        
        var usernameInput = document.getElementById('setting-username');
        if (usernameInput) usernameInput.value = prefs.userName || '';
    };

    // Public API methods
    JarvisApp.prototype.copyCode = function(btn) {
        var code = btn.closest('.code-block').querySelector('code').textContent;
        navigator.clipboard.writeText(code);
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
    };

    console.log('✅ App.js loaded');
})();
