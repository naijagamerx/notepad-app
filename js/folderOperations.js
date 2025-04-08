/**
 * Centralized Folder Operations for NotePad
 * Handles all folder-related operations to avoid conflicts between script.js and folders.js
 */

class FolderOperations {
    constructor() {
        // Make this a singleton available globally
        if (window.folderOperations) {
            return window.folderOperations;
        }
        
        console.log('[FolderOperations] Initializing...');
        
        // Set as global instance
        window.folderOperations = this;
    }

    /**
     * Move a note to a folder - centralized implementation
     * @param {string|number} noteId - ID of the note to move
     * @param {string|number|null} folderId - ID of the destination folder, or null to remove from folder
     */
    moveNoteToFolder(noteId, folderId) {
        console.log('[FolderOperations] Moving note', noteId, 'to folder', folderId);
        
        if (!window.notesApp) {
            console.error('[FolderOperations] NotesApp not available');
            return;
        }
        
        // Find the note by ID
        const note = window.notesApp.notes.find(n => n.id.toString() === noteId.toString());
        if (!note) {
            console.error('[FolderOperations] Note not found:', noteId);
            return;
        }
        
        // Convert folderId to proper type
        const parsedFolderId = folderId ? parseInt(folderId) : null;
        
        // Update the note's folder ID
        note.folderId = parsedFolderId;
        
        // Save changes to localStorage
        window.notesApp.saveNotes();
        
        // Update folder counts
        if (window.folderManager) {
            window.folderManager.renderFolders();
        }
        
        // Update the notes list based on current view
        this.updateNotesListView(parsedFolderId);
        
        // Show notification
        if (window.notesApp.showNotification) {
            window.notesApp.showNotification('Note moved successfully', 'success');
        }
    }
    
    /**
     * Updates the notes list view based on current context
     * @param {number|null} movedToFolderId - ID of the folder the note was moved to
     */
    updateNotesListView(movedToFolderId) {
        if (!window.notesApp) return;
        
        // If currentFolderId is set, we're in folder view
        if (window.notesApp.currentFolderId) {
            // If we moved to the current folder, just refresh the current view
            if (window.notesApp.currentFolderId === movedToFolderId) {
                window.notesApp.filterNotesByFolder(window.notesApp.currentFolderId);
            } else {
                // We're in a different folder view, so keep that view
                window.notesApp.filterNotesByFolder(window.notesApp.currentFolderId);
            }
        } else {
            // If not in a folder view, just render all notes
            window.notesApp.renderNotesList();
        }
    }
    
    /**
     * Filter and display notes from a specific folder
     * @param {number|string} folderId - ID of the folder to filter by
     */
    filterNotesByFolder(folderId) {
        if (!window.notesApp) return;
        
        const parsedFolderId = parseInt(folderId);
        
        // Set the current folder ID in notesApp
        window.notesApp.currentFolderId = parsedFolderId;
        
        // Get notes that belong to this folder
        const filteredNotes = window.notesApp.notes.filter(note => 
            note.folderId === parsedFolderId
        );
        
        // Render filtered notes
        window.notesApp.renderNotesList(filteredNotes);
        
        // Update UI to show active folder
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active', 'selected');
            if (item.dataset.folderId === folderId.toString()) {
                item.classList.add('active', 'selected');
            }
        });
    }
    
    /**
     * Reset folder filtering and show all notes
     */
    showAllNotes() {
        if (!window.notesApp) return;
        
        // Clear folder state
        window.notesApp.currentFolderId = null;
        window.notesApp.currentFolder = null;
        
        // Reset folder UI
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active', 'selected');
        });
        
        // Activate "All Notes" item
        const allNotesLink = document.querySelector('.all-notes-link');
        if (allNotesLink) {
            allNotesLink.classList.add('selected');
        }
        
        // Show all notes, sorted by date
        window.notesApp.renderNotesList(window.notesApp.notes.sort((a, b) => 
            new Date(b.lastModified || b.date) - new Date(a.lastModified || a.date)
        ));
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.folderOperations = new FolderOperations();
    console.log('[FolderOperations] Initialized globally');
}); 