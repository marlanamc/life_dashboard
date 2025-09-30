/**
 * Welcome Card Module
 * ADHD-friendly greeting with today's schedule overview
 */
export class WelcomeCard {
  constructor(container, dataManager) {
    this.container = container;
    this.data = dataManager;
    this.calendarConnected = this.data.get('calendarConnected', false);
    this.todayEvents = this.data.get('todayEvents', []);

    this.init();
  }

  init() {
    this.render();
    // Subscribe to calendar data changes
    this.data.subscribe('todayEvents', () => this.render());
    this.data.subscribe('calendarConnected', () => this.render());

    // Initialize with some demo events if none exist
    this.initializeDemoData();
  }

  initializeDemoData() {
    const hasData =
      this.data.get('todayEvents', []).length > 0 || this.data.get('calendarConnected', false);
    if (!hasData) {
      // Add some demo events for the next few hours
      const now = new Date();
      const demoEvents = [
        {
          title: 'Team Standup',
          start: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
          end: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          location: 'Conference Room A',
        },
        {
          title: 'Focus Time: Project Review',
          start: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          end: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
        },
        {
          title: 'Coffee with Sarah',
          start: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
          end: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
          location: 'Local Café',
        },
      ];
      this.data.set('todayEvents', demoEvents);
    }
  }

  getTimeBasedGreeting() {
    const hour = new Date().getHours();
    const userName = this.data.get('userName', 'friend');

    let timeGreeting = '';
    let emoji = '';

    if (hour < 12) {
      timeGreeting = 'Good morning';
      emoji = '🌤️';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
      emoji = '☀️';
    } else {
      timeGreeting = 'Good evening';
      emoji = '🌅';
    }

    return { timeGreeting, emoji, userName };
  }

  getTodaySchedule() {
    const events = this.data.get('todayEvents', []);
    const now = new Date();
    const today = new Date().toDateString();

    // Filter events for today and sort by time
    const todayEvents = events
      .filter((event) => new Date(event.start).toDateString() === today)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    const upcoming = todayEvents.filter((event) => new Date(event.start) > now);
    const current = todayEvents.find(
      (event) => new Date(event.start) <= now && new Date(event.end) > now
    );

    return { todayEvents, upcoming, current };
  }

  formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  getScheduleMessage() {
    const { todayEvents, upcoming, current } = this.getTodaySchedule();

    if (current) {
      return `Currently: ${current.title} (until ${this.formatTime(current.end)})`;
    } else if (upcoming.length > 0) {
      const next = upcoming[0];
      return `Up next: ${next.title} at ${this.formatTime(next.start)}`;
    } else if (todayEvents.length > 0) {
      return `All done with meetings today! 🎉`;
    } else {
      return `No meetings scheduled today. Perfect for deep work! 💪`;
    }
  }

  getEventStatus(event) {
    const now = new Date();
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    if (now >= eventStart && now <= eventEnd) {
      return 'current';
    } else if (now > eventEnd) {
      return 'past';
    } else {
      return 'upcoming';
    }
  }

  getTimeUntil(dateString) {
    const eventTime = new Date(dateString);
    const now = new Date();
    const diffMs = eventTime - now;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      return remainingMins > 0 ? `${diffHours}h ${remainingMins}m` : `${diffHours}h`;
    }
  }

  render() {
    const { timeGreeting, emoji, userName } = this.getTimeBasedGreeting();
    const { todayEvents, upcoming } = this.getTodaySchedule();
    const calendarConnected = this.data.get('calendarConnected', false);
    const scheduleMessage = this.getScheduleMessage();

    this.container.innerHTML = `
      <div class="welcome-content">
        <div class="greeting-section">
          <div class="greeting-text">
            <h2 class="main-greeting">${timeGreeting}, ${userName}! ${emoji}</h2>
            <p class="schedule-message">${scheduleMessage}</p>
          </div>
        </div>

        <div class="calendar-section">
          ${
            calendarConnected
              ? `
            <div class="today-schedule-compact">
              <div class="schedule-header-compact">
                <span class="schedule-icon">📅</span>
                <span class="schedule-count">${todayEvents.length} events today</span>
                <button class="btn btn--small btn--ghost refresh-calendar-btn">🔄</button>
              </div>

              ${
                todayEvents.length > 0
                  ? `
                <div class="events-preview">
                  ${todayEvents
                    .slice(0, 2)
                    .map(
                      (event) => `
                    <div class="event-compact ${this.getEventStatus(event)}">
                      <span class="event-time-compact">${this.formatTime(event.start)}</span>
                      <span class="event-title-compact">${event.title}</span>
                    </div>
                  `
                    )
                    .join('')}
                  ${
                    todayEvents.length > 2
                      ? `
                    <div class="more-events-compact">+${todayEvents.length - 2} more</div>
                  `
                      : ''
                  }
                </div>
              `
                  : `
                <div class="no-events-compact">
                  <span>📭 No events today - perfect for deep work!</span>
                </div>
              `
              }
            </div>
          `
              : `
            <div class="calendar-setup-compact">
              <div class="setup-row">
                <div class="setup-info">
                  <span class="setup-icon-small">📅</span>
                  <span class="setup-text">Connect your calendar</span>
                </div>
                <div class="setup-actions">
                  <button class="btn btn--small btn--primary connect-google-btn">Google</button>
                  <button class="btn btn--small demo-calendar-btn">Demo</button>
                </div>
              </div>
            </div>
          `
          }
        </div>

        ${
          upcoming.length > 0 && calendarConnected
            ? `
          <div class="next-event-alert">
            <span class="alert-icon">⏰</span>
            <span class="alert-text">
              Next: <strong>${upcoming[0].title}</strong> in ${this.getTimeUntil(upcoming[0].start)}
            </span>
          </div>
        `
            : ''
        }
      </div>

      <style>
        .welcome-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .greeting-section {
          text-align: left;
        }

        .main-greeting {
          font-size: var(--text-2xl);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
          margin: 0 0 var(--spacing-sm) 0;
          line-height: var(--leading-tight);
        }

        .schedule-message {
          font-size: var(--text-base);
          color: var(--color-text-secondary);
          margin: 0;
          font-weight: var(--font-medium);
        }

        /* Compact Calendar Styles */
        .calendar-setup-compact {
          padding: var(--spacing-md);
          background: rgba(255, 255, 255, 0.3);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(139, 124, 248, 0.1);
        }

        .setup-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-md);
        }

        .setup-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .setup-icon-small {
          font-size: var(--text-lg);
        }

        .setup-text {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          font-weight: var(--font-medium);
        }

        .setup-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        /* Compact Schedule Styles */
        .today-schedule-compact {
          background: rgba(255, 255, 255, 0.3);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(139, 124, 248, 0.1);
          overflow: hidden;
        }

        .schedule-header-compact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md);
          background: rgba(139, 124, 248, 0.05);
          border-bottom: 1px solid rgba(139, 124, 248, 0.1);
        }

        .schedule-icon {
          font-size: var(--text-base);
          margin-right: var(--spacing-xs);
        }

        .schedule-count {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
        }

        .events-preview {
          padding: var(--spacing-sm) var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .event-compact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
        }

        .event-compact:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .event-compact.current {
          background: rgba(16, 185, 129, 0.1);
          border-left: 3px solid #10b981;
        }

        .event-compact.past {
          opacity: 0.6;
        }

        .event-time-compact {
          font-size: var(--text-xs);
          font-weight: var(--font-semibold);
          color: var(--color-text-secondary);
          font-family: 'Monaco', 'Consolas', monospace;
          min-width: 60px;
        }

        .event-title-compact {
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          font-weight: var(--font-medium);
          flex: 1;
          text-align: left;
          margin-left: var(--spacing-sm);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .more-events-compact {
          text-align: center;
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          font-style: italic;
          padding: var(--spacing-xs);
          border-top: 1px solid rgba(139, 124, 248, 0.1);
          margin-top: var(--spacing-xs);
        }

        .no-events-compact {
          padding: var(--spacing-md);
          text-align: center;
        }

        .no-events-compact span {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          font-style: italic;
        }

        /* Next Event Alert */
        .next-event-alert {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
        }

        .alert-icon {
          font-size: var(--text-lg);
        }

        @media (max-width: 768px) {
          .main-greeting {
            font-size: var(--text-xl);
          }

          .calendar-providers {
            width: 100%;
          }

          .event-item {
            flex-direction: column;
            gap: var(--spacing-xs);
          }

          .event-time {
            min-width: auto;
          }
        }
      </style>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Connect Google Calendar
    const connectGoogleBtn = this.container.querySelector('.connect-google-btn');
    if (connectGoogleBtn) {
      connectGoogleBtn.addEventListener('click', () => this.connectGoogleCalendar());
    }

    // Connect Outlook
    const connectOutlookBtn = this.container.querySelector('.connect-outlook-btn');
    if (connectOutlookBtn) {
      connectOutlookBtn.addEventListener('click', () => this.connectOutlookCalendar());
    }

    // Demo calendar button
    const demoCalendarBtn = this.container.querySelector('.demo-calendar-btn');
    if (demoCalendarBtn) {
      demoCalendarBtn.addEventListener('click', () => this.enableDemoCalendar());
    }

    // Refresh calendar
    const refreshBtn = this.container.querySelector('.refresh-calendar-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshCalendar());
    }
  }

  async connectGoogleCalendar() {
    // Placeholder for Google Calendar integration
    // In a real implementation, this would use Google Calendar API
    console.log('Connecting to Google Calendar...');

    // Simulate connection
    this.data.set('calendarConnected', true);
    this.data.set('calendarProvider', 'google');

    // Show success message
    this.showToast('📅 Google Calendar connected successfully!', 'success');
  }

  async connectOutlookCalendar() {
    // Placeholder for Outlook Calendar integration
    console.log('Connecting to Outlook Calendar...');

    // Simulate connection
    this.data.set('calendarConnected', true);
    this.data.set('calendarProvider', 'outlook');

    // Show success message
    this.showToast('📮 Outlook Calendar connected successfully!', 'success');
  }

  enableDemoCalendar() {
    this.data.set('calendarConnected', true);
    this.data.set('calendarProvider', 'demo');
    this.showToast('📅 Demo calendar enabled!', 'info');
  }

  refreshCalendar() {
    // Placeholder for calendar refresh
    console.log('Refreshing calendar data...');
    this.showToast('🔄 Calendar refreshed!', 'info');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `calendar-toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${type === 'success' ? 'var(--color-success)' : 'var(--color-primary)'};
      color: white;
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}
