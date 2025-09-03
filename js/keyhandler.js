// Standalone Key Handler with Debug Output - Enhanced Upload Support
'use strict';

// Enhanced key handler with explicit debug output and upload support
document.addEventListener('keydown', function handleKeyPress(e) {
    // Enter key detection with debug
    if (e.keyCode === 13 || e.key === 'Enter') {
        console.log('🔍 ENTER KEY 13 DETECTED!', { keyCode: e.keyCode, key: e.key });
        const analyzerWindow = document.getElementById('analyzerWindow');
        const fileInput = document.getElementById('fileInput');

        if (analyzerWindow && !analyzerWindow.classList.contains('visible')) {
            e.preventDefault();
            console.log('🚀 OPENING ANALYZER FROM ENTER KEY!');
            openAnalyzer();
        } else if (analyzerWindow && analyzerWindow.classList.contains('visible') && fileInput) {
            e.preventDefault();
            console.log('📁 TRIGGERING FILE INPUT FROM ENTER KEY!');
            fileInput.click();
        }
    }

    // Escape key detection with debug
    if (e.keyCode === 27 || e.key === 'Escape') {
        console.log('❌ ESCAPE KEY 27 DETECTED!', { keyCode: e.keyCode, key: e.key });
        const analyzerWindow = document.getElementById('analyzerWindow');
        if (analyzerWindow && analyzerWindow.classList.contains('visible')) {
            console.log('🔒 CLOSING ANALYZER FROM ESCAPE KEY!');
            closeAnalyzer();
        }
    }

    // Space key detection with debug
    if (e.keyCode === 32 || e.key === ' ') {
        console.log('⌨️ SPACE KEY 32 DETECTED!', { keyCode: e.keyCode, key: e.key });
        const analyzerWindow = document.getElementById('analyzerWindow');
        const fileInput = document.getElementById('fileInput');

        if (analyzerWindow && !analyzerWindow.classList.contains('visible')) {
            e.preventDefault();
            console.log('🚀 OPENING ANALYZER FROM SPACE KEY!');
            openAnalyzer();
        } else if (analyzerWindow && analyzerWindow.classList.contains('visible') && fileInput) {
            e.preventDefault();
            console.log('📁 TRIGGERING FILE INPUT FROM SPACE KEY!');
            fileInput.click();
        }
    }

    // F key for file upload (additional shortcut)
    if ((e.keyCode === 70 || e.key === 'f') && (e.ctrlKey || e.metaKey)) {
        console.log('📁 CTRL+F FILE SHORTCUT DETECTED!');
        const analyzerWindow = document.getElementById('analyzerWindow');
        const fileInput = document.getElementById('fileInput');

        if (analyzerWindow && analyzerWindow.classList.contains('visible') && fileInput) {
            e.preventDefault();
            console.log('📦 OPENING FILE DIALOG FROM CTRL+F!');
            fileInput.click();
        }
    }
});

console.log('🎯 KEY HANDLER INITIALIZED WITH ENHANCED DEBUG OUTPUT AND UPLOAD SUPPORT!');