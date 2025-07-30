// Progress Dashboard Functionality
class ProgressDashboard {
    constructor() {
        // Use the same storage key as the main app
        this.STORAGE_KEY = "taskextreme_tasks";
        this.CHECKED_KEY = "taskextreme_checked";
        
        this.achievements = [
            {
                id: 'first-task',
                title: 'First Steps',
                description: 'Complete your first task',
                icon: '🎯',
                condition: () => this.getTotalCompletedTasks() >= 1
            },
            {
                id: 'streak-3',
                title: 'On Fire',
                description: 'Complete tasks for 3 consecutive days',
                icon: '🔥',
                condition: () => this.getCurrentStreak() >= 3
            },
            {
                id: 'streak-7',
                title: 'Week Warrior',
                description: 'Complete tasks for 7 consecutive days',
                icon: '🏆',
                condition: () => this.getCurrentStreak() >= 7
            },
            {
                id: 'perfect-day',
                title: 'Perfect Day',
                description: 'Complete all tasks for a day',
                icon: '⭐',
                condition: () => this.getTodayCompletionRate() === 100
            },
            {
                id: 'category-master',
                title: 'Category Master',
                description: 'Complete tasks in 5 different categories',
                icon: '🎨',
                condition: () => this.getCompletedCategories().length >= 5
            },
            {
                id: 'early-bird',
                title: 'Early Bird',
                description: 'Complete a task before 9 AM',
                icon: '🌅',
                condition: () => this.hasEarlyTask()
            }
        ];

        this.productivityTips = [
            {
                title: 'Start with the Most Important Task',
                text: 'Tackle your highest priority task first thing in the morning when your energy is highest.',
                icon: '🎯'
            },
            {
                title: 'Use the Pomodoro Technique',
                text: 'Work in focused 25-minute sessions with 5-minute breaks to maintain concentration.',
                icon: '⏰'
            },
            {
                title: 'Break Down Large Tasks',
                text: 'Divide complex tasks into smaller, manageable subtasks to avoid feeling overwhelmed.',
                icon: '✂️'
            },
            {
                title: 'Eliminate Distractions',
                text: 'Turn off notifications and find a quiet space to focus on your tasks.',
                icon: '🔇'
            },
            {
                title: 'Review and Reflect',
                text: 'Take time at the end of each day to review your progress and plan for tomorrow.',
                icon: '📝'
            }
        ];

        this.init();
    }

    init() {
        // Wait a bit for the main app to initialize
        setTimeout(() => {
            this.updateDashboard();
        }, 500);
        
        this.setupEventListeners();
        
        // Update dashboard every minute
        setInterval(() => {
            this.updateDashboard();
        }, 60000);

        // Update dashboard when section is expanded
        const dashboardSection = document.getElementById('progress-dashboard-section');
        if (dashboardSection) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const content = dashboardSection.querySelector('.section-content');
                        if (content && !content.classList.contains('collapsed')) {
                            // Dashboard was expanded, update it
                            setTimeout(() => {
                                this.updateDashboard();
                            }, 100);
                        }
                    }
                });
            });
            
            observer.observe(dashboardSection, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    setupEventListeners() {
        // Listen for task completion events
        document.addEventListener('taskCompleted', () => {
            console.log('Dashboard: Task completed event received');
            this.updateDashboard();
            this.checkAchievements();
        });

        document.addEventListener('taskAdded', () => {
            console.log('Dashboard: Task added event received');
            this.updateDashboard();
        });

        document.addEventListener('taskDeleted', () => {
            console.log('Dashboard: Task deleted event received');
            this.updateDashboard();
        });

        // Also listen for storage changes
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY || e.key === this.CHECKED_KEY) {
                console.log('Dashboard: Storage change detected');
                this.updateDashboard();
            }
        });

        // Manual refresh button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Dashboard: Manual refresh requested');
                this.updateDashboard();
                
                // Add visual feedback
                const refreshIcon = refreshBtn.querySelector('.refresh-icon');
                refreshIcon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    refreshIcon.style.transform = 'rotate(0deg)';
                }, 500);
            });
        }

        // Test chart button
        const testBtn = document.getElementById('test-chart');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                console.log('Dashboard: Test chart requested');
                this.testWeeklyChart();
                this.updateDashboard();
            });
        }
    }

    updateDashboard() {
        console.log('Dashboard: Updating dashboard...');
        this.updateStats();
        this.updateWeeklyChart();
        this.updateCategoryChart();
        this.updateAchievements();
        this.updateProductivityTips();
    }

    updateStats() {
        const completedToday = this.getCompletedToday();
        const totalToday = this.getTotalToday();
        const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
        const currentStreak = this.getCurrentStreak();

        console.log('Dashboard Stats:', { completedToday, totalToday, completionRate, currentStreak });

        const completedElement = document.getElementById('completed-today');
        const totalElement = document.getElementById('total-today');
        const rateElement = document.getElementById('completion-rate');
        const streakElement = document.getElementById('current-streak');

        if (completedElement) completedElement.textContent = completedToday;
        if (totalElement) totalElement.textContent = totalToday;
        if (rateElement) rateElement.textContent = completionRate + '%';
        if (streakElement) streakElement.textContent = currentStreak;
    }

    updateWeeklyChart() {
        const weeklyData = this.getWeeklyData();
        
        console.log('Weekly Data:', weeklyData);

        weeklyData.forEach((day, index) => {
            const bar = document.querySelector(`[data-day="${day.name}"]`);
            console.log(`Looking for bar with data-day="${day.name}":`, bar);
            
            if (bar) {
                const barFill = bar.querySelector('.bar-fill');
                // Simple scaling: 15px per task completed
                const height = Math.max(8, day.completed * 15); // 8px minimum, 15px per task
                
                console.log(`Setting bar ${day.name}: completed=${day.completed}, height=${height}px`);
                
                barFill.style.height = height + 'px';
                barFill.setAttribute('data-value', day.completed);
                
                // Highlight today's bar
                if (day.isToday) {
                    bar.classList.add('today');
                    console.log(`Today's bar: ${day.name}`);
                } else {
                    bar.classList.remove('today');
                }
            } else {
                console.error(`Bar not found for day: ${day.name}`);
            }
        });
    }

    updateCategoryChart() {
        const categoryData = this.getCategoryData();
        const container = document.querySelector('.category-items');
        
        if (!container) return;

        console.log('Category Data:', categoryData);

        container.innerHTML = '';
        
        categoryData.forEach(category => {
            const percentage = category.total > 0 ? (category.completed / category.total) * 100 : 0;
            
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <div class="category-icon">${category.icon}</div>
                <div class="category-info">
                    <div class="category-name">${category.name}</div>
                    <div class="category-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="category-count">${category.completed}/${category.total}</div>
                    </div>
                </div>
            `;
            
            container.appendChild(categoryItem);
        });
    }

    updateAchievements() {
        const container = document.getElementById('achievements-grid');
        if (!container) return;

        container.innerHTML = '';
        
        this.achievements.forEach(achievement => {
            const isEarned = achievement.condition();
            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement-card ${isEarned ? 'earned' : 'locked'}`;
            
            achievementCard.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            `;
            
            container.appendChild(achievementCard);
        });
    }

    updateProductivityTips() {
        const container = document.getElementById('productivity-tips');
        if (!container) return;

        container.innerHTML = '';
        
        // Show 3 random tips
        const shuffledTips = this.productivityTips.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        shuffledTips.forEach(tip => {
            const tipCard = document.createElement('div');
            tipCard.className = 'tip-card';
            
            tipCard.innerHTML = `
                <div class="tip-icon">${tip.icon}</div>
                <div class="tip-content">
                    <div class="tip-title">${tip.title}</div>
                    <div class="tip-text">${tip.text}</div>
                </div>
            `;
            
            container.appendChild(tipCard);
        });
    }

    checkAchievements() {
        this.achievements.forEach(achievement => {
            if (achievement.condition()) {
                this.showAchievementNotification(achievement);
            }
        });
    }

    showAchievementNotification(achievement) {
        // Check if achievement was already earned
        const earnedAchievements = JSON.parse(localStorage.getItem('earnedAchievements') || '[]');
        if (earnedAchievements.includes(achievement.id)) return;

        // Add to earned achievements
        earnedAchievements.push(achievement.id);
        localStorage.setItem('earnedAchievements', JSON.stringify(earnedAchievements));

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-notification-content">
                <div class="achievement-notification-icon">${achievement.icon}</div>
                <div class="achievement-notification-text">
                    <div class="achievement-notification-title">Achievement Unlocked!</div>
                    <div class="achievement-notification-description">${achievement.title}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Data calculation methods - Updated to use the same storage as main app
    getCompletedToday() {
        const today = new Date().toDateString();
        const tasks = this.getTasks();
        const checked = this.getChecked();
        
        return tasks.filter(task => {
            const taskDate = new Date(task.date).toDateString();
            return taskDate === today && checked[task.id];
        }).length;
    }

    getTotalToday() {
        const today = new Date().toDateString();
        const tasks = this.getTasks();
        
        return tasks.filter(task => {
            const taskDate = new Date(task.date).toDateString();
            return taskDate === today;
        }).length;
    }

    getTodayCompletionRate() {
        const completed = this.getCompletedToday();
        const total = this.getTotalToday();
        return total > 0 ? (completed / total) * 100 : 0;
    }

    getCurrentStreak() {
        const tasks = this.getTasks();
        const checked = this.getChecked();
        
        const completedDates = [...new Set(
            tasks.filter(task => checked[task.id])
                .map(task => new Date(task.date).toDateString())
        )].sort();

        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateString = checkDate.toDateString();
            
            if (completedDates.includes(dateString)) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    getWeeklyData() {
        const tasks = this.getTasks();
        const checked = this.getChecked();
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const today = new Date();
        
        // Calculate the start of the current week (Monday)
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + mondayOffset);
        
        return weekDays.map((day, index) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + index);
            const dateString = dayDate.toDateString();
            
            const dayTasks = tasks.filter(task => {
                const taskDate = new Date(task.date).toDateString();
                return taskDate === dateString;
            });
            
            return {
                name: day,
                completed: dayTasks.filter(task => checked[task.id]).length,
                total: dayTasks.length,
                isToday: dayDate.toDateString() === today.toDateString()
            };
        });
    }

    getCategoryData() {
        const tasks = this.getTasks();
        const checked = this.getChecked();
        const today = new Date().toDateString();
        const todayTasks = tasks.filter(task => {
            const taskDate = new Date(task.date).toDateString();
            return taskDate === today;
        });

        const categoryMap = {
            work: { name: 'Work', icon: '💼', completed: 0, total: 0 },
            personal: { name: 'Personal', icon: '👤', completed: 0, total: 0 },
            health: { name: 'Health', icon: '🏥', completed: 0, total: 0 },
            education: { name: 'Education', icon: '📚', completed: 0, total: 0 },
            finance: { name: 'Finance', icon: '💰', completed: 0, total: 0 },
            home: { name: 'Home', icon: '🏠', completed: 0, total: 0 },
            social: { name: 'Social', icon: '👥', completed: 0, total: 0 },
            hobby: { name: 'Hobby', icon: '🎨', completed: 0, total: 0 }
        };

        todayTasks.forEach(task => {
            if (categoryMap[task.category]) {
                categoryMap[task.category].total++;
                if (checked[task.id]) {
                    categoryMap[task.category].completed++;
                }
            }
        });

        return Object.values(categoryMap).filter(category => category.total > 0);
    }

    getTotalCompletedTasks() {
        const tasks = this.getTasks();
        const checked = this.getChecked();
        return tasks.filter(task => checked[task.id]).length;
    }

    getCompletedCategories() {
        const tasks = this.getTasks();
        const checked = this.getChecked();
        const completedTasks = tasks.filter(task => checked[task.id]);
        return [...new Set(completedTasks.map(task => task.category))];
    }

    hasEarlyTask() {
        const tasks = this.getTasks();
        const checked = this.getChecked();
        return tasks.some(task => {
            if (!checked[task.id] || !task.timeStart) return false;
            const hour = parseInt(task.timeStart.split(':')[0]);
            return hour < 9;
        });
    }

    // Helper methods to get data from localStorage
    getTasks() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading tasks for dashboard:', error);
            return [];
        }
    }

    getChecked() {
        try {
            const stored = localStorage.getItem(this.CHECKED_KEY);
            const checked = stored ? JSON.parse(stored) : {};
            
            // Clean up checked state to use numeric IDs
            const cleanedChecked = {};
            Object.keys(checked).forEach(key => {
                const numericKey = parseFloat(key);
                if (!isNaN(numericKey)) {
                    cleanedChecked[numericKey] = checked[key];
                }
            });
            return cleanedChecked;
        } catch (error) {
            console.error('Error loading checked state for dashboard:', error);
            return {};
        }
    }

    // Debug function to test weekly chart
    testWeeklyChart() {
        console.log('=== Testing Weekly Chart ===');
        console.log('All tasks:', this.getTasks());
        console.log('Checked state:', this.getChecked());
        console.log('Weekly data:', this.getWeeklyData());
        
        // Test with some sample data
        const testData = [
            { name: 'Mon', completed: 3, total: 5, isToday: false },
            { name: 'Tue', completed: 2, total: 4, isToday: false },
            { name: 'Wed', completed: 5, total: 5, isToday: true },
            { name: 'Thu', completed: 1, total: 3, isToday: false },
            { name: 'Fri', completed: 0, total: 2, isToday: false },
            { name: 'Sat', completed: 2, total: 2, isToday: false },
            { name: 'Sun', completed: 1, total: 1, isToday: false }
        ];
        
        console.log('Test data:', testData);
        
        const maxValue = Math.max(...testData.map(day => day.completed), 1);
        console.log('Test max value:', maxValue);
        
        testData.forEach(day => {
            const height = (day.completed / maxValue) * 100;
            console.log(`${day.name}: ${day.completed}/${day.total} = ${height}% height`);
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Progress Dashboard...');
    new ProgressDashboard();
}); 