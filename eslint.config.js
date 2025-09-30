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
        setInterval: 'readonly',
        clearInterval: 'readonly',
        MutationObserver: 'readonly',
        fetch: 'readonly',
        Date: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        navigator: 'readonly',
        Event: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        structuredClone: 'readonly',
        // Service Worker globals
        self: 'readonly',
        caches: 'readonly',
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
