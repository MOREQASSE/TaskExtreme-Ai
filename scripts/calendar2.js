document.addEventListener('DOMContentLoaded', () => {
    const calendarContainer = document.getElementById('calendar-container');
    
    // Helper function to get date string in YYYY-MM-DD format without timezone issues
    function getDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    function renderCalendar() {
        console.log('Rendering calendar...');
        console.log('Available tasks:', window.tasks);
        
        const today = new Date();
        const month = today.getMonth();
        const year = today.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let html = `
            <div class="calendar-header">
                <h3>${today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            </div>
            <div class="calendar-days">${['S','M','T','W','T','F','S'].map(d => `<div>${d}</div>`).join('')}</div>
            <div class="calendar-grid">
        `;

        // Empty cells for days before 1st
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="day empty"></div>`;
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = getDateString(date); // Use local date string instead of ISO
            const isToday = day === today.getDate();
            
            // Get tasks for this specific date using the global tasks array
            const globalTasks = window.tasks || [];
            console.log(`Checking tasks for ${dateStr}:`, globalTasks.length, 'total tasks');
            
            const dayTasks = globalTasks.filter(task => {
                if (task.repeat === 'everyday') {
                    return true; // Count everyday tasks for all days
                } else if (task.repeat === 'days') {
                    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert to 0=Monday
                    return task.days && task.days.includes(dayOfWeek);
                } else if (!task.repeat && task.date === dateStr) {
                    return true; // Count specific date tasks
                }
                return false;
            });
            
            const total = dayTasks.length;
            console.log(`Tasks for ${dateStr}:`, total, dayTasks);
            
            // Add click handler to navigate to this date
            const clickHandler = `onclick="navigateToDate('${dateStr}')"`;
            
            html += `
                <div class="day ${isToday ? 'today' : ''}" ${clickHandler} style="cursor: pointer;">
                    <span class="day-number">${day}</span>
                    <span class="task-status">${total} tasks</span>
                </div>
            `;
        }

        calendarContainer.innerHTML = html + '</div>';
    }

    // Function to navigate to a specific date
    window.navigateToDate = function(dateStr) {
        console.log('Navigating to date:', dateStr);
        
        // Set the current date directly
        if (window.currentDate !== undefined) {
            window.currentDate = dateStr;
        }
        
        // Calculate the week offset needed to show this date
        const targetDate = new Date(dateStr);
        const today = new Date();
        
        // Calculate the start of the current week (Monday)
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const currentWeekStart = new Date(today);
        currentWeekStart.setDate(today.getDate() + mondayOffset);
        
        // Calculate the start of the target week (Monday)
        const targetDay = targetDate.getDay();
        const targetMondayOffset = targetDay === 0 ? -6 : 1 - targetDay;
        const targetWeekStart = new Date(targetDate);
        targetWeekStart.setDate(targetDate.getDate() + targetMondayOffset);
        
        // Calculate week difference
        const weekDiff = Math.round((targetWeekStart - currentWeekStart) / (7 * 24 * 60 * 60 * 1000));
        
        // Update the global week offset
        if (window.weekOffset !== undefined) {
            window.weekOffset = weekDiff;
        }
        
        // Trigger navigation update using the correct functions
        if (window.renderDayNav && window.renderTasks) {
            window.renderDayNav();
            window.renderTasks();
        }
        
        // Add visual feedback
        const clickedDay = document.querySelector(`[onclick="navigateToDate('${dateStr}')"]`);
        if (clickedDay) {
            clickedDay.style.transform = 'scale(0.95)';
            setTimeout(() => {
                clickedDay.style.transform = 'scale(1)';
            }, 150);
        }
    };

    // Initial render - wait for tasks to be loaded
    function initializeCalendar() {
        console.log('Initializing calendar...');
        console.log('Current window.tasks:', window.tasks);
        
        // Wait longer to ensure tasks are loaded
        setTimeout(() => {
            console.log('Rendering calendar after delay...');
            console.log('Tasks available:', window.tasks);
            renderCalendar();
        }, 500);
    }
    
    // Initialize calendar
    initializeCalendar();
    
    // Re-render calendar when tasks change
    const originalRenderTasks = window.renderTasks;
    if (originalRenderTasks) {
        window.renderTasks = function() {
            console.log('renderTasks called, updating calendar...');
            originalRenderTasks();
            // Update calendar when tasks change
            setTimeout(() => {
                console.log('Refreshing calendar after renderTasks...');
                renderCalendar();
            }, 100);
        };
    }
    
    // Expose renderCalendar globally so it can be called from other scripts
    window.renderCalendar = renderCalendar;
    
    // Also expose a function to force calendar refresh
    window.refreshCalendar = function() {
        console.log('Manual calendar refresh called...');
        renderCalendar();
    };
});