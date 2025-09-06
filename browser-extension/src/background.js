// Background script for VibeScope browser extension

const VIBESCOPE_API = 'https://vibescope.vercel.app';
const DEV_API = 'http://localhost:3000';

// Use dev API if available
let apiUrl = VIBESCOPE_API;

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyze-selection',
    title: 'Analyze with VibeScope',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'check-manipulation',
    title: 'Check for Manipulation',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'analyze-page',
    title: 'Analyze Entire Page',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyze-selection' || info.menuItemId === 'check-manipulation') {
    const selectedText = info.selectionText;
    if (selectedText) {
      analyzeText(selectedText, tab.id);
    }
  } else if (info.menuItemId === 'analyze-page') {
    // Send message to content script to extract page content
    chrome.tabs.sendMessage(tab.id, { action: 'extract-page-content' });
  }
});

// Analyze text function
async function analyzeText(text, tabId) {
  try {
    // Determine if it's a sentence or word
    const isSentence = text.split(' ').length > 2;
    const endpoint = isSentence 
      ? `${apiUrl}/api/vibe/analyze-sentence?text=${encodeURIComponent(text)}`
      : `${apiUrl}/api/vibe?term=${encodeURIComponent(text)}`;

    // Show loading state
    chrome.tabs.sendMessage(tabId, {
      action: 'show-loading',
      text: text
    });

    // Fetch analysis
    const response = await fetch(endpoint);
    const data = await response.json();

    // Send results to content script
    chrome.tabs.sendMessage(tabId, {
      action: 'show-results',
      text: text,
      data: data,
      type: isSentence ? 'sentence' : 'word'
    });

    // Store in history
    saveToHistory(text, data, isSentence ? 'sentence' : 'word');

  } catch (error) {
    console.error('Analysis error:', error);
    chrome.tabs.sendMessage(tabId, {
      action: 'show-error',
      error: error.message
    });
  }
}

// Save to history
function saveToHistory(text, data, type) {
  chrome.storage.local.get(['history'], (result) => {
    const history = result.history || [];
    history.unshift({
      text: text.slice(0, 100),
      type: type,
      data: data,
      timestamp: new Date().toISOString(),
      manipulationScore: data.propaganda?.overallManipulation
    });
    
    // Keep only last 50 items
    if (history.length > 50) {
      history.pop();
    }
    
    chrome.storage.local.set({ history });
  });
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze-text') {
    analyzeText(request.text, sender.tab.id);
  } else if (request.action === 'open-vibescope') {
    chrome.tabs.create({
      url: `${apiUrl}?q=${encodeURIComponent(request.text)}&type=${request.type}`
    });
  } else if (request.action === 'get-history') {
    chrome.storage.local.get(['history'], (result) => {
      sendResponse(result.history || []);
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'clear-history') {
    chrome.storage.local.set({ history: [] });
    sendResponse({ success: true });
  }
});

// Check API availability on startup
fetch(`${DEV_API}/api/health`)
  .then(response => {
    if (response.ok) {
      apiUrl = DEV_API;
      console.log('Using development API');
    }
  })
  .catch(() => {
    console.log('Using production API');
  });