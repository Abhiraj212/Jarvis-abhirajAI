// ============================================
// J.A.R.V.I.S. CORE SYSTEM
// Brain + Memory + Intent + Learning + Emotion + Reply
// NO ES MODULES - GLOBAL WINDOW OBJECT
// ============================================

(function() {
    'use strict';

    // ============================================
    // EVENT EMITTER UTILITY
    // ============================================
    function EventEmitter() {
        this.events = {};
    }
    
    EventEmitter.prototype.on = function(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
        return function() { this.off(event, listener); }.bind(this);
    };
    
    EventEmitter.prototype.off = function(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(function(l) { return l !== listener; });
    };
    
    EventEmitter.prototype.emit = function(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(function(listener) {
            try { listener(data); } catch(e) { console.error(e); }
        });
    };

    // ============================================
    // MEMORY MANAGER
    // ============================================
    function MemoryManager(config) {
        this.config = config || {};
        this.db = null;
        this.cache = new Map();
        this.index = new Map();
        this.compressionDict = new Map();
    }

    MemoryManager.prototype.initialize = async function() {
        this.db = await this.openDatabase();
        await this.loadIndexes();
        await this.performMaintenance();
    };

    MemoryManager.prototype.openDatabase = function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            var request = indexedDB.open('JarvisMemory', 1);
            
            request.onerror = function() { reject(request.error); };
            request.onsuccess = function() { resolve(request.result); };
            
            request.onupgradeneeded = function(event) {
                var db = event.target.result;
                
                if (!db.objectStoreNames.contains('facts')) {
                    var factStore = db.createObjectStore('facts', { keyPath: 'id', autoIncrement: true });
                    factStore.createIndex('topic', 'topic', { unique: false });
                    factStore.createIndex('timestamp', 'timestamp', { unique: false });
                    factStore.createIndex('confidence', 'confidence', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('conversations')) {
                    var convStore = db.createObjectStore('conversations', { keyPath: 'id', autoIncrement: true });
                    convStore.createIndex('session', 'sessionId', { unique: false });
                    convStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('embeddings')) {
                    db.createObjectStore('embeddings', { keyPath: 'factId' });
                }
            };
        });
    };

    MemoryManager.prototype.setFact = async function(key, value, metadata) {
        metadata = metadata || {};
        var fact = {
            topic: key,
            value: this.compress(value),
            confidence: metadata.confidence || 1.0,
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now(),
            source: metadata.source || 'user',
            tags: metadata.tags || []
        };

        var existing = await this.getFactRaw(key);
        if (existing) {
            fact.confidence = this.blendConfidence(existing.confidence, fact.confidence);
            fact.id = existing.id;
        }

        await this.saveToStore('facts', fact);
        this.updateIndex(key, fact);
        return fact;
    };

    MemoryManager.prototype.getFact = async function(key) {
        var fact = await this.getFactRaw(key);
        if (!fact) return null;
        
        fact.accessCount++;
        fact.lastAccessed = Date.now();
        await this.saveToStore('facts', fact);
        
        return this.decompress(fact.value);
    };

    MemoryManager.prototype.getFactRaw = function(key) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var transaction = self.db.transaction(['facts'], 'readonly');
            var store = transaction.objectStore('facts');
            var index = store.index('topic');
            
            var request = index.get(key);
            request.onsuccess = function() { resolve(request.result); };
            request.onerror = function() { reject(request.error); };
        });
    };

    MemoryManager.prototype.search = async function(query, options) {
        options = options || {};
        var limit = options.limit || 10;
        var minConfidence = options.minConfidence || 0.5;
        
        var results = [];
        var queryLower = query.toLowerCase();
        
        for (var entry of this.index) {
            var key = entry[0];
            var fact = entry[1];
            if (key.includes(queryLower) && fact.confidence >= minConfidence) {
                results.push({
                    key: key,
                    value: this.decompress(fact.value),
                    confidence: fact.confidence,
                    timestamp: fact.timestamp
                });
            }
        }
        
        results.sort(function(a, b) {
            var scoreA = a.confidence * (1 + (a.timestamp / Date.now()));
            var scoreB = b.confidence * (1 + (b.timestamp / Date.now()));
            return scoreB - scoreA;
        });
        
        return results.slice(0, limit);
    };

    MemoryManager.prototype.saveConversation = async function(message, sessionId) {
        var conversation = {
            sessionId: sessionId,
            role: message.role,
            content: this.compress(message.content),
            timestamp: Date.now(),
            emotion: message.emotion,
            intent: message.intent
        };
        await this.saveToStore('conversations', conversation);
    };

    MemoryManager.prototype.compress = function(data) {
        if (typeof data !== 'string') data = JSON.stringify(data);
        return data;
    };

    MemoryManager.prototype.decompress = function(data) {
        try { return JSON.parse(data); } catch { return data; }
    };

    MemoryManager.prototype.blendConfidence = function(oldConf, newConf) {
        return (oldConf * 0.7) + (newConf * 0.3);
    };

    MemoryManager.prototype.saveToStore = function(storeName, data) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var transaction = self.db.transaction([storeName], 'readwrite');
            var store = transaction.objectStore(storeName);
            var request = store.put(data);
            request.onsuccess = function() { resolve(request.result); };
            request.onerror = function() { reject(request.error); };
        });
    };

    MemoryManager.prototype.updateIndex = function(key, fact) {
        this.index.set(key.toLowerCase(), fact);
    };

    MemoryManager.prototype.loadIndexes = async function() {
        var self = this;
        var transaction = this.db.transaction(['facts'], 'readonly');
        var store = transaction.objectStore('facts');
        var request = store.openCursor();
        
        return new Promise(function(resolve, reject) {
            request.onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {
                    self.updateIndex(cursor.value.topic, cursor.value);
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = function() { reject(request.error); };
        });
    };

    MemoryManager.prototype.performMaintenance = async function() {
        var cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
        var transaction = this.db.transaction(['facts'], 'readwrite');
        var store = transaction.objectStore('facts');
        var index = store.index('timestamp');
        var range = IDBKeyRange.upperBound(cutoff);
        
        var request = index.openCursor(range);
        request.onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                var fact = cursor.value;
                if (fact.confidence < 0.3 && fact.accessCount < 5) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };
    };

    MemoryManager.prototype.getStats = function() {
        return {
            facts: this.index.size,
            preferences: 0,
            conversations: 0
        };
    };

    MemoryManager.prototype.getPreferences = function() {
        var prefs = localStorage.getItem('jarvis_prefs');
        return prefs ? JSON.parse(prefs) : {};
    };

    MemoryManager.prototype.setPreference = function(key, value) {
        var prefs = this.getPreferences();
        prefs[key] = value;
        localStorage.setItem('jarvis_prefs', JSON.stringify(prefs));
    };

    MemoryManager.prototype.save = function() {
        console.log('Memory state saved');
    };

    MemoryManager.prototype.saveSession = function(context) {
        localStorage.setItem('jarvis_last_session', JSON.stringify({
            timestamp: Date.now(),
            context: context
        }));
    };

    MemoryManager.prototype.clear = function() {
        var stores = ['facts', 'conversations', 'embeddings'];
        var self = this;
        stores.forEach(function(storeName) {
            var transaction = self.db.transaction([storeName], 'readwrite');
            var store = transaction.objectStore(storeName);
            store.clear();
        });
        this.index.clear();
    };

    // ============================================
    // EMOTIONAL CORE
    // ============================================
    function EmotionalCore(config) {
        this.config = config || {};
        this.state = {
            current: config.baseline || 'neutral',
            intensity: 0.5,
            dimensions: {
                joy: 0.5, sadness: 0.5, anger: 0.5,
                fear: 0.5, surprise: 0.5, trust: 0.5
            },
            valence: 0,
            arousal: 0.5
        };
        this.history = [];
        this.maxHistory = 100;
    }

    EmotionalCore.prototype.analyze = function(text) {
        var emotions = this.detectEmotions(text);
        this.updateDimensions(emotions);
        this.calculateValenceArousal();
        
        var dominant = this.getDominantEmotion();
        this.state.current = dominant.emotion;
        this.state.intensity = dominant.intensity;
        
        this.recordState();
        return Object.assign({}, this.state);
    };

    EmotionalCore.prototype.detectEmotions = function(text) {
        var emotionKeywords = {
            joy: ['happy', 'great', 'awesome', 'love', 'perfect', 'excellent', 'good', 'joy', 'wonderful'],
            sadness: ['sad', 'sorry', 'unfortunate', 'bad', 'terrible', 'awful', 'miss', 'loss', 'cry'],
            anger: ['angry', 'mad', 'furious', 'hate', 'annoying', 'stupid', 'wrong', 'frustrated'],
            fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'terrified', 'panic'],
            surprise: ['wow', 'amazing', 'unexpected', 'surprised', 'shocked', 'incredible'],
            trust: ['trust', 'believe', 'confident', 'sure', 'certain', 'reliable', 'honest']
        };

        var detected = {};
        var words = text.toLowerCase().split(/\s+/);
        
        for (var emotion in emotionKeywords) {
            var keywords = emotionKeywords[emotion];
            var count = words.filter(function(w) {
                return keywords.some(function(k) { return w.includes(k); });
            }).length;
            detected[emotion] = Math.min(count / 3, 1);
        }

        if (text.match(/\b(not|no|never|don't|doesn't|didn't|isn't|aren't)\b/)) {
            for (var key in detected) {
                detected[key] *= 0.5;
            }
        }

        return detected;
    };

    EmotionalCore.prototype.updateDimensions = function(detected) {
        for (var emotion in detected) {
            var value = detected[emotion];
            var current = this.state.dimensions[emotion];
            this.state.dimensions[emotion] = current + (value - current) * this.config.volatility;
        }
    };

    EmotionalCore.prototype.calculateValenceArousal = function() {
        this.state.valence = (
            this.state.dimensions.joy + 
            this.state.dimensions.trust - 
            this.state.dimensions.anger - 
            this.state.dimensions.sadness
        ) / 2;

        this.state.arousal = (
            this.state.dimensions.anger + 
            this.state.dimensions.fear + 
            this.state.dimensions.surprise - 
            this.state.dimensions.sadness + 1
        ) / 2;
    };

    EmotionalCore.prototype.getDominantEmotion = function() {
        var maxEmotion = 'neutral';
        var maxValue = 0.3;

        for (var emotion in this.state.dimensions) {
            var value = this.state.dimensions[emotion];
            if (value > maxValue) {
                maxValue = value;
                maxEmotion = emotion;
            }
        }

        return { emotion: maxEmotion, intensity: maxValue };
    };

    EmotionalCore.prototype.updateFromInteraction = function(response) {
        if (response.metadata && response.metadata.error) {
            this.state.dimensions.sadness += 0.1;
        } else if (response.metadata && response.metadata.helpful) {
            this.state.dimensions.joy += 0.1;
        }
        this.normalizeDimensions();
    };

    EmotionalCore.prototype.decay = function() {
        for (var key in this.state.dimensions) {
            var baseline = 0.5;
            var current = this.state.dimensions[key];
            this.state.dimensions[key] = current + (baseline - current) * 0.05;
        }
        this.calculateValenceArousal();
    };

    EmotionalCore.prototype.normalizeDimensions = function() {
        for (var key in this.state.dimensions) {
            this.state.dimensions[key] = Math.max(0, Math.min(1, this.state.dimensions[key]));
        }
    };

    EmotionalCore.prototype.recordState = function() {
        this.history.push({
            timestamp: Date.now(),
            state: Object.assign({}, this.state)
        });
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    };

    EmotionalCore.prototype.getState = function() {
        var emojiMap = {
            joy: '😄', sadness: '😢', anger: '😠', fear: '😨', 
            surprise: '😲', trust: '🤝', neutral: '😐'
        };
        
        return Object.assign({}, this.state, {
            emoji: emojiMap[this.state.current] || '😐'
        });
    };

    // ============================================
    // INTENT PROCESSOR
    // ============================================
    function IntentProcessor(config) {
        this.config = config || {};
        this.intentPatterns = this.initializePatterns();
        this.entityExtractors = this.initializeEntityExtractors();
        this.confidenceThreshold = config.confidenceThreshold || 0.7;
    }

    IntentProcessor.prototype.initializePatterns = function() {
        return {
            GREETING: {
                patterns: [
                    /\b(hello|hi|hey|greetings|good\s+(morning|afternoon|evening)|what'?s\s+up|howdy)\b/i,
                    /^jarvis$/i
                ],
                confidence: 0.9,
                requiresContext: false
            },
            FAREWELL: {
                patterns: [/\b(bye|goodbye|see\s+you|later|cya)\b/i],
                confidence: 0.9
            },
            QUESTION: {
                patterns: [
                    /\b(what|who|where|when|why|how|which|whose|whom)\b/i,
                    /\?$/,
                    /\b(can\s+you|could\s+you|would\s+you)\s+tell\s+me\b/i
                ],
                confidence: 0.8,
                subIntents: ['DEFINITION', 'FACT', 'OPINION', 'PROCEDURE']
            },
            MEMORY_STORE: {
                patterns: [
                    /\b(remember|save|store|note|don't\s+forget|keep\s+in\s+mind)\b/i,
                    /\b(my\s+\w+\s+is|i\s+(like|love|hate|prefer))\b/i
                ],
                confidence: 0.9,
                entities: ['topic', 'value']
            },
            MEMORY_RECALL: {
                patterns: [
                    /\b(what\s+(is|was|did)|do\s+you\s+remember|tell\s+me\s+about|recall|retrieve)\b/i,
                    /\b(what\s+do\s+i|what\s+did\s+i|remind\s+me)\b/i
                ],
                confidence: 0.85,
                entities: ['topic']
            },
            SEARCH: {
                patterns: [
                    /\b(search|google|look\s+up|find|lookup|research)\b/i,
                    /\b(latest\s+news|what'?s\s+new|current\s+events)\b/i,
                    /\b(weather|forecast|temperature)\b/i
                ],
                confidence: 0.8,
                requiresInternet: true
            },
            CALCULATION: {
                patterns: [
                    /\b(calculate|compute|what\s+is|how\s+much|solve|math)\b/i,
                    /[\d+\-*/=]+/,
                    /\b(plus|minus|times|divided\s+by|square\s+root|power\s+of)\b/i
                ],
                confidence: 0.9
            },
            TASK: {
                patterns: [
                    /\b(add|create)\s+(a\s+)?(task|todo|reminder)/i,
                    /\b(remind\s+me\s+to)\b/i,
                    /\b(what\s+are\s+my\s+tasks|show\s+my\s+list)\b/i
                ],
                confidence: 0.9
            },
            CORRECTION: {
                patterns: [
                    /\b(wrong|incorrect|that's\s+not|not\s+right|bad|terrible)\b/i,
                    /\b(i\s+said|meant|actually)\b/i
                ],
                confidence: 0.85,
                isCorrection: true
            }
        };
    };

    IntentProcessor.prototype.initializeEntityExtractors = function() {
        var self = this;
        return {
            topic: function(text) {
                var match = text.match(/(?:about|is|was|my)\s+(\w+(?:\s+\w+){0,3})/i);
                return match ? match[1].trim() : null;
            },
            value: function(text) {
                var match = text.match(/(?:is|are|was|were|=)\s+(.+?)(?:\.|$)/i);
                return match ? match[1].trim() : null;
            },
            datetime: function(text) {
                var patterns = [
                    /\b(at|on)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
                    /\b(tomorrow|today|tonight|morning|evening|afternoon)\b/i,
                    /\b(in\s+(\d+)\s+(minutes?|hours?|days?))\b/i
                ];
                
                for (var i = 0; i < patterns.length; i++) {
                    var match = text.match(patterns[i]);
                    if (match) return match[0];
                }
                return null;
            }
        };
    };

    IntentProcessor.prototype.recognize = async function(input, context) {
        var results = [];
        
        for (var intentName in this.intentPatterns) {
            var config = this.intentPatterns[intentName];
            var match = this.matchIntent(input, config);
            if (match.matched) {
                results.push({
                    intent: intentName,
                    confidence: match.confidence,
                    entities: this.extractEntities(input, config.entities),
                    requiresInternet: config.requiresInternet || false,
                    requiresAction: config.requiresAction || false,
                    isCorrection: config.isCorrection || false
                });
            }
        }

        results.sort(function(a, b) { return b.confidence - a.confidence; });

        var bestMatch = results[0] || {
            intent: 'UNKNOWN',
            confidence: 0.5,
            entities: {}
        };

        if (this.config.useContext && context) {
            bestMatch = this.applyContextBoost(bestMatch, context);
        }

        if (bestMatch.confidence < this.confidenceThreshold) {
            bestMatch.intent = 'UNKNOWN';
        }

        return bestMatch;
    };

    IntentProcessor.prototype.matchIntent = function(input, config) {
        var maxConfidence = 0;
        var matched = false;

        for (var i = 0; i < config.patterns.length; i++) {
            var pattern = config.patterns[i];
            if (pattern.test(input)) {
                matched = true;
                var match = input.match(pattern);
                var coverage = match[0].length / input.length;
                var confidence = config.confidence * (0.5 + coverage * 0.5);
                maxConfidence = Math.max(maxConfidence, confidence);
            }
        }

        return { matched: matched, confidence: maxConfidence };
    };

    IntentProcessor.prototype.extractEntities = function(input, entityTypes) {
        var entities = {};
        entityTypes = entityTypes || [];
        
        for (var i = 0; i < entityTypes.length; i++) {
            var type = entityTypes[i];
            if (this.entityExtractors[type]) {
                var value = this.entityExtractors[type](input);
                if (value) entities[type] = value;
            }
        }

        entities.datetime = this.entityExtractors.datetime(input);
        return entities;
    };

    IntentProcessor.prototype.applyContextBoost = function(match, context) {
        if (context.recent && context.recent.length > 0) {
            var lastIntent = context.recent[context.recent.length - 1];
            var followUps = {
                'QUESTION': ['CONFIRMATION', 'NEGATION', 'QUESTION'],
                'GREETING': ['GREETING', 'QUESTION', 'COMMAND'],
                'MEMORY_STORE': ['CONFIRMATION']
            };

            if (followUps[lastIntent] && followUps[lastIntent].includes(match.intent)) {
                match.confidence = Math.min(1, match.confidence + 0.15);
            }
        }
        return match;
    };

    // ============================================
    // LEARNING ENGINE
    // ============================================
    function LearningEngine(config) {
        this.config = config || {};
        this.knowledgeBase = new Map();
        this.correctionQueue = [];
        this.learningPatterns = this.initializePatterns();
    }

    LearningEngine.prototype.initializePatterns = function() {
        return {
            factPattern: /\b(\w+(?:\s+\w+){0,5})\s+(?:is|are|was|were|means|refers\s+to)\s+(.+?)(?:\.|$)/i,
            preferencePattern: /\b(i\s+(?:like|love|prefer|hate|dislike)|my\s+favorite)\s+(.+?)(?:\.|$)/i
        };
    };

    LearningEngine.prototype.learnFromInteraction = function(interaction) {
        var facts = this.extractFacts(interaction.input);
        var self = this;
        
        facts.forEach(function(fact) {
            self.storeFact(fact, {
                source: 'conversation',
                confidence: self.calculateInitialConfidence(interaction.intent, interaction.context),
                context: interaction
            });
        });

        if (interaction.intent.isCorrection) {
            this.processCorrection(interaction);
        }

        this.updateUserModel(interaction);
    };

    LearningEngine.prototype.extractFacts = function(text) {
        var facts = [];
        
        for (var type in this.learningPatterns) {
            var pattern = this.learningPatterns[type];
            var match = text.match(pattern);
            if (match) {
                facts.push({
                    type: type,
                    subject: match[1].trim(),
                    predicate: match[2] ? match[2].trim() : null,
                    fullText: match[0]
                });
            }
        }

        return facts;
    };

    LearningEngine.prototype.storeFact = function(fact, metadata) {
        var key = fact.type + ':' + fact.subject;
        var existing = this.knowledgeBase.get(key);
        
        if (existing) {
            existing.confidence = this.blendConfidence(existing.confidence, metadata.confidence);
            existing.occurrences++;
            existing.lastUpdated = Date.now();
        } else {
            this.knowledgeBase.set(key, Object.assign({}, fact, metadata, {
                created: Date.now(),
                occurrences: 1,
                verified: false
            }));
        }
    };

    LearningEngine.prototype.calculateInitialConfidence = function(intent, context) {
        var confidence = 0.5;
        if (intent.intent === 'MEMORY_STORE') confidence += 0.3;
        if (context.emotion && context.emotion.dimensions && context.emotion.dimensions.trust > 0.7) confidence += 0.1;
        if (intent.confidence < 0.8) confidence -= 0.2;
        return Math.max(0, Math.min(1, confidence));
    };

    LearningEngine.prototype.blendConfidence = function(oldConf, newConf) {
        return (oldConf * 0.7) + (newConf * 0.3);
    };

    LearningEngine.prototype.processCorrection = function(interaction) {
        var recentFacts = this.getRecentFacts(5);
        this.correctionQueue.push({
            timestamp: Date.now(),
            originalContext: interaction.context,
            userInput: interaction.input
        });
        
        var self = this;
        recentFacts.forEach(function(fact) {
            fact.confidence *= 0.5;
        });
    };

    LearningEngine.prototype.updateUserModel = function(interaction) {
        var userModel = this.getUserModel();
        var hour = new Date().getHours();
        userModel.activeHours[hour] = (userModel.activeHours[hour] || 0) + 1;
        
        if (interaction.intent.entities && interaction.intent.entities.topic) {
            var topic = interaction.intent.entities.topic;
            userModel.interests[topic] = (userModel.interests[topic] || 0) + 1;
        }

        this.saveUserModel(userModel);
    };

    LearningEngine.prototype.getUserModel = function() {
        var stored = localStorage.getItem('jarvis_user_model');
        return stored ? JSON.parse(stored) : {
            activeHours: {},
            interests: {},
            communicationStyle: 'neutral',
            expertiseAreas: []
        };
    };

    LearningEngine.prototype.saveUserModel = function(model) {
        localStorage.setItem('jarvis_user_model', JSON.stringify(model));
    };

    LearningEngine.prototype.getRecentFacts = function(count) {
        var facts = Array.from(this.knowledgeBase.values());
        facts.sort(function(a, b) { return b.lastUpdated - a.lastUpdated; });
        return facts.slice(0, count);
    };

    // ============================================
    // RESPONSE GENERATOR
    // ============================================
    function ResponseGenerator(config) {
        this.config = config || {};
        this.responseTemplates = this.initializeTemplates();
        this.variationHistory = new Map();
        this.maxHistorySize = 5;
    }

    ResponseGenerator.prototype.initializeTemplates = function() {
        return {
            GREETING: {
                formal: [
                    "Good {time}, {name}. How may I assist you today?",
                    "Hello, {name}. Systems are operational and ready.",
                    "Greetings. I hope you're having a productive {time}."
                ],
                casual: [
                    "Hey {name}! What's up?",
                    "Hi there! Ready to help.",
                    "Hello! Great to see you again."
                ],
                enthusiastic: [
                    "Hello {name}! Ready for action! 🚀",
                    "Hey there! Full power and ready to assist! ⚡",
                    "Greetings! Let's make things happen! 💪"
                ]
            },
            FAREWELL: {
                formal: [
                    "Goodbye, {name}. Have a productive day.",
                    "Until next time. Take care.",
                    "Farewell. I'll be here when you need me."
                ],
                casual: ["See you later!", "Bye! Catch you soon.", "Take it easy!"]
            },
            UNKNOWN: {
                clarifying: [
                    "I'm not sure I understand. Could you rephrase that?",
                    "Could you provide more context about what you're looking for?",
                    "I want to make sure I help correctly. Can you elaborate?"
                ],
                learning: [
                    "I don't have information on that yet, but I'm learning.",
                    "That's new to me. Would you like to teach me about it?",
                    "I'm still expanding my knowledge base on that topic."
                ]
            },
            CONFIRMATION: {
                success: [
                    "Understood. I'll remember that.",
                    "Noted and stored in my memory banks.",
                    "Confirmed. I've updated my records."
                ]
            }
        };
    };

    ResponseGenerator.prototype.generate = async function(params) {
        var intent = params.intent;
        var context = params.context;
        var memories = params.memories;
        var emotion = params.emotion;
        var knowledge = params.knowledge;

        var response = '';
        var metadata = {};

        switch(intent.intent) {
            case 'GREETING':
                response = this.generateGreeting(context, emotion);
                break;
            case 'FAREWELL':
                response = this.generateFarewell(context);
                break;
            case 'QUESTION':
                response = await this.generateAnswer(intent, knowledge, memories);
                break;
            case 'MEMORY_STORE':
                response = this.generateConfirmation('success');
                metadata.stored = true;
                break;
            case 'MEMORY_RECALL':
                response = this.generateRecall(intent, memories);
                break;
            default:
                response = this.generateConversationalResponse(intent, context, emotion);
        }

        response = this.applyPersonality(response, this.config.personality);
        
        if (this.config.useEmojis && emotion.intensity > 0.7) {
            response = this.addEmotionalIndicator(response, emotion);
        }

        response = this.avoidRepetition(response, intent.intent);

        if (response.length > this.config.maxLength) {
            response = response.substring(0, this.config.maxLength) + '...';
        }

        return { text: response, metadata: metadata };
    };

    ResponseGenerator.prototype.generateGreeting = function(context, emotion) {
        var timeOfDay = this.getTimeOfDay();
        var tone = this.selectTone(emotion);
        var template = this.selectVariation('GREETING', tone);
        
        return this.fillTemplate(template, {
            time: timeOfDay,
            name: (context.preferences && context.preferences.userName) || 'Sir'
        });
    };

    ResponseGenerator.prototype.generateFarewell = function(context) {
        var tone = this.selectTone({ current: 'neutral' });
        var template = this.selectVariation('FAREWELL', tone);
        
        return this.fillTemplate(template, {
            name: (context.preferences && context.preferences.userName) || 'Sir'
        });
    };

    ResponseGenerator.prototype.generateAnswer = async function(intent, knowledge, memories) {
        if (knowledge) {
            return this.formatKnowledgeResponse(knowledge);
        }

        if (memories.facts && memories.facts.length > 0) {
            var fact = memories.facts[0];
            return 'According to my records, ' + fact.value + '. (Confidence: ' + Math.round(fact.confidence * 100) + '%)';
        }

        return this.selectVariation('UNKNOWN', 'clarifying');
    };

    ResponseGenerator.prototype.generateRecall = function(intent, memories) {
        var topic = intent.entities.topic;
        
        if (memories.facts.length > 0) {
            var fact = memories.facts[0];
            return 'I recall that ' + topic + ' is ' + fact.value + '.';
        }
        
        return 'I don\'t have any information stored about ' + topic + '. Would you like to tell me?';
    };

    ResponseGenerator.prototype.generateConversationalResponse = function(intent, context, emotion) {
        if (context.recent && context.recent.length > 0) {
            return "I see. Please tell me more about that.";
        }
        return "Interesting. How can I help you with this?";
    };

    ResponseGenerator.prototype.selectTone = function(emotion) {
        if (emotion.intensity > 0.8) return 'enthusiastic';
        if (emotion.intensity < 0.3) return 'formal';
        return 'casual';
    };

    ResponseGenerator.prototype.selectVariation = function(intentType, category) {
        var pool = (this.responseTemplates[intentType] && this.responseTemplates[intentType][category]) || 
                   this.responseTemplates[intentType] ||
                   ["I'm not sure how to respond to that."];
        
        var history = this.variationHistory.get(intentType) || [];
        var available = pool.filter(function(r) { return history.indexOf(r) === -1; });
        var selectionPool = available.length > 0 ? available : pool;
        
        var selected = selectionPool[Math.floor(Math.random() * selectionPool.length)];
        
        history.push(selected);
        if (history.length > this.maxHistorySize) history.shift();
        this.variationHistory.set(intentType, history);
        
        return selected;
    };

    ResponseGenerator.prototype.fillTemplate = function(template, variables) {
        return template.replace(/\{(\w+)\}/g, function(match, key) {
            return variables[key] !== undefined ? variables[key] : match;
        });
    };

    ResponseGenerator.prototype.applyPersonality = function(text, personality) {
        switch(personality) {
            case 'professional':
                return text.replace(/!/g, '.').replace(/🚀|⚡|💪/g, '');
            case 'friendly':
                return text.replace(/\bsir\b/gi, 'friend');
            case 'witty':
                return text + " (Not that you needed me to tell you that.)";
            default:
                return text;
        }
    };

    ResponseGenerator.prototype.addEmotionalIndicator = function(text, emotion) {
        var indicators = { joy: ' 😊', excitement: ' 🎉', surprise: ' 😮', concern: ' 🤔' };
        var indicator = indicators[emotion.current];
        return indicator ? text + indicator : text;
    };

    ResponseGenerator.prototype.avoidRepetition = function(text, intentType) {
        var recent = this.variationHistory.get('global') || [];
        if (recent.indexOf(text) !== -1) {
            return this.selectVariation(intentType, 'casual');
        }
        
        recent.push(text);
        if (recent.length > 10) recent.shift();
        this.variationHistory.set('global', recent);
        
        return text;
    };

    ResponseGenerator.prototype.formatKnowledgeResponse = function(knowledge) {
        if (Array.isArray(knowledge)) {
            return knowledge.map(function(k) { return '• ' + k; }).join('\n');
        }
        return String(knowledge);
    };

    ResponseGenerator.prototype.getTimeOfDay = function() {
        var hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    };

    // ============================================
    // JARVIS BRAIN (ORCHESTRATOR)
    // ============================================
    function JarvisBrain(config) {
        EventEmitter.call(this);
        this.config = config;
        this.processingQueue = [];
        this.isProcessing = false;
        this.contextWindow = [];
        this.maxContextLength = 20;
    }

    JarvisBrain.prototype = Object.create(EventEmitter.prototype);
    JarvisBrain.prototype.constructor = JarvisBrain;

    JarvisBrain.prototype.process = async function(input, context) {
        this.isProcessing = true;
        this.emit('status', 'PROCESSING');

        try {
            var normalizedInput = this.normalizeInput(input);
            this.updateContext(normalizedInput);
            
            var intent = await this.config.intent.recognize(normalizedInput, {
                context: this.contextWindow,
                emotion: context.emotion
            });

            var relevantMemories = await this.retrieveRelevantMemories(intent, normalizedInput);
            var emotionalContext = this.config.emotion.analyze(normalizedInput);
            
            var knowledge = null;
            if (intent.requiresKnowledge) {
                knowledge = await this.acquireKnowledge(intent);
            }

            var response = await this.config.response.generate({
                intent: intent,
                input: normalizedInput,
                context: this.contextWindow,
                memories: relevantMemories,
                emotion: emotionalContext,
                knowledge: knowledge,
                personality: this.config.personality
            });

            if (this.config.learning.config.autoLearn) {
                this.config.learning.learnFromInteraction({
                    input: normalizedInput,
                    intent: intent,
                    response: response.text,
                    context: emotionalContext
                });
            }

            this.finalizeProcessing(response);
            return response;

        } catch (error) {
            this.emit('error', error);
            return {
                text: "I apologize, but I'm having trouble processing that request.",
                metadata: { error: true }
            };
        } finally {
            this.isProcessing = false;
            this.emit('status', 'IDLE');
        }
    };

    JarvisBrain.prototype.normalizeInput = function(input) {
        return input
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s.,!?-]/g, '');
    };

    JarvisBrain.prototype.updateContext = function(input) {
        this.contextWindow.push(input);
        if (this.contextWindow.length > this.maxContextLength) {
            this.contextWindow.shift();
        }
    };

    JarvisBrain.prototype.retrieveRelevantMemories = async function(intent, input) {
        var memories = [];
        
        if (intent.entities.topic) {
            var topicMemories = await this.config.memory.search(intent.entities.topic);
            memories.push.apply(memories, topicMemories);
        }

        var prefs = await this.config.memory.getPreferences();
        var recentContext = this.contextWindow.slice(-5);
        
        return { facts: memories, preferences: prefs, recent: recentContext };
    };

    JarvisBrain.prototype.acquireKnowledge = async function(intent) {
        return this.config.memory.queryKnowledgeBase ? 
            this.config.memory.queryKnowledgeBase(intent.entities) : null;
    };

    JarvisBrain.prototype.finalizeProcessing = function(response) {
        this.emit('processingComplete', response);
        this.config.emotion.updateFromInteraction(response);
    };

    // ============================================
    // EXPOSE GLOBAL API
    // ============================================
    window.JarvisCore = {
        EventEmitter: EventEmitter,
        MemoryManager: MemoryManager,
        EmotionalCore: EmotionalCore,
        IntentProcessor: IntentProcessor,
        LearningEngine: LearningEngine,
        ResponseGenerator: ResponseGenerator,
        JarvisBrain: JarvisBrain,
        
        // Factory methods
        createBrain: function(config) { return new JarvisBrain(config); },
        createMemory: function(config) { return new MemoryManager(config); },
        createEmotion: function(config) { return new EmotionalCore(config); },
        createIntent: function(config) { return new IntentProcessor(config); },
        createLearning: function(config) { return new LearningEngine(config); },
        createResponse: function(config) { return new ResponseGenerator(config); }
    };

    console.log('✅ JarvisCore loaded');
})();
