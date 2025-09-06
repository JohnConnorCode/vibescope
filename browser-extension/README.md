# VibeScope Browser Extension

Instantly analyze any text on the web for manipulation, propaganda, and semantic patterns.

## Features

- **Right-click Analysis**: Select any text on a webpage and analyze it via context menu
- **Popup Interface**: Quick access to analyze text or view history
- **Real-time Results**: See manipulation scores and semantic analysis overlays
- **Keyboard Shortcut**: Press Alt+V to analyze selected text
- **History Tracking**: Keep track of your recent analyses

## Installation (Developer Mode)

### Step 1: Generate Icons
1. Open `generate-icons.html` in your browser
2. Click each canvas to download the icon
3. Save them in the `assets/` folder with these names:
   - icon-16.png
   - icon-32.png
   - icon-48.png
   - icon-128.png

### Step 2: Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder from this repository
5. The extension should now appear in your extensions list

### Step 3: Pin the Extension
1. Click the puzzle piece icon in Chrome's toolbar
2. Find "VibeScope" in the list
3. Click the pin icon to keep it visible

## How to Use

### Analyze Selected Text
1. Select any text on a webpage
2. Right-click and choose "Analyze with VibeScope"
3. View results in the overlay that appears

### Use the Popup
1. Click the VibeScope extension icon
2. Either:
   - Paste text to analyze
   - Click "Analyze Selected Text" after selecting text on the page
3. View your history of recent analyses

### Keyboard Shortcut
- Select text and press `Alt+V` to quickly analyze

## Features in Detail

### Manipulation Detection
- Analyzes headlines, tweets, and sentences for propaganda techniques
- Shows manipulation score (0-100%)
- Lists detected manipulation techniques

### Semantic Analysis
- For single words or short phrases
- Shows semantic dimensions and values
- Reveals hidden connotations and associations

### History
- Keeps last 50 analyses
- Shows timestamp and manipulation scores
- Click any item to open full analysis in VibeScope app

## Privacy

- All analyses are performed via the VibeScope API
- No personal data is collected
- History is stored locally in your browser
- Clear history anytime from the extension popup

## Development

### File Structure
```
browser-extension/
├── manifest.json          # Extension configuration
├── src/
│   ├── background.js     # Service worker
│   ├── content.js        # Content script for page interaction
│   ├── popup.html        # Extension popup UI
│   ├── popup.js          # Popup functionality
│   ├── popup.css         # Popup styles
│   └── styles.css        # Overlay styles
└── assets/
    └── icon-*.png        # Extension icons
```

### API Endpoints
- Production: `https://vibescope.vercel.app`
- Development: `http://localhost:3000`

The extension automatically uses the dev API if available.

## Troubleshooting

### Extension Not Working?
1. Check that you're on a regular webpage (not chrome:// pages)
2. Reload the extension from chrome://extensions
3. Check the console for errors (right-click popup > Inspect)

### Analysis Not Showing?
1. Make sure text is selected
2. Check your internet connection
3. Try refreshing the page

### Icons Not Showing?
1. Generate icons using the provided HTML file
2. Ensure all 4 icon sizes are in the assets folder
3. Reload the extension

## Future Enhancements
- [ ] Options page for customization
- [ ] Batch analysis mode
- [ ] Export history to CSV
- [ ] Dark/light theme toggle
- [ ] Custom keyboard shortcuts

## Support

For issues or questions, visit: https://vibescope.vercel.app