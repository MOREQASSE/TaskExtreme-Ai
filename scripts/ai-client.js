// Client-side AI task generation using Azure AI SDK
class AITaskGenerator {
    constructor() {
      this.endpoint = 'https://models.github.ai/inference';
      this.model = 'openai/gpt-4.1';
      this.token = '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';
    }
  
    async generateTasks(projectDesc) {
      try {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        
        const systemPrompt = this.getSystemPrompt(currentDate);
        
        // Initialize the Azure AI client
        const client = this.getAzureClient();
        if (!client) {
          throw new Error('Failed to initialize AI client');
        }
  
        // Make the API request using Azure SDK
        const response = await client.path("/chat/completions").post({
          body: {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: projectDesc }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            model: this.model
          }
        });
  
        console.log('AI Response status:', response.status);
        console.log('AI Response body:', JSON.stringify(response.body, null, 2));
  
        // Handle the response
        if (response.status !== 200) {
          console.error('Unexpected response status:', response.status);
          throw new Error(`AI service returned status ${response.status}`);
        }
  
        const aiResponse = response.body;
        if (aiResponse && aiResponse.choices && aiResponse.choices[0] && aiResponse.choices[0].message && aiResponse.choices[0].message.content) {
          try {
            const parsed = JSON.parse(aiResponse.choices[0].message.content);
            if (parsed.tasks && Array.isArray(parsed.tasks)) {
              return parsed.tasks.map(task => ({
                ...task,
                id: task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                category: task.category || 'Uncategorized',
                priority: task.priority || 'medium',
                date: task.date || currentDate,
                timeStart: task.timeStart || '09:00',
                timeEnd: task.timeEnd || '10:00',
                repeat: task.repeat || null,
                dueDate: task.dueDate || null,
                completed: task.completed || false
              }));
            }
          } catch (e) {
            console.error('Failed to parse AI response:', e);
            // Fall through to generate fallback tasks
          }
        }
        
        // If we get here, the response wasn't in the expected format
        console.log('Generating fallback tasks due to unexpected response format');
        return this.generateFallbackTasks(projectDesc);
        
      } catch (error) {
        console.error('AI Task Generation Error:', error);
        // Generate fallback tasks if API fails
        return this.generateFallbackTasks(projectDesc);
      }
    }
    
    // Helper method to get the Azure client
    getAzureClient() {
      try {
        // In a real implementation, we'd use the Azure SDK
        // For client-side, we'll mock the client with fetch
        return {
          path: (path) => ({
            post: async (options) => {
              const response = await fetch(`${this.endpoint}${path}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.token}`,
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  ...options.body,
                  // Add any required Azure-specific fields
                })
              });
              
              if (!response.ok) {
                const error = await response.text().catch(() => ({}));
                return {
                  status: response.status,
                  body: { error: error || 'Unknown error' }
                };
              }
              
              const data = await response.json().catch(() => ({}));
              return {
                status: response.status,
                body: data
              };
            }
          })
        };
      } catch (error) {
        console.error('Error initializing Azure client:', error);
        return null;
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
  
