# PromptGuard Chrome Extension

A minimal Chrome browser extension that detects and masks Personally Identifiable Information (PII) in user inputs across all web pages. This extension uses Groq's LLM API to analyze text and automatically replace PII with asterisks (***).

## Features

- **Universal PII Detection**: works on all websites including Gmail, chat applications, forms, and more
- **Real-time Analysis**: automatically processes text after 1 second pause in typing
- **AI-Powered**: uses Groq's LLM for accurate PII detection with comprehensive prompt engineering
- **Privacy**: masks sensitive information before it's submitted
- **Minimal Design**: no UI (user interface), no popup, no configuration needed, it works immediately
- **Simple code structure**: it is designed to have a low-code structure but still reachs the objectives

## Protected Information Types

The extension uses a comprehensive AI prompt to detect and mask:

- Full names (first name + last name combinations)
- Email addresses  
- Phone numbers (any format)
- Home/work addresses (including partial addresses with street names)
- Birth dates and places of birth
- Credit card numbers, IBAN, bank account numbers
- Social Security Numbers, Tax ID numbers, passport numbers
- Driver's license numbers
- Government ID numbers
- Medical record numbers, patient IDs
- Student ID numbers, employee ID numbers
- Usernames that could identify someone
- IP addresses, MAC addresses
- Any other information that could identify a specific person

## Installation

1. **Download the Extension**:
   - Download or clone this repository
   - The API key is already included for demonstration purposes

2. **Install in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the extension folder
   - The extension is now active (no icon appears - it works silently)

3. **Test the Extension**:
   - Go to any website with text inputs
   - Type: "Hi, my name is Sarah Johnson, email sarah@company.com"
   - Wait 1 second after stopping typing
   - Watch the PII get automatically replaced with ***


## Technical Details

### Files Structure
```
PromptGuard/
├── manifest.json      # extension configuration
├── background.js      # AI communication function
└── content.js         # text monitoring functions
```

### How It Works

1. **Content Script Injection**: the extension injects simple monitoring functions into every webpage
2. **Input Detection**: monitors all text inputs, textareas, and contenteditable elements
3. **Debounced Analysis**: waits 1 second after typing stops, then sends text to Groq's LLM API
4. **Real-time Masking**: replaces detected PII with asterisks using comprehensive AI prompt
5. **Silent Operation**: works transparently without user interface or notifications

## manifest.json
The *manifest.json* file is the configuration file for Chrome extensions. It defines permissions, scripts, and metadata for the PromptGuard extension.
- **manifest_version: 3** -> declares this as a Chrome Extension Manifest V3 (the latest standard) and ensures compatibility with modern Chrome extension APIs and security requirements
- **name:** -> the display name shown in Chrome Extensions page, this is what users see when they install or manage the extension
- **version:** -> version number for tracking updates and releases. Format: MAJOR.MINOR.PATCH (1.0.0 = first stable release)
- **description:** -> brief explanation shown in Chrome Extensions page, tells what the extension does and its main purpose
- **permissions:** -> minimal permissions for security and privacy *activeTab:* access to currently active browser tab content; *scripting:* inject scripts into web pages for PII detection
-**host permissions:** allow extension to run on every website for PII protection
- https://*/** - access to all HTTPS websites (secure sites)
- http://*/** - access to all HTTP websites (non-secure sites)
- **service worker** -> service worker is the Manifest V3 way to handle background tasks, points to background.js file, background script runs to handle API calls to Groq LLM
- **content scripts**
- **matches: ["<all_urls>"]** -> run on every website URL
- **js: ["content.js"]** -> JavaScript file for DOM manipulation and PII detection
- **run_at: "document_end"** -> execute after page DOM is fully loaded
- **all_frames: true** -> also run in iframes for complete coverage

## content.js 
The *content.js* monitors text inputs across web pages.
-*Input type detection* -> The **checkTextBox()** function provides a simple mechanism for identifying whether an HTML element is a valid text box for user input. It checks for three common types: standard <input> elements, <textarea> elements, and contentEditable regions. This ensures universal coverage of all typical text input methods. The function returns a clean Boolean value, enabling linear logic in later parts of the script.

-*Text extraction* -> The **getText()** function abstracts the text generated by the user from different element types. It uses a simple conditional: if the element is contentEditable, it accesses the textContent property; otherwise, it retrieves the value attribute. This approach guarantees compatibility across modern browsers and a wide variety of input elements, providing a unified interface for text extraction.

-*Text setting* -> The **giveBack()** function has the same logic of **getText()** but performs the inverse operation: it writes new text back into the appropriate element. By preserving the same conditional branching between contentEditable and standard input elements, it maintains consistent behavior and ensures that the masking process does not damage the original input.

-*PII Detection coordination* -> The **askBG()**, abbreviation of "ask background (to hide PII)", function represents the core coordination logic for PII detection. It first performs a length check to skip processing for very short text inputs (less than three characters) to optimize performance and reduce unnecessary API calls. It then sends the captured text to the background script via **chrome.runtime.sendMessage**, which handles the actual interaction with the remote LLM. This function also includes basic error handling to manage failed communications, ensuring that any issues do not break the user experience.

-*Input Event handling* -> The **userIsTyping()** function is responsible for managing user input events. It implements a debouncing mechanism to prevent excessive API calls: when the user types, the function waits for one second of inactivity before starting the PII detection process. This is achieved using the **clearTimeout** and **setTimeout** pattern, which efficiently manages the waiting period. This logic balances performance and responsiveness, ensuring that users do not experience unnecessary delays.

-*Event Registration* -> Finally, the script registers an input event listener on the entire webpage using **document.addEventListener**. This universal monitoring approach ensures that after any text input, regardless of where it appears on the page, the function **unserIsTyping** is called, consequently the process starts again. By leveraging event delegation, the extension only needs a single listener for real-time input monitoring.

## background.js
The variables myApiKey, which is the API key to access to LLM, and aiWebsite, which is the internet address where to put in contact with LLM, are first defined, making the configuration clear.
The function **hidePII()** is defined, this is the main function of the background. Its parameter is userText. In this section is also defined a time counter that will be used to register the response time of the LLM.

-*AI Prompt Engineering* -> The variable instructions holds a detailed prompt that guides the LLM in performing PII detection and masking. This prompt includes a list of PII categories, clear rules that instruct the AI to return only the sanitized text without any additional explanations, before and after examples show LLM exactly how to format the response and the expected behavior.

-*HTTP communication* -> The script uses the **fetch()** API to send user input to the Groq LLM endpoint over HTTPS. The request employs the POST method, which is required for the API to process text securely. The body contains the text that will be checked, the instructions, and the model that will be used. Two parameters are included temperature: 0.1 which means very focused responses as it can variate between 0 and 2, and max_tokens: 1000.

-*Response processing* -> The variable **aiAnswer** holds the text returned by the LLM. Before using this output, the script applies safety checks to ensure that the response does not contain any extra explanations or metadata. If the AI fails, the original user text is returned as a fallback. This approach protects user input while maintaining the integrity of the masking process. In the meanwhile time counter stops and gives back the full time of response by a subtraction between the actual time and the start time.

-*Error handling* -> The **.catch()** method captures any errors that may occur during the HTTP request or response processing. The script logs relevant error messages to the console using **console.log()** for debugging. It always returns the original userText if something goes wrong, ensuring that the user experience is not disrupted and no data is lost.

-*Chrome extension message handling* -> The **chrome.runtime.onMessage.addListener** function listens for messages sent by the content script running in the user’s browser tab. When a webpage sends a request the **hidePII** starts its run. The action sendReply sends back the masked text along with a success status. Finally, the return true keep connection open for response and ensures smooth communication between the browser’s content layer and the background script.


## Complete Flow

The background service worker operates independently of the web page, acting as a listener and processing PII detection. When a user types into an input field, the captured text is physically transmitted from the content script to the background worker using Chrome’s asynchronous messaging system. The background then establishes a HTTPS connection to the Groq LLM API, authenticated by the developer’s API key which is defined within the script’s environment variables. The LLM proceeds with the instructions and returns the masked text to the background, that forwards it to the content replacing the original input text

### Code Architecture

**Simple Functions**: designed specifically for low-code add-in
- 'hidePII()' in background.js -> handles AI communication with comprehensive prompt
- 'checkTextBox()' in content.js -> detects text input elements with simple name
- 'getText()'/'giveBack()' in content.js - handles different input types. gets the text from the text boxs and gives it back with maskedPII
- 'askBG()' in content.js - coordinates with background script
- 'userIsTyping()' in content.js - manages debounced input handling with traditional syntax

## Privacy and Security

- **API Key**: included in code for demonstration purposes (would use secure storage in production)
- **Data Processing**: text is only sent to Groq's API for analysis
- **No Data Retention**: the extension doesn't store or log any of your input text
- **Local Processing**: all DOM manipulation happens locally in your browser
- **Minimal Permissions**: only activeTab and scripting permissions required

## Development

### Testing
1. Load the extension in Chrome developer mode
2. Navigate to any website with text inputs
3. Type text containing PII (e.g., "My name is John Doe and my email is john@example.com")
4. Wait 1 second after stopping typing
5. Observe the automatic masking behavior

### Customization
- Modify the comprehensive PII detection prompt in `background.js`
- Edit the 1-second processing delay in `content.js`
- Add new PII categories and/or more severe rules to the AI prompt

## Pros and Cons
This extension serves as a practical demonstration of:
- **Privacy Protection Technologies**: real-world implementation of comprehensive PII detection
- **Browser Extension Development**: modern Chrome Manifest V3 architecture
- **AI Integration**: practical use of LLM APIs with robust prompt engineering
- **Cross-site Compatibility**: universal web application integration without user interface
But, at the same time it:
- Requires **internet connection** for API calls to Groq
- **Rate limits**: it dependens on Groq API availability and calls limited per second
- **1-second processing** delay is noticeable but necessary for debouncing
- **API key** is hardcoded for demonstration (not production-ready)
