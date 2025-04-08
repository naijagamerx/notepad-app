/**
 * FolderManager - Handles all folder operations and ensures notes stay in their folders
 * Modified to properly sync with NotesApp and folderOperations
 */
class FolderManager {
    constructor() {
        console.log('[DEBUG] Initializing FolderManager');

        // Singleton pattern - return existing instance if available
        if (window.folderManager) {
            console.log('[DEBUG] Using existing FolderManager instance');
            return window.folderManager;
        }

        // Set global instance
        window.folderManager = this;

        this.folders = [];
        this.currentFolder = null;
        this.initialized = false;

        // Add a clean startup logging for debugging
        console.log('[DEBUG] === FOLDER SYSTEM INITIALIZATION ===');
        this.logStorageState();

        // Initialize elements and event listeners
        this.initElements();
        this.initEventListeners();

        // Load folder data immediately now
        this.loadFolders();
        this.initialized = true;

        // Sync with NotesApp if available
        if (window.notesApp && window.notesApp.folders && window.notesApp.folders.length) {
            console.log('[DEBUG] Syncing with NotesApp folders data');
            this.syncWithNotesApp();
        }

        // Add mutation observer to watch for DOM changes
        this.setupMutationObserver();

        console.log('[DEBUG] FolderManager fully initialized');
        this.logStorageState();

        this.renameModal = null;       // Add reference for rename modal
        this.renameInput = null;       // Add reference for rename input
        this.confirmRenameBtn = null;  // Add reference for confirm button
        this.cancelRenameBtn = null;   // Add reference for cancel button
        this.folderToRenameId = null;  // Track which folder is being renamed
    }

    /**
     * Log the current state of localStorage for debugging
     */
    logStorageState() {
        try {
            const savedFolders = localStorage.getItem('folders');
            const parsedFolders = savedFolders ? JSON.parse(savedFolders) : [];
            console.log(`[DEBUG] localStorage 'folders' contains ${parsedFolders.length} folders`);

            if (parsedFolders.length > 0) {
                console.log('[DEBUG] First folder:', parsedFolders[0]);
            }

            const savedNotes = localStorage.getItem('notes');
            const parsedNotes = savedNotes ? JSON.parse(savedNotes) : [];
            console.log(`[DEBUG] localStorage 'notes' contains ${parsedNotes.length} notes`);

            const notesWithFolders = parsedNotes.filter(note => note.folderId !== null && note.folderId !== undefined);
            console.log(`[DEBUG] ${notesWithFolders.length} notes have folder assignments`);

            // Check for folder ID type issues
            const stringFolderIds = notesWithFolders.filter(note => typeof note.folderId === 'string').length;
            const numberFolderIds = notesWithFolders.filter(note => typeof note.folderId === 'number').length;

            console.log(`[DEBUG] Notes with string folder IDs: ${stringFolderIds}`);
            console.log(`[DEBUG] Notes with number folder IDs: ${numberFolderIds}`);

            if (stringFolderIds > 0 && numberFolderIds > 0) {
                console.warn('[WARNING] Mixed folder ID types detected - this can cause issues!');
            }
        } catch (error) {
            console.error('[ERROR] Error logging storage state:', error);
        }
    }

    /**
     * Sync folder data with NotesApp
     */
    syncWithNotesApp() {
        if (!window.notesApp) return;

        // Update NotesApp's folder references
        window.notesApp.folders = this.folders;

        // Check for folder ID mismatch issues in notes
        if (window.notesApp.notes && window.notesApp.notes.length) {
            const notes = window.notesApp.notes;
            let fixedNotes = false;

            notes.forEach(note => {
                if (note.folderId !== null && note.folderId !== undefined) {
                    // Ensure folder ID is a number
                    if (typeof note.folderId === 'string') {
                        console.log(`[DEBUG] Converting string folder ID to number for note ${note.id}`);
                        note.folderId = parseInt(note.folderId);
                        fixedNotes = true;
                    }

                    // Check if folder actually exists
                    const folderExists = this.folders.some(folder => folder.id === note.folderId);
                    if (!folderExists) {
                        console.warn(`[WARNING] Note ${note.id} references non-existent folder ${note.folderId}`);
                        // Reset folder ID to null as it references a non-existent folder
                        note.folderId = null;
                        fixedNotes = true;
                    }
                }
            });

            // Save fixed notes if needed
            if (fixedNotes) {
                console.log('[DEBUG] Saving fixed notes with corrected folder IDs');
                window.notesApp.saveNotes();
            }
        }
    }

    /**
     * Setup mutation observer to detect DOM changes
     */
    setupMutationObserver() {
        if (!this.foldersList) return;

        // Create mutation observer
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' &&
                    (mutation.addedNodes.length || mutation.removedNodes.length)) {
                    // DOM structure changed, check for issues
                    this.verifyFolderDom();
                }
            });
        });

        // Start observing the target node for configured mutations
        observer.observe(this.foldersList, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Verify folder DOM structure is correct
     */
    verifyFolderDom() {
        if (!this.foldersList) return;

        const folderItems = this.foldersList.querySelectorAll('.folder-item');
        const folderIds = Array.from(folderItems)
            .filter(item => item.dataset.folderId)
            .map(item => parseInt(item.dataset.folderId));

        // Check for missing folders in DOM
        this.folders.forEach(folder => {
            if (!folderIds.includes(folder.id)) {
                console.warn(`[WARNING] Folder ${folder.id} exists in data but missing in DOM`);
            }
        });

        // Check for DOM folders not in data
        folderIds.forEach(id => {
            if (!this.folders.some(folder => folder.id === id) && !isNaN(id)) {
                console.warn(`[WARNING] Folder ${id} exists in DOM but missing in data`);
            }
        });
    }

    /**
     * Initialize UI elements
     */
    initElements() {
        console.log('[DEBUG] Initializing folder elements');
        this.foldersList = document.getElementById('foldersList');
        this.newFolderBtn = document.getElementById('newFolderBtn');
        this.folderModal = document.getElementById('folderModal');
        this.folderNameInput = document.getElementById('folderName');
        this.createFolderBtn = document.getElementById('createFolderBtn');
        this.cancelFolderBtn = document.getElementById('cancelFolderBtn');
        this.closeModalBtn = document.querySelector('.close-btn');
        this.folderContextMenu = document.getElementById('folderContextMenu');
        this.renameModal = document.getElementById('renameFolderModal');
        this.renameInput = document.getElementById('renameFolderInput');
        this.confirmRenameBtn = document.getElementById('confirmRenameFolderBtn');
        this.cancelRenameBtn = document.getElementById('cancelRenameFolderBtn');

        if (!this.foldersList) console.error('[ERROR] foldersList element not found');
        if (!this.folderModal) console.error('[ERROR] folderModal element not found');
        if (!this.renameModal) console.error('[ERROR] renameFolderModal element not found');
        if (!this.renameInput) console.error('[ERROR] renameFolderInput element not found');
        if (!this.confirmRenameBtn) console.error('[ERROR] confirmRenameFolderBtn element not found');
        if (!this.cancelRenameBtn) console.error('[ERROR] cancelRenameFolderBtn element not found');
    }

    /**
     * Initialize all event listeners
     */
    initEventListeners() {
        console.log('[DEBUG] Setting up folder event listeners');

        // New folder button
        if (this.newFolderBtn) {
            this.newFolderBtn.addEventListener('click', () => this.showFolderModal());
        }

        // Create folder button
        if (this.createFolderBtn) {
            this.createFolderBtn.addEventListener('click', () => this.createFolder());
        }

        // Cancel button
        if (this.cancelFolderBtn) {
            this.cancelFolderBtn.addEventListener('click', () => this.hideFolderModal());
        }

        // Close button
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.hideFolderModal());
        }

        // Close context menu when clicking outside
        document.addEventListener('click', (e) => {
            // Only close if the context menu is visible and the click is outside it
            if (this.folderContextMenu &&
                this.folderContextMenu.style.display === 'block' &&
                !this.folderContextMenu.contains(e.target)) {
                this.folderContextMenu.style.display = 'none';
            }
        });

        // Enter key in input
        if (this.folderNameInput) {
            this.folderNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.createFolder();
                }
            });
        }

        // Close modal when clicking outside
        if (this.folderModal) {
            this.folderModal.addEventListener('click', (e) => {
                if (e.target === this.folderModal) {
                    this.hideFolderModal();
                }
            });
        }

        // Context menu for folders
        document.addEventListener('click', () => {
            if (this.folderContextMenu) {
                this.folderContextMenu.style.display = 'none';
            }
        });

        // Right-click on folder
        if (this.foldersList) {
            this.foldersList.addEventListener('contextmenu', (e) => {
                const folderItem = e.target.closest('.folder-item');
                if (folderItem) {
                    e.preventDefault();
                    this.showContextMenu(e, folderItem.dataset.folderId);
                }
            });

            // Drag and drop support
            this.foldersList.addEventListener('dragover', (e) => {
                e.preventDefault();
                const folderItem = e.target.closest('.folder-item');
                if (folderItem) {
                    folderItem.classList.add('drag-over');
                }
            });

            this.foldersList.addEventListener('dragleave', (e) => {
                const folderItem = e.target.closest('.folder-item');
                if (folderItem) {
                    folderItem.classList.remove('drag-over');
                }
            });

            this.foldersList.addEventListener('drop', (e) => {
                e.preventDefault();
                const folderItem = e.target.closest('.folder-item');
                if (folderItem) {
                    folderItem.classList.remove('drag-over');
                    const noteId = e.dataTransfer.getData('text/plain');
                    const folderId = folderItem.dataset.folderId;
                    this.moveNoteToFolder(noteId, folderId);
                }
            });
        }

        // Custom event listener for note updates
        document.addEventListener('note-saved', () => {
            console.log('[DEBUG] Note saved event detected, updating folder view');
            this.renderFolders();
        });

        // Custom event listener for notes loaded
        document.addEventListener('notes-loaded', () => {
            console.log('[DEBUG] Notes loaded event detected, updating folder view');
            this.renderFolders();
        });

        // Add listeners for the rename modal
        if (this.confirmRenameBtn) {
            this.confirmRenameBtn.addEventListener('click', () => this.confirmRenameFolder());
        }
        if (this.renameInput) {
            this.renameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.confirmRenameFolder();
                }
            });
        }
        // Use data attributes for closing modals consistently
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.closeModal;
                const modal = document.getElementById(modalId);
                if (modal) modal.style.display = 'none';
            });
        });

        // Close rename modal on outside click
        if (this.renameModal) {
            this.renameModal.addEventListener('click', (e) => {
                if (e.target === this.renameModal) {
                    this.hideRenameModal();
                }
            });
        }
    }

    /**
     * Show folder creation modal
     */
    showFolderModal() {
        if (this.folderModal) {
            this.folderModal.style.display = 'block';
            if (this.folderNameInput) {
                this.folderNameInput.value = '';
                setTimeout(() => this.folderNameInput.focus(), 100);
            }
        }
    }

    /**
     * Hide folder creation modal
     */
    hideFolderModal() {
        if (this.folderModal) {
            this.folderModal.style.display = 'none';
            if (this.folderNameInput) {
                this.folderNameInput.value = '';
            }
        }
    }

    /**
     * Create a new folder
     */
    createFolder() {
        if (!this.folderNameInput) return;

        const name = this.folderNameInput.value.trim();
        if (!name) return;

        console.log(`[DEBUG] Creating new folder: "${name}"`);

        const folderId = Date.now();
        const folder = {
            id: folderId,
            name: name,
            created: new Date().toISOString()
        };

        this.folders.push(folder);
        this.saveFolders();
        
        // Immediately render folders to show the new one without refresh
        this.renderFolders();
        this.hideFolderModal();

        // Select the newly created folder
        this.selectFolder(folderId);

        // Show success notification
        this.showNotification(`Folder "${name}" created successfully`);

        // Ensure NotesApp is updated with the new folder
        if (window.notesApp) {
            window.notesApp.folders = this.folders;
            
            // Force re-render notes list to reflect potential folder changes
            if (typeof window.notesApp.renderNotesList === 'function') {
                window.notesApp.renderNotesList();
            }
        }
        
        // Dispatch an event that a folder was created - helps notify components
        document.dispatchEvent(new CustomEvent('folder-created', {
            detail: { folder: folder }
        }));

        console.log(`[DEBUG] Created folder: ${JSON.stringify(folder)}`);
    }

    /**
     * Show context menu for folder
     */
    showContextMenu(event, folderId) {
        // Prevent the default context menu
        event.preventDefault();

        if (!this.folderContextMenu) {
             console.error('[ERROR] Folder context menu element not found');
             return;
        }

        const numericFolderId = parseInt(folderId); // Ensure we have a number
        if (isNaN(numericFolderId)) {
            console.error(`[ERROR] Invalid folderId for context menu: ${folderId}`);
            return;
        }

        // Find the folder object
        const folder = this.folders.find(f => f.id === numericFolderId);
        if (!folder) {
            console.error(`[ERROR] Folder with ID ${numericFolderId} not found`);
            return;
        }

        console.log(`[DEBUG] Showing context menu for folder: "${folder.name}" (ID: ${numericFolderId})`);

        // Clear previous items and listeners
        this.folderContextMenu.innerHTML = '';

        // Create menu items dynamically and add listeners
        const items = [
            { label: 'Rename', icon: 'fa-edit', action: () => this.renameFolder(numericFolderId) },
            { label: 'Delete', icon: 'fa-trash', action: () => this.deleteFolder(numericFolderId), isDestructive: true },
            { label: 'Export', icon: 'fa-file-export', action: () => this.exportFolder(numericFolderId) }
        ];

        items.forEach(itemData => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.innerHTML = `<i class="fas ${itemData.icon}"></i> ${itemData.label}`;

            // Add specific class for destructive actions (like delete) for styling
            if (itemData.isDestructive) {
                menuItem.classList.add('destructive');
            }

            // --- Attach event listener directly ---
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent background click closing menu immediately
                this.folderContextMenu.style.display = 'none'; // Hide menu before action to prevent UI issues

                // Small delay to allow menu to close before action
                setTimeout(() => {
                    itemData.action(); // Call the associated FolderManager method
                }, 50);
            });
            // --- End attach event listener ---

            this.folderContextMenu.appendChild(menuItem);
        });

        // Position and show menu
        this.folderContextMenu.style.display = 'block';

        // Ensure positioning considers scroll
        const posX = event.pageX;
        const posY = event.pageY;
        const menuWidth = this.folderContextMenu.offsetWidth || 160; // Default width if not yet rendered
        const menuHeight = this.folderContextMenu.offsetHeight || 120; // Default height if not yet rendered
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Adjust position if menu goes off-screen
        this.folderContextMenu.style.left = (posX + menuWidth > windowWidth) ? `${windowWidth - menuWidth - 5}px` : `${posX}px`;
        this.folderContextMenu.style.top = (posY + menuHeight > windowHeight) ? `${windowHeight - menuHeight - 5}px` : `${posY}px`;

        console.log(`[DEBUG] Context menu positioned at (${posX}, ${posY})`);

        // Return false to prevent default context menu
        return false;
    }

    /**
     * Rename a folder
     */
    renameFolder(folderId) {
        const numericFolderId = parseInt(folderId);
        const folder = this.folders.find(f => f.id === numericFolderId);
        if (!folder) {
            console.error(`[ERROR] Folder not found for rename: ${folderId}`);
            return;
        }

        console.log(`[DEBUG] Showing rename modal for folder: ${folder.id} ("${folder.name}")`);

        this.folderToRenameId = numericFolderId; // Store the ID

        if (this.renameModal && this.renameInput) {
            this.renameInput.value = folder.name; // Pre-fill current name
            this.renameModal.style.display = 'block';
            setTimeout(() => this.renameInput.focus(), 100);
        } else {
            console.error('[ERROR] Rename modal or input not found, falling back to prompt');
            // Fallback to prompt if modal elements aren't found
            const newName = prompt('Enter new folder name:', folder.name);
            if (newName && newName.trim() !== '') {
                this.updateFolderName(numericFolderId, newName.trim());
            }
        }
    }

    /**
     * Confirm rename folder
     */
    confirmRenameFolder() {
        if (!this.folderToRenameId || !this.renameInput) return;

        const newName = this.renameInput.value.trim();
        if (!newName) {
            alert('Please enter a valid folder name.');
            return;
        }

        this.updateFolderName(this.folderToRenameId, newName);
        this.hideRenameModal();
    }

    /**
     * Update folder name
     */
    updateFolderName(folderId, newName) {
        const folder = this.folders.find(f => f.id === folderId);
        if (folder && folder.name !== newName) {
            console.log(`[DEBUG] Updating folder name ${folderId} to "${newName}"`);
            folder.name = newName;
            this.saveFolders();
            this.renderFolders();
            this.showNotification(`Folder renamed to "${newName}"`);
        }
        this.folderToRenameId = null; // Reset tracking ID
    }

    /**
     * Hide rename modal
     */
    hideRenameModal() {
        if (this.renameModal) {
            this.renameModal.style.display = 'none';
        }
        this.folderToRenameId = null; // Clear tracking ID
    }

    /**
     * Delete a folder and move its notes to root
     */
    deleteFolder(folderId) {
        const numericFolderId = parseInt(folderId);
        const folder = this.folders.find(f => f.id === numericFolderId);
        if (!folder) return;

        if (!confirm(`Are you sure you want to delete the folder "${folder.name}"? Notes will be moved to the root folder.`)) {
            return;
        }

        console.log(`[DEBUG] Deleting folder: ${JSON.stringify(folder)}`);

        // Move all notes in this folder to the root
        if (window.notesApp && window.notesApp.notes) {
            let notesMoved = 0;
            window.notesApp.notes.forEach(note => {
                // Convert to number for consistent comparison
                const noteFolderId = parseInt(note.folderId);

                if (noteFolderId === numericFolderId) {
                    console.log(`[DEBUG] Moving note ${note.id} from folder ${numericFolderId} to root`);
                    note.folderId = null;
                    notesMoved++;
                }
            });

            if (notesMoved > 0) {
                console.log(`[DEBUG] Moved ${notesMoved} notes to root folder`);
            window.notesApp.saveNotes();
                 window.notesApp.renderNotesList();
            }
        }

        // Remove the folder
        this.folders = this.folders.filter(f => f.id !== numericFolderId);
        this.saveFolders();
        this.renderFolders();

        // Reset current folder if it was the deleted one
        if (this.currentFolder && this.currentFolder.id === numericFolderId) {
            this.currentFolder = null;
            this.showAllNotes();
        }

        // Show success notification
        this.showNotification(`Folder "${folder.name}" deleted`);
    }

    /**
     * Export a folder and its notes
     */
    exportFolder(folderId) {
        const numericFolderId = parseInt(folderId);
        const folder = this.folders.find(f => f.id === numericFolderId);
        if (!folder) return;

        console.log(`[DEBUG] Exporting folder: ${JSON.stringify(folder)}`);

        // Get notes for this folder
        const notes = window.notesApp && window.notesApp.notes ?
            window.notesApp.notes.filter(note => note.folderId === numericFolderId) : [];

        console.log(`[DEBUG] Found ${notes.length} notes in folder`);

        // Create export data
        const exportData = {
            folder: folder,
            notes: notes,
            exportDate: new Date().toISOString()
        };

        // Generate downloadable file
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${folder.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success notification
        this.showNotification(`Folder "${folder.name}" exported successfully`);
    }

    /**
     * Move a note to a folder - uses central folderOperations if available
     */
    moveNoteToFolder(noteId, folderId) {
        // Use the central folderOperations if available
        if (window.folderOperations && window.folderOperations.moveNoteToFolder) {
            window.folderOperations.moveNoteToFolder(noteId, folderId);
            return;
        }

        // Fallback implementation
        if (!window.notesApp || !window.notesApp.notes) {
            console.error('[ERROR] NotesApp not available for moving notes');
            return;
        }

        const numericFolderId = parseInt(folderId);
        const folder = this.folders.find(f => f.id === numericFolderId);
        if (!folder) {
            console.error(`[ERROR] Folder with ID ${folderId} not found`);
            return;
        }

        const note = window.notesApp.notes.find(n => n.id.toString() === noteId.toString());
        if (!note) {
            console.error(`[ERROR] Note with ID ${noteId} not found`);
            return;
        }

        console.log(`[DEBUG] Moving note ${noteId} to folder ${folderId}`);

        // Update note's folder ID
        note.folderId = numericFolderId;

        // Save changes
        window.notesApp.saveNotes();

        // Update UI
        window.notesApp.renderNotesList();
        this.renderFolders();

        // Show success notification
        this.showNotification(`Note moved to "${folder.name}"`);
    }

    /**
     * Show all notes (unfiltered) - uses central folderOperations if available
     */
    showAllNotes() {
        // Use the central folderOperations if available
        if (window.folderOperations && window.folderOperations.showAllNotes) {
            window.folderOperations.showAllNotes();
            return;
        }

        console.log('[DEBUG] Showing all notes');

        this.currentFolder = null;

        // Update UI
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('selected');
        });

        const allNotesItem = document.querySelector('.all-notes-link');
        if (allNotesItem) {
            allNotesItem.classList.add('selected');
        }

        // Show all notes
        if (window.notesApp) {
            if (window.notesApp.showAllNotes) {
                window.notesApp.showAllNotes();
            } else if (window.notesApp.renderNotesList) {
                window.notesApp.renderNotesList(window.notesApp.notes);
            }
        }
    }

    /**
     * Select a folder and show its notes - uses central folderOperations if available
     */
    selectFolder(folderId) {
        const numericFolderId = parseInt(folderId);
        const folder = this.folders.find(f => f.id === numericFolderId);
        if (!folder) return;

        console.log(`[DEBUG] Selecting folder: ${JSON.stringify(folder)}`);

        // Use the central folderOperations if available
        if (window.folderOperations && window.folderOperations.filterNotesByFolder) {
            window.folderOperations.filterNotesByFolder(numericFolderId);
            this.currentFolder = folder;

            // Update UI to show selected folder
            document.querySelectorAll('.folder-item').forEach(item => {
                item.classList.remove('selected');
            });

            const folderElement = document.querySelector(`.folder-item[data-folder-id="${numericFolderId}"]`);
            if (folderElement) {
                folderElement.classList.add('selected');
            }
            return;
        }

        this.currentFolder = folder;

        // Update UI to show selected folder
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('selected');
        });

        const folderElement = document.querySelector(`.folder-item[data-folder-id="${numericFolderId}"]`);
        if (folderElement) {
            folderElement.classList.add('selected');
        }

        // Filter notes to show only those in this folder
        if (window.notesApp) {
            if (window.notesApp.filterNotesByFolder) {
                window.notesApp.filterNotesByFolder(numericFolderId);
            } else if (window.notesApp.renderNotesList) {
                const filteredNotes = window.notesApp.notes.filter(note => {
                    const noteFolderId = note.folderId !== null ? parseInt(note.folderId) : null;
                    return noteFolderId === numericFolderId;
                });
                window.notesApp.renderNotesList(filteredNotes);
            }
        }
    }

    /**
     * Get a consistent color for a folder based on its ID
     */
    getFolderColor(folderId) {
        const colors = [
            '#4285F4', // Google Blue
            '#34A853', // Google Green
            '#FBBC05', // Google Yellow
            '#EA4335', // Google Red
            '#9C27B0', // Purple
            '#E91E63', // Pink
            '#00BCD4', // Cyan
            '#FF9800', // Orange
            '#607D8B', // Blue Grey
            '#795548'  // Brown
        ];
        // Simple hash function to get a consistent index
        const idString = folderId.toString();
        let hash = 0;
        for (let i = 0; i < idString.length; i++) {
            hash = (hash << 5) - hash + idString.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    /**
     * Render all folders in the sidebar
     */
    renderFolders() {
        if (!this.foldersList) return;

        console.log('[DEBUG] Rendering folders:', this.folders.length);

        // Clear current list
        this.foldersList.innerHTML = '';

        // Add "All Notes" option
        const allNotesItem = document.createElement('div');
        allNotesItem.className = 'folder-item all-notes-link';
        allNotesItem.innerHTML = `
            <i class="fas fa-book"></i>
            <span>All Notes</span>
            <span class="note-count">${this.getTotalNoteCount()}</span>
        `;

        allNotesItem.addEventListener('click', () => this.showAllNotes());

        if (!this.currentFolder) {
            allNotesItem.classList.add('selected');
        }

        this.foldersList.appendChild(allNotesItem);

        // Add each folder
        this.folders.forEach(folder => {
            const noteCount = this.getNoteCountForFolder(folder.id);
            const folderItem = document.createElement('div');
            folderItem.className = 'folder-item';
            folderItem.dataset.folderId = folder.id;
            folderItem.draggable = true;

            // Mark as selected if current
            if (this.currentFolder && this.currentFolder.id === folder.id) {
                folderItem.classList.add('selected');
            }

            // --- Apply Folder Color ---
            const folderColor = this.getFolderColor(folder.id);
            folderItem.innerHTML = `
                <i class="fas fa-folder" style="color: ${folderColor};"></i>
                <span>${folder.name}</span>
                <span class="note-count">${noteCount}</span>
                <div class="folder-actions">
                    <i class="fas fa-ellipsis-v folder-menu-trigger" title="Folder Options"></i>
                </div>
            `;
            // --- End Apply Folder Color ---

            // Add click event for folder selection
            folderItem.addEventListener('click', (e) => {
                // Skip if clicking on the menu trigger
                if (e.target.classList.contains('folder-menu-trigger') ||
                    e.target.closest('.folder-actions')) {
                    return;
                }
                this.selectFolder(folder.id);
            });

            // Add right-click event for context menu
            folderItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showContextMenu(e, folder.id);
                return false;
            });

            // Add click event for the menu trigger icon
            const menuTrigger = folderItem.querySelector('.folder-menu-trigger');
            if (menuTrigger) {
                menuTrigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Position context menu near the trigger icon
                    const rect = menuTrigger.getBoundingClientRect();
                    const fakeEvent = {
                        preventDefault: () => {},
                        pageX: rect.right,
                        pageY: rect.bottom + window.scrollY
                    };
                    this.showContextMenu(fakeEvent, folder.id);
                });
            }

            // Add drag start event
            folderItem.addEventListener('dragstart', (e) => {
                // Use a prefix to distinguish folder drags from note drags
                e.dataTransfer.setData('text/plain', `folder:${folder.id}`);
            });

            this.foldersList.appendChild(folderItem);
        });

        console.log('[DEBUG] Folders rendered');
    }

    /**
     * Get the number of notes in a folder
     */
    getNoteCountForFolder(folderId) {
        if (!window.notesApp || !window.notesApp.notes) return 0;

        const numericFolderId = parseInt(folderId);
        return window.notesApp.notes.filter(note => {
            // Convert note.folderId to number for proper comparison
            const noteFolderId = note.folderId !== null ? parseInt(note.folderId) : null;
            return noteFolderId === numericFolderId;
        }).length;
    }

    /**
     * Get total number of notes
     */
    getTotalNoteCount() {
        return window.notesApp && window.notesApp.notes ? window.notesApp.notes.length : 0;
    }

    /**
     * Save folders to localStorage
     */
    saveFolders() {
        try {
            // Ensure IDs are numbers
            this.folders = this.folders.map(folder => ({
                ...folder,
                id: parseInt(folder.id)
            }));

            localStorage.setItem('folders', JSON.stringify(this.folders));
            console.log(`[DEBUG] Saved ${this.folders.length} folders to localStorage`);

            // Sync with NotesApp
            if (window.notesApp) {
                window.notesApp.folders = this.folders;
            }

            // Dispatch event for other components
            document.dispatchEvent(new CustomEvent('folders-updated', {
                detail: { folders: this.folders }
            }));
        } catch (error) {
            console.error('[ERROR] Failed to save folders:', error);
        }
    }

    /**
     * Load folders from localStorage
     */
    loadFolders() {
        try {
            const savedFolders = localStorage.getItem('folders');
            if (savedFolders) {
                this.folders = JSON.parse(savedFolders);

                // Ensure all folder IDs are numbers
                this.folders = this.folders.map(folder => ({
                    ...folder,
                    id: parseInt(folder.id)
                }));

                console.log(`[DEBUG] Loaded ${this.folders.length} folders from localStorage`);

                // Check for duplicate folder IDs
                const folderIds = this.folders.map(folder => folder.id);
                const uniqueIds = [...new Set(folderIds)];

                if (folderIds.length !== uniqueIds.length) {
                    console.error('[ERROR] Duplicate folder IDs detected!');

                    // Fix duplicate IDs by regenerating them
                    const seenIds = new Set();
                    this.folders = this.folders.map(folder => {
                        if (seenIds.has(folder.id)) {
                            // Generate new ID for duplicate
                            const newId = Date.now() + Math.floor(Math.random() * 1000);
                            console.warn(`[WARNING] Fixing duplicate folder ID ${folder.id} -> ${newId}`);
                            return { ...folder, id: newId };
                        } else {
                            seenIds.add(folder.id);
                            return folder;
                        }
                    });

                    // Save fixed folders
                    this.saveFolders();
                }
            } else {
                console.log('[DEBUG] No saved folders found in localStorage');
                this.folders = [];
            }

            this.renderFolders();
        } catch (error) {
            console.error('[ERROR] Failed to load folders:', error);
            this.folders = [];
        }
    }

    /**
     * Show a notification message
     */
    showNotification(message, type = 'success') {
        if (window.fileOperations && window.fileOperations.showNotification) {
            window.fileOperations.showNotification(message, type);
        } else {
            console.log(`[NOTIFICATION] ${message}`);
        }
    }
}

// Initialize FolderManager when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] Creating FolderManager instance');

    // Set up localStorage change detection
    window.addEventListener('storage', (e) => {
        if (e.key === 'folders' || e.key === 'notes') {
            console.log(`[DEBUG] localStorage '${e.key}' changed externally`);
            if (window.folderManager && window.folderManager.initialized) {
                if (e.key === 'folders') {
                    window.folderManager.loadFolders();
                }
                window.folderManager.renderFolders();
            }
        }
    });

    window.folderManager = new FolderManager();

    // Debug local storage on page load
    console.log('[DEBUG] === LOCALSTORAGE STATE AT STARTUP ===');
    try {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        console.log('[DEBUG] Notes in localStorage:', notes.length);

        let folderStats = {};
        notes.forEach(note => {
            if (note.folderId !== null && note.folderId !== undefined) {
                const folderId = note.folderId.toString();
                folderStats[folderId] = (folderStats[folderId] || 0) + 1;
            }
        });

        console.log('[DEBUG] Notes per folder:', folderStats);

        const folders = JSON.parse(localStorage.getItem('folders') || '[]');
        console.log('[DEBUG] Folders in localStorage:', folders.length);

        // Check for inconsistencies
        if (folders.length > 0) {
            const folderIds = folders.map(f => f.id.toString());
            const orphanedNotes = Object.keys(folderStats).filter(id => !folderIds.includes(id));

            if (orphanedNotes.length > 0) {
                console.warn('[WARNING] Found notes with references to non-existent folders:', orphanedNotes);
                console.warn('[WARNING] These notes will appear in the root view');
            }
        }
    } catch (error) {
        console.error('[ERROR] Error checking localStorage state:', error);
    }
});