/**
 * @fileoverview iOS Notes Web App - A modern note-taking application
 * @version 1.0.0
 * @author Your Name
 * @license MIT
 */

// Initialize namespace if not already done
window.notepadsly = window.notepadsly || {};

/**
 * Represents a single note in the application
 * @class
 */
class Note {
    /**
     * Creates a new Note instance
     * @param {string} title - The title of the note
     * @param {string} content - The content of the note
     * @param {number} timestamp - Creation timestamp
     * @param {Array} tags - Tags associated with the note
     * @param {string} shareId - Unique ID for sharing the note
     */
    constructor(title = '', content = '', timestamp = new Date().getTime(), tags = [], shareId = null) {
        this.id = timestamp;
        this.title = title;
        this.content = content;
        this.lastModified = timestamp;
        this.tags = tags; // Array of tags for the note
        this.shareId = shareId; // Unique ID for sharing (null if not shared)
    }
}

/**
 * Main application class that handles all note operations
 * @class
 */
class NotesApp {
    constructor() {
        // Bind methods first
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
        
        // Then initialize elements and attach listeners
        this.initializeElements();
        this.attachEventListeners();
        this.currentNote = null;
        this.notes = [];
        this.loadNotes();
    }

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
    }

    attachEventListeners() {
        // Check if format handlers have been initialized
        if (window.notepadsly.isFormatHandlersInitialized) {
            console.log('Format handlers already initialized. Skipping format button setup...');
        } else {
            // Set the initialization flag
            window.notepadsly.isFormatHandlersInitialized = true;
            console.log('Initializing format handlers from script.js...');
            
            // Sidebar toggle
            this.sidebarToggle.addEventListener('click', () => {
                this.sidebar.classList.toggle('collapsed');
            });
    
            // Search functionality
            if (this.searchInput) {
                this.searchInput.addEventListener('input', () => {
                    this.searchNotes(this.searchInput.value);
                });
            }
    
            // Note content changes
            this.noteTitle.addEventListener('input', () => {
                if (this.currentNote) {
                    this.currentNote.title = this.noteTitle.value;
                    this.updateSaveButton();
                }
            });
    
            this.noteContent.addEventListener('input', () => {
                if (this.currentNote) {
                    this.currentNote.content = this.noteContent.innerHTML;
                    this.updateSaveButton();
                }
            });
    
            // New note button
            document.getElementById('newNoteBtn').addEventListener('click', () => {
                this.createNewNote();
            });
    
            // Add event listeners with bound methods directly
            if (this.boldBtn) this.boldBtn.addEventListener('click', () => this.formatText('bold'));
            if (this.italicBtn) this.italicBtn.addEventListener('click', () => this.formatText('italic'));
            if (this.underlineBtn) this.underlineBtn.addEventListener('click', () => this.formatText('underline'));
            if (this.strikeBtn) this.strikeBtn.addEventListener('click', () => this.formatText('strikeThrough'));
            if (this.headingBtn) this.headingBtn.addEventListener('click', this.insertHeading);
            if (this.quoteBtn) this.quoteBtn.addEventListener('click', this.insertQuote);
            if (this.codeBtn) this.codeBtn.addEventListener('click', this.insertCode);
            if (this.listBtn) this.listBtn.addEventListener('click', () => this.formatText('insertUnorderedList'));
            
            // PC-only formatting button listeners
            if (this.toolbarBoldBtn) this.toolbarBoldBtn.addEventListener('click', () => this.formatText('bold'));
            if (this.toolbarItalicBtn) this.toolbarItalicBtn.addEventListener('click', () => this.formatText('italic'));
            if (this.toolbarUnderlineBtn) this.toolbarUnderlineBtn.addEventListener('click', () => this.formatText('underline'));
            if (this.toolbarStrikeBtn) this.toolbarStrikeBtn.addEventListener('click', () => this.formatText('strikeThrough'));
            if (this.toolbarHeadingBtn) this.toolbarHeadingBtn.addEventListener('click', this.insertHeading);
            if (this.toolbarQuoteBtn) this.toolbarQuoteBtn.addEventListener('click', this.insertQuote);
            if (this.toolbarCodeBtn) this.toolbarCodeBtn.addEventListener('click', this.insertCode);
            if (this.toolbarListBtn) this.toolbarListBtn.addEventListener('click', () => this.formatText('insertUnorderedList'));
            if (this.toolbarAlignLeftBtn) this.toolbarAlignLeftBtn.addEventListener('click', this.alignLeft);
            if (this.toolbarAlignCenterBtn) this.toolbarAlignCenterBtn.addEventListener('click', this.alignCenter);
            if (this.toolbarAlignRightBtn) this.toolbarAlignRightBtn.addEventListener('click', this.alignRight);
            if (this.toolbarIndentBtn) this.toolbarIndentBtn.addEventListener('click', this.indent);
            if (this.toolbarOutdentBtn) this.toolbarOutdentBtn.addEventListener('click', this.outdent);
            if (this.toolbarLinkBtn) this.toolbarLinkBtn.addEventListener('click', this.insertLink);
            if (this.toolbarImageBtn) this.toolbarImageBtn.addEventListener('click', this.insertImage);
            if (this.toolbarHrBtn) this.toolbarHrBtn.addEventListener('click', this.insertHorizontalRule);
            
            // Add listener to track active formatting and show as active buttons
            if (this.noteContent) {
                this.noteContent.addEventListener('keyup', this.updateActiveButtons.bind(this));
                this.noteContent.addEventListener('mouseup', this.updateActiveButtons.bind(this));
            }
        }

        // These listeners should always be attached regardless of format handler initialization
        // Save and delete buttons
        if (this.saveNoteBtn) this.saveNoteBtn.addEventListener('click', () => this.saveCurrentNote());
        if (this.deleteNoteBtn) this.deleteNoteBtn.addEventListener('click', () => this.deleteCurrentNote());

        // File upload
        this.uploadBtn.addEventListener('click', () => this.uploadInput.click());

        // Note drag and drop
        this.notesList.addEventListener('dragstart', (e) => {
            if (e.target.matches('.note-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
            }
        });

        this.notesList.addEventListener('dragend', (e) => {
            if (e.target.matches('.note-item')) {
                e.target.classList.remove('dragging');
            }
        });

        // Note context menu
        this.notesList.addEventListener('contextmenu', (e) => {
            const noteItem = e.target.closest('.note-item');
            if (noteItem) {
                e.preventDefault();
                this.showNoteContextMenu(e.pageX, e.pageY, noteItem.dataset.id);
            }
        });

        // Share button
        if (this.shareNoteBtn) {
            this.shareNoteBtn.addEventListener('click', () => {
                if (this.currentNote) {
                    this.openShareModal();
                } else {
                    alert('Please select a note to share');
                }
            });
        }
        
        // Tag button
        if (this.tagNoteBtn) {
            this.tagNoteBtn.addEventListener('click', () => {
                if (this.currentNote) {
                    this.openTagModal();
                } else {
                    alert('Please select a note to tag');
                }
            });
        }
        
        // Close buttons for modals
        const closeButtons = document.querySelectorAll('.close-btn, #closeShareBtn, #cancelTagsBtn');
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Copy share link button
        if (this.copyShareLinkBtn) {
            this.copyShareLinkBtn.addEventListener('click', () => {
                this.copyShareLink();
            });
        }
        
        // Email share button
        if (this.emailShareBtn) {
            this.emailShareBtn.addEventListener('click', () => {
                this.shareViaEmail();
            });
        }
        
        // WhatsApp share button
        if (this.whatsappShareBtn) {
            this.whatsappShareBtn.addEventListener('click', () => {
                this.shareViaWhatsApp();
            });
        }
        
        // Twitter share button
        if (this.twitterShareBtn) {
            this.twitterShareBtn.addEventListener('click', () => {
                this.shareViaTwitter();
            });
        }
        
        // Add tag button
        if (this.addTagBtn) {
            this.addTagBtn.addEventListener('click', () => {
                this.addNewTag();
            });
        }
        
        // New tag input enter key
        if (this.newTagInput) {
            this.newTagInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addNewTag();
                }
            });
        }
        
        // Save tags button
        if (this.saveTagsBtn) {
            this.saveTagsBtn.addEventListener('click', () => {
                this.saveTagsToNote();
            });
        }
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    updateSaveButton() {
        if (this.currentNote && this.currentNote.id) {
            this.saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Update';
            this.saveNoteBtn.classList.add('update');
        } else {
            this.saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Save';
            this.saveNoteBtn.classList.remove('update');
        }
    }

    showNoteContextMenu(x, y, noteId) {
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.innerHTML = `
            <div class="menu-item move-to-folder">
                <i class="fas fa-folder-plus"></i> Move to Folder
                <i class="fas fa-chevron-right"></i>
                <div class="submenu">
                    ${this.generateFolderSubmenu(noteId)}
                </div>
            </div>
            <div class="menu-item" data-delete-note="${noteId}">
                <i class="fas fa-trash"></i> Delete
            </div>
        `;

        // Remove existing context menus
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());

        document.body.appendChild(contextMenu);
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';

        // Close menu when clicking outside
        document.addEventListener('click', function closeMenu(e) {
            if (!contextMenu.contains(e.target)) {
                contextMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    generateFolderSubmenu(noteId) {
        const folders = window.folderManager ? window.folderManager.folders : [];
        return folders.map(folder => `
            <div class="menu-item" onclick="notesApp.moveNoteToFolder('${noteId}', '${folder.id}')">
                <i class="fas fa-folder"></i> ${folder.name}
            </div>
        `).join('') || '<div class="menu-item disabled">No folders available</div>';
    }

    moveNoteToFolder(noteId, folderId) {
        const note = this.notes.find(n => n.id.toString() === noteId);
        if (note) {
            note.folderId = parseInt(folderId);
            this.saveNotes();
            this.renderNotesList();
            if (window.folderManager) {
                window.folderManager.renderFolders();
            }
        }
    }

    createNewNote(title = '', content = '') {
        const note = {
            id: Date.now(),
            title: title || 'Untitled Note',
            content: '',
            folderId: window.folderManager?.currentFolder?.id || null,
            date: new Date().toLocaleString(),
            tags: [],
            shareId: null
        };

        this.notes.unshift(note);
        this.selectNote(note);
        this.updateSaveButton();

        // Add H1 title to content area
        this.noteContent.innerHTML = `<h1>${note.title}</h1><br>`;
        
        // Add title sync between toolbar and H1
        this.noteTitle.addEventListener('input', () => {
            if (this.currentNote) {
                this.currentNote.title = this.noteTitle.value;
                const titleH1 = this.noteContent.querySelector('h1');
                if (titleH1) {
                    titleH1.textContent = this.noteTitle.value;
                } else {
                    // If H1 doesn't exist, create it
                    const newH1 = document.createElement('h1');
                    newH1.textContent = this.noteTitle.value;
                    this.noteContent.insertBefore(newH1, this.noteContent.firstChild);
                }
                this.updateSaveButton();
            }
        });
    }

    /**
     * Select a note and display it in the editor
     * @param {Object} note - The note to select and display
     */
    selectNote(note) {
        this.currentNote = note;
        this.noteTitle.value = note.title;
        
        // Check if content has H1, if not add it
        let content = note.content;
        if (!content.includes('<h1>')) {
            content = `<h1>${note.title}</h1>${content}`;
        }
        
        this.noteContent.innerHTML = content;
        this.noteContent.focus();
        this.updateSaveButton();
        
        // Set current tags from the note
        this.currentTags = note.tags || [];
        
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.id === note.id.toString()) {
                item.classList.add('selected');
            }
        });
        
        // Dispatch a custom event to notify other components that a note was selected
        document.dispatchEvent(new CustomEvent('note-selected', { 
            detail: { noteId: note.id }
        }));
    }

    saveCurrentNote() {
        if (this.currentNote) {
            this.currentNote.title = this.noteTitle.value || 'Untitled Note';
            
            // Ensure H1 title is synced before saving
            const titleH1 = this.noteContent.querySelector('h1');
            if (titleH1) {
                titleH1.textContent = this.currentNote.title;
            }
            
            this.currentNote.content = this.noteContent.innerHTML;
            this.currentNote.date = new Date().toLocaleString();
            this.saveNotes();
            this.renderNotesList();
            this.updateSaveButton();
        }
    }

    filterNotesByFolder(folderId) {
        this.renderNotesList(this.notes.filter(note => note.folderId === folderId));
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
                <div class="note-title">${note.title} ${shareIcon}</div>
                ${folderName}
                <div class="note-preview">${preview}</div>
                ${tagsHtml}
                <div class="note-date">${this.formatDate(note.lastModified || note.date)}</div>
            `;

            if (this.currentNote && this.currentNote.id === note.id) {
                noteElement.classList.add('selected');
            }

            // Add click event for the entire note
            noteElement.addEventListener('click', (e) => {
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
            
            this.notesList.appendChild(noteElement);
        });
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    loadNotes(noteIdToSelect) {
        const savedNotes = localStorage.getItem('notes');
        this.notes = savedNotes ? JSON.parse(savedNotes) : [];
        
        // Load all tags
        this.loadAllTags();
        
        // Check for shared note in URL
        this.checkForSharedNote();
        
        this.renderNotesList();
        
        if (this.notes.length > 0) {
            if (noteIdToSelect) {
                // Find and select the specified note
                const noteToSelect = this.notes.find(note => note.id === noteIdToSelect);
                if (noteToSelect) {
                    this.selectNote(noteToSelect);
                    return;
                }
            }
            // Default behavior: select first note
            this.selectNote(this.notes[0]);
        } else {
            this.createNewNote();
        }
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

    showAllNotes() {
        // Clear any folder selection
        this.currentFolder = null;
        
        // Show all notes in the sidebar
        this.renderNotesList(this.notes.sort((a, b) => 
            new Date(b.lastModified || b.date) - new Date(a.lastModified || a.date)
        ));
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
        this.noteContent.focus();
    }

    alignCenter() {
        document.execCommand('justifyCenter', false, null);
        this.noteContent.focus();
    }

    alignRight() {
        document.execCommand('justifyRight', false, null);
        this.noteContent.focus();
    }

    indent() {
        document.execCommand('indent', false, null);
        this.noteContent.focus();
    }

    outdent() {
        document.execCommand('outdent', false, null);
        this.noteContent.focus();
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
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    const initializeApp = async () => {
        // Initialize the main app first
        window.notesApp = new NotesApp();
        
        // Ensure NotesApp is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!window.notesApp.noteContent || !window.notesApp.noteTitle) {
            throw new Error('NotesApp failed to initialize required elements');
        }

        // Initialize note operations
        window.noteOperations = new window.NoteOperationsClass(window.notesApp);
        
        // Wait for NoteOperations to initialize
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (!window.noteOperations.initialized) {
            throw new Error('NoteOperations failed to initialize');
        }

        // Initialize delete operations
        window.deleteNoteOperations = new window.DeleteNoteOperationsClass();
        
        // Wait for DeleteNoteOperations to initialize
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (!window.deleteNoteOperations.initialized) {
            throw new Error('DeleteNoteOperations failed to initialize');
        }

        console.log('%c[App Initialization]%c All components initialized successfully',
            'color: #2ecc71; font-weight: bold',
            'color: inherit');
    };

    try {
        await initializeApp();
    } catch (error) {
        console.error('%c[App Initialization Error]%c ' + error.message,
            'color: #ff4757; font-weight: bold',
            'color: inherit');
        console.error('Stack trace:', error.stack);
        
        // Retry initialization once after a delay
        console.warn('Retrying initialization in 500ms...');
        setTimeout(async () => {
            try {
                await initializeApp();
            } catch (retryError) {
                console.error('%c[App Initialization Failed]%c Unable to initialize after retry',
                    'color: #ff4757; font-weight: bold',
                    'color: inherit');
                console.error('Details:', retryError);
            }
        }, 500);
    }
});
