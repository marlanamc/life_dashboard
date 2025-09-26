/**
 * Reactive data manager with localStorage persistence
 * Provides centralized state management with automatic persistence
 */
export class DataManager {
  constructor() {
    this.prefix = 'lifeDashboard_v2_';
    this.data = new Map();
    this.subscribers = new Map();
    this.loadFromStorage();
  }

  /**
   * Get a value from the data store
   * @param {string} key - The key to retrieve
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} The stored value or default
   */
  get(key, defaultValue = null) {
    return this.data.has(key) ? this.data.get(key) : defaultValue;
  }

  /**
   * Set a value in the data store and persist it
   * @param {string} key - The key to set
   * @param {*} value - The value to store
   */
  set(key, value) {
    const oldValue = this.data.get(key);
    this.data.set(key, value);
    this.saveToStorage(key, value);
    this.notifySubscribers(key, value, oldValue);
  }

  /**
   * Subscribe to changes on a specific key
   * @param {string} key - The key to watch
   * @param {Function} callback - Function to call when key changes
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Load all data from localStorage
   * @private
   */
  loadFromStorage() {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.prefix));

    keys.forEach((storageKey) => {
      const key = storageKey.replace(this.prefix, '');
      try {
        const value = JSON.parse(localStorage.getItem(storageKey));
        this.data.set(key, value);
      } catch (e) {
        console.warn(`Failed to parse stored data for key: ${key}`, e);
      }
    });
  }

  /**
   * Save a single key-value pair to localStorage
   * @private
   * @param {string} key - The key to save
   * @param {*} value - The value to save
   */
  saveToStorage(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save data for key: ${key}`, e);
    }
  }

  /**
   * Notify all subscribers of a key change
   * @private
   * @param {string} key - The key that changed
   * @param {*} newValue - The new value
   * @param {*} oldValue - The previous value
   */
  notifySubscribers(key, newValue, oldValue) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(newValue, oldValue, key);
        } catch (e) {
          console.error(`Subscriber callback error for key: ${key}`, e);
        }
      });
    }
  }

  /**
   * Clear all data (useful for testing or reset functionality)
   */
  clear() {
    const keys = Array.from(this.data.keys());
    keys.forEach((key) => {
      localStorage.removeItem(this.prefix + key);
    });
    this.data.clear();
  }
}
