/**
 * Mobile Layout Manager
 * Manages mobile-first layout, tab navigation, and responsive behavior
 */
import { MobileNavigation } from './mobile-navigation.js';

export class MobileLayoutManager {
  constructor(dashboard, options = {}) {
    this.dashboard = dashboard;
    this.dataManager = options.dataManager || null;
    this.modules = options.modules || {};
    this.taskHub = options.taskHub || null;
    this.mobileNavigation = null;
    this.isMobile = false;
    this.currentView = 'home';
    this.sections = new Map();
    this.originalDashboardDisplay = '';
    this.dataSubscriptions = [];
    this.homeControlsBound = false;
    this.brainControlsBound = false;
    this.capacityControlsBound = false;
    this.projectControlsBound = false;
    this.scheduleControlsBound = false;
    this.debugLoggingEnabled = (() => {
      try {
        return window.localStorage?.getItem('lifeDashboardMobileDebug') !== '0';
      } catch (error) {
        return true;
      }
    })();

    this.init();
  }

  init() {
    this.detectMobile();
    this.setupMobileLayout();
    this.setupResizeObserver();
    this.setupCustomEventListeners();
    this.setupDataSubscriptions();
  }

  debugLog(...args) {
    if (!this.debugLoggingEnabled) return;
    console.log('[MobileLayout]', ...args);
  }

  logLayoutState(context = 'state') {
    if (!this.debugLoggingEnabled) return;

    const header = document.querySelector('.mobile-header');
    const pageContainer = document.getElementById('mobile-page-container');

    this.debugLog(context, {
      windowWidth: window.innerWidth,
      isMobile: this.isMobile,
      bodyClasses: Array.from(document.body.classList),
      dashboardDisplay: this.dashboard?.style?.display ?? '(inline)',
      mobileHeaderPresent: Boolean(header),
      mobilePageContainerPresent: Boolean(pageContainer),
      currentView: this.currentView,
    });
  }

  get dataStore() {
    return this.dataManager || window.lifeDashboard?.data || null;
  }

  getData(key, fallback = null) {
    const store = this.dataStore;
    if (store?.get) {
      try {
        return store.get(key, fallback);
      } catch (error) {
        this.debugLog('getData error', { key, error });
      }
    }
    return fallback;
  }

  getModule(name) {
    if (this.modules && this.modules[name]) {
      return this.modules[name];
    }
    return window.lifeDashboard?.modules?.[name] || null;
  }

  detectMobile() {
    // Mobile detection for mobile viewports - prioritize screen size and touch capability
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileScreen = window.innerWidth <= 480; // Mobile phone size
    const tabletScreen = window.innerWidth <= 768 && window.innerWidth > 480; // Tablet size
    const mobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
    const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Enable mobile layout for:
    // 1. Small screens (phones)
    // 2. Tablet-sized viewports that are touch-enabled or advertise a mobile UA
    this.isMobile = mobileScreen || (tabletScreen && (touchDevice || mobileUA));

    // Force desktop layout for wider screens regardless of UA quirks
    if (window.innerWidth >= 1025) {
      this.isMobile = false;
    }

    this.debugLog('detectMobile', {
      windowWidth: window.innerWidth,
      mobileScreen,
      tabletScreen,
      mobileUA,
      touchDevice,
      userAgent: userAgent.substring(0, 80),
      finalIsMobile: this.isMobile
    });

    document.body.classList.toggle('mobile-layout', this.isMobile);
    document.body.classList.toggle('desktop-layout', !this.isMobile);

    this.logLayoutState('after detectMobile');
  }

  setupMobileLayout() {
    if (!this.isMobile) return;

    this.debugLog('setupMobileLayout:start');
    this.logLayoutState('before setupMobileLayout');

    this.closeDesktopSettingsMenu();

    // Create mobile navigation
    const navContainer = document.createElement('div');
    navContainer.id = 'mobile-navigation';
    document.body.appendChild(navContainer);

    this.mobileNavigation = new MobileNavigation(navContainer, (tabId, tabInfo) => {
      this.switchToMobilePage(tabId, tabInfo);
    });

    // Modify main dashboard for mobile
    this.dashboard.classList.add('mobile-dashboard');

    // Add mobile-specific styles
    this.addMobileStyles();

    // Create mobile header
    this.createMobileHeader();

    // Register dashboard sections
    this.registerDashboardSections();

    // Create mobile page container
    this.createMobilePageContainer();

    // Show initial tab page
    this.switchToMobilePage(this.currentView);

    this.debugLog('setupMobileLayout:complete');
    this.logLayoutState('after setupMobileLayout');
  }

  addMobileStyles() {
    if (document.getElementById('mobile-layout-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'mobile-layout-styles';
    styles.textContent = `
      /* Mobile Layout Styles */
      .mobile-layout {
        overflow-x: hidden;
        padding-bottom: 80px; /* Space for mobile nav */
      }

      .mobile-layout .main-dashboard {
        grid-template-columns: 1fr !important;
        gap: 16px;
        padding: 16px;
        max-width: 100%;
        margin: 0;
        padding-bottom: 100px; /* Extra space for mobile nav */
      }

      /* Mobile Header */
      .mobile-header {
        position: sticky;
        top: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        padding: 16px;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 60px;
      }

      .mobile-header h1 {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        color: var(--color-text-primary);
      }

      .mobile-header-subtitle {
        font-size: 14px;
        color: var(--color-text-secondary);
        margin-top: 2px;
      }

      .mobile-header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .mobile-header-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: var(--time-card-ring-faint);
        color: var(--color-text-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.2s ease;
      }

      .mobile-header-btn:hover {
        background: var(--time-card-ring-soft);
        transform: scale(1.05);
      }

      /* Mobile Section Management */
      .mobile-section {
        display: none;
        animation: fadeIn 0.3s ease;
      }

      .mobile-section.active {
        display: block;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Mobile Card Styles */
      .mobile-layout .card,
      .mobile-layout .widget {
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      /* Touch-friendly inputs */
      .mobile-layout input,
      .mobile-layout textarea,
      .mobile-layout button {
        min-height: 44px; /* Apple touch guidelines */
        font-size: 16px; /* Prevent zoom on iOS */
        border-radius: 12px;
      }

      .mobile-layout button {
        padding: 12px 20px;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .mobile-layout button:active {
        transform: scale(0.98);
      }

      /* Mobile Typography */
      .mobile-layout h1 { font-size: 28px; }
      .mobile-layout h2 { font-size: 24px; }
      .mobile-layout h3 { font-size: 20px; }
      .mobile-layout p,
      .mobile-layout span,
      .mobile-layout div {
        font-size: 16px;
        line-height: 1.5;
      }

      /* Hide desktop-only elements */
      .mobile-layout .desktop-only {
        display: none !important;
      }

      /* Dark theme mobile support */
      @media (prefers-color-scheme: dark) {
        .mobile-header {
          background: rgba(0, 0, 0, 0.95);
          border-bottom-color: rgba(255, 255, 255, 0.1);
        }

        .mobile-layout .card,
        .mobile-layout .widget {
          background: rgba(0, 0, 0, 0.8);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .mobile-header-btn {
          background: rgba(255, 255, 255, 0.1);
        }

        .mobile-header-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      /* Landscape mobile adjustments */
      @media (max-height: 500px) and (orientation: landscape) {
        .mobile-header {
          padding: 8px 16px;
          min-height: 48px;
        }

        .mobile-header h1 {
          font-size: 18px;
        }

        .mobile-layout .dashboard {
          padding: 8px 16px;
          gap: 12px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  createMobileHeader() {
    if (document.querySelector('.mobile-header')) return;

    const header = document.createElement('header');
    header.className = 'mobile-header';
    header.innerHTML = `
      <div class="mobile-header-title">
        <h1 id="mobile-header-title">Life Dashboard</h1>
        <div class="mobile-header-subtitle" id="mobile-header-subtitle">Brain Space</div>
      </div>
      <div class="mobile-header-actions">
        <button class="mobile-header-btn" id="mobile-theme-btn" title="Change Theme">
          🎨
        </button>
        <button class="mobile-header-btn" id="mobile-search-btn" title="Search">
          🔍
        </button>
        <button class="mobile-header-btn" id="mobile-settings-btn" title="Settings">
          ⚙️
        </button>
      </div>
    `;

    // Prefer inserting header at top of dashboard container for proper mobile structure
    const dashboardContainer = document.querySelector('.dashboard-container');

    if (dashboardContainer) {
      dashboardContainer.prepend(header);
    } else if (this.dashboard?.parentNode) {
      this.dashboard.parentNode.insertBefore(header, this.dashboard);
    } else {
      document.body.insertBefore(header, document.body.firstChild || null);
    }

    // Add header action listeners
    document.getElementById('mobile-theme-btn')?.addEventListener('click', () => {
      this.showMobileThemePicker();
    });

    document.getElementById('mobile-search-btn')?.addEventListener('click', () => {
      this.showMobileSearch();
    });

    document.getElementById('mobile-settings-btn')?.addEventListener('click', () => {
      this.showMobileSettings();
    });
  }

  registerDashboardSections() {
    // Find and register all dashboard sections
    const brainSection = document.querySelector('.brain-space, .simple-brain-dump, #brain-dump');
    const capacitySection = document.querySelector('.capacity-planning, .enough-capacity, #capacity');
    const projectsSection = document.querySelector('.projects, .projects-table, #projects');
    const calendarSection = document.querySelector('.calendar, .weekly-calendar, #calendar');

    if (brainSection) {
      this.sections.set('brain', {
        element: brainSection,
        title: 'Brain Space',
        subtitle: 'Thoughts & Tasks'
      });
    }

    if (capacitySection) {
      this.sections.set('capacity', {
        element: capacitySection,
        title: 'Capacity',
        subtitle: 'Energy Planning'
      });
    }

    if (projectsSection) {
      this.sections.set('projects', {
        element: projectsSection,
        title: 'Projects',
        subtitle: 'Active Work'
      });
    }

    if (calendarSection) {
      this.sections.set('calendar', {
        element: calendarSection,
        title: 'Schedule',
        subtitle: 'Calendar & Events'
      });
    }

    // Virtual home summary section (no direct DOM element)
    if (!this.sections.has('home')) {
      this.sections.set('home', {
        element: null,
        title: 'Home',
        subtitle: 'Daily Snapshot'
      });
    }

    // Wrap sections for mobile display
    this.sections.forEach((section, key) => {
      if (!section.element) return;
      section.element.classList.add('mobile-section');
      if (key !== this.currentView) {
        section.element.classList.remove('active');
      } else {
        section.element.classList.add('active');
      }
    });
  }

  switchToTab(tabId, tabInfo = null) {
    this.currentView = tabId;

    // Update section visibility
    this.sections.forEach((section, key) => {
      if (!section.element) return;
      section.element.classList.toggle('active', key === tabId);
    });

    // Update header
    const section = this.sections.get(tabId);
    if (section) {
      document.getElementById('mobile-header-title').textContent = section.title;
      document.getElementById('mobile-header-subtitle').textContent = section.subtitle;
    }

    // Update URL hash for deep linking
    history.replaceState(null, null, `#${tabId}`);

    // Emit custom event
    document.dispatchEvent(new CustomEvent('mobile:tab-change', {
      detail: { tabId, section: section }
    }));
  }

  /**
   * Create mobile page container for single-screen experience
   */
  createMobilePageContainer() {
    this.debugLog('createMobilePageContainer');

    // Create a container that will hold the active mobile page
    const pageContainer = document.createElement('div');
    pageContainer.id = 'mobile-page-container';
    pageContainer.className = 'mobile-page-container';

    // Insert after mobile header, before dashboard
    const header = document.querySelector('.mobile-header');
    const dashboard = this.dashboard;

    if (header && dashboard) {
      dashboard.parentNode.insertBefore(pageContainer, dashboard);
      this.debugLog('pageContainer inserted within dashboard container');
    } else {
      document.body.appendChild(pageContainer);
      this.debugLog('pageContainer appended to body');
    }

    // Hide the original dashboard on mobile (restore later for desktop)
    if (!this.originalDashboardDisplay) {
      this.originalDashboardDisplay = this.dashboard.style.display || '';
    }
    this.dashboard.style.display = 'none';
    this.logLayoutState('after hiding desktop dashboard');
  }

  /**
   * Switch to a dedicated mobile page (single-screen experience)
   */
  switchToMobilePage(tabId, tabInfo = null) {
    this.currentView = tabId;

    this.debugLog('switchToMobilePage:start', { tabId });

    // Get the page container
    const pageContainer = document.getElementById('mobile-page-container');
    if (!pageContainer) return;

    // Clear current page content with fade out
    pageContainer.style.opacity = '0';
    pageContainer.style.transition = 'opacity 0.2s ease';

    setTimeout(() => {
      // Clear container
      pageContainer.innerHTML = '';

      // Create the dedicated page for this tab
      this.createMobilePage(tabId, pageContainer);

      // Update header
      this.updateMobileHeader(tabId);

      // Fade in new content
      pageContainer.style.opacity = '1';

      // Update URL hash for deep linking
      history.replaceState(null, null, `#${tabId}`);

      // Emit custom event
      document.dispatchEvent(new CustomEvent('mobile:page-change', {
        detail: { tabId, section: this.sections.get(tabId) }
      }));

      this.debugLog('switchToMobilePage:complete', { tabId });
      this.logLayoutState(`after switchToMobilePage:${tabId}`);
    }, 150); // Quick fade transition
  }

  /**
   * Create a dedicated mobile page for the specified tab
   */
  createMobilePage(tabId, container) {
    switch (tabId) {
      case 'home':
        this.createHomePage(container);
        break;
      case 'brain':
        this.createBrainSpacePage(container);
        break;
      case 'capacity':
        this.createEnergyPage(container);
        break;
      case 'projects':
        this.createProjectsPage(container);
        break;
      case 'calendar':
        this.createSchedulePage(container);
        break;
      default:
        this.createDefaultPage(container, tabId);
    }
  }

  /**
   * Create Home overview page
   */
  createHomePage(container) {
    // Gather data from all components
    const brainItems = this.getData('simpleBrainDumpItems', []) || [];
    const capacityTasks = this.getData('enoughTasks', []) || [];
    const projects = this.getData('projects', []) || [];
    const events = this.getData('calendar_events', []) || [];

    // Calculate stats
    const brainCount = brainItems.filter(item => !item.completed).length;
    const brainUnsorted = brainItems.filter(item => item.priority === 'unsorted').length;
    const brainHigh = brainItems.filter(item => item.priority === 'high' && !item.completed).length;

    const capacity = this.getModule('enoughCapacity');
    const capacityUsed = capacity ? capacity.getCapacityUsed() : this.calculateCapacityUsed(capacityTasks);
    const capacityCompleted = capacity ? capacity.getCompletedCapacity() : this.calculateCompletedCapacity(capacityTasks);
    const displayUsed = Math.min(100, Math.max(0, Math.round(capacityUsed)));
    const displayCompleted = Math.min(100, Math.max(0, Math.round(capacityCompleted)));
    const capacityTasksCompleted = capacityTasks.filter(t => t.completed).length;

    const activeProjects = projects.filter(p => !p.completed).length;
    const projectTasksTotal = projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
    const projectTasksCompleted = projects.reduce((sum, p) =>
      sum + (p.tasks?.filter(t => t.completed).length || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEvents = events.filter(e => {
      const eventDate = new Date(e.start);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });

    container.innerHTML = `
      <div class="mobile-page mobile-home-page">
        <div class="mobile-page-content">
          <!-- Welcome header -->
          <div class="mobile-home-welcome">
            <h2>Welcome Back! ✨</h2>
            <p class="mobile-home-subtitle">${this.getGreeting()}</p>
          </div>

          <!-- Overview Cards Grid -->
          <div class="mobile-home-grid">
            <!-- Brain Space Card -->
            <div class="mobile-home-card brain-card" data-nav="brain">
              <div class="card-header">
                <span class="card-icon">🧠</span>
                <h3>Brain Space</h3>
              </div>
              <div class="card-stats">
                <div class="stat-primary">${brainCount}</div>
                <div class="stat-label">Active Items</div>
              </div>
              <div class="card-details">
                ${brainHigh > 0 ? `<div class="detail-item">🔥 ${brainHigh} high priority</div>` : ''}
                ${brainUnsorted > 0 ? `<div class="detail-item warning">📝 ${brainUnsorted} need sorting</div>` : ''}
                ${brainCount === 0 ? `<div class="detail-item">✨ Your mind is clear</div>` : ''}
              </div>
            </div>

            <!-- Capacity Card -->
            <div class="mobile-home-card capacity-card" data-nav="capacity">
              <div class="card-header">
                <span class="card-icon">⚡</span>
                <h3>Capacity</h3>
              </div>
              <div class="card-stats">
                <div class="capacity-mini-circle">
                  <svg viewBox="0 0 100 100" class="mini-circle-svg">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(139, 124, 248, 0.15)" stroke-width="8"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="url(#miniGradient)" stroke-width="8"
                      stroke-dasharray="251.2" stroke-dashoffset="${251.2 - 251.2 * (displayUsed / 100)}"
                      transform="rotate(-90 50 50)" stroke-linecap="round"/>
                    <defs>
                      <linearGradient id="miniGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8b7cf8" />
                        <stop offset="100%" stop-color="#c4b5fd" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div class="mini-circle-text">${displayUsed}%</div>
                </div>
              </div>
              <div class="card-details">
                <div class="detail-item">${capacityTasks.length} tasks planned</div>
                <div class="detail-item success">${capacityTasksCompleted}/${capacityTasks.length} completed</div>
              </div>
            </div>

            <!-- Projects Card -->
            <div class="mobile-home-card projects-card" data-nav="projects">
              <div class="card-header">
                <span class="card-icon">📁</span>
                <h3>Projects</h3>
              </div>
              <div class="card-stats">
                <div class="stat-primary">${activeProjects}</div>
                <div class="stat-label">Active Projects</div>
              </div>
              <div class="card-details">
                ${projectTasksTotal > 0 ? `
                  <div class="detail-item">${projectTasksTotal} total tasks</div>
                  <div class="detail-item success">${projectTasksCompleted} completed</div>
                ` : '<div class="detail-item">No active projects</div>'}
              </div>
            </div>

            <!-- Schedule Card -->
            <div class="mobile-home-card schedule-card" data-nav="calendar">
              <div class="card-header">
                <span class="card-icon">📅</span>
                <h3>Schedule</h3>
              </div>
              <div class="card-stats">
                <div class="stat-primary">${todayEvents.length}</div>
                <div class="stat-label">Events Today</div>
              </div>
              <div class="card-details">
                ${todayEvents.length > 0 ?
                  todayEvents.slice(0, 2).map(e => `
                    <div class="detail-item">${this.formatEventTime(e.start)} ${e.title}</div>
                  `).join('') :
                  '<div class="detail-item">No events today</div>'
                }
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="mobile-home-actions">
            <h3>Quick Actions</h3>
            <div class="action-buttons">
              <button class="action-btn" data-action="brain-add">
                <span class="action-icon">🧠</span>
                <span class="action-label">Capture Thought</span>
              </button>
              <button class="action-btn" data-action="capacity-add">
                <span class="action-icon">⚡</span>
                <span class="action-label">Plan Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachHomePageListeners();
  }

  /**
   * Get time-based greeting
   */
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Start your day with focus";
    if (hour < 17) return "Keep that momentum going";
    if (hour < 21) return "Wrapping up the day";
    return "Rest well, tomorrow awaits";
  }

  /**
   * Format event time
   */
  formatEventTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes}${ampm}`;
  }

  /**
   * Attach Home page event listeners
   */
  attachHomePageListeners() {
    // Card navigation
    document.querySelectorAll('.mobile-home-card[data-nav]').forEach(card => {
      card.addEventListener('click', () => {
        const nav = card.dataset.nav;
        if (nav && this.mobileNavigation) {
          this.mobileNavigation.setActiveTab(nav);
        }
      });
    });

    // Quick actions
    document.querySelectorAll('.action-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'brain-add') {
          this.mobileNavigation?.setActiveTab('brain');
        } else if (action === 'capacity-add') {
          this.mobileNavigation?.setActiveTab('capacity');
        }
      });
    });
  }

  /**
   * Create Brain Space mobile page
   */
  createBrainSpacePage(container) {
    const brainItems = this.getData('simpleBrainDumpItems', []) || [];
    const unsortedItems = brainItems.filter(item => item.priority === 'unsorted');
    const highPriorityItems = brainItems.filter(item => item.priority === 'high' && !item.completed);
    const lowPriorityItems = brainItems.filter(item => item.priority === 'low' && !item.completed);
    const showUnsorted = unsortedItems.length > 0;

    container.innerHTML = `
      <div class="mobile-page mobile-brain-page">
        <div class="mobile-page-content">
          <!-- Quick capture section -->
          <div class="mobile-quick-capture">
            <textarea
              id="mobile-brain-input"
              placeholder="Dump everything on your mind... separate items with commas or new lines"
              class="mobile-brain-input"
              rows="3"
            ></textarea>
            <div class="mobile-brain-actions">
              <button class="mobile-add-btn" id="mobile-brain-process">DONE - Create Tasks</button>
            </div>
          </div>

          <!-- Unsorted Items (appears after bulk dump) -->
          ${showUnsorted ? `
            <div class="mobile-unsorted-section">
              <h3>📝 Unsorted Items</h3>
              <p class="mobile-help-text">Tap an item to set its priority</p>
              <div class="mobile-unsorted-items" id="mobile-unsorted-items">
                ${unsortedItems.map(item => this.renderMobileBrainItem(item, true)).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Priority Sections -->
          <div class="mobile-priority-sections">
            <div class="mobile-priority-section high-priority">
              <h3>🔥 High Priority</h3>
              <div class="mobile-priority-count">${highPriorityItems.length} items</div>
              <div class="mobile-priority-items" id="mobile-high-priority">
                ${highPriorityItems.length === 0 ?
                  '<div class="mobile-empty-state"><p>No high priority items</p></div>' :
                  highPriorityItems.map(item => this.renderMobileBrainItem(item)).join('')
                }
              </div>
            </div>

            <div class="mobile-priority-section low-priority">
              <h3>🌱 Low Priority</h3>
              <div class="mobile-priority-count">${lowPriorityItems.length} items</div>
              <div class="mobile-priority-items" id="mobile-low-priority">
                ${lowPriorityItems.length === 0 ?
                  '<div class="mobile-empty-state"><p>No low priority items</p></div>' :
                  lowPriorityItems.map(item => this.renderMobileBrainItem(item)).join('')
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.brainControlsBound = false;
    this.attachBrainSpaceListeners();
  }

  /**
   * Update mobile header for current page
   */
  updateMobileHeader(tabId) {
    const titleElement = document.getElementById('mobile-header-title');
    const subtitleElement = document.getElementById('mobile-header-subtitle');

    if (!titleElement || !subtitleElement) return;

    const pageInfo = {
      home: { title: 'Home', subtitle: 'Daily Snapshot' },
      brain: { title: 'Brain Space', subtitle: 'Capture & Organize' },
      capacity: { title: 'Capacity', subtitle: 'Plan Your Energy' },
      projects: { title: 'Projects', subtitle: 'Active Work' },
      calendar: { title: 'Schedule', subtitle: 'Today & Upcoming' }
    };

    const info = pageInfo[tabId] || { title: 'Dashboard', subtitle: 'Mobile' };
    titleElement.textContent = info.title;
    subtitleElement.textContent = info.subtitle;
  }

  setupResizeObserver() {
    const resizeObserver = new ResizeObserver(() => {
      this.debugLog('ResizeObserver triggered');
      const wasMobile = this.isMobile;
      this.detectMobile();

      if (wasMobile !== this.isMobile) {
        // Mobile state changed - reinitialize
        this.debugLog('layout mode changed', { wasMobile, nowMobile: this.isMobile });
        if (this.isMobile) {
          this.setupMobileLayout();
        } else {
          this.teardownMobileLayout();
        }
      }
    });

    resizeObserver.observe(document.body);
  }

  setupCustomEventListeners() {
    // Listen for quick add events
    document.addEventListener('mobile:quick-add', (e) => {
      this.handleQuickAdd(e.detail.currentTab);
    });

    // Listen for deep linking
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (this.sections.has(hash)) {
        this.mobileNavigation?.setActiveTab(hash);
      }
    });

    // Handle initial hash
    const initialHash = window.location.hash.slice(1);
    if (this.sections.has(initialHash)) {
      this.currentView = initialHash;
      this.mobileNavigation?.setActiveTab(initialHash);
    }

    document.addEventListener('ticktick:connected', () => {
      this.syncTickTickButtonState();
    });

    document.addEventListener('ticktick:disconnected', () => {
      this.syncTickTickButtonState();
    });
  }

  setupDataSubscriptions() {
    if (!this.dataManager?.subscribe || this.dataSubscriptions.length > 0) {
      return;
    }

    const subscribe = (key, handler) => {
      try {
        const unsubscribe = this.dataManager.subscribe(key, handler);
        if (typeof unsubscribe === 'function') {
          this.dataSubscriptions.push(unsubscribe);
        }
      } catch (error) {
        this.debugLog('Data subscription failed', { key, error });
      }
    };

    subscribe('simpleBrainDumpItems', () => {
      if (!this.isMobile) return;
      this.populateBrainSpace();
    });

    subscribe('enoughTasks', () => {
      if (!this.isMobile) return;
      this.populateEnergyPage();
    });

    subscribe('projects', () => {
      if (!this.isMobile) return;
      this.populateProjectsPage();
    });

    subscribe('calendar_events', () => {
      if (!this.isMobile) return;
      this.populateSchedulePage();
    });
  }

  closeDesktopSettingsMenu() {
    if (window.lifeDashboard?.closeSettingsMenu) {
      window.lifeDashboard.closeSettingsMenu();
      return;
    }

    const settingsDropdown = document.getElementById('settings-dropdown');
    if (!settingsDropdown) return;

    settingsDropdown.classList.remove('active');

    const settingsToggle = document.getElementById('settings-toggle');
    settingsToggle?.classList.remove('is-active');
    settingsToggle?.setAttribute('aria-expanded', 'false');
  }

  handleQuickAdd(currentTab) {
    // Emit tab-specific quick add events
    switch (currentTab) {
      case 'brain':
        document.dispatchEvent(new CustomEvent('brain:quick-add'));
        break;
      case 'capacity':
        document.dispatchEvent(new CustomEvent('capacity:quick-add'));
        break;
      case 'projects':
        document.dispatchEvent(new CustomEvent('projects:quick-add'));
        break;
      case 'calendar':
        document.dispatchEvent(new CustomEvent('calendar:quick-add'));
        break;
    }
  }

  showMobileSearch() {
    // TODO: Implement mobile search overlay
    console.log('Mobile search requested');
  }

  showMobileSettings() {
    // TODO: Implement mobile settings panel
    console.log('Mobile settings requested');
  }

  showMobileThemePicker() {
    // Create mobile theme picker modal
    const modal = document.createElement('div');
    modal.className = 'mobile-theme-modal';
    modal.innerHTML = `
      <div class="mobile-theme-backdrop"></div>
      <div class="mobile-theme-dialog">
        <h3>Choose Theme</h3>
        <div class="mobile-theme-options">
          <button class="mobile-theme-option" data-theme="day">
            <span class="theme-icon">🌤️</span>
            <span class="theme-name">Day</span>
            <span class="theme-desc">Bright & focused</span>
          </button>
          <button class="mobile-theme-option" data-theme="afternoon">
            <span class="theme-icon">🌅</span>
            <span class="theme-name">Afternoon</span>
            <span class="theme-desc">Warm & creative</span>
          </button>
          <button class="mobile-theme-option" data-theme="dusk">
            <span class="theme-icon">🌆</span>
            <span class="theme-name">Dusk</span>
            <span class="theme-desc">Calm & winding down</span>
          </button>
          <button class="mobile-theme-option" data-theme="evening">
            <span class="theme-icon">🌙</span>
            <span class="theme-name">Evening</span>
            <span class="theme-desc">Dark & cozy</span>
          </button>
        </div>
        <button class="mobile-theme-cancel">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Highlight current theme
    const currentTheme = document.body.className.match(/theme-(\w+)/)?.[1] || 'day';
    modal.querySelector(`[data-theme="${currentTheme}"]`)?.classList.add('active');

    // Handle theme selection
    modal.querySelectorAll('.mobile-theme-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        // Remove old theme classes
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        // Add new theme
        document.body.classList.add(`theme-${theme}`);
        // Save to localStorage
        localStorage.setItem('selectedTheme', theme);
        // Close modal
        modal.remove();
        this.showNotification(`Theme changed to ${theme}`);
      });
    });

    // Handle cancel and backdrop
    const closeModal = () => modal.remove();
    modal.querySelector('.mobile-theme-cancel').addEventListener('click', closeModal);
    modal.querySelector('.mobile-theme-backdrop').addEventListener('click', closeModal);
  }

  teardownMobileLayout() {
    this.debugLog('teardownMobileLayout:start');
    this.logLayoutState('before teardownMobileLayout');

    // Remove mobile navigation
    const navContainer = document.getElementById('mobile-navigation');
    if (navContainer) {
      navContainer.remove();
    }

    // Remove mobile header
    const header = document.querySelector('.mobile-header');
    if (header) {
      header.remove();
    }

    // Remove mobile page container if it exists
    const pageContainer = document.getElementById('mobile-page-container');
    if (pageContainer) {
      pageContainer.remove();
    }

    // Restore original dashboard visibility
    if (this.dashboard) {
      this.dashboard.style.display = this.originalDashboardDisplay || '';
    }

    // Remove mobile classes
    document.body.classList.remove('mobile-layout');
    this.dashboard.classList.remove('mobile-dashboard');

    // Show all sections
    this.sections.forEach(section => {
      section.element.classList.remove('mobile-section', 'active');
    });

    this.debugLog('teardownMobileLayout:complete');
    this.logLayoutState('after teardownMobileLayout');
  }

  updateTabBadge(tabId, count) {
    this.mobileNavigation?.updateTabBadge(tabId, count);
  }

  getCurrentView() {
    return this.currentView;
  }

  isMobileLayout() {
    return this.isMobile;
  }

  /**
   * Populate Brain Space mobile page with actual data
   */
  populateBrainSpace() {
    const container = document.getElementById('mobile-brain-list');
    if (!container) return;

    // Get brain dump items from data manager
    const brainItems = this.getData('simpleBrainDumpItems', []) || [];
    const normalizedItems = Array.isArray(brainItems)
      ? [...brainItems].sort((a, b) => {
          const aCompleted = a.completed ? 1 : 0;
          const bCompleted = b.completed ? 1 : 0;
          if (aCompleted !== bCompleted) {
            return aCompleted - bCompleted;
          }
          return (a.priority ?? 'medium').localeCompare(b.priority ?? 'medium');
        })
      : [];

    if (normalizedItems.length === 0) {
      container.innerHTML = `
        <div class="mobile-empty-state">
          <p>Your brain is clear ✨</p>
          <p class="mobile-empty-subtitle">Capture what’s on your mind to keep momentum</p>
        </div>
      `;
      return;
    }

    container.innerHTML = normalizedItems.map((item) => `
      <div class="mobile-brain-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
        <button class="mobile-brain-checkbox" data-id="${item.id}">
          <span class="mobile-checkbox-visual ${item.completed ? 'completed' : ''}">
            ${item.completed ? '✓' : ''}
          </span>
        </button>
        <div class="mobile-brain-text ${item.completed ? 'completed' : ''}">${item.text}</div>
        <div class="mobile-brain-priority priority-${item.priority || 'medium'}">
          ${item.priority === 'high' ? '🔥' : item.priority === 'low' ? '🌱' : '⚡'}
        </div>
      </div>
    `).join('');

    this.attachBrainItemInteractions();
  }

  /**
   * Attach event listeners for Brain Space mobile page
   */
  attachBrainSpaceListeners() {
    if (this.brainControlsBound) {
      return;
    }

    const input = document.getElementById('mobile-brain-input');
    const processBtn = document.getElementById('mobile-brain-process');
    const brainDump = this.getModule('simpleBrainDump');

    this.brainControlsBound = true;

    // Handle bulk brain dump processing
    const processBrainDump = () => {
      const text = input.value.trim();
      if (!text) {
        this.showMobileNotification('⚠️ Please enter some thoughts first!');
        return;
      }

      // Split by commas or newlines
      const items = text
        .split(/\r?\n|,/)
        .map(item => item.trim())
        .filter(item => item.length > 0);

      if (items.length === 0) {
        this.showMobileNotification('⚠️ No valid items found');
        return;
      }

      // Create items with unsorted priority
      items.forEach(itemText => {
        if (brainDump?.addItem) {
          const newItem = {
            id: Date.now() + Math.random(),
            text: itemText,
            priority: 'unsorted',
            completed: false,
            createdAt: Date.now()
          };

          const existingItems = this.getData('simpleBrainDumpItems', []) || [];
          const updatedItems = [...existingItems, newItem];
          this.dataManager?.set('simpleBrainDumpItems', updatedItems);
        }
      });

      input.value = '';
      this.showMobileNotification(`✅ Created ${items.length} items! Tap to set priority.`);

      // Refresh the page
      const container = document.querySelector('.mobile-page-container');
      if (container) {
        this.createBrainSpacePage(container);
      }
    };

    processBtn?.addEventListener('click', processBrainDump);
    input?.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        processBrainDump();
      }
    });

    // Attach interactions for all brain items
    this.attachBrainItemInteractions();
  }

  attachBrainItemInteractions() {
    const brainDump = this.getModule('simpleBrainDump');
    if (!brainDump) return;

    // Handle all brain items across all sections
    document.querySelectorAll('.mobile-brain-item').forEach(item => {
      if (item.dataset.brainBound === 'true') return;
      item.dataset.brainBound = 'true';

      const itemId = item.dataset.id;

      // Checkbox toggle
      const checkbox = item.querySelector('.mobile-brain-checkbox');
      checkbox?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        brainDump.toggleItemCompletion?.(itemId);
      });

      // Delete button
      const deleteBtn = item.querySelector('.mobile-brain-delete-btn');
      deleteBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        brainDump.deleteItem?.(itemId);
      });

      // Add to capacity button
      const capacityBtn = item.querySelector('.mobile-brain-capacity-btn');
      capacityBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const itemData = brainDump.items?.find(i => i.id === itemId);
        if (itemData) {
          brainDump.addItemToCapacity?.(itemId, itemData.text, itemData.priority);
        }
      });

      // Priority change for unsorted items (tap to show priority picker)
      if (item.dataset.priority === 'unsorted') {
        item.addEventListener('click', (event) => {
          if (event.target.closest('button')) return;
          this.showPriorityPicker(itemId);
        });
      }

      // Swipe gestures
      let touchStartX = null;
      let touchStartY = null;

      const resetTouch = () => {
        touchStartX = null;
        touchStartY = null;
      };

      item.addEventListener('touchstart', (event) => {
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }, { passive: true });

      item.addEventListener('touchcancel', resetTouch, { passive: true });

      item.addEventListener('touchend', (event) => {
        if (touchStartX === null || touchStartY === null) {
          return;
        }

        const touch = event.changedTouches[0];
        const diffX = touch.clientX - touchStartX;
        const diffY = touch.clientY - touchStartY;
        resetTouch();

        if (Math.abs(diffX) < 60 || Math.abs(diffY) > 45) {
          return;
        }

        if (diffX > 0) {
          this.showSwipeFeedback(item, 'complete');
          setTimeout(() => brainDump.toggleItemCompletion?.(itemId), 140);
        } else {
          this.showSwipeFeedback(item, 'delete');
          setTimeout(() => brainDump.deleteItem?.(itemId), 140);
        }
      }, { passive: true });
    });
  }

  showSwipeFeedback(item, action) {
    if (!item) return;
    const className = action === 'delete' ? 'swipe-delete' : 'swipe-complete';
    item.classList.add(className);
    setTimeout(() => item.classList.remove(className), 220);
  }

  /**
   * Create Energy/Capacity mobile page
   */
  createEnergyPage(container) {
    const capacity = this.getModule('enoughCapacity');
    const capacityTasks = this.getData('enoughTasks', []) || [];

    // Calculate capacity metrics
    const capacityUsed = capacity ? capacity.getCapacityUsed() : this.calculateCapacityUsed(capacityTasks);
    const completedCapacity = capacity ? capacity.getCompletedCapacity() : this.calculateCompletedCapacity(capacityTasks);
    const displayUsed = Math.min(100, Math.max(0, Math.round(capacityUsed)));
    const displayCompleted = Math.min(100, Math.max(0, Math.round(completedCapacity)));
    const displayLeft = Math.max(0, 100 - displayUsed);
    const isOverCapacity = capacityUsed > 100;
    const statusMessage = this.getCapacityStatusMessage(displayUsed, isOverCapacity);

    container.innerHTML = `
      <div class="mobile-page mobile-energy-page">
        <div class="mobile-page-content">
          <!-- Completion Progress -->
          <div class="mobile-completion-progress">
            <div class="mobile-completion-bar">
              <div class="mobile-completion-fill" style="width: ${displayCompleted}%;"></div>
            </div>
            <div class="mobile-completion-text">
              <span class="mobile-completion-label">Completed: ${displayCompleted}%</span>
              <span class="mobile-completion-count">(${capacityTasks.filter(t => t.completed).length}/${capacityTasks.length} tasks)</span>
            </div>
          </div>

          <!-- Energy Visualization Circle -->
          <div class="mobile-energy-circle-container">
            <svg viewBox="0 0 200 200" class="mobile-energy-circle">
              <defs>
                <radialGradient id="mobileGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="var(--time-card-ring-strong)" />
                  <stop offset="70%" stop-color="var(--time-card-ring-soft)" />
                  <stop offset="100%" stop-color="var(--time-card-ring-faint)" />
                </radialGradient>
                <linearGradient id="mobileMindGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#8b7cf8" />
                  <stop offset="100%" stop-color="#c4b5fd" />
                </linearGradient>
                <linearGradient id="mobileCompletedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#22c55e" />
                  <stop offset="100%" stop-color="#16a34a" />
                </linearGradient>
              </defs>

              <!-- Background glow -->
              <circle cx="100" cy="100" r="90" fill="url(#mobileGlowGrad)" />

              <!-- Progress rings -->
              <g transform="translate(100, 100)">
                <!-- Outer ring - Total capacity used -->
                <circle r="70" fill="none" stroke="rgba(139, 124, 248, 0.12)" stroke-width="10" stroke-linecap="round" />
                <circle r="70" fill="none" stroke="url(#mobileMindGradient)" stroke-width="10" stroke-linecap="round"
                  stroke-dasharray="439.82" stroke-dashoffset="${439.82 - 439.82 * (displayUsed / 100)}"
                  transform="rotate(-90)" class="mobile-progress-ring" />

                <!-- Inner ring - Completed capacity -->
                <circle r="55" fill="none" stroke="rgba(34, 197, 94, 0.15)" stroke-width="8" stroke-linecap="round" />
                <circle r="55" fill="none" stroke="url(#mobileCompletedGradient)" stroke-width="8" stroke-linecap="round"
                  stroke-dasharray="345.58" stroke-dashoffset="${345.58 - 345.58 * (displayCompleted / 100)}"
                  transform="rotate(-90)" class="mobile-progress-ring" opacity="0.9" />
              </g>
            </svg>

            <!-- Center percentage overlay -->
            <div class="mobile-energy-center">
              <div class="mobile-energy-percentage">${displayUsed}%</div>
              <div class="mobile-energy-label">CAPACITY USED</div>
            </div>
          </div>

          <!-- Status message -->
          ${statusMessage ? `<div class="mobile-energy-status">${statusMessage}</div>` : ''}
          <div class="mobile-energy-remaining">${displayLeft}% left today</div>

          <!-- Task list section -->
          <div class="mobile-capacity-tasks" id="mobile-capacity-tasks">
            <div class="mobile-capacity-tasks-header">
              <h3>Tasks (${capacityTasks.length})</h3>
              <button class="mobile-add-task-btn" id="mobile-add-task-btn">+ Add</button>
            </div>
            <!-- Capacity tasks will be populated here -->
          </div>
        </div>
      </div>
    `;

    this.energyControlsBound = false;
    this.populateEnergyPage();
    this.attachEnergyListeners();
  }

  /**
   * Populate Energy page with capacity data
   */
  populateEnergyPage() {
    const container = document.getElementById('mobile-capacity-tasks');
    if (!container) return;

    // Get capacity tasks from data manager
    const capacityTasks = this.getData('enoughTasks', []) || [];
    const capacity = this.getModule('enoughCapacity');

    if (capacityTasks.length === 0) {
      const tasksListHtml = `
        <div class="mobile-empty-state">
          <p>No tasks planned for today</p>
          <p class="mobile-empty-subtitle">Add tasks to track your energy</p>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', tasksListHtml);
      return;
    }

    const tasksListHtml = `
      <div class="mobile-capacity-list">
        ${capacityTasks.map((task, index) => {
          const energyEmoji = capacity ? capacity.getEnergyTypeEmoji(task.energyType) : '⚡';
          const energyWeight = this.calculateTaskEnergy(task);
          return `
            <div class="mobile-capacity-item ${task.completed ? 'completed' : ''}" data-index="${index}">
              <button class="mobile-task-checkbox" data-index="${index}">
                <span class="mobile-checkbox-visual ${task.completed ? 'completed' : ''}">
                  ${task.completed ? '✓' : ''}
                </span>
              </button>
              <div class="mobile-task-content">
                <div class="mobile-task-text">${task.text}</div>
                <div class="mobile-task-meta">
                  <span class="mobile-task-duration">${task.duration || 30}min</span>
                  ${task.energyType ? `<span class="mobile-task-energy-type">${energyEmoji}</span>` : ''}
                  <span class="mobile-task-energy">${Math.round(energyWeight)}%</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.insertAdjacentHTML('beforeend', tasksListHtml);
    this.attachEnergyTaskInteractions();
  }

  /**
   * Attach event listeners for Energy page
   */
  attachEnergyListeners() {
    if (this.energyControlsBound) {
      return;
    }

    // Add Task button handler
    const addTaskBtn = document.getElementById('mobile-add-task-btn');
    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', () => {
        const capacity = this.getModule('enoughCapacity');
        if (capacity && typeof capacity.addNewTask === 'function') {
          capacity.addNewTask();
        }
      });
    }

    this.energyControlsBound = true;
  }

  syncEnergyControls() {
    const buttons = document.querySelectorAll('.mobile-energy-btn');
    buttons.forEach((btn) => {
      const level = btn.dataset.energy || 'medium';
      btn.classList.toggle('selected', level === this.currentMobileEnergyLevel);
    });

    const energyLevel = document.getElementById('mobile-energy-level');
    const energyFill = document.querySelector('.energy-fill');

    const levelValue =
      this.currentMobileEnergyLevel === 'high'
        ? 90
        : this.currentMobileEnergyLevel === 'low'
          ? 30
          : 60;

    if (energyLevel) energyLevel.textContent = `${levelValue}%`;
    if (energyFill) energyFill.style.width = `${levelValue}%`;
  }

  attachEnergyTaskInteractions() {
    const container = document.getElementById('mobile-capacity-tasks');
    if (!container) return;

    const capacity = this.getModule('enoughCapacity');
    if (!capacity) return;

    container.querySelectorAll('.mobile-task-checkbox').forEach((checkbox) => {
      if (checkbox.dataset.capacityBound === 'true') return;
      checkbox.dataset.capacityBound = 'true';

      checkbox.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const index = Number.parseInt(checkbox.dataset.index, 10);
        if (!Number.isNaN(index)) {
          capacity.toggleTaskCompletion?.(index);
        }
      });
    });
  }

  /**
   * Create Projects mobile page
   */
  createProjectsPage(container) {
    container.innerHTML = `
      <div class="mobile-page mobile-projects-page">
        <div class="mobile-page-content">
          <!-- Quick add project -->
          <div class="mobile-quick-project">
            <input
              type="text"
              id="mobile-project-input"
              placeholder="Start a new project..."
              class="mobile-project-input"
            >
            <button class="mobile-add-btn" id="mobile-project-add">Create Project</button>
          </div>

          <!-- Project cards -->
          <div class="mobile-projects-grid" id="mobile-projects-grid">
            <!-- Project cards will be populated here -->
          </div>
        </div>
      </div>
    `;

    this.projectControlsBound = false;
    this.populateProjectsPage();
    this.attachProjectsListeners();
  }

  /**
   * Populate Projects page
   */
  populateProjectsPage() {
    const container = document.getElementById('mobile-projects-grid');
    if (!container) return;

    // Get projects from data manager
    const projects = this.getData('projects', []) || [];
    const normalizedProjects = Array.isArray(projects) ? [...projects] : [];

    if (normalizedProjects.length === 0) {
      container.innerHTML = `
        <div class="mobile-empty-state">
          <p>No projects yet</p>
          <p class="mobile-empty-subtitle">Create your first project to get started</p>
        </div>
      `;
      return;
    }

    container.innerHTML = normalizedProjects.map(project => {
      const tasks = this.parseProjectTodos(project.todos);
      const completedTasks = tasks.filter(task => task.completed).length;
      const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
      const progressLabel = tasks.length > 0 ? `${completedTasks}/${tasks.length} tasks` : 'No tasks yet';

      const taskList = tasks.length === 0
        ? '<li class="mobile-project-task empty">No tasks yet</li>'
        : tasks
            .map((task, index) => `
              <li class="mobile-project-task ${task.completed ? 'completed' : ''}" data-project-id="${project.id}" data-task-index="${index}">
                <button class="mobile-project-task-toggle" data-project-id="${project.id}" data-task-index="${index}" aria-label="Toggle task">
                  ${task.completed ? '✓' : ''}
                </button>
                <span>${task.text}</span>
              </li>
            `)
            .join('');

      return `
        <div class="mobile-project-card" data-id="${project.id}">
          <div class="mobile-project-header">
            <div class="mobile-project-name">${project.name}</div>
            <div class="mobile-project-priority-pill priority-${project.priority || 'medium'}">
              ${project.priority === 'high' ? '🔥 High' : project.priority === 'low' ? '🌱 Low' : '⚡ Medium'}
            </div>
          </div>
          <div class="mobile-project-meta">
            <span class="mobile-project-category">${project.category || 'General'}</span>
            ${project.status ? `<span class="mobile-project-status status-${project.status}">${project.status}</span>` : ''}
          </div>
          <div class="mobile-project-progress">
            <div class="mobile-project-progress-bar" style="width: ${taskProgress}%"></div>
            <div class="mobile-project-progress-text">${progressLabel}</div>
          </div>
          <ul class="mobile-project-task-list">
            ${taskList}
          </ul>
          <div class="mobile-project-actions">
            <button class="mobile-project-add-task" data-project-id="${project.id}">Add Task</button>
          </div>
        </div>
      `;
    }).join('');

    this.attachProjectCardInteractions();
  }

  /**
   * Attach event listeners for Projects page
   */
  attachProjectsListeners() {
    if (this.projectControlsBound) {
      return;
    }

    const input = document.getElementById('mobile-project-input');
    const addBtn = document.getElementById('mobile-project-add');

    const addProject = () => {
      const name = input.value.trim();
      if (!name) return;

      // Add project via the existing component
      const projectsTable = this.getModule('projectsTable');
      if (projectsTable?.addProject) {
        projectsTable.addProject({ name });
      }

      // Clear input and refresh
      input.value = '';
      this.populateProjectsPage();
    };

    addBtn?.addEventListener('click', addProject);
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addProject();
      }
    });

    this.projectControlsBound = true;
  }

  attachProjectCardInteractions() {
    const container = document.getElementById('mobile-projects-grid');
    if (!container) return;

    const projectsTable = this.getModule('projectsTable');
    if (!projectsTable) return;

    container.querySelectorAll('.mobile-project-add-task').forEach((button) => {
      if (button.dataset.projectBound === 'true') return;
      button.dataset.projectBound = 'true';

      button.addEventListener('click', () => {
        const projectId = Number.parseInt(button.dataset.projectId, 10);
        if (Number.isNaN(projectId)) return;

        const taskName = prompt('Task to assign to this project?');
        if (!taskName) return;

        const tasks = this.parseProjectTodosById(projectId);
        tasks.push({ text: taskName, completed: false });
        const updatedTodos = this.stringifyProjectTasks(tasks);
        projectsTable.updateProject(projectId, 'todos', updatedTodos);
      });
    });

    container.querySelectorAll('.mobile-project-task-toggle').forEach((toggleBtn) => {
      if (toggleBtn.dataset.projectTaskBound === 'true') return;
      toggleBtn.dataset.projectTaskBound = 'true';

      toggleBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const projectId = Number.parseInt(toggleBtn.dataset.projectId, 10);
        const taskIndex = Number.parseInt(toggleBtn.dataset.taskIndex, 10);

        if (Number.isNaN(projectId) || Number.isNaN(taskIndex)) return;

        const tasks = this.parseProjectTodosById(projectId);
        if (!tasks[taskIndex]) return;

        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        const updatedTodos = this.stringifyProjectTasks(tasks);
        projectsTable.updateProject(projectId, 'todos', updatedTodos);
      });
    });
  }

  parseProjectTodosById(projectId) {
    const projects = this.getData('projects', []) || [];
    const project = Array.isArray(projects)
      ? projects.find((p) => String(p.id) === String(projectId))
      : null;
    return this.parseProjectTodos(project?.todos);
  }

  parseProjectTodos(todosText) {
    const rawText = todosText || '';
    const lines = rawText.split(/\r?\n|,/) // support commas and newlines
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return [];
    }

    return lines.map((line) => {
      const completed = /^(\[x\]|✓)/i.test(line);
      const text = line.replace(/^(\[.?\]|\[x\]|✓)\s*/i, '').replace(/^-\s*/, '').trim();
      return {
        text: text || line.replace(/^-\s*/, ''),
        completed,
      };
    });
  }

  stringifyProjectTasks(tasks) {
    return tasks
      .map((task) => `${task.completed ? '[x]' : '[ ]'} ${task.text}`)
      .join('\n');
  }

  parseEventDate(event) {
    if (!event) return null;
    const dateValue = event.start || event.dueDate || event.date;
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  formatTime(date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  formatDay(date) {
    const today = new Date();
    if (this.isSameDay(date, today)) {
      return 'Today';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (this.isSameDay(date, tomorrow)) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  isSameDay(dateA, dateB) {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }

  /**
   * Create Schedule mobile page
   */
  createSchedulePage(container) {
    container.innerHTML = `
      <div class="mobile-page mobile-schedule-page">
        <div class="mobile-page-content">
          <!-- Today focus -->
          <div class="mobile-today-focus">
            <h2>Today's Schedule</h2>
            <div class="mobile-date">${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</div>
          </div>

          <!-- Quick event add -->
          <div class="mobile-quick-event">
            <input
              type="text"
              id="mobile-event-input"
              placeholder="Add event or appointment..."
              class="mobile-event-input"
            >
            <button class="mobile-add-btn" id="mobile-event-add">Add Event</button>
          </div>

          <!-- Today's events -->
          <div class="mobile-events-list" id="mobile-events-list">
            <!-- Events will be populated here -->
          </div>

          <!-- TickTick integration -->
          <div class="mobile-ticktick-section">
            <h3>TickTick Integration</h3>
            <button class="mobile-ticktick-btn" id="mobile-ticktick-sync">Sync with TickTick</button>
          </div>
        </div>
      </div>
    `;

    this.scheduleControlsBound = false;
    this.populateSchedulePage();
    this.attachScheduleListeners();
    this.syncTickTickButtonState();
  }

  /**
   * Populate Schedule page
   */
  populateSchedulePage() {
    const container = document.getElementById('mobile-events-list');
    if (!container) return;

    const events = this.getData('calendar_events', []) || [];
    const normalizedEvents = Array.isArray(events) ? [...events] : [];
    const today = new Date();

    const todaysEvents = normalizedEvents.filter((event) => {
      const eventDate = this.parseEventDate(event);
      return eventDate ? this.isSameDay(eventDate, today) : false;
    });

    const upcomingEvents = normalizedEvents
      .filter((event) => {
        const eventDate = this.parseEventDate(event);
        if (!eventDate) return false;
        const diff = eventDate - today;
        return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7; // within next 7 days
      })
      .sort((a, b) => this.parseEventDate(a) - this.parseEventDate(b));

    const renderEvents = (list) => {
      if (list.length === 0) {
        return '<div class="mobile-empty-state"><p>No scheduled events</p></div>';
      }

      return list
        .map((event) => {
          const eventDate = this.parseEventDate(event);
          const timeLabel = eventDate ? this.formatTime(eventDate) : 'Anytime';
          const dayLabel = eventDate ? this.formatDay(eventDate) : '';
          return `
            <div class="mobile-event-item" data-event-id="${event.id}">
              <div class="mobile-event-meta">
                <div class="mobile-event-time">${timeLabel}</div>
                ${dayLabel ? `<div class="mobile-event-day">${dayLabel}</div>` : ''}
              </div>
              <div class="mobile-event-title">${event.title || event.name || 'Untitled event'}</div>
            </div>
          `;
        })
        .join('');
    };

    container.innerHTML = `
      <section class="mobile-events-today">
        <h3>Today</h3>
        ${renderEvents(todaysEvents)}
      </section>
      <section class="mobile-events-upcoming">
        <h3>Next 7 Days</h3>
        ${renderEvents(upcomingEvents)}
      </section>
    `;
  }

  /**
   * Attach event listeners for Schedule page
   */
  attachScheduleListeners() {
    if (this.scheduleControlsBound) {
      this.syncTickTickButtonState();
      return;
    }

    const input = document.getElementById('mobile-event-input');
    const addBtn = document.getElementById('mobile-event-add');
    const ticktickBtn = document.getElementById('mobile-ticktick-sync');

    const addEvent = () => {
      const title = input.value.trim();
      if (!title) return;

      const events = this.getData('calendar_events', []) || [];
      const newEvent = {
        id: Date.now(),
        title,
        start: new Date().toISOString(),
        priority: 'medium'
      };

      const updatedEvents = Array.isArray(events) ? [...events, newEvent] : [newEvent];
      this.dataManager?.set?.('calendar_events', updatedEvents);
      input.value = '';
    };

    addBtn?.addEventListener('click', addEvent);
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addEvent();
      }
    });

    ticktickBtn?.addEventListener('click', () => {
      const ticktick = this.getModule('ticktickIntegration');
      if (ticktick?.connectToTickTick) {
        ticktick.connectToTickTick();
      }
    });

    this.scheduleControlsBound = true;
    this.syncTickTickButtonState();
  }

  syncTickTickButtonState() {
    const ticktickBtn = document.getElementById('mobile-ticktick-sync');
    if (!ticktickBtn) return;

    const ticktick = this.getModule('ticktickIntegration');
    const isConnected = ticktick?.ticktickService?.isReady?.() || false;

    ticktickBtn.textContent = isConnected ? 'Connected to TickTick' : 'Connect TickTick';
    ticktickBtn.classList.toggle('connected', isConnected);
  }

  /**
   * Create default page for unknown tabs
   */
  createDefaultPage(container, tabId) {
    container.innerHTML = `
      <div class="mobile-page mobile-default-page">
        <div class="mobile-page-content">
          <h2>Coming Soon</h2>
          <p>The ${tabId} page is being built!</p>
        </div>
      </div>
    `;
  }

  /**
   * Calculate total capacity used from tasks
   */
  calculateCapacityUsed(tasks) {
    let totalCapacity = 0;

    tasks.forEach((task) => {
      if (task.fromCalculator && task.calculatedCapacity) {
        totalCapacity += task.calculatedCapacity;
      } else if (task.fromQuickAdd && task.adjustedCapacity) {
        totalCapacity += task.adjustedCapacity;
      } else {
        const energyWeight = Math.min((task.duration || 30) / 3, 25);
        totalCapacity += energyWeight;
      }
    });

    // Add time-based energy depletion
    const timeEnergyDepletion = this.getTimeBasedEnergyDepletion();
    return Math.min(100, totalCapacity + timeEnergyDepletion);
  }

  /**
   * Calculate completed capacity from tasks
   */
  calculateCompletedCapacity(tasks) {
    let completedCapacity = 0;

    tasks.filter(task => task.completed).forEach((task) => {
      if (task.fromCalculator && task.calculatedCapacity) {
        completedCapacity += task.calculatedCapacity;
      } else if (task.fromQuickAdd && task.adjustedCapacity) {
        completedCapacity += task.adjustedCapacity;
      } else {
        const energyWeight = Math.min((task.duration || 30) / 3, 25);
        completedCapacity += energyWeight;
      }
    });

    return Math.min(100, completedCapacity);
  }

  /**
   * Calculate individual task energy weight
   */
  calculateTaskEnergy(task) {
    if (task.fromCalculator && task.calculatedCapacity) {
      return task.calculatedCapacity;
    } else if (task.fromQuickAdd && task.adjustedCapacity) {
      return task.adjustedCapacity;
    } else {
      return Math.min((task.duration || 30) / 3, 25);
    }
  }

  /**
   * Get time-based energy depletion (ADHD-aware)
   */
  getTimeBasedEnergyDepletion() {
    const hour = new Date().getHours();
    let energyDepletion = 0;

    if (hour >= 6 && hour < 11) {
      energyDepletion = 0;
    } else if (hour >= 11 && hour < 14) {
      energyDepletion = Math.max(0, (hour - 11) * 1);
    } else if (hour >= 14 && hour < 17) {
      energyDepletion = 2 + (hour - 14) * 3;
    } else if (hour >= 17 && hour < 20) {
      energyDepletion = 8 + (hour - 17) * 6;
    } else if (hour >= 20 && hour < 23) {
      energyDepletion = 20 + (hour - 20) * 8;
    } else {
      energyDepletion = hour >= 23 ? 40 + (hour - 23) * 10 : 40;
    }

    return Math.round(energyDepletion);
  }

  /**
   * Get capacity status message
   */
  getCapacityStatusMessage(percentage, isOverCapacity) {
    if (isOverCapacity) {
      return '🚨 Over capacity! Consider removing some tasks.';
    } else if (percentage > 90) {
      return "⚠️ Nearly at capacity. You've planned enough!";
    }
    return '';
  }

  /**
   * Render a mobile brain item
   */
  renderMobileBrainItem(item, isUnsorted = false) {
    const projectIndicator = item.fromProject ?
      `<span class="project-indicator" title="From project: ${item.projectName}">📋</span>` :
      '';

    return `
      <div class="mobile-brain-item ${item.completed ? 'completed' : ''}" data-id="${item.id}" data-priority="${item.priority || 'medium'}">
        <button class="mobile-brain-checkbox" data-id="${item.id}">
          <span class="mobile-checkbox-visual ${item.completed ? 'completed' : ''}">
            ${item.completed ? '✓' : ''}
          </span>
        </button>
        <div class="mobile-brain-text-container">
          <div class="mobile-brain-text ${item.completed ? 'completed' : ''}">${item.text}</div>
          ${projectIndicator}
        </div>
        ${!isUnsorted && !item.completed ? `
          <button class="mobile-brain-capacity-btn" data-id="${item.id}" title="Add to capacity">⚡</button>
        ` : ''}
        <button class="mobile-brain-delete-btn" data-id="${item.id}" title="Delete">×</button>
      </div>
    `;
  }

  /**
   * Show priority picker for unsorted items
   */
  showPriorityPicker(itemId) {
    const modal = document.createElement('div');
    modal.className = 'mobile-priority-picker-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="priority-picker-dialog">
        <h3>Set Priority</h3>
        <div class="priority-picker-buttons">
          <button class="priority-picker-btn high" data-priority="high">
            <span class="priority-icon">🔥</span>
            <span class="priority-label">High Priority</span>
          </button>
          <button class="priority-picker-btn low" data-priority="low">
            <span class="priority-icon">🌱</span>
            <span class="priority-label">Low Priority</span>
          </button>
        </div>
        <button class="priority-picker-cancel">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      const priorityBtn = e.target.closest('[data-priority]');
      if (priorityBtn) {
        const priority = priorityBtn.dataset.priority;
        this.updateItemPriority(itemId, priority);
        document.body.removeChild(modal);
        return;
      }

      if (e.target.closest('.priority-picker-cancel') || e.target.classList.contains('modal-backdrop')) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * Update item priority
   */
  updateItemPriority(itemId, newPriority) {
    const items = this.getData('simpleBrainDumpItems', []) || [];
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return { ...item, priority: newPriority };
      }
      return item;
    });

    this.dataManager?.set('simpleBrainDumpItems', updatedItems);

    // Refresh the page
    const container = document.querySelector('.mobile-page-container');
    if (container) {
      this.createBrainSpacePage(container);
    }
  }

  /**
   * Show mobile notification
   */
  showMobileNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'mobile-notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, duration);
  }
}
