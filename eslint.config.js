export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        MutationObserver: 'readonly',
        fetch: 'readonly',
        Date: 'readonly',
        // Define global classes from your dashboard
        DataManager: 'readonly',
        TopThree: 'readonly',
        CapacityVisualizer: 'readonly',
        WelcomeCard: 'readonly',
      },
    },
    rules: {
      // ADHD-friendly rules - catch real errors but not nitpicky style
      'no-unused-vars': 'warn',
      'no-console': 'off', // Allow console.log for debugging
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-undef': 'error',
    },
  },
];
