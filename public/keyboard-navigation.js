/**
 * Keyboard Navigation Enhancement
 * Improves accessibility and keyboard navigation throughout the game
 */

class KeyboardNavigationManager {
  constructor() {
    this.focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    this.currentModalFocusTrap = null;
    this.lastFocusedElement = null;
    
    this.init();
  }

  init() {
    // Detect input method (keyboard vs mouse)
    this.setupInputMethodDetection();
    
    // Setup escape key handler for modals
    this.setupEscapeHandler();
    
    // Setup skip link
    this.setupSkipLink();
    
    console.log('Keyboard Navigation Manager initialized');
  }

  /**
   * Detect whether user is using keyboard or mouse for navigation
   */
  setupInputMethodDetection() {
    let isUsingKeyboard = false;

    // Detect keyboard usage
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true;
        document.body.classList.add('keyboard-nav');
        document.body.classList.remove('mouse-nav');
      }
    });

    // Detect mouse usage
    document.addEventListener('mousedown', () => {
      isUsingKeyboard = false;
      document.body.classList.add('mouse-nav');
      document.body.classList.remove('keyboard-nav');
    });

    // Initial state
    document.body.classList.add('mouse-nav');
  }

  /**
   * Setup escape key to close modals
   */
  setupEscapeHandler() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });
  }

  /**
   * Handle escape key press
   */
  handleEscape() {
    // Close any open modals
    const openModals = document.querySelectorAll('.modal:not([style*="display: none"])');
    if (openModals.length > 0) {
      const lastModal = openModals[openModals.length - 1];
      const closeButton = lastModal.querySelector('[data-close], .close-btn, .modal-close');
      if (closeButton) {
        closeButton.click();
      }
    }

    // Close winner screen if open
    const winnerScreen = document.getElementById('winnerScreen');
    if (winnerScreen && winnerScreen.style.display !== 'none') {
      const homeBtn = document.getElementById('homeBtn');
      if (homeBtn) {
        homeBtn.focus();
      }
    }
  }

  /**
   * Setup skip link for screen readers
   */
  setupSkipLink() {
    // Only add if not already present
    if (document.querySelector('.skip-link')) return;

    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content') || 
                         document.getElementById('homeScreen') ||
                         document.querySelector('main');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Trap focus within a modal
   * @param {HTMLElement} modalElement - The modal element to trap focus in
   */
  trapFocus(modalElement) {
    if (!modalElement) return;

    this.lastFocusedElement = document.activeElement;
    this.currentModalFocusTrap = modalElement;

    const focusableElements = modalElement.querySelectorAll(this.focusableElements);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Handle tab navigation
    const trapFocusHandler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    modalElement.addEventListener('keydown', trapFocusHandler);
    modalElement.setAttribute('data-focus-trap', 'true');
  }

  /**
   * Release focus trap from modal
   */
  releaseFocusTrap() {
    if (this.currentModalFocusTrap) {
      this.currentModalFocusTrap.removeAttribute('data-focus-trap');
      this.currentModalFocusTrap = null;
    }

    // Return focus to last focused element
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  }

  /**
   * Make an element focusable and add to tab order
   * @param {HTMLElement} element - The element to make focusable
   */
  makeFocusable(element) {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  }

  /**
   * Remove element from tab order
   * @param {HTMLElement} element - The element to remove from tab order
   */
  makeUnfocusable(element) {
    element.setAttribute('tabindex', '-1');
  }

  /**
   * Move focus to element
   * @param {HTMLElement|string} elementOrSelector - Element or selector to focus
   */
  focusElement(elementOrSelector) {
    const element = typeof elementOrSelector === 'string'
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;

    if (element) {
      // Make element focusable if it isn't already
      if (!element.matches(this.focusableElements)) {
        this.makeFocusable(element);
      }
      element.focus();
    }
  }

  /**
   * Setup keyboard shortcuts for the game
   */
  setupGameShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.matches('input, textarea, select')) {
        return;
      }

      // Prevent default for game shortcuts
      const shortcuts = {
        'h': () => this.goHome(),
        'p': () => this.togglePause(),
        'm': () => this.toggleMusic(),
        'f': () => this.toggleFullscreen(),
        '?': () => this.showHelp(),
      };

      if (shortcuts[e.key.toLowerCase()]) {
        e.preventDefault();
        shortcuts[e.key.toLowerCase()]();
      }
    });
  }

  /**
   * Navigate to home screen
   */
  goHome() {
    const homeScreen = document.getElementById('homeScreen');
    if (homeScreen && homeScreen.style.display !== 'flex') {
      if (window.gameLifecycleManager) {
        window.gameLifecycleManager.returnToHome();
      }
    }
  }

  /**
   * Toggle pause state (if in game)
   */
  togglePause() {
    if (window.gameStarted) {
      // Trigger pause functionality if available
      const pauseBtn = document.querySelector('[data-action="pause"]');
      if (pauseBtn) {
        pauseBtn.click();
      }
    }
  }

  /**
   * Toggle background music
   */
  toggleMusic() {
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) {
      musicToggle.click();
    }
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    if (fullscreenToggle && fullscreenToggle.style.display !== 'none') {
      fullscreenToggle.click();
    }
  }

  /**
   * Show help/controls info
   */
  showHelp() {
    console.log('Help requested - implement help modal');
    // TODO: Implement help modal showing keyboard shortcuts
  }

  /**
   * Announce message to screen readers
   * @param {string} message - The message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    let announcer = document.getElementById('aria-announcer');
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'aria-announcer';
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }

    // Clear and set new message
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }
}

// Initialize keyboard navigation manager
if (typeof window !== 'undefined') {
  window.keyboardNavManager = new KeyboardNavigationManager();
  
  // Setup shortcuts when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.keyboardNavManager.setupGameShortcuts();
    });
  } else {
    window.keyboardNavManager.setupGameShortcuts();
  }
}
