/**
 * J.A.R.V.I.S. Core Engine
 * Main system architecture and base functionality
 * ============================================
 */

// Core System Namespace
const JARVIS = {
    // System State
    state: {
        initialized: false,
        active: false,
        currentUser: null,
        currentApp: 'dashboard',
        voiceListening: false,
        processing: false,
        lastActivity: Date.now(),
        uptime: 0,
        sessionStart: null,
        systemChecks: {
            neural: false,
            voice: false,
            memory: false,
            security: false
        }
    },
    
    // Data Stores
    data: {
        notes: [],
        reminders: [],
        history: [],
        preferences: {},
        cache: new Map()
    },
    
    // Event System
    events: {
        listeners: new Map(),
        
        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        },
        
        off(event, callback) {
            if (!this.listeners.has(event)) return;
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        },
        
        emit(event, data) {
            if (!this.listeners.has(event)) return;
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event handler error for ${event}:`, error);
                }
            });
        }
    },
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    async init() {
        console.log('%c J.A.R.V.I.S. ', 'background: #00d4ff; color: #000; font-size: 24px; font-weight: bold; padding: 10px; border-radius: 5px;');
        console.log('%c Initializing Core Systems... ', 'color: #00d4ff; font-size: 14px;');
        
        try {
            // Start uptime counter
            this.state.sessionStart = Date.now();
            this.startUptimeCounter();
            
            // Perform system checks
            await this.performSystemChecks();
            
            // Initialize storage
            await this.Storage.init();
            
            // Load user data
            await this.loadUserData();
            
            // Initialize voice systems
            await this.Voice.init();
            
            // Initialize AI
            await this.AI.init();
            
            // Setup event listeners
            this.setupGlobalListeners();
            
            // Mark as initialized
            this.state.initialized = true;
            this.state.active = true;
            
            // Emit ready event
            this.events.emit('system:ready', { timestamp: Date.now() });
            
            console.log('%c Systems Online ', 'background: #10b981; color: #000; font-size: 14px; font-weight: bold; padding: 5px; border-radius: 3px;');
            
            return true;
            
        } catch (error) {
            console.error('Initialization failed:', error);
            this.events.emit('system:error', { error });
            return false;
        }
    },
    
    async performSystemChecks() {
        const checks = document.querySelectorAll('.check-item');
        const statusEl = document.getElementById('loading-status');
        
        // Neural Network Check
        await this.simulateCheck('neural', checks[0], statusEl, 'Initializing neural networks...');
        this.state.systemChecks.neural = true;
        
        // Voice System Check
        await this.simulateCheck('voice', checks[1], statusEl, 'Calibrating voice synthesis...');
        this.state.systemChecks.voice = !!window.speechSynthesis;
        
        // Memory Check
        await this.simulateCheck('memory', checks[2], statusEl, 'Loading memory banks...');
        this.state.systemChecks.memory = !!window.localStorage;
        
        // Security Check
        await this.simulateCheck('security', checks[3], statusEl, 'Verifying security protocols...');
        this.state.systemChecks.security = window.isSecureContext;
        
        return true;
    },
    
    simulateCheck(type, element, statusEl, message) {
        return new Promise(resolve => {
            if (statusEl) statusEl.textContent = message;
            
            setTimeout(() => {
                if (element) element.classList.add('complete');
                resolve();
            }, 600);
        });
    },
    
    startUptimeCounter() {
        setInterval(() => {
            this.state.uptime = Date.now() - this.state.sessionStart;
            this.events.emit('system:uptime', this.state.uptime);
        }, 1000);
    },
    
    // ==========================================
    // STORAGE MANAGEMENT
    // ==========================================
    
    Storage: {
        db: null,
        initialized: false,
        
        async init() {
            // Initialize IndexedDB for large data
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('JARVIS_DB', 1);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    this.initialized = true;
                    resolve();
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create object stores
                    if (!db.objectStoreNames.contains('notes')) {
                        db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
                    }
                    if (!db.objectStoreNames.contains('reminders')) {
                        db.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true });
                    }
                    if (!db.objectStoreNames.contains('history')) {
                        db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
                    }
                };
            });
        },
        
        // LocalStorage wrapper with prefix
        local: {
            get(key, defaultValue = null) {
                try {
                    const item = localStorage.getItem(JARVIS_CONFIG.STORAGE.PREFIX + key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (e) {
                    console.error('Storage get error:', e);
                    return defaultValue;
                }
            },
            
            set(key, value) {
                try {
                    localStorage.setItem(JARVIS_CONFIG.STORAGE.PREFIX + key, JSON.stringify(value));
                    return true;
                } catch (e) {
                    console.error('Storage set error:', e);
                    return false;
                }
            },
            
            remove(key) {
                localStorage.removeItem(JARVIS_CONFIG.STORAGE.PREFIX + key);
            },
            
            clear() {
                Object.keys(localStorage)
                    .filter(key => key.startsWith(JARVIS_CONFIG.STORAGE.PREFIX))
                    .forEach(key => localStorage.removeItem(key));
            }
        },
        
        // IndexedDB operations
        async dbOperation(storeName, mode, operation) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], mode);
                const store = transaction.objectStore(storeName);
                const request = operation(store);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },
        
        async add(storeName, data) {
            return this.dbOperation(storeName, 'readwrite', store => store.add(data));
        },
        
        async get(storeName, id) {
            return this.dbOperation(storeName, 'readonly', store => store.get(id));
        },
        
        async getAll(storeName) {
            return this.dbOperation(storeName, 'readonly', store => store.getAll());
        },
        
        async update(storeName, data) {
            return this.dbOperation(storeName, 'readwrite', store => store.put(data));
        },
        
        async delete(storeName, id) {
            return this.dbOperation(storeName, 'readwrite', store => store.delete(id));
        },
        
        async clear(storeName) {
            return this.dbOperation(storeName, 'readwrite', store => store.clear());
        }
    },
    
    // ==========================================
    // USER DATA MANAGEMENT
    // ==========================================
    
    async loadUserData() {
        // Load preferences
        this.data.preferences = this.Storage.local.get('preferences', {
            theme: JARVIS_CONFIG.UI.THEME,
            username: 'Sir',
            voiceEnabled: true,
            notifications: true
        });
        
        // Load notes
        this.data.notes = this.Storage.local.get('notes', []);
        
        // Load reminders
        this.data.reminders = this.Storage.local.get('reminders', []);
        
        // Load history
        this.data.history = this.Storage.local.get('history', []);
        
        // Set current user
        this.state.currentUser = this.data.preferences.username;
        
        return true;
    },
    
    async saveUserData() {
        this.Storage.local.set('preferences', this.data.preferences);
        this.Storage.local.set('notes', this.data.notes);
        this.Storage.local.set('reminders', this.data.reminders);
        this.Storage.local.set('history', this.data.history);
    },
    
    // ==========================================
    // VOICE SYSTEM
    // ==========================================
    
    Voice: {
        recognition: null,
        synthesis: window.speechSynthesis,
        voices: [],
        currentVoice: null,
        isListening: false,
        
        async init() {
            // Initialize speech recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = JARVIS_CONFIG.VOICE.RECOGNITION.CONTINUOUS;
                this.recognition.interimResults = JARVIS_CONFIG.VOICE.RECOGNITION.INTERIM_RESULTS;
                this.recognition.lang = JARVIS_CONFIG.VOICE.RECOGNITION.LANG;
                this.recognition.maxAlternatives = JARVIS_CONFIG.VOICE.RECOGNITION.MAX_ALTERNATIVES;
                
                this.setupRecognitionHandlers();
            }
            
            // Initialize speech synthesis
            await this.loadVoices();
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
            
            return true;
        },
        
        setupRecognitionHandlers() {
            this.recognition.onstart = () => {
                this.isListening = true;
                JARVIS.state.voiceListening = true;
                JARVIS.events.emit('voice:start', {});
                document.body.classList.add('voice-active');
            };
            
            this.recognition.onresult = (event) => {
                const results = event.results;
                const transcript = results[results.length - 1][0].transcript;
                const isFinal = results[results.length - 1].isFinal;
                
                JARVIS.events.emit('voice:result', { transcript, isFinal });
                
                if (isFinal) {
                    JARVIS.processCommand(transcript);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                JARVIS.events.emit('voice:error', { error: event.error });
                this.stop();
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                JARVIS.state.voiceListening = false;
                JARVIS.events.emit('voice:end', {});
                document.body.classList.remove('voice-active');
            };
        },
        
        async loadVoices() {
            this.voices = this.synthesis.getVoices();
            
            // Select preferred voice
            const preferred = JARVIS_CONFIG.VOICE.SYNTHESIS.PREFERRED_VOICE;
            if (preferred) {
                this.currentVoice = this.voices.find(v => v.name === preferred) || 
                                   this.voices.find(v => v.lang.startsWith('en'));
            } else {
                // Default to a good English voice
                this.currentVoice = this.voices.find(v => v.name.includes('Google US English')) ||
                                   this.voices.find(v => v.name.includes('Samantha')) ||
                                   this.voices.find(v => v.lang === 'en-US') ||
                                   this.voices[0];
            }
            
            return this.voices;
        },
        
        start() {
            if (!this.recognition) {
                JARVIS.notify('Voice recognition not supported', 'error');
                return false;
            }
            
            try {
                this.recognition.start();
                return true;
            } catch (e) {
                console.error('Voice start error:', e);
                return false;
            }
        },
        
        stop() {
            if (this.recognition) {
                this.recognition.stop();
            }
        },
        
        speak(text, options = {}) {
            if (!this.synthesis || !JARVIS_CONFIG.VOICE.SYNTHESIS.ENABLED) return;
            
            // Cancel any ongoing speech
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.currentVoice;
            utterance.rate = options.rate || JARVIS_CONFIG.VOICE.SYNTHESIS.RATE;
            utterance.pitch = options.pitch || JARVIS_CONFIG.VOICE.SYNTHESIS.PITCH;
            utterance.volume = options.volume || JARVIS_CONFIG.VOICE.SYNTHESIS.VOLUME;
            
            utterance.onstart = () => JARVIS.events.emit('speech:start', { text });
            utterance.onend = () => JARVIS.events.emit('speech:end', { text });
            utterance.onerror = (e) => JARVIS.events.emit('speech:error', { error: e });
            
            this.synthesis.speak(utterance);
        },
        
        cancel() {
            if (this.synthesis) {
                this.synthesis.cancel();
            }
        }
    },
    
    // ==========================================
    // AI SYSTEM
    // ==========================================
    
    AI: {
        context: [],
        maxContext: 10,
        
        async init() {
            // Load any saved context
            const savedContext = JARVIS.Storage.local.get('ai_context', []);
            this.context = savedContext;
            return true;
        },
        
        async generateResponse(input, options = {}) {
            JARVIS.state.processing = true;
            JARVIS.events.emit('ai:processing:start', { input });
            
            try {
                let response;
                
                // Check if external API should be used
                if (JARVIS_CONFIG.AI.API.USE_EXTERNAL_API && JARVIS_CONFIG.AI.API.KEY) {
                    response = await this.callExternalAPI(input, options);
                } else {
                    // Use local response generation
                    response = this.generateLocalResponse(input);
                }
                
                // Update context
                this.updateContext(input, response);
                
                JARVIS.events.emit('ai:processing:complete', { input, response });
                return response;
                
            } catch (error) {
                console.error('AI Error:', error);
                JARVIS.events.emit('ai:processing:error', { error });
                return this.generateLocalResponse(input); // Fallback
            } finally {
                JARVIS.state.processing = false;
            }
        },
        
        async callExternalAPI(input, options) {
            const config = JARVIS_CONFIG.AI.API;
            const model = options.model || JARVIS_CONFIG.AI.CURRENT_MODEL;
            
            const requestBody = {
                model: model,
                messages: [
                    { role: 'system', content: JARVIS_CONFIG.AI.SYSTEM_PROMPT },
                    ...this.context.map((msg, i) => ({
                        role: i % 2 === 0 ? 'user' : 'assistant',
                        content: msg
                    })),
                    { role: 'user', content: input }
                ],
                max_tokens: config.MAX_TOKENS,
                temperature: config.TEMPERATURE,
                top_p: config.TOP_P,
                frequency_penalty: config.FREQUENCY_PENALTY,
                presence_penalty: config.PRESENCE_PENALTY
            };
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUT);
            
            try {
                const response = await fetch(config.ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.KEY}`
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
                
                const data = await response.json();
                return data.choices[0].message.content;
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                throw error;
            }
        },
        
        generateLocalResponse(input) {
            const intent = JARVIS.IntentParser.parse(input);
            return JARVIS.ResponseGenerator.generate(intent, input);
        },
        
        updateContext(input, response) {
            this.context.push(input, response);
            
            // Keep only recent context
            if (this.context.length > this.maxContext * 2) {
                this.context = this.context.slice(-this.maxContext * 2);
            }
            
            // Save context
            JARVIS.Storage.local.set('ai_context', this.context);
        },
        
        clearContext() {
            this.context = [];
            JARVIS.Storage.local.remove('ai_context');
        }
    },
    
    // ==========================================
    // INTENT PARSER
    // ==========================================
    
    IntentParser: {
        patterns: {
            greeting: /\b(hello|hi|hey|greetings|good morning|good afternoon|good evening|howdy)\b/i,
            goodbye: /\b(goodbye|bye|see you|farewell|exit|quit|sleep)\b/i,
            help: /\b(help|assist|support|what can you do|capabilities|features)\b/i,
            weather: /\b(weather|temperature|forecast|rain|sunny|cloudy|snow|storm)\b/i,
            time: /\b(time|clock|hour|minute|what time|current time)\b/i,
            date: /\b(date|day|month|year|today|tomorrow|yesterday)\b/i,
            note: /\b(note|remember|save this|write down|record)\b/i,
            reminder: /\b(remind|reminder|alarm|timer|alert|notify me)\b/i,
            calculate: /\b(calculate|compute|math|sum|add|subtract|multiply|divide|equals|what is \d+)\b/i,
            joke: /\b(joke|funny|humor|laugh|amuse|entertain)\b/i,
            name: /\b(your name|who are you|what are you|call you)\b/i,
            thanks: /\b(thank|thanks|appreciate|grateful)\b/i,
            search: /\b(search|find|lookup|google|look for)\b/i,
            news: /\b(news|headlines|what's happening|current events)\b/i,
            music: /\b(music|song|play|spotify|playlist)\b/i,
            email: /\b(email|mail|message|send|write to)\b/i,
            open: /\b(open|launch|start|run)\b/i,
            close: /\b(close|stop|end|terminate)\b/i
        },
        
        parse(input) {
            const lowerInput = input.toLowerCase();
            const intents = [];
            
            // Check all patterns
            for (const [intent, pattern] of Object.entries(this.patterns)) {
                if (pattern.test(lowerInput)) {
                    intents.push(intent);
                }
            }
            
            // Extract entities
            const entities = this.extractEntities(input);
            
            // Determine confidence
            const confidence = intents.length > 0 ? 0.8 : 0.3;
            
            return {
                primary: intents[0] || 'general',
                secondary: intents.slice(1),
                entities,
                confidence,
                original: input,
                timestamp: Date.now()
            };
        },
        
        extractEntities(input) {
            const entities = {
                numbers: input.match(/\d+(\.\d+)?/g)?.map(Number) || [],
                emails: input.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
                urls: input.match(/\bhttps?:\/\/\S+\b/g) || [],
                dates: input.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g) || [],
                times: input.match(/\b\d{1,2}:\d{2}\b/g) || []
            };
            
            return entities;
        }
    },
    
    // ==========================================
    // RESPONSE GENERATOR
    // ==========================================
    
    ResponseGenerator: {
        responses: {
            greeting: [
                "Hello! It's a pleasure to assist you today.",
                "Greetings! How may I be of service?",
                "Good day! I'm JARVIS, at your service.",
                "Welcome back! What can I do for you?",
                "Hello there! Ready to help."
            ],
            goodbye: [
                "Goodbye! It was a pleasure assisting you.",
                "Farewell! I'll be here when you need me.",
                "Until next time, sir.",
                "Shutting down interface. Have a wonderful day!",
                "It was an honor to serve you today."
            ],
            help: [
                "I can help you with various tasks including: managing notes, setting reminders, performing calculations, checking weather, and answering questions.",
                "My capabilities include: note-taking, reminders, calculations, weather information, and general assistance.",
                "I'm equipped to handle: notes, reminders, math, weather, and conversation. What would you like to try?"
            ],
            thanks: [
                "You're most welcome!",
                "My pleasure, sir.",
                "Happy to help anytime.",
                "At your service always.",
                "Glad I could assist."
            ],
            unknown: [
                "I didn't quite catch that. Could you rephrase?",
                "I'm not sure I understand. Could you clarify?",
                "My apologies, I didn't comprehend that request.",
                "Could you provide more details? I want to help.",
                "I'm still learning. Could you explain that differently?"
            ]
        },
        
        generate(intent, input) {
            // Handle specific intents with dynamic responses
            switch(intent) {
                case 'time':
                    return this.getTimeResponse();
                case 'date':
                    return this.getDateResponse();
                case 'weather':
                    return this.getWeatherResponse();
                case 'calculate':
                    return this.calculate(input);
                case 'joke':
                    return this.getJoke();
                case 'name':
                    return "I am J.A.R.V.I.S., Just A Rather Very Intelligent System. Your personal AI assistant.";
                default:
                    return this.getRandomResponse(intent);
            }
        },
        
        getRandomResponse(intent) {
            const responses = this.responses[intent] || this.responses.unknown;
            return responses[Math.floor(Math.random() * responses.length)];
        },
        
        getTimeResponse() {
            const now = new Date();
            return `The current time is ${now.toLocaleTimeString()}.`;
        },
        
        getDateResponse() {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return `Today is ${now.toLocaleDateString(undefined, options)}.`;
        },
        
        getWeatherResponse() {
            if (!JARVIS_CONFIG.APIS.WEATHER.ENABLED) {
                return "Weather services are not configured. Please add your weather API key in settings.";
            }
            return "Fetching weather data...";
        },
        
        calculate(input) {
            try {
                // Extract mathematical expression
                const clean = input.replace(/[^0-9+\-*/().\s]/g, '').trim();
                if (!clean) return "I couldn't find a mathematical expression to calculate.";
                
                // Safe evaluation
                const result = Function('"use strict"; return (' + clean + ')')();
                return `The result of ${clean} is ${result}.`;
            } catch (e) {
                return "I couldn't calculate that. Please provide a valid mathematical expression.";
            }
        },
        
        getJoke() {
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything!",
                "I told my computer I needed a break, and now it won't stop sending me Kit-Kats.",
                "Why did the scarecrow win an award? He was outstanding in his field!",
                "I'm reading a book on anti-gravity. It's impossible to put down!",
                "Why don't eggs tell jokes? They'd crack each other up!",
                "I would tell you a construction joke, but I'm still working on it.",
                "Why did the bicycle fall over? Because it was two-tired!",
                "I'm friends with all electricians. We have good current connections.",
                "Why do programmers prefer dark mode? Because light attracts bugs!",
                "I told my wife she was drawing her eyebrows too high. She looked surprised!"
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }
    },
    
    // ==========================================
    // COMMAND PROCESSOR
    // ==========================================
    
    async processCommand(input) {
        if (!input.trim()) return;
        
        console.log('Processing command:', input);
        this.state.lastActivity = Date.now();
        
        // Add to history
        this.addToHistory('user', input);
        
        // Parse intent
        const intent = this.IntentParser.parse(input);
        
        // Execute based on intent
        let response;
        
        try {
            switch(intent.primary) {
                case 'note':
                    response = await this.Features.Notes.createFromCommand(input);
                    break;
                case 'reminder':
                    response = await this.Features.Reminders.createFromCommand(input);
                    break;
                case 'open':
                    response = this.handleOpenCommand(input);
                    break;
                case 'close':
                    response = this.handleCloseCommand(input);
                    break;
                default:
                    // Use AI for general responses
                    response = await this.AI.generateResponse(input);
            }
        } catch (error) {
            console.error('Command processing error:', error);
            response = "I encountered an error processing your request.";
        }
        
        // Add AI response to history
        this.addToHistory('jarvis', response);
        
        // Speak response if voice is active
        if (this.state.voiceListening) {
            this.Voice.speak(response);
        }
        
        return response;
    },
    
    addToHistory(type, content) {
        const entry = {
            id: Date.now(),
            type,
            content,
            timestamp: Date.now(),
            app: this.state.currentApp
        };
        
        this.data.history.unshift(entry);
        
        // Trim history
        if (this.data.history.length > JARVIS_CONFIG.STORAGE.MAX_HISTORY) {
            this.data.history = this.data.history.slice(0, JARVIS_CONFIG.STORAGE.MAX_HISTORY);
        }
        
        // Save to storage
        this.Storage.local.set('history', this.data.history);
        
        // Emit event
        this.events.emit('history:add', entry);
    },
    
    handleOpenCommand(input) {
        const appMap = {
            'dashboard': 'dashboard',
            'assistant': 'assistant',
            'voice': 'voice',
            'notes': 'notes',
            'reminders': 'reminders',
            'calculator': 'calculator',
            'weather': 'weather',
            'settings': 'settings'
        };
        
        for (const [name, app] of Object.entries(appMap)) {
            if (input.toLowerCase().includes(name)) {
                this.navigateTo(app);
                return `Opening ${name}.`;
            }
        }
        
        return "I'm not sure which app you'd like to open.";
    },
    
    handleCloseCommand(input) {
        // Handle close commands
        return "Closing current application.";
    },
    
    // ==========================================
    // NAVIGATION
    // ==========================================
    
    navigateTo(app) {
        if (!JARVIS_CONFIG.FEATURES[app.toUpperCase()]) {
            this.notify('This feature is not enabled', 'warning');
            return false;
        }
        
        // Update state
        this.state.currentApp = app;
        
        // Update UI
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`app-${app}`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.app === app);
        });
        
        // Emit event
        this.events.emit('navigate', { app });
        
        // Initialize app-specific features
        this.initializeApp(app);
        
        return true;
    },
    
    initializeApp(app) {
        switch(app) {
            case 'notes':
                this.Features.Notes.render();
                break;
            case 'reminders':
                this.Features.Reminders.render();
                this.Features.Reminders.checkDue();
                break;
            case 'dashboard':
                this.updateDashboard();
                break;
        }
    },
    
    // ==========================================
    // NOTIFICATION SYSTEM
    // ==========================================
    
    notify(message, type = 'info', duration = JARVIS_CONFIG.UI.NOTIFICATION_DURATION) {
        const container = document.getElementById('notification-container') || document.body;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type]}</span>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        
        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        this.events.emit('notification', { message, type });
    },
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    formatTime(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // ==========================================
    // GLOBAL EVENT LISTENERS
    // ==========================================
    
    setupGlobalListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Focus chat input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const chatInput = document.getElementById('chat-input');
                if (chatInput) chatInput.focus();
            }
            
            // Escape: Stop voice
            if (e.key === 'Escape') {
                this.Voice.stop();
            }
            
            // Space: Toggle voice (when not typing)
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                if (this.Voice.isListening) {
                    this.Voice.stop();
                } else {
                    this.Voice.start();
                }
            }
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.events.emit('system:background', {});
            } else {
                this.events.emit('system:foreground', {});
            }
        });
        
        // Online/Offline
        window.addEventListener('online', () => {
            this.notify('Connection restored', 'success');
            this.events.emit('system:online', {});
        });
        
        window.addEventListener('offline', () => {
            this.notify('Connection lost', 'warning');
            this.events.emit('system:offline', {});
        });
        
        // Before unload
        window.addEventListener('beforeunload', () => {
            this.saveUserData();
        });
        
        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.events.emit('system:error', { error: e.error });
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled rejection:', e.reason);
            this.events.emit('system:error', { error: e.reason });
        });
    },
    
    // ==========================================
    // DASHBOARD UPDATES
    // ==========================================
    
    updateDashboard() {
        // Update stats
        const notesCount = document.getElementById('total-notes');
        const remindersCount = document.getElementById('total-reminders');
        const uptimeEl = document.getElementById('system-uptime');
        
        if (notesCount) notesCount.textContent = this.data.notes.length;
        if (remindersCount) remindersCount.textContent = this.data.reminders.length;
        if (uptimeEl) uptimeEl.textContent = this.formatTime(this.state.uptime);
        
        // Update greeting
        const hour = new Date().getHours();
        let greeting = 'Good evening';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        
        const greetingEl = document.getElementById('greeting-text');
        if (greetingEl) greetingEl.textContent = greeting;
        
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) userNameEl.textContent = this.state.currentUser;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => JARVIS.init());
} else {
    JARVIS.init();
}
