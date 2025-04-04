/**
 * Mobile App functionality for NotePad
 * Handles mobile-specific interactions and UI
 */

class MobileApp {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.initElements();
        this.attachEventListeners();
        this.checkUrlParams();
        this.initMobileFeatures();
    }

    initElements() {
        // Mobile tab bar elements
        this.allNotesTab = document.getElementById('allNotesTab');
        this.foldersTab = document.getElementById('foldersTab');
        this.newNoteTab = document.getElementById('newNoteTab');
        this.searchTab = document.getElementById('searchTab');
        this.tabBar = document.querySelector('.mobile-tab-bar');
        
        // Main app elements
        this.sidebar = document.getElementById('sidebar');
        this.mainContent = document.querySelector('.main-content');
        this.noteEditor = document.querySelector('.note-editor');
        this.searchInput = document.getElementById('searchInput');
        this.sidebarHeader = document.querySelector('.sidebar-header');
        this.sidebarTitle = document.getElementById('sidebarTitle');
        this.notesList = document.getElementById('notesList');
        
        // Set initial state
        if (this.isMobile) {
            this.sidebar.classList.add('collapsed');
            this.allNotesTab.classList.add('active');
            this.fixHeaderDisplay();
        }
    }

    attachEventListeners() {
        // Mobile tab bar navigation
        this.allNotesTab.addEventListener('click', () => this.showAllNotes());
        this.foldersTab.addEventListener('click', () => this.showFolders());
        this.newNoteTab.addEventListener('click', () => this.createNewNote());
        this.searchTab.addEventListener('click', () => this.activateSearch());
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
        window.addEventListener('resize', () => this.handleResize());
        
        // Fix iOS input focus issues
        if (this.isIOS()) {
            this.fixIOSInputs();
        }
        
        // Detect touch events to optimize UI
        this.detectTouchCapability();
        
        // Handle keyboard appearance/disappearance
        this.handleKeyboardVisibility();
        
        // Fix header display on DOM ready
        document.addEventListener('DOMContentLoaded', () => this.fixHeaderDisplay());
        
        // Handle note clicks to open in editor on mobile
        this.attachNoteClickHandler();
    }
    
    attachNoteClickHandler() {
        // This method adds a click handler to the notes list
        if (this.notesList) {
            this.notesList.addEventListener('click', (e) => {
                // Only process if we're on mobile
                if (!this.isMobile) return;
                
                // Find the closest note-item parent element
                const noteItem = e.target.closest('.note-item');
                if (!noteItem) return;
                
                // Do not handle delete button clicks here
                if (e.target.classList.contains('delete-note')) return;
                
                // Get the note ID
                const noteId = noteItem.dataset.id;
                if (!noteId) return;
                
                // Open the selected note in editor view
                this.openNoteInEditor(noteId);
            });
        }
    }
    
    openNoteInEditor(noteId) {
        // Set the active tab to New Note since we're opening the editor
        this.setActiveTab(this.newNoteTab);
        
        // Show the editor, hide the sidebar
        this.sidebar.classList.add('collapsed');
        this.noteEditor.style.display = 'flex';
        this.mainContent.style.zIndex = '10';
        this.sidebar.style.zIndex = '5';
        
        // If notesApp has a selectNote function, use it to load the note
        if (window.notesApp && typeof window.notesApp.selectNote === 'function') {
            window.notesApp.selectNote(noteId);
        } else if (window.noteOperations && typeof window.noteOperations.selectNote === 'function') {
            window.noteOperations.selectNote(noteId);
        } else {
            // Fallback if the selectNote function isn't available
            console.warn('selectNote function not found');
            // Try to find the note and show it
            this.findAndShowNote(noteId);
        }
    }
    
    findAndShowNote(noteId) {
        // Fallback method to find and display a note if the main app doesn't expose selectNote
        if (window.notesApp && window.notesApp.notes) {
            const note = window.notesApp.notes.find(n => n.id.toString() === noteId.toString());
            if (note && window.notesApp.noteTitle && window.notesApp.noteContent) {
                window.notesApp.currentNote = note;
                window.notesApp.noteTitle.value = note.title || '';
                window.notesApp.noteContent.innerHTML = note.content || '';
                if (typeof window.notesApp.updateSaveButton === 'function') {
                    window.notesApp.updateSaveButton();
                }
            }
        }
    }
    
    checkUrlParams() {
        // Check URL parameters for direct actions
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action) {
            switch(action) {
                case 'new':
                    setTimeout(() => this.createNewNote(), 300);
                    break;
                case 'all':
                    setTimeout(() => this.showAllNotes(), 300);
                    break;
                case 'folders':
                    setTimeout(() => this.showFolders(), 300);
                    break;
                case 'search':
                    setTimeout(() => this.activateSearch(), 300);
                    break;
            }
        }
    }
    
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    
    fixIOSInputs() {
        document.querySelectorAll('input, [contenteditable]').forEach(element => {
            element.addEventListener('focus', () => {
                // Scroll to input when focused to ensure it's not hidden by keyboard
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    }
    
    detectTouchCapability() {
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isTouchDevice) {
            document.body.classList.add('touch-device');
        }
    }
    
    handleKeyboardVisibility() {
        // Use visualViewport API if available (modern browsers)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                const keyboardOpen = window.visualViewport.height < window.innerHeight;
                if (keyboardOpen) {
                    this.tabBar.style.display = 'none';
                } else {
                    this.tabBar.style.display = 'flex';
                }
            });
        } else {
            // Fallback for older browsers
            const originalHeight = window.innerHeight;
            window.addEventListener('resize', () => {
                const keyboardOpen = window.innerHeight < originalHeight;
                if (keyboardOpen) {
                    this.tabBar.style.display = 'none';
                } else {
                    this.tabBar.style.display = 'flex';
                }
            });
        }
    }
    
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        // Toggle mobile mode
        if (this.isMobile !== wasMobile) {
            if (this.isMobile) {
                this.activateMobileMode();
            } else {
                this.deactivateMobileMode();
            }
        }
        
        // Always fix the header display on resize
        this.fixHeaderDisplay();
    }
    
    fixHeaderDisplay() {
        if (!this.sidebarHeader) return;
        
        // Ensure sidebar header has the correct height and title is visible
        if (this.isMobile) {
            // Make sure we have enough height and padding
            this.sidebarHeader.style.minHeight = '70px';
            this.sidebarHeader.style.padding = '20px 15px 15px';
            
            // Ensure the title text is visible
            if (this.sidebarTitle) {
                this.sidebarTitle.style.fontSize = '22px';
                this.sidebarTitle.style.lineHeight = '1.2';
                this.sidebarTitle.style.display = 'block';
                this.sidebarTitle.style.maxWidth = '70%';
                this.sidebarTitle.style.textOverflow = 'ellipsis';
                this.sidebarTitle.style.overflow = 'hidden';
                this.sidebarTitle.style.whiteSpace = 'nowrap';
            }
            
            // Make sure the header is at the top of the sidebar
            this.sidebarHeader.style.position = 'sticky';
            this.sidebarHeader.style.top = '0';
            this.sidebarHeader.style.zIndex = '11';
            this.sidebarHeader.style.backgroundColor = '#f9f9f9';
            this.sidebarHeader.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.05)';
        }
    }
    
    handleOrientationChange() {
        // Adjust layout for orientation change
        setTimeout(() => {
            if (window.innerWidth > window.innerHeight) {
                // Landscape
                document.body.classList.add('landscape');
                document.body.classList.remove('portrait');
            } else {
                // Portrait
                document.body.classList.add('portrait');
                document.body.classList.remove('landscape');
            }
            
            // Fix header display after orientation change
            this.fixHeaderDisplay();
        }, 300);
    }
    
    activateMobileMode() {
        this.sidebar.classList.add('collapsed');
        this.allNotesTab.classList.add('active');
        document.body.classList.add('mobile-mode');
        this.fixHeaderDisplay();
    }
    
    deactivateMobileMode() {
        this.sidebar.classList.remove('collapsed');
        document.body.classList.remove('mobile-mode');
    }
    
    setActiveTab(tab) {
        // Remove active class from all tabs
        this.allNotesTab.classList.remove('active');
        this.foldersTab.classList.remove('active');
        this.newNoteTab.classList.remove('active');
        this.searchTab.classList.remove('active');
        
        // Add active class to the selected tab
        tab.classList.add('active');
    }
    
    showAllNotes() {
        this.setActiveTab(this.allNotesTab);
        this.sidebar.classList.remove('collapsed');
        
        // Update the sidebar title
        if (this.sidebarTitle) {
            this.sidebarTitle.textContent = "Notes";
        }
        
        // Fix header display before showing notes
        this.fixHeaderDisplay();
        
        // Use the existing notesApp function if available
        if (window.notesApp && typeof window.notesApp.showAllNotes === 'function') {
            window.notesApp.showAllNotes();
        }
        
        // On mobile, we want to show only the sidebar
        if (this.isMobile) {
            this.noteEditor.style.display = 'none';
            this.mainContent.style.zIndex = '5';
            this.sidebar.style.zIndex = '10';
        }
    }
    
    showFolders() {
        this.setActiveTab(this.foldersTab);
        this.sidebar.classList.remove('collapsed');
        
        // Update the sidebar title
        if (this.sidebarTitle) {
            this.sidebarTitle.textContent = "Folders";
        }
        
        // Fix header display before showing folders
        this.fixHeaderDisplay();
        
        // Focus on folders section
        const foldersSection = document.querySelector('.folders-section');
        if (foldersSection) {
            foldersSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // On mobile, we want to show only the sidebar
        if (this.isMobile) {
            this.noteEditor.style.display = 'none';
            this.mainContent.style.zIndex = '5';
            this.sidebar.style.zIndex = '10';
        }
    }
    
    createNewNote() {
        this.setActiveTab(this.newNoteTab);
        
        // Update the sidebar title back to notes if we return
        if (this.sidebarTitle) {
            this.sidebarTitle.textContent = "Notes";
        }
        
        // Use the existing notesApp function if available
        if (window.notesApp && typeof window.notesApp.createNewNote === 'function') {
            window.notesApp.createNewNote();
        }
        
        // On mobile, collapse sidebar and show editor
        if (this.isMobile) {
            this.sidebar.classList.add('collapsed');
            this.noteEditor.style.display = 'flex';
            this.mainContent.style.zIndex = '10';
            this.sidebar.style.zIndex = '5';
            
            // Focus on title input
            setTimeout(() => {
                const titleInput = document.getElementById('noteTitleInput');
                if (titleInput) {
                    titleInput.focus();
                }
            }, 300);
        }
    }
    
    activateSearch() {
        this.setActiveTab(this.searchTab);
        this.sidebar.classList.remove('collapsed');
        
        // Update the sidebar title
        if (this.sidebarTitle) {
            this.sidebarTitle.textContent = "Search";
        }
        
        // Fix header display before showing search
        this.fixHeaderDisplay();
        
        // Focus on search input
        if (this.searchInput) {
            // Add event listener for search if not already added
            if (!this.searchInput.hasAttribute('data-search-listener')) {
                this.searchInput.setAttribute('data-search-listener', 'true');
                
                this.searchInput.addEventListener('input', () => {
                    // Use NotesApp's search functionality if available
                    if (window.notesApp && typeof window.notesApp.searchNotes === 'function') {
                        window.notesApp.searchNotes(this.searchInput.value);
                    } else {
                        console.warn('NotesApp searchNotes function not found');
                    }
                });
            }
            
            // Clear previous search and set focus
            this.searchInput.value = '';
            if (window.notesApp) {
                window.notesApp.renderNotesList();
            }
            
            setTimeout(() => {
                this.searchInput.focus();
            }, 300);
        }
        
        // On mobile, we want to show only the sidebar
        if (this.isMobile) {
            this.noteEditor.style.display = 'none';
            this.mainContent.style.zIndex = '5';
            this.sidebar.style.zIndex = '10';
        }
    }
    
    /**
     * Add floating action buttons for share and tag on mobile view
     */
    addMobileFloatingActions() {
        if (!this.isMobile) return;
        
        // Remove any existing floating actions
        const existingActions = document.querySelector('.mobile-floating-actions');
        if (existingActions) {
            existingActions.remove();
        }
        
        // Create floating action container
        const floatingActions = document.createElement('div');
        floatingActions.className = 'mobile-floating-actions';
        
        // Create share button
        const shareBtn = document.createElement('button');
        shareBtn.className = 'floating-action-btn share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
        shareBtn.title = 'Share Note';
        
        // Create tag button
        const tagBtn = document.createElement('button');
        tagBtn.className = 'floating-action-btn tag-btn';
        tagBtn.innerHTML = '<i class="fas fa-tags"></i>';
        tagBtn.title = 'Manage Tags';
        
        // Add event listeners
        shareBtn.addEventListener('click', () => {
            if (window.notesApp && window.notesApp.currentNote) {
                window.notesApp.openShareModal();
            } else {
                alert('Please select a note to share');
            }
        });
        
        tagBtn.addEventListener('click', () => {
            if (window.notesApp && window.notesApp.currentNote) {
                window.notesApp.openTagModal();
            } else {
                alert('Please select a note to tag');
            }
        });
        
        // Add buttons to container
        floatingActions.appendChild(shareBtn);
        floatingActions.appendChild(tagBtn);
        
        // Add container to document
        document.body.appendChild(floatingActions);
        
        // Only show when a note is being edited
        this.updateFloatingActionsVisibility();
    }
    
    /**
     * Update visibility of floating action buttons
     */
    updateFloatingActionsVisibility() {
        const floatingActions = document.querySelector('.mobile-floating-actions');
        if (!floatingActions || !this.isMobile) return;
        
        // Only show when a note is being edited and sidebar is collapsed
        if (window.notesApp && window.notesApp.currentNote && this.sidebar.classList.contains('collapsed')) {
            floatingActions.style.display = 'flex';
        } else {
            floatingActions.style.display = 'none';
        }
    }
    
    /**
     * Initialize mobile-specific features
     */
    initMobileFeatures() {
        if (!this.isMobile) return;
        
        // Add floating action buttons
        this.addMobileFloatingActions();
        
        // Update floating actions when sidebar state changes
        const observer = new MutationObserver(() => {
            this.updateFloatingActionsVisibility();
        });
        
        observer.observe(this.sidebar, { attributes: true });
        
        // Also update when a new note is selected
        document.addEventListener('note-selected', () => {
            this.updateFloatingActionsVisibility();
        });
    }
}

// Initialize mobile app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileApp = new MobileApp();
}); 