/**
 * Audio Integration Helper
 * Adds audio feedback to UI interactions
 */

(function() {
  'use strict';

  // Wait for spooky audio manager to be ready
  function waitForAudioManager() {
    return new Promise((resolve) => {
      if (window.spookyAudioManager && window.spookyAudioManager.initialized) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (window.spookyAudioManager && window.spookyAudioManager.initialized) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 5000);
      }
    });
  }

  // Add audio to all buttons
  function addButtonAudio() {
    // Add click sound to all buttons
    const buttons = document.querySelectorAll('button, .btn, .spooky-btn, a[role="button"]');
    
    buttons.forEach(button => {
      // Avoid adding duplicate listeners
      if (button.dataset.audioEnabled) return;
      
      button.addEventListener('click', (e) => {
        if (window.spookyAudioManager) {
          window.spookyAudioManager.playButtonClick();
        }
      });
      
      button.dataset.audioEnabled = 'true';
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await waitForAudioManager();
      addButtonAudio();
    });
  } else {
    waitForAudioManager().then(() => {
      addButtonAudio();
    });
  }

  // Re-add audio when new elements are added (for dynamic content)
  const observer = new MutationObserver((mutations) => {
    let hasNewButtons = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.matches('button, .btn, .spooky-btn, a[role="button"]') ||
                node.querySelector('button, .btn, .spooky-btn, a[role="button"]')) {
              hasNewButtons = true;
            }
          }
        });
      }
    }
    
    if (hasNewButtons) {
      addButtonAudio();
    }
  });

  // Start observing
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Export for manual use
  window.addButtonAudio = addButtonAudio;
})();
