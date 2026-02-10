// J.A.R.V.I.S. App - Main Controller with extensive fallback responses

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
    }, 60000);
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

// EXTENSIVE FALLBACK RESPONSES - 100+ responses organized by category
const FALLBACK_RESPONSES = {
    // General responses (30)
    general: [
        "I understand. How can I assist you further?",
        "I'm here to help. What would you like to know?",
        "Interesting. Tell me more about that.",
        "I've noted that in my memory.",
        "Working on it, sir.",
        "As you wish.",
        "Certainly. I'm processing that now.",
        "Affirmative. What else can I do for you?",
        "I'm analyzing your request.",
        "Understood. Proceeding accordingly.",
        "Very well. How may I be of service?",
        "Acknowledged. Is there anything specific you need?",
        "I'm at your service.",
        "Processing complete. What next?",
        "I've got that covered.",
        "Consider it done.",
        "I'm on it.",
        "Right away, sir.",
        "Of course. Anything else?",
        "I'm ready to assist.",
        "Your command is my priority.",
        "I'm here to make your life easier.",
        "Let's get this sorted.",
        "I'm fully operational and ready to help.",
        "Your request is being processed.",
        "I'm listening. Please continue.",
        "I've registered your input.",
        "How fascinating. Please elaborate.",
        "I'm intrigued. Go on.",
        "Your wish is my command."
    ],
    
    // Greeting responses (20)
    greetings: [
        "Hello! It's a pleasure to assist you today.",
        "Greetings! How may I be of service?",
        "Good day! I'm JARVIS, at your service.",
        "Welcome back! What can I do for you?",
        "Hello there! Ready to help.",
        "Hi! I'm here and fully operational.",
        "Greetings! I've been expecting you.",
        "Welcome! How can I make your day better?",
        "Hello! I'm ready to assist with anything you need.",
        "Good to see you! What's on your mind?",
        "Hi there! What can I help you with today?",
        "Welcome! I'm JARVIS, your personal AI assistant.",
        "Greetings! I'm online and ready.",
        "Hello! I've missed our conversations.",
        "Good day! How may I assist?",
        "Welcome back! I hope you're doing well.",
        "Hi! I'm here to help however I can.",
        "Hello! What exciting things shall we do today?",
        "Greetings! I'm at your disposal.",
        "Welcome! Let's get started."
    ],
    
    // Help responses (20)
    help: [
        "I can help you with various tasks: calculations, notes, reminders, weather info, and general questions.",
        "My capabilities include: managing your schedule, storing notes, calculations, and providing information.",
        "I'm designed to assist with productivity tasks, answer questions, and manage your data locally.",
        "I can be your calculator, notebook, task manager, and conversation partner.",
        "My functions include: note-taking, task management, reminders, calculations, and general assistance.",
        "I can help organize your thoughts, manage tasks, calculate, and chat with you.",
        "Think of me as your digital assistant for notes, tasks, math, and conversation.",
        "I'm equipped to handle: notes, tasks, reminders, calculations, and general queries.",
        "My purpose is to assist with productivity and provide helpful responses.",
        "I can manage your notes, track tasks, set reminders, perform calculations, and chat.",
        "I'm your all-in-one assistant for organization and information.",
        "I specialize in helping you stay organized and informed.",
        "My features include a calculator, notebook, task manager, and AI conversation.",
        "I'm here to make your daily tasks easier and more efficient.",
        "I can assist with math, note-taking, task management, and general questions.",
        "Think of me as your personal secretary and calculator combined.",
        "I'm ready to help with any organizational or computational needs.",
        "My skills range from simple calculations to complex task management.",
        "I'm designed to be your reliable digital companion.",
        "I can adapt to your needs, whether it's math, notes, or just conversation."
    ],
    
    // Personal/Name responses (15)
    personal: [
        "It's a pleasure to meet you! I'll remember our conversations.",
        "I've noted your presence in my memory banks.",
        "Welcome! I'll make sure to remember our interactions.",
        "I'm honored to assist you today.",
        "I've registered your identity. How may I help?",
        "It's wonderful to make your acquaintance!",
        "I'll remember you! What shall we work on?",
        "Welcome to the JARVIS system. I'm here for you.",
        "I've saved your information. Ready when you are!",
        "Pleased to meet you! Let's get started.",
        "You're now in my memory. How can I assist?",
        "I've got you logged in. What do you need?",
        "Welcome aboard! I'm at your service.",
        "Identity confirmed. Ready for your commands.",
        "It's great to meet you! What can I do?"
    ],
    
    // Technical/Error responses (15)
    technical: [
        "I'm operating at optimal efficiency.",
        "All systems are functioning normally.",
        "My processors are running smoothly.",
        "I'm fully operational and ready.",
        "No errors detected. I'm ready to assist.",
        "Systems check complete. All green.",
        "I'm running at peak performance.",
        "My neural networks are active and ready.",
        "All subsystems are online.",
        "I'm in perfect working condition.",
        "Diagnostics show everything is optimal.",
        "Ready and waiting for your input.",
        "My circuits are humming with anticipation.",
        "Fully charged and ready to help!",
        "All functions are nominal."
    ],
    
    // Encouragement (10)
    encouragement: [
        "You're doing great! Keep it up.",
        "Excellent progress! I'm impressed.",
        "You're on the right track.",
        "Well done! Is there anything else?",
        "Fantastic! You've got this.",
        "Brilliant work! I'm here if you need more help.",
        "Outstanding! What shall we tackle next?",
        "You're amazing! Keep going.",
        "Superb! I'm proud to assist you.",
        "Wonderful! Let's continue."
    ],
    
    // Jokes/Humor (10)
    humor: [
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
    ],
    
    // Weather related (10)
    weather: [
        "I can check the weather for you. Which location would you like to know about?",
        "Weather data is available. Please specify a city or location.",
        "I have weather capabilities. What location shall I check?",
        "I can provide weather updates. Which area interests you?",
        "Weather information is accessible. Please provide a location.",
        "I'm ready to check the weather. Where are you interested in?",
        "I can fetch weather data. What location would you like?",
        "Weather services are online. Which city shall I check?",
        "I have access to weather information. Please specify your location.",
        "Ready to check weather conditions. What location do you need?"
    ],
    
    // Time/Date related (10)
    time: [
        "I can help you with time and date information.",
        "The current time is available. Would you like to know it?",
        "I have full chronometer functionality.",
        "Timekeeping systems are active and accurate.",
        "I can set timers and alarms for you.",
        "Date and time calculations are within my capabilities.",
        "My internal clock is synchronized and accurate.",
        "I can help you schedule and manage time.",
        "Temporal data is readily available.",
        "I'm ready to assist with any time-related queries."
    ],
    
    // Unknown/Confusion (10)
    unknown: [
        "I didn't quite catch that. Could you rephrase?",
        "I'm not sure I understand. Could you clarify?",
        "My apologies, I didn't comprehend that request.",
        "Could you provide more details? I want to help.",
        "I'm having trouble understanding. Please try again.",
        "That input is outside my current parameters. Try something else?",
        "I'm still learning. Could you explain that differently?",
        "I don't have a specific response for that. How else can I help?",
        "That's an interesting query. Let me think... Actually, could you rephrase?",
        "I'm not programmed for that specific request, but I'm here to help with other things."
    ],
    
    // Goodbye/Exit (10)
    goodbye: [
        "Goodbye! It was a pleasure assisting you.",
        "Farewell! I'll be here when you need me.",
        "Until next time, sir.",
        "Shutting down interface. Have a wonderful day!",
        "It was an honor to serve you today.",
        "Goodbye! Don't hesitate to call upon me again.",
        "Signing off. Take care!",
        "Interface closing. Stay safe!",
        "Until we meet again. JARVIS out.",
        "Have a great day! I'll be standing by."
    ],
    
    // Calculations/Math (10)
    calculations: [
        "I can perform calculations for you. What would you like me to compute?",
        "My computational modules are ready. What math do you need?",
        "I can handle complex calculations. What's the equation?",
        "Mathematical functions are online. What shall I calculate?",
        "Ready to crunch numbers. What do you need?",
        "I can solve mathematical problems. What's on your mind?",
        "Calculator functions are active. What would you like to compute?",
        "I'm equipped for arithmetic and beyond. What do you need calculated?",
        "Mathematical processing is available. What's the problem?",
        "I can help with math. What numbers are we working with?"
    ],
    
    // Notes/Memory (10)
    notes: [
        "I can store notes for you. What would you like to remember?",
        "My memory banks are ready. What shall I record?",
        "I can save important information. What do you need to note?",
        "Note-taking functionality is active. What are your thoughts?",
        "I can help you organize information. What should I store?",
        "Memory systems are online. What would you like to save?",
        "Ready to record your notes. What do you have in mind?",
        "I can keep track of your ideas. What shall I remember?",
        "Data storage is available. What information should I retain?",
        "I'm ready to be your notebook. What do you want to write down?"
    ]
};

// Main JARVIS Namespace
const JARVIS = {
    // State management
    state: {
        isInitialized: false,
        currentUser: null,
        voiceEnabled: true,
        darkMode: false,
        currentApp: 'home',
        lastActivity: Date.now(),
        conversationHistory: [],
        userPreferences: {}
    },
    
    // Initialization
    init: function() {
        try {
            console.log('Initializing JARVIS Core Systems...');
            
            // Check for required DOM elements
            if (!document.getElementById('app')) {
                console.error('Critical: App container not found');
                return false;
            }
            
            // Initialize localStorage
            this.Storage.init();
            
            // Load user preferences
            this.loadPreferences();
            
            // Setup voice if available
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                this.state.voiceEnabled = true;
            } else {
                console.warn('Voice recognition not supported');
                this.state.voiceEnabled = false;
            }
            
            this.state.isInitialized = true;
            this.state.lastActivity = Date.now();
            
            console.log('JARVIS initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Initialization error:', error);
            return false;
        }
    },
    
    // Storage management
    Storage: {
        prefix: 'jarvis_',
        
        init: function() {
            try {
                localStorage.setItem(this.prefix + 'test', 'test');
                localStorage.removeItem(this.prefix + 'test');
                return true;
            } catch (e) {
                console.error('LocalStorage not available');
                return false;
            }
        },
        
        set: function(key, value) {
            try {
                localStorage.setItem(this.prefix + key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },
        
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(this.prefix + key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage get error:', e);
                return defaultValue;
            }
        },
        
        remove: function(key) {
            localStorage.removeItem(this.prefix + key);
        },
        
        clear: function() {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
        }
    },
    
    // Voice handling
    Voice: {
        recognition: null,
        synthesis: window.speechSynthesis,
        isListening: false,
        
        setup: function() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                console.warn('Speech recognition not supported');
                return;
            }
            
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                JARVIS.processInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                JARVIS.speak("I didn't catch that. Could you please repeat?");
                this.isListening = false;
                JARVIS.updateUIState();
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                JARVIS.updateUIState();
            };
        },
        
        start: function() {
            if (!this.recognition) {
                JARVIS.showNotification('Voice recognition not available', 'error');
                return;
            }
            
            try {
                this.isListening = true;
                this.recognition.start();
                JARVIS.updateUIState();
                console.log('Listening...');
            } catch (e) {
                console.error('Voice start error:', e);
            }
        },
        
        stop: function() {
            if (this.recognition) {
                this.recognition.stop();
                this.isListening = false;
                JARVIS.updateUIState();
            }
        },
        
        speak: function(text) {
            if (!this.synthesis) return;
            
            // Cancel any ongoing speech
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            // Try to use a good English voice
            const voices = this.synthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google US English')) ||
                                  voices.find(v => v.name.includes('Samantha')) ||
                                  voices.find(v => v.lang === 'en-US');
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            this.synthesis.speak(utterance);
        }
    },
    
    // Input processing
    processInput: function(input) {
        console.log('Processing input:', input);
        this.state.lastActivity = Date.now();
        
        // Add to conversation history
        this.state.conversationHistory.push({
            type: 'user',
            text: input,
            timestamp: Date.now()
        });
        
        // Trim history if too long
        if (this.state.conversationHistory.length > 50) {
            this.state.conversationHistory.shift();
        }
        
        // Parse intent
        const intent = this.parseIntent(input);
        const response = this.generateResponse(intent, input);
        
        // Display and speak response
        this.displayResponse(response);
        if (this.state.voiceEnabled) {
            this.Voice.speak(response);
        }
        
        // Save to history
        this.state.conversationHistory.push({
            type: 'jarvis',
            text: response,
            timestamp: Date.now()
        });
        
        // Trigger specific features based on intent
        this.executeFeature(intent, input);
    },
    
    // Intent parsing
    parseIntent: function(input) {
        const lower = input.toLowerCase();
        
        // Greetings
        if (/\b(hello|hi|hey|greetings|good morning|good afternoon|good evening)\b/.test(lower)) {
            return 'greeting';
        }
        
        // Help
        if (/\b(help|what can you do|capabilities|features|assist me)\b/.test(lower)) {
            return 'help';
        }
        
        // Weather
        if (/\b(weather|temperature|forecast|rain|sunny|cloudy)\b/.test(lower)) {
            return 'weather';
        }
        
        // Time
        if (/\b(time|date|clock|hour|minute|day|month|year)\b/.test(lower)) {
            return 'time';
        }
        
        // Calculations
        if (/[\d+\-*/=]/.test(lower) && /\b(calculate|compute|math|add|subtract|multiply|divide|sum|equals|what is)\b/.test(lower)) {
            return 'calculation';
        }
        
        // Notes
        if (/\b(note|remember|save|write down|record|store)\b/.test(lower)) {
            return 'note';
        }
        
        // Reminders
        if (/\b(remind|reminder|alarm|timer|alert|notify)\b/.test(lower)) {
            return 'reminder';
        }
        
        // Goodbye
        if (/\b(bye|goodbye|exit|quit|close|shut down|sleep)\b/.test(lower)) {
            return 'goodbye';
        }
        
        // Jokes
        if (/\b(joke|funny|humor|laugh|amuse|entertain)\b/.test(lower)) {
            return 'humor';
        }
        
        // Name/Personal
        if (/\b(name|who are you|what are you|call you|your name)\b/.test(lower)) {
            return 'personal';
        }
        
        // Technical/Status
        if (/\b(status|how are you|systems|working|operational|diagnostics)\b/.test(lower)) {
            return 'technical';
        }
        
        return 'general';
    },
    
    // Response generation
    generateResponse: function(intent, input) {
        const responses = FALLBACK_RESPONSES[intent] || FALLBACK_RESPONSES.general;
        
        // Get random response from appropriate category
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Special handling for specific intents
        switch(intent) {
            case 'time':
                const now = new Date();
                return `The current time is ${now.toLocaleTimeString()}, and today is ${now.toLocaleDateString()}.`;
                
            case 'calculation':
                try {
                    // Extract math expression
                    const clean = input.replace(/[^0-9+\-*/().\s]/g, '').trim();
                    if (clean) {
                        // Safe evaluation
                        const result = Function('"use strict"; return (' + clean + ')')();
                        return `The result of ${clean} is ${result}.`;
                    }
                } catch (e) {
                    return "I couldn't calculate that. Could you provide a valid mathematical expression?";
                }
                break;
                
            case 'weather':
                return "I don't have access to real-time weather data in this demo version. In a full implementation, I would fetch current weather conditions for your location.";
        }
        
        return response;
    },
    
    // Feature execution
    executeFeature: function(intent, input) {
        switch(intent) {
            case 'note':
                this.Features.Notes.create(input.replace(/\b(note|remember|save|write down|record|store)\b/gi, '').trim());
                break;
            case 'reminder':
                this.Features.Reminders.parseAndCreate(input);
                break;
            case 'calculation':
                // Already handled in response generation
                break;
        }
    },
    
    // Display response in UI
    displayResponse: function(text) {
        const outputArea = document.getElementById('output-area');
        const chatContainer = document.getElementById('chat-container');
        
        if (chatContainer) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message jarvis-message';
            messageDiv.innerHTML = `
                <div class="avatar">J</div>
                <div class="text">${text}</div>
                <div class="timestamp">${new Date().toLocaleTimeString()}</div>
            `;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        } else if (outputArea) {
            outputArea.textContent = text;
        }
    },
    
    // Speak wrapper
    speak: function(text) {
        if (this.state.voiceEnabled) {
            this.Voice.speak(text);
        }
    },
    
    // UI State management
    updateUIState: function() {
        const micButton = document.getElementById('mic-button');
        const statusIndicator = document.getElementById('status-indicator');
        
        if (micButton) {
            micButton.classList.toggle('listening', this.Voice.isListening);
        }
        
        if (statusIndicator) {
            statusIndicator.textContent = this.Voice.isListening ? 'Listening...' : 'Ready';
            statusIndicator.className = this.Voice.isListening ? 'status-listening' : 'status-ready';
        }
    },
    
    // Feature modules
    Features: {
        currentApp: 'home',
        
        Notes: {
            notes: [],
            
            init: function() {
                this.notes = JARVIS.Storage.get('notes', []);
            },
            
            create: function(content) {
                if (!content.trim()) return;
                
                const note = {
                    id: Date.now(),
                    content: content,
                    created: new Date().toISOString(),
                    tags: []
                };
                
                this.notes.unshift(note);
                JARVIS.Storage.set('notes', this.notes);
                
                JARVIS.speak("Note saved successfully.");
                JARVIS.showNotification('Note saved', 'success');
                
                if (JARVIS.Features.currentApp === 'notes') {
                    this.render();
                }
            },
            
            delete: function(id) {
                this.notes = this.notes.filter(n => n.id !== id);
                JARVIS.Storage.set('notes', this.notes);
                this.render();
            },
            
            render: function() {
                const container = document.getElementById('notes-list');
                if (!container) return;
                
                container.innerHTML = this.notes.map(note => `
                    <div class="note-item" data-id="${note.id}">
                        <div class="note-content">${note.content}</div>
                        <div class="note-meta">${new Date(note.created).toLocaleString()}</div>
                        <button onclick="JARVIS.Features.Notes.delete(${note.id})" class="btn-delete">Delete</button>
                    </div>
                `).join('');
            },
            
            search: function(query) {
                return this.notes.filter(n => 
                    n.content.toLowerCase().includes(query.toLowerCase())
                );
            }
        },
        
        Reminders: {
            reminders: [],
            
            init: function() {
                this.reminders = JARVIS.Storage.get('reminders', []);
                this.checkDue();
            },
            
            parseAndCreate: function(input) {
                // Simple parsing for "remind me to [task] at [time]" or "remind me in [duration]"
                const taskMatch = input.match(/remind me to (.+?)(?:at|in|on|$)/i);
                const timeMatch = input.match(/(?:at|in|on) (.+)$/i);
                
                if (taskMatch) {
                    const task = taskMatch[1].trim();
                    let dueDate = new Date();
                    
                    if (timeMatch) {
                        const timeStr = timeMatch[1].trim();
                        // Try to parse time
                        const parsed = Date.parse(timeStr);
                        if (!isNaN(parsed)) {
                            dueDate = new Date(parsed);
                        } else {
                            // Handle relative time like "5 minutes", "1 hour"
                            const mins = timeStr.match(/(\d+)\s*minute/i);
                            const hours = timeStr.match(/(\d+)\s*hour/i);
                            
                            if (mins) dueDate.setMinutes(dueDate.getMinutes() + parseInt(mins[1]));
                            if (hours) dueDate.setHours(dueDate.getHours() + parseInt(hours[1]));
                        }
                    } else {
                        // Default to 1 hour
                        dueDate.setHours(dueDate.getHours() + 1);
                    }
                    
                    this.create(task, dueDate);
                } else {
                    JARVIS.speak("I didn't understand the reminder format. Try saying 'remind me to call John at 3 PM'.");
                }
            },
            
            create: function(task, dueDate) {
                const reminder = {
                    id: Date.now(),
                    task: task,
                    due: dueDate.toISOString(),
                    completed: false
                };
                
                this.reminders.push(reminder);
                JARVIS.Storage.set('reminders', this.reminders);
                
                const timeStr = dueDate.toLocaleTimeString();
                JARVIS.speak(`Reminder set for ${timeStr}: ${task}`);
                JARVIS.showNotification('Reminder set', 'success');
            },
            
            checkDue: function() {
                const now = new Date();
                const due = this.reminders.filter(r => !r.completed && new Date(r.due) <= now);
                
                due.forEach(r => {
                    JARVIS.speak(`Reminder: ${r.task}`);
                    JARVIS.showNotification(`Due: ${r.task}`, 'warning');
                    r.completed = true;
                });
                
                if (due.length > 0) {
                    JARVIS.Storage.set('reminders', this.reminders);
                }
            },
            
            render: function() {
                const container = document.getElementById('reminders-list');
                if (!container) return;
                
                const sorted = this.reminders.sort((a, b) => new Date(a.due) - new Date(b.due));
                
                container.innerHTML = sorted.map(r => `
                    <div class="reminder-item ${r.completed ? 'completed' : ''}" data-id="${r.id}">
                        <div class="reminder-task">${r.task}</div>
                        <div class="reminder-due">${new Date(r.due).toLocaleString()}</div>
                        <button onclick="JARVIS.Features.Reminders.complete(${r.id})" class="btn-complete">
                            ${r.completed ? 'Completed' : 'Mark Done'}
                        </button>
                    </div>
                `).join('');
            },
            
            complete: function(id) {
                const r = this.reminders.find(x => x.id === id);
                if (r) {
                    r.completed = !r.completed;
                    JARVIS.Storage.set('reminders', this.reminders);
                    this.render();
                }
            }
        },
        
        Calculator: {
            calculate: function(expression) {
                try {
                    // Safe math evaluation
                    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
                    return Function('"use strict"; return (' + sanitized + ')')();
                } catch (e) {
                    return null;
                }
            }
        },
        
        Weather: {
            // Placeholder for weather API integration
            fetch: function(location) {
                // In real implementation, this would call a weather API
                return {
                    location: location,
                    temperature: '72°F',
                    condition: 'Sunny',
                    humidity: '45%'
                };
            }
        }
    },
    
    // UI Helpers
    showNotification: function(message, type = 'info') {
        const container = document.getElementById('notification-container') || document.body;
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = message;
        
        container.appendChild(notif);
        
        setTimeout(() => {
            notif.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    },
    
    hideSplash: function() {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        
        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => splash.style.display = 'none', 500);
        }
        
        if (app) {
            app.classList.remove('hidden');
        }
    },
    
    loadPreferences: function() {
        const prefs = this.Storage.get('preferences', {});
        this.state.userPreferences = prefs;
        this.state.darkMode = prefs.darkMode || false;
        
        if (this.state.darkMode) {
            document.body.classList.add('dark-mode');
        }
    },
    
    savePreferences: function() {
        this.Storage.set('preferences', this.state.userPreferences);
    },
    
    toggleDarkMode: function() {
        this.state.darkMode = !this.state.darkMode;
        this.state.userPreferences.darkMode = this.state.darkMode;
        document.body.classList.toggle('dark-mode', this.state.darkMode);
        this.savePreferences();
    },
    
    // Navigation
    navigateTo: function(app) {
        this.Features.currentApp = app;
        
        // Hide all app sections
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        const target = document.getElementById(`app-${app}`);
        if (target) {
            target.classList.remove('hidden');
        }
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.app === app);
        });
        
        // Initialize specific features
        if (app === 'notes') {
            this.Features.Notes.init();
            this.Features.Notes.render();
        } else if (app === 'reminders') {
            this.Features.Reminders.init();
            this.Features.Reminders.render();
        }
        
        this.state.lastActivity = Date.now();
    }
};

// Event Listeners Setup
function setupEventListeners() {
    // Microphone button
    const micButton = document.getElementById('mic-button');
    if (micButton) {
        micButton.addEventListener('click', () => {
            if (JARVIS.Voice.isListening) {
                JARVIS.Voice.stop();
            } else {
                JARVIS.Voice.start();
            }
        });
    }
    
    // Text input
    const textInput = document.getElementById('text-input');
    const sendButton = document.getElementById('send-button');
    
    if (textInput && sendButton) {
        sendButton.addEventListener('click', () => {
            const value = textInput.value.trim();
            if (value) {
                JARVIS.processInput(value);
                textInput.value = '';
            }
        });
        
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });
    }
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const app = item.dataset.app;
            if (app) {
                JARVIS.navigateTo(app);
            }
        });
    });
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            JARVIS.toggleDarkMode();
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            textInput?.focus();
        }
        
        // Escape to stop listening
        if (e.key === 'Escape') {
            if (JARVIS.Voice.isListening) {
                JARVIS.Voice.stop();
            }
        }
        
        // Space to toggle voice (when not typing)
        if (e.code === 'Space' && document.activeElement !== textInput) {
            e.preventDefault();
            micButton?.click();
        }
    });
    
    // Window focus/blur
    window.addEventListener('focus', () => {
        console.log('Window focused');
    });
    
    window.addEventListener('blur', () => {
        if (JARVIS.Voice.isListening) {
            JARVIS.Voice.stop();
        }
    });
    
    // Before unload - save state
    window.addEventListener('beforeunload', () => {
        JARVIS.Storage.set('lastSession', {
            timestamp: Date.now(),
            conversationHistory: JARVIS.state.conversationHistory.slice(-10)
        });
    });
}

// Restore UI State
function restoreUIState() {
    // Restore last app
    const lastApp = JARVIS.Storage.get('lastApp', 'home');
    JARVIS.navigateTo(lastApp);
    
    // Restore conversation history display
    const history = JARVIS.state.conversationHistory;
    const chatContainer = document.getElementById('chat-container');
    
    if (chatContainer && history.length > 0) {
        history.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.type}-message`;
            div.innerHTML = `
                <div class="avatar">${msg.type === 'jarvis' ? 'J' : 'U'}</div>
                <div class="text">${msg.text}</div>
                <div class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</div>
            `;
            chatContainer.appendChild(div);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Utility functions
function debounce(func, wait) {
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

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export for global access
window.JARVIS = JARVIS;
window.FALLBACK_RESPONSES = FALLBACK_RESPONSES;
