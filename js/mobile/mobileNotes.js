/**
 * Mobile Notes Handler
 * Handles note-specific functionality on mobile devices
 */

class MobileNotes {
    constructor() {
        console.log('[MobileNotes] Initializing mobile notes handler');

        // Initialize note handling
        this.setupNotesList();
        this.fixNoteDateDisplay();
        this.setupNoteDelete();

        // Make instance globally available
        window.mobileNotes = this;

        console.log('[MobileNotes] Mobile notes handler initialized');
    }

    /**
     * Set up notes list click handling and selection
     */
    setupNotesList() {
        const notesList = document.querySelector('.notes-list');
        if (!notesList) {
            console.error('[MobileNotes] Notes list not found');
            return;
        }

        console.log('[MobileNotes] Setting up mobile notes list');

        // Clone to remove existing event listeners
        const newNotesList = notesList.cloneNode(true);
        notesList.parentNode.replaceChild(newNotesList, notesList);

        // Add click event handling using event delegation
        newNotesList.addEventListener('click', (e) => {
            // Find the closest note item to the clicked element
            const noteItem = e.target.closest('.note-item');
            if (!noteItem) return;

            // Skip if clicking on a button or interactive element inside note
            if (
                e.target.tagName === 'BUTTON' ||
                e.target.closest('button') ||
                e.target.closest('.note-actions') ||
                e.target.classList.contains('tag') ||
                e.target.closest('.tag')
            ) {
                return;
            }

            const noteId = noteItem.dataset.id;
            if (!noteId) return;

            console.log(`[MobileNotes] Note clicked: ${noteId}`);

            // Remove selected class from all notes
            document.querySelectorAll('.note-item').forEach(item => {
                item.classList.remove('selected');
            });

            // Add selected class to this note
            noteItem.classList.add('selected');

            // Open the note using the mobile app
            if (window.mobileApp) {
                window.mobileApp.openNote(noteId);
            } else {
                console.warn('[MobileNotes] Mobile app not available for opening note');

                // Fallback to direct opening
                if (window.notesApp) {
                    const note = window.notesApp.notes.find(n => n.id.toString() === noteId.toString());
                    if (note) {
                        window.notesApp.selectNote(note);

                        // Show editor and collapse sidebar
                        const noteEditor = document.querySelector('.note-editor');
                        const sidebar = document.querySelector('.sidebar');

                        if (noteEditor) noteEditor.style.display = 'flex';
                        if (sidebar) sidebar.classList.add('collapsed');
                    }
                }
            }
        });
    }

    /**
     * Fix date display on note preview cards
     */
    fixNoteDateDisplay() {
        console.log('[MobileNotes] Fixing date display on notes');

        // Override the renderNotesList function to add mobile-specific formatting
        if (window.notesApp && window.notesApp.renderNotesList) {
            // Store original function
            const originalRenderNotesList = window.notesApp.renderNotesList;

            // Override with our version that adds better date formatting and ensures menu triggers
            window.notesApp.renderNotesList = function(filteredNotes) {
                // Call original function first
                originalRenderNotesList.call(window.notesApp, filteredNotes);

                // Now enhance the notes with mobile-specific features
                document.querySelectorAll('.note-item').forEach(noteItem => {
                    // Enhance date display
                    const dateEl = noteItem.querySelector('.note-date');
                    if (dateEl) {
                        // Add mobile-specific class
                        dateEl.classList.add('mobile-note-date');

                        // Get the date text
                        const dateText = dateEl.textContent;

                        // If it's a full date format, convert to relative time for mobile
                        if (dateText.includes(',')) {
                            try {
                                const date = new Date(dateText);
                                if (!isNaN(date.getTime())) {
                                    dateEl.textContent = MobileNotes.getRelativeTimeString(date);
                                }
                            } catch (e) {
                                console.warn('[MobileNotes] Error formatting date:', e);
                            }
                        }
                    }

                    // Ensure note has a menu trigger
                    if (!noteItem.querySelector('.note-menu-trigger')) {
                        // Create a content wrapper if it doesn't exist
                        if (!noteItem.querySelector('.note-content-wrapper')) {
                            // Move all content into a wrapper
                            const wrapper = document.createElement('div');
                            wrapper.className = 'note-content-wrapper';

                            // Move all children except actions into the wrapper
                            while (noteItem.firstChild) {
                                if (!noteItem.firstChild.classList || !noteItem.firstChild.classList.contains('note-actions')) {
                                    wrapper.appendChild(noteItem.firstChild);
                                } else {
                                    noteItem.removeChild(noteItem.firstChild);
                                }
                            }

                            noteItem.appendChild(wrapper);
                        }

                        // Add menu trigger
                        const actionsDiv = document.createElement('div');
                        actionsDiv.className = 'note-actions';
                        actionsDiv.innerHTML = '<i class="fas fa-ellipsis-v note-menu-trigger" title="Note Options"></i>';
                        noteItem.appendChild(actionsDiv);

                        // Add click handler for the menu trigger
                        const menuTrigger = actionsDiv.querySelector('.note-menu-trigger');
                        if (menuTrigger && window.notesApp && typeof window.notesApp.showNoteContextMenu === 'function') {
                            menuTrigger.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const noteId = noteItem.dataset.id;
                                if (!noteId) return;

                                // Position context menu near the trigger icon
                                const rect = menuTrigger.getBoundingClientRect();
                                window.notesApp.showNoteContextMenu(rect.right, rect.bottom + window.scrollY, noteId);
                            });
                        }
                    }
                });
            };

            // Trigger a re-render if there are notes
            if (window.notesApp.notes && window.notesApp.notes.length > 0) {
                window.notesApp.renderNotesList();
            }
        }
    }

    /**
     * Set up note deletion functionality
     */
    setupNoteDelete() {
        console.log('[MobileNotes] Setting up mobile note deletion');

        // Add swipe-to-delete functionality
        this.setupSwipeToDelete();

        // Add long-press context menu
        this.setupLongPressMenu();

        // Fix delete button
        this.fixDeleteButton();
    }

    /**
     * Set up swipe-to-delete functionality
     */
    setupSwipeToDelete() {
        const notesList = document.querySelector('.notes-list');
        if (!notesList) return;

        // Initialize touch tracking variables
        let touchStartX = 0;
        let touchEndX = 0;
        let currentSwipedNote = null;

        // Add touch event listeners
        notesList.addEventListener('touchstart', (e) => {
            const noteItem = e.target.closest('.note-item');
            if (!noteItem) return;

            touchStartX = e.touches[0].clientX;

            // Reset any previously swiped notes
            if (currentSwipedNote && currentSwipedNote !== noteItem) {
                currentSwipedNote.style.transform = 'translateX(0)';
                currentSwipedNote.classList.remove('swiping');
            }

            currentSwipedNote = noteItem;
            noteItem.classList.add('swiping');
        });

        notesList.addEventListener('touchmove', (e) => {
            if (!currentSwipedNote) return;

            touchEndX = e.touches[0].clientX;
            const swipeDistance = touchEndX - touchStartX;

            // Only allow left swipe (negative distance)
            if (swipeDistance < 0) {
                // Limit the swipe distance to prevent excessive movement
                const maxSwipe = -120;
                const limitedSwipe = Math.max(swipeDistance, maxSwipe);

                // Apply the transform
                currentSwipedNote.style.transform = `translateX(${limitedSwipe}px)`;
            } else {
                // For right swipe, reset the position
                currentSwipedNote.style.transform = 'translateX(0)';
            }
        });

        notesList.addEventListener('touchend', (e) => {
            if (!currentSwipedNote) return;

            // Calculate the swipe distance
            const swipeDistance = touchEndX - touchStartX;

            // If the swipe is sufficient to trigger delete
            if (swipeDistance < -100) {
                // Get the note ID
                const noteId = currentSwipedNote.dataset.id;
                if (noteId) {
                    // Show delete confirmation
                    this.confirmDeleteNote(noteId);
                }
            }

            // Reset the transform
            currentSwipedNote.style.transform = 'translateX(0)';
            currentSwipedNote.classList.remove('swiping');
            currentSwipedNote = null;
        });
    }

    /**
     * Set up long-press context menu for notes
     */
    setupLongPressMenu() {
        const notesList = document.querySelector('.notes-list');
        if (!notesList) return;

        // Long-press duration in milliseconds
        const longPressDuration = 500;
        let longPressTimer;
        let longPressedNote = null;

        // Use the main context menu from notesApp instead of creating a separate one
        // This ensures consistency between desktop and mobile

        // Add event listeners for long press detection
        notesList.addEventListener('touchstart', (e) => {
            const noteItem = e.target.closest('.note-item');
            if (!noteItem) return;

            // Skip interactive elements
            if (
                e.target.tagName === 'BUTTON' ||
                e.target.closest('button') ||
                e.target.closest('.note-actions') ||
                e.target.classList.contains('tag') ||
                e.target.closest('.tag')
            ) {
                return;
            }

            longPressedNote = noteItem;

            // Start timer for long press
            longPressTimer = setTimeout(() => {
                const noteId = noteItem.dataset.id;
                if (!noteId) return;

                // Select the note
                if (window.notesApp) {
                    const note = window.notesApp.notes.find(n => n.id.toString() === noteId.toString());
                    if (note) {
                        window.notesApp.selectNote(note);
                    }
                }

                // Use the main NotesApp context menu if available
                if (window.notesApp && typeof window.notesApp.showNoteContextMenu === 'function') {
                    // Create a fake event object for positioning
                    const rect = noteItem.getBoundingClientRect();
                    const fakeEvent = {
                        pageX: rect.left + window.scrollX,
                        pageY: rect.bottom + window.scrollY
                    };

                    // Show the context menu
                    window.notesApp.showNoteContextMenu(fakeEvent.pageX, fakeEvent.pageY, noteId);
                }

                // Add a vibration feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, longPressDuration);
        });

        // Clear timer if touch ends or moves too much
        notesList.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
            longPressedNote = null;
        });

        notesList.addEventListener('touchmove', (e) => {
            // If moved more than 10px, cancel long press
            if (e.touches[0].clientY - e.touches[0].clientY > 10) {
                clearTimeout(longPressTimer);
                longPressedNote = null;
            }
        });
    }

    /**
     * Fix delete button in the note editor
     */
    fixDeleteButton() {
        const deleteNoteBtn = document.getElementById('deleteNoteBtn');
        if (!deleteNoteBtn) return;

        // Clone to remove existing event listeners
        const newDeleteBtn = deleteNoteBtn.cloneNode(true);
        deleteNoteBtn.parentNode.replaceChild(newDeleteBtn, deleteNoteBtn);

        // Add new click handler
        newDeleteBtn.addEventListener('click', () => {
            if (window.notesApp && window.notesApp.currentNote) {
                this.confirmDeleteNote(window.notesApp.currentNote.id);
            }
        });
    }

    /**
     * Show a confirmation dialog for deleting a note
     * @param {string} noteId - The ID of the note to delete
     */
    confirmDeleteNote(noteId) {
        if (!noteId || !window.notesApp) return;

        const note = window.notesApp.notes.find(n => n.id.toString() === noteId.toString());
        if (!note) return;

        // Create a mobile-friendly confirmation dialog
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'mobile-confirm-dialog';
        confirmDialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <i class="fas fa-trash"></i>
                    <h3>Delete Note</h3>
                </div>
                <div class="dialog-body">
                    <p>Are you sure you want to delete this note?</p>
                    <p class="note-title">"${note.title || 'Untitled Note'}"</p>
                </div>
                <div class="dialog-footer">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);

        // Add event listeners
        confirmDialog.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(confirmDialog);
        });

        confirmDialog.querySelector('.confirm-btn').addEventListener('click', () => {
            // Delete the note
            this.deleteNote(noteId);
            document.body.removeChild(confirmDialog);
        });

        // Close on background click
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                document.body.removeChild(confirmDialog);
            }
        });
    }

    /**
     * Delete a note
     * @param {string} noteId - The ID of the note to delete
     */
    deleteNote(noteId) {
        if (!noteId || !window.notesApp) return;

        // Find the note in the notes array
        const noteIndex = window.notesApp.notes.findIndex(n => n.id.toString() === noteId.toString());
        if (noteIndex === -1) return;

        console.log(`[MobileNotes] Deleting note: ${noteId}`);

        // Get the note before deleting it
        const deletedNote = window.notesApp.notes[noteIndex];

        // Remove the note from the array
        window.notesApp.notes.splice(noteIndex, 1);

        // Save the updated notes
        window.notesApp.saveNotes();

        // Clear the editor if the deleted note was the current one
        if (window.notesApp.currentNote && window.notesApp.currentNote.id.toString() === noteId.toString()) {
            if (window.notesApp.clearEditor) {
                window.notesApp.clearEditor();
            } else {
                // Fallback clear
                const noteContent = document.querySelector('.note-content');
                const noteTitleInput = document.getElementById('noteTitleInput');
                if (noteContent) noteContent.innerHTML = '';
                if (noteTitleInput) noteTitleInput.value = '';
            }

            window.notesApp.currentNote = null;
        }

        // Update UI
        window.notesApp.renderNotesList();

        // Update folder counts
        if (window.folderManager) {
            window.folderManager.renderFolders();
        }

        // Show confirmation
        this.showToast(`Note "${deletedNote.title || 'Untitled Note'}" deleted`);
    }

    /**
     * Show a folder selection menu for moving a note
     * @param {string} noteId - The ID of the note to move
     */
    showMoveToFolderMenu(noteId) {
        if (!noteId || !window.notesApp || !window.folderManager) return;

        const note = window.notesApp.notes.find(n => n.id.toString() === noteId.toString());
        if (!note) return;

        // Create folder selection dialog
        const folderDialog = document.createElement('div');
        folderDialog.className = 'mobile-folder-dialog';

        // Build folder list HTML
        let foldersHtml = `
            <div class="folder-item" data-folder-id="null">
                <i class="fas fa-sticky-note"></i>
                Root (No Folder)
            </div>
        `;

        // Add each folder
        window.folderManager.folders.forEach(folder => {
            const isSelected = note.folderId && note.folderId.toString() === folder.id.toString();
            foldersHtml += `
                <div class="folder-item ${isSelected ? 'selected' : ''}" data-folder-id="${folder.id}">
                    <i class="fas fa-folder" style="color: ${window.folderManager.getFolderColor(folder.id)}"></i>
                    ${folder.name}
                </div>
            `;
        });

        folderDialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>Move Note to Folder</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="dialog-body">
                    <p>Select a destination folder:</p>
                    <div class="folders-list">
                        ${foldersHtml}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(folderDialog);

        // Add event listeners
        folderDialog.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(folderDialog);
        });

        // Handle folder selection
        folderDialog.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => {
                const folderId = item.dataset.folderId;
                // Handle "null" string specially
                const parsedFolderId = folderId === "null" ? null : parseInt(folderId);

                // Move the note
                if (window.folderManager.moveNoteToFolder) {
                    window.folderManager.moveNoteToFolder(noteId, parsedFolderId);
                } else {
                    // Fallback move implementation
                    note.folderId = parsedFolderId;
                    window.notesApp.saveNotes();
                    window.notesApp.renderNotesList();

                    // Show toast
                    let folderName = "Unknown Folder";
                    if (parsedFolderId !== null) {
                        const folder = window.folderManager.folders.find(f => f.id === parsedFolderId);
                        folderName = folder ? folder.name : "Unknown Folder";
                    } else {
                        folderName = "Root Folder";
                    }
                    this.showToast(`Note moved to ${folderName}`);
                }

                document.body.removeChild(folderDialog);
            });
        });

        // Close on background click
        folderDialog.addEventListener('click', (e) => {
            if (e.target === folderDialog) {
                document.body.removeChild(folderDialog);
            }
        });
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (success, error, etc)
     */
    showToast(message, type = 'success') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `mobile-toast ${type}`;
        toast.textContent = message;

        // Add to document
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    /**
     * Get a human-readable relative time string
     * @param {Date} date - The date to convert
     * @returns {string} - A relative time string (e.g., "2 hours ago")
     */
    static getRelativeTimeString(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffMonths = Math.floor(diffDays / 30);

        if (diffSeconds < 60) {
            return 'just now';
        } else if (diffMinutes < 60) {
            return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
        } else if (diffHours < 24) {
            return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        } else if (diffDays < 30) {
            return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
        } else {
            return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
        }
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MobileNotes();
});