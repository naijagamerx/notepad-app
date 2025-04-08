// Clipboard Operations Manager
class ClipboardOps {
    constructor() {
        this.editor = document.querySelector('.note-content');
        this.copyBtn = document.getElementById('toolbar-copyBtn');
        this.pasteBtn = document.getElementById('toolbar-pasteBtn');
        this.initialize();
    }

    initialize() {
        if (!this.editor || !this.copyBtn || !this.pasteBtn) {
            console.error('ClipboardOps: Required elements not found:', {
                editor: !!this.editor,
                copyBtn: !!this.copyBtn,
                pasteBtn: !!this.pasteBtn
            });
            return;
        }

        this.setupCopyButton();
        this.setupPasteButton();
        console.log('ClipboardOps: Initialized successfully');
    }

    setupCopyButton() {
        this.copyBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Copy button clicked');
            
            try {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();

                if (!selectedText) {
                    this.showFeedback(this.copyBtn, false, 'No text selected');
                    return;
                }

                await navigator.clipboard.writeText(selectedText);
                this.showFeedback(this.copyBtn, true, 'Copied!');
                console.log('Text copied successfully');
            } catch (error) {
                console.error('Copy failed:', error);
                this.showFeedback(this.copyBtn, false, 'Copy failed');
            }
        });
    }

    setupPasteButton() {
        this.pasteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Paste button clicked');

            try {
                // Save current selection before clipboard operation
                const selection = window.getSelection();
                let savedRange = null;
                
                if (selection.rangeCount > 0) {
                    savedRange = selection.getRangeAt(0).cloneRange();
                }

                // Request clipboard content
                const text = await navigator.clipboard.readText();
                console.log('Clipboard text retrieved:', text);

                // Ensure editor has focus and restore selection
                this.editor.focus();
                if (savedRange) {
                    selection.removeAllRanges();
                    selection.addRange(savedRange);
                }

                // Insert the text
                document.execCommand('insertText', false, text);
                this.showFeedback(this.pasteBtn, true, 'Pasted!');
                
                // Trigger input event to save changes
                const inputEvent = new Event('input', { bubbles: true });
                this.editor.dispatchEvent(inputEvent);

                // If NotesApp exists, directly save the changes
                if (window.notesApp && window.notesApp.currentNote) {
                    // Allow a brief delay for the input event to be processed
                    setTimeout(() => {
                        // Directly save the current note
                        window.notesApp.saveCurrentNote();
                    }, 100);
                }
            } catch (error) {
                console.error('Paste failed:', error);
                this.showFeedback(this.pasteBtn, false, 'Paste failed');
            }
        });

        // Handle native paste events to ensure plain text
        this.editor.addEventListener('paste', (e) => {
            e.preventDefault();
            console.log('Native paste event intercepted');

            const text = (e.clipboardData || window.clipboardData).getData('text');
            document.execCommand('insertText', false, text);
            
            // Trigger input event to save changes
            const inputEvent = new Event('input', { bubbles: true });
            this.editor.dispatchEvent(inputEvent);

            // If NotesApp exists, directly save the changes
            if (window.notesApp && window.notesApp.currentNote) {
                // Allow a brief delay for the input event to be processed
                setTimeout(() => {
                    // Directly save the current note
                    window.notesApp.saveCurrentNote();
                }, 100);
            }
        });
    }

    showFeedback(button, success, message) {
        const originalColor = button.style.color;
        const originalTitle = button.title;

        button.style.color = success ? '#28a745' : '#dc3545';
        button.title = message;

        setTimeout(() => {
            button.style.color = originalColor;
            button.title = originalTitle;
        }, 2000);
    }
}

// Initialize clipboard operations when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after a slight delay to ensure NotesApp is initialized
    setTimeout(() => {
        window.clipboardOps = new ClipboardOps();
    }, 500);
}); 