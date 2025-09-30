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
    console.log('🔧 TickTick Integration initializing...');
    this.ticktickService = new TickTickService(this.data);
    console.log('✅ TickTick Service created');
    
    this.isConnected = this.ticktickService.isReady();
    console.log('🔌 TickTick connection status:', this.isConnected);
    
    this.render();
    console.log('🎨 TickTick UI rendered');

    console.log('🔗 TickTick service ready for other components');
  }

  render() {
    const status = this.ticktickService.getStatus();

    this.container.innerHTML = `
      <button class="ticktick-connect-btn settings-item" id="ticktick-connect-btn">
        <span class="item-icon">📋</span>
        <div class="item-content">
          <span class="item-text">TickTick</span>
          <span class="item-description">${status.isReady ? 'Connected' : 'Connect to sync tasks'}</span>
        </div>
      </button>

      <style>
        .ticktick-connect-btn {
          width: 100% !important;
          margin: 0 !important;
          background: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.14) !important;
          border-radius: var(--radius-md) !important;
          padding: 8px 12px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          color: var(--color-text-primary) !important;
          text-align: left !important;
          min-height: 40px !important;
        }

        .ticktick-connect-btn:hover {
          background: rgba(56, 189, 248, 0.08) !important;
          border-color: rgba(56, 189, 248, 0.6) !important;
          transform: translateY(-2px) !important;
        }
      </style>
    `;

    this.attachEventListeners();
  }


  attachEventListeners() {
    // Connect to TickTick
    const connectBtn = this.container.querySelector('#ticktick-connect-btn');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connectToTickTick());
    }
  }

  async connectToTickTick() {
    try {
      const success = await this.ticktickService.authenticate();
      if (success) {
        this.isConnected = true;
        this.render();

        // Notify the rest of the app and refresh calendar
        try {
          document.dispatchEvent(
            new window.CustomEvent('ticktick:connected', {
              detail: { status: this.ticktickService.getStatus() },
            })
          );
          const weekly = window.lifeDashboard?.modules?.weeklyCalendar;
          if (weekly) weekly.setTickTickService(this.ticktickService);
        } catch (e) {
          console.warn('TickTick: failed to dispatch connected event', e);
        }
      } else {
        console.error('Failed to connect to TickTick');
      }
    } catch (error) {
      console.error('TickTick connection error:', error);
    }
  }

}
