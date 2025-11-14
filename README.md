# Action Recorder & Player - Chrome Extension

A powerful Chrome extension that helps you inspect, record, and automatically replay user actions on web pages. Perfect for automated testing, demos, and repetitive task automation.

## Features

- **Element Inspection**: Automatically detect all interactive elements on a page (inputs, buttons, links, etc.)
- **Action Recording**: Export element data to a JSON file with comprehensive metadata
- **Manual Editing**: Edit the JSON file to define specific actions and sequences
- **Action Playback**: Automatically simulate user interactions with configurable delays
- **Visual Feedback**: See each action highlighted as it's performed
- **Flexible Selection**: Multiple element selection strategies (ID, CSS selector, XPath, name attribute)

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

**Action Types:**

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

**Parameters:**

- `enabled` (boolean): Whether to execute this action
- `type` (string): Type of action (click, input, select, navigate)
- `value` (string): Value for input/select actions (null for click/navigate)
- `waitAfter` (number): Milliseconds to wait after this action
- `description` (string): Optional description shown during playback

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
5. **Text Content**: Fallback for buttons/links

### Visual Feedback

During playback:
- Each element is highlighted with a red border and glow effect
- The element automatically scrolls into view
- Status messages show current progress
- Typing animation simulates natural input

### Timing Control

- **Global Delay**: Set in the popup (100ms - 10000ms)
- **Per-Action Delay**: Override with `waitAfter` in JSON
- Use longer delays for:
  - Page loads after navigation
  - AJAX requests
  - Animations
  - Complex form validation

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

- Cannot interact with `<iframe>` content from different origins
- Cannot bypass browser security restrictions
- Some complex web apps with heavy JavaScript may need special handling
- File input fields require manual interaction

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

Contributions welcome! Areas for improvement:

- Recording actions in real-time (click-to-record)
- Export to Puppeteer/Playwright scripts
- Action library/templates
- Conditional logic support
- Loop/repeat functionality
- Screenshot capture at each step

## Support

For issues, questions, or feature requests, please check the browser console for error messages and ensure your actions file is properly formatted JSON.

## Version History

### v1.0.0 (2025-11-14)
- Initial release
- Element inspection
- Action recording
- JSON export/import
- Automated playback with delays
- Visual highlighting

---

**Happy Automating!** 🚀
