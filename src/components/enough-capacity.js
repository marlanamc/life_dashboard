/**
 * Enough - Clean Capacity Tracker
 * Simple, beautiful capacity management inspired by the Enough app
 */
export class EnoughCapacity {
  constructor(container, dataManager, taskHub = null) {
    this.container = container;
    this.data = dataManager;
    this.taskHub = taskHub;
    this.currentView = 'daily'; // daily/weekly
    this.currentMode = 'circle'; // circle/cup
    this.tasks = [];
    this.isModalOpen = false;
    this.themeObserver = null;

    this.init();
  }

  init() {
    this.loadTasks();
    this.render();
    this.attachEventListeners();
    this.startCapacityMonitoring();
    this.observeThemeChanges();
  }

  render() {
    const capacityUsed = this.getCapacityUsed();
    const completedCapacity = this.getCompletedCapacity();
    const normalizedUsed = Math.min(100, Math.max(0, capacityUsed));
    const normalizedCompleted = Math.min(100, Math.max(0, completedCapacity));
    const displayUsed = Math.round(normalizedUsed);
    const displayCompleted = Math.round(normalizedCompleted);
    const displayLeft = Math.max(0, 100 - displayUsed);
    const isOverCapacity = normalizedUsed > 100;
    const modalClass = this.isModalOpen ? 'is-open' : '';
    const statusMessage = this.getStatusMessage(displayUsed, isOverCapacity);

    this.container.innerHTML = `
      <div class="card card--nature">
        <div class="card__header">
          <h3 class="card__title">
            <span class="emoji">⚡</span>
            Your Energy Today
          </h3>
          <div class="energy-actions">
            <button class="btn btn--small" id="enough-open-planner">Open planner</button>
          </div>
          </div>
        <div class="card__content">
          <!-- Completion Progress Indicator -->
          <div class="completion-progress" style="margin-bottom: var(--spacing-md);">
            <div class="completion-bar">
              <div class="completion-fill" style="width: ${displayCompleted}%;"></div>
            </div>
            <div class="completion-text">
              <span class="completion-label">Completed: ${displayCompleted}%</span>
              <span class="completion-count">(${this.tasks.filter(t => t.completed).length}/${this.tasks.length} tasks)</span>
            </div>
          </div>

          <div class="organic-capacity">
            <div class="capacity-left">
              <!-- Central Flower/Balance Visual -->
              <div class="balance-center">
              <svg viewBox="0 0 240 240" class="balance-svg">
                <!-- Outer glow ring -->
                <defs>
                  <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="var(--time-card-ring-strong, rgba(139, 124, 248, 0.2))" />
                    <stop offset="70%" stop-color="var(--time-card-ring-soft, rgba(139, 124, 248, 0.08))" />
                    <stop offset="100%" stop-color="var(--time-card-ring-faint, rgba(139, 124, 248, 0.02))" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <!-- Background glow -->
                <circle cx="120" cy="120" r="110" fill="url(#glowGrad)" />

                <!-- Progress rings - Mind, Body, Energy -->
                <g transform="translate(120, 120)">
                  <!-- Mind Ring (outer) - Total capacity -->
                  <circle
                    r="85"
                    fill="none"
                    stroke="rgba(139, 124, 248, 0.12)"
                    stroke-width="12"
                    stroke-linecap="round"
                  />
                  <circle
                    r="85"
                    fill="none"
                    stroke="url(#mindGradient)"
                    stroke-width="12"
                    stroke-linecap="round"
                    stroke-dasharray="534.07"
                    stroke-dashoffset="${534.07 - 534.07 * (normalizedUsed / 100)}"
                    transform="rotate(-90)"
                    class="progress-ring mind-ring"
                    filter="url(#glow)"
                  />

                  <!-- Completed capacity ring (inner, brighter) -->
                  <circle
                    r="70"
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.15)"
                    stroke-width="8"
                    stroke-linecap="round"
                  />
                  <circle
                    r="70"
                    fill="none"
                    stroke="#22c55e"
                    stroke-width="8"
                    stroke-linecap="round"
                    stroke-dasharray="439.82"
                    stroke-dashoffset="${439.82 - 439.82 * (completedCapacity / 100)}"
                    transform="rotate(-90)"
                    class="progress-ring completed-ring"
                    opacity="0.8"
                  />

                  <!-- Body Ring (middle) -->
                  <circle
                    r="65"
                    fill="none"
                    stroke="rgba(96, 165, 250, 0.12)"
                    stroke-width="10"
                    stroke-linecap="round"
                  />
                  <circle
                    r="65"
                    fill="none"
                    stroke="url(#bodyGradient)"
                    stroke-width="10"
                    stroke-linecap="round"
                    stroke-dasharray="408.4"
                    stroke-dashoffset="${408.4 - 408.4 * (normalizedUsed / 100)}"
                    transform="rotate(-90)"
                    class="progress-ring body-ring"
                    filter="url(#glow)"
                  />

                  <!-- Energy Ring (inner) -->
                  <circle
                    r="45"
                    fill="none"
                    stroke="rgba(45, 212, 191, 0.14)"
                    stroke-width="8"
                    stroke-linecap="round"
                  />
                  <circle
                    r="45"
                    fill="none"
                    stroke="url(#energyGradient)"
                    stroke-width="8"
                    stroke-linecap="round"
                    stroke-dasharray="282.7"
                    stroke-dashoffset="${282.7 - 282.7 * (normalizedUsed / 100)}"
                    transform="rotate(-90)"
                    class="progress-ring energy-ring"
                    filter="url(#glow)"
                  />
                </g>

                <!-- Central flower/lotus -->
                <g transform="translate(120, 120)" class="center-flower">
                  <path d="M0,-15 Q-10,-5 -15,0 Q-10,5 0,15 Q10,5 15,0 Q10,-5 0,-15 Z"
                        fill="url(#flowerGradient)" opacity="0.8"/>
                  <path d="M-15,0 Q-5,-10 0,-15 Q5,-10 15,0 Q5,10 0,15 Q-5,10 -15,0 Z"
                        fill="url(#flowerGradient)" opacity="0.6"/>
                  <circle r="6" fill="url(#centerGradient)" />
                </g>

                <!-- Gradients -->
                <defs>
                  <linearGradient id="mindGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#8b7cf8" />
                    <stop offset="45%" stop-color="#a78bfa" />
                    <stop offset="100%" stop-color="#c4b5fd" />
                  </linearGradient>
                  <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#60a5fa" />
                    <stop offset="45%" stop-color="#93c5fd" />
                    <stop offset="100%" stop-color="#bfdbfe" />
                  </linearGradient>
                  <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2dd4bf" />
                    <stop offset="45%" stop-color="#5eead4" />
                    <stop offset="100%" stop-color="#99f6e4" />
                  </linearGradient>
                  <radialGradient id="flowerGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="rgba(139, 124, 248, 0.45)" />
                    <stop offset="100%" stop-color="rgba(139, 124, 248, 0.08)" />
                  </radialGradient>
                  <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="100%" stop-color="rgba(139, 124, 248, 0.28)" />
                  </radialGradient>
                </defs>
            </svg>

              <!-- Center percentage -->
              <div class="balance-percentage">
                <div class="main-percent">${displayUsed}%</div>
                <div class="balance-label">CAPACITY USED</div>
            </div>
          </div>

              <!-- Status Message -->
              <div class="energy-status">
                ${statusMessage ? `<p class="energy-status-text">${statusMessage}</p>` : ''}
                <div class="energy-remaining">${displayLeft}% left today</div>
              </div>
            </div>

            <div class="capacity-right">
              <div class="capacity-tasks">
                <div class="capacity-tasks-header">
                  <h4 class="tasks-title">Tasks (${this.tasks.length})</h4>
                  <button class="btn btn--small" id="add-task-btn">+ Add</button>
                </div>
                <div class="tasks-main-list">
                  ${this.tasks.length === 0
                    ? `<div class="no-tasks-main">Add tasks to track your energy</div>`
                    : this.tasks.map((task, index) => `
                      <div class="main-task-item ${task.completed ? 'completed' : ''}" data-index="${index}">
                        <label class="main-task-checkbox" for="main-task-${index}">
                          <input type="checkbox" id="main-task-${index}" ${task.completed ? 'checked' : ''}>
                          <span class="main-checkbox-visual"></span>
                        </label>
                        <div class="main-task-content">
                          <div class="main-task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                          <div class="main-task-meta">
                            <span class="main-task-duration">${task.duration}min</span>
                            ${task.energyType ? `<span class="main-task-energy">${this.getEnergyTypeEmoji(task.energyType)}</span>` : ''}
                          </div>
                        </div>
                      </div>
                    `).join('')
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="enough-modal ${modalClass}" role="dialog" aria-modal="true" aria-hidden="${this.isModalOpen ? 'false' : 'true'}">
        <div class="enough-modal__backdrop" data-close="modal"></div>
        <div class="enough-modal__dialog" role="document">
          <header class="modal-header">
            <div>
              <h2 class="modal-title">Enough Planner</h2>
              <p class="modal-subtitle">All the energy details live here.</p>
            </div>
            <button class="modal-close" data-close="modal" aria-label="Close planner">×</button>
          </header>

          <section class="modal-section">
            <h3 class="section-heading">Energy view</h3>
            <div class="toggle-buttons">
              <div class="toggle-group" aria-label="Energy view">
                <button class="toggle-btn ${this.currentView === 'daily' ? 'active' : ''}" data-view="daily">Daily</button>
                <button class="toggle-btn ${this.currentView === 'weekly' ? 'active' : ''}" data-view="weekly">Weekly</button>
              </div>
              <div class="toggle-group" aria-label="Visualization">
                <button class="toggle-btn ${this.currentMode === 'circle' ? 'active' : ''}" data-mode="circle">Circle</button>
                <button class="toggle-btn ${this.currentMode === 'cup' ? 'active' : ''}" data-mode="cup">Cup</button>
              </div>
            </div>
          </section>

          <section class="modal-section">
            <div class="section-heading-row">
              <h3 class="section-heading">Tasks</h3>
              <button class="btn btn--small" id="add-task-btn">+ Add task</button>
            </div>
            <section class="task-list modal-block" aria-live="polite">
              ${
                this.tasks.length === 0
                  ? `
                <div class="no-tasks">It's empty in here. Add something small to get rolling.</div>
              `
                  : `
                ${this.tasks
                  .map(
                    (task, index) => `
                  <div class="task-item${task.fromProject ? ' task-item--project' : ''}" data-index="${index}">
                    <label class="task-checkbox" for="task-${index}">
                      <input type="checkbox" id="task-${index}" ${task.completed ? 'checked' : ''}>
                      <span class="checkbox-visual"></span>
                    </label>
                    <div class="task-content">
                      <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                      <div class="task-meta">
                        <span class="task-duration">${task.duration} min</span>
                        ${task.energyType ? `<span class="task-energy-type">${this.getEnergyTypeEmoji(task.energyType)}</span>` : ''}
                        ${task.fromProject ? `<span class="project-indicator" title="From project: ${task.projectName}">📋</span>` : ''}
                      </div>
                    </div>
                    <button class="task-delete" data-index="${index}" aria-label="Delete task">×</button>
                  </div>
                `
                  )
                  .join('')}
              `
              }
            </section>
          </section>
        </div>
      </div>

      <style>
        .organic-capacity {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: var(--spacing-lg);
          height: 100%;
          padding: var(--spacing-md);
        }

        .capacity-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          flex: 0 0 50%;
          min-width: 0;
        }

        .capacity-right {
          flex: 0 0 50%;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .balance-center {
          position: relative;
          width: 280px;
          height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .balance-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 8px 32px var(--time-card-ring-soft, rgba(139, 124, 248, 0.15)));
        }

        .balance-percentage {
          position: absolute;
          text-align: center;
          z-index: 10;
        }

        .main-percent {
          font-size: var(--text-3xl);
          font-weight: var(--font-bold);
          color: var(--color-text-primary);
          line-height: 1;
          margin-bottom: var(--spacing-xs);
        }

        .balance-label {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          font-weight: var(--font-medium);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .energy-status {
          text-align: center;
          margin-top: var(--spacing-md);
        }

        .energy-status-text {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xs);
          line-height: var(--leading-relaxed);
        }

        .energy-remaining {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-success);
        }

        .capacity-breakdown {
          font-size: var(--text-xs);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* Main Task List Styles */
        .capacity-tasks {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .capacity-tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .tasks-title {
          margin: 0;
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .tasks-main-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          overflow-y: auto;
          max-height: 280px;
        }

        .no-tasks-main {
          text-align: center;
          color: var(--color-text-secondary);
          font-size: var(--text-xs);
          padding: var(--spacing-md);
          border: 1px dashed rgba(255, 255, 255, 0.3);
          border-radius: var(--radius-sm);
          margin-top: var(--spacing-sm);
        }

        .main-task-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .main-task-item:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .main-task-item.completed {
          opacity: 0.7;
        }

        .main-task-checkbox {
          position: relative;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .main-task-checkbox input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .main-checkbox-visual {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
          transition: all 0.2s ease;
          background: transparent;
        }

        .main-task-checkbox input:checked + .main-checkbox-visual {
          background: rgba(34, 197, 94, 0.9);
          border-color: rgba(34, 197, 94, 1);
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3);
        }

        .main-task-checkbox input:checked + .main-checkbox-visual::after {
          content: '✓';
          font-size: 9px;
          font-weight: bold;
        }

        .main-task-content {
          flex: 1;
          min-width: 0;
        }

        .main-task-text {
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
          line-height: 1.3;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .main-task-text.completed {
          text-decoration: line-through;
          color: rgba(255, 255, 255, 0.6);
        }

        .main-task-meta {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .main-task-duration {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: var(--font-medium);
        }

        .main-task-energy {
          font-size: 10px;
          opacity: 0.8;
        }

        .breakdown-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-sm);
          padding: var(--spacing-sm);
          border: 1px solid rgba(255, 255, 255, 0.2);
          flex: 1;
          overflow-y: auto;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2px 0;
        }

        .breakdown-label {
          color: var(--color-text-secondary);
          font-size: 10px;
          font-weight: var(--font-medium);
        }

        .breakdown-value {
          color: var(--color-text-primary);
          font-size: 10px;
          font-weight: var(--font-semibold);
        }

        .task-cards {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          overflow-y: auto;
          max-height: 300px;
        }

        .task-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          transition: all 0.2s ease;
          font-size: 11px;
          min-height: 44px;
        }

        .task-card:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .task-card.completed {
          opacity: 0.6;
          text-decoration: line-through;
        }

        .task-card-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
          margin-right: 6px;
        }

        .task-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .task-name {
          color: var(--color-text-primary);
          font-weight: var(--font-medium);
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .task-duration {
          color: var(--color-text-muted);
          font-size: 9px;
        }

        .task-energy {
          color: var(--color-text-primary);
          font-weight: var(--font-semibold);
          font-size: 12px;
          min-width: 30px;
          text-align: right;
        }

        .task-delete {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 2px;
          border-radius: 2px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .task-delete:hover {
          color: var(--color-error);
          background: rgba(239, 68, 68, 0.1);
        }

        .breakdown-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0 2px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          margin-top: 4px;
          font-weight: var(--font-semibold);
        }

        .breakdown-total .breakdown-label {
          color: var(--color-text-primary);
          font-size: 11px;
        }

        .breakdown-total .breakdown-value {
          color: var(--color-text-primary);
          font-size: 11px;
        }

        .center-flower {
          animation: gentleFloat 6s ease-in-out infinite;
        }

        .progress-ring {
          transition: stroke-dashoffset 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes gentleFloat {
          0%, 100% { transform: translate(120px, 120px) rotate(0deg) scale(1); }
          50% { transform: translate(120px, 120px) rotate(5deg) scale(1.05); }
        }

        @keyframes gentlePulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        ${isOverCapacity ? '.center-flower { animation: gentlePulse 2s ease-in-out infinite; }' : ''}

        .enough-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          background: rgba(255, 255, 255, 0.88);
          border-radius: var(--radius-2xl);
          padding: var(--spacing-md) var(--spacing-lg);
          box-shadow: 0 18px 44px rgba(31, 37, 89, 0.08);
          border: 1px solid rgba(177, 182, 210, 0.2);
        }

        .enough-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-md);
        }

        .enough-card__header-text {
          flex: 1;
        }

        .enough-card__title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .enough-card__controls {
          display: flex;
          justify-content: center;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .toggle-group {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px;
          border-radius: var(--radius-full);
          background: rgba(31, 37, 89, 0.08);
        }

        .toggle-btn {
          border: none;
          border-radius: var(--radius-full);
          padding: 6px 14px;
          font-size: 0.8rem;
          font-weight: var(--font-medium);
          background: transparent;
          color: rgba(30, 34, 66, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn.active {
          background: var(--color-primary);
          color: #ffffff;
          box-shadow: var(--shadow-button);
        }

        .enough-card__description {
          margin: 0;
          text-align: center;
          font-size: 0.85rem;
          color: rgba(30, 34, 66, 0.65);
        }

        .enough-card__meter {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .enough-progress {
          position: relative;
          width: 180px;
          aspect-ratio: 1;
        }

        .progress-ring {
          width: 100%;
          height: 100%;
        }

        .progress-ring__bg {
          fill: none;
          stroke: rgba(30, 34, 66, 0.12);
          stroke-width: 10;
        }

        .progress-ring__value {
          fill: none;
          stroke-width: 10;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: 70px 70px;
        }

        .progress-ring__label {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .progress-ring__number {
          font-size: 2.1rem;
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .progress-ring__caption {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(30, 34, 66, 0.55);
        }

        .enough-balance {
          font-size: 0.9rem;
          font-weight: var(--font-semibold);
          color: #16a34a;
        }

        .enough-planner-btn {
          white-space: nowrap;
        }

        .toggle-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          justify-content: space-between;
          align-items: center;
        }

        .no-tasks {
          font-size: 0.85rem;
          color: rgba(30, 34, 66, 0.6);
          text-align: center;
          padding: var(--spacing-md);
          border: 1px dashed rgba(30, 34, 66, 0.2);
          border-radius: var(--radius-md);
        }

        .enough-modal {
          position: fixed;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1200;
        }

        .enough-modal.is-open {
          display: flex;
        }

        .enough-modal__backdrop {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.15);
          backdrop-filter: none;
        }

        .enough-modal__dialog {
          position: relative;
          max-width: 720px;
          width: min(90vw, 720px);
          max-height: 90vh;
          background: rgba(255, 255, 255, 0.96);
          border-radius: var(--radius-2xl);
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
          padding: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--spacing-sm);
        }

        .modal-title {
          margin: 0;
          font-size: 1.4rem;
          font-weight: var(--font-semibold);
        }

        .modal-subtitle {
          margin: 4px 0 0;
          font-size: 0.9rem;
          color: rgba(30, 34, 66, 0.6);
        }

        .modal-close {
          border: none;
          background: rgba(30, 34, 66, 0.06);
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          font-size: 1.4rem;
          line-height: 1;
          cursor: pointer;
        }

        .modal-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .section-heading-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-heading {
          margin: 0;
          font-size: 1rem;
          color: var(--color-text-primary);
        }

        .modal-block {
          background: rgba(248, 250, 255, 0.7);
          border-radius: var(--radius-xl);
          padding: var(--spacing-md);
          border: 1px solid rgba(185, 190, 220, 0.2);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .tool-buttons {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--spacing-sm);
        }

        .tool-btn {
          border: none;
          border-radius: var(--radius-lg);
          padding: var(--spacing-sm);
          background: white;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 1rem;
          cursor: pointer;
        }

        .tool-btn span {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .suggestion-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .suggestion-tag {
          border: none;
          border-radius: var(--radius-full);
          padding: 8px 14px;
          background: rgba(59, 130, 246, 0.1);
          color: var(--color-text-primary);
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .tag-color {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .completion-progress {
          margin-bottom: var(--spacing-md);
        }

        .completion-bar {
          width: 100%;
          height: 6px;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: var(--spacing-xs);
        }

        .completion-fill {
          height: 100%;
          background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .completion-text {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }

        .completion-label {
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .task-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: var(--spacing-sm);
          align-items: center;
          background: white;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-lg);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }

        .task-item--project {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 197, 253, 0.08));
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .project-indicator {
          font-size: 12px;
          opacity: 0.8;
          margin-left: var(--spacing-xs);
        }

        .task-checkbox {
          position: relative;
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .task-checkbox input {
          position: absolute;
          inset: 0;
          opacity: 0;
        }

        .checkbox-visual {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          border: 2px solid rgba(31, 37, 89, 0.2);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          color: white;
          transition: all 0.2s ease;
        }

        .task-checkbox input:checked + .checkbox-visual {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }

        .task-checkbox input:checked + .checkbox-visual::after {
          content: '✓';
        }

        .task-text {
          font-size: 0.9rem;
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
        }

        .task-text.completed {
          text-decoration: line-through;
          color: rgba(30, 34, 66, 0.5);
        }

        .task-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .task-duration {
          font-size: 0.75rem;
          color: rgba(30, 34, 66, 0.5);
        }

        .task-energy-type {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .task-delete {
          border: none;
          background: rgba(239, 71, 111, 0.12);
          color: #ef476f;
          border-radius: var(--radius-full);
          width: 28px;
          height: 28px;
          font-size: 1rem;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .enough-card {
            padding: var(--spacing-md);
          }

          .tool-buttons {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .enough-card__header {
            flex-direction: column;
            align-items: flex-start;
          }

          .enough-card__controls {
            gap: var(--spacing-xs);
          }

          .enough-progress {
            width: 150px;
          }

          .enough-planner-btn {
            align-self: flex-start;
          }
        }
      </style>
    `;

    this.updateTimeCardRingColors();
  }
  getCapacityUsed() {
    // Calculate capacity based on all tasks (both completed and pending)
    let totalCapacity = 0; // Remove arbitrary base capacity

    this.tasks.forEach((task) => {
      if (task.fromCalculator && task.calculatedCapacity) {
        // Use ADHD-aware calculated capacity
        totalCapacity += task.calculatedCapacity;
      } else if (task.fromQuickAdd && task.adjustedCapacity) {
        // Use energy-adjusted capacity from quick add
        totalCapacity += task.adjustedCapacity;
      } else {
        // Fallback to simple duration-based calculation
        const energyWeight = Math.min(task.duration / 3, 25); // Max 25% per task
        totalCapacity += energyWeight;
      }
    });

    // Add ADHD-aware time-based energy depletion
    const timeEnergyDepletion = this.getTimeBasedEnergyDepletion();

    return Math.min(100, totalCapacity + timeEnergyDepletion);
  }

  getCompletedCapacity() {
    // Calculate capacity for completed tasks only
    let completedCapacity = 0;

    this.tasks.filter(task => task.completed).forEach((task) => {
      if (task.fromCalculator && task.calculatedCapacity) {
        completedCapacity += task.calculatedCapacity;
      } else if (task.fromQuickAdd && task.adjustedCapacity) {
        completedCapacity += task.adjustedCapacity;
      } else {
        const energyWeight = Math.min(task.duration / 3, 25);
        completedCapacity += energyWeight;
      }
    });

    return Math.min(100, completedCapacity);
  }

  /**
   * Calculate ADHD-aware time-based energy depletion
   * Accounts for stimulant patterns and executive function decline
   */
  getTimeBasedEnergyDepletion() {
    const hour = new Date().getHours();
    let energyDepletion = 0;

    if (hour >= 6 && hour < 11) {
      // Fresh morning energy - no depletion
      energyDepletion = 0;
    } else if (hour >= 11 && hour < 14) {
      // Peak performance time (stimulants working) - minimal depletion
      energyDepletion = Math.max(0, (hour - 11) * 1); // 0%, 1%, 2%
    } else if (hour >= 14 && hour < 17) {
      // Afternoon decline as meds wear off
      energyDepletion = 2 + (hour - 14) * 3; // 2%, 5%, 8%
    } else if (hour >= 17 && hour < 20) {
      // Evening crash - steeper decline, decision fatigue
      energyDepletion = 8 + (hour - 17) * 6; // 8%, 14%, 20%
    } else if (hour >= 20 && hour < 23) {
      // Late evening - significant stimulant crash
      energyDepletion = 20 + (hour - 20) * 8; // 20%, 28%, 36%
    } else {
      // Very late night - executive function nearly gone
      energyDepletion = hour >= 23 ? 40 + (hour - 23) * 10 : 40; // 40%+
    }

    return Math.round(energyDepletion);
  }

  formatHourLabel(hour) {
    const normalized = Number.isFinite(hour) ? ((hour % 24) + 24) % 24 : 0;
    const hour12 = normalized % 12 || 12;
    const period = normalized >= 12 ? 'PM' : 'AM';
    return `${hour12}:00 ${period}`;
  }

  getStatusMessage(percentage, isOverCapacity) {
    if (isOverCapacity) {
      return '🚨 Over capacity! Consider removing some tasks.';
    } else if (percentage > 90) {
      return "⚠️ Nearly at capacity. You've planned enough!";
    }

    return '';
  }

  getCapacityBreakdown() {
    const currentHour = new Date().getHours();
    const timeEnergyDepletion = this.getTimeBasedEnergyDepletion();
    const hourLabel = this.formatHourLabel(currentHour);

    let taskCapacity = 0;
    const taskDetails = [];

    this.tasks.forEach((task, index) => {
      const energyWeight = Math.min(task.duration / 3, 25);
      taskCapacity += energyWeight;
      taskDetails.push({
        id: task.id,
        name: task.text,
        duration: task.duration,
        energy: Math.round(energyWeight),
        completed: task.completed,
        index: index,
      });
    });

    const totalCapacity = Math.min(100, taskCapacity + timeEnergyDepletion);

    return `
      <div class="breakdown-details">
        ${
          timeEnergyDepletion > 0
            ? `
          <div class="breakdown-item">
            <span class="breakdown-label">Time energy depletion (${hourLabel})</span>
            <span class="breakdown-value">${timeEnergyDepletion}%</span>
          </div>
        `
            : `
          <div class="breakdown-item">
            <span class="breakdown-label">Morning fresh energy ✨ (${hourLabel})</span>
            <span class="breakdown-value">0%</span>
          </div>
        `
        }
        ${
          taskDetails.length > 0
            ? `
          <div class="breakdown-item">
            <span class="breakdown-label">Tasks (${this.tasks.length})</span>
            <span class="breakdown-value">${Math.round(taskCapacity)}%</span>
          </div>
          <div class="task-cards">
            ${taskDetails
              .map(
                (task) => `
              <div class="task-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-card-content">
                  <div class="task-info">
                    <span class="task-name">${task.name}</span>
                    <span class="task-duration">${task.duration}min</span>
                  </div>
                  <div class="task-energy">${task.energy}%</div>
                </div>
                <button class="task-delete" data-index="${task.index}" title="Delete task">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : `
          <div class="breakdown-item">
            <span class="breakdown-label">No tasks planned</span>
            <span class="breakdown-value">0%</span>
          </div>
        `
        }
        <div class="breakdown-total">
          <span class="breakdown-label">Total used</span>
          <span class="breakdown-value">${Math.round(totalCapacity)}%</span>
        </div>
      </div>
    `;
  }

  updateTimeCardRingColors() {
    if (!this.container || typeof window === 'undefined') {
      return;
    }

    const containerStyles = window.getComputedStyle(this.container);
    const fallbackRaw = containerStyles.getPropertyValue('--time-card-ring-strong');
    const fallbackColor = this.parseColor(fallbackRaw ? fallbackRaw.trim() : '') || {
      r: 139,
      g: 124,
      b: 248,
      a: 1,
    };

    const themeRoot = document.querySelector('.welcome-panel--time');
    let color = fallbackColor;

    if (themeRoot) {
      const styles = window.getComputedStyle(themeRoot);
      const background = this.parseColor(styles.backgroundColor);
      const border = this.parseColor(styles.borderColor);

      if (background && background.a !== 0) {
        color = background;
      } else if (border && border.a !== 0) {
        color = border;
      }
    }

    const style = this.container.style;
    style.setProperty('--time-card-ring-strong', this.toRgba(color.r, color.g, color.b, 0.65));
    style.setProperty('--time-card-ring', this.toRgba(color.r, color.g, color.b, 0.4));
    style.setProperty('--time-card-ring-soft', this.toRgba(color.r, color.g, color.b, 0.2));
    style.setProperty('--time-card-ring-faint', this.toRgba(color.r, color.g, color.b, 0.1));
  }

  observeThemeChanges() {
    if (
      this.themeObserver ||
      typeof MutationObserver === 'undefined' ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const body = document.body;
    if (!body) {
      return;
    }

    this.themeObserver = new MutationObserver(() => {
      window.requestAnimationFrame(() => this.updateTimeCardRingColors());
    });

    this.themeObserver.observe(body, { attributes: true, attributeFilter: ['data-theme'] });
  }

  parseColor(color) {
    if (!color || typeof color !== 'string') {
      return null;
    }

    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      if (hex.length === 3 || hex.length === 4) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
        return { r, g, b, a };
      }

      if (hex.length === 6 || hex.length === 8) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
        return { r, g, b, a };
      }
    }

    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/i);
    if (match) {
      return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: match[4] !== undefined ? Number(match[4]) : 1,
      };
    }

    return null;
  }

  toRgba(r, g, b, a = 1) {
    const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
    const clampAlpha = (alpha) => Math.max(0, Math.min(1, Number(alpha)));
    return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(b)}, ${clampAlpha(a)})`;
  }

  getTaskSuggestions() {
    return [
      { task: 'Cleaning', duration: 20, color: '#86efac' },
      { task: 'Email Batch', duration: 30, color: '#bfdbfe' },
      { task: 'Laundry', duration: 15, color: '#a5f3fc' },
      { task: 'Quick Call', duration: 15, color: '#c7d2fe' },
      { task: 'Creative Time', duration: 30, color: '#fbcfe8' },
      { task: 'Deep Focus', duration: 40, color: '#ddd6fe' },
    ];
  }

  attachEventListeners() {
    this.container.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.toggle-btn');
      if (toggleBtn) {
        const view = toggleBtn.dataset.view;
        const mode = toggleBtn.dataset.mode;
        if (view) {
          this.currentView = view;
          this.render();
        } else if (mode) {
          this.currentMode = mode;
          this.render();
        }
        return;
      }

      if (e.target.id === 'add-task-btn') {
        this.addNewTask();
        return;
      }

      if (e.target.id === 'enough-open-planner') {
        this.isModalOpen = true;
        this.render();
        return;
      }

      const modalClose = e.target.closest('[data-close="modal"]');
      if (modalClose) {
        this.isModalOpen = false;
        this.render();
        return;
      }

      const suggestion = e.target.closest('.suggestion-tag');
      if (suggestion) {
        const task = suggestion.dataset.task;
        const duration = parseInt(suggestion.dataset.duration);
        this.addTaskFromSuggestion(task, duration);
        return;
      }

      const deleteBtn = e.target.closest('.task-delete');
      if (deleteBtn) {
        const index = parseInt(deleteBtn.dataset.index);
        this.deleteTask(index);
        return;
      }

      const tool = e.target.closest('.tool-btn');
      if (tool) {
        this.executeTool(tool.dataset.tool);
      }
    });

    this.container.addEventListener('change', (e) => {
      if (
        e.target.matches('.task-item input[type="checkbox"], .task-pill input[type="checkbox"], .main-task-checkbox input[type="checkbox"]')
      ) {
        const dataIndex = e.target.getAttribute('data-index');
        let index = dataIndex ? parseInt(dataIndex) : NaN;
        if (Number.isNaN(index)) {
          const idPart = e.target.id.split('-');
          // Handle both "task-X" and "main-task-X" formats
          index = parseInt(idPart[idPart.length - 1]);
        }
        if (!Number.isNaN(index)) {
          this.toggleTaskCompletion(index);
        }
      }
    });
  }

  addNewTask() {
    this.showTaskAdditionChoice();
  }

  showTaskAdditionChoice() {
    const modal = document.createElement('div');
    modal.className = 'task-choice-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="choice-container">
        <div class="choice-header">
          <h3>Add a Task</h3>
          <p>Choose how you'd like to add your task</p>
          <button class="modal-close" data-action="close">×</button>
        </div>

        <div class="choice-options">
          <button class="choice-option quick-add" data-choice="quick">
            <div class="choice-icon">⚡</div>
            <div class="choice-content">
              <h4>Quick Add</h4>
              <p>Fast entry with suggested presets</p>
            </div>
          </button>

          <button class="choice-option calculator-add" data-choice="calculator">
            <div class="choice-icon">🧠</div>
            <div class="choice-content">
              <h4>ADHD Calculator</h4>
              <p>Smart capacity estimation with barriers</p>
            </div>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop') || e.target.dataset.action === 'close') {
        document.body.removeChild(modal);
        return;
      }

      const choice = e.target.closest('[data-choice]');
      if (choice) {
        const choiceType = choice.dataset.choice;
        document.body.removeChild(modal);

        if (choiceType === 'quick') {
          this.openQuickAddModal();
        } else if (choiceType === 'calculator') {
          this.openCapacityCalculator();
        }
      }
    });
  }

  openQuickAddModal() {
    const modal = document.createElement('div');
    modal.className = 'quick-add-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="quick-add-container">
        <div class="quick-add-header">
          <h3>Quick Add Task</h3>
          <button class="modal-close" data-action="close">×</button>
        </div>

        <div class="quick-add-content">
          <div class="task-input-section">
            <label for="quick-task-name">Task name:</label>
            <input type="text" id="quick-task-name" placeholder="e.g., Check emails" class="quick-input">

            <label for="quick-duration">Duration (minutes):</label>
            <input type="number" id="quick-duration" value="15" min="1" max="480" class="quick-input">

            <label for="energy-type">Energy type:</label>
            <select id="energy-type" class="quick-input">
              <option value="mental" selected>🧠 Mental - Thinking, planning, problem-solving</option>
              <option value="physical">💪 Physical - Moving, exercising, manual work</option>
              <option value="social">👥 Social - Interacting with people, meetings</option>
              <option value="creative">🎨 Creative - Designing, writing, artistic work</option>
              <option value="emotional">❤️ Emotional - Processing feelings, relationships</option>
              <option value="administrative">📋 Administrative - Organizing, filing, routine tasks</option>
            </select>

            <label for="energy-level">Current energy level:</label>
            <select id="energy-level" class="quick-input">
              <option value="1">🔋 High - I'm feeling sharp and focused</option>
              <option value="1.5" selected>⚡ Medium - I'm doing okay, typical energy</option>
              <option value="2.5">🪫 Low - I'm tired, things feel harder</option>
              <option value="4">😵 Very Low - I'm burnt out, everything feels overwhelming</option>
            </select>
            <p class="energy-note">This adjusts how much capacity the task will actually use based on your current state</p>
          </div>

          <div class="presets-section">
            <div class="presets-header">
              <h4>Common Tasks</h4>
              <select id="category-select" class="category-dropdown">
                <option value="">All Categories</option>
                <option value="morning">Morning Routine</option>
                <option value="communication">Communication & Admin</option>
                <option value="household">Household Tasks</option>
                <option value="selfcare">Self-Care & Health</option>
                <option value="work">Work & Productivity</option>
              </select>
            </div>
            <div class="preset-grid" id="preset-grid">
              <!-- Presets will be populated here -->
            </div>
          </div>
        </div>

        <div class="quick-add-actions">
          <button class="quick-btn quick-btn--secondary" data-action="close">Cancel</button>
          <button class="quick-btn quick-btn--primary" id="quick-add-submit">Add Task</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.initQuickAddModal(modal);
  }

  getTaskPresets() {
    return {
      morning: {
        name: 'Morning Routine',
        tasks: [
          {
            name: 'Make Breakfast',
            duration: 45,
            icon: '🍳',
            note: 'Including decisions, prep, cooking, eating, cleanup',
          },
          {
            name: 'Take Shower',
            duration: 35,
            icon: '🚿',
            note: 'Including gathering supplies, actual shower, post-shower routine',
          },
          {
            name: 'Get Dressed',
            duration: 25,
            icon: '👔',
            note: 'Including outfit decisions, finding items, weather check',
          },
          {
            name: 'Morning Meds',
            duration: 15,
            icon: '💊',
            note: 'Including remembering, finding, taking, tracking',
          },
          {
            name: 'Check Weather',
            duration: 10,
            icon: '🌤️',
            note: 'Plus outfit adjustments if needed',
          },
          {
            name: 'Pack Bag/Lunch',
            duration: 20,
            icon: '🎒',
            note: 'Including finding items, decision-making, double-checking',
          },
        ],
      },
      communication: {
        name: 'Communication & Admin',
        tasks: [
          {
            name: 'Check Emails',
            duration: 30,
            icon: '📧',
            note: 'Including reading, processing, responding, filing',
          },
          {
            name: 'Quick Call (Known)',
            duration: 25,
            icon: '📞',
            note: 'Including phone anxiety prep and post-call processing',
          },
          {
            name: 'Doctor Call',
            duration: 45,
            icon: '🏥',
            note: 'Including prep, hold time, form anxiety, note-taking',
          },
          {
            name: 'Review Calendar',
            duration: 15,
            icon: '📅',
            note: 'Including anxiety about upcoming tasks, scheduling conflicts',
          },
          {
            name: 'Text Responses',
            duration: 20,
            icon: '💬',
            note: 'Including reading, overthinking responses, sending',
          },
          {
            name: 'Online Form',
            duration: 60,
            icon: '📋',
            note: 'Including gathering info, decision paralysis, double-checking',
          },
        ],
      },
      household: {
        name: 'Household Tasks',
        tasks: [
          {
            name: 'Tidy One Room',
            duration: 45,
            icon: '🧹',
            note: 'Including getting distracted by items found, organizing',
          },
          {
            name: 'Do Dishes',
            duration: 35,
            icon: '🍽️',
            note: 'Including clearing space, washing, drying, putting away',
          },
          {
            name: 'Laundry Start',
            duration: 20,
            icon: '👕',
            note: 'Including sorting, checking pockets, finding detergent',
          },
          {
            name: 'Water Plants',
            duration: 15,
            icon: '🪴',
            note: 'Including checking each plant, getting water, cleanup',
          },
          {
            name: 'Take Out Trash',
            duration: 15,
            icon: '🗑️',
            note: 'Including gathering from rooms, finding bags, taking outside',
          },
          {
            name: 'Quick Grocery Run',
            duration: 75,
            icon: '🛒',
            note: 'Including list-making, travel, decision fatigue, checkout anxiety',
          },
        ],
      },
      selfcare: {
        name: 'Self-Care & Health',
        tasks: [
          {
            name: 'Stretch Break',
            duration: 20,
            icon: '🧘',
            note: 'Including setup, actual stretching, transition back',
          },
          {
            name: 'Quick Walk',
            duration: 35,
            icon: '🚶',
            note: 'Including shoes, route decisions, getting back into flow',
          },
          {
            name: 'Meditation',
            duration: 25,
            icon: '🧘‍♀️',
            note: 'Including setup, settling in, app fiddling, transition out',
          },
          {
            name: 'Skincare Routine',
            duration: 25,
            icon: '🧴',
            note: 'Including product decisions, application, cleanup',
          },
          {
            name: 'Take Vitamins',
            duration: 10,
            icon: '💊',
            note: 'Including remembering what to take, organizing pills',
          },
          {
            name: 'Journal Entry',
            duration: 30,
            icon: '📔',
            note: 'Including setup, thinking, writing, processing emotions',
          },
        ],
      },
      work: {
        name: 'Work & Productivity',
        tasks: [
          {
            name: 'Social Media Check',
            duration: 45,
            icon: '📱',
            note: "Let's be honest - it's never just 5 minutes",
          },
          {
            name: 'Quick Research',
            duration: 60,
            icon: '🔍',
            note: 'Including rabbit holes and "while I\'m here" detours',
          },
          {
            name: 'File Organization',
            duration: 90,
            icon: '🗂️',
            note: 'Including creating systems, getting distracted by old files',
          },
          {
            name: 'Return Item',
            duration: 50,
            icon: '📦',
            note: 'Including finding receipt, packaging, trip to store/post office',
          },
          {
            name: 'Pay Bills',
            duration: 40,
            icon: '💳',
            note: 'Including login struggles, reviewing charges, payment processing',
          },
          {
            name: 'Update Resume',
            duration: 120,
            icon: '📄',
            note: 'Including perfection spirals and format decisions',
          },
        ],
      },
    };
  }

  initQuickAddModal(modal) {
    const taskNameInput = modal.querySelector('#quick-task-name');
    const durationInput = modal.querySelector('#quick-duration');
    const categorySelect = modal.querySelector('#category-select');
    const presetGrid = modal.querySelector('#preset-grid');

    // Populate initial presets (show all)
    this.updatePresetGrid(presetGrid, '');

    // Category change handler
    categorySelect.addEventListener('change', (e) => {
      this.updatePresetGrid(presetGrid, e.target.value);
    });

    // Preset button handlers
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop') || e.target.dataset.action === 'close') {
        document.body.removeChild(modal);
        return;
      }

      const presetBtn = e.target.closest('.preset-btn');
      if (presetBtn) {
        const preset = JSON.parse(presetBtn.dataset.preset);
        taskNameInput.value = preset.name;
        durationInput.value = preset.duration;
        taskNameInput.focus();
      }

      if (e.target.id === 'quick-add-submit') {
        this.addQuickTask(modal);
      }
    });

    // Enter key handler
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.target === taskNameInput || e.target === durationInput)) {
        this.addQuickTask(modal);
      }
    });

    // Focus task name input
    setTimeout(() => taskNameInput.focus(), 100);
  }

  updatePresetGrid(presetGrid, selectedCategory) {
    const presets = this.getTaskPresets();
    let tasksToShow = [];

    if (selectedCategory === '') {
      // Show all tasks
      Object.values(presets).forEach((category) => {
        tasksToShow.push(...category.tasks);
      });
    } else {
      // Show only selected category
      tasksToShow = presets[selectedCategory]?.tasks || [];
    }

    presetGrid.innerHTML = tasksToShow
      .map(
        (task) => `
      <button class="preset-btn" data-preset='${JSON.stringify(task)}' title="${task.note}">
        <span class="preset-icon">${task.icon}</span>
        <span class="preset-name">${task.name}</span>
        <span class="preset-duration">${task.duration}m</span>
      </button>
    `
      )
      .join('');
  }

  addQuickTask(modal) {
    const taskName = modal.querySelector('#quick-task-name').value.trim();
    const duration = parseInt(modal.querySelector('#quick-duration').value);
    const energyType = modal.querySelector('#energy-type').value;
    const energyMultiplier = parseFloat(modal.querySelector('#energy-level').value);

    if (!taskName) {
      alert('Please enter a task name');
      return;
    }

    if (!duration || duration < 1) {
      alert('Please enter a valid duration');
      return;
    }

    // Calculate adjusted capacity based on mental energy
    const baseCapacity = Math.min(duration / 3, 25); // Same base calculation as before
    const adjustedCapacity = Math.min(100, baseCapacity * energyMultiplier);

    // Add task with energy-adjusted calculation
    this.tasks.push({
      text: taskName,
      duration: duration,
      energyType: energyType,
      energyMultiplier: energyMultiplier,
      adjustedCapacity: adjustedCapacity,
      completed: false,
      created: new Date().toISOString(),
      fromQuickAdd: true,
    });

    this.saveTasks();
    this.render();

    const energyLabel =
      energyMultiplier === 1
        ? 'high energy'
        : energyMultiplier === 1.5
          ? 'medium energy'
          : energyMultiplier === 2.5
            ? 'low energy'
            : 'very low energy';

    const energyTypeLabel =
      {
        mental: '🧠 Mental',
        physical: '💪 Physical',
        social: '👥 Social',
        creative: '🎨 Creative',
        emotional: '❤️ Emotional',
        administrative: '📋 Administrative',
      }[energyType] || energyType;

    this.showNotification(
      `✅ Added "${taskName}" (${energyTypeLabel}, ${Math.round(adjustedCapacity)}% capacity, ${energyLabel})`
    );

    document.body.removeChild(modal);
  }

  openCapacityCalculator() {
    const modal = document.createElement('div');
    modal.className = 'capacity-calculator-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="calculator-container">
        <div class="calculator-header">
          <h3>ADHD-Aware Capacity Calculator</h3>
          <p>Let's figure out how much energy this task really needs</p>
          <button class="modal-close" data-action="close">×</button>
        </div>

        <div class="calculator-steps">
          <!-- Step 1: Basic Info -->
          <div class="calc-step active" data-step="1">
            <h4>What's the task?</h4>
            <input type="text" id="task-name" placeholder="e.g., Call doctor's office" class="calc-input">
            <label>Base time estimate (minutes):</label>
            <input type="number" id="base-duration" value="15" min="1" max="480" class="calc-input">
          </div>

          <!-- Step 2: Prep Energy -->
          <div class="calc-step" data-step="2">
            <h4>⚒️ Prep Energy</h4>
            <p class="step-desc">Tasks often need setup time and mental preparation</p>

            <div class="factor-group">
              <label class="factor-item">
                <input type="checkbox" data-factor="find-materials" data-weight="25">
                <span class="factor-text">Need to find/gather materials or info</span>
                <span class="factor-impact">+25%</span>
              </label>

              <label class="factor-item">
                <input type="checkbox" data-factor="unfamiliar" data-weight="50">
                <span class="factor-text">This is new or unfamiliar to me</span>
                <span class="factor-impact">+50%</span>
              </label>

              <label class="factor-item">
                <input type="checkbox" data-factor="research" data-weight="75">
                <span class="factor-text">Need to research how to do this</span>
                <span class="factor-impact">+75%</span>
              </label>
            </div>
          </div>

          <!-- Step 3: Barriers -->
          <div class="calc-step" data-step="3">
            <h4>🚧 Barriers & Challenges</h4>
            <p class="step-desc">What makes this task emotionally or cognitively demanding?</p>

            <div class="factor-group">
              <label class="factor-item">
                <input type="checkbox" data-factor="strangers" data-weight="100">
                <span class="factor-text">Involves calling/emailing strangers</span>
                <span class="factor-impact">+100%</span>
              </label>

              <label class="factor-item">
                <input type="checkbox" data-factor="rejection" data-weight="75">
                <span class="factor-text">Risk of rejection or criticism</span>
                <span class="factor-impact">+75%</span>
              </label>

              <label class="factor-item">
                <input type="checkbox" data-factor="boring" data-weight="50">
                <span class="factor-text">This task is boring/tedious for me</span>
                <span class="factor-impact">+50%</span>
              </label>

              <label class="factor-item">
                <input type="checkbox" data-factor="distracting" data-weight="25">
                <span class="factor-text">I'm in a distracting environment</span>
                <span class="factor-impact">+25%</span>
              </label>
            </div>
          </div>

          <!-- Step 4: Hidden Complexity -->
          <div class="calc-step" data-step="4">
            <h4>🕳️ Hidden Complexity</h4>
            <p class="step-desc">ADHD brains often expand simple tasks in unexpected ways</p>

            <div class="factor-group">
              <label class="factor-item">
                <input type="checkbox" data-factor="hyperfocus" data-weight="200">
                <span class="factor-text">I might hyperfocus and lose track of time</span>
                <span class="factor-impact">+200%</span>
              </label>

              <label class="factor-item">
                <input type="checkbox" data-factor="perfectionism" data-weight="150">
                <span class="factor-text">I tend to perfectionism spirals on this type</span>
                <span class="factor-impact">+150%</span>
              </label>

              <label class="factor-item">
                <input type="checkbox" data-factor="improve" data-weight="100">
                <span class="factor-text">I'll probably want to 'improve' or optimize it</span>
                <span class="factor-impact">+100%</span>
              </label>
            </div>
          </div>

          <!-- Step 5: Recovery -->
          <div class="calc-step" data-step="5">
            <h4>🔋 Recovery Needs</h4>
            <p class="step-desc">Some tasks drain energy that needs time to replenish</p>

            <div class="factor-group">
              <label class="factor-item">
                <input type="checkbox" data-factor="decompression" data-weight="30">
                <span class="factor-text">I'll need decompression time after</span>
                <span class="factor-impact">+30%</span>
              </label>

              <label class="factor-item">
                <input type="checkbox" data-factor="social-drain" data-weight="20">
                <span class="factor-text">This is socially draining (masking energy)</span>
                <span class="factor-impact">+20%</span>
              </label>

              <label class="factor-item">
                <input type="checkbox" data-factor="focus-drain" data-weight="15">
                <span class="factor-text">Requires intense focus/concentration</span>
                <span class="factor-impact">+15%</span>
              </label>
            </div>
          </div>

          <!-- Results -->
          <div class="calc-step" data-step="6">
            <h4>📊 Your Capacity Assessment</h4>
            <div class="results-display">
              <div class="result-comparison">
                <div class="result-item">
                  <span class="result-label">Original estimate:</span>
                  <span class="result-value" id="original-estimate">15 minutes</span>
                </div>
                <div class="result-item primary">
                  <span class="result-label">Realistic capacity cost:</span>
                  <span class="result-value" id="final-capacity">25%</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Why the difference:</span>
                  <span class="result-explanation" id="capacity-explanation">Phone anxiety + prep time</span>
                </div>
              </div>

              <div class="capacity-preview">
                <div class="preview-circle">
                  <div class="preview-fill" id="preview-fill"></div>
                  <div class="preview-text" id="preview-text">25%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="calculator-nav">
          <button class="calc-btn calc-btn--secondary" id="calc-back" style="display: none;">← Back</button>
          <button class="calc-btn calc-btn--primary" id="calc-next">Next →</button>
          <button class="calc-btn calc-btn--success" id="calc-finish" style="display: none;">Add Task</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.initCalculator(modal);
  }

  initCalculator(modal) {
    let currentStep = 1;
    const maxSteps = 6;
    const calculatorData = {
      taskName: '',
      baseDuration: 15,
      factors: {},
      capacityMultiplier: 1,
      finalCapacity: 0,
    };

    const nextBtn = modal.querySelector('#calc-next');
    const backBtn = modal.querySelector('#calc-back');
    const finishBtn = modal.querySelector('#calc-finish');
    const steps = modal.querySelectorAll('.calc-step');

    // Navigation handlers
    nextBtn.addEventListener('click', () => {
      if (currentStep < maxSteps) {
        if (validateStep(currentStep)) {
          if (currentStep === 1) {
            // Capture basic info
            calculatorData.taskName = modal.querySelector('#task-name').value;
            calculatorData.baseDuration = parseInt(modal.querySelector('#base-duration').value);
          }

          if (currentStep >= 2 && currentStep <= 5) {
            // Capture factor selections for this step
            updateCalculation();
          }

          currentStep++;
          updateStepDisplay();

          if (currentStep === maxSteps) {
            // Show final results
            displayResults();
          }
        }
      }
    });

    backBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
      }
    });

    finishBtn.addEventListener('click', () => {
      // Add task with calculated capacity
      this.addCalculatedTask(calculatorData);
      document.body.removeChild(modal);
    });

    // Close modal handlers
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop') || e.target.dataset.action === 'close') {
        document.body.removeChild(modal);
      }
    });

    // Factor change handlers
    modal.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox' && e.target.dataset.factor) {
        const factor = e.target.dataset.factor;
        const weight = parseInt(e.target.dataset.weight);

        if (e.target.checked) {
          calculatorData.factors[factor] = weight;
        } else {
          delete calculatorData.factors[factor];
        }

        // Update calculation if we're past step 1
        if (currentStep > 1) {
          updateCalculation();
        }
      }
    });

    function validateStep(step) {
      if (step === 1) {
        const taskName = modal.querySelector('#task-name').value.trim();
        const duration = modal.querySelector('#base-duration').value;

        if (!taskName) {
          alert('Please enter a task name');
          return false;
        }
        if (!duration || duration < 1) {
          alert('Please enter a valid duration');
          return false;
        }
      }
      return true;
    }

    function updateStepDisplay() {
      // Hide all steps
      steps.forEach((step) => step.classList.remove('active'));

      // Show current step
      const currentStepEl = modal.querySelector(`[data-step="${currentStep}"]`);
      if (currentStepEl) {
        currentStepEl.classList.add('active');
      }

      // Update navigation buttons
      backBtn.style.display = currentStep > 1 ? 'block' : 'none';
      nextBtn.style.display = currentStep < maxSteps ? 'block' : 'none';
      finishBtn.style.display = currentStep === maxSteps ? 'block' : 'none';

      // Update button text
      if (currentStep < maxSteps - 1) {
        nextBtn.textContent = 'Next →';
      } else if (currentStep === maxSteps - 1) {
        nextBtn.textContent = 'Calculate →';
      }
    }

    function updateCalculation() {
      // Calculate total capacity multiplier from selected factors
      let totalMultiplier = 1;
      const activeFactors = [];

      Object.entries(calculatorData.factors).forEach(([factor, weight]) => {
        totalMultiplier += weight / 100;
        activeFactors.push(factor);
      });

      calculatorData.capacityMultiplier = totalMultiplier;

      // Calculate final capacity percentage (rough estimation)
      // Base duration contributes differently at different lengths
      const durationFactor = Math.min(calculatorData.baseDuration / 3, 25);
      calculatorData.finalCapacity = Math.min(100, durationFactor * totalMultiplier);
    }

    function displayResults() {
      const originalEstimate = modal.querySelector('#original-estimate');
      const finalCapacity = modal.querySelector('#final-capacity');
      const explanation = modal.querySelector('#capacity-explanation');
      const previewFill = modal.querySelector('#preview-fill');
      const previewText = modal.querySelector('#preview-text');

      originalEstimate.textContent = `${calculatorData.baseDuration} minutes`;
      finalCapacity.textContent = `${Math.round(calculatorData.finalCapacity)}%`;
      previewText.textContent = `${Math.round(calculatorData.finalCapacity)}%`;

      // Set preview circle fill
      previewFill.style.background = `conic-gradient(
        var(--color-accent) 0% ${calculatorData.finalCapacity}%,
        rgba(0,0,0,0.1) ${calculatorData.finalCapacity}% 100%
      )`;

      // Generate explanation
      const factorKeys = Object.keys(calculatorData.factors);
      if (factorKeys.length === 0) {
        explanation.textContent = 'No additional factors identified';
      } else {
        const factorNames = {
          'find-materials': 'prep time',
          unfamiliar: 'learning curve',
          research: 'research needed',
          strangers: 'social anxiety',
          rejection: 'rejection sensitivity',
          boring: 'low motivation',
          distracting: 'environment',
          hyperfocus: 'hyperfocus risk',
          perfectionism: 'perfectionism',
          improve: 'optimization tendency',
          decompression: 'recovery time',
          'social-drain': 'masking energy',
          'focus-drain': 'intense focus',
        };

        const explanations = factorKeys.map((key) => factorNames[key] || key);
        explanation.textContent =
          explanations.slice(0, 3).join(' + ') +
          (explanations.length > 3 ? ` + ${explanations.length - 3} more` : '');
      }
    }
  }

  addCalculatedTask(calculatorData) {
    // Store task with enhanced metadata
    this.tasks.push({
      text: calculatorData.taskName,
      duration: calculatorData.baseDuration,
      capacityMultiplier: calculatorData.capacityMultiplier,
      calculatedCapacity: calculatorData.finalCapacity,
      factors: calculatorData.factors,
      completed: false,
      created: new Date().toISOString(),
      fromCalculator: true,
    });

    this.saveTasks();
    this.render();
    this.showNotification(
      `✅ Task added! Estimated ${Math.round(calculatorData.finalCapacity)}% capacity`
    );
  }

  addTaskFromSuggestion(task, duration) {
    this.tasks.push({
      text: task,
      duration: duration,
      completed: false,
      created: new Date().toISOString(),
      fromSuggestion: true,
    });

    this.saveTasks();
    this.render();
    this.showNotification('✅ "' + task + '" added to your list!');
  }

  deleteTask(index) {
    this.tasks.splice(index, 1);
    this.saveTasks();
    this.render();
  }

  toggleTaskCompletion(index) {
    this.tasks[index].completed = !this.tasks[index].completed;
    this.saveTasks();
    this.render();
  }

  executeTool(tool) {
    switch (tool) {
      case 'builder':
        this.showNotification("🔨 Task Builder: Let's break this down into smaller steps!");
        break;
      case 'flip':
        const coinFlip = Math.random() > 0.5 ? 'Heads' : 'Tails';
        this.showNotification('🪙 Coin flip: ' + coinFlip + '!');
        break;
      case 'roll':
        const roll = Math.floor(Math.random() * 6) + 1;
        this.showNotification('🎲 Dice roll: ' + roll + '!');
        break;
      case 'spin':
        this.showNotification('🎯 Spinning the wheel... Good luck!');
        break;
    }
  }

  saveTasks() {
    this.data.set('enoughTasks', this.tasks);
  }

  loadTasks() {
    this.tasks = this.data.get('enoughTasks', []);
  }

  startCapacityMonitoring() {
    // Simple capacity monitoring - update every minute
    setInterval(() => {
      this.render();
    }, 60000);

    // More frequent updates when modal is open for better responsiveness
    setInterval(() => {
      if (this.isModalOpen) {
        this.render();
      }
    }, 2000);
  }

  getEnergyTypeEmoji(energyType) {
    const energyTypeEmojis = {
      mental: '🧠',
      physical: '💪',
      social: '👥',
      creative: '🎨',
      emotional: '❤️',
      administrative: '📋',
    };
    return energyTypeEmojis[energyType] || '⚡';
  }

  showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.textContent = message;

    // Set styles individually
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = '#1f2559';
    notification.style.color = 'white';
    notification.style.padding = 'var(--spacing-sm) var(--spacing-lg)';
    notification.style.borderRadius = 'var(--radius-md)';
    notification.style.fontSize = 'var(--text-sm)';
    notification.style.fontWeight = 'var(--font-medium)';
    notification.style.zIndex = '1000';
    notification.style.animation = 'slideInRight 0.3s ease-out';
    notification.style.boxShadow = '0 10px 30px rgba(31, 37, 89, 0.2)';
    notification.style.maxWidth = '300px';

    document.body.appendChild(notification);
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
  }
}
// Add slide animation for notifications
const style = document.createElement('style');
style.textContent =
  '@keyframes slideInRight { 0% { transform: translateX(100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }';
document.head.appendChild(style);
