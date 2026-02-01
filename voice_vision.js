// ============================================
// J.A.R.V.I.S. VOICE & VISION MODULE
// Speech + Wake Word + Camera + Face Recognition
// NO ES MODULES - GLOBAL WINDOW OBJECT
// ============================================

(function() {
    'use strict';

    // ============================================
    // VOICE CONTROLLER (Speech-to-Text & Text-to-Speech)
    // ============================================
    function VoiceController(config) {
        this.config = config || {};
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.voiceQueue = [];
        this.currentUtterance = null;
        this.audioContext = null;
        this.analyser = null;
        this.init();
    }

    VoiceController.prototype.init = function() {
        var self = this;
        
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = this.config.language || 'en-US';
            
            this.recognition.onstart = function() {
                self.isListening = true;
                console.log('Voice recognition started');
            };

            this.recognition.onresult = function(event) {
                var finalTranscript = '';
                var interimTranscript = '';

                for (var i = event.resultIndex; i < event.results.length; i++) {
                    var transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript && self.onResultCallback) {
                    self.onResultCallback(finalTranscript);
                }
            };

            this.recognition.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
                self.isListening = false;
            };

            this.recognition.onend = function() {
                self.isListening = false;
                if (self.continuousMode) {
                    self.start(self.onResultCallback, { continuous: true });
                }
            };
        }

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
        } catch (e) {
            console.warn('Audio context not supported');
        }
    };

    VoiceController.prototype.start = function(onResult, options) {
        if (!this.recognition) {
            console.error('Speech recognition not supported');
            return;
        }

        this.onResultCallback = onResult;
        this.continuousMode = (options && options.continuous) || false;
        
        try {
            this.recognition.start();
        } catch (e) {
            console.error('Failed to start recognition:', e);
        }
    };

    VoiceController.prototype.stop = function() {
        if (this.recognition) {
            this.recognition.stop();
            this.continuousMode = false;
        }
        this.isListening = false;
    };

    VoiceController.prototype.speak = function(text, options) {
        if (!this.synthesis) return;

        this.synthesis.cancel();

        var self = this;
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = (options && options.pitch) || this.config.pitch || 0.9;
        utterance.rate = (options && options.rate) || this.config.rate || 1.1;
        utterance.volume = (options && options.volume) || this.config.volume || 1;
        utterance.lang = (options && options.lang) || this.config.language || 'en-US';

        var voices = this.synthesis.getVoices();
        var preferredVoice = this.selectVoice(voices, (options && options.gender) || 'male');
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = function() {
            self.isSpeaking = true;
        };

        utterance.onend = function() {
            self.isSpeaking = false;
            if (self.voiceQueue.length > 0) {
                var next = self.voiceQueue.shift();
                self.speak(next.text, next.options);
            }
        };

        utterance.onerror = function(e) {
            console.error('Speech synthesis error:', e);
            self.isSpeaking = false;
        };

        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    };

    VoiceController.prototype.queueSpeech = function(text, options) {
        if (this.isSpeaking) {
            this.voiceQueue.push({ text: text, options: options });
        } else {
            this.speak(text, options);
        }
    };

    VoiceController.prototype.selectVoice = function(voices, gender) {
        var preferred = voices.filter(function(v) {
            var name = v.name.toLowerCase();
            if (gender === 'male') {
                return name.indexOf('male') !== -1 || name.indexOf('david') !== -1 || name.indexOf('james') !== -1;
            } else {
                return name.indexOf('female') !== -1 || name.indexOf('zira') !== -1 || name.indexOf('heera') !== -1;
            }
        });

        var googleVoice = voices.find(function(v) { return v.name.indexOf('Google US English') !== -1; });
        return preferred[0] || googleVoice || voices[0];
    };

    VoiceController.prototype.pause = function() {
        this.synthesis.pause();
    };

    VoiceController.prototype.resume = function() {
        this.synthesis.resume();
    };

    VoiceController.prototype.cancel = function() {
        this.synthesis.cancel();
        this.voiceQueue = [];
        this.isSpeaking = false;
    };

    // ============================================
    // WAKE WORD DETECTOR
    // ============================================
    function WakeWordDetector(config) {
        this.config = config || {};
        this.keywords = config.keywords || ['hey jarvis', 'jarvis', 'okay jarvis'];
        this.recognition = null;
        this.callback = null;
        this.isActive = false;
    }

    WakeWordDetector.prototype.start = function(callback) {
        var self = this;
        this.callback = callback;
        
        if (!('webkitSpeechRecognition' in window)) return;

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onresult = function(event) {
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    var transcript = event.results[i][0].transcript.toLowerCase();
                    
                    for (var j = 0; j < self.keywords.length; j++) {
                        if (transcript.indexOf(self.keywords[j]) !== -1) {
                            self.callback();
                            break;
                        }
                    }
                }
            }
        };
        
        this.recognition.start();
        this.isActive = true;
    };

    WakeWordDetector.prototype.stop = function() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isActive = false;
    };

    // ============================================
    // VISION SYSTEM (Face Recognition)
    // ============================================
    function VisionSystem(config) {
        this.config = config || {};
        this.video = null;
        this.canvas = null;
        this.stream = null;
        this.modelsLoaded = false;
        this.detectionInterval = null;
        this.knownFaces = new Map();
        this.currentDetections = [];
        this.isActive = false;
    }

    VisionSystem.prototype.initialize = async function() {
        var MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
            ]);
            
            this.modelsLoaded = true;
            console.log('Vision models loaded');
        } catch (error) {
            console.error('Failed to load vision models:', error);
        }
    };

    VisionSystem.prototype.start = async function(onDetection) {
        var self = this;
        
        if (!this.modelsLoaded) {
            await this.initialize();
        }

        this.video = document.getElementById('vision-video');
        this.canvas = document.getElementById('vision-canvas');

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            this.video.srcObject = this.stream;
            
            this.video.addEventListener('play', function() {
                self.canvas.width = self.video.videoWidth;
                self.canvas.height = self.video.videoHeight;
                self.startDetectionLoop(onDetection);
            });

            this.isActive = true;
        } catch (error) {
            console.error('Failed to start camera:', error);
        }
    };

    VisionSystem.prototype.startDetectionLoop = function(onDetection) {
        var self = this;
        
        this.detectionInterval = setInterval(async function() {
            var detections = await faceapi
                .detectAllFaces(self.video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions()
                .withAgeAndGender()
                .withFaceDescriptors();

            self.currentDetections = detections;
            self.drawDetections(detections);
            
            if (detections.length > 0 && onDetection) {
                onDetection(self.processDetections(detections));
            }
        }, this.config.detectionInterval || 100);
    };

    VisionSystem.prototype.drawDetections = function(detections) {
        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        var self = this;
        detections.forEach(function(detection) {
            var box = detection.detection.box;
            var expressions = detection.expressions;
            var dominantExpression = Object.entries(expressions)
                .sort(function(a, b) { return b[1] - a[1]; })[0];

            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(box.x, box.y - 30, box.width, 30);
            
            ctx.fillStyle = '#00f0ff';
            ctx.font = '14px monospace';
            var info = Math.round(detection.age) + 'y ' + detection.gender + ' | ' + dominantExpression[0];
            ctx.fillText(info, box.x + 5, box.y - 10);

            detection.landmarks.positions.forEach(function(point) {
                ctx.fillStyle = '#00f0ff';
                ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
            });
        });
    };

    VisionSystem.prototype.processDetections = function(detections) {
        var self = this;
        return detections.map(function(d) {
            return {
                faceId: self.identifyFace(d.descriptor),
                age: Math.round(d.age),
                gender: d.gender,
                expressions: d.expressions,
                descriptor: d.descriptor,
                location: d.detection.box
            };
        });
    };

    VisionSystem.prototype.identifyFace = function(descriptor) {
        var bestMatch = { name: 'unknown', distance: 1 };
        var self = this;
        
        this.knownFaces.forEach(function(data, name) {
            var distance = faceapi.euclideanDistance(descriptor, data.descriptor);
            if (distance < bestMatch.distance) {
                bestMatch = { name: name, distance: distance };
            }
        });

        return bestMatch.distance < 0.6 ? bestMatch.name : 'unknown';
    };

    VisionSystem.prototype.registerFace = function(name, descriptor) {
        this.knownFaces.set(name, {
            descriptor: descriptor,
            registeredAt: Date.now(),
            encounters: 0
        });
        
        this.saveKnownFaces();
    };

    VisionSystem.prototype.saveKnownFaces = function() {
        var data = [];
        this.knownFaces.forEach(function(data, name) {
            data.push({
                name: name,
                descriptor: Array.from(data.descriptor),
                registeredAt: data.registeredAt
            });
        });
        
        localStorage.setItem('jarvis_known_faces', JSON.stringify(data));
    };

    VisionSystem.prototype.loadKnownFaces = function() {
        var stored = localStorage.getItem('jarvis_known_faces');
        if (stored) {
            var data = JSON.parse(stored);
            var self = this;
            data.forEach(function(item) {
                self.knownFaces.set(item.name, {
                    descriptor: new Float32Array(item.descriptor),
                    registeredAt: item.registeredAt,
                    encounters: 0
                });
            });
        }
    };

    VisionSystem.prototype.captureSnapshot = function() {
        if (!this.video) return null;
        
        var canvas = document.createElement('canvas');
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        canvas.getContext('2d').drawImage(this.video, 0, 0);
        
        return canvas.toDataURL('image/jpeg');
    };

    VisionSystem.prototype.stop = function() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(function(track) { track.stop(); });
            this.stream = null;
        }

        this.isActive = false;
    };

    VisionSystem.prototype.detectEmotion = function() {
        if (this.currentDetections.length === 0) return null;
        
        var expressions = this.currentDetections[0].expressions;
        return Object.entries(expressions).sort(function(a, b) { return b[1] - a[1]; })[0];
    };

    // ============================================
    // EXPOSE GLOBAL API
    // ============================================
    window.JarvisVoiceVision = {
        VoiceController: VoiceController,
        WakeWordDetector: WakeWordDetector,
        VisionSystem: VisionSystem,
        
        // Instances (created in app.js)
        voice: null,
        wakeWord: null,
        vision: null,
        
        init: function(config) {
            this.voice = new VoiceController(config.voice || {});
            this.wakeWord = new WakeWordDetector(config.wake || {});
            this.vision = new VisionSystem(config.vision || {});
            
            console.log('✅ JarvisVoiceVision initialized');
        }
    };

    console.log('✅ JarvisVoiceVision loaded');
})();
