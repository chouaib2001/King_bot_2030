// ملف JavaScript منفصل لتحسين الأداء
'use strict';

// متغيرات عامة
let currentImageURL = null;
let analysisInProgress = false;

// إنشاء الشبكة العصبية في الخلفية
function createNeuralNetwork() {
    const network = document.getElementById('neuralNetwork');
    if (!network) return;

    const nodeCount = window.innerWidth < 768 ? 15 : 20;

    for (let i = 0; i < nodeCount; i++) {
        const node = document.createElement('div');
        node.className = 'node';
        node.style.left = Math.random() * 100 + '%';
        node.style.top = Math.random() * 100 + '%';
        node.style.animationDelay = Math.random() * 3 + 's';
        network.appendChild(node);

        // إضافة اتصالات
        if (i > 0) {
            const connection = document.createElement('div');
            connection.className = 'connection';
            connection.style.left = Math.random() * 100 + '%';
            connection.style.top = Math.random() * 100 + '%';
            connection.style.width = Math.random() * 200 + 50 + 'px';
            connection.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
            connection.style.animationDelay = Math.random() * 4 + 's';
            network.appendChild(connection);
        }
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
    const network = document.getElementById('neuralNetwork');
    if (network && network.children.length > 0) {
        network.innerHTML = '';
        createNeuralNetwork();
    }
}

// معالج لوحة المفاتيح
function handleKeyDown(e) {
    // إغلاق النافذة بالضغط على Escape
    if (e.key === 'Escape') {
        closeAnalyzer();
    }

    // فتح النافذة بالضغط على Enter أو Space
    // Changed from style.display to style.visibility for consistency with new fade effect
    if ((e.key === 'Enter' || e.key === ' ') && document.getElementById('analyzerWindow').style.visibility === 'hidden') {
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
        analyzerWindow.style.visibility = 'visible'; // Changed from display
        analyzerWindow.style.opacity = '1'; // Added for fade effect
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
        analyzerWindow.style.opacity = '0'; // Added for fade effect
        analyzerWindow.style.visibility = 'hidden'; // Changed from display
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

    // Add success styles if not already present
    if (!document.querySelector('#successStyles')) {
        const style = document.createElement('style');
        style.id = 'successStyles';
        style.textContent = `
            .success-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, var(--success-green), #16a34a);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
                z-index: 10000;
                font-family: var(--font-family-tech);
                border: 1px solid rgba(255, 255, 255, 0.2);
                animation: successSlideIn 0.3s ease-out;
            }
            .success-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .success-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 1.2em;
                margin-left: auto;
                opacity: 0.8;
                transition: opacity 0.3s ease;
            }
            .success-close:hover {
                opacity: 1;
            }
            @keyframes successSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

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

    // Add error styles if not already present
    if (!document.querySelector('#errorStyles')) {
        const style = document.createElement('style');
        style.id = 'errorStyles';
        style.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, var(--danger-red), #b91c1c);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
                z-index: 10000;
                font-family: var(--font-family-tech);
                border: 1px solid rgba(255, 255, 255, 0.2);
                animation: errorSlideIn 0.3s ease-out;
            }
            .error-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .error-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 1.2em;
                margin-left: auto;
                opacity: 0.8;
                transition: opacity 0.3s ease;
            }
            .error-close:hover {
                opacity: 1;
            }
            @keyframes errorSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

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

// تصدير الدوال للاستخدام العام
window.openAnalyzer = openAnalyzer;
window.closeAnalyzer = closeAnalyzer;
window.resetAnalyzer = resetAnalyzer;
window.analyzeImage = analyzeImage;