/**
 * Help Modal - Keyboard Shortcuts and Game Instructions
 */

class HelpModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    // Create help modal on first access
    this.createModal();
    
    // Add help button if not exists
    this.addHelpButton();
    
    console.log('Help Modal initialized');
  }

  createModal() {
    const modalHTML = `
      <div id="helpModal" class="modal-backdrop" style="display: none;" role="dialog" aria-labelledby="helpModalTitle" aria-modal="true">
        <div class="modal">
          <div class="modal-header">
            <h2 id="helpModalTitle" class="modal-title">Game Controls & Help</h2>
            <button class="btn btn-ghost modal-close" aria-label="Close help">✕</button>
          </div>
          <div class="modal-body">
            <section>
              <h3 style="color: var(--ghost-green); margin-top: 0;">🎮 Game Controls</h3>
              <div class="help-section">
                <h4 style="color: var(--cursed-gold);">Keyboard Controls</h4>
                <ul style="list-style: none; padding: 0;">
                  <li><kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> - Move player</li>
                  <li><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> - Alternative movement</li>
                  <li><kbd>Space</kbd> - Action (context-specific)</li>
                  <li><kbd>Enter</kbd> - Confirm / Submit</li>
                  <li><kbd>Esc</kbd> - Close modal / Pause</li>
                </ul>
              </div>

              <div class="help-section">
                <h4 style="color: var(--cursed-gold);">Gamepad Controls</h4>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Left Stick / D-Pad</strong> - Move player</li>
                  <li><strong>A Button</strong> - Action / Confirm</li>
                  <li><strong>B Button</strong> - Back / Cancel</li>
                  <li><strong>Start Button</strong> - Pause / Menu</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 style="color: var(--ghost-green);">⌨️ Keyboard Shortcuts</h3>
              <ul style="list-style: none; padding: 0;">
                <li><kbd>H</kbd> - Return to home screen</li>
                <li><kbd>M</kbd> - Toggle music</li>
                <li><kbd>F</kbd> - Toggle fullscreen</li>
                <li><kbd>?</kbd> - Show this help</li>
                <li><kbd>Tab</kbd> - Navigate between UI elements</li>
              </ul>
            </section>

            <section>
              <h3 style="color: var(--ghost-green);">🎯 Game Objectives</h3>
              <ul>
                <li><strong>Collect Coins:</strong> Gold coins are worth +10 points</li>
                <li><strong>Avoid Bombs:</strong> Bomb coins deduct -20 points</li>
                <li><strong>Dodge Enemies:</strong> Ghosts and witches cause -5 points</li>
                <li><strong>Reach Target:</strong> First to reach the winning score wins!</li>
                <li><strong>Level Up:</strong> Game difficulty increases as you progress</li>
              </ul>
            </section>

            <section>
              <h3 style="color: var(--ghost-green);">🕹️ Game Modes</h3>
              <div class="help-section">
                <h4 style="color: var(--pumpkin-orange);">Practice Mode</h4>
                <p>Play solo against AI to practice your skills</p>
                
                <h4 style="color: var(--pumpkin-orange);">Online Multiplayer</h4>
                <p>Compete against other players in real-time</p>
                
                <h4 style="color: var(--pumpkin-orange);">Local Multiplayer</h4>
                <p>Play with friends on the same device using controllers</p>
              </div>
            </section>

            <section>
              <h3 style="color: var(--ghost-green);">♿ Accessibility Features</h3>
              <ul>
                <li>Full keyboard navigation support</li>
                <li>Gamepad/controller support</li>
                <li>Screen reader compatible</li>
                <li>Reduced motion support (system preference)</li>
                <li>High contrast mode support</li>
                <li>Customizable controls (coming soon)</li>
              </ul>
            </section>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary modal-close">Got it!</button>
          </div>
        </div>
      </div>
    `;

    // Insert modal into body
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);

    this.modal = document.getElementById('helpModal');

    // Setup close handlers
    const closeButtons = this.modal.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Add CSS for kbd elements
    this.addKbdStyles();
  }

  addKbdStyles() {
    if (document.getElementById('kbd-styles')) return;

    const style = document.createElement('style');
    style.id = 'kbd-styles';
    style.textContent = `
      kbd {
        display: inline-block;
        padding: 3px 6px;
        font-family: var(--font-mono, monospace);
        font-size: 0.875rem;
        color: var(--ghost-green, #00ff41);
        background: rgba(13, 13, 13, 0.8);
        border: 1px solid var(--deep-purple, #2d1b4e);
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        margin: 0 2px;
      }

      .help-section {
        margin: 16px 0;
        padding: 12px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
      }

      .help-section h4 {
        margin-top: 0;
      }

      .help-section ul {
        margin-bottom: 0;
      }

      .help-section li {
        padding: 4px 0;
      }
    `;
    document.head.appendChild(style);
  }

  addHelpButton() {
    // Check if help button already exists
    if (document.getElementById('helpButton')) return;

    const helpButton = document.createElement('button');
    helpButton.id = 'helpButton';
    helpButton.className = 'btn btn-ghost';
    helpButton.innerHTML = '❓ Help';
    helpButton.setAttribute('aria-label', 'Show game help and controls');
    helpButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 100;
      min-width: auto;
      padding: 8px 16px;
    `;

    helpButton.addEventListener('click', () => this.open());

    document.body.appendChild(helpButton);
  }

  open() {
    if (!this.modal) return;

    this.modal.style.display = 'flex';
    this.isOpen = true;

    // Trap focus in modal
    if (window.keyboardNavManager) {
      window.keyboardNavManager.trapFocus(this.modal.querySelector('.modal'));
    }

    // Announce to screen readers
    if (window.keyboardNavManager) {
      window.keyboardNavManager.announce('Help modal opened', 'polite');
    }
  }

  close() {
    if (!this.modal) return;

    this.modal.style.display = 'none';
    this.isOpen = false;

    // Release focus trap
    if (window.keyboardNavManager) {
      window.keyboardNavManager.releaseFocusTrap();
    }

    // Announce to screen readers
    if (window.keyboardNavManager) {
      window.keyboardNavManager.announce('Help modal closed', 'polite');
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

// Initialize help modal when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.helpModal = new HelpModal();
      
      // Update keyboard navigation manager to use help modal
      if (window.keyboardNavManager) {
        window.keyboardNavManager.showHelp = () => {
          if (window.helpModal) {
            window.helpModal.open();
          }
        };
      }
    });
  } else {
    window.helpModal = new HelpModal();
    
    // Update keyboard navigation manager
    if (window.keyboardNavManager) {
      window.keyboardNavManager.showHelp = () => {
        if (window.helpModal) {
          window.helpModal.open();
        }
      };
    }
  }
}
