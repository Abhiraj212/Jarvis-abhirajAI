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
        DEFAULT_MODEL: 'default',
        
        // ADD YOUR CUSTOM MODEL IDs HERE
        // Format: 'model-id': 'Display Name'
        MODELS: {
            // OpenAI Models
            'gpt-4': 'GPT-4',
            'gpt-4-turbo': 'GPT-4 Turbo',
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            
            // Anthropic Models
            'claude-3-opus': 'Claude 3 Opus',
            'claude-3-sonnet': 'Claude 3 Sonnet',
            'claude-3-haiku': 'Claude 3 Haiku',
            
            // Google Models
            'gemini-pro': 'Gemini Pro',
            'gemini-ultra': 'Gemini Ultra',
            
            // Local/Custom Models
            // ADD YOUR CUSTOM MODEL ID HERE
            'CUSTOM_MODEL_ID_1': 'Custom Model 1',
            'CUSTOM_MODEL_ID_2': 'Custom Model 2',
            // END CUSTOM MODEL SECTION
            
            // Default fallback
            'default': 'JARVIS Local'
        },
        
        // CURRENT ACTIVE MODEL
        // Change this to switch models or use settings UI
        CURRENT_MODEL: 'default',
        
        // ==========================================
        // API CONFIGURATION
        // ==========================================
        
        API: {
            // ENABLE EXTERNAL API
            USE_EXTERNAL_API: false,
            
            // API ENDPOINT URL
            // ADD YOUR API URL HERE
            // Examples:
            // OpenAI: 'https://api.openai.com/v1/chat/completions'
            // Anthropic: 'https://api.anthropic.com/v1/messages'
            // Local: 'http://localhost:1234/v1/chat/completions'
            // Custom: 'https://your-api-endpoint.com/v1/chat'
            ENDPOINT: '',
            
            // API KEY
            // ADD YOUR API KEY HERE
            // Format: 'sk-...' for OpenAI
            // Format: 'your-key-here' for others
            // IMPORTANT: In production, use environment variables or secure storage
            KEY: '',
            
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
            // Preferred voice (leave empty for default)
            PREFERRED_VOICE: ''
        }
    },
    
    // ==========================================
    // EXTERNAL API KEYS
    // ==========================================
    
    APIS: {
        // WEATHER API
        // Services: OpenWeatherMap, WeatherAPI, etc.
        WEATHER: {
            ENABLED: false,
            // ADD YOUR WEATHER API KEY HERE
            KEY: '',
            // ADD YOUR WEATHER API ENDPOINT HERE
            ENDPOINT: 'https://api.openweathermap.org/data/2.5',
            DEFAULT_CITY: 'New York',
            UNITS: 'metric' // metric, imperial, kelvin
        },
        
        // NEWS API
        // Services: NewsAPI, GNews, etc.
        NEWS: {
            ENABLED: false,
            // ADD YOUR NEWS API KEY HERE
            KEY: '',
            ENDPOINT: 'https://newsapi.org/v2',
            DEFAULT_CATEGORY: 'technology',
            COUNTRY: 'us'
        },
        
        // SEARCH API
        // Services: Google Custom Search, Bing Search, etc.
        SEARCH: {
            ENABLED: false,
            // ADD YOUR SEARCH API KEY HERE
            KEY: '',
            // ADD YOUR SEARCH ENGINE ID (for Google) HERE
            ENGINE_ID: '',
            ENDPOINT: ''
        },
        
        // CALENDAR API
        // Services: Google Calendar, Outlook, etc.
        CALENDAR: {
            ENABLED: false,
            // ADD YOUR CALENDAR API CREDENTIALS HERE
            CLIENT_ID: '',
            API_KEY: '',
            DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            SCOPES: 'https://www.googleapis.com/auth/calendar.readonly'
        },
        
        // TRANSLATION API
        // Services: Google Translate, DeepL, etc.
        TRANSLATION: {
            ENABLED: false,
            // ADD YOUR TRANSLATION API KEY HERE
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
        AUTO_SAVE_INTERVAL: 30000 // 30 seconds
    },
    
    // ==========================================
    // UI CONFIGURATION
    // ==========================================
    
    UI: {
        THEME: 'dark', // dark, light, auto
        ACCENT_COLOR: '#00d4ff',
        ANIMATIONS_ENABLED: true,
        SOUNDS_ENABLED: true,
        NOTIFICATION_DURATION: 5000,
        SPLASH_DURATION: 2000,
        DATE_FORMAT: 'en-US',
        TIME_FORMAT: '24h' // 12h, 24h
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
        CALENDAR: false, // Requires API
        WEATHER: false, // Requires API
        NEWS: false, // Requires API
        SEARCH: false, // Requires API
        MEMORY: true,
        SETTINGS: true
    },
    
    // ==========================================
    // DEBUG & DEVELOPMENT
    // ==========================================
    
    DEBUG: {
        ENABLED: false,
        LOG_LEVEL: 'info', // error, warn, info, debug
        MOCK_API: false,
        SHOW_BORDERS: false,
        PERFORMANCE_MONITORING: false
    }
};

// Freeze configuration to prevent accidental modifications
Object.freeze(JARVIS_CONFIG);
Object.freeze(JARVIS_CONFIG.AI);
Object.freeze(JARVIS_CONFIG.AI.MODELS);
Object.freeze(JARVIS_CONFIG.AI.API);
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
