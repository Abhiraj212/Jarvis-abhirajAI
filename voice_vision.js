// J.A.R.V.I.S. Voice & Vision - Speech and Camera Functions

JARVIS.Voice = {
    setup() {
        const { state } = JARVIS;
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.log('Speech recognition not supported');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        state.recognition = new SpeechRecognition();
        state.recognition.continuous = false;
        state.recognition.interimResults = false;
        state.recognition.lang = 'en-US';
        
        state.recognition.onstart = () => {
            state.isListening = true;
            JARVIS.get('btn-voice')?.classList.add('active');
            JARVIS.get('jarvis-avatar')?.classList.add('listening');
            JARVIS.setText('status-text', 'Listening...');
        };
        
        state.recognition.onend = () => {
            state.isListening = false;
            JARVIS.get('btn-voice')?.classList.remove('active');
            JARVIS.get('jarvis-avatar')?.classList.remove('listening');
            JARVIS.setText('status-text', 'Tap microphone to speak');
        };
        
        state.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = JARVIS.get('chat-input');
            if (input) {
                input.value = transcript;
                JARVIS.Chat.send();
            }
        };
        
        console.log('Voice setup complete');
    },

    toggle() {
        const { state } = JARVIS;
        if (!state.recognition) {
            alert('Speech recognition not supported');
            return;
        }
        
        if (state.isListening) {
            state.recognition.stop();
        } else {
            state.recognition.start();
        }
    },

    speak(text) {
        const { state } = JARVIS;
        if (!state.settings.tts || !state.synth) return;
        
        state.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 0.9;
        
        const voices = state.synth.getVoices();
        const voice = voices.find(v => v.lang === 'en-US') || voices[0];
        if (voice) utterance.voice = voice;
        
        const avatar = JARVIS.get('jarvis-avatar');
        if (avatar) {
            utterance.onstart = () => avatar.classList.add('speaking');
            utterance.onend = () => avatar.classList.remove('speaking');
        }
        
        state.synth.speak(utterance);
    }
};

JARVIS.Vision = {
    stream: null,

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = JARVIS.get('camera-video');
            if (video) video.srcObject = this.stream;
        } catch (e) {
            alert('Camera access denied');
            this.close();
        }
    },

    close() {
        const overlay = JARVIS.get('camera-overlay');
        if (overlay) overlay.classList.add('hidden');
        
        const video = JARVIS.get('camera-video');
        if (video?.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        this.stream = null;
    },

    toggle() {
        const overlay = JARVIS.get('camera-overlay');
        if (!overlay) return;
        
        if (overlay.classList.contains('hidden')) {
            overlay.classList.remove('hidden');
            this.start();
        } else {
            this.close();
        }
    },

    capture() {
        JARVIS.Voice.speak('Face captured');
        this.close();
    }
};
