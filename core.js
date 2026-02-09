// J.A.R.V.I.S. Core - State Management & Utilities

const JARVIS = {
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
            apiKeys: {},
            model: 'deepseek/deepseek-chat'
        },
        currentNote: null,
        isListening: false,
        synth: window.speechSynthesis,
        recognition: null
    },

    init() {
        console.log('JARVIS Core initializing...');
        this.loadData();
        this.updateUI();
        return this;
    },

    // Data Persistence
    saveData() {
        try {
            localStorage.setItem('jarvis_memory', JSON.stringify(this.state.memory));
            localStorage.setItem('jarvis_settings', JSON.stringify(this.state.settings));
            console.log('Data saved');
        } catch (e) {
            console.error('Save failed:', e);
        }
    },

    loadData() {
        try {
            const mem = localStorage.getItem('jarvis_memory');
            const set = localStorage.getItem('jarvis_settings');
            
            if (mem) this.state.memory = JSON.parse(mem);
            if (set) {
                const parsed = JSON.parse(set);
                this.state.settings = { ...this.state.settings, ...parsed };
            }
            console.log('Data loaded');
        } catch (e) {
            console.error('Load failed:', e);
        }
    },

    clearAllData() {
        if (confirm('Clear all data? This cannot be undone.')) {
            localStorage.removeItem('jarvis_memory');
            localStorage.removeItem('jarvis_settings');
            location.reload();
        }
    },

    // UI Updates
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

    // Utility Functions
    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    get(id) {
        return document.getElementById(id);
    },

    hideSplash() {
        const splash = this.get('splash-screen');
        const app = this.get('app');
        if (splash) splash.classList.add('hidden');
        if (app) app.classList.remove('hidden');
        console.log('JARVIS ready');
    }
};

// Initialize on load
window.JARVIS = JARVIS;
