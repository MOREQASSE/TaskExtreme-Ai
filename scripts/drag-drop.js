// Basic drag and drop for tasks between days
document.addEventListener('DOMContentLoaded', () => {
  let draggedTaskId = null;

  document.addEventListener('dragstart', function (e) {
    if (e.target.classList.contains('task-item')) {
      draggedTaskId = e.target.dataset.id;
      e.dataTransfer.effectAllowed = 'move';
      e.target.classList.add('dragging');
    }
  });

  document.addEventListener('dragend', function (e) {
    if (e.target.classList.contains('task-item')) {
      e.target.classList.remove('dragging');
    }
  });

  // Sidebar drop zones for days
  function setupDropZones() {
    document.querySelectorAll('#day-nav li').forEach((dayEl, idx) => {
      dayEl.addEventListener('dragover', e => {
        e.preventDefault();
        dayEl.classList.add('drop-zone');
      });
      dayEl.addEventListener('dragleave', e => {
        dayEl.classList.remove('drop-zone');
      });
      dayEl.addEventListener('drop', e => {
        e.preventDefault();
        dayEl.classList.remove('drop-zone');
        if (draggedTaskId) {
          // Get the current week offset from the global state
          const weekOffset = window.weekOffset || 0;
          
          // Calculate the target date using the week offset and day index
          const targetDate = window.getDateFromWeekAndDay ? 
            window.getDateFromWeekAndDay(weekOffset, idx) : 
            new Date().toISOString().split('T')[0];
          
          window.moveTaskToDay && window.moveTaskToDay(draggedTaskId, targetDate);
        }
      });
    });
  }

  // Expose for app.js to call after rendering days
  window.setupDropZones = setupDropZones;
});
