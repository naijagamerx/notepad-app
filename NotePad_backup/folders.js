class FolderManager {
    constructor() {
        this.folders = [];
        this.currentFolder = null;
        this.initializeElements();
        this.attachEventListeners();
        this.loadFolders();
    }

    initializeElements() {
        this.foldersList = document.getElementById('foldersList');
        this.newFolderBtn = document.getElementById('newFolderBtn');
        this.folderModal = document.getElementById('folderModal');
        this.folderNameInput = document.getElementById('folderName');
        this.createFolderBtn = document.getElementById('createFolderBtn');
        this.cancelFolderBtn = document.getElementById('cancelFolderBtn');
        this.closeModalBtn = document.querySelector('.close-btn');
        this.folderContextMenu = document.getElementById('folderContextMenu');
    }

    attachEventListeners() {
        // Folder creation - Using mousedown instead of click
        this.newFolderBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showFolderModal();
        });

        // Create folder button
        this.createFolderBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.createNewFolder();
        });

        // Cancel button
        this.cancelFolderBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideFolderModal();
        });

        // Close button
        this.closeModalBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideFolderModal();
        });

        // Handle Enter key in input
        this.folderNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                this.createNewFolder();
            }
        });

        // Close modal when clicking outside
        this.folderModal.addEventListener('mousedown', (e) => {
            if (e.target === this.folderModal) {
                e.preventDefault();
                e.stopPropagation();
                this.hideFolderModal();
            }
        });

        // Prevent modal from closing when clicking inside modal-content
        this.folderModal.querySelector('.modal-content').addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        // Context menu
        document.addEventListener('click', () => this.folderContextMenu.style.display = 'none');
        
        this.foldersList.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.folder-item')) {
                e.preventDefault();
                const folderItem = e.target.closest('.folder-item');
                this.showContextMenu(e.pageX, e.pageY, folderItem.dataset.folderId);
            }
        });

        // Drag and drop
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

    showFolderModal() {
        this.folderModal.style.display = 'block';
        this.folderNameInput.value = '';
        setTimeout(() => {
            this.folderNameInput.focus();
        }, 100);
        document.body.classList.add('modal-open');
    }

    hideFolderModal() {
        this.folderModal.style.display = 'none';
        this.folderNameInput.value = '';
        document.body.classList.remove('modal-open');
    }

    createNewFolder() {
        const folderName = this.folderNameInput.value.trim();
        if (!folderName) return;

        const folder = {
            id: Date.now(),
            name: folderName,
            notes: [],
            created: new Date().toISOString()
        };

        this.folders.push(folder);
        this.saveFolders();
        this.renderFolders();
        this.hideFolderModal();

        // Show success notification using the existing notification system
        if (window.fileOperations) {
            window.fileOperations.showNotification('Folder created successfully!', 'success');
        }
    }

    moveNoteToFolder(noteId, folderId) {
        if (window.notesApp) {
            const note = window.notesApp.notes.find(n => n.id.toString() === noteId);
            if (note) {
                note.folderId = parseInt(folderId);
                window.notesApp.saveNotes();
                window.notesApp.renderNotesList();
                this.renderFolders();
            }
        }
    }

    deleteFolder(folderId) {
        if (!confirm('Are you sure you want to delete this folder and all its notes?')) return;

        // Move notes to uncategorized
        if (window.notesApp) {
            window.notesApp.notes.forEach(note => {
                if (note.folderId === parseInt(folderId)) {
                    note.folderId = null;
                }
            });
            window.notesApp.saveNotes();
            window.notesApp.renderNotesList();
        }

        this.folders = this.folders.filter(f => f.id !== parseInt(folderId));
        this.saveFolders();
        this.renderFolders();
    }

    renameFolder(folderId) {
        const folder = this.folders.find(f => f.id === parseInt(folderId));
        if (!folder) return;

        this.folderNameInput.value = folder.name;
        this.showFolderModal();
        
        const originalCreateHandler = this.createFolderBtn.onclick;
        this.createFolderBtn.onclick = () => {
            const newName = this.folderNameInput.value.trim();
            if (newName) {
                folder.name = newName;
                this.saveFolders();
                this.renderFolders();
                this.hideFolderModal();
            }
            this.createFolderBtn.onclick = originalCreateHandler;
        };
    }

    showContextMenu(x, y, folderId) {
        this.folderContextMenu.innerHTML = `
            <div class="menu-item" onclick="folderManager.renameFolder('${folderId}')">
                <i class="fas fa-edit"></i> Rename
            </div>
            <div class="menu-item" onclick="folderManager.deleteFolder('${folderId}')">
                <i class="fas fa-trash"></i> Delete
            </div>
            <div class="menu-item" onclick="folderManager.exportFolder('${folderId}')">
                <i class="fas fa-file-export"></i> Export
            </div>
        `;

        this.folderContextMenu.style.display = 'block';
        this.folderContextMenu.style.left = x + 'px';
        this.folderContextMenu.style.top = y + 'px';
    }

    exportFolder(folderId) {
        const folder = this.folders.find(f => f.id === parseInt(folderId));
        if (!folder) return;

        const notes = window.notesApp ? 
            window.notesApp.notes.filter(n => n.folderId === folder.id) : [];

        const exportData = {
            folder: folder,
            notes: notes
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folder.name}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    renderFolders() {
        this.foldersList.innerHTML = '';
        
        // Add All Notes link
        this.addAllNotesLink();
        
        this.folders.forEach(folder => {
            const noteCount = window.notesApp ? 
                window.notesApp.notes.filter(n => n.folderId === folder.id).length : 0;

            const folderElement = document.createElement('div');
            folderElement.className = 'folder-item';
            folderElement.dataset.folderId = folder.id;
            folderElement.draggable = true;
            folderElement.innerHTML = `
                <i class="fas fa-folder"></i>
                <span>${folder.name}</span>
                <span class="note-count">${noteCount}</span>
            `;
            
            folderElement.addEventListener('click', () => this.selectFolder(folder.id));
            this.foldersList.appendChild(folderElement);
        });

        this.updateAllNotesCount();
    }

    selectFolder(folderId) {
        const folder = this.folders.find(f => f.id === parseInt(folderId));
        if (!folder) return;

        this.currentFolder = folder;
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.folderId === folderId.toString()) {
                item.classList.add('selected');
            }
        });

        if (window.notesApp) {
            window.notesApp.filterNotesByFolder(folder.id);
        }
    }

    saveFolders() {
        localStorage.setItem('folders', JSON.stringify(this.folders));
    }

    loadFolders() {
        const savedFolders = localStorage.getItem('folders');
        this.folders = savedFolders ? JSON.parse(savedFolders) : [];
        this.renderFolders();
    }

    addAllNotesLink() {
        const allNotesLink = document.createElement('div');
        allNotesLink.className = 'folder-item all-notes-link';
        allNotesLink.innerHTML = `
            <i class="fas fa-notes-medical"></i>
            <span>All Notes</span>
            <span class="note-count"></span>
        `;
        
        if (this.foldersList.firstChild) {
            this.foldersList.insertBefore(allNotesLink, this.foldersList.firstChild);
        } else {
            this.foldersList.appendChild(allNotesLink);
        }

        allNotesLink.addEventListener('click', () => {
            document.querySelectorAll('.folder-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            allNotesLink.classList.add('selected');
            
            if (window.notesApp) {
                window.notesApp.showAllNotes();
            }
        });

        this.updateAllNotesCount();
    }

    updateAllNotesCount() {
        const allNotesLink = document.querySelector('.all-notes-link');
        if (allNotesLink && window.notesApp) {
            const totalNotes = window.notesApp.notes.length;
            const noteCount = allNotesLink.querySelector('.note-count');
            if (noteCount) {
                noteCount.textContent = totalNotes;
            }
        }
    }
}

// Initialize folder manager
document.addEventListener('DOMContentLoaded', () => {
    window.folderManager = new FolderManager();
});
