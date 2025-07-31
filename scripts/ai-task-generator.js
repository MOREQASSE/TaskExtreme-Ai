// AI Task Generator Backend Script (Node.js)
// Handles Azure AI Inference API calls securely
// Usage: node scripts/ai-task-generator.js

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const ModelClient = require('@azure-rest/ai-inference').default;
const { isUnexpected } = require('@azure-rest/ai-inference');
const { AzureKeyCredential } = require('@azure/core-auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

const endpoint = 'https://models.github.ai/inference'; // Correct Azure endpoint
const model = 'openai/gpt-4.1';
const token = process.env.GITHUB_TOKEN; // GitHub token must be provided via environment variable

// Check for required environment variables
if (!token) {
  console.error('ERROR: GITHUB_TOKEN environment variable is not set!');
  console.error('Please set the GITHUB_TOKEN environment variable');
  console.error('Get your token from: https://github.com/settings/tokens');
  process.exit(1);
}

// Helper: Extract text from PDF (simple, for demo)
const pdfParse = async (buffer) => {
  const pdfjsLib = require('pdfjs-dist');
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
};

// Helper: Get date from day offset
const getDateFromDayOffset = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
};

// Helper: Get next specific day of week (0=Sunday, 1=Monday, etc.)
const getNextDayOfWeek = (dayOfWeek) => {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
  date.setDate(date.getDate() + daysUntilTarget);
  return date.toISOString().split('T')[0];
};

// Helper: Convert time string to 24-hour format
const parseTimeString = (timeStr) => {
  if (!timeStr) return null;
  
  // Handle formats like "3pm", "3:30pm", "15:30", etc.
  const time = timeStr.toLowerCase().trim();
  
  // If already in 24-hour format
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    return time;
  }
  
  // Handle 12-hour format with am/pm
  const match = time.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3];
    
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return null;
};

// Helper: Generate fallback tasks when AI service fails
const generateFallbackTasks = (userContent, currentDate) => {
  const tasks = [];
  const words = userContent.toLowerCase().split(' ');
  
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
  
  // Determine priority based on urgency words
  let priority = 'medium';
  if (words.some(w => ['urgent', 'asap', 'immediate', 'critical', 'emergency'].includes(w))) {
    priority = 'high';
  } else if (words.some(w => ['low', 'sometime', 'when'].includes(w))) {
    priority = 'low';
  }
  
  // Generate 3-5 tasks based on the content
  const taskCount = Math.min(5, Math.max(3, Math.ceil(userContent.length / 50)));
  
  for (let i = 0; i < taskCount; i++) {
    const taskDate = getDateFromDayOffset(i);
    const startHour = 9 + (i * 2); // Spread tasks throughout the day
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

app.post('/api/ai-generate-tasks', async (req, res) => {
  try {
    let userContent = '';
    // Enhanced file handling
    if (req.body.desc && req.body.desc.trim()) {
      userContent = req.body.desc.trim();
    } else if (req.files && req.files.file) {
      const uploadedFile = req.files.file;
      const fileName = uploadedFile.name || 'uploaded file';
      const fileType = uploadedFile.mimetype || '';
      const ext = fileName.split('.').pop().toLowerCase();
      // PDF
      if (fileType === 'application/pdf' || ext === 'pdf') {
        userContent = await pdfParse(uploadedFile.data);
        userContent = `The following is the extracted text from the PDF file '${fileName}':\n\n` + userContent;
      } else if (
        fileType.startsWith('text/') ||
        [
          'txt','csv','md','json','js','ts','py','java','c','cpp','cs','html','css','xml','yml','yaml','log','ini','cfg','conf','toml','jsonl','ipynb','tex','rst','adoc','asciidoc','bat','sh','php','rb','go','rs','swift','kt','dart','sql','pl','lua','asm','s','f90','f','r','sas','jsp','asp','aspx','vue','jsx','tsx','lock','env','ps1','vbs','wsf'
        ].includes(ext)
      ) {
        userContent = uploadedFile.data.toString('utf8');
        userContent = `The following is the content of the file '${fileName}':\n\n` + userContent;
      } else if (
        [
          'xls','xlsx','xlsm','xlsb','ods','ots','sxc','stc','uos','uof','csv','tsv'
        ].includes(ext)
      ) {
        // Excel/CSV: try to read as text
        userContent = uploadedFile.data.toString('utf8');
        userContent = `The following is the content of the spreadsheet file '${fileName}':\n\n` + userContent;
      } else if (fileType.startsWith('image/')) {
        userContent = `The user uploaded an image file named ${fileName} (${fileType}). Please infer tasks based on this context.`;
      } else {
        userContent = `The user uploaded a file named ${fileName} of type ${fileType}. Please infer tasks based on this context.`;
      }
    } else if (req.body.sheet && req.body.sheet.trim()) {
      userContent = `The following Google Sheet describes the project: ${req.body.sheet.trim()}`;
    } else {
      return res.status(400).json({ error: 'No valid input provided.' });
    }

    // Log what is being sent to the AI
    console.log('Sending to AI:', userContent.slice(0, 1000));

    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(token),
    );

    if (!client) {
      throw new Error('Failed to initialize AI client');
    }

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const context = req.body.context || {};
    const deadline = context.deadline || 'None';

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
9. NEVER use "day" field, always use "date" field with YYYY-MM-DD format

EXAMPLES OF DATE/TIME PARSING:
- "Tea session with wife tomorrow morning" → date: ${getDateFromDayOffset(1)}, time: 09:00-10:30
- "Meeting next Monday at 2pm" → date: ${getNextDayOfWeek(1)}, time: 14:00-15:30
- "Dinner tonight at 7pm" → date: ${currentDate}, time: 19:00-20:30
- "Weekly team meeting every Monday" → repeat: "days", days: [0] (Monday)

EXAMPLE OUTPUT FOR "Tea session with the wife next friday at 5pm":
{
  "tasks": [
    {
      "id": "ai_123456",
      "title": "Tea session with wife",
      "details": "Evening tea session with wife at 5pm",
      "category": "personal",
      "priority": "medium",
      "timeStart": "17:00",
      "timeEnd": "18:30",
      "date": "${getNextDayOfWeek(5)}",
      "repeat": null,
      "dueDate": null,
      "completed": false
    }
  ]
}

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
    },
    {
      "id": "ai_789012",
      "title": "Design login UI mockups",
      "details": "Create Figma wireframes and mockups for login page",
      "category": "work",
      "priority": "medium",
      "timeStart": "14:00",
      "timeEnd": "16:00",
      "date": "${getDateFromDayOffset(1)}",
      "repeat": null,
      "dueDate": null,
      "completed": false
    },
    {
      "id": "ai_345678",
      "title": "Implement login backend",
      "details": "Set up authentication logic and database integration",
      "category": "work",
      "priority": "high",
      "timeStart": "10:00",
      "timeEnd": "12:00",
      "date": "${getDateFromDayOffset(2)}",
      "repeat": null,
      "dueDate": null,
      "completed": false
    }
  ]
}
`;

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
    console.log('AI Response body:', JSON.stringify(response.body, null, 2));

    if (isUnexpected(response)) {
      console.error('Unexpected response detected. Response body:', response.body);
      
      // Handle specific error cases
      if (response.status === 401) {
        console.error('Authentication failed. Please check your GITHUB_TOKEN.');
        console.error('Get a token from: https://github.com/settings/tokens');
        throw new Error('Authentication failed. Please check your GitHub token configuration.');
      }
      
      const error = response.body && response.body.error ? response.body.error : 'Unexpected response from AI service';
      throw new Error(error);
    }

    // Ensure every task has category and priority fields
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
        // Fallback: return raw response
      }
    }
    
    // If we reach here, the response structure is unexpected
    console.error('Unexpected AI response structure:', aiResponse);
    
    // Fallback: Generate mock tasks based on user input
    console.log('Generating fallback tasks...');
    const fallbackTasks = generateFallbackTasks(userContent, currentDate);
    return res.json({ tasks: fallbackTasks });
  } catch (err) {
    console.error('AI task generation error:', err);
    
    // If it's an authentication error, provide fallback tasks
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

app.listen(PORT, () => {
  console.log(`AI Task Generator backend running on port ${PORT}`);
});
