// Enhanced Focus Mode - Advanced Tomodoro Timer Implementation
document.addEventListener('DOMContentLoaded', () => {
    const focusBtn = document.getElementById('focus-mode-btn');
    
    if (!focusBtn) return;
    
    focusBtn.addEventListener('click', () => {
        // Get current day's tasks
        const currentTasks = Array.from(document.querySelectorAll('.task-item'))
            .filter(task => !task.classList.contains('empty-state') && task.style.display !== 'none');
        
        if (currentTasks.length === 0) {
            showFormFeedback('No tasks available for focus mode! Add some tasks first.', 'error');
            return;
        }

        createEnhancedFocusMode(currentTasks);
    });
});

// Focus session data for analytics
let focusSessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');

function createEnhancedFocusMode(tasks) {
    // Remove existing overlay if any
    const existingOverlay = document.getElementById('focus-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    const focusOverlay = document.createElement('div');
    focusOverlay.id = 'focus-overlay';
    
    let currentTaskIndex = 0;
    let timerInterval;
    let timeLeft = 25 * 60; // 25 minutes default
    let isRunning = false;
    let isBreak = false;
    let sessionStartTime = null;
    let completedSessions = 0;
    let totalFocusTime = 0;
    let currentSessionType = 'work';
    let ambientSound = null;
    
    // Initialize ambient sound options
    const audioOptions = [
        { name: 'No musique', file: null },
        { name: 'Calm piano', file: './audio/Calm piano.mp3' },
        { name: 'Jazz soft', file: './audio/Jazz soft.mp3' },
        { name: 'Heavy rain', file: './audio/Heavy rain.mp3' },
        { name: 'Underwater white noise', file: './audio/Underwater white noise.mp3' },
        { name: 'Blossoming Love', file: './audio/Blossoming Love.mp3' }
    ];
    
    let currentAudioIndex = 0; // Default to "No musique"
    
    // Timer presets
    const timerPresets = {
        'quick': { work: 15, break: 3, name: 'Quick Focus' },
        'standard': { work: 25, break: 5, name: 'Standard Pomodoro' },
        'long': { work: 45, break: 10, name: 'Deep Focus' },
        'custom': { work: 30, break: 7, name: 'Custom' }
    };
    
    let currentPreset = 'standard';
    
    // Smart break suggestions based on task type
    const breakSuggestions = {
        'work': [
            'Take a short walk to refresh your mind',
            'Do some light stretching exercises',
            'Look away from screen for 20 seconds',
            'Get a glass of water and hydrate'
        ],
        'health': [
            'Do some quick exercises',
            'Take deep breathing exercises',
            'Stand up and move around',
            'Do some neck and shoulder stretches'
        ],
        'education': [
            'Review what you just learned',
            'Take notes on key points',
            'Discuss concepts with yourself',
            'Visualize the information'
        ],
        'personal': [
            'Reflect on your progress',
            'Plan your next steps',
            'Celebrate small wins',
            'Take a moment to relax'
        ]
    };
    
    function getCurrentTaskCategory() {
        if (currentTaskIndex < tasks.length) {
            const currentTask = tasks[currentTaskIndex];
            const categoryBadge = currentTask.querySelector('.task-category-badge');
            return categoryBadge ? categoryBadge.getAttribute('data-category') : 'work';
        }
        return 'work';
    }
    
    function getBreakSuggestion() {
        const category = getCurrentTaskCategory();
        const suggestions = breakSuggestions[category] || breakSuggestions['work'];
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeDisplay = document.getElementById('focus-time');
        if (timeDisplay) {
            timeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
        
        // Update circular progress bar and needle
        const progressBar = document.getElementById('timer-progress');
        const needle = document.querySelector('.timer-progress-needle');
        const totalTime = timerPresets[currentPreset].work * 60;
        const progress = ((totalTime - timeLeft) / totalTime);
        const angle = progress * 360;
        if (progressBar) {
            progressBar.style.background = `conic-gradient(var(--accent) 0deg, var(--accent) ${angle}deg, transparent ${angle}deg, transparent 360deg)`;
        }
        if (needle) {
            // Place the needle at the correct angle (start at top, rotate clockwise)
            needle.style.transform = `translateX(-50%) rotate(${angle}deg) translateY(-90px)`;
        }
    }
    
    function startTimer() {
        if (!isRunning) {
            isRunning = true;
            sessionStartTime = Date.now();
            
            // Start ambient sound if enabled
            if (ambientSound) {
                ambientSound.play().catch(e => console.log('Audio not supported'));
            }
            
            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimer();
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    isRunning = false;
                    
                    // Stop ambient sound
                    if (ambientSound) {
                        ambientSound.pause();
                        ambientSound.currentTime = 0;
                    }
                    
                    // Play notification sound
                    playNotificationSound();
                    
                    if (isBreak) {
                        // Break finished, start work session
                        timeLeft = timerPresets[currentPreset].work * 60;
                        isBreak = false;
                        currentSessionType = 'work';
                        updateTaskDisplay();
                        showNotification('Break finished! Time to work! 🚀', 'success');
                    } else {
                        // Work session finished, start break
                        completedSessions++;
                        totalFocusTime += timerPresets[currentPreset].work;
                        timeLeft = timerPresets[currentPreset].break * 60;
                        isBreak = true;
                        currentSessionType = 'break';
                        
                        const suggestion = getBreakSuggestion();
                        showNotification(`Work session completed! Take a ${timerPresets[currentPreset].break}-minute break. 💡 ${suggestion}`, 'success');
                    }
                    updateTimer();
                    updateSessionStats();
                }
            }, 1000);
        }
    }
    
    function pauseTimer() {
        if (isRunning) {
            clearInterval(timerInterval);
            isRunning = false;
            
            // Pause ambient sound
            if (ambientSound) {
                ambientSound.pause();
            }
        }
    }
    
    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = isBreak ? timerPresets[currentPreset].break * 60 : timerPresets[currentPreset].work * 60;
        updateTimer();
        
        // Stop ambient sound
        if (ambientSound) {
            ambientSound.pause();
            ambientSound.currentTime = 0;
        }
    }
    
    function changePreset(preset) {
        currentPreset = preset;
        resetTimer();
        updatePresetDisplay();
    }
    
    function updatePresetDisplay() {
        const presetDisplay = document.getElementById('preset-display');
        if (presetDisplay) {
            presetDisplay.textContent = timerPresets[currentPreset].name;
        }
    }
    
    function updateTaskDisplay() {
        const taskTitle = document.getElementById('focus-task-title');
        const taskDetails = document.getElementById('focus-task-details');
        const sessionType = document.getElementById('session-type');
        const taskCategory = document.getElementById('task-category');
        
        if (currentTaskIndex < tasks.length) {
            const currentTask = tasks[currentTaskIndex];
            const title = currentTask.querySelector('.task-title')?.textContent || 'Current Task';
            const details = currentTask.querySelector('.task-details')?.textContent || '';
            const category = getCurrentTaskCategory();
            
            if (taskTitle) taskTitle.textContent = title;
            if (taskDetails) taskDetails.textContent = details;
            if (sessionType) sessionType.textContent = isBreak ? 'Break Time' : 'Focus Session';
            if (taskCategory) {
                taskCategory.textContent = getCategoryEmoji(category);
                taskCategory.className = `task-category-badge ${category}`;
            }
        }
    }
    
    function getCategoryEmoji(category) {
        const emojis = {
            'work': '💼',
            'personal': '👤',
            'health': '🏥',
            'education': '📚',
            'finance': '💰',
            'home': '🏠',
            'social': '👥',
            'hobby': '🎨'
        };
        return emojis[category] || '📋';
    }
    
    function nextTask() {
        if (currentTaskIndex < tasks.length - 1) {
            currentTaskIndex++;
            updateTaskDisplay();
            resetTimer();
        } else {
            showNotification('All tasks completed! Great job! 🎉', 'success');
            saveFocusSession();
        }
    }
    
    function markComplete() {
        if (currentTaskIndex < tasks.length) {
            const currentTask = tasks[currentTaskIndex];
            const checkbox = currentTask.querySelector('.task-checkbox');
            if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
            }
            nextTask();
        }
    }
    
    function updateSessionStats() {
        const statsDisplay = document.getElementById('session-stats');
        if (statsDisplay) {
            statsDisplay.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Sessions:</span>
                    <span class="stat-value">${completedSessions}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Focus Time:</span>
                    <span class="stat-value">${Math.round(totalFocusTime)}m</span>
                </div>
            `;
        }
    }
    
    function saveFocusSession() {
        const session = {
            date: new Date().toISOString(),
            completedSessions,
            totalFocusTime,
            tasksCompleted: currentTaskIndex + 1,
            preset: currentPreset
        };
        
        focusSessions.push(session);
        localStorage.setItem('focusSessions', JSON.stringify(focusSessions));
    }
    
    function playNotificationSound() {
        // Create a simple notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    function toggleAmbientSound() {
        const soundBtn = document.getElementById('ambient-sound-btn');
        if (ambientSound) {
            if (ambientSound.paused) {
                ambientSound.play().catch(e => console.log('Audio not supported'));
                soundBtn.innerHTML = '<span class="btn-icon">🔊</span><span class="btn-text">Sound On</span>';
            } else {
                ambientSound.pause();
                soundBtn.innerHTML = '<span class="btn-icon">🔇</span><span class="btn-text">Sound Off</span>';
            }
        }
    }
    
    function toggleAudioDropdown() {
        const dropdownMenu = document.getElementById('audio-dropdown-menu');
        const dropdownBtn = document.getElementById('audio-dropdown-btn');
        
        dropdownMenu.classList.toggle('show');
        dropdownBtn.classList.toggle('active');
    }
    
    function selectAudio(index) {
        currentAudioIndex = index;
        const selectedAudio = audioOptions[index];
        
        // Stop current audio if playing
        if (ambientSound) {
            ambientSound.pause();
            ambientSound.currentTime = 0;
        }
        
        // Update dropdown button text
        const dropdownBtn = document.getElementById('audio-dropdown-btn');
        dropdownBtn.querySelector('.btn-text').textContent = selectedAudio.name;
        
        // Initialize new audio if selected
        if (selectedAudio.file) {
            ambientSound = new Audio(selectedAudio.file);
            ambientSound.loop = true;
            ambientSound.volume = 0.3;
            
            // If timer is currently running, start the new audio immediately
            if (isRunning) {
                ambientSound.play().catch(e => console.log('Audio not supported'));
            }
        } else {
            ambientSound = null;
        }
        
        // Update active state in dropdown
        document.querySelectorAll('.audio-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-index="${index}"]`).classList.add('active');
        
        // Close dropdown
        document.getElementById('audio-dropdown-menu').classList.remove('show');
        document.getElementById('audio-dropdown-btn').classList.remove('active');
    }
    
    function showNotification(message, type) {
        showFormFeedback(message, type);
    }
    
    // Create enhanced focus mode UI
    focusOverlay.innerHTML = `
        <div class="focus-container">
            <button id="exit-focus" class="focus-exit" title="Exit Focus Mode">✕</button>
            
            <div class="focus-header">
                <h2 id="session-type">Focus Session</h2>
                <p class="focus-subtitle">Enhanced Tomodoro Technique</p>
            </div>
            
            <div class="focus-task">
                <div class="task-header">
                    <span id="task-category" class="task-category-badge">📋</span>
                    <h3 id="focus-task-title">Loading task...</h3>
                </div>
                <p id="focus-task-details"></p>
            </div>
            
            <div class="focus-timer">
                <div class="timer-display">
                    <div class="timer-progress-container">
                        <div class="timer-progress-outline"></div>
                        <div id="timer-progress" class="timer-progress-bar"></div>
                        <div class="timer-progress-needle"></div>
                        <span id="focus-time">25:00</span>
                    </div>
                </div>
                
                <div class="preset-selector">
                    <label for="preset-select">Timer Preset:</label>
                    <select id="preset-select" class="preset-select">
                        <option value="quick">Quick Focus (15/3)</option>
                        <option value="standard" selected>Standard Pomodoro (25/5)</option>
                        <option value="long">Deep Focus (45/10)</option>
                        <option value="custom">Custom (30/7)</option>
                    </select>
                </div>
                
                <div class="focus-controls">
                    <button id="focus-start" class="timer-btn start-btn">
                        <span class="btn-icon">▶️</span>
                        <span class="btn-text">Start</span>
                    </button>
                    <button id="focus-pause" class="timer-btn pause-btn" style="display: none;">
                        <span class="btn-icon">⏸️</span>
                        <span class="btn-text">Pause</span>
                    </button>
                    <button id="focus-reset" class="timer-btn reset-btn">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">Reset</span>
                    </button>
                    <div class="audio-dropdown">
                        <button id="audio-dropdown-btn" class="timer-btn audio-dropdown-btn" title="Select Ambient Sound">
                            <span class="btn-icon">🎵</span>
                            <span class="btn-text">No musique</span>
                            <span class="dropdown-arrow">▼</span>
                        </button>
                        <div id="audio-dropdown-menu" class="audio-dropdown-menu">
                            <div class="audio-option" data-index="0">
                                <span class="audio-icon">🔇</span>
                                <span class="audio-name">No musique</span>
                            </div>
                            <div class="audio-option" data-index="1">
                                <span class="audio-icon">🎹</span>
                                <span class="audio-name">Calm piano</span>
                            </div>
                            <div class="audio-option" data-index="2">
                                <span class="audio-icon">🎷</span>
                                <span class="audio-name">Jazz soft</span>
                            </div>
                            <div class="audio-option" data-index="3">
                                <span class="audio-icon">🌧️</span>
                                <span class="audio-name">Heavy rain</span>
                            </div>
                            <div class="audio-option" data-index="4">
                                <span class="audio-icon">🌊</span>
                                <span class="audio-name">Underwater white noise</span>
                            </div>
                            <div class="audio-option" data-index="5">
                                <span class="audio-icon">💕</span>
                                <span class="audio-name">Blossoming Love</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="task-progress">
                <div class="progress-info">
                    <span>Task ${currentTaskIndex + 1} of ${tasks.length}</span>
                    <div id="session-stats" class="session-stats">
                        <div class="stat-item">
                            <span class="stat-label">Sessions:</span>
                            <span class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Focus Time:</span>
                            <span class="stat-value">0m</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button id="focus-complete" class="action-btn complete-btn">
                        <span class="btn-icon">✅</span>
                        <span class="btn-text">Mark Complete</span>
                    </button>
                    <button id="focus-next" class="action-btn next-btn">
                        <span class="btn-icon">⏭️</span>
                        <span class="btn-text">Next Task</span>
                    </button>
                </div>
            </div>
            
            <div class="focus-tips">
                <p id="break-suggestion">💡 Tip: Focus on one task at a time. Take breaks to maintain productivity.</p>
            </div>
        </div>
    `;

    document.body.appendChild(focusOverlay);
    document.body.style.overflow = 'hidden';
    
    // Initialize display
    updateTaskDisplay();
    updateTimer();
    updatePresetDisplay();
    updateSessionStats();
    
    // Event listeners
    document.getElementById('focus-start').addEventListener('click', () => {
        startTimer();
        document.getElementById('focus-start').style.display = 'none';
        document.getElementById('focus-pause').style.display = 'inline-flex';
    });
    
    document.getElementById('focus-pause').addEventListener('click', () => {
        pauseTimer();
        document.getElementById('focus-start').style.display = 'inline-flex';
        document.getElementById('focus-pause').style.display = 'none';
    });
    
    document.getElementById('focus-reset').addEventListener('click', resetTimer);
    document.getElementById('focus-complete').addEventListener('click', markComplete);
    document.getElementById('focus-next').addEventListener('click', nextTask);
    document.getElementById('audio-dropdown-btn').addEventListener('click', toggleAudioDropdown);
    
    document.getElementById('preset-select').addEventListener('change', (e) => {
        changePreset(e.target.value);
    });
    
    // Audio dropdown event listeners
    document.querySelectorAll('.audio-option').forEach(option => {
        option.addEventListener('click', () => {
            const index = parseInt(option.getAttribute('data-index'));
            selectAudio(index);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.querySelector('.audio-dropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            document.getElementById('audio-dropdown-menu').classList.remove('show');
            document.getElementById('audio-dropdown-btn').classList.remove('active');
        }
    });
    
    // Exit handlers
    document.getElementById('exit-focus').addEventListener('click', exitFocus);
    focusOverlay.addEventListener('click', (e) => {
        if (e.target === focusOverlay) exitFocus();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') exitFocus();
        if (e.key === ' ') {
            e.preventDefault();
            if (isRunning) {
                pauseTimer();
                document.getElementById('focus-start').style.display = 'inline-flex';
                document.getElementById('focus-pause').style.display = 'none';
            } else {
                startTimer();
                document.getElementById('focus-start').style.display = 'none';
                document.getElementById('focus-pause').style.display = 'inline-flex';
            }
        }
    });
    
    function exitFocus() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        if (ambientSound) {
            ambientSound.pause();
        }
        saveFocusSession();
        document.body.removeChild(focusOverlay);
        document.body.style.overflow = '';
    }
}