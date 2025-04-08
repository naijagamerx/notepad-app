/**
 * @fileoverview Represents a single note in the application
 * @version 1.0.0
 * @author Your Name
 * @license MIT
 */

console.log("[DEBUG] Loading Note class file");

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