// ============================================
// J.A.R.V.I.S. MAIN APPLICATION CONTROLLER
// FIXED VERSION - Better error handling
// ============================================

(function() {
    'use strict';

    // Wait for all scripts to load
    window.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded, checking modules...');
        
        // Check modules with better error messages
        var missing = [];
        if (!window.JarvisCore) missing.push('JarvisCore (core.js)');
        if (!window.JarvisFeatures) missing.push('JarvisFeatures (features.js)');
        if (!window.JarvisVoiceVision) missing.push('JarvisVoiceVision (voice_vision.js)');
        
        if (missing.length > 0) {
            console.error('Missing modules:', missing);
            showBootError('Failed to load: ' + missing.join(', '));
            return;
        }

        console.log('All modules found, starting...');
        window.jarvis = new JarvisApp();
    });

    function showBootError(msg) {
        var status = document.getElementById('boot-status');
        var log = document.getElementById('boot-log');
        if (status) status.textContent = 'ERROR: ' + msg;
        if (log) {
            var entry = document.createElement('div');
            entry.style.color = '#ff0055';
            entry.textContent = '[ERROR] ' + msg;
            log.appendChild(entry);
        }
    }

    // ============================================
    // MAIN APPLICATION CLASS
    // ============================================
    function JarvisApp() {
        this.version = '2.0.0';
        this.initialized = false;
        
        // Core Systems
        this.brain = null;
        this.memory = null;
        this.emotion = null;
        this.modules = null;
        this.voice = null;
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
        console.log('J.A.R.V.I.S. v' + this.version + ' Initializing...');
        
        try {
            await this.performBootSequence();
            await this.initializeCoreSystems();
            await this.initializeFeatures();
            await this.initializeVoiceVision();
            this.setupEventListeners();
            this.startSystemLoops();
            this.completeInitialization();
        } catch (error) {
            console.error('Initialization failed:', error);
            showBootError('Init failed: ' + error.message);
        }
    };

    JarvisApp.prototype.performBootSequence = async function() {
        var self = this;
        var steps = [
            { msg: 'Loading kernel modules...', progress: 10 },
            { msg: 'Initializing memory banks...', progress: 25 },
            { msg: 'Mounting emotional core...', progress: 40 },
            { msg: 'Calibrating voice synthesis...', progress: 55 },
            { msg: 'Establishing secure connection...', progress: 70 },
            { msg: 'Loading user preferences...', progress: 85 },
            { msg: 'System ready. Awaiting command.', progress: 100 }
        ];

        var bootLog = document.getElementById('boot-log');
        var bootBar = document.getElementById('boot-bar');
        var bootStatus = document.getElementById('boot-status');

        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            
            if (bootStatus) bootStatus.textContent = step.msg;
            if (bootBar) bootBar.style.width = step.progress + '%';
            
            if (bootLog) {
                var logEntry = document.createElement('div');
                logEntry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + step.msg;
                bootLog.appendChild(logEntry);
                bootLog.scrollTop = bootLog.scrollHeight;
            }
            
            // Shorter delay for faster boot
            await this.sleep(100);
        }

        await this.sleep(200);
    };

    JarvisApp.prototype.initializeCoreSystems = async function() {
        console.log('Initializing core systems...');
        
        // Initialize Memory with timeout
        try {
            this.memory = new JarvisCore.MemoryManager({
                maxFacts: 1000,
                maxHistory: 100,
                compressionEnabled: false // Disable for compatibility
            });
            
            // Add timeout to memory init
            var memInit = this.memory.initialize();
            var memTimeout = new Promise(function(_, reject) {
                setTimeout(function() { reject(new Error('Memory init timeout')); }, 5000);
            });
            
            await Promise.race([memInit, memTimeout]);
            console.log('Memory initialized');
        } catch (e) {
            console.warn('Memory init failed, using fallback:', e);
            // Create minimal fallback memory
            this.memory = {
                getFact: async function() { return null; },
                setFact: async function() {},
                getPreferences: function() { 
                    var prefs = localStorage.getItem('jarvis_prefs');
                    return prefs ? JSON.parse(prefs) : {};
                },
                setPreference: function(key, val) {
                    var prefs = this.getPreferences();
                    prefs[key] = val;
                    localStorage.setItem('jarvis_prefs', JSON.stringify(prefs));
                },
                save: function() {},
                getStats: function() { return { facts: 0, preferences: 0, conversations: 0 }; }
            };
        }

        // Initialize Emotion
        this.emotion = new JarvisCore.EmotionalCore({
            baseline: 'neutral',
            volatility: 0.3,
            empathyLevel: 0.8
        });

        // Initialize Intent
        this.intent = new JarvisCore.IntentProcessor({
            fuzzyMatching: true,
            confidenceThreshold: 0.6,
            useContext: true
        });

        // Initialize Learning
        this.learning = new JarvisCore.LearningEngine({
            autoLearn: true,
            confirmationRequired: false,
            maxConfidence: 1.0
        });

        // Initialize Response
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
            console.log('Brain status:', status);
        });
        
        this.brain.on('speak', function(text) {
            self.addMessage('jarvis', text);
            if (self.userPreferences && self.userPreferences.voiceEnabled) {
                self.speak(text);
            }
        });
        
        console.log('Core systems ready');
    };

    JarvisApp.prototype.initializeFeatures = async function() {
        console.log('Initializing features...');
        JarvisFeatures.init(this.memory);
        this.modules = JarvisFeatures;
        console.log('Features ready');
    };

    JarvisApp.prototype.initializeVoiceVision = async function() {
        console.log('Initializing voice & vision...');
        
        JarvisVoiceVision.init({
            voice: {
                language: 'en-US',
                pitch: 0.9,
                rate: 1.1,
                volume: 1.0
            },
            wake: {
                keywords: ['hey jarvis', 'jarvis'],
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
        
        console.log('Voice & vision ready');
    };

    JarvisApp.prototype.setupEventListeners = function() {
        var self = this;

        // Boot transition
        setTimeout(function() {
            if (self.ui.bootScreen) {
                self.ui.bootScreen.style.opacity = '0';
                setTimeout(function() {
                    self.ui.bootScreen.classList.add('hidden');
                    if (self.ui.appContainer) {
                        self.ui.appContainer.classList.remove('hidden');
                    }
                    self.speak("All systems operational. Welcome back.");
                }, 500);
            }
        }, 500);

        // Input handling
        if (this.ui.mainInput) {
            this.ui.mainInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    self.handleUserInput();
                }
                self.autoResizeTextarea();
            });
        }

        if (this.ui.sendBtn) {
            this.ui.sendBtn.addEventListener('click', function() {
                self.handleUserInput();
            });
        }

        // Mic button
        if (this.ui.micBtn) {
            this.ui.micBtn.addEventListener('click', function() {
                self.toggleVoiceInput();
            });
        }

        // Panel toggles
        document.querySelectorAll('.panel-toggle').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var panel = e.target.closest('.panel');
                if (panel) {
                    var content = panel.querySelector('.panel-content');
                    if (content) {
                        content.classList.toggle('collapsed');
                        e.target.textContent = content.classList.contains('collapsed') ? '+' : '−';
                    }
                }
            });
        });

        // Settings
        var settingsBtn = document.getElementById('btn-settings');
        var settingsModal = document.getElementById('settings-modal');
        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', function() {
                settingsModal.classList.remove('hidden');
            });
        }

        document.querySelectorAll('.modal-close').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var overlay = e.target.closest('.modal-overlay');
                if (overlay) overlay.classList.add('hidden');
            });
        });

        // Settings tabs
        document.querySelectorAll('.settings-tab').forEach(function(tab) {
            tab.addEventListener('click', function(e) {
                var targetPanel = e.target.dataset.tab;
                if (!targetPanel) return;
                
                document.querySelectorAll('.settings-tab').forEach(function(t) { 
                    t.classList.remove('active'); 
                });
                document.querySelectorAll('.settings-panel').forEach(function(p) { 
                    p.classList.remove('active'); 
                });
                
                e.target.classList.add('active');
                var panel = document.querySelector('.settings-panel[data-panel="' + targetPanel + '"]');
                if (panel) panel.classList.add('active');
            });
        });

        // Quick actions
        document.querySelectorAll('.quick-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var action = e.target.dataset.action;
                if (action) self.executeQuickAction(action);
            });
        });

        // Vision modal
        var visionBtn = document.getElementById('btn-vision');
        var visionModal = document.getElementById('vision-modal');
        if (visionBtn && visionModal) {
            visionBtn.addEventListener('click', function() {
                visionModal.classList.remove('hidden');
                if (self.vision) self.vision.start();
            });
        }

        // Purge data
        var purgeBtn = document.getElementById('btn-purge-all');
        if (purgeBtn) {
            purgeBtn.addEventListener('click', function() {
                if (confirm('Purge all data?')) {
                    if (self.memory && self.memory.clear) {
                        self.memory.clear();
                    }
                    localStorage.clear();
                    location.reload();
                }
            });
        }

        console.log('Event listeners attached');
    };

    JarvisApp.prototype.startSystemLoops = function() {
        var self = this;
        
        setInterval(function() { self.updateClock(); }, 1000);
        setInterval(function() { self.updateResourceMonitor(); }, 2000);
        
        if (this.emotion) {
            setInterval(function() { self.emotion.decay(); }, 5000);
        }
        
        setInterval(function() { 
            if (self.memory && self.memory.save) {
                self.memory.save(); 
            }
        }, 30000);
        
        setInterval(function() { self.checkConnection(); }, 10000);
        
        console.log('System loops started');
    };

    JarvisApp.prototype.completeInitialization = function() {
        this.initialized = true;
        this.loadUserPreferences();
        this.updateMemoryDisplay();
        
        if (this.modules && this.modules.notifications) {
            this.modules.notifications.show({
                title: 'System Online',
                message: 'J.A.R.V.I.S. is ready.',
                type: 'success',
                duration: 3000
            });
        }
        
        console.log('Initialization complete');
    };

    JarvisApp.prototype.handleUserInput = function(text) {
        var input = text || (this.ui.mainInput ? this.ui.mainInput.value.trim() : '');
        if (!input) return;

        if (!text && this.ui.mainInput) {
            this.ui.mainInput.value = '';
        }
        this.autoResizeTextarea();

        this.addMessage('user', input);
        
        this.conversationContext.history.push({ 
            role: 'user', 
            content: input, 
            timestamp: Date.now() 
        });
        
        this.showTypingIndicator();

        var self = this;
        
        if (!this.brain) {
            this.hideTypingIndicator();
            this.addMessage('jarvis', 'System not ready. Please wait.');
            return;
        }
        
        this.brain.process(input, {
            context: this.conversationContext,
            emotion: this.emotion ? this.emotion.getState() : { current: 'neutral' },
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
            console.error('Processing error:', error);
            self.addMessage('jarvis', 'I encountered an error. Please try again.');
        });
    };

    JarvisApp.prototype.addMessage = function(sender, text, metadata) {
        if (!this.ui.chatMessages) return;
        
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
        if (!this.ui.chatMessages) return;
        
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
        
        if (!this.voice) {
            this.addMessage('jarvis', 'Voice system not available.');
            return;
        }
        
        if (this.voice.isListening) {
            this.voice.stop();
            if (this.ui.micBtn) this.ui.micBtn.classList.remove('recording');
        } else {
            if (this.ui.micBtn) this.ui.micBtn.classList.add('recording');
            
            this.voice.start(function(transcript) {
                self.handleUserInput(transcript);
                if (self.ui.micBtn) self.ui.micBtn.classList.remove('recording');
            });
        }
    };

    JarvisApp.prototype.speak = function(text) {
        if (!this.voice) return;
        
        var cleanText = text
            .replace(/```[\s\S]*?```/g, 'Code block.')
            .replace(/[#*_`]/g, '');
        this.voice.speak(cleanText);
    };

    JarvisApp.prototype.updateClock = function() {
        var now = new Date();
        var clockEl = document.getElementById('system-clock');
        var dateEl = document.getElementById('system-date');
        
        if (clockEl) {
            clockEl.textContent = this.userPreferences && this.userPreferences.timeFormat === '24' 
                ? now.toLocaleTimeString('en-GB')
                : now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
        }
        
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
        }
    };

    JarvisApp.prototype.updateResourceMonitor = function() {
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
    };

    JarvisApp.prototype.updateEmotionDisplay = function() {
        if (!this.emotion) return;
        var state = this.emotion.getState();
        var el = document.getElementById('current-emotion');
        if (el) el.textContent = state.emoji;
    };

    JarvisApp.prototype.updateMemoryDisplay = function() {
        if (!this.memory) return;
        var stats = this.memory.getStats();
        var factsEl = document.getElementById('mem-facts');
        if (factsEl) factsEl.textContent = stats.facts;
    };

    JarvisApp.prototype.checkConnection = function() {
        var isOnline = navigator.onLine;
        var connStatus = document.getElementById('connection-status');
        if (!connStatus) return;
        
        var connText = connStatus.querySelector('.conn-text');
        var connDot = connStatus.querySelector('.conn-dot');
        
        if (isOnline) {
            if (connText) connText.textContent = 'ONLINE';
            connStatus.style.borderColor = 'var(--success)';
            connStatus.style.color = 'var(--success)';
            if (connDot) connDot.style.background = 'var(--success)';
        } else {
            if (connText) connText.textContent = 'OFFLINE';
            connStatus.style.borderColor = 'var(--warning)';
            connStatus.style.color = 'var(--warning)';
            if (connDot) connDot.style.background = 'var(--warning)';
        }
    };

    JarvisApp.prototype.executeQuickAction = function(action) {
        switch(action) {
            case 'weather':
                this.handleUserInput("What's the weather?");
                break;
            case 'news':
                this.handleUserInput("Show me news");
                break;
            case 'reminder':
                if (this.ui.mainInput) {
                    this.ui.mainInput.value = "Remind me to ";
                    this.ui.mainInput.focus();
                }
                break;
            case 'calculate':
                var calcPanel = document.querySelector('.calc-panel');
                if (calcPanel) calcPanel.scrollIntoView({ behavior: 'smooth' });
                break;
        }
    };

    JarvisApp.prototype.loadUserPreferences = function() {
        var prefs = {};
        if (this.memory && this.memory.getPreferences) {
            prefs = this.memory.getPreferences();
        }
        
        this.userPreferences = {
            voiceEnabled: prefs.voiceEnabled !== undefined ? prefs.voiceEnabled : true,
            theme: prefs.theme || 'jarvis',
            timeFormat: prefs.timeFormat || '24',
            language: prefs.language || 'en-US'
        };
        
        this.setTheme(this.userPreferences.theme);
    };

    JarvisApp.prototype.setTheme = function(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        if (this.memory && this.memory.setPreference) {
            this.memory.setPreference('theme', themeName);
        }
    };

    JarvisApp.prototype.autoResizeTextarea = function() {
        if (!this.ui.mainInput) return;
        var textarea = this.ui.mainInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    };

    JarvisApp.prototype.sleep = function(ms) {
        return new Promise(function(resolve) { 
            setTimeout(resolve, ms); 
        });
    };

    JarvisApp.prototype.copyCode = function(btn) {
        var code = btn.closest('.code-block').querySelector('code').textContent;
        navigator.clipboard.writeText(code);
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
    };

    console.log('App.js parsed and ready');
})();
