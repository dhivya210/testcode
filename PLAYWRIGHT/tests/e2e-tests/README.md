# TestWise E2E Test Suite

This directory contains 42 end-to-end test cases for the TestWise application, written using Playwright.

## Test Cases Overview

### Authentication Tests (TC01-TC05)
- **TC01**: New user registration, successful login, and logout
- **TC02**: Rejection of invalid email and invalid credentials
- **TC03**: Email verification behaviour
- **TC04**: Password reset flow
- **TC05**: Guest mode flow

### Questionnaire Tests (TC06-TC10)
- **TC06**: Navigation through all twelve questions with Next button
- **TC07**: Previous button and answer persistence
- **TC08**: Required answers enforcement
- **TC09**: Project name capture and display
- **TC10**: Answer persistence across navigation

### Recommendation Tests (TC11-TC16)
- **TC11**: Tool score calculation correctness
- **TC12**: Selenium recommendation scenario
- **TC13**: Playwright recommendation scenario
- **TC14**: Testim recommendation scenario
- **TC15**: Mabl recommendation scenario
- **TC16**: Tie-breaking behaviour

### Results and Analytics Tests (TC17-TC22)
- **TC17**: Results page rendering
- **TC18**: Bar chart correctness and highlighting
- **TC19**: Pie chart distribution and labels
- **TC20**: Comparison table correctness
- **TC21**: PDF export functionality
- **TC22**: Save evaluation and verify in history

### Profile and History Tests (TC23-TC27)
- **TC23**: Profile page display
- **TC24**: History listing with metadata
- **TC25**: Reopen past evaluation
- **TC26**: Delete evaluation from history
- **TC27**: Export user data

### Chatbot Tests (TC28-TC33)
- **TC28**: Chatbot widget visibility and open/close
- **TC29**: Send message to chatbot
- **TC30**: Receive chatbot response
- **TC31**: Chatbot tool filter
- **TC32**: Chatbot backend offline handling
- **TC33**: Chatbot timeout handling

### Error Handling Tests (TC34-TC37)
- **TC34**: Validation messages for invalid input
- **TC35**: Network failure handling
- **TC36**: 404 page for invalid routes
- **TC37**: Database error handling

### Performance Tests (TC38-TC40)
- **TC38**: Page load times
- **TC39**: API response times
- **TC40**: Chatbot response latency

### Security Tests (TC41-TC42)
- **TC41**: Password hashing verification
- **TC42**: Protected routes require authentication

## Setup Instructions

### 1. Install Playwright

```bash
npm init -y
npm install -D @playwright/test
npx playwright install
```

### 2. Configure Playwright

Create a `playwright.config.js` file in the root directory:

```javascript
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3. Start the Application

Before running tests, ensure:
- Frontend server is running on `http://localhost:5173`
- Backend API server is running on `http://localhost:3001`
- RAG backend server is running on `http://localhost:8000` (for chatbot tests)

### 4. Run Tests

Run all tests:
```bash
npx playwright test
```

Run a specific test:
```bash
npx playwright test TC01-authentication-registration-login-logout.spec.js
```

Run tests in headed mode (see browser):
```bash
npx playwright test --headed
```

Run tests with UI mode:
```bash
npx playwright test --ui
```

### 5. View Test Results

View HTML report:
```bash
npx playwright show-report
```

## Test Configuration

### Base URL
All tests assume the frontend is running on `http://localhost:5173`. Update the base URL in each test file if your setup differs.

### Test Data
Tests use dynamic test data (timestamps) to avoid conflicts. Each test creates unique users and data.

### Dependencies
- Tests require the application to be running
- Some tests may require specific backend services to be available
- Chatbot tests require the RAG backend to be running

## Notes

- Some tests may skip if certain features are not available (e.g., tool filter, export functionality)
- Tests use flexible selectors to accommodate different UI implementations
- Timeout values are set appropriately for each test scenario
- Tests clean up after themselves by using unique identifiers

## Troubleshooting

1. **Tests fail with "Cannot connect"**: Ensure all servers are running
2. **Tests timeout**: Increase timeout values in test files or check network connectivity
3. **Selectors not found**: UI may have changed - update selectors in test files
4. **Database conflicts**: Tests use timestamps to avoid conflicts, but you may need to clear database between test runs

## Test Maintenance

When updating the application:
- Update selectors if UI elements change
- Adjust timeout values if operations take longer
- Update test data if requirements change
- Add new test cases for new features

