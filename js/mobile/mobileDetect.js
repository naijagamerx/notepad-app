/**
 * Mobile Detection and Script Loading
 * Detects mobile devices and loads mobile-specific scripts
 */

// Prevent duplicate declaration
if (typeof window.MobileDetect === 'undefined') {
    class MobileDetect {
        constructor() {
            // Return existing instance if already initialized
            if (window.mobileDetect) {
                console.log('[MobileDetect] Instance already exists, returning existing instance');
                return window.mobileDetect;
            }
            
            this.isMobile = false;
            
            // Create meta viewport tag if it doesn't exist
            this.ensureViewportMeta();
            
            // Initial check
            this.checkMobile();
            
            // Set up event listeners
            window.addEventListener('resize', () => this.checkMobile());

            // Listen for core app readiness
            document.addEventListener('notesapp-ready', () => {
                console.log('[MobileDetect] NotesApp ready event received');
                this.checkAndLoadMobile();
            });

            // Fallback check on DOMContentLoaded if notesapp-ready hasn't fired
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    if (!window.notesApp) { // Check if core app hasn't initialized yet
                        console.warn('[MobileDetect] NotesApp not ready after DOMContentLoaded, trying mobile load anyway.');
                        this.checkAndLoadMobile();
                    }
                }, 500); // Wait a bit after DOM loaded
            });
            
            // Make instance globally available
            window.mobileDetect = this;
            
            console.log('[MobileDetect] Mobile detection initialized');
        }
        
        /**
         * Ensure the viewport meta tag exists with proper settings
         */
        ensureViewportMeta() {
            let viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport) {
                viewport = document.createElement('meta');
                viewport.setAttribute('name', 'viewport');
                document.head.appendChild(viewport);
            }
            
            // Set correct viewport properties to prevent horizontal overflow
            viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
        }
        
        /**
         * Check if the current device is mobile based on screen width
         */
        checkMobile() {
            const wasMobile = this.isMobile;
            
            // Consider both width and user agent for more accurate detection
            const isMobileWidth = window.innerWidth <= 768;
            const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            this.isMobile = isMobileWidth || isMobileAgent;
            
            // Apply base mobile styles to prevent overflow regardless of device
            this.applyBaseMobileStyles();
            
            // If mobile state changed, reload page to re-initialize
            if (wasMobile !== this.isMobile && document.readyState === 'complete') {
                console.log('[MobileDetect] Mobile state changed, reloading page');
                window.location.reload();
            }
            
            return this.isMobile;
        }
        
        /**
         * Apply base mobile styles to prevent overflow
         */
        applyBaseMobileStyles() {
            // Apply these styles regardless of whether mobile scripts are loaded
            // This helps prevent horizontal overflow during loading
            const style = document.createElement('style');
            style.id = 'mobile-base-styles';
            
            // Remove existing base styles if any
            const existingStyle = document.getElementById('mobile-base-styles');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            style.textContent = `
                html, body {
                    overflow-x: hidden;
                    width: 100%;
                    max-width: 100vw;
                    position: relative;
                }
                
                * {
                    max-width: 100vw;
                    box-sizing: border-box;
                }
                
                img, video, iframe, table {
                    max-width: 100%;
                }
                
                .note-item, .folder-item {
                    box-sizing: border-box;
                    max-width: 100%;
                    width: auto !important;
                }
            `;
            
            document.head.appendChild(style);
        }
        
        /**
         * Check if mobile and load scripts if necessary
         */
        checkAndLoadMobile() {
            if (this.isMobile && !this.mobileScriptsLoaded) {
                console.log('[MobileDetect] Loading mobile specific resources');
                this.loadMobileResources();
            } else if (!this.isMobile) {
                 console.log('[MobileDetect] Not a mobile device, skipping mobile resources');
            } else {
                 console.log('[MobileDetect] Mobile resources already loaded or loading');
            }
        }
        
        /**
         * Initialize mobile functionality (Load CSS and Scripts)
         */
        loadMobileResources() {
            if (this.mobileScriptsLoaded) return; // Prevent double loading
            this.mobileScriptsLoaded = true; // Set flag immediately

            console.log('[MobileDetect] Adding mobile-device class and loading resources');
            document.body.classList.add('mobile-device');
            this.applyBaseMobileStyles();

            // Load CSS first
            this.loadCSS('css/mobileUI.css') // Assuming CSS was also moved
                .then(() => {
                    console.log('[MobileDetect] Mobile CSS loaded');
                    // Load mobile scripts sequentially
                    // Bridge, App, Notes, Folders
                    return this.loadScript('js/mobile/mobileBridge.js');
                })
                .then(() => {
                    console.log('[MobileDetect] Mobile bridge script loaded');
                    return this.loadScript('js/mobile/mobileApp.js');
                })
                .then(() => {
                    console.log('[MobileDetect] Mobile app script loaded');
                    return this.loadScript('js/mobile/mobileNotes.js');
                })
                .then(() => {
                    console.log('[MobileDetect] Mobile notes script loaded');
                    return this.loadScript('js/mobile/mobileFolders.js');
                })
                .then(() => {
                    console.log('[MobileDetect] All mobile scripts loaded successfully');
                    // Dispatch event when all mobile scripts are loaded
                    document.dispatchEvent(new CustomEvent('mobile-scripts-loaded'));
                })
                .catch(error => {
                    console.error('[MobileDetect] Error loading mobile resources:', error);
                    this.mobileScriptsLoaded = false; // Reset flag on error
                });
        }
        
        /**
         * Load a JavaScript file dynamically
         * @param {string} src - The source URL of the script
         * @returns {Promise} - Resolves when script is loaded
         */
        loadScript(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                
                document.body.appendChild(script);
            });
        }
        
        /**
         * Load a CSS file dynamically
         * @param {string} href - The href URL of the stylesheet
         * @returns {Promise} - Resolves when CSS is loaded
         */
        loadCSS(href) {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = href;
                
                link.onload = () => resolve();
                link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
                
                document.head.appendChild(link);
            });
        }
    }

    // Make class globally available
    window.MobileDetect = MobileDetect;

    // Create instance immediately if document already loaded
    if (document.readyState !== 'loading') {
        console.log('[MobileDetect] Document already loaded, initializing immediately');
        new MobileDetect();
    } else {
        // Otherwise wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[MobileDetect] DOMContentLoaded, initializing');
            new MobileDetect();
        });
    }

    // Add backup initialization after window load
    window.addEventListener('load', () => {
        console.log('[MobileDetect] Window loaded, ensuring initialization');
        if (!window.mobileDetect) {
            console.log('[MobileDetect] Instance not found after load, creating new instance');
            new MobileDetect();
        }
    });
} 