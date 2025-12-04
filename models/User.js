const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const gameResultSchema = new mongoose.Schema({
  gameId: { type: String, required: true },
  gameMode: { type: String, enum: ['practice', 'multiplayer'], required: true },
  score: { type: Number, required: true },
  opponent: { type: String }, // opponent name for multiplayer games
  result: { type: String, enum: ['win', 'lose'], required: true },
  duration: { type: Number }, // game duration in seconds
  coinsCollected: { type: Number, default: 0 },
  enemiesHit: { type: Number, default: 0 },
  bombsHit: { type: Number, default: 0 },
  playedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // allows multiple null values
  },
  password: {
    type: String,
    minlength: 6
  },
  avatar: {
    type: String
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  
  // OAuth IDs
  googleId: String,
  githubId: String,
  
  // Game statistics
  stats: {
    totalGames: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalCoinsCollected: { type: Number, default: 0 },
    totalEnemiesHit: { type: Number, default: 0 },
    totalBombsHit: { type: Number, default: 0 },
    totalPlayTime: { type: Number, default: 0 } // in seconds
  },
  
  // Game history (last 50 games)
  gameHistory: [gameResultSchema],
  
  // User preferences
  preferences: {
    character: { type: String, default: 'Alex' },
    soundEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true },
    theme: { type: String, default: 'dark' }
  }
}, {
  timestamps: true
});

// Virtual for win rate
userSchema.virtual('winRate').get(function() {
  if (this.stats.totalGames === 0) return 0;
  return Math.round((this.stats.wins / this.stats.totalGames) * 100);
});

// Virtual for average score
userSchema.virtual('averageScore').get(function() {
  if (this.stats.totalGames === 0) return 0;
  return Math.round(this.stats.totalScore / this.stats.totalGames);
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Add game result method
userSchema.methods.addGameResult = async function(gameData) {
  const { gameId, gameMode, score, opponent, result, duration, coinsCollected, enemiesHit, bombsHit } = gameData;
  
  // Add to game history
  this.gameHistory.unshift({
    gameId,
    gameMode,
    score,
    opponent,
    result,
    duration,
    coinsCollected,
    enemiesHit,
    bombsHit
  });
  
  // Keep only last 50 games
  if (this.gameHistory.length > 50) {
    this.gameHistory = this.gameHistory.slice(0, 50);
  }
  
  // Update statistics
  this.stats.totalGames += 1;
  this.stats.totalScore += score;
  this.stats.totalCoinsCollected += coinsCollected || 0;
  this.stats.totalEnemiesHit += enemiesHit || 0;
  this.stats.totalBombsHit += bombsHit || 0;
  this.stats.totalPlayTime += duration || 0;
  
  if (score > this.stats.highestScore) {
    this.stats.highestScore = score;
  }
  
  if (result === 'win') {
    this.stats.wins += 1;
    this.stats.currentStreak += 1;
    if (this.stats.currentStreak > this.stats.longestStreak) {
      this.stats.longestStreak = this.stats.currentStreak;
    }
  } else {
    this.stats.losses += 1;
    this.stats.currentStreak = 0;
  }
  
  await this.save();
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = async function(type = 'highScore', limit = 10) {
  let sortField;
  
  switch (type) {
    case 'highScore':
      sortField = { 'stats.highestScore': -1 };
      break;
    case 'wins':
      sortField = { 'stats.wins': -1 };
      break;
    case 'winRate':
      sortField = { 'stats.wins': -1, 'stats.totalGames': -1 };
      break;
    case 'totalGames':
      sortField = { 'stats.totalGames': -1 };
      break;
    default:
      sortField = { 'stats.highestScore': -1 };
  }
  
  const users = await this.find({ isGuest: false })
    .select('username displayName avatar stats')
    .sort(sortField)
    .limit(limit);
  
  return users.map((user, index) => ({
    rank: index + 1,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    stats: user.stats,
    winRate: user.winRate,
    averageScore: user.averageScore
  }));
};

module.exports = mongoose.model('User', userSchema);