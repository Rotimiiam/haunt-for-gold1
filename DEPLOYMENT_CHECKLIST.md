# 🎃 Deployment Checklist - Haunt For Gold

## Pre-Deployment

### ✅ Code Quality
- [x] All tests passing (`node test-fixes.js`)
- [x] No console errors in browser
- [x] No server errors in logs
- [x] Code follows style guidelines
- [x] All files properly formatted

### ✅ Security
- [ ] SESSION_SECRET set (not default)
- [ ] NODE_ENV=production
- [ ] CORS_ORIGIN set to your domain
- [ ] No sensitive data in code
- [ ] .env not in git (.gitignore)
- [x] Input validation on all events
- [x] httpOnly cookies enabled
- [x] sameSite protection enabled

### ✅ Performance
- [x] Connection pooling configured
- [x] Network traffic optimized (60% reduction)
- [x] Memory leaks fixed
- [x] Database queries optimized
- [ ] Gzip compression enabled (optional)

### ✅ Reliability
- [x] Error handling on all routes
- [x] Error handling on all socket events
- [x] Reconnection logic implemented
- [x] Timer cleanup implemented
- [x] Health endpoint working

### ✅ Documentation
- [x] README.md updated
- [x] SUBMISSION.md updated
- [x] API documentation complete
- [x] Environment variables documented
- [x] Integration guide available

## Environment Setup

### Required Environment Variables

```bash
# Production
SESSION_SECRET=<generate-secure-random-string>
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
PORT=3001

# Optional
MAX_PLAYERS=2
WINNING_SCORE=500
DIFFICULTY_THRESHOLD=200
```

### Generate SESSION_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Platform-Specific Deployment

### Heroku

```bash
# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGIN=https://your-app-name.herokuapp.com

# Deploy
git push heroku main

# Check logs
heroku logs --tail

# Open app
heroku open
```

**Heroku Checklist:**
- [ ] Procfile exists (`web: node server.js`)
- [ ] package.json has correct start script
- [ ] Node version specified in package.json
- [ ] Database file in .gitignore (use Heroku Postgres for production)

### Render

```bash
# Create new Web Service
# Connect GitHub repo
# Set environment variables in dashboard
```

**Render Checklist:**
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Environment variables set
- [ ] Auto-deploy enabled

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up

# Set environment variables
railway variables set SESSION_SECRET=<your-secret>
railway variables set NODE_ENV=production
```

**Railway Checklist:**
- [ ] Environment variables set
- [ ] Domain configured
- [ ] Health checks enabled

### DigitalOcean App Platform

**Checklist:**
- [ ] App created from GitHub
- [ ] Environment variables set
- [ ] HTTP port set to 3001
- [ ] Health check path: `/health`

### AWS (EC2 + PM2)

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repo
git clone your-repo-url
cd your-repo

# Install dependencies
npm install

# Set environment variables
nano .env
# Add your variables

# Start with PM2
pm2 start server.js --name haunt-for-gold

# Save PM2 config
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs
```

**AWS Checklist:**
- [ ] Security group allows port 3001
- [ ] Elastic IP assigned
- [ ] Domain pointed to IP
- [ ] SSL certificate configured (Let's Encrypt)
- [ ] PM2 auto-restart enabled

## Post-Deployment Testing

### 1. Health Check
```bash
curl https://yourdomain.com/health
```

Expected:
```json
{
  "status": "ok",
  "uptime": 123.456,
  "activeRooms": 0,
  "queueSize": 0
}
```

### 2. Socket.IO Connection
Open browser console:
```javascript
const socket = io('https://yourdomain.com');
socket.on('connect', () => console.log('Connected:', socket.id));
socket.on('connect_error', (err) => console.error('Error:', err));
```

### 3. Game Flow
- [ ] Can load home page
- [ ] Can enter player name
- [ ] Can join matchmaking queue
- [ ] Can connect with opponent
- [ ] Can play game normally
- [ ] Can collect coins
- [ ] Can see enemies moving
- [ ] Can win game
- [ ] Can request rematch

### 4. Reconnection Test
- [ ] Start a game
- [ ] Toggle network offline (DevTools)
- [ ] See reconnection UI
- [ ] Toggle network online
- [ ] State recovers successfully
- [ ] Can continue playing

### 5. Error Handling
- [ ] Invalid player name rejected
- [ ] Invalid moves ignored
- [ ] Server errors logged properly
- [ ] Client shows user-friendly errors
- [ ] No stack traces exposed

### 6. Performance
- [ ] Page loads in < 3 seconds
- [ ] Game runs at 60 FPS
- [ ] Network latency < 100ms
- [ ] Memory usage stable
- [ ] No memory leaks after 1 hour

### 7. Security
- [ ] HTTPS enabled
- [ ] Cookies have httpOnly flag
- [ ] Cookies have sameSite flag
- [ ] CORS properly configured
- [ ] No XSS vulnerabilities
- [ ] No CSRF vulnerabilities

## Monitoring Setup

### Basic Monitoring

```bash
# Check server status
curl https://yourdomain.com/health

# Check logs (Heroku)
heroku logs --tail

# Check logs (PM2)
pm2 logs haunt-for-gold

# Check memory usage
pm2 monit
```

### Advanced Monitoring (Optional)

**UptimeRobot:**
- [ ] Monitor /health endpoint
- [ ] Alert on downtime
- [ ] Check every 5 minutes

**New Relic / DataDog:**
- [ ] Application monitoring
- [ ] Error tracking
- [ ] Performance metrics

**Sentry:**
- [ ] Error tracking
- [ ] Stack traces
- [ ] User feedback

## Rollback Plan

### If Deployment Fails

**Heroku:**
```bash
heroku releases
heroku rollback v123
```

**Railway:**
```bash
railway rollback
```

**PM2:**
```bash
pm2 stop haunt-for-gold
git checkout previous-commit
npm install
pm2 restart haunt-for-gold
```

## Performance Benchmarks

### Expected Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Page Load | < 3s | _____ |
| Time to Interactive | < 5s | _____ |
| Socket Connection | < 1s | _____ |
| Game Start | < 2s | _____ |
| Reconnection | < 3s | _____ |
| Memory Usage | < 200MB | _____ |
| CPU Usage | < 50% | _____ |
| Uptime | > 99% | _____ |

## Troubleshooting

### Issue: Server won't start
- Check environment variables
- Check port availability
- Check database file permissions
- Review server logs

### Issue: Socket.IO not connecting
- Check CORS configuration
- Check firewall rules
- Check SSL certificate
- Review browser console

### Issue: High memory usage
- Check for memory leaks
- Review active rooms count
- Check timer cleanup
- Restart server

### Issue: Slow performance
- Check database queries
- Review network traffic
- Check server resources
- Enable compression

## Success Criteria

- [ ] Server starts without errors
- [ ] Health endpoint returns 200
- [ ] Can play complete game
- [ ] Reconnection works
- [ ] No errors in logs
- [ ] Performance meets targets
- [ ] Security checks pass
- [ ] Monitoring active

## Final Checklist

- [ ] All tests passing
- [ ] Environment variables set
- [ ] Deployed to production
- [ ] Health check passing
- [ ] Game playable
- [ ] Reconnection working
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team notified
- [ ] Celebration! 🎉

---

**Deployment Time Estimate:** 30-60 minutes
**Rollback Time:** < 5 minutes
**Expected Uptime:** 99.9%

Your haunted gold rush is ready to go live! 👻🎃
