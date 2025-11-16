# Action Recorder & Player - Chrome Extension

A powerful Chrome extension that helps you inspect, record, and automatically replay user actions on web pages. Perfect for automated testing, demos, and repetitive task automation.

## Features

### Core Features
- **Element Inspection**: Automatically detect all interactive elements on a page (inputs, buttons, links, etc.)
- **Accessibility Tree Inspection**: Capture ARIA roles, labels, and accessibility properties
- **Action Recording**: Export element data to a JSON file with comprehensive metadata
- **Manual Editing**: Edit the JSON file to define specific actions and sequences
- **Action Playback**: Automatically simulate user interactions with configurable delays
- **Visual Feedback**: See each action highlighted as it's performed
- **Flexible Selection**: Multiple element selection strategies (ID, CSS selector, XPath, name attribute, ARIA roles, data attributes)

### Advanced Features (Playwright-Inspired)
- **Screenshot Capture**: Take screenshots during action playback
- **Trace Recording**: Export detailed execution logs with timestamps
- **Storage State Management**: Save and restore browser localStorage/sessionStorage
- **Tab Management**: Open, close, and switch between browser tabs
- **Smart Wait Conditions**: Wait for element visibility, text content, or element presence
- **Advanced Mouse Events**: Click, double-click, right-click, hover, coordinate-based clicks
- **Advanced Keyboard Events**: Key presses with modifier keys (Ctrl, Alt, Shift)
- **Drag and Drop**: Simulate drag and drop interactions
- **File Upload**: Trigger file upload dialogs
- **Viewport Control**: Scroll to specific positions and elements
- **Assertions**: Validate element state, text, values, attributes, and classes
- **Iframe Support**: Interact with elements inside iframes
- **Focus Management**: Focus and blur elements programmatically

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the directory containing the extension files

### File Structure

```
action-recorder-player/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Popup styling
├── popup.js              # Popup logic
├── content.js            # Content script for page interaction
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── generate_icons.py     # Python script to generate icons
├── generate-icons.html   # HTML tool to generate custom icons
└── README.md            # This file
```

## Usage

### Step 1: Inspect Page Elements

1. Navigate to the web page you want to automate
2. Click the extension icon in your Chrome toolbar
3. Click **"Inspect Elements"** button
4. The extension will scan the page and find all interactive elements
5. You'll see a count of elements found

### Step 2: Download Actions File

1. Click **"Download Actions.json"** button
2. The file will be saved to your downloads folder
3. Open the file in your favorite text editor

### Step 3: Edit Actions File

The downloaded JSON file contains all detected elements. Edit it to define your automation sequence:

```json
{
  "metadata": {
    "createdAt": "2025-11-14T10:30:00.000Z",
    "url": null,
    "totalElements": 5,
    "description": "Edit this file to add actions..."
  },
  "elements": [
    {
      "index": 1,
      "tagName": "input",
      "type": "text",
      "id": "username",
      "name": "username",
      "className": "form-control",
      "text": null,
      "placeholder": "Enter username",
      "xpath": "//*[@id=\"username\"]",
      "selector": "#username",
      "enabled": true,
      "action": {
        "type": "input",
        "value": "testuser@example.com",
        "waitAfter": 1000,
        "description": "Enter username"
      }
    },
    {
      "index": 2,
      "tagName": "input",
      "type": "password",
      "id": "password",
      "name": "password",
      "className": "form-control",
      "text": null,
      "placeholder": "Enter password",
      "xpath": "//*[@id=\"password\"]",
      "selector": "#password",
      "enabled": true,
      "action": {
        "type": "input",
        "value": "SecurePassword123",
        "waitAfter": 1000,
        "description": "Enter password"
      }
    },
    {
      "index": 3,
      "tagName": "button",
      "type": "submit",
      "id": "loginBtn",
      "className": "btn btn-primary",
      "text": "Login",
      "xpath": "//*[@id=\"loginBtn\"]",
      "selector": "#loginBtn",
      "enabled": true,
      "action": {
        "type": "click",
        "value": null,
        "waitAfter": 2000,
        "description": "Click login button"
      }
    }
  ]
}
```

#### Action Configuration

For each element you want to interact with:

1. Set `"enabled": true`
2. Configure the `action` object:

**Basic Action Types:**

- **`click`**: Click the element
  ```json
  "action": {
    "type": "click",
    "value": null,
    "waitAfter": 1000,
    "description": "Click submit button"
  }
  ```

- **`input`**: Type text into an input field
  ```json
  "action": {
    "type": "input",
    "value": "text to type",
    "waitAfter": 1000,
    "description": "Enter email address"
  }
  ```

- **`select`**: Select an option in a dropdown
  ```json
  "action": {
    "type": "select",
    "value": "option_value",
    "waitAfter": 1000,
    "description": "Select country"
  }
  ```

- **`navigate`**: Click a link to navigate
  ```json
  "action": {
    "type": "navigate",
    "value": null,
    "waitAfter": 2000,
    "description": "Go to dashboard"
  }
  ```

**Advanced Mouse Actions:**

- **`rightClick`**: Right-click (context menu)
  ```json
  "action": {
    "type": "rightClick",
    "value": null,
    "waitAfter": 500
  }
  ```

- **`doubleClick`**: Double-click element
  ```json
  "action": {
    "type": "doubleClick",
    "value": null,
    "waitAfter": 500
  }
  ```

- **`hover`**: Hover over element
  ```json
  "action": {
    "type": "hover",
    "value": null,
    "waitAfter": 300
  }
  ```

- **`clickAt`**: Click at specific coordinates
  ```json
  "action": {
    "type": "clickAt",
    "coordinates": { "x": 10, "y": 20 },
    "waitAfter": 500
  }
  ```

- **`dragDrop`**: Drag and drop to target
  ```json
  "action": {
    "type": "dragDrop",
    "value": "#drop-target",
    "waitAfter": 1000
  }
  ```

**Keyboard Actions:**

- **`keyPress`**: Press a specific key
  ```json
  "action": {
    "type": "keyPress",
    "value": "Enter",
    "modifiers": { "ctrlKey": false, "altKey": false, "shiftKey": false },
    "waitAfter": 500
  }
  ```

**Wait Actions:**

- **`waitForElement`**: Wait for element to appear
  ```json
  "action": {
    "type": "waitForElement",
    "value": "#dynamic-content",
    "waitAfter": 0
  }
  ```

- **`waitForVisible`**: Wait for element to be visible
  ```json
  "action": {
    "type": "waitForVisible",
    "value": null,
    "waitAfter": 0
  }
  ```

- **`waitForText`**: Wait for specific text content
  ```json
  "action": {
    "type": "waitForText",
    "value": "Loading complete",
    "waitAfter": 0
  }
  ```

**Assertion Actions:**

- **`assert`**: Validate element state
  ```json
  "action": {
    "type": "assert",
    "assertType": "text",
    "expectedValue": "Success",
    "waitAfter": 0
  }
  ```

  Available assertion types:
  - `exists`: Element exists in DOM
  - `visible`: Element is visible
  - `text`: Element contains text
  - `value`: Input value matches
  - `attribute`: Attribute value matches (requires `attributeName`)
  - `class`: Element has CSS class

**Utility Actions:**

- **`screenshot`**: Capture screenshot
  ```json
  "action": {
    "type": "screenshot",
    "value": null,
    "waitAfter": 500
  }
  ```

- **`scroll`**: Scroll element or to position
  ```json
  "action": {
    "type": "scroll",
    "value": { "top": 500, "left": 0, "behavior": "smooth" },
    "waitAfter": 500
  }
  ```

- **`focus`**: Focus element
  ```json
  "action": {
    "type": "focus",
    "value": null,
    "waitAfter": 200
  }
  ```

- **`blur`**: Remove focus from element
  ```json
  "action": {
    "type": "blur",
    "value": null,
    "waitAfter": 200
  }
  ```

- **`uploadFile`**: Trigger file upload dialog
  ```json
  "action": {
    "type": "uploadFile",
    "value": null,
    "waitAfter": 1000
  }
  ```

**Tab Management Actions:**

- **`openTab`**: Open new browser tab
  ```json
  "action": {
    "type": "openTab",
    "value": "https://example.com",
    "active": true,
    "waitAfter": 2000
  }
  ```

- **`closeTab`**: Close tab by ID
  ```json
  "action": {
    "type": "closeTab",
    "value": "tab_id",
    "waitAfter": 500
  }
  ```

- **`switchTab`**: Switch to tab by ID
  ```json
  "action": {
    "type": "switchTab",
    "value": "tab_id",
    "waitAfter": 500
  }
  ```

**Common Parameters:**

- `enabled` (boolean): Whether to execute this action
- `type` (string): Type of action (see above)
- `value` (varies): Value for the action (type-specific)
- `waitAfter` (number): Milliseconds to wait after this action
- `description` (string): Optional description shown during playback

**Advanced Element Selection:**

Elements can also be selected using:
- `iframe`: Selector for parent iframe
- `ariaRole`: ARIA role attribute
- `ariaLabel`: ARIA label attribute
- `dataAttributes`: Object with data-* attributes
- `textContent`: Exact text content match

### Step 4: Upload and Play

1. Click **"Upload Actions.json"** in the extension popup
2. Select your edited JSON file
3. Adjust the **delay between steps** if needed (default: 1000ms)
4. Click **"Play Actions"** to start the automation
5. Watch as each action is performed with visual highlights
6. Click **"Stop"** to abort playback at any time

## Advanced Features

### Element Selection Strategy

The extension uses multiple strategies to find elements, in this order:

1. **ID**: Fastest and most reliable
2. **CSS Selector**: Flexible and powerful
3. **XPath**: Precise location-based
4. **Name Attribute**: Useful for form fields
5. **ARIA Role**: Accessibility-based selection
6. **ARIA Label**: Label-based selection
7. **Data Attributes**: Custom data attributes
8. **Text Content**: Fallback for buttons/links

### Accessibility Tree Inspection

Elements are inspected with full accessibility information:
- ARIA roles and labels
- Tabindex and focus management
- Disabled, required, and checked states
- ARIA relationships (describedby, labelledby)

This enables more robust element selection and better support for accessible web applications.

### Visual Feedback

During playback:
- Each element is highlighted with a red border and glow effect
- The element automatically scrolls into view
- Status messages show current progress
- Typing animation simulates natural input

### Timing Control

- **Global Delay**: Set in the popup (100ms - 10000ms)
- **Per-Action Delay**: Override with `waitAfter` in JSON
- **Smart Waits**: Use `waitForElement`, `waitForVisible`, `waitForText` for dynamic content
- Use longer delays for:
  - Page loads after navigation
  - AJAX requests
  - Animations
  - Complex form validation

### Trace Recording

After running actions, export a detailed trace log containing:
- Timestamp for each action
- Action type and target
- Success/failure status
- Screenshots (if captured)
- Full execution timeline

Use the "Export Trace Log" button to download the trace as JSON.

### Storage State Management

Save and restore browser state between sessions:
- **Save Storage State**: Capture current localStorage and sessionStorage
- **Load Storage State**: Restore previously saved state
- Useful for maintaining login sessions and user preferences

### Screenshot Capture

Include screenshot actions in your automation:
- Screenshots are captured and stored in the trace log
- Useful for visual regression testing
- Exported with timestamp and action context

### Iframe Support

Interact with elements inside iframes by specifying the iframe selector:
```json
{
  "iframe": "#my-iframe",
  "selector": "#button-in-iframe",
  "action": { "type": "click" }
}
```

## Tips & Best Practices

1. **Test on Simple Pages First**: Start with simple forms before tackling complex applications

2. **Use Specific Selectors**: If an element has an ID, the extension will use it automatically for reliability

3. **Incremental Building**: Add actions one at a time and test frequently

4. **Handle Dynamic Content**: For AJAX-loaded content, increase `waitAfter` delays

5. **Backup Your Actions**: Save multiple versions of your actions file for different scenarios

6. **Check Console**: Open Chrome DevTools console to see detailed action logs

## Troubleshooting

### Element Not Found

**Problem**: Action fails with "could not find element"

**Solutions**:
- Ensure the page is fully loaded before playback
- Check that the element's ID/selector hasn't changed
- Increase delay before this action
- Inspect the page again to get updated selectors

### Actions Too Fast

**Problem**: Actions execute before the page responds

**Solutions**:
- Increase global delay in the popup
- Add longer `waitAfter` for specific actions
- Use 2000-3000ms delays after clicks that trigger navigation

### Wrong Element Selected

**Problem**: Action interacts with wrong element

**Solutions**:
- Use the element's ID if available (most reliable)
- Update the CSS selector to be more specific
- Check for duplicate elements and adjust selector

### Input Not Registering

**Problem**: Text typed but form doesn't recognize it

**Solutions**:
- The extension fires both `input` and `change` events
- Some frameworks need focus/blur events
- Increase delay to let the page update

## Development

### Regenerating Icons

If you want custom icons:

**Method 1: Using the HTML Generator**
```bash
# Open generate-icons.html in your browser
# Click the download buttons for each size
# Move the downloaded files to the icons/ directory
```

**Method 2: Using Python Script**
```bash
# With PIL/Pillow installed
pip install Pillow
python3 generate_icons.py

# Without PIL (generates basic gradient icons)
python3 generate_icons.py
```

### Customizing the Extension

- **Modify Colors**: Edit `popup.css` gradient values
- **Add Actions**: Extend `executeAction()` in `content.js`
- **Change Timing**: Adjust default delays in `popup.js`
- **Add Features**: Extend the popup UI in `popup.html`

## Security & Privacy

- **No Data Collection**: All data stays local on your machine
- **No Network Requests**: Extension works entirely offline
- **No Permissions Abuse**: Only uses necessary Chrome APIs
- **Open Source**: All code is visible and auditable

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Compatible (Chromium-based)
- **Brave**: Compatible
- **Other Chromium browsers**: Should work

## Limitations

- Cannot interact with cross-origin iframes (browser security)
- Cannot bypass browser security restrictions
- Some complex web apps with heavy JavaScript may need special handling
- File upload requires user interaction (browser security requirement)
- Tab management limited to same browser window
- Screenshots only capture visible viewport

## Use Cases

- **Automated Testing**: Create test scenarios for web applications
- **Demos**: Record and replay product demonstrations
- **Form Filling**: Automate repetitive form submissions
- **Web Scraping**: Interact with paginated content
- **Training**: Create interactive tutorials
- **QA Testing**: Reproduce bug scenarios consistently

## License

This project is open source. Feel free to modify and distribute.

## Contributing

Contributions welcome! Areas for further improvement:

- Recording actions in real-time (click-to-record mode)
- Export to Puppeteer/Playwright test scripts
- Action library/templates
- Conditional logic support (if/then/else)
- Loop/repeat functionality
- Variable substitution
- Network request monitoring
- Performance metrics capture
- Multi-window support
- Video recording of full sessions

## Support

For issues, questions, or feature requests, please check the browser console for error messages and ensure your actions file is properly formatted JSON.

## Version History

### v2.0.0 (2025-11-16) - Playwright MCP Edition
Major update with Playwright-inspired features:
- Added 20+ new action types (right-click, double-click, hover, drag-drop, etc.)
- Implemented accessibility tree inspection with ARIA attributes
- Added screenshot capture during playback
- Implemented trace recording and export
- Added storage state management (save/load localStorage/sessionStorage)
- Implemented tab management (open, close, switch tabs)
- Added smart wait conditions (waitForElement, waitForVisible, waitForText)
- Implemented coordinate-based clicks
- Added keyboard events with modifier keys
- Implemented drag and drop support
- Added assertion actions (validate element state, text, values, attributes)
- Implemented iframe support
- Added focus/blur management
- Enhanced element selection with ARIA roles, labels, and data attributes
- Added viewport control (scroll)
- Comprehensive trace export with timestamps and screenshots

### v1.0.0 (2025-11-14)
- Initial release
- Element inspection
- Action recording
- JSON export/import
- Automated playback with delays
- Visual highlighting

---

**Happy Automating!** 🚀
