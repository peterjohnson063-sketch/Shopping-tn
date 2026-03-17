// Console Capture Script for Vendor Dashboard Debugging
// Inject this script into index.html to capture detailed console logs

(function() {
    // Store original console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Create log storage
    const logs = [];
    
    // Enhanced console.log
    console.log = function(...args) {
        const timestamp = new Date().toLocaleTimeString();
        const message = args.join(' ');
        logs.push({
            type: 'log',
            timestamp,
            message: message
        });
        originalLog.apply(console, args);
        
        // Send to parent window if in iframe
        if (window.parent !== window) {
            try {
                window.parent.postMessage({
                    action: 'consoleLog',
                    log: `[${timestamp}] LOG: ${message}`
                }, '*');
            } catch (e) {
                // Ignore cross-origin errors
            }
        }
    };
    
    // Enhanced console.warn
    console.warn = function(...args) {
        const timestamp = new Date().toLocaleTimeString();
        const message = args.join(' ');
        logs.push({
            type: 'warn',
            timestamp,
            message: message
        });
        originalWarn.apply(console, args);
        
        if (window.parent !== window) {
            try {
                window.parent.postMessage({
                    action: 'consoleLog',
                    log: `[${timestamp}] WARN: ${message}`
                }, '*');
            } catch (e) {
                // Ignore cross-origin errors
            }
        }
    };
    
    // Enhanced console.error
    console.error = function(...args) {
        const timestamp = new Date().toLocaleTimeString();
        const message = args.join(' ');
        logs.push({
            type: 'error',
            timestamp,
            message: message
        });
        originalError.apply(console, args);
        
        if (window.parent !== window) {
            try {
                window.parent.postMessage({
                    action: 'consoleLog',
                    log: `[${timestamp}] ERROR: ${message}`
                }, '*');
            } catch (e) {
                // Ignore cross-origin errors
            }
        }
    };
    
    // Method to get logs
    window.getConsoleLogs = function() {
        return logs.slice(-50); // Return last 50 logs
    };
    
    // Method to clear logs
    window.clearConsoleLogs = function() {
        logs.length = 0;
        return logs;
    };
    
    console.log('🔍 Console capture script loaded');
})();
