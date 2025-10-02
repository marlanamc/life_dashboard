import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { initializeFirebase } from './firebase-service.js';

export class AuthManager {
  constructor({ containerId = 'auth-overlay-root', onAuthChange = null } = {}) {
    this.container = document.getElementById(containerId);
    this.onAuthChange = onAuthChange;
    this.auth = null;
    this.user = null;
    this.mode = 'signin';
    this.loading = false;
    this.errorElement = null;
    this.authCard = null;
    this.overlay = null;
    this.accountChip = null;

    this.ensureContainer();
    this.renderBase();
    this.initialize();
  }

  ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'auth-overlay-root';
      document.body.appendChild(this.container);
    }
  }

  renderBase() {
    this.container.innerHTML = `
      <div class="auth-overlay" id="auth-overlay" aria-hidden="true">
        <div class="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <div class="auth-card__header">
            <h3 id="auth-title">Welcome Back</h3>
            <p class="auth-card__subtitle">Sign in to sync your dashboard across devices.</p>
          </div>
          <form class="auth-form" id="auth-form">
            <div class="auth-field" data-field="name" style="display: none;">
              <label for="auth-name">Name</label>
              <input type="text" id="auth-name" placeholder="Marlie" autocomplete="name" />
            </div>
            <div class="auth-field">
              <label for="auth-email">Email</label>
              <input type="email" id="auth-email" placeholder="you@example.com" autocomplete="email" required />
            </div>
            <div class="auth-field">
              <label for="auth-password">Password</label>
              <input type="password" id="auth-password" placeholder="••••••••" autocomplete="current-password" required />
            </div>
            <button type="submit" class="auth-submit">
              <span class="auth-submit__label">Sign in</span>
              <span class="auth-submit__spinner" aria-hidden="true"></span>
            </button>
          </form>
          <div class="auth-helper">
            <button type="button" class="auth-switch" id="auth-switch">Need an account? Sign up</button>
            <button type="button" class="auth-forgot" id="auth-forgot">Forgot password?</button>
          </div>
          <div class="auth-error" id="auth-error" role="alert"></div>
        </div>
      </div>
      <!-- Account chip removed - logout functionality moved to settings menu -->
    `;

    this.overlay = this.container.querySelector('#auth-overlay');
    this.authCard = this.container.querySelector('.auth-card');
    this.errorElement = this.container.querySelector('#auth-error');
    // Account chip removed - logout moved to settings menu

    this.container.querySelector('#auth-form').addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleSubmit();
    });

    this.container.querySelector('#auth-switch').addEventListener('click', () => {
      this.toggleMode();
    });

    this.container.querySelector('#auth-forgot').addEventListener('click', () => {
      this.handlePasswordReset();
    });

    // Signout button removed - logout handled in settings menu
  }

  async initialize() {
    try {
      const services = await initializeFirebase();
      if (!services) {
        this.showError('Firebase configuration is missing. Update your .env to enable sign-in.');
        return;
      }

      this.auth = services.auth;

      // Set persistence to LOCAL so users stay signed in
      await setPersistence(this.auth, browserLocalPersistence);
      console.log('[AuthManager] Firebase persistence set to LOCAL');

      onAuthStateChanged(this.auth, (user) => {
        this.user = user;
        console.log('[AuthManager] Auth state changed:', user ? `User: ${user.email}` : 'Not signed in');
        this.updateUI();
        if (typeof this.onAuthChange === 'function') {
          this.onAuthChange(user);
        }
      });
    } catch (error) {
      console.error('[AuthManager] Initialization failed', error);
      this.showError('Unable to initialize authentication. Check the console for details.');
    }
  }

  setLoading(isLoading) {
    this.loading = isLoading;
    const submitButton = this.container.querySelector('.auth-submit');
    if (!submitButton) return;
    submitButton.classList.toggle('is-loading', isLoading);
    submitButton.disabled = isLoading;
  }

  get emailInput() {
    return this.container.querySelector('#auth-email');
  }

  get passwordInput() {
    return this.container.querySelector('#auth-password');
  }

  get nameInput() {
    return this.container.querySelector('#auth-name');
  }

  toggleMode() {
    this.mode = this.mode === 'signin' ? 'signup' : 'signin';
    const isSignUp = this.mode === 'signup';
    const title = this.container.querySelector('#auth-title');
    const subtitle = this.container.querySelector('.auth-card__subtitle');
    const submitLabel = this.container.querySelector('.auth-submit__label');
    const switchButton = this.container.querySelector('#auth-switch');
    const nameField = this.container.querySelector('[data-field="name"]');

    if (isSignUp) {
      title.textContent = 'Create Account';
      subtitle.textContent = 'Save your dashboard to the cloud so it travels with you.';
      submitLabel.textContent = 'Sign up';
      switchButton.textContent = 'Already have an account? Sign in';
      nameField.style.display = 'block';
      this.passwordInput.autocomplete = 'new-password';
    } else {
      title.textContent = 'Welcome Back';
      subtitle.textContent = 'Sign in to sync your dashboard across devices.';
      submitLabel.textContent = 'Sign in';
      switchButton.textContent = 'Need an account? Sign up';
      nameField.style.display = 'none';
      this.passwordInput.autocomplete = 'current-password';
    }

    this.clearError();
  }

  async handleSubmit() {
    if (!this.auth) {
      this.showError('Authentication not ready yet.');
      return;
    }

    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value.trim();
    const displayName = this.nameInput.value.trim();

    if (!email || !password) {
      this.showError('Please enter your email and password.');
      return;
    }

    this.setLoading(true);
    this.clearError();

    try {
      if (this.mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(this.auth, email, password);
        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }
        this.showToast('✨ Account created! You are now signed in.');
      } else {
        await signInWithEmailAndPassword(this.auth, email, password);
        this.showToast('👋 Welcome back!');
      }

      this.resetForm();
    } catch (error) {
      this.showError(this.mapAuthError(error));
    } finally {
      this.setLoading(false);
    }
  }

  async handlePasswordReset() {
    if (!this.auth) {
      this.showError('Authentication not ready yet.');
      return;
    }

    const email = this.emailInput.value.trim();
    if (!email) {
      this.showError('Enter your email above first, then click “Forgot password?”.');
      return;
    }

    this.setLoading(true);
    this.clearError();

    try {
      await sendPasswordResetEmail(this.auth, email);
      this.showToast('📬 Password reset email sent. Check your inbox.');
    } catch (error) {
      this.showError(this.mapAuthError(error));
    } finally {
      this.setLoading(false);
    }
  }

  async handleSignOut() {
    if (!this.auth) {
      return;
    }
    try {
      await signOut(this.auth);
      this.showToast('👋 Logged out. Your local data is still saved here.');
    } catch (error) {
      console.error('[AuthManager] Sign-out failed', error);
      this.showError('Sign-out failed. Please try again.');
    }
  }

  resetForm() {
    this.container.querySelector('#auth-form').reset();
    if (this.mode === 'signup') {
      this.nameInput.value = '';
    }
  }

  updateUI() {
    const isAuthenticated = Boolean(this.user);

    if (isAuthenticated) {
      this.overlay.setAttribute('aria-hidden', 'true');
      this.overlay.classList.add('auth-overlay--hidden');
    } else {
      this.overlay.classList.remove('auth-overlay--hidden');
      this.overlay.setAttribute('aria-hidden', 'false');
    }
  }

  showError(message) {
    if (!this.errorElement) return;
    this.errorElement.textContent = message;
    this.errorElement.style.display = 'block';
  }

  clearError() {
    if (!this.errorElement) return;
    this.errorElement.textContent = '';
    this.errorElement.style.display = 'none';
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'auth-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('auth-toast--visible');
    }, 10);
    setTimeout(() => {
      toast.classList.remove('auth-toast--visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 2600);
  }

  mapAuthError(error) {
    if (!error) return 'Something went wrong. Please try again.';

    const code = error.code ?? '';
    switch (code) {
      case 'auth/invalid-email':
        return 'That email looks invalid. Double-check and try again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support.';
      case 'auth/user-not-found':
        return 'No account found. Try signing up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Try again or reset it.';
      case 'auth/email-already-in-use':
        return 'That email already has an account. Try signing in instead.';
      case 'auth/weak-password':
        return 'Choose a stronger password (at least 6 characters).';
      default:
        return error.message ?? 'Authentication failed. Please try again.';
    }
  }
}
