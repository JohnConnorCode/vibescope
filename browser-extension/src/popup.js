// Popup script for VibeScope browser extension

// DOM elements
const analyzePageBtn = document.getElementById('analyze-page');
const analyzeSelectionBtn = document.getElementById('analyze-selection');
const textInput = document.getElementById('text-input');
const analyzeInputBtn = document.getElementById('analyze-input');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  loadInsights();
  setupEventListeners();
});

// Event listeners
function setupEventListeners() {
  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });

  // Analyze page button
  analyzePageBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'extract-page-content' });
    window.close();
  });

  // Analyze selection button
  analyzeSelectionBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script to get selection
    chrome.tabs.sendMessage(tab.id, { action: 'get-selection' }, (response) => {
      if (response && response.text) {
        chrome.runtime.sendMessage({
          action: 'analyze-text',
          text: response.text
        });
        window.close();
      } else {
        showToast('Please select some text first');
      }
    });
  });

  // Analyze input button
  analyzeInputBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text) {
      chrome.runtime.sendMessage({
        action: 'analyze-text',
        text: text
      });
      textInput.value = '';
      showToast('Analysis started!');
      setTimeout(() => {
        loadHistory();
      }, 2000);
    }
  });

  // Clear history button
  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all analysis history?')) {
      chrome.runtime.sendMessage({ action: 'clear-history' }, () => {
        loadHistory();
        loadInsights();
        showToast('History cleared');
      });
    }
  });

  // Enter key in textarea
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      analyzeInputBtn.click();
    }
  });
}

// Switch tabs
function switchTab(tabName) {
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  tabPanels.forEach(panel => {
    const panelName = panel.id.replace('-tab', '');
    panel.classList.toggle('active', panelName === tabName);
  });
}

// Load history
function loadHistory() {
  chrome.runtime.sendMessage({ action: 'get-history' }, (history) => {
    if (!history || history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5">
            <path d="M12 2v20M2 12h20"></path>
          </svg>
          <p>No analysis history yet</p>
          <small>Select text on any page and analyze it</small>
        </div>
      `;
      return;
    }

    historyList.innerHTML = history.map(item => {
      const date = new Date(item.timestamp);
      const timeAgo = getTimeAgo(date);
      const scoreClass = item.manipulationScore > 70 ? 'score-high' : 
                         item.manipulationScore > 40 ? 'score-medium' : 
                         'score-low';
      
      return `
        <div class="history-item" data-text="${encodeURIComponent(item.text)}" data-type="${item.type}">
          <div class="history-text">${item.text}</div>
          <div class="history-meta">
            <span>${timeAgo}</span>
            ${item.manipulationScore ? 
              `<span class="history-score ${scoreClass}">${Math.round(item.manipulationScore)}%</span>` : 
              `<span style="color: #a855f7">${item.type}</span>`
            }
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers to history items
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const text = decodeURIComponent(item.dataset.text);
        const type = item.dataset.type;
        chrome.runtime.sendMessage({
          action: 'open-vibescope',
          text: text,
          type: type
        });
      });
    });
  });
}

// Load insights
function loadInsights() {
  chrome.runtime.sendMessage({ action: 'get-history' }, (history) => {
    if (!history) return;

    const totalAnalyses = history.length;
    const manipulationScores = history
      .filter(item => item.manipulationScore !== undefined)
      .map(item => item.manipulationScore);
    
    const avgManipulation = manipulationScores.length > 0
      ? Math.round(manipulationScores.reduce((a, b) => a + b, 0) / manipulationScores.length)
      : 0;
    
    const highRisk = manipulationScores.filter(score => score > 70).length;

    document.getElementById('total-analyses').textContent = totalAnalyses;
    document.getElementById('avg-manipulation').textContent = `${avgManipulation}%`;
    document.getElementById('high-risk').textContent = highRisk;
  });
}

// Get time ago string
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(124, 58, 237, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 1000;
    animation: slideUp 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-in';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideDown {
    from {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    to {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);