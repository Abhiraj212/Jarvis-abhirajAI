// J.A.R.V.I.S. Voice & Vision - Mobile Optimized

JARVIS.Voice = {
    initAttempts: 0,
    maxAttempts: 3,

    setup() {
        // Check for speech synthesis
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            JARVIS.state.settings.tts = false;
            return false;
        }

        // Setup recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            JARVIS.state.settings.stt = false;
            
            // Disable toggle
            const sttToggle = JARVIS.get('stt-toggle');
            if (sttToggle) {
                sttToggle.checked = false;
                sttToggle.disabled = true;
            }
            return false;
        }

        try {
            JARVIS.state.recognition = new SpeechRecognition();
            JARVIS.state.recognition.continuous = false;
            JARVIS.state.recognition.interimResults = false;
            JARVIS.state.recognition.lang = 'en-US';
            
            this.setupEvents();
            console.log('Voice setup complete');
            return true;
        } catch (e) {
            console.error('Voice setup failed:', e);
            return false;
        }
    },

    setupEvents() {
        const rec = JARVIS.state.recognition;
        if (!rec) return;

        rec.onstart = () => {
            JARVIS.state.isListening = true;
            JARVIS.get('btn-voice')?.classList.add('active');
            JARVIS.get('jarvis-avatar')?.classList.add('listening');
            JARVIS.setText('status-text', 'Listening...');
        };

        rec.onend = () => {
            JARVIS.state.isListening = false;
            JARVIS.get('btn-voice')?.classList.remove('active');
            JARVIS.get('jarvis-avatar')?.classList.remove('listening');
            JARVIS.setText('status-text', 'Tap microphone to speak');
        };

        rec.onresult = (event) => {
            try {
                const transcript = event.results[0][0].transcript;
                const input = JARVIS.get('chat-input');
                if (input) {
                    input.value = transcript;
                    // Auto send after voice input
                    setTimeout(() => JARVIS.Chat.send(), 300);
                }
            } catch (e) {
                console.error('Voice result error:', e);
            }
        };

        rec.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            JARVIS.state.isListening = false;
            JARVIS.get('btn-voice')?.classList.remove('active');
            JARVIS.get('jarvis-avatar')?.classList.remove('listening');
            
            let msg = 'Voice error';
            switch(event.error) {
                case 'no-speech': msg = 'No speech detected'; break;
                case 'audio-capture': msg = 'No microphone found'; break;
                case 'not-allowed': msg = 'Microphone permission denied'; break;
                case 'network': msg = 'Network error'; break;
            }
            JARVIS.setText('status-text', msg);
        };
    },

    toggle() {
        const { state } = JARVIS;
        
        if (!state.recognition) {
            JARVIS.showError('Speech recognition not available on this device');
            return;
        }

        // Check permission on mobile
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'microphone' }).then(result => {
                if (result.state === 'denied') {
                    JARVIS.showError('Microphone permission denied. Please enable in settings.');
                    return;
                }
                this.doToggle();
            }).catch(() => {
                this.doToggle();
            });
        } else {
            this.doToggle();
        }
    },

    doToggle() {
        const { state } = JARVIS;
        
        try {
            if (state.isListening) {
                state.recognition.stop();
            } else {
                // Ensure we're not speaking when starting to listen
                if (state.synth) {
                    state.synth.cancel();
                }
                state.recognition.start();
            }
        } catch (e) {
            console.error('Toggle voice error:', e);
            JARVIS.showError('Voice control error. Please try again.');
        }
    },

    speak(text) {
        const { state } = JARVIS;
        
        if (!state.settings.tts || !state.synth) return;
        
        // Don't speak if listening
        if (state.isListening) return;
        
        // Cancel any ongoing speech
        state.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 0.9;
        utterance.volume = 1;
        
        // Try to get a good English voice
        const voices = state.synth.getVoices();
        const voice = voices.find(v => v.name.includes('Google US English')) ||
                     voices.find(v => v.name.includes('Samantha')) ||
                     voices.find(v => v.lang === 'en-US' && v.name.includes('Female')) ||
                     voices.find(v => v.lang === 'en-US') ||
                     voices[0];
        
        if (voice) utterance.voice = voice;
        
        const avatar = JARVIS.get('jarvis-avatar');
        
        utterance.onstart = () => {
            state.isSpeaking = true;
            avatar?.classList.add('speaking');
        };
        
        utterance.onend = () => {
            state.isSpeaking = false;
            avatar?.classList.remove('speaking');
        };
        
        utterance.onerror = (e) => {
            console.error('Speech error:', e);
            state.isSpeaking = false;
            avatar?.classList.remove('speaking');
        };
        
        state.synth.speak(utterance);
    },

    // Force load voices (needed for some mobile browsers)
    loadVoices() {
        if (JARVIS.state.synth) {
            JARVIS.state.synth.getVoices();
        }
    }
};

// Vision Module
JARVIS.Vision = {
    stream: null,

    async start() {
        try {
            // Check for getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported on this device');
            }

            // Stop any existing stream
            this.stop();

            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const video = JARVIS.get('camera-video');
            if (video) {
                video.srcObject = this.stream;
                video.play().catch(e => console.error('Video play error:', e));
            }
            
            return true;
        } catch (e) {
            console.error('Camera error:', e);
            JARVIS.showError('Camera access denied or not available');
            this.close();
            return false;
        }
    },

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        const video = JARVIS.get('camera-video');
        if (video) {
            video.srcObject = null;
            video.pause();
        }
    },

    close() {
        this.stop();
        JARVIS.get('camera-overlay')?.classList.add('hidden');
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
        try {
            const video = JARVIS.get('camera-video');
            const canvas = document.createElement('canvas');
            
            if (video && video.videoWidth) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);
                
                // Here you could process the image
                console.log('Image captured');
            }
            
            JARVIS.Voice.speak('Image captured');
            this.close();
        } catch (e) {
            console.error('Capture error:', e);
            JARVIS.showError('Failed to capture image');
        }
    }
};

// Load voices when available
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        JARVIS.Voice.loadVoices();
    };
}
