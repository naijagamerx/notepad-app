/**
 * @fileoverview Note operations including delete, save, and auto-save functionality
 */

class NoteOperations {
    constructor(notesApp) {
        if (!this.validateNotesApp(notesApp)) {
            return;
        }
        this.notesApp = notesApp;
        this.autoSaveTimeout = null;
        this.initialized = false;
        this.initializeWithRetry();
    }

    /**
     * Validate NotesApp instance
     * @param {NotesApp} notesApp - The NotesApp instance to validate
     * @returns {boolean} - Whether the NotesApp instance is valid
     */
    validateNotesApp(notesApp) {
        if (!notesApp) {
            this.showError('NotesApp instance is required for NoteOperations');
            return false;
        }
        if (!notesApp.noteContent || !notesApp.noteTitle) {
            this.showError('NotesApp is missing required elements');
            return false;
        }
        return true;
    }

    /**
     * Initialize with retry mechanism
     * @private
     */
    initializeWithRetry() {
        let retryCount = 0;
        const maxRetries = 3;
        const retryInterval = 100; // ms

        const tryInitialize = () => {
            try {
                if (this.notesApp.noteContent) {
                    this.initializeAutoSave();
                    this.initialized = true;
                    console.log('NoteOperations initialized successfully');
                } else if (retryCount < maxRetries) {
                    retryCount++;
                    console.warn(`Retrying initialization (${retryCount}/${maxRetries})...`);
                    setTimeout(tryInitialize, retryInterval);
                } else {
                    this.showError('Failed to initialize NoteOperations after multiple attempts');
                }
            } catch (error) {
                this.showError('Error initializing NoteOperations', error);
            }
        };

        tryInitialize();
    }

    /**
     * Show error with proper formatting
     * @param {string} message - Error message
     * @param {Error} [error] - Optional error object
     */
    showError(message, error = null) {
        console.error('%c[NoteOperations Error]%c ' + message, 
            'color: #ff4757; font-weight: bold', 
            'color: inherit');
        if (error) {
            console.error('Details:', error);
        }
        // Could add UI error notification here if needed
    }

    /**
     * Delete a note by ID
     * @param {string} noteId - The ID of the note to delete
     */
    deleteNote(noteId) {
        // Use the DeleteNoteOperations instance to handle deletion
        if (window.deleteNoteOperations) {
            window.deleteNoteOperations.deleteNote(noteId);
        } else {
            console.error('DeleteNoteOperations not initialized');
        }
    }

    /**
     * Save the current note
     */
    saveNote() {
        if (!this.notesApp.currentNote) return;

        this.notesApp.currentNote.title = this.notesApp.noteTitle.value || 'Untitled Note';
        this.notesApp.currentNote.content = this.notesApp.noteContent.innerHTML;
        this.notesApp.currentNote.lastModified = new Date().getTime();

        this.notesApp.saveNotes();
        this.notesApp.renderNotesList();
        this.notesApp.updateSaveButton();

        // Show save indicator
        this.showSaveIndicator();
    }

    /**
     * Initialize auto-save functionality
     */
    initializeAutoSave() {
        if (!this.notesApp || !this.notesApp.noteContent) {
            console.warn('Cannot initialize auto-save: required elements not found');
            return;
        }

        const autoSaveDelay = 2000; // 2 seconds

        const autoSave = () => {
            if (this.notesApp.currentNote && this.notesApp.noteContent) {
                this.saveNote();
            }
        };

        this.notesApp.noteContent.addEventListener('input', () => {
            if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(autoSave, autoSaveDelay);
        });
    }

    /**
     * Show a temporary save indicator
     */
    showSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'save-indicator';
        indicator.textContent = 'Saved';
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.classList.add('fade-out');
            setTimeout(() => indicator.remove(), 500);
        }, 1500);
    }
}

class DeleteNoteOperations {
    constructor() {
        this.initialized = false;
        this.initializeWithValidation();
    }

    initializeWithValidation() {
        try {
            if (!window.notesApp) {
                this.showError('NotesApp must be initialized before DeleteNoteOperations');
                return;
            }

            this.notesApp = window.notesApp;
            this.modal = document.getElementById('deleteConfirmModal');
            this.confirmBtn = document.getElementById('confirmDelete');
            this.cancelBtn = document.getElementById('cancelDelete');
            this.pendingDeleteNoteId = null;

            if (!this.modal || !this.confirmBtn || !this.cancelBtn) {
                this.showError('Required modal elements not found');
                return;
            }

            this.initializeEventListeners();
            this.initialized = true;
            console.log('DeleteNoteOperations initialized successfully');
        } catch (error) {
            this.showError('Error initializing DeleteNoteOperations', error);
        }
    }

    initializeEventListeners() {
        // Delete button in toolbar
        const deleteBtn = document.getElementById('deleteNoteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.notesApp.currentNote) {
                    this.showDeleteModal(this.notesApp.currentNote.id);
                }
            });
        }

        // Confirm delete button in modal
        this.confirmBtn.addEventListener('click', () => this.confirmDelete());
        
        // Cancel delete button in modal
        this.cancelBtn.addEventListener('click', () => this.hideDeleteModal());
        
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideDeleteModal();
            }
        });

        // Context menu delete
        document.addEventListener('click', (e) => {
            const deleteAction = e.target.closest('[data-delete-note]');
            if (deleteAction) {
                const noteId = deleteAction.dataset.deleteNote;
                if (noteId) {
                    this.showDeleteModal(noteId);
                }
            }
        });
    }

    showDeleteModal(noteId) {
        const note = this.notesApp.notes.find(n => n.id.toString() === noteId.toString());
        if (!note) return;

        this.pendingDeleteNoteId = noteId;
        const titleElement = this.modal.querySelector('.note-title');
        if (titleElement) {
            titleElement.textContent = `"${note.title || 'Untitled Note'}"`;
        }
        
        this.modal.style.display = 'block';
        document.body.classList.add('modal-open');
    }

    hideDeleteModal() {
        this.modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        this.pendingDeleteNoteId = null;
    }

    confirmDelete() {
        if (!this.pendingDeleteNoteId) return;
        
        const noteId = this.pendingDeleteNoteId;
        this.hideDeleteModal();
        
        try {
            const noteIndex = this.notesApp.notes.findIndex(n => n.id.toString() === noteId.toString());
            if (noteIndex === -1) return;

            // Remove the note
            this.notesApp.notes.splice(noteIndex, 1);
            
            // Clear editor if deleted note was current
            if (this.notesApp.currentNote && this.notesApp.currentNote.id.toString() === noteId.toString()) {
                this.notesApp.currentNote = null;
                this.notesApp.noteTitle.value = '';
                this.notesApp.noteContent.innerHTML = '';
            }

            // Save and update UI
            this.notesApp.saveNotes();
            this.notesApp.renderNotesList();

            // Show success notification
            if (window.fileOperations) {
                window.fileOperations.showNotification('Note deleted successfully', 'success');
            }

            // Select another note if available
            if (this.notesApp.notes.length > 0) {
                this.notesApp.selectNote(this.notesApp.notes[0]);
            }

        } catch (error) {
            console.error('Error deleting note:', error);
            if (window.fileOperations) {
                window.fileOperations.showNotification('Error deleting note', 'error');
            }
        }
    }

    deleteNote(noteId) {
        if (!this.initialized) {
            this.showError('DeleteNoteOperations not properly initialized');
            return;
        }
        this.showDeleteModal(noteId);
    }

    showError(message, error = null) {
        console.error('%c[DeleteNoteOperations Error]%c ' + message,
            'color: #ff4757; font-weight: bold',
            'color: inherit');
        if (error) {
            console.error('Details:', error);
        }
    }
}

// Export the classes for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NoteOperations, DeleteNoteOperations };
} else {
    window.NoteOperationsClass = NoteOperations;
    window.DeleteNoteOperationsClass = DeleteNoteOperations;
}
