// MINIMAL WORKING APP.JS - TEST VERSION
(function() {
    'use strict';
    
    console.log('=== JARVIS STARTUP ===');
    console.log('JarvisCore:', typeof window.JarvisCore);
    console.log('JarvisFeatures:', typeof window.JarvisFeatures);
    console.log('JarvisVoiceVision:', typeof window.JarvisVoiceVision);
    
    // Check if modules loaded
    if (!window.JarvisCore || !window.JarvisFeatures || !window.JarvisVoiceVision) {
        document.getElementById('boot-status').textContent = 'ERROR: Modules failed to load';
        document.getElementById('boot-log').innerHTML = '<div style="color:red">Check console (F12) for errors</div>';
        return;
    }
    
    // Simple working version
    var app = {
        init: function() {
            console.log('App initializing...');
            
            // Hide boot, show app
            document.getElementById('boot-sequence').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            
            // Setup basic chat
            var self = this;
            document.getElementById('main-send-btn').onclick = function() {
                self.handleInput();
            };
            
            document.getElementById('main-input').onkeydown = function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    self.handleInput();
                }
            };
            
            console.log('App ready!');
        },
        
        handleInput: function() {
            var input = document.getElementById('main-input');
            var text = input.value.trim();
            if (!text) return;
            
            this.addMessage('user', text);
            input.value = '';
            
            // Simple response
            var self = this;
            setTimeout(function() {
                self.addMessage('jarvis', 'I received: ' + text);
            }, 500);
        },
        
        addMessage: function(sender, text) {
            var chat = document.getElementById('chat-messages');
            var div = document.createElement('div');
            div.className = 'message message-' + sender;
            div.innerHTML = '<div class="message-bubble">' + text + '</div>';
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }
    };
    
    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { app.init(); });
    } else {
        app.init();
    }
    
    window.jarvis = app;
})();
