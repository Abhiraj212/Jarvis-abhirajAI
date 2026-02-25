/**
 * J.A.R.V.I.S. Configuration File
 * API Keys, Model IDs, and System Settings
 * ============================================
 */

const JARVIS_CONFIG = {
    // Application Info
    APP_NAME: 'J.A.R.V.I.S.',
    APP_VERSION: '2.0.0',
    APP_BUILD: '2024.02.10',
    
    // ==========================================
    // AI MODEL CONFIGURATION
    // ==========================================
    
    AI: {
        // DEFAULT MODEL SETTINGS
        DEFAULT_MODEL: 'google/gemma-3-4b-it:free',
        
        // ADD YOUR CUSTOM MODEL IDs HERE
        MODELS: {
            // OpenRouter Models
            'google/gemma-3-4b-it:free': 'Gemma 3 4B Free',
            'openai/gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'openai/gpt-4': 'GPT-4',
            'anthropic/claude-3-sonnet': 'Claude 3 Sonnet',
            'anthropic/claude-3-opus': 'Claude 3 Opus',
            'meta-llama/llama-3-8b-instruct': 'Llama 3 8B',
            
            // Default fallback
            'default': 'JARVIS Local'
        },
        
        // CURRENT ACTIVE MODEL - Set to your preferred model
        CURRENT_MODEL: 'google/gemma-3-4b-it:free',
        
        // ==========================================
        // API CONFIGURATION
        // ==========================================
        
        API: {
            // ENABLE EXTERNAL API - Set to true to use AI
            USE_EXTERNAL_API: true,
            
            // API ENDPOINT URL - OpenRouter API
            ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
            
            // API KEY - HARDCODE YOUR KEY HERE
            KEY: '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',
            
            // REQUEST CONFIGURATION
            MAX_TOKENS: 2048,
            TEMPERATURE: 0.7,
            TOP_P: 0.9,
            FREQUENCY_PENALTY: 0,
            PRESENCE_PENALTY: 0,
            
            // TIMEOUT (milliseconds)
            TIMEOUT: 30000,
            
            // RETRY SETTINGS
            RETRY_ATTEMPTS: 3,
            RETRY_DELAY: 1000
        },
        
        // SYSTEM PROMPT
        SYSTEM_PROMPT: `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), an advanced AI assistant created to help the user with various tasks. You are professional, efficient, and occasionally witty. You have access to various tools including notes, reminders, calculator, and weather information. Always be helpful, accurate, and concise in your responses.`
    },
    
    // ==========================================
    // VOICE CONFIGURATION
    // ==========================================
    
    VOICE: {
        // SPEECH RECOGNITION
        RECOGNITION: {
            ENABLED: true,
            LANG: 'en-US',
            CONTINUOUS: false,
            INTERIM_RESULTS: true,
            MAX_ALTERNATIVES: 1
        },
        
        // TEXT TO SPEECH
        SYNTHESIS: {
            ENABLED: true,
            RATE: 1.0,
            PITCH: 1.0,
            VOLUME: 1.0,
            PREFERRED_VOICE: ''
        }
    },
    
    // ==========================================
    // EXTERNAL API KEYS
    // ==========================================
    
    APIS: {
        // WEATHER API
        WEATHER: {
            ENABLED: false,
            KEY: '',
            ENDPOINT: 'https://api.openweathermap.org/data/2.5',
            DEFAULT_CITY: 'New York',
            UNITS: 'metric'
        },
        
        // NEWS API
        NEWS: {
            ENABLED: false,
            KEY: '',
            ENDPOINT: 'https://newsapi.org/v2',
            DEFAULT_CATEGORY: 'technology',
            COUNTRY: 'us'
        },
        
        // SEARCH API
        SEARCH: {
            ENABLED: false,
            KEY: '',
            ENGINE_ID: '',
            ENDPOINT: ''
        },
        
        // CALENDAR API
        CALENDAR: {
            ENABLED: false,
            CLIENT_ID: '',
            API_KEY: '',
            DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            SCOPES: 'https://www.googleapis.com/auth/calendar.readonly'
        },
        
        // TRANSLATION API
        TRANSLATION: {
            ENABLED: false,
            KEY: '',
            ENDPOINT: ''
        }
    },
    
    // ==========================================
    // STORAGE CONFIGURATION
    // ==========================================
    
    STORAGE: {
        PREFIX: 'jarvis_',
        VERSION: 1,
        MAX_NOTES: 1000,
        MAX_REMINDERS: 500,
        MAX_HISTORY: 100,
        AUTO_SAVE_INTERVAL: 30000
    },
    
    // ==========================================
    // UI CONFIGURATION
    // ==========================================
    
    UI: {
        THEME: 'dark',
        ACCENT_COLOR: '#00d4ff',
        ANIMATIONS_ENABLED: true,
        SOUNDS_ENABLED: true,
        NOTIFICATION_DURATION: 5000,
        SPLASH_DURATION: 2000,
        DATE_FORMAT: 'en-US',
        TIME_FORMAT: '24h'
    },
    
    // ==========================================
    // FEATURE FLAGS
    // ==========================================
    
    FEATURES: {
        DASHBOARD: true,
        ASSISTANT: true,
        VOICE: true,
        NOTES: true,
        REMINDERS: true,
        CALCULATOR: true,
        CALENDAR: false,
        WEATHER: false,
        NEWS: false,
        SEARCH: false,
        MEMORY: true,
        SETTINGS: true
    },
    
    // ==========================================
    // DEBUG & DEVELOPMENT
    // ==========================================
    
    DEBUG: {
        ENABLED: false,
        LOG_LEVEL: 'info',
        MOCK_API: false,
        SHOW_BORDERS: false,
        PERFORMANCE_MONITORING: false
    }
};

// Freeze configuration to prevent accidental modifications
// Note: We don't freeze AI config so runtime updates work
Object.freeze(JARVIS_CONFIG);
Object.freeze(JARVIS_CONFIG.VOICE);
Object.freeze(JARVIS_CONFIG.VOICE.RECOGNITION);
Object.freeze(JARVIS_CONFIG.VOICE.SYNTHESIS);
Object.freeze(JARVIS_CONFIG.APIS);
Object.freeze(JARVIS_CONFIG.STORAGE);
Object.freeze(JARVIS_CONFIG.UI);
Object.freeze(JARVIS_CONFIG.FEATURES);
Object.freeze(JARVIS_CONFIG.DEBUG);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JARVIS_CONFIG;
}
