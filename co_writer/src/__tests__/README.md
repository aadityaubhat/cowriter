# Co_Writer Tests

This directory contains tests for the Co_Writer application, focusing on verifying the localStorage functionality.

## Test Structure

- `utils/helpers.test.ts`: Tests for the localStorage helper functions
- `hooks/useCoWriterState.test.tsx`: Tests for the state management hook
- `components/HistorySidebar.test.tsx`: Tests for the HistorySidebar component (currently skipped)

## Running Tests

To run all tests:

```bash
npm test
```

To run a specific test file:

```bash
npm test -- src/__tests__/utils/helpers.test.ts
```

To run tests in watch mode (tests will automatically re-run when files change):

```bash
npm run test:watch
```

## Test Coverage

The tests focus on verifying the localStorage functionality, including:

1. **Availability Check**: Testing the `isLocalStorageAvailable` function to ensure it correctly detects when localStorage is available or not.

2. **Error Handling**: Verifying that the application gracefully handles errors when localStorage is unavailable or corrupted.

3. **Data Validation**: Testing that the application properly validates data before using it.

4. **Document Management**: Testing document creation, deletion, renaming, and updating.

## Troubleshooting

If you encounter issues with the tests:

1. Make sure all dependencies are installed:

   ```bash
   npm install
   ```

2. Clear Jest cache:

   ```bash
   npx jest --clearCache
   ```

3. Check for any console errors in the test output that might indicate issues with mocks or component rendering.
