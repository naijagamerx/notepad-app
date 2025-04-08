/**
 * Mobile Bridge Module
 * Coordinates between the core NotesApp and mobile components
 * Ensures proper initialization order and method availability
 */

// Prevent duplicate declaration
if (typeof window.MobileBridge === 'undefined') {
    class MobileBridge {
        constructor() {
            console.log('[MobileBridge] Initializing bridge');
            
            // Store a singleton instance
            if (window.mobileBridge) {
                console.log('[MobileBridge] Instance already exists, returning existing instance');
                return window.mobileBridge;
            }
            
            // Track ready state
            this.coreReady = false;
            this.mobileReady = false;
            this.bridgeInitialized = false;
            this.coreCheckRetries = 0;
            this.maxCoreCheckRetries = 5; // Retry 5 times (approx 1.5 seconds)
            this.coreCheckInterval = 300; // Check every 300ms
            
            // Make bridge globally available
            window.mobileBridge = this;
            this.setupEventListeners();
            this.ensureCoreApp(); // Start checking for core app
        }
        
        /**
         * Set up event listeners for core and mobile readiness.
         */
        setupEventListeners() {
            document.addEventListener('notesapp-ready', () => {
                console.log('[MobileBridge] NotesApp ready event received');
                this.coreReady = true;
                this.checkAndInitializeBridge();
            });
            
            document.addEventListener('mobile-scripts-loaded', () => {
                console.log('[MobileBridge] Mobile scripts loaded event received');
                this.mobileReady = true;
                this.checkAndInitializeBridge();
            });
        }
        
        /**
         * Check if core NotesApp is available with retry mechanism.
         */
        ensureCoreApp() {
            if (window.notesApp) {
                console.log('[MobileBridge] NotesApp found.');
                this.coreReady = true;
                // Dispatch event in case detection missed it initially
                if (!this.coreEventDispatched) {
                    document.dispatchEvent(new CustomEvent('notesapp-ready'));
                    this.coreEventDispatched = true;
                }
                this.checkAndInitializeBridge();
            } else if (this.coreCheckRetries < this.maxCoreCheckRetries) {
                this.coreCheckRetries++;
                console.log(`[MobileBridge] NotesApp not found, retrying (${this.coreCheckRetries}/${this.maxCoreCheckRetries})...`);
                setTimeout(() => this.ensureCoreApp(), this.coreCheckInterval);
            } else {
                console.error(`[MobileBridge] Core app (NotesApp) failed to initialize after ${this.maxCoreCheckRetries} retries.`);
                this.handleInitializationError('Core app failed to load.');
            }
        }
        
        /**
         * Check if both core and mobile components are ready, then initialize the bridge.
         */
        checkAndInitializeBridge() {
            if (this.bridgeInitialized) return;
            
            if (this.coreReady && this.mobileReady) {
                console.log('[MobileBridge] Core and mobile ready. Initializing bridge...');
                this.bridgeInitialized = true;
                
                // Optional: Patch methods if necessary (though ideally core methods should exist)
                this.patchNotesAppMethodsIfNeeded(); 
                
                console.log('[MobileBridge] Bridge initialized successfully.');
                document.dispatchEvent(new CustomEvent('mobile-bridge-ready'));
                
            } else {
                console.log(`[MobileBridge] Waiting for components. Core: ${this.coreReady}, Mobile: ${this.mobileReady}`);
            }
        }
        
        /**
         * Optional: Patch critical NotesApp methods if they are missing.
         * This acts as a safeguard but shouldn't be the primary way methods are defined.
         */
        patchNotesAppMethodsIfNeeded() {
            if (!window.notesApp) {
                console.error('[MobileBridge] Cannot patch methods: NotesApp not found.');
                return;
            }
            
            // Example: Patch showAllNotes if it's missing
            if (typeof window.notesApp.showAllNotes !== 'function') {
                console.warn('[MobileBridge] Patching missing showAllNotes method on NotesApp.');
                window.notesApp.showAllNotes = function() {
                    console.log('[NotesApp Patch] showAllNotes called.');
                    if (typeof this.renderNotesList === 'function') {
                        this.renderNotesList(); // Render all notes
                    } 
                    // Update UI state (e.g., deselect folders)
                    document.querySelectorAll('.folder-item.selected').forEach(el => el.classList.remove('selected'));
                    const allNotesLink = document.querySelector('.all-notes-link'); // Assuming this exists
                    if (allNotesLink) allNotesLink.classList.add('selected');
                };
            }
            
            // Example: Patch createNewNote if it's missing (less ideal)
            if (typeof window.notesApp.createNewNote !== 'function') {
                console.warn('[MobileBridge] Patching missing createNewNote method on NotesApp.');
                window.notesApp.createNewNote = function() {
                    console.error('[NotesApp Patch] createNewNote called via patch. Core implementation preferred.');
                    // Basic fallback implementation - Avoid complex logic here
                    const newNote = { id: Date.now().toString(), title: 'Patched Note', content: '', createdAt: Date.now(), lastModified: Date.now(), folderId: null };
                    if (Array.isArray(this.notes)) this.notes.push(newNote);
                    if (typeof this.saveNotes === 'function') this.saveNotes();
                    if (typeof this.loadNote === 'function') this.loadNote(newNote.id);
                    if (typeof this.renderNotesList === 'function') this.renderNotesList();
                };
            }
            
            console.log('[MobileBridge] Method patching check complete.');
        }
        
        /**
         * Handle initialization errors gracefully.
         * @param {string} message - Error message to display.
         */
        handleInitializationError(message) {
            console.error('[MobileBridge] Initialization Error:', message);
            // Optionally display a message to the user
            // alert('Could not load all application components. Please refresh the page.');
        }
    }
    
    // Create instance immediately to begin coordination
    console.log('[MobileBridge] Creating instance');
    new MobileBridge();
} else {
    console.warn('[MobileBridge] Attempted to redefine MobileBridge. Using existing instance.');
} 