/**
 * Reconnection Manager
 * Handles player reconnection and state recovery
 */

class ReconnectionManager {
  constructor() {
    // Store disconnected player states for 60 seconds
    this.disconnectedPlayers = new Map();
    this.RECONNECTION_WINDOW = 60000; // 60 seconds
  }

  /**
   * Store player state on disconnect
   * @param {string} socketId - The socket ID
   * @param {Object} playerData - Player data to store
   * @param {Object} roomData - Room data to store
   */
  storeDisconnectedPlayer(socketId, playerData, roomData) {
    this.disconnectedPlayers.set(socketId, {
      playerData,
      roomData,
      disconnectedAt: Date.now()
    });

    // Auto-cleanup after reconnection window
    setTimeout(() => {
      this.disconnectedPlayers.delete(socketId);
    }, this.RECONNECTION_WINDOW);

    console.log(`Stored state for disconnected player ${socketId}`);
  }

  /**
   * Retrieve player state on reconnection
   * @param {string} socketId - The socket ID
   * @returns {Object|null} Stored player data or null
   */
  getDisconnectedPlayer(socketId) {
    const data = this.disconnectedPlayers.get(socketId);
    
    if (!data) return null;
    
    // Check if reconnection window has expired
    if (Date.now() - data.disconnectedAt > this.RECONNECTION_WINDOW) {
      this.disconnectedPlayers.delete(socketId);
      return null;
    }
    
    return data;
  }

  /**
   * Clear stored player data
   * @param {string} socketId - The socket ID
   */
  clearDisconnectedPlayer(socketId) {
    this.disconnectedPlayers.delete(socketId);
  }
}

module.exports = ReconnectionManager;
