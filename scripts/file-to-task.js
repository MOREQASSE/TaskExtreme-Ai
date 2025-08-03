// file-to-task.js
// Handles in-browser extraction of tasks from uploaded files (PDFs)
// Requires: pdf.js (via CDN), Azure SDK, and githubToken logic available globally

const FILE_TO_TASK_DEBUG = false; // Set to true for verbose logging

function debugLog(...args) {
    if (FILE_TO_TASK_DEBUG) console.log('[file-to-task]', ...args);
}

// Load pdf.js from CDN if not already loaded
definePdfJs();

function definePdfJs() {
    if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.js';
        script.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js'; };
        document.head.appendChild(script);
    } else {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js';
    }
}

/**
 * Extracts text from a PDF file using pdf.js
 * @param {File} file - The PDF file object
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromPDF(file) {
    try {
        await new Promise(resolve => {
            if (window.pdfjsLib) return resolve();
            const check = setInterval(() => { if (window.pdfjsLib) { clearInterval(check); resolve(); } }, 50);
        });
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let paragraphs = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            // Try to preserve paragraph structure by grouping by y-position
            let linesByY = {};
            content.items.forEach(item => {
                const y = Math.round(item.transform[5]);
                if (!linesByY[y]) linesByY[y] = [];
                linesByY[y].push(item.str);
            });
            let pageParagraphs = Object.values(linesByY).map(words => words.join(' ').replace(/\s+/g, ' ').trim());
            pageParagraphs = pageParagraphs.filter(Boolean);
            paragraphs.push(...pageParagraphs);
        }
        const text = paragraphs.join('\n').replace(/\n{2,}/g, '\n');
        debugLog('Extracted PDF text:', text);
        return text;
    } catch (error) {
        debugLog('PDF extraction error:', error);
        throw new Error('Failed to extract text from PDF: ' + error.message);
    }
}

/**
 * Generates tasks from extracted text using AI (Azure SDK)
 * @param {string} text - Extracted text from file
 * @param {object} options - { azureClient, githubToken } (if needed)
 * @returns {Promise<Array>} - Array of task objects
 */
async function generateTasksFromText(text, options = {}) {
    try {
        if (window.azureClient) {
            const prompt = `You are an AI assistant. Read the following content and extract a list of actionable tasks. Respond in JSON array format, each element should be an object with 'title' and 'description'.\n\nCONTENT:\n${text}`;
            debugLog('Sending prompt to Azure:', prompt);
            const response = await window.azureClient.complete({ prompt, max_tokens: 1024, temperature: 0.3 });
            let aiText = response.choices && response.choices[0] && response.choices[0].text ? response.choices[0].text : '';
            debugLog('Azure AI raw response:', aiText);
            // Try to extract the first valid JSON array from the response
            let match = aiText.match(/\[.*?\]/s);
            if (match) {
                try {
                    // Sometimes AI adds trailing commas or minor errors, try to fix common ones
                    let jsonStr = match[0].replace(/,\s*\]/g, "]");
                    let tasks = JSON.parse(jsonStr);
                    // Validate and sanitize each task
                    if (Array.isArray(tasks)) {
                        tasks = tasks.map((task, i) => ({
                            title: (task.title && typeof task.title === 'string') ? task.title.trim() : `Task ${i+1}`,
                            description: (task.description && typeof task.description === 'string') ? task.description.trim() : '',
                        }));
                        debugLog('Parsed tasks:', tasks);
                        return tasks;
                    } else {
                        debugLog('AI response JSON is not an array');
                        return [{ title: 'Error', description: 'AI response JSON is not an array.' }];
                    }
                } catch (e) {
                    debugLog('AI response JSON parse error:', e);
                    return [{ title: 'Error', description: 'Could not parse AI response: ' + e.message }];
                }
            }
            debugLog('No valid JSON array found in AI response');
            return [{ title: 'Error', description: 'AI did not return a valid JSON array.' }];
        }
        // Fallback: naive split (one sentence per task)
        const fallbackTasks = text.split(/\n|\./).filter(Boolean).map((line, i) => ({ title: `Task ${i+1}`, description: line.trim() }));
        debugLog('Fallback tasks:', fallbackTasks);
        return fallbackTasks;
    } catch (error) {
        debugLog('AI task generation error:', error);
        return [{ title: 'Error', description: 'Failed to generate tasks: ' + error.message }];
    }
}

/**
 * Main entry: Extracts tasks from a file (PDF for now)
 * @param {File} file
 * @param {object} options - { azureClient, githubToken }
 * @returns {Promise<Array>} - Array of task objects
 */
async function extractTasksFromFile(file, options = {}) {
    if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        return await generateTasksFromText(text, options);
    }
    // Add more file types if needed
    return [{ title: 'Unsupported file type', description: file.type }];
}

// Export for use in other scripts
window.extractTasksFromFile = extractTasksFromFile;
