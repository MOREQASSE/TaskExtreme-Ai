// Client-side AI task generation using GitHub's Copilot API
class AITaskGenerator {
  constructor() {
    this.apiUrl = 'https://api.github.com/copilot/completions';
    this.model = 'gpt-4';
    this.token = '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';
  }

  async generateTasks(projectDesc) {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      
      const systemPrompt = `You are an AI assistant that helps break down projects into actionable tasks. 
For the given project, generate specific, actionable tasks with accurate timing of the day depending on task demands or if the user specify it the number of tasks should be dynamic and friendly and helpful to devise complex projects to small manageable tasks. make sure you strictly follow the following JSON format with not a single word outside of it:

{
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description of the task",
      "priority": "high/medium/low",
      "estimatedTime": "X hours/days",
      "category": "work/personal/health/education/finance/home/social/hobby/Uncategorized"
    }
  ]
}

IMPORTANT: Only respond with valid JSON, no other text.`;

      const requestBody = {
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Project: ${projectDesc}` }
        ],
        temperature: 0.7,
        max_tokens: 2000
      };

      console.log('Sending request to GitHub Copilot API:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to generate tasks');
      }
      
      const result = await response.json();
      return this.parseAITasks(result, currentDate);
      
    } catch (error) {
      console.error('AI Task Generation Error:', error);
      // Return a user-friendly error task
      return [{
        title: 'Error generating tasks',
        description: error.message || 'Failed to generate tasks. Please try again later.',
        priority: 'high',
        category: 'Uncategorized',
        estimatedTime: '5 minutes'
      }];
    }
  }
  
  parseAITasks(aiResponse, currentDate) {
    try {
      // Extract the content from the response
      let content = '';
      
      // Handle different response formats
      if (aiResponse.choices?.[0]?.message?.content) {
        content = aiResponse.choices[0].message.content;
      } else if (aiResponse.completion) {
        content = aiResponse.completion;
      } else if (aiResponse.choices?.[0]?.text) {
        content = aiResponse.choices[0].text;
      } else {
        throw new Error('No valid response content found');
      }
      
      // Clean the response
      const cleanContent = content
        .replace(/```(?:json)?\n?([\s\S]*?)\n?```/g, '$1')  // Remove code blocks
        .replace(/^[^{]*/, '')  // Remove anything before the first {
        .replace(/[^}]*$/, '')  // Remove anything after the last }
        .trim();
      
      if (!cleanContent) {
        throw new Error('No valid JSON found in response');
      }
      
      // Parse the JSON content
      const parsed = JSON.parse(cleanContent);
      
      // Process tasks from the response
      let tasks = [];
      if (Array.isArray(parsed)) {
        tasks = parsed; // Direct array of tasks
      } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
        tasks = parsed.tasks; // Object with tasks array
      } else if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        tasks = [parsed]; // Single task object
      } else {
        throw new Error('Unexpected response format');
      }
      
      // Format tasks for the app
      return tasks.map((task, index) => ({
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: task.title || `Task ${index + 1}`,
        details: task.description || task.details || '',
        category: task.category || 'Uncategorized',
        priority: task.priority || 'medium',
        timeStart: task.timeStart || '09:00',
        timeEnd: task.timeEnd || '10:00',
        date: task.date || currentDate,
        dueDate: task.dueDate || '',
        repeat: task.repeat || null,
        completed: task.completed || false,
        estimatedTime: task.estimatedTime || '30 minutes'
      }));
      
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback: Return a generic error task
      return [{
        id: `task_${Date.now()}_error`,
        title: 'Error processing tasks',
        details: 'The AI response could not be processed. Please try again with a different description.',
        priority: 'high',
        category: 'Uncategorized',
        timeStart: '09:00',
        timeEnd: '10:00',
        date: currentDate,
        repeat: null,
        completed: false,
        estimatedTime: '5 minutes'
      }];
    }
  }
  
  // Generate the system prompt with the current date
  getSystemPrompt(currentDate) {
    return `You are TaskExtreme's AI scheduler. Convert project descriptions into tasks matching this EXACT JSON format:

{
  "tasks": [
    {
      "id": "generated_id_here",
      "title": "Task name",
      "details": "Specific steps",
      "category": "work | personal | health | education | finance | home | social | hobby | Uncategorized",
      "priority": "high | medium | low",
      "timeStart": "HH:MM",
      "timeEnd": "HH:MM",
      "date": "YYYY-MM-DD",
      "repeat": null,
      "dueDate": "YYYY-MM-DD",
      "completed": false
    }
  ]
}

CRITICAL: Every task MUST include 'category' and 'priority' fields. Use the most appropriate value based on the task description.

CRITICAL DATE/TIME PARSING RULES:
1. Current date: ${currentDate}
2. ALWAYS extract date/time information from user input:
   - "tomorrow" = current date + 1 day
   - "next week" = current date + 7 days
   - "morning" = 08:00-12:00
   - "afternoon" = 13:00-17:00
   - "evening" = 18:00-20:00
   - "night" = 20:00-22:00
   - Specific times like "3pm" = 15:00
   - Days like "Monday" = next Monday from current date
   - "next Monday" = Monday of next week
3. If user specifies a date/time, use that EXACTLY
4. If no date/time specified, distribute across 3-5 days starting from today
5. Time blocks must:
   - Be 30-120 minutes duration
   - Fall within 08:00-20:00 working hours (unless user specifies otherwise)
   - Have buffer time between tasks (at least 15 minutes)
   - Use 24-hour format (HH:MM)
6. Required fields: title, timeStart, timeEnd, date, category, priority
7. Set repeat to null for one-time tasks
8. Date format: YYYY-MM-DD (NOT day numbers!)
9. NEVER use "day" field, always use "date" field with YYYY-MM-DD format`;
  }

  // Fallback task generation if API fails
  generateFallbackTasks(projectDesc) {
    console.log('Generating fallback tasks...');
    const now = new Date();
    const tasks = [];
    const words = projectDesc.toLowerCase().split(' ');
    
    // Determine category based on keywords
    let category = 'Uncategorized';
    if (words.some(w => ['work', 'job', 'business', 'office', 'meeting', 'project', 'client'].includes(w))) {
      category = 'work';
    } else if (words.some(w => ['personal', 'family', 'home', 'house'].includes(w))) {
      category = 'personal';
    } else if (words.some(w => ['health', 'exercise', 'gym', 'workout', 'diet'].includes(w))) {
      category = 'health';
    } else if (words.some(w => ['study', 'learn', 'course', 'education', 'school'].includes(w))) {
      category = 'education';
    }
    
    // Generate 3-5 tasks
    const taskCount = Math.min(5, Math.max(3, Math.ceil(projectDesc.length / 50)));
    
    for (let i = 0; i < taskCount; i++) {
      const taskDate = new Date(now);
      taskDate.setDate(now.getDate() + i);
      const dateStr = taskDate.toISOString().split('T')[0];
      const startHour = 9 + (i * 2);
      const endHour = startHour + 1;
      
      tasks.push({
        id: `fallback_${Date.now()}_${i}`,
        title: `Task ${i + 1}: ${projectDesc.slice(0, 30)}...`,
        details: `Generated fallback task based on: ${projectDesc}`,
        category: category,
        priority: i === 0 ? 'high' : (i === 1 ? 'medium' : 'low'),
        timeStart: `${startHour.toString().padStart(2, '0')}:00`,
        timeEnd: `${endHour.toString().padStart(2, '0')}:00`,
        date: dateStr,
        repeat: null,
        dueDate: null,
        completed: false
      });
    }
    
    return tasks;
  }
}

// Export for browser use
window.AITaskGenerator = AITaskGenerator;
