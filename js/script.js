// ملف JavaScript منفصل لتحسين الأداء
'use strict';

// متغيرات عامة
let currentImageURL = null;
let analysisInProgress = false;

// إنشاء الشبكة العصبية في الخلفية
function createNeuralNetwork() {
    const network = document.getElementById('neuralNetwork');
    if (!network) return;

    // Clear existing nodes
    network.innerHTML = '';

    const nodeCount = window.innerWidth < 768 ? 15 : 25;
    const connectionCount = window.innerWidth < 768 ? 10 : 20;

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        const node = document.createElement('div');
        node.className = 'node';
        node.style.left = Math.random() * 100 + '%';
        node.style.top = Math.random() * 100 + '%';
        node.style.animationDelay = Math.random() * 3 + 's';
        node.style.width = (4 + Math.random() * 6) + 'px';
        node.style.height = node.style.width;
        network.appendChild(node);
    }

    // Create connections
    for (let i = 0; i < connectionCount; i++) {
        const connection = document.createElement('div');
        connection.className = 'connection';
        connection.style.left = Math.random() * 100 + '%';
        connection.style.top = Math.random() * 100 + '%';
        connection.style.width = (30 + Math.random() * 70) + 'px';
        connection.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
        connection.style.animationDelay = Math.random() * 4 + 's';
        connection.style.opacity = 0.3 + Math.random() * 0.4;
        network.appendChild(connection);
    }
}

// تهيئة الموقع
function initializeApp() {
    // إنشاء الشبكة العصبية
    createNeuralNetwork();

    // إضافة مستمعي الأحداث
    setupEventListeners();

    // تحسين الأداء
    optimizePerformance();
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // مستمع لرفع الملفات بالسحب والإفلات
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }

    // مستمع لتغيير حجم النافذة
    window.addEventListener('resize', debounce(handleResize, 250));

    // مستمع للوحة المفاتيح
    document.addEventListener('keydown', handleKeyDown);
}

// Enhanced drag handlers with better visual feedback
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
    console.log('📤 FILE DRAG DETECTED!');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    console.log('📥 FILE DRAG LEFT AREA');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    console.log('📦 FILE DROPPED!');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        console.log('📁 PROCESSING DROPPED FILE:', files[0].name);
        analyzeImage(files[0]);
    } else {
        showError('No files detected in drop. Please try again.');
    }
}

// معالج تغيير حجم النافذة
function handleResize() {
    // إعادة إنشاء الشبكة العصبية للشاشات الصغيرة
    createNeuralNetwork();
}

// معالج لوحة المفاتيح
function handleKeyDown(e) {
    // إغلاق النافذة بالضغط على Escape
    if (e.key === 'Escape') {
        closeAnalyzer();
    }

    // فتح النافذة بالضغط على Enter أو Space
    const analyzerWindow = document.getElementById('analyzerWindow');
    if ((e.key === 'Enter' || e.key === ' ') && analyzerWindow && !analyzerWindow.classList.contains('visible')) {
        e.preventDefault();
        openAnalyzer();
    }
}

// تحسين الأداء
function optimizePerformance() {
    // تأخير تحميل الخطوط
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        });
    }

    // تحسين الصور
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.loading = 'lazy';
        });
    }
}

// دالة debounce لتحسين الأداء
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// فتح محلل الشارتات
function openAnalyzer() {
    const analyzerWindow = document.getElementById('analyzerWindow');
    if (analyzerWindow) {
        analyzerWindow.classList.add('visible');
        analyzerWindow.setAttribute('aria-hidden', 'false');

        // التركيز على النافذة
        const firstFocusable = analyzerWindow.querySelector('button, input, [tabindex]');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
}

// إغلاق محلل الشارتات
function closeAnalyzer() {
    const analyzerWindow = document.getElementById('analyzerWindow');
    if (analyzerWindow) {
        analyzerWindow.classList.remove('visible');
        analyzerWindow.setAttribute('aria-hidden', 'true');
        // Add a small delay before resetting to allow transition to complete
        setTimeout(() => {
            resetAnalyzer();
        }, 300); // Match CSS transition duration
    }
}

// إعادة تعيين المحلل
function resetAnalyzer() {
    if (analysisInProgress) return;

    // إظهار منطقة الرفع وإخفاء الباقي
    const uploadArea = document.getElementById('uploadArea');
    const analysisArea = document.getElementById('analysisArea');
    const resultsArea = document.getElementById('resultsArea');

    if (uploadArea) uploadArea.style.display = 'block';
    if (analysisArea) analysisArea.style.display = 'none';
    if (resultsArea) resultsArea.style.display = 'none';

    // إزالة تأثير الاختفاء
    if (resultsArea) {
        resultsArea.classList.remove('fade-out');
        resultsArea.style.position = 'static';
    }

    // إزالة عنصر العد التنازلي إن وجد
    const countdownOverlay = document.querySelector('.countdown-overlay');
    if (countdownOverlay) {
        countdownOverlay.remove();
    }

    // إعادة تعيين الخطوات
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById('step' + i);
        if (step) step.classList.remove('active');
    }

    const progressFill = document.getElementById('progressFill');
    if (progressFill) progressFill.style.width = '0%';

    // مسح بيانات الصورة
    clearImageData();

    console.log('🔄 تم إعادة تعيين المحلل');
}

// Function to automatically hide recommendations after 3 seconds
function autoHideRecommendations() {
    const resultsArea = document.getElementById('resultsArea');
    if (!resultsArea || resultsArea.style.display === 'none') return;

    // Create countdown overlay
    const countdownOverlay = document.createElement('div');
    countdownOverlay.className = 'countdown-overlay';
    countdownOverlay.innerHTML = `
        <div class="countdown-text">
            <div>Recommendation will disappear in</div>
            <div class="countdown-number">3</div>
            <div>seconds</div>
        </div>
    `;
    resultsArea.style.position = 'relative';
    resultsArea.appendChild(countdownOverlay);

    let count = 3;
    const countdownNumber = countdownOverlay.querySelector('.countdown-number');
    
    const countdownInterval = setInterval(() => {
        count--;
        if (countdownNumber) {
            countdownNumber.textContent = count;
        }
        
        if (count <= 0) {
            clearInterval(countdownInterval);
            // Add fade-out effect
            resultsArea.classList.add('fade-out');
            setTimeout(() => {
                if (resultsArea) {
                    resultsArea.style.display = 'none';
                    resultsArea.classList.remove('fade-out');
                    resultsArea.style.position = 'static';
                }
                if (countdownOverlay && countdownOverlay.parentElement) {
                    countdownOverlay.remove();
                }
                // Reset analyzer to show upload area again
                resetAnalyzer();
            }, 500); // Match CSS transition duration
        }
    }, 1000);
}

// مسح بيانات الصورة
function clearImageData() {
    if (currentImageURL) {
        URL.revokeObjectURL(currentImageURL);
        currentImageURL = null;
    }

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

// Enhanced image analysis function
function analyzeImage(file) {
    if (!file || analysisInProgress) {
        console.log('⚠️ ANALYSIS BLOCKED: No file or analysis in progress');
        return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
        showError('❌ Unsupported file format. Please upload JPG, PNG, WEBP, or BMP images only.');
        return;
    }

    // Validate file size (less than 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('❌ File too large. Please upload an image smaller than 10MB.');
        return;
    }

    console.log('🚀 STARTING PROFESSIONAL ANALYSIS');
    console.log('📁 File uploaded:', {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type
    });

    analysisInProgress = true;

    // Store image URL temporarily
    currentImageURL = URL.createObjectURL(file);

    // Hide upload area and show analysis
    const uploadArea = document.getElementById('uploadArea');
    const analysisArea = document.getElementById('analysisArea');

    if (uploadArea) uploadArea.style.display = 'none';
    if (analysisArea) analysisArea.style.display = 'block';

    // Start professional analysis
    performAdvancedAnalysis(file);

    // Show success notification
    showSuccess(`✅ File "${file.name}" uploaded successfully! Analysis starting...`);
}

// Enhanced success display with professional styling
function showSuccess(message) {
    console.log('✅ SUCCESS:', message);

    // Remove any existing success displays
    const existingSuccess = document.querySelector('.success-notification');
    if (existingSuccess) existingSuccess.remove();

    // Create professional success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="success-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(successDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 3000);
}

// Enhanced error display with professional styling
function showError(message) {
    console.error('❌ ERROR:', message);

    // Remove any existing error displays
    const existingError = document.querySelector('.error-notification');
    if (existingError) existingError.remove();

    // Create professional error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="error-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeApp);

// Function to make recommendations disappear after 3 seconds
function autoHideRecommendations() {
    const resultsArea = document.getElementById('resultsArea');
    if (!resultsArea || resultsArea.style.display === 'none') return;

    // Create countdown overlay
    const countdownOverlay = document.createElement('div');
    countdownOverlay.className = 'countdown-overlay';
    countdownOverlay.innerHTML = `
        <div class="countdown-text">
            <div>Recommendation will disappear in</div>
            <div class="countdown-number">3</div>
            <div>seconds</div>
        </div>
    `;
    resultsArea.style.position = 'relative';
    resultsArea.appendChild(countdownOverlay);

    let count = 3;
    const countdownNumber = countdownOverlay.querySelector('.countdown-number');
    
    const countdownInterval = setInterval(() => {
        count--;
        if (countdownNumber) {
            countdownNumber.textContent = count;
        }
        
        if (count <= 0) {
            clearInterval(countdownInterval);
            // Add fade-out effect
            resultsArea.classList.add('fade-out');
            setTimeout(() => {
                if (resultsArea) {
                    resultsArea.style.display = 'none';
                    resultsArea.classList.remove('fade-out');
                    resultsArea.style.position = 'static';
                }
                if (countdownOverlay && countdownOverlay.parentElement) {
                    countdownOverlay.remove();
                }
                // Reset analyzer to show upload area again
                resetAnalyzer();
            }, 500); // Match CSS transition duration
        }
    }, 1000);
}

// Override for startResultsCountdown function
function startResultsCountdown() {
    // Start 3-second countdown to hide recommendations
    setTimeout(() => {
        if (typeof autoHideRecommendations === 'function') {
            autoHideRecommendations();
        }
    }, 3000);
}

// تصدير الدوال للاستخدام العام
window.openAnalyzer = openAnalyzer;
window.closeAnalyzer = closeAnalyzer;
window.resetAnalyzer = resetAnalyzer;
window.analyzeImage = analyzeImage;
window.initRecommendationCountdown = initRecommendationCountdown;