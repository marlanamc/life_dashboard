/**
 * Time-Based Theme Controller
 * Automatically switches between day, afternoon, and evening themes
 */
export class ThemeController {
  constructor() {
    this.currentTheme = null;
    this.init();
  }

  init() {
    this.setInitialTheme();
    this.startThemeMonitoring();
    this.addThemeToggle();
  }

  /**
   * Determine theme based on current time
   */
  getThemeByTime() {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) {
      return 'day';
    } else if (hour >= 12 && hour < 17) {
      return 'afternoon';
    } else if (hour >= 17 && hour < 19) {
      return 'dusk';
    } else {
      return 'evening';
    }
  }

  /**
   * Apply theme to document body
   */
  applyTheme(theme) {
    if (this.currentTheme === theme) return;

    // Remove existing theme classes
    document.body.removeAttribute('data-theme');

    // Add new theme
    document.body.setAttribute('data-theme', theme);
    this.currentTheme = theme;

    // Store user preference if manually set
    if (this.manualOverride) {
      localStorage.setItem('dashboard-theme', theme);
      localStorage.setItem('dashboard-theme-manual', 'true');
    }

    this.updateThemeIndicator(theme);
    console.log(`Theme switched to: ${theme}`);
  }

  /**
   * Set initial theme based on time or user preference
   */
  setInitialTheme() {
    const savedTheme = localStorage.getItem('dashboard-theme');
    const isManual = localStorage.getItem('dashboard-theme-manual') === 'true';

    if (savedTheme && isManual) {
      this.manualOverride = true;
      this.applyTheme(savedTheme);
    } else {
      this.manualOverride = false;
      this.applyTheme(this.getThemeByTime());
    }
  }

  /**
   * Monitor time and automatically switch themes
   */
  startThemeMonitoring() {
    // Check every minute for theme changes
    setInterval(() => {
      if (!this.manualOverride) {
        const timeBasedTheme = this.getThemeByTime();
        if (timeBasedTheme !== this.currentTheme) {
          this.applyTheme(timeBasedTheme);
        }
      }
    }, 60000); // 1 minute

    // Also check every hour more precisely
    setInterval(() => {
      if (!this.manualOverride) {
        this.applyTheme(this.getThemeByTime());
      }
    }, 3600000); // 1 hour
  }

  /**
   * Add theme toggle button for manual control
   */
  addThemeToggle() {
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'theme-switcher-card';
    toggleButton.innerHTML = this.getThemeEmoji(this.currentTheme);
    toggleButton.title = 'Toggle theme';
    toggleButton.setAttribute('aria-label', 'Toggle theme');

    toggleButton.addEventListener('click', () => this.cycleTheme());

    const slot = document.getElementById('theme-toggle-slot');
    if (slot) {
      slot.innerHTML = '';
      slot.appendChild(toggleButton);
    } else {
      toggleButton.classList.add('theme-switcher-fallback');
      document.body.appendChild(toggleButton);
    }

    this.toggleButton = toggleButton;
  }

  /**
   * Get emoji for theme indicator
   */
  getThemeEmoji(theme) {
    const emojis = {
      day: '☀️',
      afternoon: '🌤️',
      dusk: '🌅',
      evening: '🌙',
    };
    return emojis[theme] || '🌟';
  }

  /**
   * Cycle through themes manually
   */
  cycleTheme() {
    const themes = ['day', 'afternoon', 'dusk', 'evening'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

    this.manualOverride = true;
    this.applyTheme(nextTheme);

    // Show temporary notification
    this.showThemeNotification(nextTheme);
  }

  /**
   * Enable automatic theme switching
   */
  enableAutoMode() {
    this.manualOverride = false;
    localStorage.removeItem('dashboard-theme-manual');
    this.applyTheme(this.getThemeByTime());
    this.showThemeNotification('auto');
  }

  /**
   * Update theme toggle button
   */
  updateThemeIndicator(theme) {
    if (this.toggleButton) {
      this.toggleButton.innerHTML = this.getThemeEmoji(theme);
      this.toggleButton.title = `Current: ${theme} theme (click to change)`;
    }
  }

  /**
   * Show theme change notification
   */
  showThemeNotification(theme) {
    const notification = document.createElement('div');
    const themeNames = {
      day: 'Day Mode',
      afternoon: 'Afternoon Mode',
      dusk: 'Dusk Mode',
      evening: 'Evening Mode',
      auto: 'Auto Mode Enabled',
    };

    notification.className = 'theme-notification';
    notification.textContent = `${this.getThemeEmoji(theme)} ${themeNames[theme]}`;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: var(--color-primary);
      color: white;
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      box-shadow: var(--shadow-medium);
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
  }

  /**
   * Get current theme info
   */
  getThemeInfo() {
    return {
      current: this.currentTheme,
      isManual: this.manualOverride,
      timeBasedTheme: this.getThemeByTime(),
    };
  }
}
