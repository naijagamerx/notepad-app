/**
 * @fileoverview iOS Notes Web App - A modern note-taking application
 * @version 1.0.0
 * @author Your Name
 * @license MIT
 */

console.log("[DEBUG] Loading main script.js file");

/**
 * Main application class that handles all note operations
 * @class
 */
class NotesApp {
    constructor() {
        console.log('[DEBUG] Initializing NotesApp');

        // Initialize properties
        this.currentNote = null;
        this.notes = [];
        this.folders = [];
        this.tags = [];
        this.mobileMenuVisible = false;
        this.mobileMenu = null; // To store the menu element

        try {
            // Initialize elements and event listeners
            this.initializeElements();
            this.attachEventListeners();

            // Load notes and check for shared note in URL
            this.loadNotes();
            this.checkForSharedNote();

            // Initialize formatting tools and mobile version if needed
            this.initializeFormattingTools();

            // Bind methods to instance to maintain proper this context
            this.formatText = this.formatText.bind(this);
            this.insertHeading = this.insertHeading.bind(this);
            this.insertQuote = this.insertQuote.bind(this);
            this.insertCode = this.insertCode.bind(this);
            this.alignLeft = this.alignLeft.bind(this);
            this.alignCenter = this.alignCenter.bind(this);
            this.alignRight = this.alignRight.bind(this);
            this.indent = this.indent.bind(this);
            this.outdent = this.outdent.bind(this);
            this.insertLink = this.insertLink.bind(this);
            this.insertImage = this.insertImage.bind(this);
            this.insertHorizontalRule = this.insertHorizontalRule.bind(this);
            this.downloadNoteAsText = this.downloadNoteAsText.bind(this);

            // Add window resize handler for responsive formatting tools
            window.addEventListener('resize', this.handleWindowResize.bind(this));

            // Make app instance available globally for debugging and interop
            window.notesApp = this;

            // Dispatch event indicating NotesApp is ready
            document.dispatchEvent(new CustomEvent('notesapp-ready'));

            console.log('[DEBUG] NotesApp initialized successfully');
        } catch (error) {
            console.error('[DEBUG] Error initializing NotesApp:', error);
        }
    }

    /**
     * Initializes all required elements and event listeners
     */
    initializeElements() {
        // Get DOM elements
        this.sidebar = document.querySelector('.sidebar');
        this.notesList = document.getElementById('notesList');
        this.noteTitle = document.getElementById('noteTitleInput');
        this.noteContent = document.querySelector('.note-content');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.searchInput = document.getElementById('searchInput');

        // Format buttons (mobile)
        this.boldBtn = document.getElementById('boldBtn');
        this.italicBtn = document.getElementById('italicBtn');
        this.underlineBtn = document.getElementById('underlineBtn');
        this.strikeBtn = document.getElementById('strikeBtn');
        this.headingBtn = document.getElementById('headingBtn');
        this.quoteBtn = document.getElementById('quoteBtn');
        this.codeBtn = document.getElementById('codeBtn');
        this.listBtn = document.getElementById('listBtn');

        // PC toolbar format buttons
        this.toolbarBoldBtn = document.getElementById('toolbar-boldBtn');
        this.toolbarItalicBtn = document.getElementById('toolbar-italicBtn');
        this.toolbarUnderlineBtn = document.getElementById('toolbar-underlineBtn');
        this.toolbarStrikeBtn = document.getElementById('toolbar-strikeBtn');
        this.toolbarHeadingBtn = document.getElementById('toolbar-headingBtn');
        this.toolbarQuoteBtn = document.getElementById('toolbar-quoteBtn');
        this.toolbarCodeBtn = document.getElementById('toolbar-codeBtn');
        this.toolbarListBtn = document.getElementById('toolbar-listBtn');
        this.toolbarAlignLeftBtn = document.getElementById('toolbar-alignLeftBtn');
        this.toolbarAlignCenterBtn = document.getElementById('toolbar-alignCenterBtn');
        this.toolbarAlignRightBtn = document.getElementById('toolbar-alignRightBtn');
        this.toolbarIndentBtn = document.getElementById('toolbar-indentBtn');
        this.toolbarOutdentBtn = document.getElementById('toolbar-outdentBtn');
        this.toolbarLinkBtn = document.getElementById('toolbar-linkBtn');
        this.toolbarImageBtn = document.getElementById('toolbar-imageBtn');
        this.toolbarHrBtn = document.getElementById('toolbar-hrBtn');
        this.toolbarDownloadBtn = document.getElementById('toolbar-downloadBtn');

        // File operations
        this.saveNoteBtn = document.getElementById('saveNoteBtn');
        this.deleteNoteBtn = document.getElementById('deleteNoteBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.uploadInput = document.getElementById('uploadInput');

        // Share and tag buttons
        this.shareNoteBtn = document.getElementById('shareNoteBtn');
        this.tagNoteBtn = document.getElementById('tagNoteBtn');

        // Share modal elements
        this.shareModal = document.getElementById('shareModal');
        this.shareLink = document.getElementById('shareLink');
        this.copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
        this.emailShareBtn = document.getElementById('emailShareBtn');
        this.whatsappShareBtn = document.getElementById('whatsappShareBtn');
        this.twitterShareBtn = document.getElementById('twitterShareBtn');
        this.closeShareBtn = document.getElementById('closeShareBtn');

        // Tag modal elements
        this.tagModal = document.getElementById('tagModal');
        this.newTagInput = document.getElementById('newTag');
        this.addTagBtn = document.getElementById('addTagBtn');
        this.tagsContainer = document.getElementById('tagsContainer');
        this.popularTagsContainer = document.getElementById('popularTagsContainer');
        this.saveTagsBtn = document.getElementById('saveTagsBtn');
        this.cancelTagsBtn = document.getElementById('cancelTagsBtn');

        // Track all tags used in the app
        this.allTags = [];
        // Track tags for the current editing session
        this.currentTags = [];

        // Setup autosave
        this.setupAutoSave();

        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    }

    /**
     * Sets up the autosave functionality
     */
    setupAutoSave() {
        if (!this.noteContent || !this.noteTitle) {
            console.error('[DEBUG] Cannot set up autosave - editor elements not found');
            return;
        }

        console.log('[DEBUG] Setting up autosave');

        // Variable to hold timeout ID
        this.autoSaveTimeout = null;
        const autoSaveDelay = 2000; // 2 seconds

        // Function to perform autosave
        const performAutoSave = () => {
            if (this.currentNote) {
                console.log('[DEBUG] Auto-saving note:', this.currentNote.id);
                this.saveCurrentNote(true); // true = silent save (no notification)
            }
        };

        // Set up content change listener
        this.noteContent.addEventListener('input', () => {
            if (this.autoSaveTimeout) {
                clearTimeout(this.autoSaveTimeout);
            }
            this.autoSaveTimeout = setTimeout(performAutoSave, autoSaveDelay);

            // Update save button to show changes are pending
            if (this.saveNoteBtn) {
                this.saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> <span class="btn-text">Save*</span>';
                this.saveNoteBtn.classList.add('unsaved-changes');
            }
        });

        // Set up title change listener
        this.noteTitle.addEventListener('input', () => {
            if (this.autoSaveTimeout) {
                clearTimeout(this.autoSaveTimeout);
            }
            this.autoSaveTimeout = setTimeout(performAutoSave, autoSaveDelay);

            // Update save button to show changes are pending
            if (this.saveNoteBtn) {
                this.saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> <span class="btn-text">Save*</span>';
                this.saveNoteBtn.classList.add('unsaved-changes');
            }

            // Update the note's title in memory
            if (this.currentNote) {
                this.currentNote.title = this.noteTitle.value;
            }
        });

        console.log('[DEBUG] Autosave setup complete');
    }

    attachEventListeners() {
        // Context menus
        document.addEventListener('click', e => {
            const contextMenu = document.querySelector('.context-menu');
            if (contextMenu && contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });

        // New note button - make sure this works for both desktop and mobile
        const newNoteBtn = document.getElementById('newNoteBtn');
        const newNoteTab = document.getElementById('newNoteTab');

        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[DEBUG] New note button clicked');
                this.createNewNote();
            });
        }

        if (newNoteTab) {
            newNoteTab.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[DEBUG] Mobile new note tab clicked');
                this.createNewNote();
            });
        }

        // Save note button
        if (this.saveNoteBtn) {
            this.saveNoteBtn.addEventListener('click', () => this.saveCurrentNote());
        }

        // Delete note button
        if (this.deleteNoteBtn) {
            this.deleteNoteBtn.addEventListener('click', () => this.deleteCurrentNote());
        }

        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.searchNotes(this.searchInput.value));
        }

        // Note content changes
        if (this.noteContent) {
            this.noteContent.addEventListener('input', () => this.updateSaveButton());
        }

        // Note title changes
        if (this.noteTitle) {
            this.noteTitle.addEventListener('input', () => this.updateSaveButton());
        }

        // Format toolbar buttons (PC only)
        if (this.toolbarBoldBtn) this.toolbarBoldBtn.addEventListener('click', this.formatText.bind(this, 'bold'));
        if (this.toolbarItalicBtn) this.toolbarItalicBtn.addEventListener('click', this.formatText.bind(this, 'italic'));
        if (this.toolbarUnderlineBtn) this.toolbarUnderlineBtn.addEventListener('click', this.formatText.bind(this, 'underline'));
        if (this.toolbarStrikeBtn) this.toolbarStrikeBtn.addEventListener('click', this.formatText.bind(this, 'strikeThrough'));
        if (this.toolbarHeadingBtn) this.toolbarHeadingBtn.addEventListener('click', this.insertHeading);
        if (this.toolbarQuoteBtn) this.toolbarQuoteBtn.addEventListener('click', this.insertQuote);
        if (this.toolbarCodeBtn) this.toolbarCodeBtn.addEventListener('click', this.insertCode);
        if (this.toolbarListBtn) this.toolbarListBtn.addEventListener('click', this.formatText.bind(this, 'insertUnorderedList'));
        if (this.toolbarAlignLeftBtn) this.toolbarAlignLeftBtn.addEventListener('click', this.alignLeft);
        if (this.toolbarAlignCenterBtn) this.toolbarAlignCenterBtn.addEventListener('click', this.alignCenter);
        if (this.toolbarAlignRightBtn) this.toolbarAlignRightBtn.addEventListener('click', this.alignRight);
        if (this.toolbarIndentBtn) this.toolbarIndentBtn.addEventListener('click', this.indent);
        if (this.toolbarOutdentBtn) this.toolbarOutdentBtn.addEventListener('click', this.outdent);
        if (this.toolbarLinkBtn) this.toolbarLinkBtn.addEventListener('click', this.insertLink);
        if (this.toolbarImageBtn) this.toolbarImageBtn.addEventListener('click', this.insertImage);
        if (this.toolbarHrBtn) this.toolbarHrBtn.addEventListener('click', this.insertHorizontalRule);
        if (this.toolbarDownloadBtn) this.toolbarDownloadBtn.addEventListener('click', this.downloadNoteAsText);

        // Add listener to track active formatting and show as active buttons
        if (this.noteContent) {
            this.noteContent.addEventListener('keyup', () => this.updateActiveButtons());
            this.noteContent.addEventListener('mouseup', () => this.updateActiveButtons());
            this.noteContent.addEventListener('mousedown', () => {
                // Ensure we update buttons after a short delay for selection to be complete
                setTimeout(() => this.updateActiveButtons(), 50);
            });
        }

        // Handle dropdown interactions (closing when clicking outside)
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.toolbar-dropdown .dropdown-menu').forEach(menu => {
                if (!menu.parentElement.contains(e.target)) {
                    menu.style.display = 'none';
                }
            });
        });

        // Share and tag buttons
        if (this.shareNoteBtn) {
            this.shareNoteBtn.addEventListener('click', () => this.openShareModal());
        }

        if (this.tagNoteBtn) {
            this.tagNoteBtn.addEventListener('click', () => this.openTagModal());
        }

        // Upload buttons
        if (this.uploadBtn) {
            this.uploadBtn.addEventListener('click', () => {
                if (this.uploadInput) {
                    this.uploadInput.click();
                }
            });
        }

        if (this.uploadTextBtn) {
            this.uploadTextBtn.addEventListener('click', () => {
                if (this.uploadInput) {
                    this.uploadInput.click();
                }
            });
        }

        if (this.uploadInput) {
            this.uploadInput.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    await this.handleFileUpload(file);
                    e.target.value = ''; // Clear the input
                }
            });
        }

        // Share menu actions
        if (this.copyShareLinkBtn) {
            this.copyShareLinkBtn.addEventListener('click', () => this.copyShareLink());
        }

        if (this.emailShareBtn) {
            this.emailShareBtn.addEventListener('click', () => this.shareViaEmail());
        }

        if (this.whatsappShareBtn) {
            this.whatsappShareBtn.addEventListener('click', () => this.shareViaWhatsApp());
        }

        if (this.twitterShareBtn) {
            this.twitterShareBtn.addEventListener('click', () => this.shareViaTwitter());
        }

        // Tag management
        if (this.addTagBtn) {
            this.addTagBtn.addEventListener('click', () => this.addNewTag());
        }

        if (this.newTagInput) {
            this.newTagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addNewTag();
                }
            });
        }

        if (this.saveTagsBtn) {
            this.saveTagsBtn.addEventListener('click', () => this.saveTagsToNote());
        }

        // Modal close buttons
        document.querySelectorAll('.close-btn, #cancelTagsBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Hide modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Set focus on text inputs when modal opens
        if (this.newTagInput && this.tagModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'style' &&
                        this.tagModal.style.display === 'block') {
                        setTimeout(() => this.newTagInput.focus(), 100);
                    }
                });
            });
            observer.observe(this.tagModal, { attributes: true });
        }

        if (this.folderNameInput && this.folderModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'style' &&
                        this.folderModal.style.display === 'block') {
                        setTimeout(() => this.folderNameInput.focus(), 100);
                    }
                });
            });
            observer.observe(this.folderModal, { attributes: true });
        }

        // Sidebar toggle button
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                if (this.sidebar) {
                    this.sidebar.classList.toggle('collapsed');
                }
            });
        }

        // Try to attach to download button again to ensure it works
        const downloadBtn = document.getElementById('toolbar-downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                console.log('Download button clicked');
                this.downloadNoteAsText();
            });
        }

        // --- Toolbar Button Listeners ---
        // Ensure all formatting/utility buttons still have listeners attached
        // File Actions (already handled likely)

        // Basic Formatting
        if (this.toolbarBoldBtn) this.toolbarBoldBtn.addEventListener('click', this.formatText.bind(this, 'bold'));
        if (this.toolbarItalicBtn) this.toolbarItalicBtn.addEventListener('click', this.formatText.bind(this, 'italic'));
        if (this.toolbarUnderlineBtn) this.toolbarUnderlineBtn.addEventListener('click', this.formatText.bind(this, 'underline'));
        if (this.toolbarStrikeBtn) this.toolbarStrikeBtn.addEventListener('click', this.formatText.bind(this, 'strikeThrough'));

        // Advanced Formatting
         if (this.toolbarHeadingBtn) this.toolbarHeadingBtn.addEventListener('click', this.insertHeading.bind(this));
         if (this.toolbarQuoteBtn) this.toolbarQuoteBtn.addEventListener('click', this.insertQuote.bind(this));
         if (this.toolbarCodeBtn) this.toolbarCodeBtn.addEventListener('click', this.insertCode.bind(this));
         if (this.toolbarListBtn) this.toolbarListBtn.addEventListener('click', this.formatText.bind(this, 'insertUnorderedList'));
         if (this.toolbarAlignLeftBtn) this.toolbarAlignLeftBtn.addEventListener('click', this.alignLeft.bind(this));
         if (this.toolbarAlignCenterBtn) this.toolbarAlignCenterBtn.addEventListener('click', this.alignCenter.bind(this));
         if (this.toolbarAlignRightBtn) this.toolbarAlignRightBtn.addEventListener('click', this.alignRight.bind(this));
         if (this.toolbarIndentBtn) this.toolbarIndentBtn.addEventListener('click', this.indent.bind(this));
         if (this.toolbarOutdentBtn) this.toolbarOutdentBtn.addEventListener('click', this.outdent.bind(this));
         if (this.toolbarLinkBtn) this.toolbarLinkBtn.addEventListener('click', this.insertLink.bind(this));
         if (this.toolbarImageBtn) this.toolbarImageBtn.addEventListener('click', this.insertImage.bind(this));
         if (this.toolbarHrBtn) this.toolbarHrBtn.addEventListener('click', this.insertHorizontalRule.bind(this));

        // Utility Buttons
         if (this.toolbarCutBtn) this.toolbarCutBtn.addEventListener('click', this.cutText.bind(this));
         if (this.toolbarCopyBtn) this.toolbarCopyBtn.addEventListener('click', this.copyText.bind(this));
         if (this.toolbarPasteBtn) this.toolbarPasteBtn.addEventListener('click', this.pasteText.bind(this)); // Assuming ClipboardOps handles this? Verify. If not, add method.
         if (this.toolbarUndoBtn) this.toolbarUndoBtn.addEventListener('click', this.formatText.bind(this, 'undo'));
         if (this.toolbarRedoBtn) this.toolbarRedoBtn.addEventListener('click', this.formatText.bind(this, 'redo'));

         // Upload button listener (likely handled in FileOperations, ensure it still works)
         // Download button listener
         if (this.toolbarDownloadBtn) this.toolbarDownloadBtn.addEventListener('click', this.downloadNoteAsText.bind(this));
         // Share/Tag button listeners (likely handled elsewhere, ensure they still work)


        // Mobile Menu Toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (event) => {
            if (this.mobileMenuVisible && this.mobileMenu && !this.mobileMenu.contains(event.target) && !this.mobileMenuBtn.contains(event.target)) {
                this.hideMobileMenu();
            }
        });
    }

    /**
     * Updates the save button status based on current note
     */
    updateSaveButton() {
        if (!this.saveNoteBtn) return;

        if (this.currentNote) {
            // Reset the save button appearance
            this.saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> <span class="btn-text">Save</span>';
            this.saveNoteBtn.classList.remove('unsaved-changes');
            this.saveNoteBtn.disabled = false;

            // If this is an existing note, show "Update" instead of "Save"
            if (this.currentNote.id) {
                this.saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> <span class="btn-text">Update</span>';
            }
        } else {
            // No current note, disable the save button
            this.saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> <span class="btn-text">Save</span>';
            this.saveNoteBtn.disabled = true;
        }
    }

    /**
     * Shows context menu for note operations
     * @param {number} x - X position for menu
     * @param {number} y - Y position for menu
     * @param {string} noteId - ID of the note
     */
    showNoteContextMenu(x, y, noteId) {
        console.log('[DEBUG] Showing context menu for note:', noteId);

        // Remove any existing context menus
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());

        // Create context menu with direct HTML implementation (simpler approach)
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu note-context-menu';
        contextMenu.id = 'noteContextMenu';
        
        // Get the note object
        const note = this.notes.find(n => n.id.toString() === noteId.toString());
        if (!note) {
            console.error(`[ERROR] Note with ID ${noteId} not found for context menu`);
            return;
        }

        // Create menu content using direct HTML
        contextMenu.innerHTML = `
            <div class="menu-item" data-action="edit" data-note-id="${noteId}">
                <i class="fas fa-edit"></i> Edit
            </div>
            <div class="menu-item move-to-folder has-submenu">
                <i class="fas fa-folder-plus"></i> Move to Folder
                <i class="fas fa-chevron-right submenu-arrow"></i>
                <div class="submenu">
                    ${this.generateFolderSubmenu(noteId)}
                </div>
            </div>
            <div class="menu-item" data-action="share" data-note-id="${noteId}">
                <i class="fas fa-share-alt"></i> Share
            </div>
            <div class="menu-item" data-action="export" data-note-id="${noteId}">
                <i class="fas fa-file-export"></i> Export
            </div>
            <div class="menu-item" data-action="duplicate" data-note-id="${noteId}">
                <i class="fas fa-copy"></i> Duplicate
            </div>
            <div class="menu-item destructive" data-delete-note="${noteId}">
                <i class="fas fa-trash"></i> Delete
            </div>
        `;

        // Add to document and position
        document.body.appendChild(contextMenu);

        // Adjust position to keep menu within viewport
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const menuWidth = contextMenu.offsetWidth || 200; // Fallback if not rendered yet
        const menuHeight = contextMenu.offsetHeight || 240; // Fallback if not rendered yet

        // Adjust X position if menu would go off right edge
        if (x + menuWidth > windowWidth) {
            x = windowWidth - menuWidth - 10;
        }

        // Adjust Y position if menu would go off bottom edge
        if (y + menuHeight > windowHeight) {
            y = windowHeight - menuHeight - 10;
        }

        // Set position and ensure it's visible
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.style.display = 'block';

        // Add event handlers for menu items
        contextMenu.addEventListener('click', (e) => {
            // Edit note action
            if (e.target.closest('[data-action="edit"]')) {
                const noteId = e.target.closest('[data-action="edit"]').dataset.noteId;
                if (noteId) {
                    this.selectNote(this.notes.find(n => n.id.toString() === noteId.toString()));
                }
                contextMenu.remove();
                return;
            }
            
            // Delete note action
            if (e.target.closest('[data-delete-note]')) {
                const noteId = e.target.closest('[data-delete-note]').dataset.deleteNote;
                if (window.deleteNoteOperations) {
                    window.deleteNoteOperations.showDeleteModal(noteId);
                } else {
                    this.deleteNote(noteId);
                }
                contextMenu.remove();
                return;
            }

            // Share note action
            if (e.target.closest('[data-action="share"]')) {
                const noteId = e.target.closest('[data-action="share"]').dataset.noteId;
                if (this.openShareModal) {
                    this.openShareModal(noteId);
                }
                contextMenu.remove();
                return;
            }

            // Export note action
            if (e.target.closest('[data-action="export"]')) {
                const noteId = e.target.closest('[data-action="export"]').dataset.noteId;
                if (window.fileOperations && window.fileOperations.exportNote) {
                    window.fileOperations.exportNote(noteId);
                }
                contextMenu.remove();
                return;
            }

            // Duplicate note action
            if (e.target.closest('[data-action="duplicate"]')) {
                const noteId = e.target.closest('[data-action="duplicate"]').dataset.noteId;
                const note = this.notes.find(n => n.id.toString() === noteId.toString());
                if (note) {
                    const newNote = {...note};
                    newNote.id = Date.now();
                    newNote.title = `${note.title} (Copy)`;
                    newNote.date = new Date().toISOString();
                    newNote.lastModified = new Date().toISOString();
                    this.notes.push(newNote);
                    this.saveNotes();
                    this.renderNotesList();
                    this.showNotification('Note duplicated successfully', 'success');
                }
                contextMenu.remove();
                return;
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function closeMenu(e) {
            if (!contextMenu.contains(e.target)) {
                contextMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    /**
     * Generate the submenu for folder selection
     * @param {string} noteId - ID of the note 
     * @returns {string} HTML for the folder submenu
     */
    generateFolderSubmenu(noteId) {
        // Get folders from folderManager if available
        const folders = (window.folderManager && window.folderManager.folders) || [];
        
        // Create folder options HTML with direct onclick handlers like in the backup
        let submenuHTML = '';
        
        // Add option to move to no folder (root)
        submenuHTML += `
            <div class="submenu-item" onclick="window.notesApp.moveNoteToFolder('${noteId}', null)">
                <i class="fas fa-home"></i> Main Notes
            </div>`;
            
        // Add all available folders
        if (folders.length > 0) {
            folders.forEach(folder => {
                submenuHTML += `
                    <div class="submenu-item" onclick="window.notesApp.moveNoteToFolder('${noteId}', '${folder.id}')">
                        <i class="fas fa-folder"></i> ${folder.name}
                    </div>`;
            });
        } else {
            submenuHTML += `
                <div class="submenu-item disabled">
                    <i class="fas fa-info-circle"></i> No folders available
                </div>`;
        }
        
        return submenuHTML;
    }

    /**
     * Moves a note to a specified folder
     * @param {string} noteId - ID of the note to move
     * @param {string|null} folderId - ID of the destination folder, or null to remove from folder
     */
    moveNoteToFolder(noteId, folderId) {
        console.log('[DEBUG] Moving note', noteId, 'to folder', folderId);
        
        // Use centralized folder operations if available
        if (window.folderOperations && typeof window.folderOperations.moveNoteToFolder === 'function') {
            window.folderOperations.moveNoteToFolder(noteId, folderId);
            return;
        }

        // Legacy fallback implementation
        console.log('[DEBUG] Using legacy moveNoteToFolder implementation');
        
        // Find the note by ID
        const note = this.notes.find(n => n.id.toString() === noteId.toString());
        if (!note) {
            console.error('[ERROR] Note not found:', noteId);
            return;
        }
        
        // Convert folderId to proper type (null if null passed, number otherwise)
        const parsedFolderId = folderId === null ? null : parseInt(folderId);
        
        // Update the note's folder ID
        note.folderId = parsedFolderId;
        
        // Save changes to localStorage
        this.saveNotes();
        
        // Update folder counts
        if (window.folderManager) {
            window.folderManager.renderFolders();
        }
        
        // Show notification
        this.showNotification('Note moved successfully', 'success');
    }

    /**
     * Filter notes by folder ID
     * @param {number|string} folderId - ID of the folder to filter by
     */
    filterNotesByFolder(folderId) {
        // Use centralized folder operations if available
        if (window.folderOperations) {
            window.folderOperations.filterNotesByFolder(folderId);
            return;
        }

        // Legacy fallback implementation
        console.log('[DEBUG] Using legacy filterNotesByFolder - Consider updating to folderOperations');
        this.currentFolderId = parseInt(folderId);

        const filteredNotes = this.notes.filter(note =>
            note.folderId === parseInt(folderId)
        );

        this.renderNotesList(filteredNotes);

        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.folderId === folderId.toString()) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Show all notes without folder filtering
     */
    showAllNotes() {
        // Use centralized folder operations if available
        if (window.folderOperations) {
            window.folderOperations.showAllNotes();
            return;
        }

        // Legacy fallback implementation
        console.log('[DEBUG] Using legacy showAllNotes - Consider updating to folderOperations');
        this.currentFolder = null;
        this.currentFolderId = null;

        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active', 'selected');
        });

        const allNotesLink = document.querySelector('.all-notes-link');
        if (allNotesLink) {
            allNotesLink.classList.add('selected');
        }

        this.renderNotesList(this.notes.sort((a, b) =>
            new Date(b.lastModified || b.date) - new Date(a.lastModified || a.date)
        ));
    }

    /**
     * Creates a new note with specified title and content
     * @param {string} title - The title for the new note (optional)
     * @param {string} content - The content for the new note (optional)
     */
    createNewNote(title = '', content = '') {
        console.log('[DEBUG] Creating new note with title:', title);

        try {
            const note = new Note(
                title || 'Untitled Note',
                content || '',
                Date.now(),
                [],
                null
            );

            // Add the note to the beginning of the array so it appears first
            this.notes.unshift(note);

            // Save to localStorage immediately
            this.saveNotes();

            // Select the new note
            this.selectNote(note);

            // Add title and H1 to content area if empty
            if (!content) {
                this.noteContent.innerHTML = `<h1>${note.title}</h1><br>`;
            }

            // Focus the title input to allow immediate typing
            if (this.noteTitle) {
                this.noteTitle.focus();
                this.noteTitle.select();
            }

            // Dispatch event indicating a note was created
            document.dispatchEvent(new CustomEvent('note-created', { detail: { note: note } }));

            console.log('[DEBUG] New note created successfully with ID:', note.id);
            return note;
        } catch (error) {
            console.error('[DEBUG] Error creating new note:', error);
            return null;
        }
    }

    /**
     * Select a note and display it in the editor
     * @param {Object} note - The note to select and display
     */
    selectNote(note) {
        console.log('[DEBUG] Selecting note:', note.id);

        try {
            if (!note) {
                console.error('[DEBUG] Cannot select null note');
                return;
            }

            this.currentNote = note;

            // Set note title in editor
            if (this.noteTitle) {
                this.noteTitle.value = note.title || 'Untitled Note';
            }

            // Set note content in editor
            if (this.noteContent) {
                // Check if content has H1, if not add it
                let content = note.content || '';
                if (content.trim() === '' || !content.includes('<h1>')) {
                    content = `<h1>${note.title || 'Untitled Note'}</h1>${content}`;
                }

                this.noteContent.innerHTML = content;
                this.noteContent.focus();
            }

            // Update UI state
            this.updateSaveButton();

            // Set current tags from the note
            this.currentTags = note.tags || [];

            // Highlight the selected note in the list
            document.querySelectorAll('.note-item').forEach(item => {
                item.classList.remove('selected');
                if (item.dataset.id === note.id.toString()) {
                    item.classList.add('selected');
                }
            });

            // Dispatch a custom event to notify other components
            document.dispatchEvent(new CustomEvent('note-selected', {
                detail: { noteId: note.id }
            }));

            console.log('[DEBUG] Note selected successfully');
        } catch (error) {
            console.error('[DEBUG] Error selecting note:', error);
        }
    }

    /**
     * Saves the current note to localStorage
     * @param {boolean} silent - Whether to skip showing the save indicator
     */
    saveCurrentNote(silent = false) {
        console.log('[DEBUG] Saving current note, silent mode:', silent);

        if (!this.currentNote) {
            console.warn('[DEBUG] No current note to save');
            return false;
        }

        try {
            // Update note properties from the UI
            this.currentNote.title = (this.noteTitle && this.noteTitle.value) || 'Untitled Note';
            this.currentNote.content = (this.noteContent && this.noteContent.innerHTML) || '';
            this.currentNote.lastModified = Date.now();

            // Save to localStorage
            this.saveNotes();

            // Update UI
            this.renderNotesList();
            this.updateSaveButton();

            // Show save indicator unless in silent mode
            if (!silent) {
                this.showSaveIndicator();
            }

            console.log('[DEBUG] Note saved successfully:', this.currentNote.id);
            return true;
        } catch (error) {
            console.error('[DEBUG] Error saving note:', error);
            return false;
        }
    }

    /**
     * Shows a temporary save indicator
     */
    showSaveIndicator() {
        console.log('[DEBUG] Showing save indicator');

        // Create or get save indicator element
        let indicator = document.getElementById('saveIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'saveIndicator';
            indicator.className = 'save-indicator';
            document.body.appendChild(indicator);
        }

        // Set content and make visible
        indicator.textContent = 'Saved!';
        indicator.style.display = 'block';
        indicator.style.opacity = '1';

        // Hide after a delay
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 500);
        }, 2000);
    }

    filterNotesByFolder(folderId) {
        // Update current folder ID to keep track of active folder
        this.currentFolderId = parseInt(folderId);

        // Filter notes that belong to this folder
        const filteredNotes = this.notes.filter(note =>
            note.folderId === parseInt(folderId)
        );

        // Update UI with filtered notes
        this.renderNotesList(filteredNotes);

        // Update sidebar UI to show the folder as active
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.folderId === folderId.toString()) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Render notes list with optional filtering
     * @param {Array} notesToRender - Notes array to render (defaults to all notes)
     */
    renderNotesList(notesToRender = this.notes) {
        this.notesList.innerHTML = '';
        notesToRender.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.draggable = true;
            noteElement.dataset.id = note.id;

            // Get folder name if note is in a folder
            let folderName = '';
            if (note.folderId && window.folderManager) {
                const folder = window.folderManager.folders.find(f => f.id === note.folderId);
                if (folder) {
                    folderName = `<div class="note-folder"><i class="fas fa-folder"></i> ${folder.name}</div>`;
                }
            }

            // Get a shorter preview
            const preview = this.getPreview(note.content || '');

            // Create tags HTML if note has tags
            let tagsHtml = '';
            if (note.tags && note.tags.length > 0) {
                const tagsDisplay = note.tags.map(tag =>
                    `<span class="note-tag" data-tag="${tag}">${tag}</span>`
                ).join('');
                tagsHtml = `<div class="note-tags">${tagsDisplay}</div>`;
            }

            // Add share icon if note is shared
            let shareIcon = '';
            if (note.shareId) {
                shareIcon = `<i class="fas fa-share-alt" style="color: #1976d2; margin-left: 5px;" title="Shared"></i>`;
            }

            noteElement.innerHTML = `
                <div class="note-content-wrapper">
                    <div class="note-title">${note.title} ${shareIcon}</div>
                    ${folderName}
                    <div class="note-preview">${preview}</div>
                    ${tagsHtml}
                    <div class="note-date">${this.formatDate(note.lastModified || note.date)}</div>
                </div>
                <div class="note-actions">
                    <i class="fas fa-ellipsis-v note-menu-trigger" title="Note Options"></i>
                </div>
            `;

            if (this.currentNote && this.currentNote.id === note.id) {
                noteElement.classList.add('selected');
            }

            // Add click event for the entire note
            noteElement.addEventListener('click', (e) => {
                // Skip if clicking on the menu trigger
                if (e.target.classList.contains('note-menu-trigger') ||
                    e.target.closest('.note-actions')) {
                    return;
                }

                // If a tag was clicked, filter by that tag instead of selecting the note
                if (e.target.classList.contains('note-tag')) {
                    e.stopPropagation();
                    const tag = e.target.dataset.tag;
                    if (tag) {
                        this.filterNotesByTag(tag);
                        // Update search input to show we're filtering by this tag
                        if (this.searchInput) {
                            this.searchInput.value = `tag:${tag}`;
                        }
                    }
                } else {
                    // Otherwise select the note as usual
                    this.selectNote(note);
                }
            });

            // Add context menu on right-click
            noteElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showNoteContextMenu(e.pageX, e.pageY, note.id);
                return false;
            });

            // Add click event for the menu trigger icon
            const menuTrigger = noteElement.querySelector('.note-menu-trigger');
            if (menuTrigger) {
                menuTrigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Position context menu near the trigger icon
                    const rect = menuTrigger.getBoundingClientRect();
                    this.showNoteContextMenu(rect.right, rect.bottom + window.scrollY, note.id);
                });
            }

            this.notesList.appendChild(noteElement);
        });
    }

    saveNotes() {
        console.log('[DEBUG] Saving notes to localStorage');
        try {
            localStorage.setItem('notes', JSON.stringify(this.notes));
            
            // Dispatch event to notify other components
            document.dispatchEvent(new CustomEvent('notes-saved', {
                detail: { notes: this.notes }
            }));
            
            // If the note list needs updating, do it here
            if (this.notesList) {
                // Determine if we need to re-render the filtered list or all notes
                if (this.currentFolderId) {
                    const filteredNotes = this.notes.filter(note => 
                        note.folderId === this.currentFolderId
                    );
                    this.renderNotesList(filteredNotes);
                } else {
                    this.renderNotesList();
                }
            }
            
            // Update folder counts if needed
            if (window.folderManager && typeof window.folderManager.renderFolders === 'function') {
                window.folderManager.renderFolders();
            }
        } catch (error) {
            console.error('[DEBUG] Error saving notes:', error);
        }
    }

    /**
     * Loads notes from localStorage and renders the list
     * @param {string} noteIdToSelect - Optional ID of note to select after loading
     */
    loadNotes(noteIdToSelect) {
        try {
            // Get notes from localStorage
            const savedNotes = localStorage.getItem('notes');
            if (savedNotes) {
                this.notes = JSON.parse(savedNotes);

                // Create proper Note objects from the data
                this.notes = this.notes.map(note => {
                    return new Note(
                        note.title,
                        note.content,
                        note.id,
                        note.tags || [],
                        note.shareId
                    );
                });

                // Sort notes by last modified date, newest first
                this.notes.sort((a, b) => b.lastModified - a.lastModified);

                // Render all notes
                this.renderNotesList();

                // Select the first note if available, or specific note if provided
                if (this.notes.length > 0) {
                    if (noteIdToSelect) {
                        // Find the note with the specified ID
                        const noteToSelect = this.notes.find(note => note.id == noteIdToSelect);
                        if (noteToSelect) {
                            this.selectNote(noteToSelect);
                        } else {
                            this.selectNote(this.notes[0]);
                        }
                    } else {
                        this.selectNote(this.notes[0]);
                    }
                } else {
                    // No notes, create a welcome note
                    this.createWelcomeNote();
                }
            } else {
                // No saved notes, create a welcome note
                this.createWelcomeNote();
            }

            // Load all tags
            this.loadAllTags();

            // Check for shared note URLs
            this.checkForSharedNote();

            // Ensure proper display of formatting tools based on device
            this.initializeFormattingTools();
        } catch (error) {
            console.error('[DEBUG] Error loading notes:', error);
            // Create welcome note if error loading
            this.createWelcomeNote();
        }
    }

    /**
     * Creates a welcome note with formatting examples
     */
    createWelcomeNote() {
        console.log('[DEBUG] Creating welcome note');

        const welcomeContent = `
<h1>Welcome to NotePad!</h1>
<p>This is your first note in NotePad, a feature-rich note-taking application. Here's how to get started:</p>

<h2>Key Features</h2>
<ul>
    <li><strong>Text formatting</strong> - Style your text with bold, <em>italic</em>, <u>underline</u>, and more</li>
    <li><strong>Folder organization</strong> - Keep your notes organized in folders</li>
    <li><strong>Tags</strong> - Tag notes for easy filtering and organization</li>
    <li><strong>Sharing</strong> - Share your notes with others</li>
    <li><strong>Auto-save</strong> - Your notes are automatically saved as you type</li>
</ul>

<h2>Formatting Examples</h2>
<p>Try out these formatting options using the toolbar:</p>

<h3>Text Styles</h3>
<p><strong>Bold text</strong> - Use for emphasis</p>
<p><em>Italic text</em> - Use for subtle emphasis</p>
<p><u>Underlined text</u> - Use to highlight important information</p>
<p><del>Strikethrough</del> - Use to show removed content</p>

<h3>Lists</h3>
<p>Create organized content with lists:</p>
<ul>
    <li>Unordered list item 1</li>
    <li>Unordered list item 2</li>
    <li>Unordered list item 3</li>
</ul>

<ol>
    <li>Ordered list item 1</li>
    <li>Ordered list item 2</li>
    <li>Ordered list item 3</li>
</ol>

<h3>Blockquotes</h3>
<blockquote>
    This is a blockquote. Use it to highlight important information or quotes from other sources.
</blockquote>

<h3>Code Blocks</h3>
<pre><code>// This is a code block
function sayHello() {
    console.log("Hello, world!");
}
</code></pre>

<h2>Organization</h2>
<p>Keep your notes organized with these features:</p>
<ul>
    <li><strong>Folders</strong> - Create folders to group related notes</li>
    <li><strong>Tags</strong> - Add tags to notes for easy searching and filtering</li>
    <li><strong>Search</strong> - Quickly find notes with the search feature</li>
</ul>

<h2>Getting Help</h2>
<p>If you need assistance, check out the following resources:</p>
<ul>
    <li>Help documentation</li>
    <li>Support website</li>
    <li>Community forums</li>
</ul>

<p>Now go ahead and create your first note by clicking the "+" button in the sidebar!</p>
`;

        // Create a new note with the welcome content
        const welcomeNote = new Note(
            'Welcome to NotePad!',
            welcomeContent,
            Date.now(),
            ['welcome', 'tutorial'],
            null
        );

        // Add to notes array
        this.notes.unshift(welcomeNote);

        // Save to localStorage
        this.saveNotes();

        // Select the welcome note
        this.selectNote(welcomeNote);

        console.log('[DEBUG] Welcome note created successfully');
    }

    deleteCurrentNote() {
        if (this.currentNote) {
            if (window.deleteNoteOperations) {
                window.deleteNoteOperations.deleteNote(this.currentNote.id);
            } else {
                console.error('DeleteNoteOperations not initialized');
            }
        }
    }

    getPreview(content) {
        // Remove HTML tags and get plain text
        const plainText = content.replace(/<[^>]*>/g, '').trim();
        // Return first 50 characters as preview (shorter for compact design)
        return plainText.length > 50 ? plainText.slice(0, 50) + '...' : plainText;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();

        return `${month} ${day}, ${year}`;
    }

    formatText(command) {
        document.execCommand(command, false, null);
        this.noteContent.focus();
    }

    insertHeading() {
        document.execCommand('formatBlock', false, '<h2>');
        this.noteContent.focus();
    }

    insertQuote() {
        document.execCommand('formatBlock', false, '<blockquote>');
        this.noteContent.focus();
    }

    insertCode() {
        document.execCommand('formatBlock', false, '<pre>');
        this.noteContent.focus();
    }

    alignLeft() {
        document.execCommand('justifyLeft', false, null);
        this.updateActiveButtons();
    }

    alignCenter() {
        document.execCommand('justifyCenter', false, null);
        this.updateActiveButtons();
    }

    alignRight() {
        document.execCommand('justifyRight', false, null);
        this.updateActiveButtons();
    }

    indent() {
        document.execCommand('indent', false, null);
        this.updateActiveButtons();
    }

    outdent() {
        document.execCommand('outdent', false, null);
        this.updateActiveButtons();
    }

    insertLink() {
        // Get current selection
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();

        // Create a custom modal for link insertion
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;

        // Create form elements
        const form = document.createElement('form');
        form.onsubmit = (e) => e.preventDefault();

        const title = document.createElement('h3');
        title.textContent = 'Insert Link';
        title.style.margin = '0 0 15px 0';

        const textLabel = document.createElement('label');
        textLabel.textContent = 'Link Text:';
        textLabel.style.display = 'block';
        textLabel.style.marginBottom = '5px';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = selectedText;
        textInput.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        `;

        const urlLabel = document.createElement('label');
        urlLabel.textContent = 'URL:';
        urlLabel.style.display = 'block';
        urlLabel.style.marginBottom = '5px';

        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.value = 'https://';
        urlInput.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        `;

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 8px 16px;
            background: #e9ecef;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;

        const insertButton = document.createElement('button');
        insertButton.textContent = 'Insert';
        insertButton.style.cssText = `
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;

        // Handle button clicks
        cancelButton.onclick = () => {
            document.body.removeChild(modal);
        };

        insertButton.onclick = () => {
            const text = textInput.value.trim();
            const url = urlInput.value.trim();

            if (!text || !url || url === 'https://') {
                alert('Please enter both text and URL.');
                return;
            }

            // Select the original range
            selection.removeAllRanges();
            selection.addRange(range);

            // Delete any selected content
            range.deleteContents();

            // Create the link
            const link = document.createElement('a');
            link.href = url;
            link.textContent = text;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            // Insert the link
            range.insertNode(link);

            // Move cursor after the link
            range.setStartAfter(link);
            range.setEndAfter(link);
            selection.removeAllRanges();
            selection.addRange(range);

            // Remove the modal
            document.body.removeChild(modal);

            // Focus back on editor
            this.noteContent.focus();
        };

        // Assemble the modal
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(insertButton);

        form.appendChild(title);
        form.appendChild(textLabel);
        form.appendChild(textInput);
        form.appendChild(urlLabel);
        form.appendChild(urlInput);
        form.appendChild(buttonContainer);

        modalContent.appendChild(form);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Focus on text input if no text is selected, otherwise on URL
        if (!selectedText) {
            textInput.focus();
        } else {
            urlInput.focus();
            urlInput.select();
        }
    }

    insertImage() {
        // Create modal for image insertion options
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;

        // Create form elements
        const form = document.createElement('form');
        form.onsubmit = (e) => e.preventDefault();

        const title = document.createElement('h3');
        title.textContent = 'Insert Image';
        title.style.margin = '0 0 15px 0';

        // Create tabs
        const tabContainer = document.createElement('div');
        tabContainer.style.cssText = `
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-bottom: 15px;
        `;

        const uploadTab = document.createElement('button');
        uploadTab.textContent = 'Upload';
        uploadTab.style.cssText = `
            padding: 8px 16px;
            background: #f8f9fa;
            border: none;
            border-bottom: 2px solid #007bff;
            cursor: pointer;
            flex: 1;
        `;

        const urlTab = document.createElement('button');
        urlTab.textContent = 'URL';
        urlTab.style.cssText = `
            padding: 8px 16px;
            background: #f8f9fa;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            flex: 1;
        `;

        // Create upload section
        const uploadSection = document.createElement('div');

        const uploadLabel = document.createElement('label');
        uploadLabel.textContent = 'Select Image:';
        uploadLabel.style.display = 'block';
        uploadLabel.style.marginBottom = '5px';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.cssText = `
            width: 100%;
            margin-bottom: 15px;
        `;

        uploadSection.appendChild(uploadLabel);
        uploadSection.appendChild(fileInput);

        // Create URL section
        const urlSection = document.createElement('div');
        urlSection.style.display = 'none';

        const urlLabel = document.createElement('label');
        urlLabel.textContent = 'Image URL:';
        urlLabel.style.display = 'block';
        urlLabel.style.marginBottom = '5px';

        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.value = 'https://';
        urlInput.placeholder = 'https://example.com/image.jpg';
        urlInput.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        `;

        urlSection.appendChild(urlLabel);
        urlSection.appendChild(urlInput);

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        `;

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 8px 16px;
            background: #e9ecef;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;

        const insertButton = document.createElement('button');
        insertButton.textContent = 'Insert';
        insertButton.style.cssText = `
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;

        // Tab switching
        uploadTab.onclick = (e) => {
            e.preventDefault();
            uploadTab.style.borderBottomColor = '#007bff';
            urlTab.style.borderBottomColor = 'transparent';
            uploadSection.style.display = 'block';
            urlSection.style.display = 'none';
        };

        urlTab.onclick = (e) => {
            e.preventDefault();
            uploadTab.style.borderBottomColor = 'transparent';
            urlTab.style.borderBottomColor = '#007bff';
            uploadSection.style.display = 'none';
            urlSection.style.display = 'block';
        };

        // Get current selection
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        // Handle cancel button
        cancelButton.onclick = () => {
            document.body.removeChild(modal);
        };

        // Handle insert button
        insertButton.onclick = () => {
            const isUploadActive = uploadSection.style.display !== 'none';

            if (isUploadActive) {
                // Handle file upload
                const file = fileInput.files[0];
                if (!file) {
                    alert('Please select an image file.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    insertImageAtCursor(e.target.result, file.name.replace(/\.[^/.]+$/, ""));
                };
                reader.readAsDataURL(file);
            } else {
                // Handle URL input
                const url = urlInput.value.trim();
                if (!url || url === 'https://') {
                    alert('Please enter a valid image URL.');
                    return;
                }

                insertImageAtCursor(url, 'Image');
            }
        };

        // Helper function to insert image at cursor
        const insertImageAtCursor = (src, alt) => {
            try {
                // Select the original range
                selection.removeAllRanges();
                selection.addRange(range);

                // Create image element with added styles
                const img = document.createElement('img');
                img.src = src;
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.alt = alt;

                // Insert the image at cursor position
                range.deleteContents();
                range.insertNode(img);

                // Move cursor after the image
                range.setStartAfter(img);
                range.setEndAfter(img);
                selection.removeAllRanges();
                selection.addRange(range);

                // Insert a line break after image
                document.execCommand('insertHTML', false, '<br>');

                // Remove modal and focus editor
                document.body.removeChild(modal);
                this.noteContent.focus();
            } catch (error) {
                console.error('Error inserting image:', error);
                document.body.removeChild(modal);
            }
        };

        // Assemble the modal
        tabContainer.appendChild(uploadTab);
        tabContainer.appendChild(urlTab);

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(insertButton);

        form.appendChild(title);
        form.appendChild(tabContainer);
        form.appendChild(uploadSection);
        form.appendChild(urlSection);
        form.appendChild(buttonContainer);

        modalContent.appendChild(form);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    insertHorizontalRule() {
        document.execCommand('insertHorizontalRule', false, null);
        this.noteContent.focus();
    }

    updateActiveButtons() {
        // Get current formatting state
        const isBold = document.queryCommandState('bold');
        const isItalic = document.queryCommandState('italic');
        const isUnderline = document.queryCommandState('underline');
        const isStrikeThrough = document.queryCommandState('strikeThrough');
        const isJustifyLeft = document.queryCommandState('justifyLeft');
        const isJustifyCenter = document.queryCommandState('justifyCenter');
        const isJustifyRight = document.queryCommandState('justifyRight');

        // Update mobile button states
        this.toggleButtonActiveState(this.boldBtn, isBold);
        this.toggleButtonActiveState(this.italicBtn, isItalic);
        this.toggleButtonActiveState(this.underlineBtn, isUnderline);
        this.toggleButtonActiveState(this.strikeBtn, isStrikeThrough);

        // Update toolbar button states
        this.toggleButtonActiveState(this.toolbarBoldBtn, isBold);
        this.toggleButtonActiveState(this.toolbarItalicBtn, isItalic);
        this.toggleButtonActiveState(this.toolbarUnderlineBtn, isUnderline);
        this.toggleButtonActiveState(this.toolbarStrikeBtn, isStrikeThrough);
        this.toggleButtonActiveState(this.toolbarAlignLeftBtn, isJustifyLeft);
        this.toggleButtonActiveState(this.toolbarAlignCenterBtn, isJustifyCenter);
        this.toggleButtonActiveState(this.toolbarAlignRightBtn, isJustifyRight);
    }

    toggleButtonActiveState(button, isActive) {
        if (!button) return;

        if (isActive) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }

    /**
     * Search notes based on search term
     * @param {string} searchTerm - Term to search for in notes
     */
    searchNotes(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            this.renderNotesList();
            return;
        }

        searchTerm = searchTerm.toLowerCase().trim();

        // Check if it's a tag search (tag:tagname)
        if (searchTerm.startsWith('tag:')) {
            const tagName = searchTerm.substring(4).trim();
            if (tagName) {
                this.filterNotesByTag(tagName);
                return;
            }
        }

        const filteredNotes = this.notes.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(searchTerm);
            const contentMatch = note.content.toLowerCase().includes(searchTerm);

            // Also search in tags
            const tagMatch = note.tags && note.tags.some(tag =>
                tag.toLowerCase().includes(searchTerm)
            );

            return titleMatch || contentMatch || tagMatch;
        });

        this.renderNotesList(filteredNotes);

        // Highlight search terms in the results list
        if (filteredNotes.length > 0) {
            this.highlightSearchTerms(searchTerm);
        }
    }

    /**
     * Highlight search terms in the note list
     * @param {string} searchTerm - Term to highlight
     */
    highlightSearchTerms(searchTerm) {
        const noteItems = document.querySelectorAll('.note-item .note-title, .note-item .note-preview');
        const regex = new RegExp(`(${searchTerm})`, 'gi');

        noteItems.forEach(element => {
            const originalText = element.textContent;
            element.innerHTML = originalText.replace(regex, '<span class="highlight">$1</span>');
        });
    }

    /**
     * Open share modal and generate a unique share link
     */
    openShareModal() {
        if (!this.currentNote) {
            alert('Please select a note to share');
            return;
        }

        // Generate a share ID if not already present
        if (!this.currentNote.shareId) {
            // Create a random ID for sharing
            this.currentNote.shareId = this.generateShareId();
            // Save changes
            this.saveCurrentNote();
        }

        // Create the share URL
        const shareUrl = this.createShareUrl(this.currentNote.shareId);

        // Update the share link field
        this.shareLink.value = shareUrl;

        // Update preview content
        const previewTitle = document.getElementById('sharePreviewTitle');
        const previewContent = document.getElementById('sharePreviewContent');

        if (previewTitle && previewContent) {
            previewTitle.textContent = this.currentNote.title;

            // Get a plain text preview of the content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.currentNote.content;
            let plainText = tempDiv.textContent || tempDiv.innerText || '';

            // Limit preview to first 150 characters
            plainText = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
            previewContent.textContent = plainText;
        }

        // Show the share modal
        this.shareModal.style.display = 'block';
    }

    /**
     * Generate a unique ID for sharing
     * @returns {string} A unique share ID
     */
    generateShareId() {
        return 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Create a shareable URL for a note
     * @param {string} shareId - The note's share ID
     * @returns {string} The full sharing URL
     */
    createShareUrl(shareId) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?share=${shareId}`;
    }

    /**
     * Copy the share link to clipboard
     */
    copyShareLink() {
        this.shareLink.select();
        document.execCommand('copy');

        // Show copy status indicator
        const copyStatus = document.getElementById('copyStatus');
        if (copyStatus) {
            copyStatus.classList.add('show');

            // Hide after 2 seconds
            setTimeout(() => {
                copyStatus.classList.remove('show');
            }, 2000);
        }
    }

    /**
     * Share note via email
     */
    shareViaEmail() {
        const subject = encodeURIComponent(`Check out my note: ${this.currentNote.title}`);
        const body = encodeURIComponent(`I want to share this note with you:\n\n${this.shareLink.value}`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
    }

    /**
     * Share note via WhatsApp
     */
    shareViaWhatsApp() {
        const text = encodeURIComponent(`Check out my note "${this.currentNote.title}": ${this.shareLink.value}`);
        window.open(`https://wa.me/?text=${text}`);
    }

    /**
     * Share note via Twitter
     */
    shareViaTwitter() {
        const text = encodeURIComponent(`Check out my note "${this.currentNote.title}": ${this.shareLink.value}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`);
    }

    /**
     * Open tag management modal
     */
    openTagModal() {
        if (!this.currentNote) {
            alert('Please select a note to tag');
            return;
        }

        // Reset current tags to match the note's tags
        this.currentTags = [...(this.currentNote.tags || [])];

        // Render current tags
        this.renderCurrentTags();

        // Render popular tags
        this.renderPopularTags();

        // Clear the new tag input
        this.newTagInput.value = '';

        // Show the modal
        this.tagModal.style.display = 'block';
    }

    /**
     * Add a new tag to the current tags
     */
    addNewTag() {
        const tagName = this.newTagInput.value.trim();

        if (tagName) {
            // Make sure it's not a duplicate
            if (!this.currentTags.includes(tagName)) {
                this.currentTags.push(tagName);
                this.renderCurrentTags();

                // Add to all tags if not already there
                if (!this.allTags.includes(tagName)) {
                    this.allTags.push(tagName);
                    this.saveAllTags();
                }
            }

            // Clear the input
            this.newTagInput.value = '';
        }
    }

    /**
     * Remove a tag from the current tags
     * @param {string} tagName - The tag to remove
     */
    removeTag(tagName) {
        const index = this.currentTags.indexOf(tagName);
        if (index > -1) {
            this.currentTags.splice(index, 1);
            this.renderCurrentTags();
        }
    }

    /**
     * Render the current tags in the tag modal
     */
    renderCurrentTags() {
        this.tagsContainer.innerHTML = '';

        if (this.currentTags.length === 0) {
            this.tagsContainer.innerHTML = '<p>No tags added yet</p>';
            return;
        }

        this.currentTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="tag-remove"><i class="fas fa-times"></i></span>
            `;

            // Add click event to remove the tag
            tagElement.querySelector('.tag-remove').addEventListener('click', () => {
                this.removeTag(tag);
            });

            this.tagsContainer.appendChild(tagElement);
        });
    }

    /**
     * Render popular tags in the tag modal
     */
    renderPopularTags() {
        this.popularTagsContainer.innerHTML = '';

        if (this.allTags.length === 0) {
            this.popularTagsContainer.innerHTML = '<p>No tags used yet</p>';
            return;
        }

        // Get tag usage counts
        const tagCounts = {};
        this.notes.forEach(note => {
            if (note.tags && Array.isArray(note.tags)) {
                note.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // Sort tags by usage and take top 10
        const popularTags = Object.keys(tagCounts)
            .sort((a, b) => tagCounts[b] - tagCounts[a])
            .slice(0, 10);

        popularTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.textContent = tag;

            // Don't show already added tags
            if (!this.currentTags.includes(tag)) {
                // Add click event to add the tag
                tagElement.addEventListener('click', () => {
                    if (!this.currentTags.includes(tag)) {
                        this.currentTags.push(tag);
                        this.renderCurrentTags();
                    }
                });

                this.popularTagsContainer.appendChild(tagElement);
            }
        });

        if (this.popularTagsContainer.children.length === 0) {
            this.popularTagsContainer.innerHTML = '<p>All popular tags are already added</p>';
        }
    }

    /**
     * Save tags to the current note
     */
    saveTagsToNote() {
        if (this.currentNote) {
            this.currentNote.tags = [...this.currentTags];
            this.saveNotes();
            this.renderNotesList();
            this.tagModal.style.display = 'none';
        }
    }

    /**
     * Save all tags to localStorage
     */
    saveAllTags() {
        localStorage.setItem('allTags', JSON.stringify(this.allTags));
    }

    /**
     * Load all tags from localStorage
     */
    loadAllTags() {
        const savedTags = localStorage.getItem('allTags');
        this.allTags = savedTags ? JSON.parse(savedTags) : [];
    }

    /**
     * Check for a shared note in the URL
     */
    checkForSharedNote() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');

        if (shareId) {
            // Check if this shared note exists in our notes
            const sharedNote = this.notes.find(note => note.shareId === shareId);

            if (sharedNote) {
                // If we already have this note, just select it
                this.selectNote(sharedNote);
            } else {
                // Try to load the shared note
                this.loadSharedNote(shareId);
            }
        }
    }

    /**
     * Load a shared note by its shareId
     * @param {string} shareId - The share ID of the note to load
     */
    loadSharedNote(shareId) {
        // For local storage implementation, we would need to fetch from server
        // Since this is a client-side app, we'll simulate loading from server

        // In a real implementation, you would fetch the note from a server API
        // For now, we'll show an info message about the limitation

        const confirmation = confirm(
            'This is a shared note link. In a full implementation, this would load a shared note from the server. ' +
            'Would you like to create a sample note to demonstrate the concept?'
        );

        if (confirmation) {
            const sharedNote = new Note(
                'Shared Note Example',
                '<h1>Shared Note Example</h1><p>This is an example of what a shared note would look like. In a complete implementation with backend support, the actual shared note content would be loaded here.</p>',
                Date.now(),
                ['shared', 'example'],
                shareId
            );

            this.notes.unshift(sharedNote);
            this.saveNotes();
            this.selectNote(sharedNote);
        }
    }

    /**
     * Filter notes by tag
     * @param {string} tag - The tag to filter by
     */
    filterNotesByTag(tag) {
        const filteredNotes = this.notes.filter(note =>
            note.tags && note.tags.includes(tag)
        );
        this.renderNotesList(filteredNotes);
    }

    /**
     * Initialize formatting tools based on device type
     * Ensures correct display across all environments
     */
    initializeFormattingTools() {
        const isMobile = window.innerWidth <= 768;

        // PC-only formatting toolbar
        const pcToolbar = document.querySelector('.format-toolbar.pc-only');
        if (pcToolbar) {
            pcToolbar.style.display = 'flex';
        }

        // Fix share and tag buttons for all environments
        this.fixShareAndTagButtons();
    }

    /**
     * Fix share and tag buttons for proper display across all devices
     */
    fixShareAndTagButtons() {
        const shareBtn = document.getElementById('shareNoteBtn');
        const tagBtn = document.getElementById('tagNoteBtn');

        if (shareBtn) {
            // Make sure the icon is visible
            const shareIcon = shareBtn.querySelector('i');
            if (shareIcon) {
                shareIcon.style.display = 'inline-block';
                shareIcon.style.marginRight = '4px';
            }

            // Make sure the button is visible
            shareBtn.style.display = 'inline-flex';
            shareBtn.style.alignItems = 'center';
            shareBtn.style.justifyContent = 'center';
        }

        if (tagBtn) {
            // Make sure the icon is visible
            const tagIcon = tagBtn.querySelector('i');
            if (tagIcon) {
                tagIcon.style.display = 'inline-block';
                tagIcon.style.marginRight = '4px';
            }

            // Make sure the button is visible
            tagBtn.style.display = 'inline-flex';
            tagBtn.style.alignItems = 'center';
            tagBtn.style.justifyContent = 'center';
        }
    }

    /**
     * Handle window resize event to adjust UI for different screen sizes
     */
    handleWindowResize() {
        // Debounce the resize event to avoid performance issues
        if (this.resizeTimer) clearTimeout(this.resizeTimer);

        this.resizeTimer = setTimeout(() => {
            // Re-initialize formatting tools based on new window size
            this.initializeFormattingTools();
        }, 250);
    }

    downloadNoteAsText() {
        console.log('Downloading note as text');

        // Get the note title and content
        const title = this.noteTitle?.value || 'Untitled Note';
        const content = this.noteContent?.innerHTML || '';

        // Convert HTML content to plain text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const textContent = tempDiv.innerText || tempDiv.textContent || '';

        // Create the file content with title and text
        const fileContent = `${title}\n${'='.repeat(title.length)}\n\n${textContent}`;

        try {
            // Create a blob with the content
            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });

            // Create a temporary link to trigger the download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;

            // Append link to body, click it, and remove it
            document.body.appendChild(link);
            link.click();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                console.log('Download complete');
            }, 100);
        } catch (error) {
            console.error('Error downloading note:', error);
            alert('Failed to download the note. Please try again.');
        }
    }

    /**
     * Shows a notification message
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, info)
     */
    showNotification(message, type = 'info') {
        const notificationArea = document.getElementById('notificationArea') || document.body;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        // Set icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'delete') icon = 'trash-alt';

        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        // Add to DOM
        notificationArea.appendChild(notification);

        // Auto remove after delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    /**
     * Deletes a note by ID
     * @param {string} noteId - ID of the note to delete
     */
    deleteNote(noteId) {
        console.log('[DEBUG] Deleting note:', noteId);

        try {
            // Find the note index
            const noteIndex = this.notes.findIndex(n => n.id.toString() === noteId.toString());
            if (noteIndex === -1) {
                console.error('[DEBUG] Note not found:', noteId);
                return;
            }

            // Check if this is the current note
            const isCurrentNote = this.currentNote && this.currentNote.id.toString() === noteId.toString();

            // Remove the note from array
            this.notes.splice(noteIndex, 1);

            // Clear editor if this was the current note
            if (isCurrentNote) {
                this.currentNote = null;
                if (this.noteTitle) this.noteTitle.value = '';
                if (this.noteContent) this.noteContent.innerHTML = '';
                this.updateSaveButton();
            }

            // Save to localStorage
            this.saveNotes();

            // Update UI
            this.renderNotesList();

            // Select another note if available and the deleted note was the current note
            if (isCurrentNote && this.notes.length > 0) {
                this.selectNote(this.notes[0]);
            }

            // Show notification
            this.showNotification('Note deleted successfully', 'delete');

            console.log('[DEBUG] Note deleted successfully');
        } catch (error) {
            console.error('[DEBUG] Error deleting note:', error);
            this.showNotification('Error deleting note', 'error');
        }
    }

    // --- New Mobile Menu Methods ---

    createMobileMenu() {
        if (!this.mobileMenu) {
            this.mobileMenu = document.createElement('div');
            this.mobileMenu.className = 'mobile-toolbar-menu'; // Use class from CSS
            document.body.appendChild(this.mobileMenu); // Append to body to avoid overflow issues
            this.populateMobileMenu();
        }
    }

    populateMobileMenu() {
        if (!this.mobileMenu) return;
        this.mobileMenu.innerHTML = ''; // Clear existing items

        // Define which buttons go into the menu
        const menuButtonIds = [
            // Basic Formatting
            'toolbar-boldBtn', 'toolbar-italicBtn', 'toolbar-underlineBtn', 'toolbar-strikeBtn',
            // Advanced Formatting
             'toolbar-headingBtn', 'toolbar-quoteBtn', 'toolbar-codeBtn', 'toolbar-listBtn',
             'toolbar-alignLeftBtn', 'toolbar-alignCenterBtn', 'toolbar-alignRightBtn',
             'toolbar-indentBtn', 'toolbar-outdentBtn', 'toolbar-linkBtn', 'toolbar-imageBtn', 'toolbar-hrBtn',
            // Utilities
             'toolbar-cutBtn', 'toolbar-copyBtn', 'toolbar-pasteBtn', 'toolbar-undoBtn', 'toolbar-redoBtn'
             // Add other buttons like download, share, tags if desired in mobile menu
        ];

        menuButtonIds.forEach(id => {
            const originalButton = document.getElementById(id);
            if (originalButton) {
                // Clone the button to avoid moving it from the main toolbar structure
                const clone = originalButton.cloneNode(true);
                // Ensure the clone's event listener works
                // Re-attach listener based on ID or add specific data attribute
                clone.addEventListener('click', (e) => {
                     originalButton.click(); // Trigger click on the original hidden button
                     this.hideMobileMenu(); // Hide menu after click
                 });

                // Ensure text is visible in the menu item
                 const textSpan = clone.querySelector('.btn-text');
                 if (textSpan) {
                     textSpan.style.display = 'inline';
                     // Optionally, use the button's title attribute for text if span is missing
                     if (!textSpan.textContent && clone.title) {
                         textSpan.textContent = clone.title;
                     }
                 } else if (clone.title) {
                     // If no span, add one
                     const newSpan = document.createElement('span');
                     newSpan.className = 'btn-text';
                     newSpan.textContent = clone.title;
                     newSpan.style.display = 'inline';
                     clone.appendChild(newSpan);
                 }


                this.mobileMenu.appendChild(clone);
            }
        });
    }

    toggleMobileMenu() {
        if (!this.mobileMenu) {
            this.createMobileMenu();
        }
        if (this.mobileMenuVisible) {
            this.hideMobileMenu();
        } else {
            this.showMobileMenu();
        }
    }

    showMobileMenu() {
        if (!this.mobileMenu) return;
         // Recalculate position before showing
         const btnRect = this.mobileMenuBtn.getBoundingClientRect();
         this.mobileMenu.style.top = `${window.scrollY + btnRect.bottom + 2}px`; // Position below button
         this.mobileMenu.style.right = `${window.innerWidth - (window.scrollX + btnRect.right)}px`; // Align right edge
         this.mobileMenu.style.left = 'auto'; // Ensure left is not set

        this.mobileMenu.classList.add('visible');
        this.mobileMenuVisible = true;
    }

    hideMobileMenu() {
        if (!this.mobileMenu) return;
        this.mobileMenu.classList.remove('visible');
        this.mobileMenuVisible = false;
    }


    // --- Example methods for cut/copy/paste if not handled by ClipboardOps ---
    cutText() {
        document.execCommand('cut');
        this.updateActiveButtons();
    }

    copyText() {
        document.execCommand('copy');
        this.updateActiveButtons();
    }

    pasteText() {
         // Consider security/permission issues with execCommand('paste')
         // Using navigator.clipboard.readText() is preferred
         navigator.clipboard.readText().then(text => {
             if (text) {
                 document.execCommand('insertText', false, text);
             }
         }).catch(err => {
             console.error('Failed to read clipboard contents: ', err);
             // Fallback or notify user
             alert('Could not paste text. Please ensure clipboard permissions are granted.');
         });
         this.updateActiveButtons();
     }

    /**
     * Clears the content and title fields of the note editor.
     */
    clearEditor() {
        console.log('[DEBUG NotesApp] Clearing editor fields.');
        if (this.noteContent) {
            this.noteContent.innerHTML = ''; // Clear content area
        }
        if (this.noteTitle) {
            this.noteTitle.value = ''; // Clear title input
        }
        // Optionally, reset any other editor state if needed
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DEBUG] DOM Content Loaded - Initializing NotesApp");

    const initializeApp = async () => {
        try {
            // Initialize the main app first
            window.notesApp = new NotesApp();
            console.log("[DEBUG] NotesApp initialized successfully");

            // Ensure NotesApp is fully initialized
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!window.notesApp.noteContent || !window.notesApp.noteTitle) {
                throw new Error('NotesApp failed to initialize required elements');
            }

            // Initialize note operations
            // Check if the class constructor exists directly
            if (typeof NoteOperations === 'function') {
                window.noteOperations = new NoteOperations(window.notesApp);
                console.log("[DEBUG] NoteOperations initialized");
            } else {
                console.error("[DEBUG] NoteOperations class is not defined");
            }

            // Wait for NoteOperations to initialize (optional, reduce delay if possible)
            await new Promise(resolve => setTimeout(resolve, 20)); // Reduced delay

            // Initialize delete operations
            // Check if the class constructor exists directly
            if (typeof DeleteNoteOperations === 'function') {
                // Pass the notesApp instance
                window.deleteNoteOperations = new DeleteNoteOperations(window.notesApp);
                console.log("[DEBUG] DeleteNoteOperations initialized");
            } else {
                console.error("[DEBUG] DeleteNoteOperations class is not defined");
            }

            console.log('%c[App Initialization]%c All components initialized successfully',
                'color: #2ecc71; font-weight: bold',
                'color: inherit');
        } catch (error) {
            console.error("[DEBUG] Error initializing app:", error);
        }
    };

    initializeApp();
});
