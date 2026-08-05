# Dreaming Spanish/French Logger Extension

A Chrome extension that adds "Log to DS" or "Log to DF" buttons to YouTube videos, allowing you to easily track your language learning progress on dreaming.com.
You can select either Spanish or French in the options, the default is Spanish.

## Development

### Available Commands
```bash
make install      # Install dependencies
make test         # Run tests only
make lint         # Run linting only  
make validate     # Run tests and linting
make package      # Build and create ZIP
make clean        # Remove generated files
```

## What it does

- Adds "Log to DS/DF" buttons to YouTube videos
- Uses the Dreaming.com inspectExternalVideo to extract video duration and metadata

## Installation

Install the extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/dreaming-logger/nkbiabkpjehnckfpjpidljhhdlcdnmjm)

To install from source:

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the src folder

## Configuration

The extension will try and extract the bearer token for api.dreaming.com from local storage (you need to have an account on dreaming.com account and be logged in for the token to exist), but if it fails, you can click the extension icon and add it manually. The easiest is if you install the extension, then go to dreaming.com and login or refresh the page. 

## Usage

1. Get input on YouTube
2. Go to the history page
3. Click the button that says Log to DS / DF
4. Get more input
   
