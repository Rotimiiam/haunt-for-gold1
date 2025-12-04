/**
 * Room Cleanup Utilities
 * Handles proper cleanup of game rooms and timers
 */

/**
 * Cleans up a game room and all associated timers
 * @param {Object} room - The room to clean up
 */
function cleanupRoom(room) {
  if (!room) return;
  
  // Clear witch spawn timer
  if (room.witchSpawnTimer) {
    clearTimeout(room.witchSpawnTimer);
    room.witchSpawnTimer = null;
  }
  
  // Clear any other timers associated with the room
  if (room.timers && Array.isArray(room.timers)) {
    room.timers.forEach(timer => clearTimeout(timer));
    room.timers = [];
  }
  
  // Mark room as inactive
  room.gameStarted = false;
  
  console.log(`Cleaned up room ${room.id}`);
}

/**
 * Safely deletes a room from the game rooms map
 * @param {Map} gameRooms - The game rooms map
 * @param {number} roomId - The room ID to delete
 */
function safeDeleteRoom(gameRooms, roomId) {
  const room = gameRooms.get(roomId);
  if (room) {
    cleanupRoom(room);
    gameRooms.delete(roomId);
    console.log(`Deleted room ${roomId}`);
  }
}

module.exports = {
  cleanupRoom,
  safeDeleteRoom
};
