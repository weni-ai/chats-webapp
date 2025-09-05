/**
 * Utility for managing localStorage with module-specific prefixes
 * to avoid conflicts between Module Federation modules
 */

const MODULE_PREFIX = 'chats_';

class ModuleStorage {
  constructor(prefix = MODULE_PREFIX) {
    this.prefix = prefix;
  }

  /**
   * Get prefixed key
   * @param {string} key - Original key
   * @returns {string} Prefixed key
   */
  _getPrefixedKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Set item in localStorage with module prefix
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  setItem(key, value, options = { useSession: false }) {
    const prefixedKey = this._getPrefixedKey(key);
    const serializedValue =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (options.useSession) {
      sessionStorage.setItem(prefixedKey, serializedValue);
    } else {
      localStorage.setItem(prefixedKey, serializedValue);
    }
  }

  /**
   * Get item from localStorage with module prefix
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} Retrieved value
   */
  getItem(key, defaultValue = null, options = { useSession: false }) {
    const prefixedKey = this._getPrefixedKey(key);
    const value = options.useSession
      ? sessionStorage.getItem(prefixedKey)
      : localStorage.getItem(prefixedKey);

    if (value === null) {
      return defaultValue;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Remove item from localStorage with module prefix
   * @param {string} key - Storage key
   */
  removeItem(key, options = { useSession: false }) {
    const prefixedKey = this._getPrefixedKey(key);
    if (options.useSession) {
      sessionStorage.removeItem(prefixedKey);
    } else {
      localStorage.removeItem(prefixedKey);
    }
  }

  /**
   * Clear all items with this module's prefix
   */
  clear(options = { useSession: false }) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = options.useSession
        ? sessionStorage.key(i)
        : localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => {
      if (options.useSession) {
        sessionStorage.removeItem(key);
      } else {
        localStorage.removeItem(key);
      }
    });
  }
}

export const moduleStorage = new ModuleStorage();

export { ModuleStorage };

export default moduleStorage;
