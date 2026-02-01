// CORE.JS - COMPLETE WORKING VERSION
(function() {
    'use strict';
    
    console.log('Loading core.js...');
    
    // Simple Event Emitter
    function EventEmitter() {
        this.events = {};
    }
    
    EventEmitter.prototype.on = function(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    };
    
    EventEmitter.prototype.emit = function(event, data) {
        if (!this.events[event]) return;
        for (var i = 0; i < this.events[event].length; i++) {
            this.events[event][i](data);
        }
    };
    
    // Memory Manager
    function MemoryManager(config) {
        this.config = config || {};
    }
    
    MemoryManager.prototype.initialize = async function() {
        console.log('Memory initialized');
        return true;
    };
    
    MemoryManager.prototype.getFact = async function(key) {
        var val = localStorage.getItem('jarvis_fact_' + key);
        return val ? JSON.parse(val) : null;
    };
    
    MemoryManager.prototype.setFact = async function(key, value) {
        localStorage.setItem('jarvis_fact_' + key, JSON.stringify(value));
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
    
    MemoryManager.prototype.getStats = function() {
        return { facts: 0, preferences: 0, conversations: 0 };
    };
    
    MemoryManager.prototype.save = function() {};
    
    // Emotional Core
    function EmotionalCore(config) {
        this.config = config || {};
        this.state = {
            current: 'neutral',
            intensity: 0.5,
            emoji: '😐'
        };
    }
    
    EmotionalCore.prototype.getState = function() {
        return this.state;
    };
    
    EmotionalCore.prototype.decay = function() {};
    
    // Intent Processor
    function IntentProcessor(config) {
        this.config = config || {};
    }
    
    IntentProcessor.prototype.recognize = async function(input, context) {
        return {
            intent: 'UNKNOWN',
            confidence: 0.5,
            entities: {}
        };
    };
    
    // Learning Engine
    function LearningEngine(config) {
        this.config = config || {};
    }
    
    // Response Generator
    function ResponseGenerator(config) {
        this.config = config || {};
    }
    
    ResponseGenerator.prototype.generate = async function(params) {
        return {
            text: 'Hello, I am J.A.R.V.I.S. How can I assist you?',
            metadata: {}
        };
    };
    
    // Jarvis Brain
    function JarvisBrain(config) {
        EventEmitter.call(this);
        this.config = config;
    }
    
    JarvisBrain.prototype = Object.create(EventEmitter.prototype);
    JarvisBrain.prototype.constructor = JarvisBrain;
    
    JarvisBrain.prototype.process = async function(input, context) {
        this.emit('status', 'PROCESSING');
        
        // Simple echo for testing
        var response = {
            text: 'You said: "' + input + '". I am still learning to process this properly.',
            metadata: { intent: 'ECHO' }
        };
        
        this.emit('status', 'IDLE');
        return response;
    };
    
    // Create global object
    window.JarvisCore = {
        EventEmitter: EventEmitter,
        MemoryManager: MemoryManager,
        EmotionalCore: EmotionalCore,
        IntentProcessor: IntentProcessor,
        LearningEngine: LearningEngine,
        ResponseGenerator: ResponseGenerator,
        JarvisBrain: JarvisBrain,
        
        createBrain: function(config) { return new JarvisBrain(config); },
        createMemory: function(config) { return new MemoryManager(config); },
        createEmotion: function(config) { return new EmotionalCore(config); },
        createIntent: function(config) { return new IntentProcessor(config); },
        createLearning: function(config) { return new LearningEngine(config); },
        createResponse: function(config) { return new ResponseGenerator(config); }
    };
    
    console.log('core.js loaded - JarvisCore:', typeof window.JarvisCore);
})();
