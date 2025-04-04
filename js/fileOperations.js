/**
 * @fileoverview File operations including upload functionality
 */

class FileOperations {
    constructor() {
        this.setupFileUpload();
        this.supportedFileTypes = [
            'text/plain',                  // .txt files
            'text/markdown',               // .md files
            'application/msword',          // .doc files
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx files
            ''  // For files where type might not be detected
        ];
        
        // Map of file extensions to MIME types
        this.fileExtensions = {
            'txt': 'text/plain',
            'md': 'text/markdown',
            'markdown': 'text/markdown',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
    }

    setupFileUpload() {
        const fileInput = document.getElementById('uploadInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadTextBtn = document.getElementById('uploadTextBtn');

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => fileInput.click());
        }

        if (uploadTextBtn) {
            uploadTextBtn.addEventListener('click', () => fileInput.click());
        }

        // Handle file selection
        fileInput.addEventListener('change', async (event) => {
            try {
                const file = event.target.files[0];
                if (!file) return;

                // Check file extension
                const fileExtension = file.name.split('.').pop().toLowerCase();
                if (!this.isFileTypeSupported(file, fileExtension)) {
                    throw new Error('Unsupported file type. Please upload .txt, .md, .markdown, .doc, or .docx files.');
                }

                const content = await this.readFileContent(file);
                
                // Preview the file content in the editor
                this.previewFileContent(file.name, content);
                
                // Reset file input
                fileInput.value = '';
                
                // Show success notification
                this.showNotification('File loaded successfully! Click Save to keep the note.', 'success');
            } catch (error) {
                console.error('File upload error:', error);
                this.showNotification(error.message, 'error');
            }
        });
    }

    isFileTypeSupported(file, extension) {
        // Check both MIME type and extension
        return this.supportedFileTypes.includes(file.type) || 
               Object.keys(this.fileExtensions).includes(extension);
    }

    previewFileContent(fileName, content) {
        // Get editor elements
        const titleInput = document.getElementById('noteTitleInput');
        const noteContent = document.querySelector('.note-content');
        const saveButton = document.getElementById('saveNoteBtn');
        
        // Get title from first line or filename
        let title = '';
        let mainContent = content;
        
        // Check if content has a first line that could be title
        const contentLines = content.split('\n');
        if (contentLines[0] && contentLines[0].trim()) {
            // Use first line if it looks like a title (short and not too long)
            if (contentLines[0].length < 100) {
                title = contentLines[0].trim().replace(/^#\s*/, ''); // Remove markdown # if present
                mainContent = contentLines.slice(1).join('\n').trim(); // Rest of content
            }
        }
        
        // If no title found in content, use filename
        if (!title) {
            title = fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
        }
        
        // Update the editor
        if (titleInput) {
            titleInput.value = title;
        }
        
        if (noteContent) {
            noteContent.innerHTML = ''; // Clear existing content
            
            // Format the main content with proper line breaks
            const formattedContent = mainContent
                .replace(/\n/g, '<br>')
                .replace(/\r/g, '');
            
            // Add content without additional title
            noteContent.innerHTML = formattedContent;
        }

        // Auto-save the note
        this.autoSaveUploadedNote(title, noteContent.innerHTML);

        // Update save button to show saved state
        if (saveButton) {
            saveButton.classList.remove('unsaved-changes');
            saveButton.innerHTML = '<i class="fas fa-check"></i> Saved';
            
            // Reset button state after 2 seconds
            setTimeout(() => {
                saveButton.innerHTML = '<i class="fas fa-save"></i> Save';
            }, 2000);
        }

        // Focus the editor
        if (noteContent) {
            noteContent.focus();
        }
    }

    autoSaveUploadedNote(title, content) {
        // Create a new note object
        const note = {
            id: Date.now(),
            title: title,
            content: content,
            lastModified: new Date().toISOString()
        };

        // Get current notes from storage
        let notes = JSON.parse(localStorage.getItem('notes') || '[]');
        
        // Add the new note (insert at beginning so it appears first in the list)
        notes.unshift(note);
        
        // Save back to storage
        localStorage.setItem('notes', JSON.stringify(notes));

        // Show success notification
        this.showNotification('Note automatically saved!', 'success');

        // Update UI if NotesApp is available
        if (window.notesApp) {
            // Store the note ID before loading notes
            const noteId = note.id;
            
            // Load updated notes
            window.notesApp.loadNotes(noteId);
        }
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Error reading file'));
            
            reader.readAsText(file);
        });
    }

    createNoteFromFile(fileName, content) {
        // Remove file extension from title
        const title = fileName.replace(/\.[^/.]+$/, "");
        
        // Get the currently selected folder or default to root
        const selectedFolder = document.querySelector('.folder.selected') || document.querySelector('.folder');
        const folderId = selectedFolder ? selectedFolder.dataset.folderId : 'root';

        // Create new note
        const noteId = 'note_' + Date.now();
        const note = {
            id: noteId,
            title: title,
            content: content,
            folderId: folderId,
            lastModified: new Date().toISOString()
        };

        // Save note to storage
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));

        // Trigger note list refresh if the function exists
        if (typeof updateNotesList === 'function') {
            updateNotesList();
        }

        // Select the new note if the function exists
        if (typeof selectNote === 'function') {
            selectNote(noteId);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Create icon based on notification type
        const icon = document.createElement('i');
        icon.className = type === 'success' 
            ? 'fas fa-check-circle' 
            : type === 'error' 
                ? 'fas fa-exclamation-circle' 
                : 'fas fa-info-circle';
        
        // Create message element
        const messageElement = document.createElement('span');
        messageElement.textContent = message;
        
        // Append icon and message to notification
        notification.appendChild(icon);
        notification.appendChild(messageElement);

        // Apply styles
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '12px',
            backgroundColor: type === 'success' ? '#E8F5E9' : '#FFEBEE',
            color: type === 'success' ? '#2E7D32' : '#C62828',
            zIndex: '9999',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '400px',
            border: `1px solid ${type === 'success' ? '#A5D6A7' : '#FFCDD2'}`,
            opacity: '0',
            transform: 'translateY(20px)',
            backdropFilter: 'blur(8px)',
            webkitBackdropFilter: 'blur(8px)'
        });

        // Style the icon
        Object.assign(icon.style, {
            fontSize: '20px',
            flexShrink: '0'
        });

        // Add to document
        document.body.appendChild(notification);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Initialize file operations
document.addEventListener('DOMContentLoaded', () => {
    window.fileOperations = new FileOperations();
});
