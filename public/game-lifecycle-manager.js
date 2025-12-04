/**
 * Game Lifecycle Manager
 * Ensures only one game instance runs at a time
 * Provides proper cleanup when switching between game modes
 */

class GameLifecycleManager {
  constructor() {
    this.currentMode = null; // 'practice', 'multiplayer', 'local'
    this.activeInstance = null;
    this.debug = false; // Set to true for debugging
  }

  log(...args) {
    if (this.debug) {
      console.log('[GameLifecycle]', ...args);
    }
  }

  /**
   * Start a new game mode, cleaning up any existing mode
   * @param {string} mode - The game mode to start
   * @param {Object} instance - The game instance
   */
  startMode(mode, instance) {
    this.log(`Starting ${mode} mode`);
    
    // Clean up current mode if different
    if (this.currentMode && this.currentMode !== mode) {
      this.log(`Switching from ${this.currentMode} to ${mode}`);
      this.cleanup();
    }

    this.currentMode = mode;
    this.activeInstance = instance;
  }

  /**
   * Clean up the current game mode
   */
  cleanup() {
    if (this.currentMode) {
      this.log(`Cleaning up ${this.currentMode} mode`);
    }

    // Stop all game loops
    window.gameStarted = false;

    // Clean up practice mode
    if (window.practiceMode && window.practiceMode.cleanup) {
      window.practiceMode.cleanup();
    }

    // Clean up multiplayer mode
    if (window.multiplayerMode) {
      if (window.multiplayerMode.cleanup) {
        window.multiplayerMode.cleanup();
      }
      if (window.multiplayerMode.disconnect) {
        window.multiplayerMode.disconnect();
      }
    }

    // Clean up local multiplayer
    this.cleanupLocalMultiplayer();

    // Clear global game state
    window.gameState = null;

    // Reset current mode
    this.currentMode = null;
    this.activeInstance = null;

    this.log('Cleanup complete');
  }

  /**
   * Clean up local multiplayer specific resources
   */
  cleanupLocalMultiplayer() {
    // Clear all local multiplayer intervals
    if (window.localEnemyInterval) {
      clearInterval(window.localEnemyInterval);
      window.localEnemyInterval = null;
    }
    
    if (window.localTimerInterval) {
      clearInterval(window.localTimerInterval);
      window.localTimerInterval = null;
    }
    
    if (window.localWitchMoveInterval) {
      clearInterval(window.localWitchMoveInterval);
      window.localWitchMoveInterval = null;
    }
    
    if (window.localWitchVibrationInterval) {
      clearInterval(window.localWitchVibrationInterval);
      window.localWitchVibrationInterval = null;
    }

    // Clear animation frames
    if (window.localRenderFrame) {
      cancelAnimationFrame(window.localRenderFrame);
      window.localRenderFrame = null;
    }
    
    if (window.localGamepadPoll) {
      cancelAnimationFrame(window.localGamepadPoll);
      window.localGamepadPoll = null;
    }

    // Clear local game state
    if (window.localGameState) {
      window.localGameState = null;
    }
  }

  /**
   * Return to home screen with full cleanup
   */
  returnToHome() {
    this.log('Returning to home');
    
    // Clean up all game modes
    this.cleanup();

    // Stop background music if function exists
    if (typeof stopBackgroundMusic === 'function') {
      stopBackgroundMusic();
    }

    // Hide all game UI elements
    const elementsToHide = [
      'gameCanvas',
      'scoreboard',
      'waitingScreen',
      'winnerScreen',
      'nameDialog',
      'musicToggle'
    ];

    elementsToHide.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
      }
    });

    // Hide elements by class
    const classesToHide = [
      '.controls',
      '.info',
      '.game-container'
    ];

    classesToHide.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.display = 'none';
      });
    });

    // Exit fullscreen mode if active
    if (document.body.classList.contains('fullscreen-mode')) {
      document.body.classList.remove('fullscreen-mode');
      if (typeof resetCanvasSize === 'function') {
        resetCanvasSize();
      }
    }

    // Show home screen
    const homeScreen = document.getElementById('homeScreen');
    if (homeScreen) {
      homeScreen.style.display = 'flex';
    }

    this.log('Returned to home successfully');
  }

  /**
   * Get current game mode
   * @returns {string|null} Current mode or null
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * Check if a game is currently active
   * @returns {boolean} True if game is active
   */
  isGameActive() {
    return this.currentMode !== null;
  }
}

// Create global instance
window.gameLifecycleManager = new GameLifecycleManager();
