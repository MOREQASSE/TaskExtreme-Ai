// Quick Notes Functionality
class QuickNotes {
    constructor() {
        this.notes = [];
        this.container = document.getElementById('quick-notes-container');
        this.addBtn = document.getElementById('add-note-btn');
        this.init();
    }

    init() {
        this.loadNotes();
        this.renderNotes();
        this.bindEvents();
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addNewNote());
    }

    loadNotes() {
        const savedNotes = localStorage.getItem('quickNotes');
        this.notes = savedNotes ? JSON.parse(savedNotes) : [];
    }

    saveNotes() {
        localStorage.setItem('quickNotes', JSON.stringify(this.notes));
    }

    addNewNote() {
        const newNote = {
            id: Date.now(),
            title: 'New Note',
            content: '',
            timestamp: new Date().toISOString(),
            isEditing: true
        };
        
        this.notes.unshift(newNote);
        this.saveNotes();
        this.renderNotes();
        
        // Focus on the new note's title
        setTimeout(() => {
            const newNoteElement = this.container.querySelector(`[data-note-id="${newNote.id}"]`);
            if (newNoteElement) {
                const titleInput = newNoteElement.querySelector('.quick-note-title');
                if (titleInput) {
                    titleInput.focus();
                    titleInput.select();
                }
            }
        }, 100);
    }

    deleteNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        this.saveNotes();
        this.renderNotes();
    }

    startEditing(id) {
        const note = this.notes.find(note => note.id === id);
        if (note) {
            note.isEditing = true;
            this.saveNotes();
            this.renderNotes();
            
            // Focus on the title input
            setTimeout(() => {
                const noteElement = this.container.querySelector(`[data-note-id="${id}"]`);
                if (noteElement) {
                    const titleInput = noteElement.querySelector('.quick-note-title');
                    if (titleInput) {
                        titleInput.focus();
                    }
                }
            }, 100);
        }
    }

    saveNote(id) {
        const noteElement = this.container.querySelector(`[data-note-id="${id}"]`);
        if (!noteElement) return;

        const titleInput = noteElement.querySelector('.quick-note-title');
        const contentInput = noteElement.querySelector('.quick-note-content');
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title && !content) {
            this.deleteNote(id);
            return;
        }

        const note = this.notes.find(note => note.id === id);
        if (note) {
            note.title = title || 'Untitled Note';
            note.content = content;
            note.timestamp = new Date().toISOString();
            note.isEditing = false;
            this.saveNotes();
            this.renderNotes();
        }
    }

    cancelEdit(id) {
        const note = this.notes.find(note => note.id === id);
        if (note) {
            if (!note.title && !note.content) {
                // If it's a new note with no content, delete it
                this.deleteNote(id);
            } else {
                note.isEditing = false;
                this.saveNotes();
                this.renderNotes();
            }
        }
    }

    renderNotes() {
        if (this.notes.length === 0) {
            this.container.innerHTML = `
                <div class="quick-notes-empty">
                    <div class="empty-icon">📝</div>
                    <p>No notes yet. Click the + button to add your first note!</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = this.notes.map(note => this.renderNote(note)).join('');
        this.bindNoteEvents();
    }

    renderNote(note) {
        const timestamp = new Date(note.timestamp).toLocaleString();
        
        if (note.isEditing) {
            return `
                <div class="quick-note quick-note-editing" data-note-id="${note.id}">
                    <div class="quick-note-header">
                        <input type="text" class="quick-note-title" value="${note.title}" placeholder="Note title...">
                        <button class="quick-note-close" title="Delete note">×</button>
                    </div>
                    <textarea class="quick-note-content" placeholder="Write your note here...">${note.content}</textarea>
                    <div class="quick-note-actions">
                        <button class="quick-note-save">Save</button>
                        <button class="quick-note-cancel">Cancel</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="quick-note" data-note-id="${note.id}">
                    <div class="quick-note-header">
                        <h4 class="quick-note-title">${note.title}</h4>
                        <button class="quick-note-close" title="Delete note">×</button>
                    </div>
                    <div class="quick-note-content">${note.content || '<em>No content</em>'}</div>
                    <div class="quick-note-timestamp">${timestamp}</div>
                </div>
            `;
        }
    }

    bindNoteEvents() {
        // Bind close button events
        this.container.querySelectorAll('.quick-note-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteElement = e.target.closest('.quick-note');
                const noteId = parseInt(noteElement.dataset.noteId);
                this.deleteNote(noteId);
            });
        });

        // Bind save button events
        this.container.querySelectorAll('.quick-note-save').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteElement = e.target.closest('.quick-note');
                const noteId = parseInt(noteElement.dataset.noteId);
                this.saveNote(noteId);
            });
        });

        // Bind cancel button events
        this.container.querySelectorAll('.quick-note-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteElement = e.target.closest('.quick-note');
                const noteId = parseInt(noteElement.dataset.noteId);
                this.cancelEdit(noteId);
            });
        });

        // Bind double-click to edit
        this.container.querySelectorAll('.quick-note:not(.quick-note-editing)').forEach(noteElement => {
            noteElement.addEventListener('dblclick', (e) => {
                if (e.target.classList.contains('quick-note-close')) return;
                const noteId = parseInt(noteElement.dataset.noteId);
                this.startEditing(noteId);
            });
        });

        // Handle Enter key in title input
        this.container.querySelectorAll('.quick-note-title').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const noteElement = e.target.closest('.quick-note');
                    const noteId = parseInt(noteElement.dataset.noteId);
                    this.saveNote(noteId);
                }
            });
        });

        // Handle Ctrl+Enter in content textarea
        this.container.querySelectorAll('.quick-note-content').forEach(textarea => {
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    const noteElement = e.target.closest('.quick-note');
                    const noteId = parseInt(noteElement.dataset.noteId);
                    this.saveNote(noteId);
                }
            });
        });
    }
}

// Initialize Quick Notes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuickNotes();
}); 