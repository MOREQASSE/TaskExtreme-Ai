// Enhanced PDF Export with Beautiful Styling
class PDFExporter {
  constructor() {
    this.doc = null;
    this.currentY = 0;
    this.pageWidth = 210;
    this.margin = 20;
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }

  init() {
    // Check if jsPDF is available with multiple fallbacks
    if (typeof window.jsPDF !== 'undefined') {
      console.log('jsPDF found in window.jsPDF');
      return true;
    }
    
    if (typeof window.jspdf !== 'undefined') {
      console.log('jsPDF found in window.jspdf');
      window.jsPDF = window.jspdf.jsPDF;
      return true;
    }
    
    if (typeof jsPDF !== 'undefined') {
      console.log('jsPDF found in global scope');
      window.jsPDF = jsPDF;
      return true;
    }
    
    // Check if the script tags are loaded
    const scripts = document.querySelectorAll('script[src*="jspdf"]');
    if (scripts.length === 0) {
      alert('PDF generation library not found. Please check your internet connection and refresh the page.');
      return false;
    }
    
    // Wait a bit and try again (in case scripts are still loading)
    setTimeout(() => {
      if (typeof window.jsPDF !== 'undefined' || typeof window.jspdf !== 'undefined') {
        console.log('jsPDF loaded after delay');
        if (typeof window.jspdf !== 'undefined') {
          window.jsPDF = window.jspdf.jsPDF;
        }
        return true;
      } else {
        console.error('jsPDF library detection failed. Available globals:', Object.keys(window).filter(key => key.toLowerCase().includes('pdf')));
        alert('PDF generation library failed to load. Please refresh the page and try again.');
        return false;
      }
    }, 1000);
    
    return false;
  }

  createDocument() {
    this.doc = new window.jsPDF();
    this.currentY = this.margin;
    return this.doc;
  }

  // Add header with logo and title
  addHeader() {
    // Add background color for header
    this.doc.setFillColor(26, 115, 232); // Blue color
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    // Add title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TaskExtreme', this.margin, 25);
    
    // Add subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Your Ultimate Task Management Solution', this.margin, 32);
    
    this.currentY = 50;
  }

  // Add date information
  addDateInfo() {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.doc.setTextColor(100, 100, 100);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Generated on: ${formattedDate}`, this.margin, this.currentY);
    
    this.currentY += 15;
  }

  // Add day summary
  addDaySummary() {
    const dayTitle = document.getElementById('tasks-day-title').textContent;
    const tasks = this.getTasksForCurrentDay();
    
    // Day title with background
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 12, 'F');
    
    this.doc.setTextColor(50, 50, 50);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(dayTitle, this.margin + 5, this.currentY + 8);
    
    this.currentY += 20;
    
    // Task count
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Total Tasks: ${tasks.length}`, this.margin, this.currentY);
    
    this.currentY += 15;
  }

  // Get tasks for current day
  getTasksForCurrentDay() {
    const taskElements = document.querySelectorAll('.task-item');
    const tasks = [];
    
    taskElements.forEach(taskEl => {
      const title = taskEl.querySelector('.task-title')?.textContent || '';
      const details = taskEl.querySelector('.task-details')?.textContent || '';
      const time = taskEl.querySelector('.task-time')?.textContent || '';
      
      // Extract clean category text (remove emoji)
      const categoryElement = taskEl.querySelector('.task-category-badge');
      let category = '';
      if (categoryElement) {
        // Get the text content and clean it
        const categoryText = categoryElement.textContent;
        // Remove emojis and extra spaces, keep only letters and spaces
        category = categoryText.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        // Capitalize first letter
        category = category.charAt(0).toUpperCase() + category.slice(1);
      }
      
      // Extract clean priority text (remove emoji)
      const priorityElement = taskEl.querySelector('.task-priority-badge');
      let priority = '';
      if (priorityElement) {
        // Get the text content and clean it
        const priorityText = priorityElement.textContent;
        // Remove emojis and extra spaces, keep only letters and spaces
        priority = priorityText.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        // Capitalize first letter
        priority = priority.charAt(0).toUpperCase() + priority.slice(1);
      }
      
      const isCompleted = taskEl.classList.contains('completed');
      
      tasks.push({
        title,
        details,
        time,
        category,
        priority,
        completed: isCompleted
      });
    });
    
    return tasks;
  }

  // Add tasks table
  addTasksTable() {
    const tasks = this.getTasksForCurrentDay();
    
    if (tasks.length === 0) {
      this.doc.setTextColor(150, 150, 150);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('No tasks for this day', this.margin, this.currentY);
      this.currentY += 20;
      return;
    }

    // Prepare table data
    const tableData = tasks.map(task => [
      task.completed ? 'Done' : 'Todo',
      task.title,
      task.category || '-',
      task.priority || '-',
      task.time || '-',
      task.completed ? 'Completed' : 'Pending'
    ]);

    // Table headers
    const headers = ['Done', 'Task', 'Category', 'Priority', 'Time', 'Status'];

    // Table styling
    const tableConfig = {
      startY: this.currentY,
      head: [headers],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        textColor: [50, 50, 50]
      },
      headStyles: {
        fillColor: [26, 115, 232],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 18 }, // Done/Todo (reduced from 20)
        1: { cellWidth: 57 }, // Task (increased from 55)
        2: { cellWidth: 25 }, // Category
        3: { cellWidth: 20 }, // Priority
        4: { cellWidth: 25 }, // Time
        5: { cellWidth: 25 }  // Status
      }
    };

    this.doc.autoTable(tableConfig);
    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  // Add task details section
  addTaskDetails() {
    const tasks = this.getTasksForCurrentDay();
    
    if (tasks.length === 0) return;

    // Section title
    this.doc.setTextColor(50, 50, 50);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Task Details', this.margin, this.currentY);
    this.currentY += 10;

    tasks.forEach((task, index) => {
      // Check if we need a new page
      if (this.currentY > 250) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      // Task title
      this.doc.setTextColor(26, 115, 232);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${task.title}`, this.margin, this.currentY);
      this.currentY += 8;

      // Task details
      if (task.details) {
        this.doc.setTextColor(80, 80, 80);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        
        // Wrap text for details
        const details = this.doc.splitTextToSize(task.details, this.contentWidth - 10);
        this.doc.text(details, this.margin + 5, this.currentY);
        this.currentY += (details.length * 5) + 5;
      }

      // Task metadata
      this.doc.setTextColor(120, 120, 120);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'italic');
      
      const metadata = [];
      if (task.category) metadata.push(`Category: ${task.category}`);
      if (task.priority) metadata.push(`Priority: ${task.priority}`);
      if (task.time) metadata.push(`Time: ${task.time}`);
      metadata.push(`Status: ${task.completed ? 'Completed' : 'Pending'}`);
      
      this.doc.text(metadata.join(' | '), this.margin + 5, this.currentY);
      this.currentY += 15;
    });
  }

  // Add statistics section
  addStatistics() {
    const tasks = this.getTasksForCurrentDay();
    
    if (tasks.length === 0) return;

    // Check if we need a new page
    if (this.currentY > 220) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Section title
    this.doc.setTextColor(50, 50, 50);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Statistics', this.margin, this.currentY);
    this.currentY += 10;

    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Priority breakdown
    const priorityStats = {};
    tasks.forEach(task => {
      const priority = task.priority || 'Unassigned';
      priorityStats[priority] = (priorityStats[priority] || 0) + 1;
    });

    // Category breakdown
    const categoryStats = {};
    tasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    // Display statistics
    this.doc.setTextColor(80, 80, 80);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const stats = [
      `Total Tasks: ${totalTasks}`,
      `Completed: ${completedTasks}`,
      `Pending: ${pendingTasks}`,
      `Completion Rate: ${completionRate}%`
    ];

    stats.forEach(stat => {
      this.doc.text(stat, this.margin, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 5;

    // Priority breakdown
    if (Object.keys(priorityStats).length > 0) {
      this.doc.setTextColor(50, 50, 50);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Priority Breakdown:', this.margin, this.currentY);
      this.currentY += 6;

      this.doc.setTextColor(80, 80, 80);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      
      Object.entries(priorityStats).forEach(([priority, count]) => {
        this.doc.text(`  ${priority}: ${count}`, this.margin, this.currentY);
        this.currentY += 5;
      });
    }
  }

  // Add footer
  addFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(this.margin, 280, this.pageWidth - this.margin, 280);
      
      // Footer text
      this.doc.setTextColor(150, 150, 150);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`TaskExtreme - Page ${i} of ${pageCount}`, this.margin, 285);
      this.doc.text('Generated by TaskExtreme', this.pageWidth - this.margin - 50, 285, { align: 'right' });
    }
  }

  // Main export function
  async exportPDF() {
    // Show loading message
    this.showLoadingMessage();
    
    try {
      // Wait for library to be available
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        if (this.init()) {
          break;
        }
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('PDF library failed to load after multiple attempts');
      }
      
      // Remove loading message
      this.removeLoadingMessage();
      
      this.createDocument();
      this.addHeader();
      this.addDateInfo();
      this.addDaySummary();
      this.addTasksTable();
      this.addTaskDetails();
      this.addStatistics();
      this.addFooter();

      // Generate filename
      const dayTitle = document.getElementById('tasks-day-title').textContent;
      const date = new Date().toISOString().split('T')[0];
      const filename = `TaskExtreme-${dayTitle}-${date}.pdf`;

      // Save the PDF
      this.doc.save(filename);
      
      // Show success message
      this.showSuccessMessage();
      
    } catch (error) {
      console.error('PDF generation error:', error);
      this.removeLoadingMessage();
      alert(`Error generating PDF: ${error.message}. Please refresh the page and try again.`);
    }
  }

  // Show loading message
  showLoadingMessage() {
    const message = document.createElement('div');
    message.id = 'pdf-loading-message';
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a73e8;
      color: white;
      padding: 20px 30px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 16px;
      text-align: center;
    `;
    message.innerHTML = `
      <div style="margin-bottom: 10px;">🔄</div>
      <div>Generating PDF...</div>
      <div style="font-size: 12px; margin-top: 5px;">Please wait</div>
    `;
    
    document.body.appendChild(message);
  }

  // Remove loading message
  removeLoadingMessage() {
    const message = document.getElementById('pdf-loading-message');
    if (message && message.parentNode) {
      message.parentNode.removeChild(message);
    }
  }

  // Show success message
  showSuccessMessage() {
    // Create a temporary success message
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    `;
    message.textContent = 'PDF generated successfully!';
    
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 3000);
  }
}

// Initialize PDF export when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('generate-pdf');
  if (!exportBtn) return;

  const pdfExporter = new PDFExporter();
  
  exportBtn.addEventListener('click', async () => {
    try {
      await pdfExporter.exportPDF();
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF generation failed. Please try again.');
    }
  });
});

// Add CSS animation for success message
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
