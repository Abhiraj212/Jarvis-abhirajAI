// J.A.R.V.I.S. Main Application
class JarvisAI {
  constructor() {
    this.memory = {
      facts: [],
      conversations: [],
      user: { name: 'Unknown', age: '-', location: '-', mood: 'Neutral' },
      notes: [],
      tasks: [],
      reminders: []
    };
    this.settings = {
      theme: 'jarvis',
      tts: true,
      stt: true,
      autoSpeak: true,
      apiKeys: {
        openrouter: '',
        deepseek: '',
        weather: '',
        news: ''
      },
      model: 'deepseek/deepseek-chat'
    };
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.currentNote = null;
    
    this.init();
  }

  init() {
    this.loadData();
    this.setupEventListeners();
    this.setupSpeechRecognition();
    this.updateUI();
    
    // Hide splash screen after load
    setTimeout(() => {
      document.getElementById('splash-screen').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
    }, 2500);
  }

  // Sidebar Management
  toggleSidebar(side) {
    const sidebar = document.getElementById(`sidebar-${side}`);
    const backdrop = document.getElementById('sidebar-backdrop');
    const isActive = sidebar.classList.contains('active');
    
    // Close all first
    this.closeAllSidebars();
    
    if (!isActive) {
      sidebar.classList.add('active');
      backdrop.classList.add('active');
    }
  }

  closeAllSidebars() {
    document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('active'));
    document.getElementById('sidebar-backdrop').classList.remove('active');
  }

  // Theme Management
  setTheme(theme) {
    this.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.saveData();
  }

  // Voice Settings
  toggleTTS() {
    this.settings.tts = document.getElementById('tts-toggle').checked;
    this.saveData();
  }

  toggleSTT() {
    this.settings.stt = document.getElementById('stt-toggle').checked;
    this.saveData();
  }

  toggleAutoSpeak() {
    this.settings.autoSpeak = document.getElementById('auto-speak-toggle').checked;
    this.saveData();
  }

  // Text to Speech
  speak(text) {
    if (!this.settings.tts || !this.synth) return;
    
    // Stop any current speech
    this.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 0.9;
    utterance.volume = 1;
    
    // Try to find a good voice
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                          voices.find(v => v.name.includes('Samantha')) ||
                          voices.find(v => v.lang === 'en-US');
    if (preferredVoice) utterance.voice = preferredVoice;
    
    // Visual feedback
    const avatar = document.getElementById('jarvis-avatar');
    utterance.onstart = () => avatar.classList.add('speaking');
    utterance.onend = () => avatar.classList.remove('speaking');
    
    this.synth.speak(utterance);
  }

  // Speech Recognition
  setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    this.recognition.onstart = () => {
      this.isListening = true;
      document.getElementById('voice-btn').classList.add('active');
      document.getElementById('jarvis-avatar').classList.add('listening');
      document.getElementById('status-text').textContent = 'Listening...';
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      document.getElementById('voice-btn').classList.remove('active');
      document.getElementById('jarvis-avatar').classList.remove('listening');
      document.getElementById('status-text').textContent = 'Tap to speak';
    };
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById('chat-input').value = transcript;
      this.send();
    };
  }

  toggleVoice() {
    if (!this.recognition) {
      alert('Speech recognition not supported in your browser');
      return;
    }
    
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  // Chat Functions
  async send() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;
    
    this.addMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    document.getElementById('status-text').textContent = 'Thinking...';
    
    try {
      const response = await this.getAIResponse(message);
      this.addMessage(response, 'jarvis');
      
      // Auto-speak if enabled
      if (this.settings.autoSpeak) {
        this.speak(response);
      }
    } catch (error) {
      this.addMessage('I apologize, but I encountered an error processing your request.', 'jarvis');
    }
    
    document.getElementById('status-text').textContent = 'Tap to speak';
  }

  quickSend(text) {
    document.getElementById('chat-input').value = text;
    this.send();
  }

  addMessage(text, sender) {
    const container = document.getElementById('messages-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `
      ${text}
      <span class="message-time">${time}</span>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    // Save to memory
    if (sender === 'user') {
      this.memory.conversations.push({ role: 'user', content: text, time: Date.now() });
    } else {
      this.memory.conversations.push({ role: 'assistant', content: text, time: Date.now() });
    }
    this.updateMemoryStats();
    this.saveData();
  }

  // AI Response with OpenRouter
  async getAIResponse(message) {
    // Check for memory commands
    if (message.toLowerCase().includes('remember my name is')) {
      const name = message.split('is')[1].trim();
      this.memory.user.name = name;
      this.updateUI();
      this.saveData();
      return `I've remembered your name, ${name}.`;
    }
    
    // Use OpenRouter if available
    if (this.settings.apiKeys.openrouter) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.settings.apiKeys.openrouter}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.href,
            'X-Title': 'J.A.R.V.I.S. AI'
          },
          body: JSON.stringify({
            model: this.settings.model,
            messages: [
              { role: 'system', content: `You are J.A.R.V.I.S., an AI assistant. User's name is ${this.memory.user.name}.` },
              ...this.memory.conversations.slice(-10).map(c => ({ role: c.role, content: c.content })),
              { role: 'user', content: message }
            ]
          })
        });
        
        const data = await response.json();
        if (data.choices && data.choices[0]) {
          return data.choices[0].message.content;
        }
      } catch (error) {
        console.error('OpenRouter error:', error);
      }
    }
    
    // Fallback responses
    const responses = [
      "I understand. How can I assist you further?",
      "Interesting. Tell me more about that.",
      "I've noted that in my memory.",
      "As you wish, sir.",
      "Working on it now."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // API Management
  async testAPI(type) {
    const input = document.getElementById(`api-${type}`);
    const key = input.value.trim();
    const badge = document.getElementById(`badge-${type}`);
    
    if (!key) {
      badge.textContent = 'OFFLINE';
      badge.classList.remove('online');
      return;
    }
    
    badge.textContent = 'TESTING...';
    
    if (type === 'openrouter') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        if (response.ok) {
          badge.textContent = 'ONLINE';
          badge.classList.add('online');
          this.settings.apiKeys.openrouter = key;
          this.saveData();
        } else {
          throw new Error('Invalid key');
        }
      } catch (error) {
        badge.textContent = 'ERROR';
        badge.classList.remove('online');
      }
    } else {
      // Simulate test for other APIs
      setTimeout(() => {
        badge.textContent = 'ONLINE';
        badge.classList.add('online');
        this.settings.apiKeys[type] = key;
        this.saveData();
      }, 1000);
    }
  }

  saveModel() {
    this.settings.model = document.getElementById('openrouter-model').value;
    this.saveData();
  }

  // Notebook Functions
  openNotebook() {
    this.showApps();
    document.getElementById('notebook-app').classList.remove('hidden');
    this.renderNotesList();
  }

  renderNotesList() {
    const list = document.getElementById('notebook-list');
    if (this.memory.notes.length === 0) {
      list.innerHTML = '<div class="empty-notes">No notes yet</div>';
      return;
    }
    
    list.innerHTML = this.memory.notes.map((note, index) => `
      <div class="note-item ${this.currentNote === index ? 'active' : ''}" onclick="jarvis.loadNote(${index})">
        <span>${note.title || 'Untitled'}</span>
        <small>${new Date(note.date).toLocaleDateString()}</small>
      </div>
    `).join('');
  }

  newNote() {
    this.currentNote = null;
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    this.renderNotesList();
  }

  loadNote(index) {
    this.currentNote = index;
    const note = this.memory.notes[index];
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
    this.renderNotesList();
  }

  saveNote() {
    const title = document.getElementById('note-title').value.trim() || 'Untitled';
    const content = document.getElementById('note-content').value;
    
    if (this.currentNote !== null) {
      this.memory.notes[this.currentNote] = { title, content, date: Date.now() };
    } else {
      this.memory.notes.push({ title, content, date: Date.now() });
      this.currentNote = this.memory.notes.length - 1;
    }
    
    this.saveData();
    this.renderNotesList();
    this.speak('Note saved successfully');
  }

  deleteNote() {
    if (this.currentNote === null) return;
    
    this.memory.notes.splice(this.currentNote, 1);
    this.currentNote = null;
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    this.saveData();
    this.renderNotesList();
  }

  // Other Mini Apps
  openCalculator() {
    this.showApps();
    document.getElementById('calc-app').classList.remove('hidden');
  }

  calc(value) {
    const display = document.getElementById('calc-display');
    let current = display.textContent;
    
    if (value === 'C') {
      display.textContent = '0';
    } else if (value === '⌫') {
      display.textContent = current.length > 1 ? current.slice(0, -1) : '0';
    } else if (value === '=') {
      try {
        display.textContent = eval(current.replace('×', '*').replace('÷', '/')) || '0';
      } catch {
        display.textContent = 'Error';
      }
    } else {
      if (current === '0' && !isNaN(value)) {
        display.textContent = value;
      } else {
        display.textContent = current + value;
      }
    }
  }

  openTasks() {
    this.showApps();
    document.getElementById('tasks-app').classList.remove('hidden');
    this.renderTasks();
  }

  addTask() {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (!text) return;
    
    this.memory.tasks.push({ text, completed: false, id: Date.now() });
    input.value = '';
    this.saveData();
    this.renderTasks();
  }

  renderTasks() {
    const list = document.getElementById('tasks-list');
    if (this.memory.tasks.length === 0) {
      list.innerHTML = '<div class="empty-tasks">No tasks yet</div>';
      return;
    }
    
    list.innerHTML = this.memory.tasks.map(task => `
      <div class="task-item ${task.completed ? 'completed' : ''}">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="jarvis.toggleTask(${task.id})">
        <span>${task.text}</span>
        <button onclick="jarvis.deleteTask(${task.id})">×</button>
      </div>
    `).join('');
  }

  toggleTask(id) {
    const task = this.memory.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveData();
      this.renderTasks();
    }
  }

  deleteTask(id) {
    this.memory.tasks = this.memory.tasks.filter(t => t.id !== id);
    this.saveData();
    this.renderTasks();
  }

  openWeather() {
    this.showApps();
    document.getElementById('weather-app').classList.remove('hidden');
  }

  async getWeather() {
    const city = document.getElementById('weather-city').value;
    if (!city || !this.settings.apiKeys.weather) {
      alert('Please enter a city and set up the Weather API');
      return;
    }
    
    // Mock weather data - implement real API call
    document.querySelector('.weather-icon').textContent = '☀️';
    document.querySelector('.weather-temp').textContent = '22°';
    document.getElementById('weather-humidity').textContent = '65%';
    document.getElementById('weather-wind').textContent = '12 km/h';
    document.getElementById('weather-condition').textContent = 'Sunny';
  }

  openReminders() {
    this.showApps();
    document.getElementById('reminders-app').classList.remove('hidden');
    this.renderReminders();
  }

  addReminder() {
    const text = document.getElementById('reminder-text').value.trim();
    const time = document.getElementById('reminder-time').value;
    
    if (!text || !time) return;
    
    this.memory.reminders.push({ text, time: new Date(time).getTime(), id: Date.now() });
    document.getElementById('reminder-text').value = '';
    document.getElementById('reminder-time').value = '';
    this.saveData();
    this.renderReminders();
  }

  renderReminders() {
    const list = document.getElementById('reminders-list');
    if (this.memory.reminders.length === 0) {
      list.innerHTML = '<div class="empty-reminders">No reminders set</div>';
      return;
    }
    
    const now = Date.now();
    list.innerHTML = this.memory.reminders.map(r => {
      const isOverdue = r.time < now;
      const isDueSoon = r.time - now < 3600000; // 1 hour
      
      return `
        <div class="reminder-item ${isOverdue ? 'overdue' : ''} ${isDueSoon ? 'due-soon' : ''}">
          <div class="reminder-content">
            <div class="reminder-text">${r.text}</div>
            <div class="reminder-time">${new Date(r.time).toLocaleString()}</div>
          </div>
          <button onclick="jarvis.deleteReminder(${r.id})">×</button>
        </div>
      `;
    }).join('');
  }

  deleteReminder(id) {
    this.memory.reminders = this.memory.reminders.filter(r => r.id !== id);
    this.saveData();
    this.renderReminders();
  }

  openGame() {
    this.showApps();
    alert('Quiz game coming soon!');
  }

  // Camera Functions
  toggleCamera() {
    const overlay = document.getElementById('camera-overlay');
    if (overlay.classList.contains('hidden')) {
      overlay.classList.remove('hidden');
      this.startCamera();
    } else {
      this.closeCamera();
    }
  }

  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      document.getElementById('camera-video').srcObject = stream;
    } catch (error) {
      alert('Could not access camera');
      this.closeCamera();
    }
  }

  closeCamera() {
    const overlay = document.getElementById('camera-overlay');
    overlay.classList.add('hidden');
    const video = document.getElementById('camera-video');
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  }

  captureFace() {
    // Implement face capture logic
    this.speak('Face captured');
    this.closeCamera();
  }

  // App Drawer
  showApps() {
    const drawer = document.getElementById('apps-drawer');
    drawer.classList.toggle('hidden');
  }

  closeMiniApp() {
    document.querySelectorAll('.mini-app').forEach(app => app.classList.add('hidden'));
  }

  // Data Management
  saveData() {
    localStorage.setItem('jarvis_memory', JSON.stringify(this.memory));
    localStorage.setItem('jarvis_settings', JSON.stringify(this.settings));
  }

  loadData() {
    const savedMemory = localStorage.getItem('jarvis_memory');
    const savedSettings = localStorage.getItem('jarvis_settings');
    
    if (savedMemory) this.memory = JSON.parse(savedMemory);
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
      // Restore UI state
      document.getElementById('tts-toggle').checked = this.settings.tts;
      document.getElementById('stt-toggle').checked = this.settings.stt;
      document.getElementById('auto-speak-toggle').checked = this.settings.autoSpeak;
      document.getElementById('openrouter-model').value = this.settings.model;
      if (this.settings.theme) this.setTheme(this.settings.theme);
    }
  }

  updateUI() {
    document.getElementById('profile-name').textContent = this.memory.user.name;
    document.getElementById('profile-age').textContent = this.memory.user.age;
    document.getElementById('profile-location').textContent = this.memory.user.location;
    document.getElementById('profile-mood').textContent = this.memory.user.mood;
    this.updateMemoryStats();
  }

  updateMemoryStats() {
    const facts = this.memory.facts.length;
    const convos = this.memory.conversations.length;
    const storage = (JSON.stringify(this.memory).length / 1024).toFixed(1);
    
    document.getElementById('mem-facts').textContent = facts;
    document.getElementById('mem-convos').textContent = convos;
    document.getElementById('mem-usage').textContent = `${storage} KB`;
    document.getElementById('memory-text').textContent = `${Math.min(storage / 10, 100).toFixed(0)}% used`;
    document.getElementById('memory-fill').style.width = `${Math.min(storage / 10, 100)}%`;
    
    // Update facts list
    const factsList = document.getElementById('facts-list');
    if (facts === 0) {
      factsList.innerHTML = '<div class="empty-facts">No facts stored yet</div>';
    } else {
      factsList.innerHTML = this.memory.facts.map(f => 
        `<div class="fact-item">${f}</div>`
      ).join('');
    }
  }

  clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem('jarvis_memory');
      localStorage.removeItem('jarvis_settings');
      location.reload();
    }
  }

  setupEventListeners() {
    // Enter key to send
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.send();
    });
  }

  startChat() {
    document.getElementById('chat-input').focus();
  }
}

// Initialize JARVIS
const jarvis = new JarvisAI();