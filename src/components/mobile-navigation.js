/**
 * Mobile Navigation Component
 * Bottom tab navigation for mobile-first dashboard experience
 */
export class MobileNavigation {
  constructor(container, onTabChange) {
    this.container = container;
    this.onTabChange = onTabChange;
    this.currentTab = 'home'; // Default tab
    this.tabs = [
      {
        id: 'home',
        label: 'Home',
        icon: '🏠',
        description: 'Daily Snapshot'
      },
      {
        id: 'brain',
        label: 'Brain',
        icon: '🧠',
        description: 'Thoughts & Tasks'
      },
      {
        id: 'capacity',
        label: 'Capacity',
        icon: '⚡',
        description: 'Energy Planning'
      },
      {
        id: 'projects',
        label: 'Projects',
        icon: '📋',
        description: 'Project Management'
      },
      {
        id: 'calendar',
        label: 'Schedule',
        icon: '📅',
        description: 'Calendar & Events'
      }
    ];

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <nav class="mobile-nav" role="navigation" aria-label="Main navigation">
        <div class="mobile-nav-tabs">
          ${this.tabs.map(tab => `
            <button
              class="mobile-nav-tab ${tab.id === this.currentTab ? 'active' : ''}"
              data-tab="${tab.id}"
              aria-selected="${tab.id === this.currentTab}"
              role="tab"
            >
              <span class="mobile-nav-icon" aria-hidden="true">${tab.icon}</span>
              <span class="mobile-nav-label">${tab.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Mobile FAB for quick actions -->
        <button class="mobile-fab" aria-label="Quick add" title="Quick add task">
          <span aria-hidden="true">+</span>
        </button>
      </nav>

      <style>
        .mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding: env(safe-area-inset-bottom, 8px) 0 8px 0;
          z-index: 1000;
          box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
        }

        .mobile-nav-tabs {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0 16px;
          max-width: 500px;
          margin: 0 auto;
        }

        .mobile-nav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: none;
          border: none;
          color: rgba(0, 0, 0, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 12px;
          min-width: 64px;
          min-height: 44px; /* Apple touch target guidelines */
          position: relative;
        }

        .mobile-nav-tab:hover {
          background: rgba(0, 0, 0, 0.05);
          color: rgba(0, 0, 0, 0.8);
        }

        .mobile-nav-tab.active {
          color: var(--color-primary);
          background: var(--time-card-ring-soft);
        }

        .mobile-nav-tab.active::after {
          content: '';
          position: absolute;
          top: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 3px;
          background: var(--color-primary);
          border-radius: 0 0 3px 3px;
        }

        .mobile-nav-icon {
          font-size: 20px;
          line-height: 1;
        }

        .mobile-nav-label {
          font-size: 11px;
          font-weight: 500;
          line-height: 1;
        }

        .mobile-fab {
          position: absolute;
          right: 16px;
          top: -28px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--color-primary);
          color: white;
          border: none;
          font-size: 24px;
          font-weight: 300;
          cursor: pointer;
          box-shadow: 0 4px 16px var(--time-card-ring);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-fab:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .mobile-fab:active {
          transform: scale(0.95);
        }

        /* Dark theme support */
        @media (prefers-color-scheme: dark) {
          .mobile-nav {
            background: rgba(0, 0, 0, 0.95);
            border-top-color: rgba(255, 255, 255, 0.1);
          }

          .mobile-nav-tab {
            color: rgba(255, 255, 255, 0.6);
          }

          .mobile-nav-tab:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
          }

          .mobile-nav-tab.active {
            color: var(--color-primary);
            background: var(--time-card-ring);
          }
        }

        /* Hide on desktop - show on mobile and small tablets */
        @media (min-width: 769px) {
          .mobile-nav {
            display: none !important;
          }
        }
      </style>
    `;
  }

  attachEventListeners() {
    // Tab navigation
    const tabs = this.container.querySelectorAll('.mobile-nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = e.currentTarget.dataset.tab;
        this.setActiveTab(tabId);
      });
    });

    // FAB click
    const fab = this.container.querySelector('.mobile-fab');
    if (fab) {
      fab.addEventListener('click', () => {
        this.handleQuickAdd();
      });
    }

    // Swipe gesture support for tab switching
    this.addSwipeSupport();
  }

  setActiveTab(tabId) {
    if (this.currentTab === tabId) return;

    this.currentTab = tabId;

    // Update UI
    const tabs = this.container.querySelectorAll('.mobile-nav-tab');
    tabs.forEach(tab => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });

    // Notify parent component
    if (this.onTabChange) {
      this.onTabChange(tabId, this.getTabInfo(tabId));
    }

    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10); // Very subtle feedback
    }
  }

  getTabInfo(tabId) {
    return this.tabs.find(tab => tab.id === tabId);
  }

  handleQuickAdd() {
    // Emit custom event for quick add functionality
    document.dispatchEvent(new CustomEvent('mobile:quick-add', {
      detail: { currentTab: this.currentTab }
    }));

    // Haptic feedback for important action
    if (navigator.vibrate) {
      navigator.vibrate([10, 10, 10]);
    }
  }

  addSwipeSupport() {
    let startX = 0;
    let currentX = 0;
    let isScrolling = false;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      isScrolling = false;
    };

    const handleTouchMove = (e) => {
      if (!startX) return;

      currentX = e.touches[0].clientX;
      const diffX = Math.abs(currentX - startX);
      const diffY = Math.abs(e.touches[0].clientY - e.touches[0].clientY);

      if (diffY > diffX) {
        isScrolling = true;
      }
    };

    const handleTouchEnd = (e) => {
      if (!startX || isScrolling) return;

      const diffX = currentX - startX;
      const threshold = 50; // Minimum swipe distance

      if (Math.abs(diffX) > threshold) {
        const currentIndex = this.tabs.findIndex(tab => tab.id === this.currentTab);
        let newIndex;

        if (diffX > 0 && currentIndex > 0) {
          // Swipe right - previous tab
          newIndex = currentIndex - 1;
        } else if (diffX < 0 && currentIndex < this.tabs.length - 1) {
          // Swipe left - next tab
          newIndex = currentIndex + 1;
        }

        if (newIndex !== undefined) {
          this.setActiveTab(this.tabs[newIndex].id);
        }
      }

      startX = 0;
      currentX = 0;
    };

    // Add swipe listeners to the main content area
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  getCurrentTab() {
    return this.currentTab;
  }

  // Method to update tab badge/indicator
  updateTabBadge(tabId, count) {
    const tab = this.container.querySelector(`[data-tab="${tabId}"]`);
    if (!tab) return;

    // Remove existing badge
    const existingBadge = tab.querySelector('.mobile-nav-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    // Add new badge if count > 0
    if (count > 0) {
      const badge = document.createElement('span');
      badge.className = 'mobile-nav-badge';
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.cssText = `
        position: absolute;
        top: 4px;
        right: 8px;
        background: #ff4444;
        color: white;
        border-radius: 10px;
        font-size: 10px;
        font-weight: bold;
        min-width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
      `;
      tab.appendChild(badge);
    }
  }
}
