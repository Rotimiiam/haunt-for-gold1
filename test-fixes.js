/**
 * Test Script for Comprehensive Fixes
 * Run with: node test-fixes.js
 */

const path = require('path');
const fs = require('fs');

console.log('🎃 Testing Haunt For Gold Comprehensive Fixes...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// Test 1: Check utility files exist
test('Socket error handler exists', () => {
  const filePath = path.join(__dirname, 'utils', 'socket-error-handler.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
});

test('Room cleanup utility exists', () => {
  const filePath = path.join(__dirname, 'utils', 'room-cleanup.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
});

test('Reconnection manager exists', () => {
  const filePath = path.join(__dirname, 'utils', 'reconnection-manager.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
});

// Test 2: Check client files exist
test('Client reconnection handler exists', () => {
  const filePath = path.join(__dirname, 'public', 'socket-reconnection.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
});

test('Reconnection CSS exists', () => {
  const filePath = path.join(__dirname, 'public', 'css', 'reconnection.css');
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
});

// Test 3: Check utilities can be required
test('Socket error handler can be required', () => {
  const module = require('./utils/socket-error-handler');
  if (!module.wrapSocketHandler || !module.validateSocketData) {
    throw new Error('Missing exports');
  }
});

test('Room cleanup can be required', () => {
  const module = require('./utils/room-cleanup');
  if (!module.cleanupRoom || !module.safeDeleteRoom) {
    throw new Error('Missing exports');
  }
});

test('Reconnection manager can be required', () => {
  const ReconnectionManager = require('./utils/reconnection-manager');
  const instance = new ReconnectionManager();
  if (!instance.storeDisconnectedPlayer || !instance.getDisconnectedPlayer) {
    throw new Error('Missing methods');
  }
});

// Test 4: Test validation function
test('Input validation works correctly', () => {
  const { validateSocketData } = require('./utils/socket-error-handler');
  
  // Valid input
  const valid = validateSocketData(
    { playerName: 'TestPlayer' },
    { playerName: { required: true, type: 'string', minLength: 2 } }
  );
  if (!valid.valid) {
    throw new Error('Valid input rejected');
  }
  
  // Invalid input (too short)
  const invalid = validateSocketData(
    { playerName: 'A' },
    { playerName: { required: true, type: 'string', minLength: 2 } }
  );
  if (invalid.valid) {
    throw new Error('Invalid input accepted');
  }
});

// Test 5: Test reconnection manager
test('Reconnection manager stores and retrieves data', () => {
  const ReconnectionManager = require('./utils/reconnection-manager');
  const manager = new ReconnectionManager();
  
  const socketId = 'test-socket-123';
  const playerData = { name: 'TestPlayer', score: 100 };
  const roomData = { roomId: 1 };
  
  manager.storeDisconnectedPlayer(socketId, playerData, roomData);
  const retrieved = manager.getDisconnectedPlayer(socketId);
  
  if (!retrieved || retrieved.playerData.name !== 'TestPlayer') {
    throw new Error('Data not stored/retrieved correctly');
  }
  
  manager.clearDisconnectedPlayer(socketId);
  const cleared = manager.getDisconnectedPlayer(socketId);
  
  if (cleared !== null) {
    throw new Error('Data not cleared correctly');
  }
});

// Test 6: Check server.js has been updated
test('Server.js imports new utilities', () => {
  const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  
  if (!serverContent.includes('socket-error-handler')) {
    throw new Error('Missing socket-error-handler import');
  }
  if (!serverContent.includes('room-cleanup')) {
    throw new Error('Missing room-cleanup import');
  }
  if (!serverContent.includes('reconnection-manager')) {
    throw new Error('Missing reconnection-manager import');
  }
});

test('Server.js uses wrapSocketHandler', () => {
  const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  
  if (!serverContent.includes('wrapSocketHandler')) {
    throw new Error('wrapSocketHandler not used');
  }
});

test('Server.js has error handling middleware', () => {
  const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  
  if (!serverContent.includes('Global error handling middleware')) {
    throw new Error('Error handling middleware not found');
  }
});

// Test 7: Check database config updated
test('Database config has connection pooling', () => {
  const dbContent = fs.readFileSync(path.join(__dirname, 'config', 'database.js'), 'utf8');
  
  if (!dbContent.includes('pool')) {
    throw new Error('Connection pooling not configured');
  }
});

// Test 8: Check documentation exists
test('FIXES_APPLIED.md exists', () => {
  const filePath = path.join(__dirname, 'FIXES_APPLIED.md');
  if (!fs.existsSync(filePath)) {
    throw new Error('Documentation not found');
  }
});

test('INTEGRATION_GUIDE.md exists', () => {
  const filePath = path.join(__dirname, 'INTEGRATION_GUIDE.md');
  if (!fs.existsSync(filePath)) {
    throw new Error('Integration guide not found');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All tests passed! Your fixes are ready to use.');
  console.log('\nNext steps:');
  console.log('1. Update your .env file (see .env.example)');
  console.log('2. Add reconnection handler to your HTML files');
  console.log('3. Start the server: npm start');
  console.log('4. Test reconnection by toggling network offline/online');
  console.log('\nSee INTEGRATION_GUIDE.md for detailed instructions.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please check the errors above.');
  process.exit(1);
}
