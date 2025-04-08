/**
 * Main Mobile App Functionality
 * Central coordinator for mobile-specific features and UI
 */

// Check if MobileApp is already defined to prevent duplicate declaration
if (typeof window.MobileApp === 'undefined') {
    class MobileApp {
        constructor() {
            // Prevent duplicate instantiation
            if (window.mobileApp) {
                console.log('[MobileApp] Instance already exists.');
                return window.mobileApp;
            }
            window.mobileApp = this;

            this.initialized = false;
            console.log('[MobileApp] Constructor called, waiting for bridge...');

            // Listen for the bridge to be ready before initializing fully
            document.addEventListener('mobile-bridge-ready', () => {
                console.log('[MobileApp] Bridge ready event received, initializing mobile app...');
                this.completeInitialization();
            });
        }
        
        /**
         * Complete initialization after the bridge is ready.
         */
        completeInitialization() {
            if (this.initialized) {
                console.log('[MobileApp] Already initialized.');
                return;
            }

            console.log('[MobileApp] Completing initialization...');

            // Select core elements needed for mobile UI
            this.sidebar = document.querySelector('.sidebar');
            this.mainContent = document.querySelector('.main-content');
            this.noteEditor = document.querySelector('.note-editor');
            this.sidebarHeader = this.sidebar && this.sidebar.querySelector('.sidebar-header');
            this.sidebarTitle = this.sidebarHeader && this.sidebarHeader.querySelector('h2');
            this.sidebarToggle = document.getElementById('sidebarToggle');
            
            if (!this.sidebar || !this.mainContent || !this.noteEditor) {
                console.error('[MobileApp] Critical UI elements not found, cannot complete initialization.');
                return;
            }
            
            // Initialize UI components
            this.setupMobileUI();
            this.setupSidebarToggle();
            this.setupMobileTabBar();
            this.setupFloatingActions();
            
            // Set the initial view (e.g., show notes list)
            this.showAllNotes();
            
            // Add diagnostic listeners
            this.addDiagnosticListeners();
            
            // Listen for note creation event from core app
            document.addEventListener('note-created', (event) => {
                console.log('[MobileApp] note-created event received', event.detail.note);
                this.handleNoteCreated();
            });
            
            // Mark as initialized
            this.initialized = true;
            
            // Dispatch event indicating MobileApp is ready
            document.dispatchEvent(new CustomEvent('mobile-app-ready'));
            console.log('[MobileApp] Mobile app fully initialized and ready.');
        }
        
        /**
         * Add diagnostic event listeners to debug touch events
         */
        addDiagnosticListeners() {
            document.addEventListener('touchstart', (e) => {
                console.log('[MobileApp] Touch event detected:', e.target);
            }, { passive: true });
            
            // Listen for notes-loaded event to reattach listeners
            document.addEventListener('notes-loaded', () => {
                console.log('[MobileApp] Notes loaded, refreshing mobile UI');
                this.setupMobileTabBar();
                this.setupFloatingActions();
            });
        }
        
        /**
         * Set up mobile-specific UI adjustments
         */
        setupMobileUI() {
            // Add mobile class to body
            document.body.classList.add('mobile-view');
            
            // Set viewport meta tag to ensure proper scaling
            let viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
            } else {
                viewport = document.createElement('meta');
                viewport.setAttribute('name', 'viewport');
                viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
                document.head.appendChild(viewport);
            }
            
            // Adjust content area for mobile
            if (this.mainContent) {
                this.mainContent.style.paddingBottom = '60px'; // Space for tab bar
                this.mainContent.style.width = '100%';
                this.mainContent.style.maxWidth = '100vw';
                this.mainContent.style.boxSizing = 'border-box';
                this.mainContent.style.overflowX = 'hidden';
            }
            
            // Make the sidebar full-width when open
            if (this.sidebar) {
                this.sidebar.classList.add('mobile-sidebar');
                this.sidebar.style.width = '100%';
                this.sidebar.style.maxWidth = '100vw';
                this.sidebar.style.boxSizing = 'border-box';
            }
            
            // Fix editor width
            const noteEditor = document.querySelector('.note-editor');
            if (noteEditor) {
                noteEditor.style.width = '100%';
                noteEditor.style.maxWidth = '100vw';
                noteEditor.style.boxSizing = 'border-box';
                noteEditor.style.padding = '10px';
            }
            
            // Find and fix any content that might be causing overflow
            this.fixHorizontalOverflow();
        }
        
        /**
         * Fix any elements that might be causing horizontal overflow
         */
        fixHorizontalOverflow() {
            // Fix any elements with fixed widths
            const containers = document.querySelectorAll('.container, .row, .col, [class^="col-"]');
            containers.forEach(container => {
                container.style.maxWidth = '100%';
                container.style.boxSizing = 'border-box';
                container.style.paddingLeft = '10px';
                container.style.paddingRight = '10px';
            });
            
            // Fix wide images and media
            const media = document.querySelectorAll('img, video, iframe, embed, object');
            media.forEach(item => {
                item.style.maxWidth = '100%';
                item.style.height = 'auto';
            });
            
            // Fix tables
            const tables = document.querySelectorAll('table');
            tables.forEach(table => {
                const wrapper = document.createElement('div');
                wrapper.style.width = '100%';
                wrapper.style.overflowX = 'auto';
                wrapper.style.webkitOverflowScrolling = 'touch';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            });
            
            // Fix note items
            const noteItems = document.querySelectorAll('.note-item');
            noteItems.forEach(item => {
                item.style.width = 'auto';
                item.style.maxWidth = '100%';
                item.style.boxSizing = 'border-box';
                item.style.wordWrap = 'break-word';
            });
            
            // Fix note content
            const noteContent = document.querySelector('.note-content');
            if (noteContent) {
                noteContent.style.width = '100%';
                noteContent.style.maxWidth = '100%';
                noteContent.style.boxSizing = 'border-box';
            }
            
            // Fix title input
            const titleInput = document.getElementById('noteTitleInput');
            if (titleInput) {
                titleInput.style.width = '100%';
                titleInput.style.maxWidth = '100%';
                titleInput.style.boxSizing = 'border-box';
            }
            
            console.log('[MobileApp] Applied overflow fixes to prevent horizontal scrolling');
        }
        
        /**
         * Set up the sidebar toggle button
         */
        setupSidebarToggle() {
            if (this.sidebarToggle && this.sidebar) {
                // Clone to remove existing event listeners
                const newToggle = this.sidebarToggle.cloneNode(true);
                this.sidebarToggle.parentNode.replaceChild(newToggle, this.sidebarToggle);
                
                newToggle.addEventListener('click', () => {
                    this.sidebar.classList.toggle('collapsed');
                });
            }
        }
        
        /**
         * Set up the mobile tab bar at the bottom
         */
        setupMobileTabBar() {
            console.log('[MobileApp] Setting up mobile tab bar');
            const tabBar = document.querySelector('.mobile-tab-bar');
            if (!tabBar) {
                console.log('[MobileApp] Mobile tab bar not found, creating it');
                this.createMobileTabBar();
                return;
            }
            
            // Add handlers using direct assignment instead of cloning
            this.setupTabHandler('allNotesTab', this.showAllNotes.bind(this));
            this.setupTabHandler('foldersTab', this.showFolders.bind(this));
            // Call core NotesApp createNewNote directly
            this.setupTabHandler('newNoteTab', () => {
                if (window.notesApp && typeof window.notesApp.createNewNote === 'function') {
                    console.log('[MobileApp] Triggering core notesApp.createNewNote()');
                    window.notesApp.createNewNote();
                } else {
                    console.error('[MobileApp] notesApp.createNewNote not found!');
                    alert('Error: Could not create new note.');
                }
            });
            this.setupTabHandler('searchTab', this.showSearch.bind(this));
            
            // Set initial active tab
            this.setActiveTab('allNotesTab');
            console.log('[MobileApp] Mobile tab bar setup complete');
        }
        
        /**
         * Set up handler for a specific tab
         */
        setupTabHandler(tabId, handler) {
            const tab = document.getElementById(tabId);
            if (tab) {
                // Remove existing event listeners by cloning
                const newTab = tab.cloneNode(true);
                tab.parentNode.replaceChild(newTab, tab);
                
                // Use multiple event types for better mobile compatibility
                ['click', 'touchend'].forEach(eventType => {
                    newTab.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`[MobileApp] Tab ${tabId} activated via ${eventType}`);
                        this.setActiveTab(tabId);
                        handler();
                    }, { passive: false });
                });
                console.log(`[MobileApp] Handlers attached to ${tabId}`);
            } else {
                console.warn(`[MobileApp] Tab ${tabId} not found`);
            }
        }
        
        /**
         * Create the mobile tab bar if it doesn't exist
         */
        createMobileTabBar() {
            const tabBar = document.createElement('div');
            tabBar.className = 'mobile-tab-bar';
            tabBar.innerHTML = `
                <button class="tab-btn" id="allNotesTab">
                    <i class="fas fa-sticky-note"></i>
                    <span>All Notes</span>
                </button>
                <button class="tab-btn" id="foldersTab">
                    <i class="fas fa-folder"></i>
                    <span>Folders</span>
                </button>
                <button class="tab-btn" id="newNoteTab">
                    <i class="fas fa-plus-circle"></i>
                    <span>New</span>
                </button>
                <button class="tab-btn" id="searchTab">
                    <i class="fas fa-search"></i>
                    <span>Search</span>
                </button>
            `;
            
            document.body.appendChild(tabBar);
            this.setupMobileTabBar();
        }
        
        /**
         * Set the active tab in the mobile tab bar
         * @param {string} tabId - The ID of the tab to set as active
         */
        setActiveTab(tabId) {
            const tabs = document.querySelectorAll('.mobile-tab-bar .tab-btn');
            tabs.forEach(tab => {
                if (tab.id === tabId) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        }
        
        /**
         * Set up floating action buttons
         */
        setupFloatingActions() {
            // Find or create floating actions container
            let floatingActions = document.querySelector('.mobile-floating-actions');
            if (!floatingActions) {
                console.log('[MobileApp] Creating floating actions container');
                floatingActions = document.createElement('div');
                floatingActions.className = 'mobile-floating-actions';
                floatingActions.style.position = 'fixed';
                floatingActions.style.right = '16px';
                floatingActions.style.bottom = '80px';
                floatingActions.style.zIndex = '1500';
                floatingActions.style.display = 'flex';
                floatingActions.style.flexDirection = 'column';
                floatingActions.style.gap = '10px';
                floatingActions.style.maxWidth = '60px';
                
                floatingActions.innerHTML = `
                    <button class="floating-action-btn share-btn" id="mobileShareBtn" style="width:50px;height:50px;border-radius:50%;background-color:#1976d2;color:white;border:none;box-shadow:0 3px 5px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="floating-action-btn tag-btn" id="mobileTagBtn" style="width:50px;height:50px;border-radius:50%;background-color:#1976d2;color:white;border:none;box-shadow:0 3px 5px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;">
                        <i class="fas fa-tags"></i>
                    </button>
                `;
                document.body.appendChild(floatingActions);
            } else {
                // Update existing floating actions container with inline styles
                floatingActions.style.position = 'fixed';
                floatingActions.style.right = '16px';
                floatingActions.style.bottom = '80px';
                floatingActions.style.zIndex = '1500';
                floatingActions.style.display = 'flex';
                floatingActions.style.flexDirection = 'column';
                floatingActions.style.gap = '10px';
                floatingActions.style.maxWidth = '60px';
                
                // Update button styles if they exist
                const buttons = floatingActions.querySelectorAll('.floating-action-btn');
                buttons.forEach(btn => {
                    btn.style.width = '50px';
                    btn.style.height = '50px';
                    btn.style.borderRadius = '50%';
                    btn.style.backgroundColor = '#1976d2';
                    btn.style.color = 'white';
                    btn.style.border = 'none';
                    btn.style.boxShadow = '0 3px 5px rgba(0,0,0,0.2)';
                    btn.style.display = 'flex';
                    btn.style.alignItems = 'center';
                    btn.style.justifyContent = 'center';
                    btn.style.fontSize = '18px';
                    btn.style.cursor = 'pointer';
                });
            }
            
            // Set up share button
            const shareBtn = document.getElementById('mobileShareBtn');
            if (shareBtn) {
                // Clone to remove existing event listeners
                const newShareBtn = shareBtn.cloneNode(true);
                shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
                
                newShareBtn.addEventListener('click', () => {
                    if (window.toolbar) {
                        window.toolbar.showShareModal();
                    } else if (window.notesApp && window.notesApp.openShareModal) {
                        window.notesApp.openShareModal();
                    }
                });
            }
            
            // Set up tag button
            const tagBtn = document.getElementById('mobileTagBtn');
            if (tagBtn) {
                // Clone to remove existing event listeners
                const newTagBtn = tagBtn.cloneNode(true);
                tagBtn.parentNode.replaceChild(newTagBtn, tagBtn);
                
                newTagBtn.addEventListener('click', () => {
                    if (window.toolbar) {
                        window.toolbar.showTagModal();
                    } else if (window.notesApp && window.notesApp.openTagModal) {
                        window.notesApp.openTagModal();
                    }
                });
            }
        }
        
        /**
         * Show all notes view
         */
        showAllNotes() {
            console.log('[MobileApp] Showing all notes view');
            if (this.sidebar) {
                this.sidebar.classList.remove('collapsed');
            }
            
            if (this.noteEditor) {
                this.noteEditor.style.display = 'none';
            }
            
            if (this.sidebarTitle) {
                this.sidebarTitle.textContent = 'All Notes';
            }
            
            // Make sure notes list and folders list are displayed in sidebar
            const notesList = document.getElementById('notesList');
            const foldersList = document.getElementById('foldersList');
            if (notesList) notesList.style.display = 'block';
            if (foldersList) foldersList.style.display = 'block';
            
            // Deselect any active folder
            document.querySelectorAll('.folder-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Highlight "All Notes" link if it exists
            const allNotesLink = document.querySelector('.all-notes-link');
            if (allNotesLink) {
                allNotesLink.classList.add('selected');
            }
            
            // Call the core NotesApp method to render the list
            try {
                if (window.notesApp && typeof window.notesApp.renderNotesList === 'function') {
                    console.log('[MobileApp] Calling notesApp.renderNotesList() to show all notes.');
                    window.notesApp.renderNotesList();
                } else if (window.notesApp && typeof window.notesApp.showAllNotes === 'function') {
                    // Fallback to showAllNotes if renderNotesList isn't available
                    console.log('[MobileApp] Calling notesApp.showAllNotes() as fallback.');
                    window.notesApp.showAllNotes();
                } else {
                    console.error('[MobileApp] Could not find a method in NotesApp to display all notes.');
                    // Optionally, provide a user message or fallback UI update
                }
            } catch (error) {
                console.error('[MobileApp] Error calling NotesApp method in showAllNotes:', error);
            }
        }
        
        /**
         * Show folders view
         */
        showFolders() {
            console.log('[MobileApp] Showing folders view');
            if (this.sidebar) {
                this.sidebar.classList.remove('collapsed');
            }
            
            if (this.noteEditor) {
                this.noteEditor.style.display = 'none';
            }
            
            if (this.sidebarTitle) {
                this.sidebarTitle.textContent = 'Folders';
            }
            
            // Show folders list prominently
            const notesList = document.querySelector('.notes-list');
            const foldersList = document.querySelector('.folders-list');
            
            if (notesList) notesList.style.display = 'none';
            if (foldersList) {
                foldersList.style.display = 'block';
                foldersList.style.maxHeight = 'none';
            }
            
            // Reveal create folder button if it exists
            const createFolderBtn = document.querySelector('.new-folder-btn');
            if (createFolderBtn) {
                createFolderBtn.style.display = 'flex';
            }
            
            // Try to use folderManager methods if available
            if (window.folderManager && typeof window.folderManager.renderFolders === 'function') {
                window.folderManager.renderFolders();
            }
        }
        
        /**
         * Show search view
         */
        showSearch() {
            console.log('[MobileApp] Showing search view');
            if (this.sidebar) {
                this.sidebar.classList.remove('collapsed');
            }
            
            if (this.sidebarTitle) {
                this.sidebarTitle.textContent = 'Search';
            }
            
            // Focus search input
            const searchInput = document.querySelector('.search-bar input');
            if (searchInput) {
                searchInput.focus();
            } else {
                console.warn('[MobileApp] Search input not found');
            }
        }
        
        /**
         * Open a note by ID
         * @param {string} noteId - The ID of the note to open
         */
        openNote(noteId) {
            console.log(`[MobileApp] Opening note: ${noteId}`);
            if (window.notesApp) {
                const note = window.notesApp.notes.find(n => n.id.toString() === noteId.toString());
                if (note) {
                    // Try multiple possible methods
                    if (typeof window.notesApp.selectNote === 'function') {
                        window.notesApp.selectNote(note);
                    } else if (typeof window.notesApp.loadNote === 'function') {
                        window.notesApp.loadNote(note.id);
                    } else {
                        console.warn('[MobileApp] Note open method not found');
                        
                        // Fallback: update UI manually
                        window.notesApp.currentNote = note;
                        
                        const titleInput = document.getElementById('noteTitleInput');
                        const editor = document.querySelector('.note-content');
                        
                        if (titleInput) titleInput.value = note.title;
                        if (editor) editor.innerHTML = note.content;
                    }
                    
                    // Show editor
                    if (this.noteEditor) {
                        this.noteEditor.style.display = 'flex';
                    }
                    
                    // Hide sidebar
                    if (this.sidebar) {
                        this.sidebar.classList.add('collapsed');
                    }
                    
                    console.log(`[MobileApp] Note ${noteId} opened successfully`);
                } else {
                    console.error(`[MobileApp] Note ${noteId} not found`);
                }
            } else {
                console.error('[MobileApp] notesApp not found');
            }
        }
        
        /**
         * Helper function to handle UI changes after a new note is created by the core app.
         */
        handleNoteCreated() {
            console.log('[MobileApp] Handling UI updates for new note.');
            // Show the editor view
            if (this.noteEditor) {
                this.noteEditor.style.display = 'flex';
            }
            
            // Hide the sidebar (common mobile pattern)
            if (this.sidebar) {
                this.sidebar.classList.add('collapsed');
            }
            
            // Optionally focus the title input
            const titleInput = document.getElementById('noteTitleInput');
            if (titleInput) {
                // Delay focus slightly to ensure elements are visible
                setTimeout(() => titleInput.focus(), 100);
            }
        }
    }

    // Make the class available globally to avoid redefinition errors
    window.MobileApp = MobileApp;
    
    // Trigger initialization when the bridge is ready
    document.addEventListener('mobile-bridge-ready', () => {
        if (!window.mobileApp) {
            console.log('[MobileApp Init Trigger] Creating MobileApp instance now that bridge is ready.');
            new MobileApp();
        } else {
            console.log('[MobileApp Init Trigger] MobileApp instance already exists.');
        }
    });
} else {
    console.warn('[MobileApp] Attempted to redefine MobileApp. Using existing instance.');
} 