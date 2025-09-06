// Content script for VibeScope browser extension

let currentOverlay = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'show-loading') {
    showLoadingOverlay(request.text);
  } else if (request.action === 'show-results') {
    showResultsOverlay(request.text, request.data, request.type);
  } else if (request.action === 'show-error') {
    showErrorOverlay(request.error);
  } else if (request.action === 'extract-page-content') {
    extractPageContent();
  } else if (request.action === 'get-selection') {
    const selectedText = window.getSelection().toString();
    sendResponse({ text: selectedText });
  }
  return true; // Keep channel open for async response
});

// Show loading overlay
function showLoadingOverlay(text) {
  removeOverlay();
  
  const overlay = createOverlay();
  overlay.innerHTML = `
    <div class="vs-header">
      <div class="vs-logo">VibeScope</div>
      <button class="vs-close">&times;</button>
    </div>
    <div class="vs-content">
      <div class="vs-loading">
        <div class="vs-spinner"></div>
        <p>Analyzing text...</p>
        <p class="vs-text-preview">"${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"</p>
      </div>
    </div>
  `;
  
  setupOverlayEvents(overlay);
}

// Show results overlay
function showResultsOverlay(text, data, type) {
  removeOverlay();
  
  const overlay = createOverlay();
  const isManipulation = type === 'sentence' && data.propaganda;
  const manipulationScore = data.propaganda?.overallManipulation || 0;
  
  let resultHTML = '';
  
  if (isManipulation) {
    const scoreClass = manipulationScore > 70 ? 'high' : manipulationScore > 40 ? 'medium' : 'low';
    const scoreText = manipulationScore > 70 ? 'High Manipulation' : 
                     manipulationScore > 40 ? 'Moderate Manipulation' : 'Low Manipulation';
    
    resultHTML = `
      <div class="vs-manipulation-score vs-score-${scoreClass}">
        <div class="vs-score-number">${Math.round(manipulationScore)}%</div>
        <div class="vs-score-label">${scoreText}</div>
      </div>
      
      ${data.propaganda.techniques && data.propaganda.techniques.length > 0 ? `
        <div class="vs-techniques">
          <h4>Detected Techniques:</h4>
          <ul>
            ${data.propaganda.techniques.map(tech => 
              `<li>${tech.replace(/([A-Z])/g, ' $1').trim()}</li>`
            ).join('')}
          </ul>
        </div>
      ` : ''}
    `;
  } else if (data.axes) {
    // Word analysis - show top semantic dimensions
    const topAxes = Object.entries(data.axes)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5);
    
    resultHTML = `
      <div class="vs-semantic-analysis">
        <h4>Semantic Dimensions:</h4>
        <div class="vs-dimensions">
          ${topAxes.map(([axis, value]) => {
            const percentage = Math.round(value * 100);
            const absPercentage = Math.abs(percentage);
            return `
              <div class="vs-dimension">
                <div class="vs-dimension-label">
                  <span>${axis.replace(/_/g, ' ')}</span>
                  <span class="vs-dimension-value">${percentage > 0 ? '+' : ''}${percentage}%</span>
                </div>
                <div class="vs-dimension-bar">
                  <div class="vs-dimension-fill" style="width: ${absPercentage}%; background: ${percentage > 0 ? '#a855f7' : '#3b82f6'}"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  overlay.innerHTML = `
    <div class="vs-header">
      <div class="vs-logo">VibeScope Analysis</div>
      <button class="vs-close">&times;</button>
    </div>
    <div class="vs-content">
      <div class="vs-text-analyzed">
        <p>"${text.slice(0, 200)}${text.length > 200 ? '...' : ''}"</p>
      </div>
      
      ${resultHTML}
      
      <div class="vs-actions">
        <button class="vs-btn vs-btn-primary" data-action="open-full">
          View Full Analysis
        </button>
        <button class="vs-btn vs-btn-secondary" data-action="copy">
          Copy Results
        </button>
        <button class="vs-btn vs-btn-secondary" data-action="share">
          Share
        </button>
      </div>
    </div>
  `;
  
  setupOverlayEvents(overlay);
  
  // Add event listeners for buttons
  overlay.querySelector('[data-action="open-full"]').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'open-vibescope',
      text: text,
      type: type
    });
    removeOverlay();
  });
  
  overlay.querySelector('[data-action="copy"]').addEventListener('click', () => {
    const resultText = isManipulation 
      ? `VibeScope Analysis: ${manipulationScore}% manipulation detected in "${text}"`
      : `VibeScope Analysis of "${text}"`;
    navigator.clipboard.writeText(resultText);
    showToast('Copied to clipboard!');
  });
  
  overlay.querySelector('[data-action="share"]').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'open-vibescope',
      text: text,
      type: type
    });
  });
}

// Show error overlay
function showErrorOverlay(error) {
  removeOverlay();
  
  const overlay = createOverlay();
  overlay.innerHTML = `
    <div class="vs-header">
      <div class="vs-logo">VibeScope</div>
      <button class="vs-close">&times;</button>
    </div>
    <div class="vs-content">
      <div class="vs-error">
        <p>⚠️ Analysis Error</p>
        <p class="vs-error-message">${error}</p>
        <button class="vs-btn vs-btn-primary" data-action="retry">Try Again</button>
      </div>
    </div>
  `;
  
  setupOverlayEvents(overlay);
}

// Create overlay element
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'vibescope-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 380px;
    max-height: 80vh;
    background: rgba(10, 10, 15, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    z-index: 999999;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(overlay);
  currentOverlay = overlay;
  return overlay;
}

// Setup overlay events
function setupOverlayEvents(overlay) {
  const closeBtn = overlay.querySelector('.vs-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', removeOverlay);
  }
  
  // Make overlay draggable
  let isDragging = false;
  let startX, startY, initialX, initialY;
  
  const header = overlay.querySelector('.vs-header');
  if (header) {
    header.style.cursor = 'move';
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = overlay.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
    });
  }
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    overlay.style.left = `${initialX + deltaX}px`;
    overlay.style.top = `${initialY + deltaY}px`;
    overlay.style.right = 'auto';
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

// Remove overlay
function removeOverlay() {
  if (currentOverlay) {
    currentOverlay.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (currentOverlay && currentOverlay.parentNode) {
        currentOverlay.parentNode.removeChild(currentOverlay);
        currentOverlay = null;
      }
    }, 300);
  }
}

// Extract page content
function extractPageContent() {
  const title = document.title;
  const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
  const h1 = document.querySelector('h1')?.textContent || '';
  const mainContent = document.querySelector('main')?.textContent || 
                     document.querySelector('article')?.textContent || 
                     document.body.textContent || '';
  
  const text = `${title} ${metaDescription} ${h1} ${mainContent}`.slice(0, 1000);
  
  chrome.runtime.sendMessage({
    action: 'analyze-text',
    text: text
  });
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'vibescope-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(124, 58, 237, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 999999;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

// Add keyboard shortcut
document.addEventListener('keydown', (e) => {
  // Alt+V to analyze selected text
  if (e.altKey && e.key === 'v') {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: 'analyze-text',
        text: selectedText
      });
    }
  }
});