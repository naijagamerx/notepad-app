// NotesApp class for managing the application state and functionality
class NotesApp {
    constructor() {
        this.currentNote = null;
        this.currentFolder = null;
        this.notes = [];
        this.folders = [];
        this.noteOperations = null; // Initialize as null
        this.initialize();
    }

    initialize() {
        console.log('[DEBUG] NotesApp initialize starting...');
        
        // 1. Load data first
        this.loadSavedData();
        
        // 2. Initialize core UI elements needed by operations
        // This now runs directly within initialize, not a nested listener
        console.log('[DEBUG] Initializing core UI elements immediately...');
        this.initializeCoreUI(); 
        
        // 3. Check if core UI elements were found
        if (!this.noteTitle || !this.noteContent) {
            console.error('[FATAL ERROR] Core UI elements (title/content) not found during initialization. Aborting further setup.');
            // Optionally, display a user-facing error message here
            // alert('Critical error: Could not initialize editor components. Please refresh or contact support.');
            return; // Stop initialization if critical elements are missing
        }
        
        // 4. Initialize NoteOperations *after* core UI is ready and checked
        console.log('[DEBUG] Initializing NoteOperations...');
        this.noteOperations = new NoteOperations(this);
        if (!this.noteOperations.initialized) { // Check if NoteOperations itself failed
             console.error('[FATAL ERROR] NoteOperations failed to initialize properly. Auto-save and other operations might not work.');
             // We might still continue, but log the failure
        }
        
        // 5. Initialize other event listeners and UI components
        console.log('[DEBUG] Initializing event listeners and additional UI...');
        this.initializeEventListeners(); 
        this.initializeAdditionalUI();
        
        // 6. Load initial note or welcome note
        console.log('[DEBUG] Loading initial note...');
        this.loadInitialNote();
        
        // 7. Render the notes list
        console.log('[DEBUG] Rendering initial notes list...');
        this.renderNotesList();
        
        console.log('[DEBUG] NotesApp initialization complete');
        
        // Dispatch event notifying that NotesApp is ready
        document.dispatchEvent(new CustomEvent('notesapp-ready'));
    }

    loadSavedData() {
        try {
            console.log('[DEBUG] Loading saved data...');
            // Load notes from localStorage
            const savedNotes = localStorage.getItem('notes');
            if (savedNotes) {
                this.notes = JSON.parse(savedNotes);
                // Convert folderId to numbers
                this.notes = this.notes.map(note => ({
                    ...note,
                    folderId: note.folderId !== null && !isNaN(note.folderId) ? 
                              parseInt(note.folderId) : null
                }));
                console.log(`[DEBUG] Loaded ${this.notes.length} notes`);
            } else {
                this.notes = [];
                console.log('[DEBUG] No saved notes found');
            }

            // Load folders from localStorage - DEFER to FolderManager
            // Note: We still keep a reference, but FolderManager is the source of truth
            const savedFolders = localStorage.getItem('folders');
            if (savedFolders) {
                this.folders = JSON.parse(savedFolders).map(f => ({ ...f, id: parseInt(f.id) }));
                console.log(`[DEBUG] Initial folder data loaded: ${this.folders.length} folders`);
            } else {
                this.folders = [];
                console.log('[DEBUG] No saved folders found');
            }
            
            console.log('[DEBUG] Saved data loading complete');
        } catch (error) {
            console.error('[ERROR] Error loading saved data:', error);
            this.notes = [];
            this.folders = [];
        }
    }
    
    /**
     * Initialize core UI elements required by other components
     */
    initializeCoreUI() {
        console.log('[DEBUG] Initializing core UI elements (title, content)...');
        this.noteTitle = document.getElementById('noteTitleInput');
        this.noteContent = document.querySelector('.note-content');
        
        if (!this.noteTitle) console.error('[ERROR] noteTitleInput element not found!');
        if (!this.noteContent) console.error('[ERROR] note-content element not found!');
    }

    initializeEventListeners() {
        console.log('[DEBUG] Initializing event listeners...');
        // Add event listeners for various UI interactions
        
        // Editor and title input changes (handled by NoteOperations auto-save)
        if (this.noteContent && this.noteTitle) {
            this.noteContent.addEventListener('input', () => this.handleEditorChange());
            this.noteTitle.addEventListener('input', () => this.handleTitleChange());
            console.log('[DEBUG] Editor/Title change listeners added');
        } else {
            console.error('[ERROR] Cannot add editor/title listeners - elements missing');
        }
        
        // Setup new note button
        const newNoteBtn = document.getElementById('newNoteBtn');
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', () => this.createNewNote());
            console.log('[DEBUG] New note button listener added');
        } else {
            console.warn('[WARNING] New note button not found');
        }

        // Setup mobile new note tab
        const newNoteTab = document.getElementById('newNoteTab');
        if (newNoteTab) {
            newNoteTab.addEventListener('click', () => this.createNewNote());
            console.log('[DEBUG] Mobile new note tab listener added');
        }
        
        // Setup save button
        const saveNoteBtn = document.getElementById('saveNoteBtn');
        if (saveNoteBtn) {
            saveNoteBtn.addEventListener('click', () => this.saveCurrentNote());
            console.log('[DEBUG] Save note button listener added');
        } else {
            console.warn('[WARNING] Save note button not found');
        }
        
        // Setup delete button (handled by DeleteNoteOperations)
        // DeleteNoteOperations initializes its own listener
        
        // Setup sidebar toggle for mobile
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('collapsed');
                }
            });
            console.log('[DEBUG] Sidebar toggle listener added');
        }
        
        console.log('[DEBUG] Event listeners initialization complete');
    }

    /**
     * Initialize additional UI components (like notes list)
     */
    initializeAdditionalUI() {
        console.log('[DEBUG] Initializing additional UI...');
        // Initialize UI components like the notes list
        this.notesListElement = document.getElementById('notesList');
        if (!this.notesListElement) {
            console.error('[ERROR] notesList element not found!');
        }
        console.log('[DEBUG] Additional UI initialization complete');
    }
    
    /**
     * Load the initial note or create a welcome note
     */
    loadInitialNote() {
        console.log('[DEBUG] Loading initial note...');
        if (this.notes.length === 0) {
            console.log('[DEBUG] No notes found, creating welcome note');
            this.createWelcomeNote();
        } else {
            // Load the most recent note
            const mostRecentNote = this.notes.sort((a, b) => 
                new Date(b.lastModified || 0) - new Date(a.lastModified || 0)
            )[0];
            if (mostRecentNote) {
                console.log(`[DEBUG] Loading most recent note: ${mostRecentNote.id}`);
                this.loadNote(mostRecentNote.id);
            } else {
                console.warn('[WARNING] Could not find most recent note, creating welcome note');
                this.createWelcomeNote();
            }
        }
        console.log('[DEBUG] Initial note loading complete');
    }

    createWelcomeNote() {
        const welcomeNote = {
            id: Date.now().toString(),
            title: 'Welcome to NotePad!',
            content: '<p>Welcome to your new NotePad! Here are some tips to get started:</p>' +
                    '<ul>' +
                    '<li>Create new notes using the + button</li>' +
                    '<li>Organize notes in folders</li>' +
                    '<li>Format text using the toolbar</li>' +
                    '<li>Your notes are automatically saved</li>' +
                    '</ul>',
            createdAt: Date.now(),
            lastModified: Date.now(),
            folderId: null
        };
        this.notes.push(welcomeNote);
        this.saveNotes();
        this.loadNote(welcomeNote.id);
    }

    createNewNote() {
        console.log('Creating new note');
        // Create a new note object
        const newNote = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            createdAt: Date.now(),
            lastModified: Date.now(),
            folderId: this.currentFolder ? this.currentFolder.id : null
        };

        // Add to notes array
        this.notes.push(newNote);
        
        // Save to localStorage
        this.saveNotes();
        
        // Load the new note in the editor
        this.loadNote(newNote.id);
        
        // Focus the title input
        const titleInput = document.getElementById('noteTitleInput');
        if (titleInput) {
            titleInput.focus();
            titleInput.select();
        }
    }

    loadNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.currentNote = note;
        
        // Update UI
        const titleInput = document.getElementById('noteTitleInput');
        const editor = document.querySelector('.note-content');
        
        if (titleInput && editor) {
            titleInput.value = note.title;
            editor.innerHTML = note.content;
            editor.focus();
        }
        
        // Update the save button text
        this.updateSaveButton();
    }

    handleEditorChange() {
        if (this.currentNote && this.noteOperations) {
            this.noteOperations.queueAutoSave();
        }
        // Update save button state immediately for responsiveness
        this.updateSaveButton(true); 
    }

    handleTitleChange() {
        if (this.currentNote && this.noteOperations) {
            this.noteOperations.queueAutoSave();
        }
        // Update save button state immediately
        this.updateSaveButton(true); 
    }

    saveNotes() {
        try {
            console.log('[DEBUG] Saving notes to localStorage');
            
            // Ensure all folder IDs are consistent before saving
            this.notes = this.notes.map(note => ({
                ...note,
                folderId: note.folderId !== null ? parseInt(note.folderId) : null
            }));
            
            localStorage.setItem('notes', JSON.stringify(this.notes));
            console.log(`[DEBUG] Saved ${this.notes.length} notes`);
            
            // Trigger note-saved event
            document.dispatchEvent(new CustomEvent('note-saved'));
            
        } catch (error) {
            console.error('[ERROR] Failed to save notes:', error);
            alert('Error saving notes. Please check console for details.');
        }
    }
    
    saveCurrentNote() {
        console.log('[DEBUG] saveCurrentNote called');
        if (!this.currentNote) {
            console.warn('[WARNING] No current note to save');
            return;
        }
        
        if (this.noteOperations) {
            this.noteOperations.saveNote(true); // Force immediate save
        } else {
            console.error('[ERROR] NoteOperations not initialized, cannot save');
            // Fallback to basic save if needed (should not happen)
            const title = this.noteTitle ? this.noteTitle.value : 'Untitled Note';
            const content = this.noteContent ? this.noteContent.innerHTML : '';
            this.currentNote.title = title;
            this.currentNote.content = content;
            this.currentNote.lastModified = Date.now();
            this.saveNotes(); // Call the main saveNotes method
            this.renderNotesList(); // Refresh the list
            this.updateSaveButton(false); // Update button state
        }
    }
    
    updateSaveButton(hasUnsavedChanges = false) {
        const saveButton = document.getElementById('saveNoteBtn');
        if (!saveButton) return;

        if (hasUnsavedChanges) {
            saveButton.classList.add('unsaved-changes');
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save'; 
        } else {
            saveButton.classList.remove('unsaved-changes');
            saveButton.innerHTML = '<i class="fas fa-check"></i> Saved';
            // Optional: Reset after a delay if needed
        }
    }
    
    showDeleteConfirmation(noteId) {
        const modal = document.getElementById('deleteConfirmModal');
        if (!modal) return;
        
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        
        // Set the note title in the modal
        const titleElement = modal.querySelector('.note-title');
        if (titleElement) {
            titleElement.textContent = note.title;
        }
        
        // Set up delete confirmation
        const confirmBtn = document.getElementById('confirmDelete');
        if (confirmBtn) {
            // Remove any existing event listeners
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            // Add new event listener
            newConfirmBtn.addEventListener('click', () => {
                this.deleteNote(noteId);
                modal.style.display = 'none';
            });
        }
        
        // Set up cancel button
        const cancelBtn = document.getElementById('cancelDelete');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Show the modal
        modal.style.display = 'block';
    }
    
    deleteNote(noteId) {
        // Filter out the note to delete
        this.notes = this.notes.filter(note => note.id !== noteId);
        
        // Save changes
        this.saveNotes();
        
        // If this was the current note, load another note
        if (this.currentNote && this.currentNote.id === noteId) {
            this.currentNote = null;
            
            // Load the most recent note if available
            if (this.notes.length > 0) {
                const mostRecentNote = this.notes.sort((a, b) => b.lastModified - a.lastModified)[0];
                this.loadNote(mostRecentNote.id);
            } else {
                // Clear the editor if no notes left
                const titleInput = document.getElementById('noteTitleInput');
                const editor = document.querySelector('.note-content');
                
                if (titleInput) titleInput.value = '';
                if (editor) editor.innerHTML = '';
            }
        }
    }

    updateNotesList() {
        const notesList = document.getElementById('notesList');
        if (!notesList) return;

        notesList.innerHTML = '';
        this.notes
            .sort((a, b) => b.lastModified - a.lastModified)
            .forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'note-item';
                noteElement.dataset.noteId = note.id;
                noteElement.innerHTML = `
                    <div class="note-title">${note.title}</div>
                    <div class="note-preview">${this.getPreviewText(note.content)}</div>
                    <div class="note-date">${this.formatDate(note.lastModified)}</div>
                `;
                noteElement.addEventListener('click', () => this.loadNote(note.id));
                notesList.appendChild(noteElement);
            });
    }

    getPreviewText(content) {
        const div = document.createElement('div');
        div.innerHTML = content;
        return div.textContent.slice(0, 100) + (div.textContent.length > 100 ? '...' : '');
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Filter notes by folder ID
     * @param {number} folderId - The folder ID to filter by
     */
    filterNotesByFolder(folderId) {
        console.log(`[DEBUG] Filtering notes by folder ID: ${folderId}`);
        
        // Ensure folderId is a number
        const numericFolderId = parseInt(folderId);
        this.currentFolderId = numericFolderId;
        
        // Set currentFolder reference for new notes
        if (window.folderManager) {
            this.currentFolder = window.folderManager.folders.find(f => f.id === numericFolderId);
        }
        
        // Filter notes
        const filteredNotes = this.notes.filter(note => {
            const noteFolderId = note.folderId !== null ? parseInt(note.folderId) : null;
            return noteFolderId === numericFolderId;
        });
        
        console.log(`[DEBUG] Found ${filteredNotes.length} notes in folder ${numericFolderId}`);
        
        // Update UI
        this.renderNotesList(filteredNotes);
        
        // Update window title
        if (this.currentFolder) {
            document.title = `${this.currentFolder.name} - NotePad`;
        }
    }

    /**
     * Show all notes (remove folder filter)
     */
    showAllNotes() {
        console.log('[DEBUG] Showing all notes');
        
        // Clear folder filter
        this.currentFolderId = null;
        this.currentFolder = null;
        
        // Show all notes
        this.renderNotesList(this.notes);
        
        // Reset window title
        document.title = 'NotePad';
    }

    // Add this to the loadNotes method to ensure correct folder relationship
    loadNotes(noteIdToSelect) {
        try {
            console.log('[DEBUG] Loading notes from localStorage');
            const savedNotes = localStorage.getItem('notes');
            
            if (savedNotes) {
                this.notes = JSON.parse(savedNotes);
                
                // Ensure all folder IDs are consistently handled as numbers
                this.notes = this.notes.map(note => ({
                    ...note,
                    folderId: note.folderId !== null ? parseInt(note.folderId) : null
                }));
                
                console.log(`[DEBUG] Loaded ${this.notes.length} notes`);
                
                // Sort notes by last modified date (newest first)
                this.notes.sort((a, b) => {
                    const dateA = new Date(a.lastModified || 0);
                    const dateB = new Date(b.lastModified || 0);
                    return dateB - dateA;
                });
                
                // Render notes list
                if (this.currentFolderId) {
                    this.filterNotesByFolder(this.currentFolderId);
                } else {
                    this.renderNotesList();
                }
                
                // Select note if specified
                if (noteIdToSelect) {
                    setTimeout(() => this.loadNote(noteIdToSelect), 100);
                } else if (this.notes.length > 0) {
                    this.loadNote(this.notes[0].id);
                } else {
                    this.createWelcomeNote();
                }
                
                // Trigger notes-loaded event
                document.dispatchEvent(new CustomEvent('notes-loaded'));
                
            } else {
                console.log('[DEBUG] No saved notes found, creating welcome note');
                this.createWelcomeNote();
            }
        } catch (error) {
            console.error('[ERROR] Failed to load notes:', error);
            this.createWelcomeNote();
        }
    }

    /**
     * Update the notes list in the sidebar
     * @param {Array} filteredNotes - Optional array of notes to display (for filtering)
     */
    renderNotesList(filteredNotes) {
        console.log(`[DEBUG] Rendering notes list - ${filteredNotes ? 'filtered' : 'all'} notes`);
        
        // Get the notes list element (ensure it exists)
        const notesList = this.notesListElement || document.getElementById('notesList');
        if (!notesList) {
            console.error('[ERROR] Notes list element not found');
            return;
        }
        
        // Clear current list
        notesList.innerHTML = '';
        
        // Determine which notes to render
        const notesToRender = filteredNotes || this.notes;
        
        // Handle empty state
        if (notesToRender.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-notes-message';
            emptyMessage.textContent = filteredNotes ? 
                'No notes in this folder. Create one now!' : 
                'No notes yet. Create your first note!';
            notesList.appendChild(emptyMessage);
            return;
        }
        
        // Sort notes by last modified date (newest first)
        const sortedNotes = [...notesToRender].sort((a, b) => {
            const dateA = new Date(a.lastModified || 0);
            const dateB = new Date(b.lastModified || 0);
            return dateB - dateA;
        });
        
        // Create and append note elements
        sortedNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.dataset.noteId = note.id;
            
            // Add active class if this is the currently loaded note
            if (this.currentNote && note.id === this.currentNote.id) {
                noteElement.classList.add('active');
            }
            
            // Add folder indicator if applicable
            let folderIndicator = '';
            if (note.folderId && window.folderManager) {
                const folder = window.folderManager.folders.find(f => f.id === parseInt(note.folderId));
                if (folder) {
                    folderIndicator = `<div class="note-folder"><i class="fas fa-folder" style="color: ${window.folderManager.getFolderColor(folder.id)};"></i> ${folder.name}</div>`;
                }
            }
            
            // UPDATE innerHTML to include note-actions and trigger
            noteElement.innerHTML = `
                <div class="note-content-wrapper">
                <div class="note-title">${note.title || 'Untitled Note'}</div>
                <div class="note-preview">${this.getPreviewText(note.content)}</div>
                ${folderIndicator}
                <div class="note-date">${this.formatDate(note.lastModified || note.date)}</div>
                </div>
                <div class="note-actions">
                    <i class="fas fa-ellipsis-v note-menu-trigger" title="Note Options"></i>
                </div>
            `;
            
            // Add drag capabilities
            noteElement.draggable = true;
            noteElement.addEventListener('dragstart', (e) => {
                 // Prefix with 'note:' to distinguish from folder drags
                e.dataTransfer.setData('text/plain', `note:${note.id}`);
            });
            
            // Add click handler to load note
            noteElement.addEventListener('click', () => this.loadNote(note.id));
            
            // --- Add Context Menu Listener for Note --- 
            noteElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent folder context menu if inside sidebar
                this.showNoteContextMenu(e, note.id);
            });
            // --- End Context Menu Listener ---

            // --- ADD Event Listener for 3-dot menu trigger --- 
            const menuTrigger = noteElement.querySelector('.note-menu-trigger');
            if (menuTrigger) {
                menuTrigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Position context menu near the trigger icon
                    const rect = menuTrigger.getBoundingClientRect();
                    // Position menu using rect.right and rect.bottom + scrollY for consistency
                    this.showNoteContextMenu({ pageX: rect.right, pageY: rect.bottom + window.scrollY }, note.id);
                });
            }
            // --- End Event Listener for 3-dot menu ---
            
            notesList.appendChild(noteElement);
        });
        
        console.log(`[DEBUG] Rendered ${sortedNotes.length} notes`);
    }

    // Add a new method to show the context menu for notes
    showNoteContextMenu(event, noteId) {
        console.log(`[DEBUG] Using centralized context menu for note: ${noteId}`);
        
        // Call the centralized implementation in notesApp.js
        if (window.notesApp && typeof window.notesApp.showNoteContextMenu === 'function') {
            // Convert event to coordinates for consistency
            const x = event.pageX || 0;
            const y = event.pageY || 0;
            window.notesApp.showNoteContextMenu(x, y, noteId);
        } else {
            console.error('[ERROR] Core showNoteContextMenu function not available');
        }
    }

    // --- Use centralized moveNoteToFolder method --- 
    moveNoteToFolder(noteId, folderId) {
        console.log(`[DEBUG] Delegating moveNoteToFolder to centralized implementation`);
        
        // Use the centralized implementation in folderOperations.js
        if (window.folderOperations && typeof window.folderOperations.moveNoteToFolder === 'function') {
            window.folderOperations.moveNoteToFolder(noteId, folderId);
        } else {
            console.error('[ERROR] Central folderOperations.moveNoteToFolder not available');
            // Fallback to the basic functionality
            const numericNoteId = noteId;
            const numericFolderId = folderId !== null ? parseInt(folderId) : null;
            
            console.log(`[DEBUG] Fallback: Moving note ${numericNoteId} to folder ${numericFolderId}`);
        
        const note = this.notes.find(n => n.id.toString() === numericNoteId.toString());
        if (!note) {
            console.error(`[ERROR] Note not found: ${numericNoteId}`);
            return;
        }
        
        // Update the note's folder ID
        note.folderId = numericFolderId;
        
        // Save all notes
        this.saveNotes(); 
        
            // Refresh the notes list
            this.renderNotesList();
        }
    }

    // --- Add utility methods ---
    showNotification(message, type = 'info') {
        // Fallback or default notification logic if the main one isn't available
        const showFunc = this.showNotification || (window.fileOperations && window.fileOperations.showNotification);
        if (showFunc) {
            showFunc(message, type);
        } else {
            console.log(`[Notification - ${type}] ${message}`); // Simple console fallback
        }
    }

    getFolderName(folderId) {
        if (!folderId) return 'Root';
        const numericFolderId = parseInt(folderId);
        return window.folderManager && window.folderManager.folders ?
               (window.folderManager.folders.find(f => f.id === numericFolderId) || {}).name || 'Unknown Folder' :
               'Unknown Folder';
    }
}

// Initialize the NotesApp when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOMContentLoaded: Initializing NotesApp globally');
    window.notesApp = new NotesApp();
}); 