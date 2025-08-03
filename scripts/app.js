// TaskExtreme - Main Application Script
// Grounded, mobile-first approach with consistent date handling

// ENVIRONMENT DETECTION:
// By default, the API endpoint is chosen based on the browser's hostname.
// To FORCE local or production mode, uncomment one of the lines below:
// const API_ENDPOINT = 'http://localhost:3001/api/ai-generate-tasks'; // <-- Force LOCAL
const API_ENDPOINT = 'https://taskrxtreme-ai.vercel.app/api/ai-generate-tasks'; // <-- Force PRODUCTION
// Otherwise, the code below will auto-detect:
// const API_ENDPOINT =
//   window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
//     ? 'http://localhost:3001/api/ai-generate-tasks'
//     : 'https://taskrxtreme-ai.vercel.app/api/ai-generate-tasks';

// ===== CONSTANTS =====
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const STORAGE_KEY = "taskextreme_tasks";
const CHECKED_KEY = "taskextreme_checked";

// ===== STATE MANAGEMENT =====
let tasks = [];
let checked = {};
let currentDate = getDateString(new Date()); // Use helper function
let weekOffset = 0; // Track which week we're viewing (0 = current week)

// ===== DOM ELEMENTS =====
const dayNav = document.getElementById('day-nav');
const tasksList = document.getElementById('tasks-list');
const tasksDayTitle = document.getElementById('tasks-day-title');
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const detailsInput = document.getElementById('task-details');
const timeStartInput = document.getElementById('task-time-start');
const timeEndInput = document.getElementById('task-time-end');
const addTaskBtn = document.getElementById('add-task');
const generatePdfBtn = document.getElementById('generate-pdf');
const dueDateInput = document.getElementById('task-due-date');
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');
const todayBtn = document.getElementById('today-btn');
const currentDateDisplay = document.getElementById('current-date-display');
const clearFormBtn = document.getElementById('clear-form');

// New category and priority elements
const categoryInput = document.getElementById('task-category');
const priorityInput = document.getElementById('task-priority');
const editCategoryInput = document.getElementById('edit-task-category');
const editPriorityInput = document.getElementById('edit-task-priority');

// ===== UTILITY FUNCTIONS =====

/**
 * Get a date string in YYYY-MM-DD format without timezone issues
 */
function getDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a date string from day offset (0 = today, 1 = tomorrow, etc.)
 */
function getDateFromDayOffset(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return getDateString(date);
}

/**
 * Get a date string from week offset and day index
 */
function getDateFromWeekAndDay(weekOffset = 0, dayIndex = 0) {
  const date = new Date();
  
  // Calculate the start of the current week (Monday)
  const currentDay = date.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  date.setDate(date.getDate() + mondayOffset);
  
  // Add week offset and day offset
  date.setDate(date.getDate() + (weekOffset * 7) + dayIndex);
  return getDateString(date);
}

/**
 * Get day name from date string
 */
function getDayNameFromDate(dateStr) {
  const date = new Date(dateStr);
  return DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

/**
 * Get day index from date string (0 = Monday, 6 = Sunday)
 */
function getDayIndexFromDate(dateStr) {
  const date = new Date(dateStr);
  return date.getDay() === 0 ? 6 : date.getDay() - 1;
}

/**
 * Format date for display
 */
function formatDateForDisplay(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  if (dateStr === getDateString(today)) {
    return 'Today';
  } else if (dateStr === getDateString(tomorrow)) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

/**
 * Get tasks for a specific date
 */
function getTasksForDate(dateStr) {
  return tasks.filter(task => {
    if (task.repeat === 'everyday') {
      return true;
    } else if (task.repeat === 'days') {
      const dayOfWeek = getDayIndexFromDate(dateStr);
      return task.days && task.days.includes(dayOfWeek);
    } else {
      return task.date === dateStr;
    }
  });
}

// ===== NAVIGATION FUNCTIONS =====

/**
 * Navigate to the previous day
 */
function navigateDay(direction) {
  const currentDateObj = new Date(currentDate);
  currentDateObj.setDate(currentDateObj.getDate() + direction);
  currentDate = getDateString(currentDateObj); // Use helper function
  
  // Update week offset to keep the day nav in sync
  const newDateObj = new Date(currentDate);
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() + mondayOffset);
  
  const newDay = newDateObj.getDay();
  const newMondayOffset = newDay === 0 ? -6 : 1 - newDay;
  const newWeekStart = new Date(newDateObj);
  newWeekStart.setDate(newDateObj.getDate() + newMondayOffset);
  
  const weekDiff = Math.round((newWeekStart - currentWeekStart) / (7 * 24 * 60 * 60 * 1000));
  weekOffset = weekDiff;
  
  // Update global references for other scripts
  window.weekOffset = weekOffset;
  window.currentDate = currentDate;
  
  // Update button states
  updateWeekNavButtons();
  
  // Smooth transition animation
  const dayNav = document.getElementById('day-nav');
  if (dayNav) {
    dayNav.style.opacity = '0.5';
    dayNav.style.transform = 'translateX(' + (direction * 20) + 'px)';
    
    setTimeout(() => {
      renderDayNav();
      renderTasks();
      dayNav.style.opacity = '1';
      dayNav.style.transform = 'translateX(0)';
    }, 150);
  }
}

/**
 * Go to today's date
 */
function goToToday() {
  weekOffset = 0;
  currentDate = getDateString(new Date()); // Use helper function
  
  // Update global references
  window.weekOffset = weekOffset;
  window.currentDate = currentDate;
  
  // Update button states
  updateWeekNavButtons();
  
  // Smooth transition animation
  const dayNav = document.getElementById('day-nav');
  if (dayNav) {
    dayNav.style.opacity = '0.5';
    dayNav.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      renderDayNav();
      renderTasks();
      dayNav.style.opacity = '1';
      dayNav.style.transform = 'scale(1)';
    }, 150);
  }
}

/**
 * Update week navigation button states
 */
function updateWeekNavButtons() {
  if (prevWeekBtn) {
    // Allow navigation up to 1 year in the past
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    prevWeekBtn.disabled = new Date(currentDate) <= oneYearAgo;
  }
  
  if (nextWeekBtn) {
    // Allow navigation up to 1 year in the future
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    nextWeekBtn.disabled = new Date(currentDate) >= oneYearFromNow;
  }
}

// ===== STORAGE FUNCTIONS =====

/**
 * Load tasks from localStorage
 */
function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];
    
    // Migrate any tasks with string IDs to numeric IDs
    tasks = tasks.map(task => {
      if (typeof task.id === 'string') {
        // Convert string ID to numeric ID
        const numericId = parseFloat(task.id) || Date.now() + Math.random();
        return { ...task, id: numericId };
      }
      return task;
    });
    
    console.log(`Loaded ${tasks.length} tasks from storage:`, tasks);
    
    // Ensure global access
    window.tasks = tasks;
    console.log('Global tasks array set:', window.tasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    tasks = [];
    window.tasks = tasks;
  }
}

/**
 * Save tasks to localStorage
 */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.tasks = tasks;
    console.log(`Saved ${tasks.length} tasks to storage`);
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}

/**
 * Load checked state from localStorage
 */
function loadChecked() {
  try {
    const stored = localStorage.getItem(CHECKED_KEY);
    checked = stored ? JSON.parse(stored) : {};
    
    // Clean up checked state to use numeric IDs
    const cleanedChecked = {};
    Object.keys(checked).forEach(key => {
      const numericKey = parseFloat(key);
      if (!isNaN(numericKey)) {
        cleanedChecked[numericKey] = checked[key];
      }
    });
    checked = cleanedChecked;
  } catch (error) {
    console.error('Error loading checked state:', error);
    checked = {};
  }
}

/**
 * Save checked state to localStorage
 */
function saveChecked() {
  try {
    localStorage.setItem(CHECKED_KEY, JSON.stringify(checked));
  } catch (error) {
    console.error('Error saving checked state:', error);
  }
}

// ===== RENDERING FUNCTIONS =====

/**
 * Render the day navigation
 */
function renderDayNav() {
  if (!dayNav) return;
  
  const dayItems = dayNav.querySelectorAll('li');
  
  dayItems.forEach((item, index) => {
    const dateStr = getDateFromWeekAndDay(weekOffset, index);
    const isActive = dateStr === currentDate;
    const isToday = dateStr === getDateString(new Date());
    
    // Update active state
    if (isActive) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
    
    // Add today indicator
    if (isToday) {
      item.setAttribute('data-today', 'true');
    } else {
      item.removeAttribute('data-today');
    }
    
    // Update data attributes
    item.setAttribute('data-date', dateStr);
    item.setAttribute('data-day', index);
  });
  
  // Update current date display
  if (currentDateDisplay) {
    currentDateDisplay.textContent = formatDateForDisplay(currentDate);
  }
}

/**
 * Render tasks for the current date
 */
function renderTasks() {
  if (!tasksList || !tasksDayTitle) return;
  
  const dayTasks = getTasksForDate(currentDate);
  
  // Update title
  tasksDayTitle.textContent = formatDateForDisplay(currentDate);
  
  // Show/hide delete all button
  const deleteAllBtn = document.getElementById('delete-all-tasks-btn');
  if (deleteAllBtn) {
    if (dayTasks.length > 0) {
      deleteAllBtn.style.display = 'flex';
      deleteAllBtn.querySelector('.btn-text').textContent = `Delete All Tasks for ${formatDateForDisplay(currentDate)}`;
    } else {
      deleteAllBtn.style.display = 'none';
    }
  }
  
  // Clear existing tasks
  tasksList.innerHTML = '';
  
  if (dayTasks.length === 0) {
    tasksList.innerHTML = `
      <li class="task-item empty-state">
        <div class="task-content">
          <p>No tasks for ${formatDateForDisplay(currentDate)}</p>
          <small>Add a task to get started!</small>
        </div>
      </li>
    `;
  } else {
    // Render each task
    dayTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      tasksList.appendChild(taskElement);
    });
  }
  
  // Update calendar if available - ensure it's refreshed with current task data
  if (window.renderCalendar) {
    setTimeout(() => {
      window.renderCalendar();
    }, 50);
  }
}

/**
 * Create a task element
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  if (checked[task.id]) {
    li.classList.add('completed');
  }
  
  const timeDisplay = task.timeStart && task.timeEnd 
    ? `${task.timeStart} - ${task.timeEnd}`
    : task.timeStart 
    ? `Starts at ${task.timeStart}`
    : '';
  
  const repeatBadge = task.repeat ? `<span class="task-repeat">${task.repeat === 'everyday' ? 'Daily' : 'Custom'}</span>` : '';
  
  // Category and priority badges
  const categoryBadge = task.category ? `<span class="task-category-badge" data-category="${task.category}">${getCategoryEmoji(task.category)} ${task.category}</span>` : '';
  const priorityBadge = task.priority ? `<span class="task-priority-badge" data-priority="${task.priority}">${getPriorityEmoji(task.priority)} ${task.priority}</span>` : '';
  
  li.innerHTML = `
    <input type="checkbox" class="task-checkbox" ${checked[task.id] ? 'checked' : ''} data-task-id="${task.id}">
    <div class="task-content">
      <div class="task-header">
        <div class="task-title">${task.title}</div>
        ${categoryBadge}
        ${priorityBadge}
      </div>
      ${timeDisplay ? `<div class="task-time">${timeDisplay}</div>` : ''}
      ${task.details ? `<div class="task-details">${task.details}</div>` : ''}
      ${repeatBadge}
    </div>
    <div class="task-actions">
      <button class="edit-task" data-task-id="${task.id}" title="Edit task">✏️</button>
      <button class="delete-task" data-task-id="${task.id}" title="Delete task">🗑️</button>
    </div>
  `;
  
  return li;
}

// Helper functions for category and priority
function getCategoryEmoji(category) {
  const emojis = {
    work: '💼',
    personal: '👤',
    health: '🏥',
    education: '📚',
    finance: '💰',
    home: '🏠',
    social: '👥',
    hobby: '🎨'
  };
  return emojis[category] || '📋';
}

function getPriorityEmoji(priority) {
  const emojis = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };
  return emojis[priority] || '⚪';
}

// ===== FORM HANDLING =====

/**
 * Handle form submission
 */
function handleTaskSubmit(e) {
  e.preventDefault();
  
  const title = titleInput.value.trim();
  if (!title) {
    showFormFeedback('Please enter a task title', 'error');
    return;
  }
  
  const category = categoryInput.value;
  const priority = priorityInput.value;
  
  if (!category) {
    showFormFeedback('Please select a category', 'error');
    return;
  }
  
  if (!priority) {
    showFormFeedback('Please select a priority', 'error');
    return;
  }
  
  const scheduleType = document.querySelector('input[name="schedule-type"]:checked').value;
  
  let newTask = {
    id: Date.now() + Math.random(),
    title: title,
    details: detailsInput.value.trim(),
    category: category,
    priority: priority,
    timeStart: timeStartInput.value,
    timeEnd: timeEndInput.value,
    dueDate: dueDateInput.value || null,
    completed: false,
    date: currentDate
  };
  
  // Handle scheduling options
  if (scheduleType === 'once') {
    newTask.date = currentDate;
  } else if (scheduleType === 'everyday') {
    newTask.repeat = 'everyday';
  } else if (scheduleType === 'custom') {
    const customDays = Array.from(document.querySelectorAll('#custom-days-section input:checked'))
                          .map(cb => parseInt(cb.value));
    if (customDays.length > 0) {
      newTask.repeat = 'days';
      newTask.days = customDays;
    } else {
      showFormFeedback('Please select at least one day for custom repeat', 'error');
      return;
    }
  }
  
  // Add the new task
  tasks.push(newTask);
  saveTasks();
  
  // Clear the form
  clearForm();
  
  // Re-render tasks
  renderTasks();
  
  // Update calendar
  if (window.renderCalendar) {
    window.renderCalendar();
  }
  
  // Dispatch custom event for dashboard
  document.dispatchEvent(new CustomEvent('taskAdded', { detail: { task: newTask } }));
  
  showFormFeedback('Task added successfully!', 'success');
}

/**
 * Clear the form
 */
function clearForm() {
  if (taskForm) {
    taskForm.reset();
  }
  
  // Hide custom days section
  const customDaysSection = document.getElementById('custom-days-section');
  if (customDaysSection) {
    customDaysSection.style.display = 'none';
  }
  
  // Reset to one-time task
  const onceRadio = document.querySelector('input[name="schedule-type"][value="once"]');
  if (onceRadio) {
    onceRadio.checked = true;
  }
  
  // Reset category and priority to first option
  if (categoryInput) {
    categoryInput.selectedIndex = 0;
  }
  if (priorityInput) {
    priorityInput.selectedIndex = 0;
  }
}

/**
 * Show form feedback message
 */
function showFormFeedback(message, type = 'info') {
  // Create feedback element
  const feedback = document.createElement('div');
  feedback.className = `form-feedback ${type}`;
  feedback.textContent = message;
  
  // Add to form
  if (taskForm) {
    taskForm.appendChild(feedback);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 3000);
  }
}

// ===== TASK ACTIONS =====

/**
 * Toggle task completion status
 */
function toggleTaskCompletion(taskId) {
  // Convert taskId to number for consistent comparison
  const numericTaskId = parseFloat(taskId);
  const task = tasks.find(t => parseFloat(t.id) === numericTaskId);
  
  if (!task) {
    console.error('Task not found for completion toggle:', taskId);
    return;
  }
  
  // Toggle completion status
  if (checked[numericTaskId]) {
    delete checked[numericTaskId];
    delete checked[taskId]; // Also delete string version if it exists
  } else {
    checked[numericTaskId] = true;
  }
  
  task.completed = checked[numericTaskId] || false;
  
  saveTasks();
  saveChecked();
  renderTasks();
  updateStreakCounter();
  
  // Dispatch custom events for dashboard
  if (task.completed) {
    document.dispatchEvent(new CustomEvent('taskCompleted', { detail: { task } }));
  } else {
    document.dispatchEvent(new CustomEvent('taskUncompleted', { detail: { task } }));
  }
}

/**
 * Delete a task
 */
function deleteTask(taskId) {
  // Convert taskId to number for consistent comparison
  const numericTaskId = parseFloat(taskId);
  
  if (confirm('Are you sure you want to delete this task?')) {
    const taskToDelete = tasks.find(task => parseFloat(task.id) === numericTaskId);
    
    tasks = tasks.filter(task => parseFloat(task.id) !== numericTaskId);
    delete checked[numericTaskId];
    delete checked[taskId]; // Also delete string version if it exists
    
    saveTasks();
    saveChecked();
    renderTasks();
    
    // Update calendar
    if (window.renderCalendar) {
      window.renderCalendar();
    }
    
    // Dispatch custom event for dashboard
    if (taskToDelete) {
      document.dispatchEvent(new CustomEvent('taskDeleted', { detail: { task: taskToDelete } }));
    }
    
    showFormFeedback('Task deleted successfully!', 'success');
  }
}

/**
 * Delete all tasks for the current day
 */
function deleteAllTasksForDay() {
  const dayTasks = getTasksForDate(currentDate);
  
  if (dayTasks.length === 0) {
    showFormFeedback('No tasks to delete for this day', 'info');
    return;
  }
  
  const confirmMessage = `Are you sure you want to delete all ${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''} for ${formatDateForDisplay(currentDate)}? This action cannot be undone.`;
  
  if (confirm(confirmMessage)) {
    // Get IDs of tasks to delete
    const taskIdsToDelete = dayTasks.map(task => parseFloat(task.id));
    
    // Remove tasks from the tasks array
    tasks = tasks.filter(task => !taskIdsToDelete.includes(parseFloat(task.id)));
    
    // Remove from checked state
    taskIdsToDelete.forEach(taskId => {
      delete checked[taskId];
      delete checked[taskId.toString()]; // Also delete string version if it exists
    });
    
    saveTasks();
    saveChecked();
    renderTasks();
    
    // Update calendar
    if (window.renderCalendar) {
      window.renderCalendar();
    }
    
    showFormFeedback(`Successfully deleted ${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}!`, 'success');
  }
}

/**
 * Edit a task - opens the edit modal
 */
function editTask(taskId) {
  // Convert taskId to number for consistent comparison
  const numericTaskId = parseFloat(taskId);
  const task = tasks.find(t => parseFloat(t.id) === numericTaskId);
  
  if (!task) {
    console.error('Task not found:', taskId, 'Available tasks:', tasks.map(t => ({ id: t.id, title: t.title })));
    showFormFeedback('Task not found!', 'error');
    return;
  }
  
  // Populate the edit modal with task data
  document.getElementById('edit-task-id').value = task.id;
  document.getElementById('edit-task-title').value = task.title;
  document.getElementById('edit-task-details').value = task.details || '';
  document.getElementById('edit-task-time-start').value = task.timeStart || '';
  document.getElementById('edit-task-time-end').value = task.timeEnd || '';
  document.getElementById('edit-task-due-date').value = task.dueDate || '';
  
  // Set category and priority
  if (editCategoryInput) {
    editCategoryInput.value = task.category || '';
  }
  if (editPriorityInput) {
    editPriorityInput.value = task.priority || '';
  }
  
  // Set scheduling type
  const editScheduleRadios = document.querySelectorAll('input[name="edit-schedule-type"]');
  editScheduleRadios.forEach(radio => {
    radio.checked = radio.value === (task.repeat || 'once');
  });
  
  // Handle custom days
  const editCustomDaysSection = document.getElementById('edit-custom-days-section');
  if (editCustomDaysSection) {
    editCustomDaysSection.style.display = task.repeat === 'days' ? 'block' : 'none';
    
    // Clear all checkboxes first
    editCustomDaysSection.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Check the appropriate days
    if (task.days && Array.isArray(task.days)) {
      task.days.forEach(day => {
        const checkbox = editCustomDaysSection.querySelector(`input[value="${day}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
  }
  
  // Show the modal
  document.getElementById('edit-task-modal').style.display = 'flex';
  
  // Focus on the title input
  setTimeout(() => {
    document.getElementById('edit-task-title').focus();
  }, 100);
}

/**
 * Close the edit modal
 */
function closeEditModal() {
  document.getElementById('edit-task-modal').style.display = 'none';
  // Clear the form
  document.getElementById('edit-task-form').reset();
}

/**
 * Handle edit form submission
 */
function handleEditSubmit(e) {
  e.preventDefault();
  
  const taskId = document.getElementById('edit-task-id').value;
  // Convert taskId to number for consistent comparison
  const numericTaskId = parseFloat(taskId);
  const task = tasks.find(t => parseFloat(t.id) === numericTaskId);
  
  if (!task) {
    console.error('Task not found for editing:', taskId);
    showFormFeedback('Task not found!', 'error');
    return;
  }
  
  // Get form values
  const title = document.getElementById('edit-task-title').value.trim();
  const details = document.getElementById('edit-task-details').value.trim();
  const category = editCategoryInput ? editCategoryInput.value : '';
  const priority = editPriorityInput ? editPriorityInput.value : '';
  const timeStart = document.getElementById('edit-task-time-start').value;
  const timeEnd = document.getElementById('edit-task-time-end').value;
  const dueDate = document.getElementById('edit-task-due-date').value;
  
  if (!title) {
    showFormFeedback('Task title is required!', 'error');
    return;
  }
  
  if (!category) {
    showFormFeedback('Please select a category!', 'error');
    return;
  }
  
  if (!priority) {
    showFormFeedback('Please select a priority!', 'error');
    return;
  }
  
  // Get scheduling options
  const scheduleType = document.querySelector('input[name="edit-schedule-type"]:checked').value;
  let days = [];
  
  if (scheduleType === 'custom') {
    const checkedDays = document.querySelectorAll('#edit-custom-days-section input[type="checkbox"]:checked');
    days = Array.from(checkedDays).map(cb => parseInt(cb.value));
    
    if (days.length === 0) {
      showFormFeedback('Please select at least one day for custom repeat!', 'error');
      return;
    }
  }
  
  // Update the task
  task.title = title;
  task.details = details;
  task.category = category;
  task.priority = priority;
  task.timeStart = timeStart;
  task.timeEnd = timeEnd;
  task.dueDate = dueDate;
  task.repeat = scheduleType === 'once' ? null : scheduleType;
  task.days = days;
  
  // Save and render
  saveTasks();
  renderTasks();
  
  // Update calendar
  if (window.renderCalendar) {
    window.renderCalendar();
  }
  
  // Close modal
  closeEditModal();
  
  showFormFeedback('Task updated successfully!', 'success');
}

// ===== EVENT LISTENERS =====

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Day navigation (previously week navigation)
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => navigateDay(-1));
    prevWeekBtn.title = 'Previous Day';
  }
  
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => navigateDay(1));
    nextWeekBtn.title = 'Next Day';
  }
  
  if (todayBtn) {
    todayBtn.addEventListener('click', goToToday);
  }
  
  // Day navigation
  if (dayNav) {
    dayNav.addEventListener('click', (e) => {
      if (e.target.tagName === 'LI') {
        const dayIndex = parseInt(e.target.dataset.day);
        currentDate = getDateFromWeekAndDay(weekOffset, dayIndex);
        window.currentDate = currentDate;
        renderDayNav();
        renderTasks();
      }
    });
  }
  
  // Form submission
  if (taskForm) {
    taskForm.addEventListener('submit', handleTaskSubmit);
  }
  
  // Clear form button
  if (clearFormBtn) {
    clearFormBtn.addEventListener('click', clearForm);
  }
  
  // Delete all tasks button
  const deleteAllTasksBtn = document.getElementById('delete-all-tasks-btn');
  if (deleteAllTasksBtn) {
    deleteAllTasksBtn.addEventListener('click', deleteAllTasksForDay);
  }
  
  // Scheduling options
  const scheduleRadios = document.querySelectorAll('input[name="schedule-type"]');
  scheduleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const customDaysSection = document.getElementById('custom-days-section');
      if (customDaysSection) {
        customDaysSection.style.display = e.target.value === 'custom' ? 'block' : 'none';
      }
    });
  });
  
  // Edit modal scheduling options
  const editScheduleRadios = document.querySelectorAll('input[name="edit-schedule-type"]');
  editScheduleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const editCustomDaysSection = document.getElementById('edit-custom-days-section');
      if (editCustomDaysSection) {
        editCustomDaysSection.style.display = e.target.value === 'custom' ? 'block' : 'none';
      }
    });
  });
  
  // Edit modal event listeners
  const editModal = document.getElementById('edit-task-modal');
  const editForm = document.getElementById('edit-task-form');
  const closeEditBtn = document.getElementById('close-edit-modal');
  const cancelEditBtn = document.getElementById('cancel-edit');
  
  if (editForm) {
    editForm.addEventListener('submit', handleEditSubmit);
  }
  
  if (closeEditBtn) {
    closeEditBtn.addEventListener('click', closeEditModal);
  }
  
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', closeEditModal);
  }
  
  // Close modal when clicking outside
  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        closeEditModal();
      }
    });
  }
  
  // Task actions (delegated)
  if (tasksList) {
    tasksList.addEventListener('click', (e) => {
      const taskId = e.target.dataset.taskId;
      if (!taskId) return;
      
      if (e.target.classList.contains('task-checkbox')) {
        toggleTaskCompletion(taskId);
      } else if (e.target.classList.contains('edit-task')) {
        editTask(taskId);
      } else if (e.target.classList.contains('delete-task')) {
        deleteTask(taskId);
      }
    });
  }
  
  // PDF generation
  if (generatePdfBtn) {
    generatePdfBtn.addEventListener('click', handlePdfGeneration);
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N for new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      document.getElementById('task-form-section').scrollIntoView({ behavior: 'smooth' });
      titleInput.focus();
    }
    
    // Escape to clear form or close modal
    if (e.key === 'Escape') {
      const editModal = document.getElementById('edit-task-modal');
      if (editModal && editModal.style.display === 'flex') {
        closeEditModal();
      } else {
        clearForm();
      }
    }
    
    // Arrow keys for day navigation
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateDay(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateDay(1);
    }
  });
}

// ===== PDF GENERATION =====

/**
 * Handle PDF generation
 */
async function handlePdfGeneration() {
  try {
    // Check if jsPDF is available
    if (typeof window.jsPDF === 'undefined') {
      // Load jsPDF dynamically
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    
    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('TaskExtreme - Task Report', 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    
    // Add tasks
    let y = 50;
    tasks.forEach((task, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`${index + 1}. ${task.title}`, 20, y);
      y += 8;
      
      if (task.details) {
        doc.setFontSize(10);
        doc.text(task.details, 25, y);
        y += 6;
      }
      
      if (task.timeStart || task.date) {
        doc.setFontSize(10);
        const timeInfo = [];
        if (task.timeStart) timeInfo.push(`Time: ${task.timeStart}`);
        if (task.date) timeInfo.push(`Date: ${task.date}`);
        if (task.repeat) timeInfo.push(`Repeat: ${task.repeat}`);
        
        doc.text(timeInfo.join(' | '), 25, y);
        y += 6;
      }
      
      y += 5;
    });
    
    // Save PDF
    doc.save('taskextreme-tasks.pdf');
    
    showFormFeedback('PDF generated successfully!', 'success');
  } catch (error) {
    console.error('Error generating PDF:', error);
    showFormFeedback('Error generating PDF. Please try again.', 'error');
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Load a script dynamically
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Update streak counter
 */
function updateStreakCounter() {
  const streakCounter = document.getElementById('streak-counter');
  if (!streakCounter) return;
  
  // Calculate streak (simplified version)
  const completedToday = tasks.filter(task => {
    const taskDate = task.date || (task.repeat ? new Date().toISOString().split('T')[0] : null);
    return taskDate === new Date().toISOString().split('T')[0] && checked[task.id];
  }).length;
  
  if (completedToday > 0) {
    streakCounter.textContent = `🔥 ${completedToday} task${completedToday > 1 ? 's' : ''} completed today!`;
  } else {
    streakCounter.textContent = '📋 Ready to tackle your tasks!';
  }
}

// ===== AI TASK GENERATION =====

/**
 * Handle AI task form submission
 */
async function handleAiTaskForm(e) {
  e.preventDefault();
  
  const projectDesc = document.getElementById('ai-project-desc').value.trim();
  const resultsDiv = document.getElementById('ai-task-results');
  
  if (!projectDesc) {
    showFormFeedback('Please provide a project description', 'error');
    return;
  }
  
  if (resultsDiv) {
    resultsDiv.innerHTML = '<p>🤖 Generating tasks with AI...</p>';
  }
  
  try {
    // Use the client-side AI generator
    const aiGenerator = new AITaskGenerator();
    const aiTasks = await aiGenerator.generateTasks(projectDesc);
    
    if (!Array.isArray(aiTasks) || aiTasks.length === 0) {
      throw new Error('No tasks were generated. Please try again with a different description.');
    }
    
    // Add the generated tasks
    let addedCount = 0;
    aiTasks.forEach(aiTask => {
      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: aiTask.title || 'AI Generated Task',
        details: aiTask.description || '',
        timeStart: aiTask.timeStart || '',
        timeEnd: aiTask.timeEnd || '',
        date: aiTask.date || currentDate,
        dueDate: aiTask.dueDate || '',
        category: aiTask.category || 'Uncategorized',
        priority: aiTask.priority || 'medium',
        repeat: aiTask.repeat || null,
        days: aiTask.days || [],
        completed: false
      };
      
      tasks.push(newTask);
      addedCount++;
    });
    
    // Save and render
    saveTasks();
    renderTasks();
    
    // Update calendar if available
    if (window.renderCalendar) {
      window.renderCalendar();
    }
    
    // Show success message
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="ai-success">
          <p>✅ Successfully added ${addedCount} AI-generated tasks!</p>
          <button onclick="this.parentElement.innerHTML = ''" class="btn-secondary">Clear</button>
        </div>
      `;
    }
    
    // Clear the form
    document.getElementById('ai-project-desc').value = '';
    document.getElementById('ai-project-file').value = '';
    document.getElementById('ai-project-sheet').value = '';
    
    showFormFeedback(`Added ${addedCount} AI-generated tasks!`, 'success');
    
  } catch (error) {
    console.error('Error generating AI tasks:', error);
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="ai-error">
          <p>❌ Error: ${error.message || 'Failed to generate tasks. Please try again.'}</p>
          <button onclick="this.parentElement.innerHTML = ''" class="btn-secondary">Clear</button>
        </div>
      `;
    }
    showFormFeedback(`Error: ${error.message || 'Failed to generate tasks'}`, 'error');
  }
}

// ... (rest of the code remains the same)
function parseDateExpression(expression) {
  if (!expression) return null;
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const lowerExpr = expression.toLowerCase().trim();
  
  switch (lowerExpr) {
    case 'today':
    case 'tonight':
      return getDateString(today);
    case 'tomorrow':
      return getDateString(tomorrow);
    case 'next week':
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return getDateString(nextWeek);
    default:
      // Handle day names
      const dayMap = {
        'monday': 1, 'mon': 1,
        'tuesday': 2, 'tue': 2,
        'wednesday': 3, 'wed': 3,
        'thursday': 4, 'thu': 4,
        'friday': 5, 'fri': 5,
        'saturday': 6, 'sat': 6,
        'sunday': 0, 'sun': 0
      };
      
      for (const [dayName, dayIndex] of Object.entries(dayMap)) {
        if (lowerExpr.includes(dayName)) {
          return getDateFromWeekAndDay(0, dayIndex);
        }
      }
      
      return null;
  }
}

// ===== INITIALIZATION =====

/**
 * Initialize the application
 */
function init() {
  console.log('Initializing TaskExtreme...');
  
  // Load data
  loadTasks();
  loadChecked();
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up form transitions
  const dayNav = document.getElementById('day-nav');
  if (dayNav) {
    dayNav.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
  }
  
  // Initialize UI
  updateWeekNavButtons();
  renderDayNav();
  renderTasks();
  updateStreakCounter();
  
  // PDF-to-task extraction for AI Task Generator
  document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('ai-project-file');
    const resultsDiv = document.getElementById('ai-task-results');
    if (fileInput) {
      fileInput.addEventListener('change', async function (e) {
        const file = e.target.files && e.target.files[0];
        if (file && file.type === 'application/pdf') {
          if (resultsDiv) resultsDiv.innerHTML = '<div class="ai-loading">⏳ Extracting tasks from PDF...</div>';
          try {
            const tasks = await window.extractTasksFromFile(file, {
              azureClient: window.azureClient,
              githubToken: window.githubToken
            });
            if (Array.isArray(tasks) && tasks.length > 0) {
              let addedCount = 0;
              tasks.forEach(aiTask => {
                const newTask = {
                  id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                  title: aiTask.title || 'AI Generated Task',
                  details: aiTask.description || '',
                  timeStart: aiTask.timeStart || '',
                  timeEnd: aiTask.timeEnd || '',
                  date: aiTask.date || (window.currentDate || ''),
                  dueDate: aiTask.dueDate || '',
                  category: aiTask.category || 'Uncategorized',
                  priority: aiTask.priority || 'medium',
                  repeat: aiTask.repeat || null,
                  days: aiTask.days || [],
                  completed: false
                };
                if (window.tasks && Array.isArray(window.tasks)) {
                  window.tasks.push(newTask);
                  addedCount++;
                }
              });
              if (typeof saveTasks === 'function') saveTasks();
              if (typeof renderTasks === 'function') renderTasks();
              if (window.renderCalendar && typeof window.renderCalendar === 'function') window.renderCalendar();
              if (resultsDiv) {
                resultsDiv.innerHTML = `<div class="ai-success"><p>✅ Successfully added ${addedCount} AI-generated tasks from PDF!</p><button onclick="this.parentElement.innerHTML = ''" class="btn-secondary">Clear</button></div>`;
              }
            } else {
              if (resultsDiv) resultsDiv.innerHTML = '<div class="ai-error">❌ No tasks could be extracted from this PDF.</div>';
            }
          } catch (err) {
            if (resultsDiv) resultsDiv.innerHTML = `<div class="ai-error">❌ Error: ${err.message || 'Failed to extract tasks from PDF.'}</div>`;
          } finally {
            fileInput.value = '';
          }
        }
      });
    }
  });
  
  // Set up AI form
  const aiForm = document.getElementById('ai-task-form');
  if (aiForm) {
    aiForm.addEventListener('submit', handleAiTaskForm);
  }
  
  console.log('TaskExtreme initialized successfully!');
}

// ===== EXPOSE FUNCTIONS TO GLOBAL SCOPE =====
window.navigateDay = navigateDay;
window.goToToday = goToToday;
window.renderTasks = renderTasks;
window.renderDayNav = renderDayNav;
window.getTasksForDate = getTasksForDate;
window.currentDate = currentDate;
window.weekOffset = weekOffset;
window.tasks = tasks;

// ===== START THE APPLICATION =====
document.addEventListener('DOMContentLoaded', init);