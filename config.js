/**
 * J.A.R.V.I.S. Configuration File
 * ============================================
 */

const JARVIS_CONFIG = {
    APP_NAME: 'J.A.R.V.I.S.',
    APP_VERSION: '2.0.0',
    
    AI: {
        DEFAULT_MODEL: 'google/gemma-3-4b-it:free',
        
        MODELS: {
            'google/gemma-3-4b-it:free': 'Gemma 3 4B Free',
            'openai/gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'default': 'JARVIS Local'
        },
        
        CURRENT_MODEL: 'google/gemma-3-4b-it:free',
        
        API: {
            USE_EXTERNAL_API: true,
            ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
            
            // ⚠️ REPLACE THIS WITH YOUR ACTUAL OPENROUTER API KEY
            // It should start with: sk-or-v1-
            KEY: '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',
            
            MAX_TOKENS: 1024,
            TEMPERATURE: 0.7,
            TOP_P: 0.9,
            TIMEOUT: 30000,
            RETRY_ATTEMPTS: 3,
            RETRY_DELAY: 1000
        },
        
        SYSTEM_PROMPT: `You are J.A.R.V.I.S., an advanced AI assistant. Be helpful, professional, and concise.`
    },
    
    VOICE: {
        RECOGNITION: { ENABLED: true, LANG: 'en-US', CONTINUOUS: false, INTERIM_RESULTS: true },
        SYNTHESIS: { ENABLED: true, RATE: 1.0, PITCH: 1.0, VOLUME: 1.0 }
    },
    
    APIS: {
        WEATHER: { ENABLED: false, KEY: '', ENDPOINT: 'https://api.openweathermap.org/data/2.5', DEFAULT_CITY: 'New York', UNITS: 'metric' },
        NEWS: { ENABLED: false, KEY: '', ENDPOINT: 'https://newsapi.org/v2', DEFAULT_CATEGORY: 'technology', COUNTRY: 'us' }
    },
    
    STORAGE: { PREFIX: 'jarvis_', VERSION: 1, MAX_NOTES: 1000, MAX_REMINDERS: 500 },
    UI: { THEME: 'dark', ACCENT_COLOR: '#00d4ff', NOTIFICATION_DURATION: 5000 },
    FEATURES: { DASHBOARD: true, ASSISTANT: true, VOICE: true, NOTES: true, REMINDERS: true, CALCULATOR: true, WEATHER: false, SETTINGS: true },
    DEBUG: { ENABLED: false, LOG_LEVEL: 'info' }
};

// ⚠️ IMPORTANT: Don't freeze the AI config so it can be updated
Object.freeze(JARVIS_CONFIG);
// Don't freeze AI section - we need to allow runtime updates
// Object.freeze(JARVIS_CONFIG.AI);
// Object.freeze(JARVIS_CONFIG.AI.API);
