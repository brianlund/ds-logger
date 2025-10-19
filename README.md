# DreamingSpanish Logger Extension

A Chrome extension that adds "Log to DS" buttons to YouTube videos, allowing you to easily track your language learning progress on DreamingSpanish.com.

## Development

### Setup
```bash
npm install
```

### Testing
```bash
npm test          # Run all tests
npm run test:watch # Run tests in watch mode
```

### Linting
```bash
npm run lint      # Check code quality
```

### Build & Package
```bash
npm run build     # Run tests and linting
npm run package   # Create distribution ZIP
```

## Features

- ✅ Adds "Log to DS" buttons to YouTube videos and shorts
- ✅ Automatically detects video duration and metadata
- ✅ Automatically logs videos with metadata
- ✅ Works on YouTube search results, history, and recommendations
- ✅ Clean, unobtrusive UI that matches YouTube's design

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder

## Setup

1. Click the extension icon in Chrome
2. Get your Bearer token from DreamingSpanish.com (check network requests)
3. Paste the token into the extension popup
4. Click "Save Token"

## Usage

1. Browse YouTube for language learning content
2. Look for "Log to DS" buttons next to video titles
3. Click the button to automatically log the video to your DreamingSpanish account
4. The button will show ✓ when successfully logged

## Notes

- Currently works with DreamingSpanish's existing API
- Extension is language-agnostic and ready for future language additions

## Version

Current version: 1.2