/* Public-safe configuration. Never commit API keys. */
const JARVIS_CONFIG = {
  APP_NAME: 'J.A.R.V.I.S.',
  APP_VERSION: '3.0.0',
  AI: {
    DEFAULT_MODEL: 'google/gemma-3-4b-it:free',
    CURRENT_MODEL: 'google/gemma-3-4b-it:free',
    MODELS: {
      'google/gemma-3-4b-it:free': 'Gemma 3 4B Free',
      'default': 'JARVIS Local'
    },
    API: {
      USE_EXTERNAL_API: false,
      ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
      KEY: '',
      MAX_TOKENS: 700,
      TEMPERATURE: 0.7,
      TOP_P: 0.9,
      TIMEOUT: 25000,
      RETRY_ATTEMPTS: 1,
      RETRY_DELAY: 500
    },
    SYSTEM_PROMPT: 'You are JARVIS, a helpful personal assistant. Be accurate and concise.'
  },
  VOICE: {
    RECOGNITION: { ENABLED: true, LANG: 'en-IN', CONTINUOUS: false, INTERIM_RESULTS: false },
    SYNTHESIS: { ENABLED: true, RATE: 1.0, PITCH: 1.0, VOLUME: 1.0 }
  },
  STORAGE: { PREFIX: 'jarvis_', VERSION: 3, MAX_NOTES: 1000, MAX_REMINDERS: 500 },
  UI: { THEME: 'dark', ACCENT_COLOR: '#42d9f5', NOTIFICATION_DURATION: 3000 },
  FEATURES: { DASHBOARD: true, ASSISTANT: true, VOICE: true, NOTES: true, REMINDERS: true, CALCULATOR: true, SETTINGS: true },
  DEBUG: { ENABLED: false, LOG_LEVEL: 'warn' }
};