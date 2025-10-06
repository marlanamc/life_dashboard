/**
 * Focus Timer Component
 * Pomodoro-style timer for focus sessions
 */
export class FocusTimer {
  constructor(container, dataManager) {
    this.container = container;
    this.data = dataManager;
    this.isRunning = false;
    this.timeLeft = 25 * 60; // 25 minutes in seconds
    this.totalTime = 25 * 60;
    this.timerInterval = null;
    this.sessionsToday = 0;
    this.soundEnabled = true;

    this.init();
  }

  init() {
    this.loadSettings();
    this.render();
    this.attachEventListeners();
  }

  loadSettings() {
    this.sessionsToday = this.data.get('focusSessionsToday', 0);
    this.soundEnabled = this.data.get('focusSoundEnabled', true);
  }

  render() {
    this.container.innerHTML = `
      <div class="focus-timer">
        <div class="timer-circle">
          <div class="timer-display" id="timer-display">${this.formatTime(this.timeLeft)}</div>
        </div>
        <div class="timer-controls">
          <button class="timer-btn timer-play" id="timer-play" title="Start/Pause">
            <span class="play-icon">▶</span>
            <span class="pause-icon" style="display: none;">⏸</span>
          </button>
          <button class="timer-btn timer-reset" id="timer-reset" title="Reset">↻</button>
          <button class="timer-btn timer-skip" id="timer-skip" title="Skip">⏭</button>
        </div>
        <div class="timer-progress">
          <div class="progress-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <div class="sessions-count" id="sessions-count">${this.sessionsToday} sessions today</div>
        </div>
        <div class="timer-settings">
          <label class="checkbox-label">
            <input type="checkbox" id="sound-alerts" ${this.soundEnabled ? 'checked' : ''}>
            <span class="checkmark"></span>
            Sound alerts
          </label>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const playBtn = this.container.querySelector('#timer-play');
    const resetBtn = this.container.querySelector('#timer-reset');
    const skipBtn = this.container.querySelector('#timer-skip');
    const soundCheckbox = this.container.querySelector('#sound-alerts');

    playBtn.addEventListener('click', () => this.toggleTimer());
    resetBtn.addEventListener('click', () => this.resetTimer());
    skipBtn.addEventListener('click', () => this.skipTimer());
    
    soundCheckbox.addEventListener('change', (e) => {
      this.soundEnabled = e.target.checked;
      this.data.set('focusSoundEnabled', this.soundEnabled);
    });
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    this.isRunning = true;
    const playBtn = this.container.querySelector('#timer-play');
    const playIcon = playBtn.querySelector('.play-icon');
    const pauseIcon = playBtn.querySelector('.pause-icon');
    
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'inline';
    
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      
      if (this.timeLeft <= 0) {
        this.completeSession();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    const playBtn = this.container.querySelector('#timer-play');
    const playIcon = playBtn.querySelector('.play-icon');
    const pauseIcon = playBtn.querySelector('.pause-icon');
    
    playIcon.style.display = 'inline';
    pauseIcon.style.display = 'none';
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.totalTime;
    this.updateDisplay();
  }

  skipTimer() {
    this.completeSession();
  }

  completeSession() {
    this.pauseTimer();
    this.sessionsToday++;
    this.data.set('focusSessionsToday', this.sessionsToday);
    
    // Update sessions count display
    const sessionsCount = this.container.querySelector('#sessions-count');
    sessionsCount.textContent = `${this.sessionsToday} sessions today`;
    
    // Play completion sound if enabled
    if (this.soundEnabled) {
      this.playCompletionSound();
    }
    
    // Show completion notification
    this.showCompletionNotification();
    
    // Reset timer for next session
    this.timeLeft = this.totalTime;
    this.updateDisplay();
  }

  updateDisplay() {
    const display = this.container.querySelector('#timer-display');
    display.textContent = this.formatTime(this.timeLeft);
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  playCompletionSound() {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  showCompletionNotification() {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.textContent = '🎉 Focus session complete!';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-primary);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}
