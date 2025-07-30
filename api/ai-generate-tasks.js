// Vercel API Route for AI Task Generation
// This file exports the handler function for Vercel

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const ModelClient = require('@azure-rest/ai-inference').default;
const { isUnexpected } = require('@azure-rest/ai-inference');
const { AzureKeyCredential } = require('@azure/core-auth');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Configuration
const endpoint = 'https://models.github.ai/inference';
const model = 'openai/gpt-4.1';
const token = process.env.GITHUB_TOKEN;

// Helper functions
const getDateFromDayOffset = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
};

const getNextDayOfWeek = (dayOfWeek) => {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
  date.setDate(date.getDate() + daysUntilTarget);
  return date.toISOString().split('T')[0];
};

const generateFallbackTasks = (userContent, currentDate) => {
  const tasks = [];
  const words = userContent.toLowerCase().split(' ');
  
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
  
  let priority = 'medium';
  if (words.some(w => ['urgent', 'asap', 'immediate', 'critical', 'emergency'].includes(w))) {
    priority = 'high';
  } else if (words.some(w => ['low', 'sometime', 'when'].includes(w))) {
    priority = 'low';
  }
  
  const taskCount = Math.min(5, Math.max(3, Math.ceil(userContent.length / 50)));
  
  for (let i = 0; i < taskCount; i++) {
    const taskDate = getDateFromDayOffset(i);
    const startHour = 9 + (i * 2);
    const endHour = startHour + 1;
    
    tasks.push({
      id: `fallback_${Date.now()}_${i}`,
      title: `Task ${i + 1} for ${userContent.slice(0, 30)}...`,
      details: `Generated fallback task based on: ${userContent}`,
      category: category,
      priority: priority,
      timeStart: `${startHour.toString().padStart(2, '0')}:00`,
      timeEnd: `${endHour.toString().padStart(2, '0')}:00`,
      date: taskDate,
      repeat: null,
      dueDate: null,
      completed: false
    });
  }
  
  return tasks;
};

// API Route Handler
app.post('/api/ai-generate-tasks', async (req, res) => {
  try {
    let userContent = '';
    
    if (req.body.desc && req.body.desc.trim()) {
      userContent = req.body.desc.trim();
    } else if (req.files && req.files.file) {
      const uploadedFile = req.files.file;
      const fileName = uploadedFile.name || 'uploaded file';
      userContent = `The user uploaded a file named ${fileName}. Please infer tasks based on this context.`;
    } else if (req.body.sheet && req.body.sheet.trim()) {
      userContent = `The following Google Sheet describes the project: ${req.body.sheet.trim()}`;
    } else {
      return res.status(400).json({ error: 'No valid input provided.' });
    }

    console.log('Sending to AI:', userContent.slice(0, 1000));

    if (!token) {
      console.log('No GitHub token found, using fallback tasks');
      const fallbackTasks = generateFallbackTasks(userContent, new Date().toISOString().split('T')[0]);
      return res.json({ 
        tasks: fallbackTasks,
        warning: 'AI service unavailable. Generated fallback tasks based on your input.'
      });
    }

    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(token),
    );

    if (!client) {
      throw new Error('Failed to initialize AI client');
    }

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];

    const systemPrompt = `You are TaskExtreme's AI scheduler. Convert project descriptions into tasks matching this EXACT JSON format:

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

CRITICAL: Every task MUST include 'category' and 'priority' fields. Use the most appropriate value based on the task description. If unsure, use 'Uncategorized' for category and 'medium' for priority.

CRITICAL DATE/TIME PARSING RULES:
1. Current date: ${currentDate}
2. ALWAYS extract date/time information from user input
3. If no date/time specified, distribute across 3-5 days starting from today
4. Time blocks must be 30-120 minutes duration
5. Use 24-hour format (HH:MM)
6. Required fields: title, timeStart, timeEnd, date, category, priority
7. Date format: YYYY-MM-DD

EXAMPLE OUTPUT FOR "Build a login page":
{
  "tasks": [
    {
      "id": "ai_123456",
      "title": "Plan login page requirements",
      "details": "Define user stories, wireframes, and technical requirements",
      "category": "work",
      "priority": "high",
      "timeStart": "09:00",
      "timeEnd": "10:30",
      "date": "${currentDate}",
      "repeat": null,
      "dueDate": null,
      "completed": false
    }
  ]
}`;

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        temperature: 1,
        top_p: 1,
        model: model
      }
    });

    console.log('AI Response status:', response.status);

    if (isUnexpected(response)) {
      console.error('Unexpected response detected. Response body:', response.body);
      
      if (response.status === 401) {
        console.error('Authentication failed. Please check your GITHUB_TOKEN.');
        const fallbackTasks = generateFallbackTasks(userContent, currentDate);
        return res.json({ 
          tasks: fallbackTasks,
          warning: 'AI service unavailable. Generated fallback tasks based on your input.'
        });
      }
      
      const error = response.body && response.body.error ? response.body.error : 'Unexpected response from AI service';
      throw new Error(error);
    }

    let aiResponse = response.body;
    if (aiResponse && aiResponse.choices && aiResponse.choices[0] && aiResponse.choices[0].message && aiResponse.choices[0].message.content) {
      try {
        const parsed = JSON.parse(aiResponse.choices[0].message.content);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          parsed.tasks = parsed.tasks.map(task => ({
            ...task,
            category: task.category || 'Uncategorized',
            priority: task.priority || 'medium'
          }));
          return res.json({ tasks: parsed.tasks });
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e);
      }
    }
    
    console.log('Generating fallback tasks...');
    const fallbackTasks = generateFallbackTasks(userContent, currentDate);
    return res.json({ tasks: fallbackTasks });
  } catch (err) {
    console.error('AI task generation error:', err);
    
    if (err.message && err.message.includes('Authentication failed')) {
      console.log('Using fallback task generation due to authentication error...');
      const fallbackTasks = generateFallbackTasks(userContent, currentDate);
      return res.json({ 
        tasks: fallbackTasks,
        warning: 'AI service unavailable. Generated fallback tasks based on your input.'
      });
    }
    
    const errorMessage = err && err.message ? err.message : 
                        (err && typeof err === 'string') ? err : 
                        'Internal Server Error';
    res.status(500).json({ error: errorMessage });
  }
});

// Export for Vercel
module.exports = app; 