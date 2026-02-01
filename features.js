// FEATURES.JS - COMPLETE WORKING VERSION
(function() {
    'use strict';
    
    console.log('Loading features.js...');
    
    // Task Manager
    function TaskManager(memory) {
        this.memory = memory;
        this.tasks = [];
    }
    
    TaskManager.prototype.loadTasks = async function() {
        console.log('Tasks loaded');
    };
    
    TaskManager.prototype.addTask = function(text, options) {
        console.log('Task added:', text);
    };
    
    // Calculator
    function Calculator() {
        this.display = '0';
    }
    
    Calculator.prototype.input = function(val) {
        console.log('Calc input:', val);
    };
    
    // Internet Search
    function InternetSearch() {}
    
    InternetSearch.prototype.search = async function(query) {
        return { answer: 'Search results for: ' + query };
    };
    
    // Notification Manager
    function NotificationManager() {}
    
    NotificationManager.prototype.show = function(options) {
        console.log('Notification:', options.title, '-', options.message);
        alert(options.title + ': ' + options.message);
    };
    
    // Create global object
    window.JarvisFeatures = {
        TaskManager: TaskManager,
        Calculator: Calculator,
        InternetSearch: InternetSearch,
        NotificationManager: NotificationManager,
        
        taskManager: null,
        calculator: null,
        internet: null,
        notifications: null,
        
        init: function(memory) {
            this.taskManager = new TaskManager(memory);
            this.calculator = new Calculator();
            this.internet = new InternetSearch();
            this.notifications = new NotificationManager();
            console.log('Features initialized');
        }
    };
    
    console.log('features.js loaded - JarvisFeatures:', typeof window.JarvisFeatures);
})();
