/**
 * Text formatting functionality for the NotePad application
 */
class TextFormatter {
    constructor() {
        this.initializeFormatButtons();
    }

    initializeFormatButtons() {
        // Basic formatting buttons
        const formatButtons = {
            'toolbar-boldBtn': 'bold',
            'toolbar-italicBtn': 'italic',
            'toolbar-underlineBtn': 'underline',
            'toolbar-strikeBtn': 'strikeThrough'
        };

        // Add event listeners to each button
        Object.entries(formatButtons).forEach(([buttonId, command]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => this.formatText(command));
            }
        });
    }

    formatText(command) {
        document.execCommand(command, false, null);
        // Focus back on the content area
        const noteContent = document.querySelector('.note-content');
        if (noteContent) {
            noteContent.focus();
        }
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.textFormatter = new TextFormatter();
}); 