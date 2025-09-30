/**
 * Weekly Calendar Component
 * Displays a week view with TickTick events and navigation
 */
export class WeeklyCalendar {
  constructor(container, dataManager, ticktickService = null) {
    this.container = container;
    this.data = dataManager;
    this.ticktickService = ticktickService;
    this.currentWeek = new Date();
    this.events = [];
    this.tasks = [];

    this.init();
  }

  init() {
    console.log('WeeklyCalendar: Container found:', !!this.container);
    if (this.container) {
      this.render();
      this.loadEvents();

      // Listen for TickTick integration events to keep calendar in sync
      try {
        document.addEventListener('ticktick:connected', () => {
          // Use the globally exposed service if available
          const svc =
            window.lifeDashboard?.modules?.ticktickIntegration?.ticktickService ||
            this.ticktickService;
          if (svc) this.setTickTickService(svc);
        });
        document.addEventListener('ticktick:synced', () => this.refresh());
        document.addEventListener('ticktick:disconnected', () => {
          this.tasks = [];
          this.render();
        });
      } catch (e) {
        console.warn('WeeklyCalendar: failed to attach TickTick event listeners', e);
      }
    } else {
      console.error('WeeklyCalendar: Container not found!');
    }
  }

  render() {
    const weekDates = this.getWeekDates(this.currentWeek);
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];

    this.container.innerHTML = `
      <div class="weekly-calendar">
        <div class="calendar-header">
          <div class="calendar-title">
            <h3>This Week & Focus Sessions</h3>
            <div class="week-range">
              ${this.formatWeekRange(weekStart, weekEnd)}
            </div>
          </div>
          <div class="calendar-actions">
            <button class="btn btn--small btn--ghost prev-week-btn" title="Previous week">
              <span>◀</span>
            </button>
            <button class="btn btn--small btn--primary plan-btn" title="Plan focus sessions">
              <span>🔥</span>
              Plan
            </button>
            <button class="btn btn--small btn--ghost next-week-btn" title="Next week">
              <span>▶</span>
            </button>
          </div>
        </div>

        <div class="calendar-week">
          ${weekDates.map((date, index) => this.renderDayCard(date, index)).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();

    // Debug: Check if navigation buttons were created
    const prevBtn = this.container.querySelector('.prev-week-btn');
    const nextBtn = this.container.querySelector('.next-week-btn');
    console.log('WeeklyCalendar: Navigation buttons created:', {
      prevBtn: !!prevBtn,
      nextBtn: !!nextBtn,
    });
  }

  renderDayCard(date, index) {
    const isToday = this.isToday(date);
    const isSelected = this.isSelected(date);
    const dayEvents = this.getEventsForDate(date);
    const dayTasks = this.getTasksForDate(date);

    return `
      <div class="day-card ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${this.formatDate(date)}">
        <div class="day-header">
          <div class="day-name">${this.getDayName(date)}</div>
          <div class="day-number">${date.getDate()}</div>
        </div>
        
        <div class="day-events">
          ${
            dayEvents.length > 0
              ? dayEvents
                  .map(
                    (event) => `
              <div class="event-item ${event.priority || 'medium'}-priority" title="${event.title}">
                ${event.title}
              </div>
            `
                  )
                  .join('')
              : '<div class="no-events">No events</div>'
          }
          
          ${
            dayTasks.length > 0
              ? dayTasks
                  .map(
                    (task) => `
              <div class="event-item task-item ${task.priority || 'medium'}-priority" title="${task.title}">
                📋 ${task.title}
              </div>
            `
                  )
                  .join('')
              : ''
          }
        </div>
        
        <button class="add-event-btn" data-date="${this.formatDate(date)}" title="Add event">
          +
        </button>
      </div>
    `;
  }

  getWeekDates(centerDate) {
    const dates = [];
    const startOfWeek = new Date(centerDate);
    startOfWeek.setDate(centerDate.getDate() - centerDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }

    return dates;
  }

  formatWeekRange(startDate, endDate) {
    const start = this.formatDateShort(startDate);
    const end = this.formatDateShort(endDate);
    return `${start} - ${end}`;
  }

  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  formatDateShort(date) {
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  getDayName(date) {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  }

  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isSelected(date) {
    // For now, just highlight today
    return this.isToday(date);
  }

  getEventsForDate(date) {
    const dateStr = this.formatDate(date);
    return this.events.filter((event) => {
      const eventDate = new Date(event.start || event.dueDate);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  getTasksForDate(date) {
    const dateStr = this.formatDate(date);
    return this.tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  }

  async loadEvents() {
    if (!this.ticktickService || !this.ticktickService.isReady()) {
      console.log('TickTick service not available');
      return;
    }

    try {
      // Load events from TickTick
      const tasks = await this.ticktickService.getTasks();
      this.tasks = Array.isArray(tasks) ? tasks : [];

      // Also load from local data
      const localEvents = this.data.get('calendar_events', []);
      this.events = localEvents;

      this.render();
    } catch (error) {
      console.error('Failed to load events:', error);
      // Attempt a soft fallback: show any locally cached mock tasks if present
      const mock = this.data.get('ticktick_mock_tasks', []);
      if (Array.isArray(mock) && mock.length > 0) {
        this.tasks = mock;
        this.render();
      }
    }
  }

  attachEventListeners() {
    // Week navigation
    const prevBtn = this.container.querySelector('.prev-week-btn');
    const nextBtn = this.container.querySelector('.next-week-btn');

    console.log('Navigation buttons found:', { prevBtn, nextBtn });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        console.log('Previous week clicked');
        this.goToPreviousWeek();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        console.log('Next week clicked');
        this.goToNextWeek();
      });
    }

    // Plan button
    const planBtn = this.container.querySelector('.plan-btn');
    if (planBtn) {
      planBtn.addEventListener('click', () => this.openPlanModal());
    }

    // Day card clicks
    const dayCards = this.container.querySelectorAll('.day-card');
    dayCards.forEach((card) => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('add-event-btn')) {
          this.selectDay(card.dataset.date);
        }
      });
    });

    // Add event buttons
    const addBtns = this.container.querySelectorAll('.add-event-btn');
    addBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.addEvent(btn.dataset.date);
      });
    });
  }

  goToPreviousWeek() {
    const newWeek = new Date(this.currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    this.currentWeek = newWeek;
    this.render();
    this.loadEvents();
  }

  goToNextWeek() {
    const newWeek = new Date(this.currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    this.currentWeek = newWeek;
    this.render();
    this.loadEvents();
  }

  selectDay(dateStr) {
    // Remove previous selection
    const selected = this.container.querySelector('.day-card.selected');
    if (selected) {
      selected.classList.remove('selected');
    }

    // Add selection to clicked day
    const dayCard = this.container.querySelector(`[data-date="${dateStr}"]`);
    if (dayCard) {
      dayCard.classList.add('selected');
    }

    // Store selected date
    this.data.set('selected_date', dateStr);
  }

  openPlanModal() {
    // Create a simple planning modal
    const modal = document.createElement('div');
    modal.className = 'plan-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Plan Focus Sessions</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p>Plan your focus sessions for the week ahead. This will help you stay on track with your goals.</p>
          <div class="plan-options">
            <button class="btn btn--primary" id="sync-ticktick-tasks">Sync TickTick Tasks</button>
            <button class="btn btn--ghost" id="add-focus-session">Add Focus Session</button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.modal-backdrop').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('#sync-ticktick-tasks').addEventListener('click', () => {
      this.loadEvents();
      document.body.removeChild(modal);
    });
  }

  addEvent(dateStr) {
    const title = prompt('Enter event title:');
    if (title) {
      const event = {
        id: Date.now(),
        title: title,
        start: dateStr,
        priority: 'medium',
      };

      const events = this.data.get('calendar_events', []);
      events.push(event);
      this.data.set('calendar_events', events);

      this.events = events;
      this.render();
    }
  }

  // Public method to refresh events
  refresh() {
    this.loadEvents();
  }

  // Public method to set TickTick service
  setTickTickService(service) {
    this.ticktickService = service;
    this.loadEvents();
  }
}
