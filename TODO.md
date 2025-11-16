# TODO - Action Recorder & Player Improvements

This document contains prioritized improvements for the Action Recorder & Player Chrome extension, organized by priority level.

---

## 🔴 Critical Priority

### Security Issues

1. **Input Validation for Uploaded JSON Files** - `popup.js:199`, `content.js:31`
   - Add JSON schema validation to prevent malicious payloads
   - Sanitize all user-provided values before execution
   - Validate action types against whitelist
   - Implement size limits for uploaded files

2. **XSS Vulnerability in Element Text Handling** - `content.js:163-167`, `popup.js:83`
   - Sanitize element text content before display
   - Use textContent instead of innerHTML where possible
   - Escape special characters in trace logs

3. **Reduce Extension Permissions** - `manifest.json:6-15`
   - Remove unused `debugger` permission
   - Remove unused `clipboardWrite` permission
   - Scope `host_permissions` more narrowly if possible
   - Add justification comments for each permission

4. **Storage State Security** - `content.js:764-786`
   - Encrypt sensitive data before storing
   - Don't expose cookies directly (document.cookie is limited anyway)
   - Add warning about security implications
   - Consider using chrome.cookies API instead

### Code Quality

5. **Error Handling and Recovery** - Throughout codebase
   - Add try-catch blocks around all chrome API calls
   - Implement proper error recovery strategies
   - Add user-friendly error messages
   - Log errors systematically for debugging

6. **Memory Leaks** - `content.js:3-5`
   - Implement bounds for traceLog array (e.g., max 1000 entries)
   - Implement bounds for screenshots array
   - Clear data after export
   - Add cleanup on extension disable/reload

---

## 🟠 High Priority

### Functionality Improvements

7. **Robust Element Selection** - `content.js:366-430`
   - Add Shadow DOM support
   - Improve iframe handling with better error messages
   - Implement retry logic with exponential backoff
   - Add element caching to improve performance

8. **Action Validation Before Playback** - `popup.js:217-243`
   - Validate all actions before execution starts
   - Check for required fields based on action type
   - Verify selectors exist on current page
   - Show validation errors to user

9. **Tab Management Error Handling** - `background.js:24-44`, `content.js:294-323`
   - Handle cases where tab is closed during playback
   - Add timeout for tab operations
   - Verify tab exists before operations
   - Add better error messages

10. **Playback Controls Enhancement** - `content.js:19-28`
    - Add pause/resume functionality
    - Add step-by-step execution mode
    - Allow skipping to specific action
    - Add playback speed control

### Performance Optimization

11. **Optimize Element Finding** - `content.js:366-430`
    - Cache element lookups during playback
    - Use more efficient query strategies
    - Parallelize multiple strategy attempts
    - Add performance metrics

12. **Replace Polling with MutationObserver** - `content.js:607-645`
    - Use MutationObserver for waitForElement
    - Use IntersectionObserver for waitForVisible
    - Reduce CPU usage during waits
    - Make waits more responsive

13. **Debounce User Inputs** - `popup.js:194-215`
    - Add debouncing to delay input changes
    - Prevent multiple rapid file uploads
    - Improve UI responsiveness

### Testing

14. **Add Unit Tests**
    - Test utility functions (sleep, findElement, getActionDescription)
    - Test assertion functions
    - Test element selection strategies
    - Target 80%+ code coverage

15. **Add Integration Tests**
    - Test complete workflows (inspect → download → upload → play)
    - Test all action types
    - Test error scenarios
    - Use test pages with known structure

---

## 🟡 Medium Priority

### Code Architecture

16. **Refactor executeAction Function** - `content.js:83-335`
    - Break down 250+ line function into smaller handlers
    - Create action handler classes/objects
    - Use strategy pattern for different action types
    - Improve maintainability and testability

17. **Extract Magic Numbers to Constants** - Throughout codebase
    - Create constants file for timeouts
    - Define default delays
    - Define max array sizes
    - Define viewport/scroll constants

18. **Implement Centralized Logging** - Throughout codebase
    - Replace console.log with logging utility
    - Add log levels (debug, info, warn, error)
    - Make logs toggleable via settings
    - Format logs consistently

19. **State Management Improvement** - `content.js:1-6`, `popup.js:1-3`
    - Centralize state in single object
    - Add state validation
    - Implement state persistence
    - Use proper encapsulation

20. **Add TypeScript**
    - Convert all .js files to .ts
    - Define interfaces for actions, elements, metadata
    - Add type checking to build process
    - Improve IDE autocomplete and error detection

### User Experience

21. **Add Progress Indicator** - `popup.html:33-41`
    - Show progress bar during playback
    - Display current action number/total
    - Show estimated time remaining
    - Allow cancellation during playback

22. **In-Extension Action Editor** - `popup.html`
    - Allow editing actions without downloading/uploading
    - Provide UI for adding/removing actions
    - Visual action sequence builder
    - Real-time validation

23. **Action Preview** - `popup.js:217`
    - Show what will be executed before playback
    - Highlight elements that will be interacted with
    - Estimate execution time
    - Warn about potentially destructive actions

24. **Better Error Messages** - Throughout codebase
    - Provide actionable error messages
    - Include troubleshooting suggestions
    - Link to documentation
    - Show element selection alternatives

25. **Keyboard Shortcuts** - `popup.html`
    - Add shortcuts for common actions (Ctrl+I for inspect, etc.)
    - Improve accessibility
    - Show shortcut hints in UI

### Functionality Additions

26. **Conditional Execution** - `content.js:103`
    - Add if/then/else logic to actions
    - Support conditional branches based on element state
    - Enable/disable actions based on conditions
    - Add assertion-based routing

27. **Loop Support** - `content.js:49-80`
    - Add repeat functionality for actions
    - Support while loops based on conditions
    - Add forEach for dynamic element lists
    - Prevent infinite loops with max iterations

28. **Variable Substitution** - `content.js:146-169`
    - Allow defining variables in actions
    - Support variable interpolation in values
    - Extract data from page into variables
    - Enable data-driven testing

29. **Network Request Monitoring** - New feature
    - Capture network requests during playback
    - Add to trace log
    - Support request/response mocking
    - Enable API testing

30. **Enhanced Screenshot Support** - `content.js:244-253`
    - Add element-specific screenshots
    - Support full-page screenshots
    - Add screenshot comparison
    - Store in IndexedDB instead of memory

---

## 🟢 Low Priority

### Documentation

31. **Add JSDoc Comments** - Throughout codebase
    - Document all functions
    - Document parameters and return values
    - Add usage examples
    - Generate API documentation

32. **Create Contributing Guidelines** - New file
    - Document code style
    - Explain project structure
    - Provide PR template
    - Add development setup instructions

33. **Add CHANGELOG.md** - New file
    - Document version history
    - Follow Keep a Changelog format
    - Link to commits/PRs
    - Categorize changes

34. **Improve README** - `README.md`
    - Add troubleshooting section
    - Add FAQ section
    - Include video demos
    - Add screenshots of UI

### Development Infrastructure

35. **Add Package.json and Build System** - New files
    - Add npm/yarn for dependency management
    - Add webpack/rollup for bundling
    - Minify production builds
    - Add source maps

36. **Add Linting Configuration** - New files
    - Add ESLint with recommended rules
    - Add Prettier for code formatting
    - Add pre-commit hooks
    - Enforce code style

37. **CI/CD Pipeline** - New files
    - Add GitHub Actions workflow
    - Run tests on every PR
    - Build extension on release
    - Auto-publish to Chrome Web Store

38. **Add Issue Templates** - `.github/` folder
    - Bug report template
    - Feature request template
    - Question template
    - Pull request template

### Code Improvements

39. **Reduce Code Duplication** - `content.js:338-364`, `popup.js:105-154`
    - Extract common element finding logic
    - Create shared utilities module
    - DRY up selector generation
    - Share constants between files

40. **Improve Accessibility** - `popup.html`, `popup.css`
    - Add ARIA labels to all buttons
    - Implement keyboard navigation
    - Add focus indicators
    - Test with screen readers
    - Support high contrast mode

41. **Better Focus Management** - `content.js:282-292`
    - Track and restore focus after playback
    - Handle focus traps
    - Improve tab order
    - Add focus debugging tools

42. **Optimize Inspector Performance** - `popup.js:51-155`
    - Limit number of elements inspected
    - Add pagination for large pages
    - Filter out noise elements
    - Add progress indicator for slow pages

### Feature Enhancements

43. **Action Templates Library** - New feature
    - Provide common action sequences
    - Login flow template
    - Form filling template
    - Scraping template
    - Allow saving custom templates

44. **Export to Playwright/Puppeteer** - New feature
    - Convert actions to Playwright test code
    - Convert actions to Puppeteer test code
    - Generate runnable test files
    - Support both JavaScript and TypeScript

45. **Real-time Click-to-Record Mode** - New feature
    - Record actions as user performs them
    - Auto-generate action JSON
    - Edit during recording
    - Visual feedback during recording

46. **Multi-Window Support** - `background.js:24-50`
    - Support actions across multiple windows
    - Track window state
    - Switch between windows
    - Coordinate multi-window workflows

47. **Video Recording** - New feature
    - Record screen during playback
    - Export as MP4/WebM
    - Include in trace log
    - Useful for bug reports/demos

48. **Performance Metrics** - New feature
    - Measure action execution time
    - Track page load times
    - Monitor memory usage
    - Export performance data

49. **Import/Export Settings** - New feature
    - Export extension settings
    - Import settings from file
    - Share configurations
    - Backup/restore preferences

50. **Collaborative Features** - New feature
    - Share action sequences
    - Cloud storage for actions
    - Team libraries
    - Version control for actions

---

## Implementation Notes

### Quick Wins (Easy + High Impact)
- #3: Reduce Extension Permissions
- #5: Error Handling and Recovery
- #17: Extract Magic Numbers to Constants
- #24: Better Error Messages
- #39: Reduce Code Duplication

### High Impact (Harder but Worth It)
- #1: Input Validation for Uploaded JSON Files
- #7: Robust Element Selection
- #12: Replace Polling with MutationObserver
- #16: Refactor executeAction Function
- #20: Add TypeScript

### Foundation for Future Features
- #20: Add TypeScript (enables better tooling)
- #35: Add Package.json and Build System (enables modern dev workflow)
- #14-15: Add Tests (enables confident refactoring)
- #18: Implement Centralized Logging (enables debugging)

---

## Priority Summary

- **Critical (6 items)**: Security and critical bugs that need immediate attention
- **High (9 items)**: Important features and improvements that significantly impact usability
- **Medium (24 items)**: Quality improvements and nice-to-have features
- **Low (11 items)**: Polish, documentation, and future enhancements

**Total: 50 improvement items**

---

*Last Updated: 2025-11-16*
