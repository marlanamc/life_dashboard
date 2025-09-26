/**
 * TickTick Integration Component
 * Provides UI for TickTick integration and task synchronization
 */
import { TickTickService } from './ticktick-service.js';

export class TickTickIntegration {
  constructor(container, dataManager) {
    this.container = container;
    this.data = dataManager;
    this.ticktickService = null;
    this.isConnected = false;
    
    this.init();
  }

  init() {
    this.ticktickService = new TickTickService(this.data);
    this.isConnected = this.ticktickService.isReady();
    this.render();
    
    // Expose service for other components
    this.data.set('ticktick_service', this.ticktickService);
  }

  render() {
    const status = this.ticktickService.getStatus();
    
    this.container.innerHTML = `
      <div class="ticktick-integration">
        <div class="integration-header">
          <div class="integration-title">
            <span class="integration-icon">📋</span>
            <h3>TickTick Integration</h3>
          </div>
          <div class="integration-status ${status.isReady ? 'connected' : 'disconnected'}">
            ${status.isReady ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div class="integration-content">
          ${status.isReady ? this.renderConnectedView() : this.renderDisconnectedView()}
        </div>
      </div>

      <style>
        .ticktick-integration {
          background: var(--color-surface-1);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-md);
        }

        .integration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .integration-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .integration-title h3 {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
        }

        .integration-icon {
          font-size: var(--text-xl);
        }

        .integration-status {
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .integration-status.connected {
          background: rgba(34, 197, 94, 0.1);
          color: var(--color-success);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .integration-status.disconnected {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-error);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .integration-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .connection-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .connection-info {
          color: var(--color-text-secondary);
          font-size: var(--text-sm);
          line-height: var(--leading-relaxed);
        }

        .btn-ticktick {
          background: var(--color-primary);
          color: white;
          border: 1px solid var(--color-primary);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          text-decoration: none;
        }

        .btn-ticktick:hover {
          background: var(--color-accent);
          border-color: var(--color-accent);
          transform: translateY(-1px);
        }

        .btn-ticktick:active {
          transform: translateY(0);
        }

        .btn-ticktick--ghost {
          background: transparent;
          color: var(--color-text-primary);
          border-color: var(--color-border);
        }

        .btn-ticktick--ghost:hover {
          background: var(--color-surface-2);
          border-color: var(--color-accent);
        }

        .btn-ticktick--danger {
          background: var(--color-error);
          border-color: var(--color-error);
        }

        .btn-ticktick--danger:hover {
          background: #dc2626;
          border-color: #dc2626;
        }

        .sync-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .sync-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-sm);
        }

        .sync-option {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm);
          background: var(--color-surface-2);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .sync-option-title {
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }

        .sync-option-description {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
        }

        .sync-status {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .sync-status.synced {
          color: var(--color-success);
        }

        .sync-status.error {
          color: var(--color-error);
        }

        .ticktick-lists {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .ticktick-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-surface-2);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
        }

        .ticktick-list-name {
          font-size: var(--text-sm);
          color: var(--color-text-primary);
        }

        .ticktick-list-count {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .loading {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--color-border);
          border-top: 2px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--color-error);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
        }

        .success-message {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: var(--color-success);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
        }
      </style>
    `;

    this.attachEventListeners();
  }

  renderDisconnectedView() {
    return `
      <div class="connection-section">
        <p class="connection-info">
          Connect your TickTick account to sync tasks between your Life Dashboard and TickTick.
          This will allow you to see your TickTick tasks in the capacity planner and sync brain dump items.
        </p>
        <button class="btn-ticktick" id="connect-ticktick">
          <span>🔗</span>
          Connect to TickTick
        </button>
        <div class="connection-info">
          <strong>Note:</strong> You'll need a TickTick API token. You can get one from the TickTick Developer Portal.
        </div>
      </div>
    `;
  }

  renderConnectedView() {
    const syncedTasks = this.data.get('ticktick_synced_tasks', []);
    const syncedBrainDump = this.data.get('ticktick_synced_brain_dump', []);
    
    return `
      <div class="sync-section">
        <h4>Sync Options</h4>
        <div class="sync-options">
          <div class="sync-option">
            <div class="sync-option-title">Capacity Planner</div>
            <div class="sync-option-description">Sync tasks from your capacity planner to TickTick</div>
            <div class="sync-status ${syncedTasks.length > 0 ? 'synced' : ''}">
              ${syncedTasks.length > 0 ? '✓ Synced' : 'Not synced'}
            </div>
            <button class="btn-ticktick btn-ticktick--ghost" id="sync-capacity-tasks">
              ${syncedTasks.length > 0 ? 'Re-sync' : 'Sync Now'}
            </button>
          </div>
          
          <div class="sync-option">
            <div class="sync-option-title">Brain Dump</div>
            <div class="sync-option-description">Sync brain dump items to TickTick tasks</div>
            <div class="sync-status ${syncedBrainDump.length > 0 ? 'synced' : ''}">
              ${syncedBrainDump.length > 0 ? '✓ Synced' : 'Not synced'}
            </div>
            <button class="btn-ticktick btn-ticktick--ghost" id="sync-brain-dump">
              ${syncedBrainDump.length > 0 ? 'Re-sync' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>

      <div class="ticktick-lists">
        <h4>Your TickTick Lists</h4>
        ${this.renderTickTickLists()}
      </div>

      <div class="connection-section">
        <button class="btn-ticktick btn-ticktick--danger" id="disconnect-ticktick">
          <span>🔌</span>
          Disconnect
        </button>
      </div>
    `;
  }

  renderTickTickLists() {
    if (!this.ticktickService.lists || this.ticktickService.lists.length === 0) {
      return '<div class="loading"><div class="loading-spinner"></div>Loading lists...</div>';
    }

    return this.ticktickService.lists.map(list => `
      <div class="ticktick-list-item">
        <span class="ticktick-list-name">${list.name}</span>
        <span class="ticktick-list-count">${list.taskCount || 0} tasks</span>
      </div>
    `).join('');
  }

  attachEventListeners() {
    // Connect to TickTick
    const connectBtn = this.container.querySelector('#connect-ticktick');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connectToTickTick());
    }

    // Disconnect from TickTick
    const disconnectBtn = this.container.querySelector('#disconnect-ticktick');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => this.disconnectFromTickTick());
    }

    // Sync capacity tasks
    const syncCapacityBtn = this.container.querySelector('#sync-capacity-tasks');
    if (syncCapacityBtn) {
      syncCapacityBtn.addEventListener('click', () => this.syncCapacityTasks());
    }

    // Sync brain dump
    const syncBrainDumpBtn = this.container.querySelector('#sync-brain-dump');
    if (syncBrainDumpBtn) {
      syncBrainDumpBtn.addEventListener('click', () => this.syncBrainDumpItems());
    }
  }

  async connectToTickTick() {
    try {
      const success = await this.ticktickService.authenticate();
      if (success) {
        this.isConnected = true;
        this.render();
        this.showMessage('Successfully connected to TickTick!', 'success');
      } else {
        this.showMessage('Failed to connect to TickTick. Please check your token.', 'error');
      }
    } catch (error) {
      console.error('TickTick connection error:', error);
      this.showMessage('Connection failed: ' + error.message, 'error');
    }
  }

  async disconnectFromTickTick() {
    if (confirm('Are you sure you want to disconnect from TickTick? This will stop all syncing.')) {
      this.ticktickService.disconnect();
      this.isConnected = false;
      this.render();
      this.showMessage('Disconnected from TickTick', 'success');
    }
  }

  async syncCapacityTasks() {
    try {
      // Get tasks from capacity planner
      const capacityTasks = this.data.get('capacity_tasks', []);
      
      if (capacityTasks.length === 0) {
        this.showMessage('No tasks in capacity planner to sync', 'error');
        return;
      }

      this.showMessage('Syncing capacity tasks...', 'info');
      await this.ticktickService.syncCapacityTasks(capacityTasks);
      this.render();
      this.showMessage(`Successfully synced ${capacityTasks.length} tasks to TickTick!`, 'success');
    } catch (error) {
      console.error('Sync error:', error);
      this.showMessage('Sync failed: ' + error.message, 'error');
    }
  }

  async syncBrainDumpItems() {
    try {
      // Get items from brain dump
      const brainDumpItems = this.data.get('brain_dump_items', []);
      
      if (brainDumpItems.length === 0) {
        this.showMessage('No items in brain dump to sync', 'error');
        return;
      }

      this.showMessage('Syncing brain dump items...', 'info');
      await this.ticktickService.syncBrainDumpItems(brainDumpItems);
      this.render();
      this.showMessage(`Successfully synced ${brainDumpItems.length} items to TickTick!`, 'success');
    } catch (error) {
      console.error('Sync error:', error);
      this.showMessage('Sync failed: ' + error.message, 'error');
    }
  }

  showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = this.container.querySelector('.ticktick-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create new message
    const messageEl = document.createElement('div');
    messageEl.className = `ticktick-message ${type}-message`;
    messageEl.textContent = message;
    
    // Insert after header
    const header = this.container.querySelector('.integration-header');
    header.insertAdjacentElement('afterend', messageEl);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 5000);
  }
}
