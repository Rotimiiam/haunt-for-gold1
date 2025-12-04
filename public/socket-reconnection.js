/**
 * Socket.IO Reconnection Handler
 * Handles client-side reconnection logic with state recovery
 */

class SocketReconnectionHandler {
  constructor(socket) {
    this.socket = socket;
    this.isReconnecting = false;
    this.reconnectionAttempts = 0;
    this.maxReconnectionAttempts = 5;
    
    this.setupListeners();
  }

  setupListeners() {
    // Handle connection errors
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      
      if (this.socket.active) {
        // Temporary failure, socket will auto-reconnect
        this.isReconnecting = true;
        this.showReconnectionUI();
      } else {
        // Connection denied by server
        console.error('Connection denied:', error.message);
        this.handleConnectionDenied(error);
      }
    });

    // Handle successful reconnection
    this.socket.on('connect', () => {
      if (this.isReconnecting) {
        console.log('Reconnected successfully');
        this.isReconnecting = false;
        this.reconnectionAttempts = 0;
        this.hideReconnectionUI();
        this.requestStateRecovery();
      }
    });

    // Handle disconnect
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, need manual reconnect
        this.socket.connect();
      }
      // Otherwise, socket will auto-reconnect
    });

    // Listen for reconnection attempts
    this.socket.io.on('reconnect_attempt', (attempt) => {
      this.reconnectionAttempts = attempt;
      console.log(`Reconnection attempt ${attempt}`);
      this.updateReconnectionUI(attempt);
    });

    // Listen for reconnection failures
    this.socket.io.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      this.handleReconnectionFailed();
    });
  }

  showReconnectionUI() {
    // Create or show reconnection overlay
    let overlay = document.getElementById('reconnection-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'reconnection-overlay';
      overlay.className = 'reconnection-overlay';
      overlay.innerHTML = `
        <div class="reconnection-content">
          <div class="reconnection-spinner"></div>
          <h3>Connection Lost</h3>
          <p id="reconnection-message">Attempting to reconnect...</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  }

  hideReconnectionUI() {
    const overlay = document.getElementById('reconnection-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  updateReconnectionUI(attempt) {
    const message = document.getElementById('reconnection-message');
    if (message) {
      message.textContent = `Reconnection attempt ${attempt}/${this.maxReconnectionAttempts}...`;
    }
  }

  handleConnectionDenied(error) {
    const overlay = document.getElementById('reconnection-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div class="reconnection-content">
          <h3>Connection Failed</h3>
          <p>${error.message || 'Unable to connect to server'}</p>
          <button onclick="location.reload()">Reload Page</button>
        </div>
      `;
    }
  }

  handleReconnectionFailed() {
    const overlay = document.getElementById('reconnection-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div class="reconnection-content">
          <h3>Reconnection Failed</h3>
          <p>Unable to reconnect to the server</p>
          <button onclick="location.reload()">Reload Page</button>
        </div>
      `;
    }
  }

  requestStateRecovery() {
    // Request state recovery from server
    this.socket.emit('requestStateRecovery', (response) => {
      if (response && response.status === 'OK') {
        console.log('State recovered successfully');
        // Trigger state update in game
        if (window.gameState && response.gameState) {
          Object.assign(window.gameState, response.gameState);
        }
      }
    });
  }
}

// Auto-initialize if socket exists
if (typeof io !== 'undefined') {
  window.SocketReconnectionHandler = SocketReconnectionHandler;
}
