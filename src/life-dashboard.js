import { DataManager } from './utils/data-manager.js';
import { ThemeController } from './utils/theme-controller.js';
import { SimpleBrainDump } from './components/simple-brain-dump.js';
import { EnoughCapacity } from './components/enough-capacity.js';
import { ProjectsTable } from './components/projects-table.js';
import { TickTickIntegration } from './services/ticktick-integration.js';
import { WeeklyCalendar } from './components/weekly-calendar.js';
import { TaskIntegrationHub } from './task-integration-hub.js';
import { AuthManager } from './services/auth-manager.js';

/**
 * Main App Controller
 * Orchestrates all dashboard modules and provides global app state
 */
export class LifeDashboard {
  constructor() {
    this.data = new DataManager();
    this.modules = {};
    this.lastCompactCalendarDate = null;
    this.stimmingEnabled = false;
    this.floatingNotesEnabled = true;
    this.celebrationsEnabled = true;
    this.floatingNotesInterval = null;
    this.themePills = [];
    this.authManager = null;
    this.lastAuthUserId = null;
    this.hasShownSignedOutMessage = false;
    this.init();
  }

  init() {
    // Initialize authentication overlay and account controls
    this.authManager = new AuthManager({
      onAuthChange: (user) => this.handleAuthStateChange(user),
    });

    // Initialize theme controller first
    this.themeController = new ThemeController();

    // Initialize task integration hub
    this.taskHub = new TaskIntegrationHub(this.data);

    // Initialize priority section components (wireframe top section)
    this.initializePriorityComponents();

    // Initialize secondary section components
    this.initializeSecondaryComponents();

    // Initialize tertiary ADHD-optimized modules
    this.initializeTertiaryComponents();

    // Create placeholder content for remaining modules
    this.renderADHDPlaceholders();

    // Attach global event listeners
    this.attachGlobalEvents();

    // Initialize settings menu
    this.initializeSettingsMenu();

    // Make globally available for component interactions
    window.lifeDashboard = this;

    console.log('Life Dashboard v5 initialized with Wireframe Priority Layout');
  }

  handleAuthStateChange(user) {
    const currentId = user?.uid ?? null;
    if (currentId === this.lastAuthUserId) {
      return;
    }

    this.lastAuthUserId = currentId;

    if (user) {
      const identifier = user.displayName || user.email || 'your account';
      this.hasShownSignedOutMessage = false;
      this.showNotification(`🔐 Signed in as ${identifier}`);
    } else if (!this.hasShownSignedOutMessage) {
      this.hasShownSignedOutMessage = true;
      this.showNotification('🔓 Signed out. Data will stay on this device until you sign in.');
    }

    // Update settings menu with user info
    this.updateSettingsUserInfo(user);
  }

  handleLogout() {
    if (this.authManager && this.authManager.auth) {
      this.authManager.handleSignOut();
      this.closeSettingsMenu();
    }
  }

  updateSettingsUserInfo(user) {
    const userInfoDiv = document.getElementById('settings-user-info');
    const greetingSpan = document.getElementById('user-greeting');
    const emailSpan = document.getElementById('user-email');

    if (userInfoDiv && greetingSpan && emailSpan) {
      if (user) {
        userInfoDiv.style.display = 'block';
        const displayName = user.displayName;
        greetingSpan.textContent = displayName ? `Hi, ${displayName}!` : 'Hi 👋';
        emailSpan.textContent = user.email ?? 'Signed in';
      } else {
        userInfoDiv.style.display = 'none';
      }
    }
  }

  initializePriorityComponents() {
    // Initialize greeting and time display
    this.initializeWelcomeSection();

    // Initialize projects table
    const projectsTableContainer = document.getElementById('projects-table-container');
    if (projectsTableContainer) {
      this.modules.projectsTable = new ProjectsTable(
        projectsTableContainer,
        this.data,
        this.taskHub
      );
    }
  }

  initializeSecondaryComponents() {
    // Initialize Enough Capacity in secondary position
    this.modules.enoughCapacity = new EnoughCapacity(
      document.getElementById('enough-capacity-container'),
      this.data,
      this.taskHub
    );

    // Initialize Brain Dump in secondary position
    this.modules.simpleBrainDump = new SimpleBrainDump(
      document.getElementById('brain-dump-plus-container'),
      this.data,
      this.taskHub
    );

    // Initialize TickTick Integration FIRST
    this.modules.ticktickIntegration = new TickTickIntegration(
      document.getElementById('ticktick-integration-container'),
      this.data
    );

    // Initialize Weekly Calendar
    this.modules.weeklyCalendar = new WeeklyCalendar(
      document.getElementById('weekly-calendar-container'),
      this.data
    );

    // Connect TickTick service to weekly calendar - should be available immediately now
    const ticktickService = this.modules.ticktickIntegration.ticktickService;
    if (ticktickService) {
      console.log('🔗 Connecting TickTick service to weekly calendar');
      this.modules.weeklyCalendar.setTickTickService(ticktickService);
    } else {
      console.warn('⚠️ TickTick service not available for weekly calendar');
    }
  }

  initializeTertiaryComponents() {
    // Initialize ADHD-optimized modules in tertiary position
  }

  initializeWelcomeSection() {
    // Initialize greeting
    this.updateGreeting();

    // Initialize and start real-time clock
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    // Render compact calendars in welcome card
    this.renderCompactCalendars();
  }

  updateGreeting() {
    const greetingContainer = document.getElementById('greeting-container');
    if (greetingContainer) {
      const now = new Date();
      const hour = now.getHours();
      let greeting = 'Good morning';
      let subtitle = 'Ready to make today amazing?';

      if (hour >= 12 && hour < 17) {
        greeting = 'Good afternoon';
        subtitle = "How's your day going?";
      } else if (hour >= 17) {
        greeting = 'Good evening';
        subtitle = 'Time to wind down and reflect';
      }

      // Add energy-based encouragement for ADHD
      const encouragements = [
        "You've got this! 💪",
        'One step at a time',
        'Your pace is perfect',
        'Progress over perfection',
        'Be kind to yourself today',
        'Small wins count too',
      ];

      if (Math.random() > 0.5) {
        subtitle = encouragements[Math.floor(Math.random() * encouragements.length)];
      }

      const name = 'Marlie';

      greetingContainer.innerHTML = `
        <h2>${greeting}, ${name}!</h2>
        <p class="greeting-subtitle">${subtitle}</p>
      `;
    }
  }

  updateClock() {
    const now = new Date();

    // Update time
    const timeContainer = document.getElementById('current-time');
    if (timeContainer) {
      timeContainer.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }

    // Update date
    const dateContainer = document.getElementById('current-date');
    if (dateContainer) {
      dateContainer.textContent = now.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const todayKey = now.toDateString();
    if (this.lastCompactCalendarDate !== todayKey) {
      this.renderCompactCalendars();
    }
  }

  renderCompactCalendars() {
    const today = new Date();
    this.renderCompactMonth(today);
    this.renderCompactWeek(today);
    this.lastCompactCalendarDate = today.toDateString();
  }

  renderCompactMonth(today) {
    const container = document.getElementById('monthly-calendar-compact');
    if (!container) {
      return;
    }

    const year = today.getFullYear();
    const month = today.getMonth();
    const monthName = today.toLocaleDateString([], { month: 'long' }).toUpperCase();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startOffset = firstDay.getDay();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const dayCells = [];
    for (let cellIndex = 0; cellIndex < totalCells; cellIndex += 1) {
      const dayNumber = cellIndex - startOffset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        dayCells.push('<div class="compact-calendar__day is-empty"></div>');
      } else {
        const isToday = dayNumber === today.getDate();
        dayCells.push(`
          <div class="compact-calendar__day ${isToday ? 'is-today' : ''}" aria-label="${monthName} ${dayNumber}, ${year}">
            ${dayNumber}
          </div>
        `);
      }
    }

    container.innerHTML = `
      <div class="compact-calendar">
        <div class="compact-calendar__header">
          <span class="compact-calendar__month">${monthName} ${year}</span>
        </div>
        <div class="compact-calendar__grid">
          ${['S', 'M', 'T', 'W', 'T', 'F', 'S']
            .map(
              (day) => `
            <div class="compact-calendar__weekday">${day}</div>
          `
            )
            .join('')}
          ${dayCells.join('')}
        </div>
      </div>
    `;
  }

  renderCompactWeek(today) {
    const container = document.getElementById('weekly-calendar-compact');
    if (!container) {
      return;
    }

    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + index);
      return day;
    });

    const rangeStart = weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' });
    const rangeEnd = weekDays[6].toLocaleDateString([], { month: 'short', day: 'numeric' });

    // Get focus sessions for this week
    const focusSessions = this.getFocusSessionsForWeek(startOfWeek);

    container.innerHTML = `
      <div class="compact-week">
        <div class="compact-week__header">
          <span class="compact-week__title">This Week & Focus Sessions</span>
          <span class="compact-week__range">${rangeStart} - ${rangeEnd}</span>
          <button class="btn btn--micro focus-planner-btn" title="Plan Focus Sessions">🔥 Plan</button>
        </div>
        <div class="compact-week__days">
          ${weekDays
            .map((day, index) => {
              const isToday = day.toDateString() === today.toDateString();
              const dayLabel = day.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
              const dayNumber = day.getDate();
              const dayKey = day.toDateString();
              const dayFocusSessions = focusSessions.filter(
                (session) => new Date(session.date).toDateString() === dayKey
              );

              return `
              <div class="compact-week__day ${isToday ? 'is-today' : ''}" data-date="${dayKey}">
                <span class="compact-week__day-label">${dayLabel}</span>
                <span class="compact-week__date">${dayNumber}</span>
                <div class="focus-sessions">
                  ${
                    dayFocusSessions.length > 0
                      ? dayFocusSessions
                          .map(
                            (session) => `
                      <div class="focus-session-badge" title="${session.task}">
                        <span class="session-time">${session.time}</span>
                        <span class="session-icon">${session.type === 'pomodoro' ? '🍅' : '🔥'}</span>
                      </div>
                    `
                          )
                          .join('')
                      : `<button class="add-focus-btn" title="Add focus session">+</button>`
                  }
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>

      <!-- Focus Session Planner Modal -->
      <div class="focus-planner-modal" style="display: none;">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>🔥 Focus Session Planner</h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <div class="focus-form">
              <div class="form-group">
                <label>Task/Project</label>
                <select class="task-select">
                  <option value="">Select from projects...</option>
                </select>
                <input type="text" class="custom-task-input" placeholder="Or enter custom task...">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Date</label>
                  <input type="date" class="focus-date-input">
                </div>
                <div class="form-group">
                  <label>Time</label>
                  <input type="time" class="focus-time-input">
                </div>
              </div>
              <div class="form-group">
                <label>Session Type</label>
                <div class="session-type-options">
                  <button type="button" class="session-type-btn active" data-type="pomodoro">
                    🍅 Pomodoro (25min)
                  </button>
                  <button type="button" class="session-type-btn" data-type="deep-work">
                    🔥 Deep Work (60min)
                  </button>
                  <button type="button" class="session-type-btn" data-type="custom">
                    ⏱️ Custom Duration
                  </button>
                </div>
                <input type="number" class="custom-duration" min="5" max="120" value="25" style="display: none;">
              </div>
              <div class="form-actions">
                <button class="btn btn--ghost cancel-focus">Cancel</button>
                <button class="btn save-focus-session">Schedule Session</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners for the new functionality
    this.attachFocusPlannerEvents(container);
  }

  getFocusSessionsForWeek(startOfWeek) {
    // Get focus sessions from data manager
    const sessions = this.data.get('focusSessions', []);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return sessions.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startOfWeek && sessionDate < endOfWeek;
    });
  }

  attachFocusPlannerEvents(container) {
    // Focus planner button
    const plannerBtn = container.querySelector('.focus-planner-btn');
    const modal = container.querySelector('.focus-planner-modal');
    const closeBtn = container.querySelector('.modal-close');
    const backdropBtn = container.querySelector('.modal-backdrop');
    const cancelBtn = container.querySelector('.cancel-focus');

    if (plannerBtn && modal) {
      plannerBtn.addEventListener('click', () => {
        this.openFocusPlanner(modal);
      });

      [closeBtn, backdropBtn, cancelBtn].forEach((btn) => {
        if (btn) {
          btn.addEventListener('click', () => {
            modal.style.display = 'none';
          });
        }
      });
    }

    // Add focus session buttons on individual days
    container.querySelectorAll('.add-focus-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const dayElement = e.target.closest('.compact-week__day');
        const selectedDate = dayElement.dataset.date;
        this.openFocusPlanner(modal, selectedDate);
      });
    });

    // Session type toggles
    container.querySelectorAll('.session-type-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        container
          .querySelectorAll('.session-type-btn')
          .forEach((b) => b.classList.remove('active'));
        e.target.classList.add('active');

        const customDuration = container.querySelector('.custom-duration');
        if (e.target.dataset.type === 'custom') {
          customDuration.style.display = 'block';
        } else {
          customDuration.style.display = 'none';
        }
      });
    });

    // Save focus session
    const saveBtn = container.querySelector('.save-focus-session');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveFocusSession(container);
      });
    }
  }

  openFocusPlanner(modal, selectedDate = null) {
    const dateInput = modal.querySelector('.focus-date-input');
    const taskSelect = modal.querySelector('.task-select');

    // Set default date if provided
    if (selectedDate) {
      const date = new Date(selectedDate);
      dateInput.value = date.toISOString().split('T')[0];
    }

    // Populate task select with current projects
    this.populateTaskSelect(taskSelect);

    modal.style.display = 'flex';

    // Focus on first input
    const customTaskInput = modal.querySelector('.custom-task-input');
    if (customTaskInput) {
      customTaskInput.focus();
    }
  }

  populateTaskSelect(selectElement) {
    // Get projects from projects table (if available)
    const projects = this.data.get('projects', []);

    selectElement.innerHTML = '<option value="">Select from projects...</option>';

    projects.forEach((project) => {
      const option = document.createElement('option');
      option.value = project.name;
      option.textContent = project.name;
      selectElement.appendChild(option);
    });

    // Add some default focus session types
    const defaultSessions = [
      'Deep Work Session',
      'Creative Thinking',
      'Admin & Organization',
      'Learning & Research',
      'Writing & Documentation',
    ];

    defaultSessions.forEach((session) => {
      const option = document.createElement('option');
      option.value = session;
      option.textContent = session;
      selectElement.appendChild(option);
    });
  }

  saveFocusSession(container) {
    const modal = container.querySelector('.focus-planner-modal');
    const taskSelect = modal.querySelector('.task-select');
    const customTaskInput = modal.querySelector('.custom-task-input');
    const dateInput = modal.querySelector('.focus-date-input');
    const timeInput = modal.querySelector('.focus-time-input');
    const activeType = modal.querySelector('.session-type-btn.active');
    const customDuration = modal.querySelector('.custom-duration');

    // Get form values
    const task = customTaskInput.value.trim() || taskSelect.value;
    const date = dateInput.value;
    const time = timeInput.value;
    const type = activeType ? activeType.dataset.type : 'pomodoro';

    // Validation
    if (!task || !date || !time) {
      alert('Please fill in all required fields');
      return;
    }

    // Create session object
    const session = {
      id: Date.now().toString(),
      task,
      date,
      time,
      type,
      duration:
        type === 'custom' ? parseInt(customDuration.value, 10) : type === 'deep-work' ? 60 : 25,
      created: new Date().toISOString(),
      completed: false,
    };

    // Save to data manager
    const sessions = this.data.get('focusSessions', []);
    sessions.push(session);
    this.data.set('focusSessions', sessions);

    // Close modal and refresh display
    modal.style.display = 'none';
    this.renderCompactCalendars();

    // Show confirmation
    this.showNotification(`🔥 Focus session scheduled for ${task}!`);
  }

  showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
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
      max-width: 300px;
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
  }

  initializeSettingsMenu() {
    const settingsMenu = document.getElementById('settings-menu');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const settingsClose = document.getElementById('settings-close');
    const logoutButton = document.getElementById('logout-button');

    // Feature toggle buttons
    const stimmingCornerToggle = document.getElementById('stimming-corner-toggle');
    const floatingNotesToggle = document.getElementById('floating-notes-toggle');
    const celebrationsToggle = document.getElementById('celebrations-toggle');
    const autoThemeToggle = document.getElementById('auto-theme-toggle');

    if (settingsToggle && settingsDropdown && settingsMenu) {
      settingsToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleSettingsMenu();
      });

      if (settingsClose) {
        settingsClose.addEventListener('click', (event) => {
          event.preventDefault();
          this.closeSettingsMenu();
        });
      }

      document.addEventListener('click', (event) => {
        if (!settingsMenu.contains(event.target)) {
          this.closeSettingsMenu();
        }
      });

      // Handle logout button
      if (logoutButton) {
        logoutButton.addEventListener('click', () => {
          this.handleLogout();
        });
      }

      // Handle feature toggles
      if (stimmingCornerToggle) {
        stimmingCornerToggle.addEventListener('click', () => {
          this.toggleStimmingCorner();
          this.updateSettingsStates();
        });
      }

      if (floatingNotesToggle) {
        floatingNotesToggle.addEventListener('click', () => {
          this.toggleFloatingNotes();
          this.updateSettingsStates();
        });
      }

      if (celebrationsToggle) {
        celebrationsToggle.addEventListener('click', () => {
          this.toggleCelebrations();
          this.updateSettingsStates();
        });
      }

      if (autoThemeToggle) {
        autoThemeToggle.addEventListener('click', () => {
          const isEnabled = this.data.get('autoThemeEnabled', true);
          this.setAutoThemeEnabled(!isEnabled);
          this.updateSettingsStates();
        });
      }

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          this.closeSettingsMenu();
        }
      });
    }

    this.updateSettingsStates();
  }

  toggleSettingsMenu() {
    const settingsDropdown = document.getElementById('settings-dropdown');
    if (!settingsDropdown) {
      return;
    }

    if (settingsDropdown.classList.contains('active')) {
      this.closeSettingsMenu();
    } else {
      this.openSettingsMenu();
    }
  }

  openSettingsMenu() {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsDropdown = document.getElementById('settings-dropdown');
    if (settingsToggle && settingsDropdown) {
      settingsDropdown.classList.add('active');
      settingsToggle.classList.add('is-active');
      settingsToggle.setAttribute('aria-expanded', 'true');
      this.updateSettingsStates();
    }
  }

  closeSettingsMenu() {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsDropdown = document.getElementById('settings-dropdown');
    if (settingsToggle && settingsDropdown) {
      settingsDropdown.classList.remove('active');
      settingsToggle.classList.remove('is-active');
      settingsToggle.setAttribute('aria-expanded', 'false');
    }
  }

  // setControlState method removed - no longer needed

  // updateThemePills method removed - no longer needed

  updateSettingsStates() {
    // Update toggle button states to show active/inactive
    const stimmingCornerToggle = document.getElementById('stimming-corner-toggle');
    const floatingNotesToggle = document.getElementById('floating-notes-toggle');
    const celebrationsToggle = document.getElementById('celebrations-toggle');
    const autoThemeToggle = document.getElementById('auto-theme-toggle');

    // Stimming Corner toggle
    if (stimmingCornerToggle) {
      const isEnabled = this.data.get('stimmingCornerEnabled', false);
      stimmingCornerToggle.classList.toggle('is-active', isEnabled);
    }

    // Floating Notes toggle
    if (floatingNotesToggle) {
      const isEnabled = this.data.get('floatingNotesEnabled', false);
      floatingNotesToggle.classList.toggle('is-active', isEnabled);
    }

    // Celebrations toggle
    if (celebrationsToggle) {
      const isEnabled = this.data.get('celebrationsEnabled', true);
      celebrationsToggle.classList.toggle('is-active', isEnabled);
    }

    // Auto Theme toggle
    if (autoThemeToggle) {
      const isEnabled = this.data.get('autoThemeEnabled', true);
      autoThemeToggle.classList.toggle('is-active', isEnabled);
    }
  }

  setAutoThemeEnabled(enabled, options = {}) {
    const { silent = false } = options;
    const currentlyAuto = !this.themeController?.manualOverride;

    if (enabled === currentlyAuto) {
      this.updateSettingsStates();
      return;
    }

    if (enabled) {
      this.themeController?.enableAutoMode();
      if (!silent) {
        this.showNotification('🪄 Auto theme enabled');
      }
    } else {
      this.themeController.manualOverride = true;
      localStorage.setItem('dashboard-theme-manual', 'true');
      localStorage.setItem('dashboard-theme', this.themeController.currentTheme);
      if (!silent) {
        this.showNotification('🎚️ Manual theme control enabled');
      }
    }

    this.updateSettingsStates();
  }

  applyDayMode(isDayMode) {
    const dayModeToggle = document.getElementById('day-mode-toggle');

    if (isDayMode) {
      document.body.setAttribute('data-day-mode', 'true');
    } else {
      document.body.removeAttribute('data-day-mode');
    }

    if (dayModeToggle) {
      dayModeToggle.classList.toggle('active', isDayMode);
    }

    this.updateSettingsStates();
  }

  toggleEmergencyMode() {
    const emergencyToggle = document.getElementById('emergency-toggle');
    const isActive = this.data.get('emergencyMode', false);
    const newState = !isActive;

    this.data.set('emergencyMode', newState);

    document.body.classList.toggle('emergency-mode', newState);

    if (newState) {
      document.body.setAttribute('data-emergency-mode', 'true');
    } else {
      document.body.removeAttribute('data-emergency-mode');
    }

    if (emergencyToggle) {
      emergencyToggle.classList.toggle('active', newState);

      const icon = emergencyToggle.querySelector('.item-icon');
      if (icon) {
        icon.textContent = newState ? '✅' : '🚨';
      }

      const label = emergencyToggle.querySelector('.item-text');
      if (label) {
        label.textContent = newState ? 'Exit Emergency' : 'Emergency Mode';
      } else {
        emergencyToggle.textContent = newState ? '✅ Exit Emergency' : '🚨 Emergency';
      }
    }

    if (newState) {
      this.showEmergencyInterface();
      this.showEmergencyGuidance();
    }

    this.updateSettingsStates();
  }

  toggleFocusMode() {
    const focusToggle = document.getElementById('focus-toggle');
    const body = document.body;
    const isFocusMode = body.hasAttribute('data-focus-mode');

    if (isFocusMode) {
      body.removeAttribute('data-focus-mode');
      focusToggle?.classList.remove('active');
    } else {
      body.setAttribute('data-focus-mode', 'true');
      focusToggle?.classList.add('active');
      // Hide non-essential elements for better focus
      this.showFocusInterface();
    }

    this.updateSettingsStates();
  }

  showEmergencyInterface() {
    // Emergency mode shows only essential elements
    console.log('Emergency mode activated - showing crisis support interface');
  }

  showFocusInterface() {
    // Focus mode hides distractions
    console.log('Focus mode activated - minimizing distractions');
  }

  renderADHDPlaceholders() {
    // Note: Focus Flow is now integrated into the weekly calendar

    // Other placeholder content would go here if needed
    const placeholderContainer = document.getElementById('placeholder-container');
    if (placeholderContainer) {
      placeholderContainer.innerHTML = `
        <div class="placeholder-content">
          <p class="placeholder-text">Dashboard components loaded</p>
          <div class="placeholder-features">
            <span class="feature-tag">Pomodoro Timer</span>
            <span class="feature-tag">Hyperfocus Mode</span>
            <span class="feature-tag">Task Priority</span>
            <span class="feature-tag">Context Switching</span>
          </div>
        </div>
      `;
    }

    // Energy & Mood placeholder
    const energyMoodContainer = document.getElementById('energy-mood-container');
    if (energyMoodContainer) {
      energyMoodContainer.innerHTML = `
        <div class="placeholder-content">
          <p class="placeholder-text">⚡ ADHD Energy & Mood Tracking</p>
          <div class="placeholder-features">
            <span class="feature-tag">Energy Levels</span>
            <span class="feature-tag">Mood Check-ins</span>
            <span class="feature-tag">Pattern Recognition</span>
            <span class="feature-tag">Stimming Support</span>
          </div>
        </div>
      `;
    }

    // Initialize ADHD support widgets
    this.initializeADHDWidgets();
  }

  attachGlobalEvents() {
    // Add project button handler - use event delegation to avoid multiple listeners
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('add-project-btn')) {
        event.preventDefault();
        this.showNewProjectModal();
      }
    });

    // Emergency mode toggle for any global trigger outside settings menu
    document.querySelectorAll('.emergency-toggle').forEach((button) => {
      if (button.closest('#settings-menu')) {
        return;
      }
      button.addEventListener('click', () => this.toggleEmergencyMode());
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + E for emergency mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        this.toggleEmergencyMode();
      }

      // Escape to cancel sprint
      if (e.key === 'Escape' && this.data.get('sprintActive', false)) {
        this.modules.topThree?.stopSprint?.();
      }
    });

    // Handle visibility changes (page focus/blur)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden - could pause timers if needed
        console.log('Dashboard hidden');
      } else {
        // Page is visible - refresh data if needed
        console.log('Dashboard visible');
        this.refreshData();
      }
    });
  }

  initializeADHDWidgets() {
    this.stimmingEnabled = this.data.get('stimmingEnabled', false);
    this.celebrationsEnabled = this.data.get('celebrationsEnabled', true);
    this.floatingNotesEnabled = this.data.get('floatingNotesEnabled', true);

    // Stimming corner button functionality
    const stimmingBtn = document.querySelector('.stimming-btn');
    if (stimmingBtn) {
      stimmingBtn.addEventListener('click', () => this.toggleStimmingCorner());
    }

    // Apply stored preferences
    this.setStimmingCornerEnabled(this.stimmingEnabled, { animate: false, persist: false });

    // Initialize fidget widgets
    this.initializeFidgetWidgets();

    // Add floating working memory support
    this.initializeFloatingNotes();

    // Add celebration system
    this.celebrationCount = 0;

    this.updateSettingsStates();
  }

  setStimmingCornerEnabled(enabled, options = {}) {
    const { animate = true, persist = true } = options;
    const stimmingCorner = document.getElementById('stimming-corner');

    this.stimmingEnabled = enabled;

    if (persist) {
      this.data.set('stimmingEnabled', enabled);
    }

    if (!stimmingCorner) {
      this.updateSettingsStates();
      return;
    }

    if (enabled) {
      stimmingCorner.style.display = 'block';
      if (animate) {
        stimmingCorner.style.animation = 'slideInRight 0.3s ease-out';
      } else {
        stimmingCorner.style.animation = '';
      }
    } else if (animate) {
      stimmingCorner.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (!this.stimmingEnabled) {
          stimmingCorner.style.display = 'none';
        }
      }, 300);
    } else {
      stimmingCorner.style.display = 'none';
      stimmingCorner.style.animation = '';
    }

    this.updateSettingsStates();
  }

  toggleStimmingCorner() {
    this.setStimmingCornerEnabled(!this.stimmingEnabled);
  }

  initializeFidgetWidgets() {
    // Stress ball interaction
    const stressBall = document.getElementById('stress-ball');
    if (stressBall) {
      stressBall.addEventListener('click', () => {
        stressBall.style.transform = 'scale(0.8)';
        setTimeout(() => {
          stressBall.style.transform = 'scale(1)';
        }, 100);
        this.playHapticFeedback();
      });
    }

    // Spinner interaction
    const spinner = document.getElementById('spinner');
    if (spinner) {
      spinner.addEventListener('click', () => {
        spinner.style.animationDuration = '0.2s';
        setTimeout(() => {
          spinner.style.animationDuration = '3s';
        }, 2000);
      });
    }

    // Breathing circle
    const breathingCircle = document.getElementById('breathing-circle');
    if (breathingCircle) {
      breathingCircle.addEventListener('click', () => {
        breathingCircle.style.animationDuration = '2s';
        this.showFloatingNote('Focus on your breathing 🫁', 4000);
        setTimeout(() => {
          breathingCircle.style.animationDuration = '4s';
        }, 10000);
      });
    }
  }

  initializeFloatingNotes() {
    // Add working memory support notes
    this.workingMemoryNotes = [];

    if (this.floatingNotesEnabled) {
      this.startFloatingNotesInterval();
    } else {
      this.stopFloatingNotesInterval();
      const floatingNotes = document.getElementById('floating-notes');
      if (floatingNotes) {
        floatingNotes.innerHTML = '';
      }
    }
  }

  startFloatingNotesInterval() {
    this.stopFloatingNotesInterval();

    this.floatingNotesInterval = setInterval(
      () => {
        if (document.visibilityState === 'visible' && this.floatingNotesEnabled) {
          this.showFloatingNote('💭 Quick brain check - what were you doing?', 5000);
        }
      },
      25 * 60 * 1000
    );
  }

  stopFloatingNotesInterval() {
    if (this.floatingNotesInterval) {
      clearInterval(this.floatingNotesInterval);
      this.floatingNotesInterval = null;
    }
  }

  setFloatingNotesEnabled(enabled, options = {}) {
    const { persist = true, silent = false } = options;

    this.floatingNotesEnabled = enabled;

    if (enabled) {
      this.startFloatingNotesInterval();
      if (!silent) {
        this.showNotification('💭 Working memory reminders on');
      }
    } else {
      this.stopFloatingNotesInterval();
      const floatingNotes = document.getElementById('floating-notes');
      if (floatingNotes) {
        floatingNotes.innerHTML = '';
      }
      if (!silent) {
        this.showNotification('💤 Working memory reminders paused');
      }
    }

    if (persist) {
      this.data.set('floatingNotesEnabled', enabled);
    }

    this.updateSettingsStates();
  }

  toggleFloatingNotes() {
    this.setFloatingNotesEnabled(!this.floatingNotesEnabled);
  }

  showFloatingNote(message, duration = 3000) {
    const floatingNotes = document.getElementById('floating-notes');
    const note = document.createElement('div');
    note.className = 'floating-note';
    note.textContent = message;

    note.addEventListener('click', () => note.remove());

    floatingNotes.appendChild(note);

    setTimeout(() => {
      if (note.parentElement) {
        note.remove();
      }
    }, duration);
  }

  setCelebrationsEnabled(enabled, options = {}) {
    const { persist = true, silent = false } = options;

    this.celebrationsEnabled = enabled;

    if (persist) {
      this.data.set('celebrationsEnabled', enabled);
    }

    if (!silent) {
      this.showNotification(enabled ? '🎉 Mini celebrations on' : '🔕 Celebrations muted');
    }

    this.updateSettingsStates();
  }

  toggleCelebrations() {
    this.setCelebrationsEnabled(!this.celebrationsEnabled);
  }

  triggerCelebration(message = '🎉') {
    if (!this.celebrationsEnabled) {
      return;
    }

    this.celebrationCount++;

    // Create confetti
    const celebrationOverlay = document.getElementById('celebration-overlay');
    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = this.getRandomColor();
      confetti.style.animationDelay = Math.random() * 2 + 's';

      celebrationOverlay.appendChild(confetti);

      setTimeout(() => confetti.remove(), 3000);
    }

    // Show celebration message
    this.showFloatingNote(`${message} Celebration #${this.celebrationCount}!`, 2000);

    // Play sound if available
    this.playHapticFeedback();
  }

  getRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  playHapticFeedback() {
    // Try to use haptic feedback on mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  showEmergencyGuidance() {
    // Simple guidance overlay for emergency mode
    const guidance = document.createElement('div');
    guidance.className = 'emergency-guidance';
    guidance.innerHTML = `
      <div class="guidance-content">
        <h3>🚨 Emergency Mode Active</h3>
        <p>Focus on just ONE thing:</p>
        <ul>
          <li>Choose your most urgent task</li>
          <li>Start a sprint timer</li>
          <li>Ignore everything else</li>
        </ul>
        <button onclick="this.parentElement.parentElement.remove()">Got it</button>
      </div>
    `;

    guidance.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    document.body.appendChild(guidance);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (guidance.parentElement) {
        guidance.remove();
      }
    }, 5000);
  }

  refreshData() {
    // Refresh all modules - useful when returning to the page
    Object.values(this.modules).forEach((module) => {
      if (module.render) {
        module.render();
      }
    });
  }

  showNewProjectModal() {
    // Check if modal already exists
    const existingModal = document.querySelector('.project-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'project-modal';
    modal.innerHTML = `
      <div class="project-modal__backdrop"></div>
      <div class="project-modal__dialog">
        <h3>Create New Project</h3>
        <form class="project-form">
          <div class="form-group">
            <label for="project-name">Project Name</label>
            <input type="text" id="project-name" placeholder="Enter project name" required>
          </div>

          <div class="form-group">
            <label for="project-category">Category</label>
            <select id="project-category">
              <option value="Teaching">📚 Teaching</option>
              <option value="Coaching">🎯 Coaching</option>
              <option value="ADHD Projects">🧠 ADHD Projects</option>
              <option value="Economics">💰 Economics</option>
            </select>
          </div>

          <div class="form-group">
            <label for="project-priority">Priority</label>
            <select id="project-priority">
              <option value="high">🔥 High</option>
              <option value="medium" selected>⚡ Medium</option>
              <option value="low">🌱 Low</option>
            </select>
          </div>

          <div class="form-group">
            <label for="project-todos">Initial Todos</label>
            <textarea id="project-todos" placeholder="What needs to be done first?"></textarea>
          </div>

          <div class="form-group">
            <label for="project-repo">GitHub Repo URL (optional)</label>
            <input type="url" id="project-repo" placeholder="https://github.com/username/repo">
          </div>

          <div class="form-group">
            <label for="project-obsidian">Obsidian Note Name (optional)</label>
            <input type="text" id="project-obsidian" placeholder="Project Notes">
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn--secondary cancel-btn">Cancel</button>
            <button type="submit" class="btn btn--primary">Create Project</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    const form = modal.querySelector('.project-form');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const backdrop = modal.querySelector('.project-modal__backdrop');

    const closeModal = () => {
      modal.remove();
    };

    cancelBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Also add click handler for the submit button as backup
    const submitBtn = modal.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const projectName = document.getElementById('project-name').value.trim();

      if (!projectName) {
        alert('Please enter a project name');
        document.getElementById('project-name').focus();
        return;
      }

      const projectData = {
        name: projectName,
        category: document.getElementById('project-category').value,
        priority: document.getElementById('project-priority').value,
        todos: document.getElementById('project-todos').value.trim(),
        repoUrl: document.getElementById('project-repo').value.trim(),
        obsidianNote: document.getElementById('project-obsidian').value.trim(),
      };
      this.modules.projectsTable.addProject(projectData);
      closeModal();
    });

    // Focus the name field
    setTimeout(() => {
      document.getElementById('project-name').focus();
    }, 100);
  }

  // Utility method for other modules to access app instance
  static getInstance() {
    return window.app;
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new LifeDashboard();
  });
} else {
  window.app = new LifeDashboard();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
}
