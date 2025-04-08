/**
 * Mobile Folders Handler
 * Handles folder-specific functionality on mobile devices
 */

class MobileFolders {
    constructor() {
        console.log('[MobileFolders] Initializing mobile folders handler');

        // Initialize folder handling
        this.setupFoldersList();
        this.improveFolderUI();
        this.fixFolderCreation();

        // Make instance globally available
        window.mobileFolders = this;

        console.log('[MobileFolders] Mobile folders handler initialized');
    }

    /**
     * Set up folders list click handling
     */
    setupFoldersList() {
        const foldersList = document.getElementById('foldersList');
        if (!foldersList) {
            console.error('[MobileFolders] Folders list not found');
            return;
        }

        console.log('[MobileFolders] Setting up mobile folders list');

        // Clone to remove existing event listeners
        const newFoldersList = foldersList.cloneNode(true);
        foldersList.parentNode.replaceChild(newFoldersList, foldersList);

        // Add click event handling for folders
        newFoldersList.addEventListener('click', (e) => {
            const folderItem = e.target.closest('.folder-item');
            if (!folderItem) return;

            // Skip if clicking on a button or action element
            if (
                e.target.tagName === 'BUTTON' ||
                e.target.closest('button') ||
                e.target.closest('.folder-actions')
            ) {
                return;
            }

            // Handle "All Notes" special case
            if (folderItem.classList.contains('all-notes-link')) {
                console.log('[MobileFolders] All Notes folder clicked');
                this.showAllNotes();
                return;
            }

            const folderId = folderItem.dataset.folderId;
            if (!folderId) return;

            console.log(`[MobileFolders] Folder clicked: ${folderId}`);

            // Select the folder
            this.selectFolder(folderId);
        });

        // Add long-press for folder options
        this.setupFolderLongPress(newFoldersList);
    }

    /**
     * Set up long-press functionality for folders
     * @param {HTMLElement} foldersList - The folders list element
     */
    setupFolderLongPress(foldersList) {
        // Long-press duration in milliseconds
        const longPressDuration = 500;
        let longPressTimer;
        let longPressedFolder = null;

        // Use the main folder context menu instead of creating a separate one
        let folderContextMenu = document.getElementById('folderContextMenu');
        if (!folderContextMenu) {
            console.error('[MobileFolders] Main folder context menu not found, creating mobile-specific one');
            folderContextMenu = document.createElement('div');
            folderContextMenu.id = 'mobileFolderContextMenu';
            folderContextMenu.className = 'context-menu mobile-context-menu';
            folderContextMenu.innerHTML = `
                <div class="menu-item" data-action="rename"><i class="fas fa-edit"></i> Rename</div>
                <div class="menu-item" data-action="delete"><i class="fas fa-trash"></i> Delete</div>
                <div class="menu-item" data-action="export"><i class="fas fa-file-export"></i> Export</div>
            `;
            document.body.appendChild(folderContextMenu);
        } else {
            // Add mobile-specific class to the main context menu
            folderContextMenu.classList.add('mobile-context-menu');
        }

        // Hide menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#mobileFolderContextMenu')) {
                folderContextMenu.style.display = 'none';
            }
        });

        // Handle menu item clicks
        folderContextMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            const action = menuItem ? menuItem.dataset.action : null;
            if (!action || !longPressedFolder) return;

            const folderId = longPressedFolder.dataset.folderId;
            if (!folderId) return;

            switch (action) {
                case 'rename':
                    if (window.folderManager && window.folderManager.renameFolder) {
                        window.folderManager.renameFolder(folderId);
                    }
                    break;
                case 'delete':
                    if (window.folderManager && window.folderManager.deleteFolder) {
                        window.folderManager.deleteFolder(folderId);
                    }
                    break;
                case 'export':
                    if (window.folderManager && window.folderManager.exportFolder) {
                        window.folderManager.exportFolder(folderId);
                    }
                    break;
            }

            folderContextMenu.style.display = 'none';
        });

        // Add touch event listeners for long press detection
        let startY = null; // Declare startY outside touchmove

        foldersList.addEventListener('touchstart', (e) => {
            const folderItem = e.target.closest('.folder-item');
            if (!folderItem || folderItem.classList.contains('all-notes-link')) return;

            // Skip interactive elements
            if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.folder-actions')) {
                return;
            }

            if (e.touches && e.touches.length > 0) {
                startY = e.touches[0].clientY; // Record start Y on touchstart
            }

            longPressedFolder = folderItem;

            // Start timer for long press
            longPressTimer = setTimeout(() => {
                const folderId = folderItem.dataset.folderId;
                if (!folderId) return;

                // Position and show context menu
                const rect = folderItem.getBoundingClientRect();

                // Create a fake event object for the showContextMenu method
                const fakeEvent = {
                    preventDefault: () => {},
                    pageX: rect.left + window.scrollX,
                    pageY: rect.bottom + window.scrollY
                };

                // Use the main FolderManager's showContextMenu method if available
                if (window.folderManager && typeof window.folderManager.showContextMenu === 'function') {
                    window.folderManager.showContextMenu(fakeEvent, folderId);
                } else {
                    // Fallback to direct manipulation
                    folderContextMenu.style.top = `${rect.bottom + window.scrollY}px`;
                    folderContextMenu.style.left = `${rect.left + window.scrollX}px`;
                    folderContextMenu.style.display = 'block';
                }

                // Add a vibration feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, longPressDuration);
        });

        // Clear timer if touch ends or moves too much
        foldersList.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
            longPressedFolder = null;
            startY = null; // Reset startY on touchend
        });

        foldersList.addEventListener('touchmove', (e) => {
            if (!longPressedFolder || !startY) return; // Check if tracking long press

            if (e.touches && e.touches.length > 0) {
                 const currentY = e.touches[0].clientY;
                 if (Math.abs(currentY - startY) > 10) { // Check displacement
                     clearTimeout(longPressTimer);
                     longPressedFolder = null;
                     startY = null; // Reset startY
                 }
            }
        });
    }

    /**
     * Improve folder UI for mobile
     */
    improveFolderUI() {
        console.log('[MobileFolders] Improving folder UI for mobile');

        // Add mobile-specific classes
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.add('mobile-folder-item');
        });

        // Remove thick border on selected folders (as requested)
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .folder-item.selected {
                    border-left: none !important;
                    padding-left: 15px !important;
                    background-color: #e3f2fd;
                }
            }
        `;
        document.head.appendChild(style);

        // Override the renderFolders method to apply mobile styles
        if (window.folderManager && window.folderManager.renderFolders) {
            const originalRenderFolders = window.folderManager.renderFolders;

            window.folderManager.renderFolders = function() {
                // Call original function
                originalRenderFolders.call(window.folderManager);

                // Add mobile classes to new elements
                document.querySelectorAll('.folder-item:not(.mobile-folder-item)').forEach(item => {
                    item.classList.add('mobile-folder-item');
                });
            };
        }
    }

    /**
     * Fix folder creation for mobile
     */
    fixFolderCreation() {
        // Fix new folder button
        const newFolderBtn = document.getElementById('newFolderBtn');
        if (newFolderBtn) {
            newFolderBtn.classList.add('mobile-new-folder-btn');

            // Keep only the icon for consistency
            newFolderBtn.innerHTML = `<i class="fas fa-folder-plus"></i>`;

            // Ensure the click event works properly
            newFolderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[MobileFolders] New folder button clicked');

                // Use folderManager to show the modal
                if (window.folderManager && typeof window.folderManager.showFolderModal === 'function') {
                    window.folderManager.showFolderModal();
                } else {
                    // Fallback - show modal directly
                    const folderModal = document.getElementById('folderModal');
                    if (folderModal) {
                        folderModal.style.display = 'block';

                        // Focus on input
                        const folderNameInput = document.getElementById('folderName');
                        if (folderNameInput) {
                            setTimeout(() => folderNameInput.focus(), 100);
                        }
                    }
                }
            });
        }

        // Fix folder modal elements
        const folderNameInput = document.getElementById('folderName');
        if (folderNameInput) {
            folderNameInput.classList.add('mobile-input');
        }

        const createFolderBtn = document.getElementById('createFolderBtn');
        if (createFolderBtn) {
            createFolderBtn.classList.add('mobile-btn');

            // Ensure create button works
            createFolderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[MobileFolders] Create folder button clicked');

                if (window.folderManager && typeof window.folderManager.createFolder === 'function') {
                    window.folderManager.createFolder();
                }
            });
        }

        const cancelFolderBtn = document.getElementById('cancelFolderBtn');
        if (cancelFolderBtn) {
            cancelFolderBtn.classList.add('mobile-btn');
        }
    }

    /**
     * Show all notes (no folder filter)
     */
    showAllNotes() {
        // Update tab bar if available
        if (window.mobileApp) {
            window.mobileApp.setActiveTab('allNotesTab');
            window.mobileApp.showAllNotes();
        } else {
            // Direct implementation
            document.querySelectorAll('.folder-item').forEach(item => {
                item.classList.remove('selected');
            });

            const allNotesItem = document.querySelector('.all-notes-link');
            if (allNotesItem) {
                allNotesItem.classList.add('selected');
            }

            // Use available method to show all notes
            if (window.folderManager && window.folderManager.showAllNotes) {
                window.folderManager.showAllNotes();
            } else if (window.notesApp && window.notesApp.showAllNotes) {
                window.notesApp.showAllNotes();
            }
        }
    }

    /**
     * Select a folder and filter notes
     * @param {string} folderId - ID of the folder to select
     */
    selectFolder(folderId) {
        // Update UI to show selected folder
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('selected');
        });

        const folderItem = document.querySelector(`.folder-item[data-folder-id="${folderId}"]`);
        if (folderItem) {
            folderItem.classList.add('selected');
        }

        // Use available method to filter notes
        if (window.folderManager && window.folderManager.selectFolder) {
            window.folderManager.selectFolder(folderId);
        } else if (window.notesApp && window.notesApp.filterNotesByFolder) {
            window.notesApp.filterNotesByFolder(folderId);
        }

        // Update tab bar if available
        if (window.mobileApp) {
            window.mobileApp.setActiveTab('foldersTab');
        }
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MobileFolders();
});