/**
 * Toolbar functionality for NotePad application
 */
class Toolbar {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        console.log("[DEBUG] Toolbar class initialized");
    }

    initializeElements() {
        // Basic formatting
        this.boldBtn = document.getElementById('toolbar-boldBtn');
        this.italicBtn = document.getElementById('toolbar-italicBtn');
        this.underlineBtn = document.getElementById('toolbar-underlineBtn');
        this.strikeBtn = document.getElementById('toolbar-strikeBtn');

        // Content formatting
        this.headingBtn = document.getElementById('toolbar-headingBtn');
        this.quoteBtn = document.getElementById('toolbar-quoteBtn');
        this.codeBtn = document.getElementById('toolbar-codeBtn');
        this.listBtn = document.getElementById('toolbar-listBtn');

        // Insert elements
        this.linkBtn = document.getElementById('toolbar-linkBtn');
        this.imageBtn = document.getElementById('toolbar-imageBtn');
        this.hrBtn = document.getElementById('toolbar-hrBtn');

        // Utility buttons
        this.cutBtn = document.getElementById('toolbar-cutBtn');
        this.copyBtn = document.getElementById('toolbar-copyBtn');
        this.pasteBtn = document.getElementById('toolbar-pasteBtn');

        // File operations
        this.uploadBtn = document.getElementById('uploadTextBtn');
        this.shareBtn = document.getElementById('shareNoteBtn');
        this.tagBtn = document.getElementById('tagNoteBtn');
        this.downloadBtn = document.getElementById('toolbar-downloadBtn');

        // Modal elements
        this.shareModal = document.getElementById('shareModal');
        this.sharePreviewTitle = document.getElementById('sharePreviewTitle');
        this.sharePreviewContent = document.getElementById('sharePreviewContent');
        this.shareLink = document.getElementById('shareLink');
        this.copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
        this.closeShareBtn = document.getElementById('closeShareBtn');
        this.emailShareBtn = document.getElementById('emailShareBtn');
        this.whatsappShareBtn = document.getElementById('whatsappShareBtn');
        this.twitterShareBtn = document.getElementById('twitterShareBtn');
        this.shareModalCloseBtn = this.shareModal ? this.shareModal.querySelector('.close-btn') : null;
        
        this.tagModal = document.getElementById('tagModal');
        this.newTagInput = document.getElementById('newTag');
        this.addTagBtn = document.getElementById('addTagBtn');
        this.saveTagsBtn = document.getElementById('saveTagsBtn');
        this.cancelTagsBtn = document.getElementById('cancelTagsBtn');
        this.tagModalCloseBtn = this.tagModal ? this.tagModal.querySelector('.close-btn') : null;
        
        // Editor area
        this.noteContent = document.querySelector('.note-content');
        this.noteTitleInput = document.getElementById('noteTitleInput');
    }

    initializeEventListeners() {
        // Basic formatting
        if (this.boldBtn) this.boldBtn.addEventListener('click', () => this.formatText('bold'));
        if (this.italicBtn) this.italicBtn.addEventListener('click', () => this.formatText('italic'));
        if (this.underlineBtn) this.underlineBtn.addEventListener('click', () => this.formatText('underline'));
        if (this.strikeBtn) this.strikeBtn.addEventListener('click', () => this.formatText('strikeThrough'));

        // Content formatting
        if (this.headingBtn) this.headingBtn.addEventListener('click', () => this.insertHeading());
        if (this.quoteBtn) this.quoteBtn.addEventListener('click', () => this.insertQuote());
        if (this.codeBtn) this.codeBtn.addEventListener('click', () => this.insertCode());
        if (this.listBtn) this.listBtn.addEventListener('click', () => this.formatText('insertUnorderedList'));

        // Insert elements
        if (this.linkBtn) this.linkBtn.addEventListener('click', () => this.insertLink());
        if (this.imageBtn) this.imageBtn.addEventListener('click', () => this.insertImage());
        if (this.hrBtn) this.hrBtn.addEventListener('click', () => this.insertHorizontalRule());

        // Utility buttons
        if (this.cutBtn) this.cutBtn.addEventListener('click', () => this.cutText());
        if (this.copyBtn) this.copyBtn.addEventListener('click', () => this.copyText());
        if (this.pasteBtn) this.pasteBtn.addEventListener('click', () => this.handlePaste());
        
        // Action buttons
        if (this.shareBtn) this.shareBtn.addEventListener('click', () => this.showShareModal());
        if (this.tagBtn) this.tagBtn.addEventListener('click', () => this.showTagModal());
        if (this.downloadBtn) this.downloadBtn.addEventListener('click', () => this.downloadNote());

        // Share modal buttons
        if (this.closeShareBtn) this.closeShareBtn.addEventListener('click', () => this.hideShareModal());
        if (this.shareModalCloseBtn) this.shareModalCloseBtn.addEventListener('click', () => this.hideShareModal());
        if (this.copyShareLinkBtn) this.copyShareLinkBtn.addEventListener('click', () => this.copyShareLink());
        if (this.emailShareBtn) this.emailShareBtn.addEventListener('click', () => this.shareViaEmail());
        if (this.whatsappShareBtn) this.whatsappShareBtn.addEventListener('click', () => this.shareViaWhatsApp());
        if (this.twitterShareBtn) this.twitterShareBtn.addEventListener('click', () => this.shareViaTwitter());
        
        // Tag modal buttons
        if (this.addTagBtn) this.addTagBtn.addEventListener('click', () => this.addTag());
        if (this.saveTagsBtn) this.saveTagsBtn.addEventListener('click', () => this.saveTags());
        if (this.cancelTagsBtn) this.cancelTagsBtn.addEventListener('click', () => this.hideTagModal());
        if (this.tagModalCloseBtn) this.tagModalCloseBtn.addEventListener('click', () => this.hideTagModal());

        // Modal background click to close
        if (this.shareModal) this.shareModal.addEventListener('click', (e) => {
            if (e.target === this.shareModal) this.hideShareModal();
        });
        
        if (this.tagModal) this.tagModal.addEventListener('click', (e) => {
            if (e.target === this.tagModal) this.hideTagModal();
        });

        // Track selection changes
        if (this.noteContent) this.noteContent.addEventListener('mouseup', () => this.updateActiveButtons());
        if (this.noteContent) this.noteContent.addEventListener('keyup', () => this.updateActiveButtons());
    }

    formatText(command) {
        if (!this.noteContent) return;
        this.noteContent.focus();
        document.execCommand(command, false, null);
    }

    insertHeading() {
        if (!this.noteContent) return;
        this.noteContent.focus();
        
        // Get current selection
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        // Create heading element
        const heading = document.createElement('h2');
        
        // If text is selected, use it as heading content
        if (!selection.isCollapsed) {
            heading.textContent = range.toString();
            range.deleteContents();
            range.insertNode(heading);
        } else {
            // If no selection, insert a default heading
            heading.textContent = 'Heading';
            range.insertNode(heading);
        }
        
        // Move cursor after the heading
        selection.collapseToEnd();
    }

    insertQuote() {
        if (!this.noteContent) return;
        this.noteContent.focus();
        
        // Get current selection
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        // Create blockquote element
        const quote = document.createElement('blockquote');
        
        // If text is selected, use it as quote content
        if (!selection.isCollapsed) {
            quote.textContent = range.toString();
            range.deleteContents();
            range.insertNode(quote);
        } else {
            // If no selection, insert a default quote
            quote.textContent = 'Quote';
            range.insertNode(quote);
        }
        
        // Move cursor after the quote
        selection.collapseToEnd();
    }

    insertCode() {
        if (!this.noteContent) return;
        this.noteContent.focus();
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().trim()) {
            const range = selection.getRangeAt(0);
            const code = document.createElement('code');
            code.textContent = range.toString();
            range.deleteContents();
            range.insertNode(code);
        } else {
            document.execCommand('insertHTML', false, '<code>code</code>');
        }
    }

    insertLink() {
        if (!this.noteContent) return;
        
        // Create modal dynamically
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'linkModal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Insert Link</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label for="linkText">Link Text</label>
                        <input type="text" id="linkText" placeholder="Enter link text">
                    </div>
                    <div class="input-group">
                        <label for="linkURL">URL</label>
                        <input type="text" id="linkURL" placeholder="Enter URL" value="https://">
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="insertLinkBtn" class="primary-btn">Insert</button>
                    <button id="cancelLinkBtn" class="secondary-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Get the current selection text to pre-populate
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // Get modal elements
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('#cancelLinkBtn');
        const insertBtn = modal.querySelector('#insertLinkBtn');
        const linkTextInput = modal.querySelector('#linkText');
        const linkURLInput = modal.querySelector('#linkURL');
        
        // Pre-populate link text if text is selected
        if (selectedText) {
            linkTextInput.value = selectedText;
        }
        
        // Focus URL input
        setTimeout(() => linkURLInput.focus(), 100);
        
        // Hide modal and cleanup
        const hideModal = () => {
            document.body.removeChild(modal);
        };
        
        // Close button event listener
        closeBtn.addEventListener('click', hideModal);
        cancelBtn.addEventListener('click', hideModal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });
        
        // Insert link
        insertBtn.addEventListener('click', () => {
            const text = linkTextInput.value.trim();
            const url = linkURLInput.value.trim();
            
            if (!text || !url || url === 'https://') {
                alert('Please enter both text and URL.');
                return;
            }
            
            this.noteContent.focus();
            
            // If text was selected, replace it
            if (selection.rangeCount > 0 && selectedText) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                
                const link = document.createElement('a');
                link.href = url;
                link.textContent = text;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                
                range.insertNode(link);
            } else {
                // Insert at cursor position
                const link = document.createElement('a');
                link.href = url;
                link.textContent = text;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                
                const range = selection.getRangeAt(0);
                range.insertNode(link);
            }
            
            hideModal();
        });
    }

    insertImage() {
        if (!this.noteContent) return;
        
        // Create modal dynamically
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'imageModal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Insert Image</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label for="imageURL">Image URL</label>
                        <input type="text" id="imageURL" placeholder="Enter image URL" value="https://">
                    </div>
                    <div class="input-group">
                        <label for="imageAlt">Alt Text (Optional)</label>
                        <input type="text" id="imageAlt" placeholder="Description for image">
                    </div>
                    <div class="image-preview">
                        <div class="preview-placeholder">
                            <i class="fas fa-image"></i>
                            <span>Image preview will appear here</span>
                        </div>
                        <img id="previewImage" style="display: none; max-width: 100%; border-radius: 8px;">
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="insertImageBtn" class="primary-btn">Insert</button>
                    <button id="cancelImageBtn" class="secondary-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Get modal elements
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('#cancelImageBtn');
        const insertBtn = modal.querySelector('#insertImageBtn');
        const imageURLInput = modal.querySelector('#imageURL');
        const imageAltInput = modal.querySelector('#imageAlt');
        const previewImage = modal.querySelector('#previewImage');
        const previewPlaceholder = modal.querySelector('.preview-placeholder');
        
        // Focus URL input
        setTimeout(() => imageURLInput.focus(), 100);
        
        // Hide modal and cleanup
        const hideModal = () => {
            document.body.removeChild(modal);
        };
        
        // Close button event listener
        closeBtn.addEventListener('click', hideModal);
        cancelBtn.addEventListener('click', hideModal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });
        
        // Preview image when URL changes
        imageURLInput.addEventListener('input', () => {
            const url = imageURLInput.value.trim();
            if (url && url !== 'https://') {
                previewImage.src = url;
                previewImage.onload = () => {
                    previewPlaceholder.style.display = 'none';
                    previewImage.style.display = 'block';
                };
                previewImage.onerror = () => {
                    previewPlaceholder.style.display = 'flex';
                    previewImage.style.display = 'none';
                };
            } else {
                previewPlaceholder.style.display = 'flex';
                previewImage.style.display = 'none';
            }
        });
        
        // Insert image
        insertBtn.addEventListener('click', () => {
            const url = imageURLInput.value.trim();
            const alt = imageAltInput.value.trim();
            
            if (!url || url === 'https://') {
                alert('Please enter an image URL.');
                return;
            }
            
            this.noteContent.focus();
            
            // Create image element
            const img = document.createElement('img');
            img.src = url;
            if (alt) img.alt = alt;
            img.style.maxWidth = '100%';
            
            // Insert at cursor position
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.insertNode(img);
            }
            
            hideModal();
        });
    }

    insertHorizontalRule() {
        if (!this.noteContent) return;
        this.noteContent.focus();
        document.execCommand('insertHorizontalRule', false, null);
    }

    cutText() {
        if (!this.noteContent) return;
        this.noteContent.focus();
        
        // Get the current selection
        const selection = window.getSelection();
        
        // Only proceed if there's a text selection
        if (selection.toString().length > 0) {
            // Use the document.execCommand for the cut operation
            document.execCommand('cut');
        }
    }

    copyText() {
        if (!this.noteContent) return;
        this.noteContent.focus();
        document.execCommand('copy');
    }

    async handlePaste() {
        try {
            const text = await navigator.clipboard.readText();
            this.noteContent.focus();
            document.execCommand('insertText', false, text);
        } catch (err) {
            console.error('Failed to paste:', err);
            // Fallback to standard paste
            document.execCommand('paste');
        }
    }

    showShareModal() {
        if (!this.shareModal || !window.notesApp || !window.notesApp.currentNote) return;
        
        // Update share preview with current note
        const currentNote = window.notesApp.currentNote;
        
        if (this.sharePreviewTitle) {
            this.sharePreviewTitle.textContent = currentNote.title || 'Untitled Note';
        }
        
        if (this.sharePreviewContent) {
            // Truncate content if it's too long
            const content = currentNote.content || '';
            this.sharePreviewContent.innerHTML = content.length > 300 
                ? content.substring(0, 300) + '...' 
                : content;
        }
        
        // Generate share link
        if (this.shareLink) {
            const noteId = currentNote.id;
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${noteId}`;
            this.shareLink.value = shareUrl;
        }
        
        // Show the modal
        this.shareModal.style.display = 'block';
    }

    hideShareModal() {
        if (!this.shareModal) return;
        this.shareModal.style.display = 'none';
    }

    copyShareLink() {
        if (!this.shareLink) return;
        
        this.shareLink.select();
        document.execCommand('copy');
        
        // Show copy status
        const copyStatus = document.getElementById('copyStatus');
        if (copyStatus) {
            copyStatus.style.opacity = '1';
            setTimeout(() => {
                copyStatus.style.opacity = '0';
            }, 2000);
        }
    }

    shareViaEmail() {
        if (!window.notesApp || !window.notesApp.currentNote) return;
        
        const subject = encodeURIComponent(window.notesApp.currentNote.title || 'Shared Note');
        const body = encodeURIComponent('Check out this note: ' + this.shareLink.value);
        
        window.open(`mailto:?subject=${subject}&body=${body}`);
    }

    shareViaWhatsApp() {
        if (!this.shareLink) return;
        
        const text = encodeURIComponent('Check out this note: ' + this.shareLink.value);
        window.open(`https://wa.me/?text=${text}`);
    }

    shareViaTwitter() {
        if (!this.shareLink) return;
        
        const text = encodeURIComponent('Check out this note: ' + this.shareLink.value);
        window.open(`https://twitter.com/intent/tweet?text=${text}`);
    }

    showTagModal() {
        if (!this.tagModal || !window.notesApp || !window.notesApp.currentNote) return;
        
        // Clear existing tags
        const tagsContainer = document.getElementById('tagsContainer');
        if (tagsContainer) {
            tagsContainer.innerHTML = '';
            
            // Load current note's tags
            const currentNote = window.notesApp.currentNote;
            const tags = currentNote.tags || [];
            
            // Display current tags
            tags.forEach(tag => {
                this.createTagElement(tag, tagsContainer);
            });
        }
        
        // Clear tag input
        if (this.newTagInput) {
            this.newTagInput.value = '';
        }
        
        // Populate popular tags
        this.populatePopularTags();
        
        // Show the modal
        this.tagModal.style.display = 'block';
    }

    hideTagModal() {
        if (!this.tagModal) return;
        this.tagModal.style.display = 'none';
    }

    addTag() {
        if (!this.newTagInput || !window.notesApp || !window.notesApp.currentNote) return;
        
        const tagName = this.newTagInput.value.trim();
        if (!tagName) return;
        
        const tagsContainer = document.getElementById('tagsContainer');
        if (!tagsContainer) return;
        
        // Create tag element
        this.createTagElement(tagName, tagsContainer);
        
        // Clear input
        this.newTagInput.value = '';
        this.newTagInput.focus();
    }

    createTagElement(tagName, container) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tagName}
            <i class="fas fa-times" data-tag="${tagName}"></i>
        `;
        
        // Add delete event
        const deleteIcon = tagElement.querySelector('i');
        deleteIcon.addEventListener('click', () => {
            tagElement.remove();
        });
        
        container.appendChild(tagElement);
    }

    populatePopularTags() {
        if (!window.notesApp || !window.notesApp.notes) return;
        
        const popularTagsContainer = document.getElementById('popularTagsContainer');
        if (!popularTagsContainer) return;
        
        // Clear container
        popularTagsContainer.innerHTML = '';
        
        // Count tag occurrences
        const tagCounts = {};
        window.notesApp.notes.forEach(note => {
            if (note.tags && Array.isArray(note.tags)) {
                note.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        // Sort tags by popularity
        const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
        
        // Display top 10 tags
        sortedTags.slice(0, 10).forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tagElement.addEventListener('click', () => {
                // Add this tag to current tags if not already there
                const tagsContainer = document.getElementById('tagsContainer');
                if (tagsContainer) {
                    const existingTags = Array.from(tagsContainer.querySelectorAll('.tag'))
                        .map(el => el.textContent.trim());
                    
                    if (!existingTags.includes(tag)) {
                        this.createTagElement(tag, tagsContainer);
                    }
                }
            });
            
            popularTagsContainer.appendChild(tagElement);
        });
    }

    saveTags() {
        if (!window.notesApp || !window.notesApp.currentNote) return;
        
        const tagsContainer = document.getElementById('tagsContainer');
        if (!tagsContainer) return;
        
        // Get all tags
        const tags = Array.from(tagsContainer.querySelectorAll('.tag'))
            .map(el => el.textContent.trim());
        
        // Save tags to current note
        window.notesApp.currentNote.tags = tags;
        window.notesApp.saveNotes();
        
        // Hide modal
        this.hideTagModal();
        
        // Show success notification
        if (window.notesApp.showNotification) {
            window.notesApp.showNotification('Tags saved successfully', 'success');
        }
    }

    downloadNote() {
        if (!window.notesApp || !window.notesApp.currentNote) return;
        
        const currentNote = window.notesApp.currentNote;
        const title = currentNote.title || 'Untitled Note';
        const content = currentNote.content || '';
        
        // Create text content
        const textContent = `${title}\n\n${content.replace(/<[^>]*>/g, '')}`;
        
        // Create download link
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
        element.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_')}.txt`);
        
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    updateActiveButtons() {
        // Update button states based on current selection
        const buttons = {
            'toolbar-boldBtn': 'bold',
            'toolbar-italicBtn': 'italic',
            'toolbar-underlineBtn': 'underline',
            'toolbar-strikeBtn': 'strikeThrough'
        };

        Object.entries(buttons).forEach(([id, command]) => {
            const button = document.getElementById(id);
            if (button) {
                if (document.queryCommandState(command)) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.toolbar = new Toolbar();
}); 