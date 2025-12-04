# Integration Guide for Comprehensive Fixes

## Quick Start

### Step 1: Update Your HTML Files

Add the reconnection handler to all pages that use Socket.IO:

**game.html** - Add before closing `</body>`:
```html
<link rel="stylesheet" href="/css/reconnection.css">
<script src="/socket-reconnection.js"></script>
```

**After your socket initialization code, add:**
```javascript
// Initialize reconnection handler
if (typeof SocketReconnectionHandler !== 'undefined' && socket) {
  const reconnectionHandler = new SocketReconnectionHandler(socket);
  console.log('Reconnection handler initialized');
}
```

### Step 2: Update Environment Variables

Create or update `.env` file in project root:

```env
# Required in production
SESSION_SECRET=generate-a-secure-random-string-here

# Environment
NODE_ENV=development

# CORS (optional, defaults to *)
CORS_ORIGIN=http://localhost:3001

# Game settings (optional)
MAX_PLAYERS=2
WINNING_SCORE=500
DIFFICULTY_THRESHOLD=200
```

**Generate a secure session secret:**
```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 3: Test the Server

```bash
# Install dependencies (if needed)
npm install

# Start the server
npm start
```

Expected output:
```
SQLite connected successfully
Models synced
Session store synced
Server running on port 3001
Game settings: Max Players: 2, Winning Score: 500
```

### Step 4: Test Reconnection

1. Open game in browser
2. Join a game
3. Open browser DevTools (F12) → Network tab
4. Click "Offline" to simulate disconnect
5. You should see the reconnection overlay
6. Click "Online" to reconnect
7. Game state should be restored

## Integration Points

### For Multiplayer Mode (multiplayer-mode.js)

Add after socket connection:

```javascript
// In your socket initialization
const socket = io();

// Add reconnection handler
const reconnectionHandler = new SocketReconnectionHandler(socket);

// Listen for state recovery
socket.on('connect', () => {
  if (window.gameState && window.gameState.inGame) {
    // Request state recovery
    socket.emit('requestStateRecovery', (response) => {
      if (response && response.status === 'OK') {
        console.log('Game state recovered');
        updateGameState(response.gameState);
      }
    });
  }
});
```

### For Practice Mode (practice-mode.js)

No changes needed - practice mode is client-side only.

### For Local Multiplayer (local-multiplayer-*.js)

No changes needed - local multiplayer doesn't use Socket.IO.

## Error Handling

### Client-Side Error Handling

Add to your socket initialization:

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Show user-friendly error message
  showNotification(error.message || 'An error occurred', 'error');
});

socket.on('joinError', (error) => {
  console.error('Join error:', error);
  alert(error.message);
});
```

### Server-Side Error Monitoring

Check the health endpoint:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 123.456,
  "activeRooms": 2,
  "queueSize": 1
}
```

## Troubleshooting

### Issue: "Cannot find module './utils/socket-error-handler'"

**Solution**: Make sure the `utils/` directory exists with all three files:
- `utils/socket-error-handler.js`
- `utils/room-cleanup.js`
- `utils/reconnection-manager.js`

### Issue: Reconnection UI not showing

**Solution**: 
1. Check that `reconnection.css` is loaded
2. Check browser console for errors
3. Verify `socket-reconnection.js` is loaded before socket initialization

### Issue: "SESSION_SECRET must be set in production"

**Solution**: Add `SESSION_SECRET` to your `.env` file or environment variables.

### Issue: Players not reconnecting

**Solution**:
1. Check that reconnection window hasn't expired (60 seconds)
2. Verify server logs show "Stored state for disconnected player"
3. Check that room still exists (other player didn't leave)

## Testing Checklist

- [ ] Server starts without errors
- [ ] Can join game normally
- [ ] Reconnection UI appears on disconnect
- [ ] State recovers after reconnect
- [ ] Invalid player names are rejected
- [ ] Invalid movement directions are ignored
- [ ] Health endpoint returns metrics
- [ ] No memory leaks after multiple games
- [ ] Error messages are user-friendly
- [ ] Session persists across page reloads

## Performance Monitoring

### Check Active Connections

```javascript
// In browser console during game
console.log('Socket connected:', socket.connected);
console.log('Socket ID:', socket.id);
```

### Monitor Server Resources

```bash
# Check memory usage
node --expose-gc server.js

# In another terminal
curl http://localhost:3001/health
```

### Network Traffic

Open DevTools → Network → WS (WebSocket) tab to see:
- Reduced message frequency (optimized broadcasts)
- Proper error responses
- State recovery messages

## Production Deployment

### Environment Variables

Set these in your hosting platform:

```env
NODE_ENV=production
SESSION_SECRET=your-secure-secret-here
CORS_ORIGIN=https://yourdomain.com
PORT=3001
```

### Heroku Example

```bash
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGIN=https://yourapp.herokuapp.com
```

### Vercel/Netlify

Add environment variables in dashboard:
- `SESSION_SECRET`: (generate secure string)
- `NODE_ENV`: production
- `CORS_ORIGIN`: your domain

## Additional Resources

- Socket.IO v4 Docs: https://socket.io/docs/v4/
- Express 5 Docs: https://expressjs.com/
- Sequelize v6 Docs: https://sequelize.org/

## Support

If you encounter issues:
1. Check server console logs
2. Check browser console
3. Verify all files are in place
4. Test with `/health` endpoint
5. Review `FIXES_APPLIED.md` for details

All fixes are production-ready and follow industry best practices!
