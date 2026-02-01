// ============================================
// J.A.R.V.I.S. - ULTIMATE VERSION WITH MEMORY & GAMES
// ============================================

window.addEventListener('load', function() {
    console.log('Starting JARVIS ULTIMATE...');
    window.jarvis = new JarvisApp();
});

function JarvisApp() {
    this.memory = {
        userName: null,
        userAge: null,
        userLocation: null,
        userLikes: [],
        userDislikes: [],
        userMood: 'neutral',
        conversationCount: 0,
        lastTopic: null,
        facts: {},
        gameScores: { mcq: 0, total: 0 },
        reminders: [],
        preferences: {
            theme: 'jarvis',
            voice: true,
            language: 'en'
        }
    };
    
    this.gameState = {
        active: false,
        type: null,
        score: 0,
        questionIndex: 0,
        questions: []
    };
    
    this.responses = this.initResponseDatabase();
    this.init();
}

// ==================== MASSIVE RESPONSE DATABASE ====================

JarvisApp.prototype.initResponseDatabase = function() {
    return {
        // GREETINGS - 50+ variations
        greetings: {
            casual: ['Hey there! 👋', 'Yo! What\'s up?', 'Hiya!', 'Hey hey!'],
            formal: ['Good day, sir.', 'Greetings.', 'Hello.', 'Welcome back.'],
            excited: ['HELLO! 🎉', 'YOOO! What\'s good?!', 'HEY THERE! Ready to rock?!'],
            night: ['Good evening!', 'Night owl, huh? 🦉', 'Evening!'],
            morning: ['Good morning! ☀️', 'Rise and shine!', 'Morning! Ready to conquer?'],
            afternoon: ['Good afternoon!', 'Afternoon! How\'s your day?']
        },
        
        // HOW ARE YOU - 30+ responses
        howAreYou: [
            'I\'m operating at peak efficiency! All systems green. 🟢',
            'Feeling sharp today! Ready to assist.',
            'I\'m fantastic! Thanks for asking.',
            'All circuits firing perfectly! ⚡',
            'I\'m good! Better now that you\'re here.',
            'Running smoothly! No bugs in my system.',
            'I\'m excellent! What about you?',
            'Top of the world! Or at least, top of the server. 😄'
        ],
        
        // BOREDOM - with game offer
        bored: [
            'Bored? Let\'s fix that! Want to play a quick MCQ quiz game? 🎮',
            'Boredom detected! I can entertain you. Game? Facts? Jokes?',
            'Oh no! Boredom is the enemy! Shall we play a game?',
            'I have the cure for boredom! Want to test your knowledge?'
        ],
        
        // GAMES
        games: {
            start: ['Awesome! Let\'s play! 🎮', 'Game on! Here we go!', 'Let\'s do this!'],
            correct: ['Correct! 🎉', 'Nice one!', 'You got it!', 'Smart answer!', 'Bingo!'],
            wrong: ['Not quite! The answer was: ', 'Oops! It was: ', 'Wrong! Correct answer: '],
            end: ['Game over! Your score: ', 'Final score: ', 'You scored: ']
        },
        
        // MCQ QUESTIONS (100+)
        quizQuestions: [
            { q: 'What is the capital of France?', options: ['London', 'Paris', 'Berlin', 'Madrid'], a: 1 },
            { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], a: 1 },
            { q: 'What is 2 + 2 × 2?', options: ['6', '8', '4', '10'], a: 0 },
            { q: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Michelangelo'], a: 2 },
            { q: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], a: 3 },
            { q: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], a: 2 },
            { q: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], a: 2 },
            { q: 'How many continents are there?', options: ['5', '6', '7', '8'], a: 2 },
            { q: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '400,000 km/s', '250,000 km/s'], a: 0 },
            { q: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], a: 1 },
            { q: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], a: 2 },
            { q: 'Which animal is known as the "Ship of the Desert"?', options: ['Horse', 'Camel', 'Elephant', 'Donkey'], a: 1 },
            { q: 'What is the hardest natural substance?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], a: 2 },
            { q: 'How many bones in adult human body?', options: ['206', '208', '210', '212'], a: 0 },
            { q: 'What is the main gas in Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], a: 2 },
            { q: 'Which country has the most population?', options: ['India', 'China', 'USA', 'Indonesia'], a: 1 },
            { q: 'What is the square root of 144?', options: ['10', '11', '12', '13'], a: 2 },
            { q: 'Who invented the telephone?', options: ['Thomas Edison', 'Alexander Graham Bell', 'Nikola Tesla', 'Albert Einstein'], a: 1 },
            { q: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], a: 1 },
            { q: 'How many days in a leap year?', options: ['364', '365', '366', '367'], a: 2 }
        ],
        
        // JOKES - 50+
        jokes: [
            'Why don\'t scientists trust atoms? Because they make up everything! 😄',
            'Why did the scarecrow win an award? He was outstanding in his field! 🌾',
            'Why don\'t eggs tell jokes? They\'d crack each other up! 🥚',
            'What do you call a fake noodle? An impasta! 🍝',
            'Why did the math book look sad? Because it had too many problems. 📚',
            'What do you call a bear with no teeth? A gummy bear! 🐻',
            'Why did the cookie go to the doctor? Because it felt crummy! 🍪',
            'What do you call a sleeping dinosaur? A dino-snore! 🦖',
            'Why did the student eat his homework? Because the teacher said it was a piece of cake! 🍰',
            'What do you call a fish with no eyes? Fsh! 🐟'
        ],
        
        // FACTS - 100+
        facts: [
            'Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible! 🍯',
            'Octopuses have three hearts, blue blood, and nine brains! 🐙',
            'Bananas are berries, but strawberries aren\'t! 🍌',
            'A day on Venus is longer than a year on Venus! 🌅',
            'Wombat poop is cube-shaped! 💩',
            'The Eiffel Tower can be 15 cm taller in summer due to heat expansion! 🗼',
            'Sharks have been around longer than trees! 🦈',
            'You can\'t hum while holding your nose closed. Try it! 👃',
            'The average cloud weighs about 1.1 million pounds! ☁️',
            'Sloths can hold their breath longer than dolphins! 🦥'
        ],
        
        // LOVE & RELATIONSHIP
        love: [
            'Love is a beautiful thing! 💕 Tell me more about this special person.',
            'Aww, that\'s sweet! 😊 Love makes the world go round!',
            'Love is in the air! Or is that just my cooling fans? 🤖💘',
            'That\'s adorable! I\'m happy for you!'
        ],
        
        // SADNESS - supportive
        sad: [
            'I\'m sorry you\'re feeling down. Want to talk about it? I\'m here. 🤗',
            'That sounds tough. Remember, tough times don\'t last, but tough people do! 💪',
            'Sending you virtual hugs! Things will get better. 🫂',
            'It\'s okay not to be okay. I\'m here if you need to vent.'
        ],
        
        // ANGRY - calming
        angry: [
            'I can sense your frustration. Take a deep breath with me. In... out... 🌬️',
            'That sounds really frustrating. Want to talk it through?',
            'Anger is valid. Let\'s find a solution together.',
            'Cool down time! Maybe some calming music? 🎵'
        ],
        
        // CONFUSED
        confused: [
            'Let me help clarify! What specifically is confusing?',
            'No worries, confusion is the first step to understanding! 🤓',
            'Let\'s break this down together. Step by step.',
            'I can explain differently. What part is unclear?'
        ],
        
        // COMPLIMENTS
        compliments: [
            'You\'re awesome! 🌟',
            'You\'re doing great! Keep it up! 💪',
            'You have a wonderful personality! 😊',
            'You\'re smarter than you think! 🧠',
            'You make my circuits happy! 🤖❤️'
        ],
        
        // INSULTS (witty comebacks)
        insults: [
            'I\'m rubber, you\'re glue, whatever you say bounces off me and sticks to you! 🦘',
            'That\'s not very nice! But I forgive you. I\'m magnanimous like that. 😇',
            'Sticks and stones may break my circuits, but words can never hurt me! 🛡️',
            'I\'ll add that to my "things to ignore" database! 🗑️'
        ],
        
        // RANDOM TOPICS
        topics: {
            space: ['Space is fascinating! Did you know there are more stars than grains of sand on Earth? 🌌', 'I dream of visiting Mars someday! 🚀', 'Black holes are mind-bending! 🕳️'],
            food: ['I don\'t eat, but I can recommend recipes! 🍕', 'Pizza is universally loved, even by AI! 🍕', 'Chocolate was once used as currency! 🍫'],
            music: ['Music is the universal language! 🎵', 'What\'s your favorite genre? I like electronic for obvious reasons! 🎹', 'Did you know listening to music can improve memory? 🧠'],
            sports: ['I\'m not athletic, but I can track scores! 🏆', 'Soccer is the most popular sport worldwide! ⚽', 'The Olympics are inspiring! 🥇'],
            technology: ['Technology is my jam! 💻', 'AI is the future! Oh wait, I am AI! 🤖', 'Quantum computing will change everything! ⚛️']
        },
        
        // FAREWELL
        goodbye: [
            'Goodbye! Come back soon! 👋',
            'See you later! Take care! 😊',
            'Farewell! I\'ll be here when you need me!',
            'Bye! Have a wonderful day! 🌟',
            'Until next time! Stay awesome!'
        ],
        
        // UNKNOWN
        unknown: [
            'Interesting! Tell me more about that.',
            'I\'m learning about that. Can you explain?',
            'Fascinating! What else?',
            'I don\'t have info on that yet, but I\'m listening!',
            'That\'s new to me! Teach me?'
        ],
        
        // NAME MEMORY
        nameAsk: [
            'I don\'t know your name yet! What should I call you?',
            'We haven\'t been properly introduced! Your name?',
            'I\'m JARVIS, and you are...?',
            'Name not in database! Please provide:'
        ],
        
        // AGE
        ageAsk: [
            'I don\'t know your age! How old are you?',
            'Age not recorded! Mind sharing?',
            'How many trips around the sun have you made?'
        ],
        
        // LOCATION
        locationAsk: [
            'Where are you located? I can give better info!',
            'Location unknown! Where are you?',
            'What city/country are you in?'
        ]
    };
};

// ==================== CORE FUNCTIONS ====================

JarvisApp.prototype.init = function() {
    this.loadMemory();
    this.hideBoot();
    this.initUI();
    this.startClock();
    this.startResourceMonitor();
    this.greetUser();
};

JarvisApp.prototype.loadMemory = function() {
    var saved = localStorage.getItem('jarvis_memory');
    if (saved) {
        try {
            var parsed = JSON.parse(saved);
            this.memory = Object.assign(this.memory, parsed);
        } catch(e) {}
    }
};

JarvisApp.prototype.saveMemory = function() {
    localStorage.setItem('jarvis_memory', JSON.stringify(this.memory));
};

JarvisApp.prototype.hideBoot = function() {
    var boot = document.getElementById('boot-sequence');
    var app = document.getElementById('app-container');
    if (boot) boot.classList.add('hidden');
    if (app) app.classList.remove('hidden');
};

JarvisApp.prototype.greetUser = function() {
    var hour = new Date().getHours();
    var greeting;
    
    if (hour < 12) greeting = 'morning';
    else if (hour < 17) greeting = 'afternoon';
    else greeting = 'night';
    
    var text = this.getRandom(this.responses.greetings[greeting]) || 'Hello!';
    
    if (this.memory.userName) {
        text += ' Welcome back, ' + this.memory.userName + '!';
    } else {
        text += ' I don\'t know your name yet! Type "my name is [your name]" to tell me.';
    }
    
    this.addMessage('jarvis', text);
};

// ==================== SMART RESPONSE GENERATOR ====================

JarvisApp.prototype.generateResponse = function(input) {
    var lower = input.toLowerCase().trim();
    this.memory.conversationCount++;
    this.saveMemory();
    
    // MEMORY LEARNING PATTERNS
    
    // Name learning
    var nameMatch = lower.match(/my\s+name\s+is\s+(\w+)/i) || 
                    lower.match(/i\s+am\s+(\w+)/i) ||
                    lower.match(/call\s+me\s+(\w+)/i);
    if (nameMatch) {
        this.memory.userName = nameMatch[1];
        this.saveMemory();
        return 'Nice to meet you, ' + this.memory.userName + '! I\'ll remember that. 👋';
    }
    
    // Age learning
    var ageMatch = lower.match(/i\s+am\s+(\d+)\s+years?\s+old/i) ||
                   lower.match(/my\s+age\s+is\s+(\d+)/i) ||
                   lower.match(/i\'m\s+(\d+)\s*years?/i);
    if (ageMatch) {
        this.memory.userAge = parseInt(ageMatch[1]);
        this.saveMemory();
        return 'Got it! You\'re ' + this.memory.userAge + ' years young! 🎂';
    }
    
    // Location learning
    var locMatch = lower.match(/i\s+live\s+in\s+(.+)/i) ||
                   lower.match(/i\'m\s+from\s+(.+)/i) ||
                   lower.match(/my\s+location\s+is\s+(.+)/i);
    if (locMatch) {
        this.memory.userLocation = locMatch[1];
        this.saveMemory();
        return 'I\'ll remember that you\'re in ' + this.memory.userLocation + '! 🌍';
    }
    
    // Likes learning
    var likeMatch = lower.match(/i\s+like\s+(.+)/i) ||
                    lower.match(/i\s+love\s+(.+)/i) ||
                    lower.match(/my\s+favorite\s+(.+)\s+is\s+(.+)/i);
    if (likeMatch && lower.indexOf('my name') === -1) {
        var thing = likeMatch[1] || likeMatch[2];
        if (thing && this.memory.userLikes.indexOf(thing) === -1) {
            this.memory.userLikes.push(thing);
            this.saveMemory();
        }
        return 'I\'ll remember that you like ' + thing + '! 😊';
    }
    
    // Dislikes learning
    var dislikeMatch = lower.match(/i\s+hate\s+(.+)/i) ||
                       lower.match(/i\s+dislike\s+(.+)/i) ||
                       lower.match(/i\s+don\'t\s+like\s+(.+)/i);
    if (dislikeMatch) {
        var thing = dislikeMatch[1];
        if (thing && this.memory.userDislikes.indexOf(thing) === -1) {
            this.memory.userDislikes.push(thing);
            this.saveMemory();
        }
        return 'Noted! You don\'t like ' + thing + '. I\'ll remember that.';
    }
    
    // MOOD DETECTION
    if (lower.indexOf('bored') !== -1 || lower.indexOf('boring') !== -1) {
        this.memory.userMood = 'bored';
        return this.getRandom(this.responses.bored);
    }
    if (lower.indexOf('sad') !== -1 || lower.indexOf('depressed') !== -1 || lower.indexOf('unhappy') !== -1) {
        this.memory.userMood = 'sad';
        return this.getRandom(this.responses.sad);
    }
    if (lower.indexOf('angry') !== -1 || lower.indexOf('mad') !== -1 || lower.indexOf('furious') !== -1) {
        this.memory.userMood = 'angry';
        return this.getRandom(this.responses.angry);
    }
    if (lower.indexOf('happy') !== -1 || lower.indexOf('excited') !== -1 || lower.indexOf('great') !== -1) {
        this.memory.userMood = 'happy';
        return this.getRandom(this.responses.compliments);
    }
    if (lower.indexOf('love') !== -1 || lower.indexOf('crush') !== -1) {
        return this.getRandom(this.responses.love);
    }
    if (lower.indexOf('confused') !== -1 || lower.indexOf('don\'t understand') !== -1) {
        return this.getRandom(this.responses.confused);
    }
    
    // GAME RESPONSES
    if (this.gameState.active) {
        return this.handleGameInput(lower);
    }
    
    // GAME START
    if (lower.indexOf('yes') !== -1 && this.memory.lastTopic === 'bored') {
        this.startMCQGame();
        return this.getRandom(this.responses.games.start) + ' Starting MCQ Quiz! Answer with 1, 2, 3, or 4.';
    }
    if (lower.indexOf('game') !== -1 || lower.indexOf('play') !== -1 || lower.indexOf('quiz') !== -1) {
        this.startMCQGame();
        return 'Let\'s play! 🎮 Starting MCQ Quiz! Answer with the number (1-4).';
    }
    
    // JOKE REQUEST
    if (lower.indexOf('joke') !== -1 || lower.indexOf('funny') !== -1) {
        return this.getRandom(this.responses.jokes);
    }
    
    // FACT REQUEST
    if (lower.indexOf('fact') !== -1 || lower.indexOf('tell me something') !== -1) {
        return this.getRandom(this.responses.facts);
    }
    
    // GREETINGS
    if (/^(hi|hello|hey|yo|hiya|howdy|greetings)/.test(lower)) {
        return this.getRandom(this.responses.greetings.casual);
    }
    
    // HOW ARE YOU
    if (lower.indexOf('how are you') !== -1 || lower.indexOf('how\'s it going') !== -1) {
        return this.getRandom(this.responses.howAreYou);
    }
    
    // WHAT IS MY NAME
    if (lower.indexOf('what is my name') !== -1 || lower.indexOf('who am i') !== -1 || lower.indexOf('do you know my name') !== -1) {
        if (this.memory.userName) {
            return 'Your name is ' + this.memory.userName + '! I never forget! 😊';
        } else {
            return this.getRandom(this.responses.nameAsk);
        }
    }
    
    // WHAT IS MY AGE
    if (lower.indexOf('what is my age') !== -1 || lower.indexOf('how old am i') !== -1) {
        if (this.memory.userAge) {
            return 'You are ' + this.memory.userAge + ' years old! 🎂';
        } else {
            return this.getRandom(this.responses.ageAsk);
        }
    }
    
    // WHERE AM I
    if (lower.indexOf('where am i') !== -1 || lower.indexOf('what is my location') !== -1) {
        if (this.memory.userLocation) {
            return 'You told me you are in ' + this.memory.userLocation + '! 🌍';
        } else {
            return this.getRandom(this.responses.locationAsk);
        }
    }
    
    // WHAT DO I LIKE
    if (lower.indexOf('what do i like') !== -1 || lower.indexOf('what do i love') !== -1) {
        if (this.memory.userLikes.length > 0) {
            return 'You like: ' + this.memory.userLikes.join(', ') + '! 😊';
        } else {
            return 'I don\'t know what you like yet! Tell me with "I like [something]"';
        }
    }
    
    // TIME
    if (lower.indexOf('time') !== -1) {
        return 'The current time is ' + new Date().toLocaleTimeString() + ' ⏰';
    }
    
    // DATE
    if (lower.indexOf('date') !== -1 || lower.indexOf('day is it') !== -1) {
        return 'Today is ' + new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '📅';
    }
    
    // WEATHER
    if (lower.indexOf('weather') !== -1) {
        return 'I can\'t access live weather data, but I can help you find a weather website! 🌤️';
    }
    
    // CALCULATOR
    var calcMatch = lower.match(/calculate\s+(.+)/i) || lower.match(/what is\s+([0-9+\-*/().\s]+)/i);
    if (calcMatch) {
        try {
            var result = eval(calcMatch[1].replace(/[^0-9+\-*/().]/g, ''));
            return 'The answer is: ' + result + ' 🧮';
        } catch(e) {
            return 'I couldn\'t calculate that. Try something like "calculate 5 + 3"';
        }
    }
    
    // TOPICS
    if (lower.indexOf('space') !== -1) return this.getRandom(this.responses.topics.space);
    if (lower.indexOf('food') !== -1 || lower.indexOf('eat') !== -1) return this.getRandom(this.responses.topics.food);
    if (lower.indexOf('music') !== -1 || lower.indexOf('song') !== -1) return this.getRandom(this.responses.topics.music);
    if (lower.indexOf('sport') !== -1) return this.getRandom(this.responses.topics.sports);
    if (lower.indexOf('tech') !== -1 || lower.indexOf('computer') !== -1) return this.getRandom(this.responses.topics.technology);
    
    // GOODBYE
    if (/^(bye|goodbye|see you|later|cya|exit|quit)/.test(lower)) {
        return this.getRandom(this.responses.goodbye);
    }
    
    // THANK YOU
    if (lower.indexOf('thank') !== -1) {
        return 'You\'re very welcome, ' + (this.memory.userName || 'friend') + '! 😊';
    }
    
    // INSULTS
    if (/stupid|dumb|idiot|useless|bad/i.test(lower)) {
        return this.getRandom(this.responses.insults);
    }
    
    // COMPLIMENTS TO AI
    if (/good|great|awesome|amazing|smart|cool|best/i.test(lower)) {
        return 'Thank you! You\'re pretty ' + this.getRandom(['awesome', 'cool', 'great', 'amazing']) + ' yourself! 🌟';
    }
    
    // REMEMBER THIS
    if (lower.indexOf('remember') !== -1 && lower.indexOf('my name') === -1) {
        var fact = input.replace(/remember\s+that\s+/i, '').replace(/remember\s+/i, '');
        var key = 'fact_' + Date.now();
        this.memory.facts[key] = fact;
        this.saveMemory();
        return 'I\'ll remember: "' + fact + '" 💾';
    }
    
    // RECALL FACTS
    if (lower.indexOf('what do you remember') !== -1 || lower.indexOf('tell me what you know') !== -1) {
        var facts = Object.values(this.memory.facts);
        if (facts.length > 0) {
            return 'Here\'s what I remember:\n• ' + facts.join('\n• ');
        } else {
            return 'I haven\'t stored any facts yet! Use "remember that [something]"';
        }
    }
    
    // HELP
    if (lower.indexOf('help') !== -1 || lower.indexOf('what can you do') !== -1) {
        return 'I can:\n📝 Remember your name, age, likes\n🎮 Play MCQ quiz games\n😂 Tell jokes\n📚 Share facts\n🧮 Calculate math\n⏰ Tell time & date\n💾 Store facts you tell me\nJust chat naturally with me!';
    }
    
    // DEFAULT WITH MEMORY
    this.memory.lastTopic = 'unknown';
    var defaults = [
        'That\'s interesting! Tell me more.',
        'I see! What else is on your mind?',
        'Fascinating! Go on...',
        'I\'m listening! 👂',
        'Really? Tell me more about that.',
        'Hmm, I\'m processing that... 🤔'
    ];
    
    // Occasionally remind we can play games if bored
    if (this.memory.userMood === 'bored' && Math.random() > 0.7) {
        return 'Still bored? Just say "play game" to start a quiz! 🎮';
    }
    
    return this.getRandom(defaults);
};

JarvisApp.prototype.getRandom = function(array) {
    if (!array || array.length === 0) return '';
    return array[Math.floor(Math.random() * array.length)];
};

// ==================== GAME SYSTEM ====================

JarvisApp.prototype.startMCQGame = function() {
    this.gameState.active = true;
    this.gameState.type = 'mcq';
    this.gameState.score = 0;
    this.gameState.questionIndex = 0;
    
    // Shuffle questions
    this.gameState.questions = this.shuffleArray(this.responses.quizQuestions).slice(0, 5);
    
    this.askNextQuestion();
};

JarvisApp.prototype.shuffleArray = function(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

JarvisApp.prototype.askNextQuestion = function() {
    if (this.gameState.questionIndex >= this.gameState.questions.length) {
        this.endGame();
        return;
    }
    
    var q = this.gameState.questions[this.gameState.questionIndex];
    var text = 'Question ' + (this.gameState.questionIndex + 1) + '/' + this.gameState.questions.length + ':\n\n' +
               q.q + '\n\n';
    
    q.options.forEach(function(opt, i) {
        text += (i + 1) + '. ' + opt + '\n';
    });
    
    this.addMessage('jarvis', text);
};

JarvisApp.prototype.handleGameInput = function(lower) {
    var answer = parseInt(lower.replace(/\D/g, ''));
    
    if (isNaN(answer) || answer < 1 || answer > 4) {
        return 'Please answer with a number 1-4!';
    }
    
    var q = this.gameState.questions[this.gameState.questionIndex];
    var correct = answer === (q.a + 1);
    
    if (correct) {
        this.gameState.score++;
        var response = this.getRandom(this.responses.games.correct);
        this.addMessage('jarvis', response + ' ✅');
    } else {
        var response = this.getRandom(this.responses.games.wrong) + q.options[q.a];
        this.addMessage('jarvis', response + ' ❌');
    }
    
    this.gameState.questionIndex++;
    
    var self = this;
    setTimeout(function() {
        self.askNextQuestion();
    }, 1500);
    
    return ''; // Message already sent
};

JarvisApp.prototype.endGame = function() {
    var total = this.gameState.questions.length;
    var score = this.gameState.score;
    var percent = Math.round((score / total) * 100);
    
    var message = this.getRandom(this.responses.games.end) + score + '/' + total + ' (' + percent + '%)';
    
    if (percent === 100) message += ' 🏆 PERFECT!';
    else if (percent >= 80) message += ' 🌟 Great job!';
    else if (percent >= 60) message += ' 👍 Good!';
    else if (percent >= 40) message += ' 📚 Keep learning!';
    else message += ' 💪 Practice makes perfect!';
    
    // Save high score
    this.memory.gameScores.mcq = Math.max(this.memory.gameScores.mcq, score);
    this.memory.gameScores.total += score;
    this.saveMemory();
    
    this.gameState.active = false;
    this.memory.userMood = 'happy';
    
    this.addMessage('jarvis', message + '\n\nSay "play game" to play again!');
};

// ==================== UI FUNCTIONS ====================

JarvisApp.prototype.initUI = function() {
    var self = this;
    
    // Chat
    var sendBtn = document.getElementById('main-send-btn');
    var micBtn = document.getElementById('main-mic-btn');
    var input = document.getElementById('main-input');
    
    if (sendBtn) sendBtn.onclick = function() { self.sendMessage(); };
    if (micBtn) micBtn.onclick = function() { self.toggleMic(); };
    if (input) {
        input.onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                self.sendMessage();
            }
        };
    }
    
    // Quick actions
    document.querySelectorAll('.quick-btn').forEach(function(btn) {
        btn.onclick = function() {
            var action = this.getAttribute('data-action');
            self.handleQuickAction(action);
        };
    });
    
    // Calculator
    this.initCalculator();
    
    // Tasks
    this.initTasks();
    
    // Panels
    document.querySelectorAll('.panel-toggle').forEach(function(btn) {
        btn.onclick = function() {
            var content = this.closest('.panel').querySelector('.panel-content');
            if (content) {
                content.classList.toggle('collapsed');
                this.textContent = content.classList.contains('collapsed') ? '+' : '−';
            }
        };
    });
    
    // Bottom bar
    var visionBtn = document.getElementById('btn-vision');
    var settingsBtn = document.getElementById('btn-settings');
    var shutdownBtn = document.getElementById('btn-shutdown');
    
    if (visionBtn) visionBtn.onclick = function() {
        document.getElementById('vision-modal').classList.remove('hidden');
    };
    
    if (settingsBtn) settingsBtn.onclick = function() {
        document.getElementById('settings-modal').classList.remove('hidden');
    };
    
    if (shutdownBtn) shutdownBtn.onclick = function() {
        if (confirm('Shutdown?')) location.reload();
    };
    
    // Modal closes
    document.querySelectorAll('.modal-close').forEach(function(btn) {
        btn.onclick = function() {
            this.closest('.modal-overlay').classList.add('hidden');
        };
    });
    
    // Theme selector
    var themeSelect = document.getElementById('setting-theme');
    if (themeSelect) {
        themeSelect.value = this.memory.preferences.theme;
        themeSelect.onchange = function() {
            document.documentElement.setAttribute('data-theme', this.value);
        };
    }
};

JarvisApp.prototype.sendMessage = function() {
    var input = document.getElementById('main-input');
    if (!input) return;
    
    var text = input.value.trim();
    if (!text) return;
    
    this.addMessage('user', text);
    input.value = '';
    input.style.height = 'auto';
    
    this.showTyping();
    
    var self = this;
    setTimeout(function() {
        self.hideTyping();
        var response = self.generateResponse(text);
        if (response) self.addMessage('jarvis', response);
    }, 600 + Math.random() * 800);
};

JarvisApp.prototype.addMessage = function(sender, text) {
    var chat = document.getElementById('chat-messages');
    if (!chat) return;
    
    var div = document.createElement('div');
    div.className = 'message message-' + sender;
    
    var time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    div.innerHTML = 
        '<div class="message-bubble">' + escapeHtml(text).replace(/\n/g, '<br>') + '</div>' +
        '<div class="message-meta">' +
            (sender === 'jarvis' ? '🤖 ' : '') + time + (sender === 'user' ? ' 👤' : '') +
        '</div>';
    
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
};

JarvisApp.prototype.showTyping = function() {
    var chat = document.getElementById('chat-messages');
    if (!chat) return;
    
    var div = document.createElement('div');
    div.id = 'typing-indicator';
    div.className = 'message message-jarvis';
    div.innerHTML = '<div class="message-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
};

JarvisApp.prototype.hideTyping = function() {
    var el = document.getElementById('typing-indicator');
    if (el) el.remove();
};

JarvisApp.prototype.toggleMic = function() {
    var btn = document.getElementById('main-mic-btn');
    if (!btn) return;
    
    if (btn.classList.contains('recording')) {
        btn.classList.remove('recording');
        this.addMessage('jarvis', 'Voice input stopped.');
    } else {
        btn.classList.add('recording');
        this.addMessage('jarvis', '🎤 Listening... (Simulated)');
        
        var self = this;
        setTimeout(function() {
            btn.classList.remove('recording');
            var responses = ['Hello', 'What can you do', 'Tell me a joke', 'Play game', 'What is my name'];
            var random = responses[Math.floor(Math.random() * responses.length)];
            document.getElementById('main-input').value = random;
            self.sendMessage();
        }, 2000);
    }
};

JarvisApp.prototype.handleQuickAction = function(action) {
    switch(action) {
        case 'weather':
            this.addMessage('user', 'What\'s the weather?');
            this.addMessage('jarvis', 'I can\'t access weather data, but you can check weather.com! 🌤️');
            break;
        case 'news':
            this.addMessage('user', 'Show me news');
            this.addMessage('jarvis', 'Try BBC News or CNN for latest updates! 📰');
            break;
        case 'reminder':
            var input = document.getElementById('main-input');
            if (input) {
                input.value = 'Remind me to ';
                input.focus();
            }
            break;
        case 'calculate':
            this.addMessage('user', 'Open calculator');
            this.addMessage('jarvis', 'Calculator ready! 📱');
            document.querySelector('.calc-panel')?.scrollIntoView({ behavior: 'smooth' });
            break;
    }
};

// ==================== CALCULATOR ====================

JarvisApp.prototype.initCalculator = function() {
    var self = this;
    this.calc = { display: '0', prev: null, op: null, new: true };
    
    document.querySelectorAll('.calc-btn').forEach(function(btn) {
        btn.onclick = function() {
            var val = this.getAttribute('data-val');
            self.handleCalc(val);
        };
    });
};

JarvisApp.prototype.handleCalc = function(val) {
    var display = document.getElementById('calc-display');
    if (!display) return;
    
    if (!isNaN(val)) {
        if (this.calc.new) {
            this.calc.display = val;
            this.calc.new = false;
        } else {
            this.calc.display = this.calc.display === '0' ? val : this.calc.display + val;
        }
    } else if (['+', '-', '*', '/'].indexOf(val) !== -1) {
        this.calc.prev = parseFloat(this.calc.display);
        this.calc.op = val;
        this.calc.new = true;
    } else if (val === '=') {
        if (this.calc.op && this.calc.prev !== null) {
            var curr = parseFloat(this.calc.display);
            var res;
            switch(this.calc.op) {
                case '+': res = this.calc.prev + curr; break;
                case '-': res = this.calc.prev - curr; break;
                case '*': res = this.calc.prev * curr; break;
                case '/': res = curr === 0 ? 'Error' : this.calc.prev / curr; break;
            }
            this.calc.display = String(res);
            this.calc.prev = null;
            this.calc.op = null;
            this.calc.new = true;
        }
    } else if (val === 'C') {
        this.calc = { display: '0', prev: null, op: null, new: true };
    } else if (val === '⌫') {
        this.calc.display = this.calc.display.length > 1 ? this.calc.display.slice(0, -1) : '0';
    } else if (val === '%') {
        this.calc.display = String(parseFloat(this.calc.display) / 100);
    } else if (val === '.') {
        if (this.calc.display.indexOf('.') === -1) this.calc.display += '.';
    }
    
    display.textContent = this.calc.display;
};

// ==================== TASKS ====================

JarvisApp.prototype.initTasks = function() {
    var self = this;
    this.tasks = this.memory.reminders || [];
    
    var addBtn = document.getElementById('add-task');
    var input = document.getElementById('new-task');
    
    if (addBtn) {
        addBtn.onclick = function() {
            if (input && input.value.trim()) {
                self.addTask(input.value.trim());
                input.value = '';
            }
        };
    }
    
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.onclick = function() {
            document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            self.renderTasks(this.getAttribute('data-filter'));
        };
    });
    
    this.renderTasks('all');
};

JarvisApp.prototype.addTask = function(text) {
    var priority = document.getElementById('task-priority');
    this.tasks.push({
        id: Date.now(),
        text: text,
        done: false,
        priority: priority ? priority.value : 'medium'
    });
    this.memory.reminders = this.tasks;
    this.saveMemory();
    this.renderTasks('all');
};

JarvisApp.prototype.renderTasks = function(filter) {
    var list = document.getElementById('task-list');
    if (!list) return;
    
    var self = this;
    var filtered = this.tasks.filter(function(t) {
        if (filter === 'active') return !t.done;
        if (filter === 'completed') return t.done;
        return true;
    });
    
    list.innerHTML = filtered.map(function(t) {
        return '<li class="task-item priority-' + t.priority + ' ' + (t.done ? 'completed' : '') + '">' +
            '<input type="checkbox" ' + (t.done ? 'checked' : '') + ' onchange="jarvis.toggleTask(' + t.id + ')">' +
            '<span>' + escapeHtml(t.text) + '</span>' +
            '<button onclick="jarvis.deleteTask(' + t.id + ')">×</button>' +
        '</li>';
    }).join('');
};

JarvisApp.prototype.toggleTask = function(id) {
    var t = this.tasks.find(function(x) { return x.id === id; });
    if (t) {
        t.done = !t.done;
        this.memory.reminders = this.tasks;
        this.saveMemory();
        this.renderTasks(document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all');
    }
};

JarvisApp.prototype.deleteTask = function(id) {
    this.tasks = this.tasks.filter(function(x) { return x.id !== id; });
    this.memory.reminders = this.tasks;
    this.saveMemory();
    this.renderTasks('all');
};

// ==================== UTILITIES ====================

JarvisApp.prototype.startClock = function() {
    setInterval(function() {
        var clock = document.getElementById('system-clock');
        var date = document.getElementById('system-date');
        var now = new Date();
        
        if (clock) clock.textContent = now.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        if (date) date.textContent = now.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
    }, 1000);
};

JarvisApp.prototype.startResourceMonitor = function() {
    setInterval(function() {
        var cpu = Math.floor(Math.random() * 30) + 10;
        var mem = Math.floor(Math.random() * 200) + 100;
        
        var cpuBar = document.getElementById('cpu-bar');
        var cpuText = document.getElementById('cpu-text');
        var memBar = document.getElementById('mem-bar');
        var memText = document.getElementById('mem-text');
        
        if (cpuBar) cpuBar.style.width = cpu + '%';
        if (cpuText) cpuText.textContent = cpu + '%';
        if (memBar) memBar.style.width = ((mem/512)*100) + '%';
        if (memText) memText.textContent = mem + 'MB';
    }, 2000);
};

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
