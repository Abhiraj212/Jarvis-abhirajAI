// J.A.R.V.I.S. Core - State Management & Utilities

const JARVIS = {
    version: '2.0',
    
    state: {
        memory: {
            facts: [],
            conversations: [],
            user: { name: 'Unknown', age: '-', location: '-', mood: 'Neutral' },
            notes: [],
            tasks: [],
            reminders: []
        },
        settings: {
            theme: 'jarvis',
            tts: true,
            stt: true,
            autoSpeak: true,
            apiKey: '',
            model: 'deepseek/deepseek-chat'
        },
        currentNote: null,
        isListening: false,
        isSpeaking: false,
        synth: null,
        recognition: null
    },

    init() {
        console.log('JARVIS v' + this.version + ' initializing...');
        
        try {
            this.state.synth = window.speechSynthesis;
            this.loadData();
            this.updateUI();
            console.log('Core initialized');
            return true;
        } catch (e) {
            console.error('Core init failed:', e);
            this.showError('Initialization failed: ' + e.message);
            return false;
        }
    },

    // Safe localStorage operations
    saveData() {
        try {
            localStorage.setItem('jarvis_memory', JSON.stringify(this.state.memory));
            localStorage.setItem('jarvis_settings', JSON.stringify(this.state.settings));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            this.showError('Failed to save data');
            return false;
        }
    },

    loadData() {
        try {
            const mem = localStorage.getItem('jarvis_memory');
            const set = localStorage.getItem('jarvis_settings');
            
            if (mem) {
                const parsed = JSON.parse(mem);
                this.state.memory = { ...this.state.memory, ...parsed };
            }
            
            if (set) {
                const parsed = JSON.parse(set);
                this.state.settings = { ...this.state.settings, ...parsed };
            }
            
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            return false;
        }
    },

    clearAllData() {
        if (confirm('⚠️ Clear all data?\n\nThis will delete:\n- All conversations\n- Notes, tasks, reminders\n- Settings\n\nThis cannot be undone.')) {
            try {
                localStorage.removeItem('jarvis_memory');
                localStorage.removeItem('jarvis_settings');
                location.reload();
            } catch (e) {
                this.showError('Failed to clear data');
            }
        }
    },

    // UI Helpers
    updateUI() {
        const { user } = this.state.memory;
        
        this.setText('profile-name', user.name);
        this.setText('profile-age', user.age);
        this.setText('profile-location', user.location);
        this.setText('profile-mood', user.mood);
        
        this.updateMemoryStats();
    },

    updateMemoryStats() {
        const { facts, conversations } = this.state.memory;
        const storage = JSON.stringify(this.state.memory).length;
        
        this.setText('mem-usage', (storage / 1024).toFixed(1) + ' KB');
        this.setText('mem-facts', facts.length);
        this.setText('mem-convos', conversations.length);
        
        const percent = Math.min(storage / 5120, 100);
        this.setText('memory-text', percent.toFixed(0) + '% used');
        
        const fill = document.getElementById('memory-fill');
        if (fill) fill.style.width = percent + '%';
        
        this.renderFactsList();
    },

    renderFactsList() {
        const list = document.getElementById('facts-list');
        if (!list) return;
        
        const { facts } = this.state.memory;
        
        if (facts.length === 0) {
            list.innerHTML = '<div class="empty-facts">No facts stored yet</div>';
        } else {
            list.innerHTML = facts.map(f => 
                `<div class="fact-item">${this.escapeHtml(f)}</div>`
            ).join('');
        }
    },

    // Utilities
    get(id) {
        return document.getElementById(id);
    },

    setText(id, text) {
        const el = this.get(id);
        if (el) el.textContent = text;
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    hideSplash() {
        const splash = this.get('splash-screen');
        const app = this.get('app');
        
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.classList.add('hidden'), 500);
        }
        if (app) app.classList.remove('hidden');
        
        console.log('JARVIS ready');
    },

    showError(msg) {
        console.error('JARVIS Error:', msg);
        const toast = this.get('toast');
        const toastMsg = this.get('toast-message');
        
        if (toast && toastMsg) {
            toastMsg.textContent = msg;
            toast.classList.remove('hidden');
            setTimeout(() => this.hideToast(), 5000);
        } else {
            alert('Error: ' + msg);
        }
    },

    hideToast() {
        this.get('toast')?.classList.add('hidden');
    },

    // API Helper
    async callOpenRouter(messages) {
        const { settings } = this.state;
        
        if (!settings.apiKey) {
            throw new Error('API key not configured. Please add your OpenRouter API key in settings.');
        }
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'J.A.R.V.I.S. AI Mobile'
            },
            body: JSON.stringify({
                model: settings.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No response from AI';
    }
};

// Global error handler
window.onerror = function(msg, url, line) {
    console.error('Global error:', msg, 'at', url, ':', line);
    JARVIS.showError('An error occurred. Please reload the page.');
    return false;
};

// Unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise:', e.reason);
    JARVIS.showError('Network or API error occurred');
});

window.JARVIS = JARVIS;
