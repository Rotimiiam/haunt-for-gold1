require('dotenv').config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const sequelize = require("./config/database");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);

// Import utility modules
const { wrapSocketHandler, validateSocketData } = require("./utils/socket-error-handler");
const { cleanupRoom, safeDeleteRoom } = require("./utils/room-cleanup");
const ReconnectionManager = require("./utils/reconnection-manager");

const app = express();
const server = http.createServer(app);

// Socket.IO configuration with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Session store using SQLite
const sessionStore = new SequelizeStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
  expiration: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Validate session secret in production
if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'change_this_to_a_random_string')) {
  console.error('ERROR: SESSION_SECRET must be set in production');
  process.exit(1);
}

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'goldgrab_secret_key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // XSS protection
    sameSite: 'lax' // CSRF protection
  }
});

// Share session with socket.io
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

// Connect to SQLite database
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite connected successfully');
    
    // Sync models
    await sequelize.sync();
    console.log('Models synced');
    
    // Sync session store
    await sessionStore.sync();
    console.log('Session store synced');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint with metrics
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    uptime: process.uptime(),
    activeRooms: gameRooms.size,
    queueSize: Array.from(gameRooms.values()).filter(r => !r.gameStarted).length
  });
});

// Game rooms management
const gameRooms = new Map();
let nextRoomId = 1;

// Initialize reconnection manager
const reconnectionManager = new ReconnectionManager();

// Game room structure
function createGameRoom() {
  return {
    id: nextRoomId++,
    players: {},
    coins: [],
    bombs: [],
    enemies: [],
    mapWidth: 20,
    mapHeight: 15,
    gameStarted: false,
    maxPlayers: parseInt(process.env.MAX_PLAYERS) || 2,
    winningScore: parseInt(process.env.WINNING_SCORE) || 500,
    difficultyLevel: 1,
    totalPointsCollected: 0,
    difficultyThreshold: parseInt(process.env.DIFFICULTY_THRESHOLD) || 200,
    usedCharacters: new Set(),
    timers: [] // Track timers for cleanup
  };
}

// Get an unused character for the room
function getUniqueCharacter(room) {
  const characterNames = ["Alex", "Bella", "Charlie", "Daisy"];
  const availableCharacters = characterNames.filter(
    (char) => !room.usedCharacters.has(char)
  );

  if (availableCharacters.length === 0) {
    room.usedCharacters.clear();
    return characterNames[0];
  }

  const character =
    availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
  room.usedCharacters.add(character);
  return character;
}

// Generate coins for a room
function generateCoins(room) {
  const coins = [];
  for (let i = 0; i < 15; i++) {
    coins.push({
      id: i,
      x: Math.floor(Math.random() * (room.mapWidth - 2)) + 1,
      y: Math.floor(Math.random() * (room.mapHeight - 2)) + 1,
      collected: false
    });
  }
  return coins;
}

// Generate bombs for a room based on difficulty level
function generateBombs(room) {
  const bombs = [];
  
  if (room.difficultyLevel > 1) {
    const bombCount = Math.min(5, room.difficultyLevel - 1);
    console.log(`Generating ${bombCount} bombs at difficulty level ${room.difficultyLevel}`);

    for (let i = 0; i < bombCount; i++) {
      let x, y;
      let attempts = 0;
      
      do {
        x = Math.floor(Math.random() * (room.mapWidth - 2)) + 1;
        y = Math.floor(Math.random() * (room.mapHeight - 2)) + 1;
        attempts++;
      } while (attempts < 10 && (
        room.coins.some(coin => coin.x === x && coin.y === y) ||
        bombs.some(bomb => bomb.x === x && bomb.y === y)
      ));

      bombs.push({
        id: i,
        x: x,
        y: y,
        exploded: false
      });
    }
  }
  
  return bombs;
}

// Generate enemies for a room
function generateEnemies(room) {
  const enemyCount = 9 + (room.difficultyLevel - 1) * 2;
  console.log(`Generating ${enemyCount} enemies at difficulty level ${room.difficultyLevel}`);

  const enemies = [];
  for (let i = 0; i < enemyCount; i++) {
    const x = Math.floor(Math.random() * (room.mapWidth - 4)) + 2;
    const y = Math.floor(Math.random() * (room.mapHeight - 4)) + 2;

    enemies.push({
      id: i,
      x: x,
      y: y,
      direction: Math.floor(Math.random() * 4),
      moveCounter: 0,
      difficultyLevel: room.difficultyLevel,
    });
  }
  return enemies;
}

// Find or create available room
function findAvailableRoom() {
  for (const [roomId, room] of gameRooms) {
    if (
      Object.keys(room.players).length < room.maxPlayers &&
      !room.gameStarted
    ) {
      return room;
    }
  }

  const newRoom = createGameRoom();
  newRoom.coins = generateCoins(newRoom);
  newRoom.bombs = generateBombs(newRoom);
  newRoom.enemies = generateEnemies(newRoom);
  gameRooms.set(newRoom.id, newRoom);
  console.log(`Created new game room ${newRoom.id}`);
  return newRoom;
}

// Move enemies periodically for all rooms
setInterval(() => {
  gameRooms.forEach((room, roomId) => {
    if (!room.gameStarted) return;

    room.enemies.forEach((enemy) => {
      enemy.moveCounter = (enemy.moveCounter || 0) + 1;

      const baseInterval = 3;
      const speedMultiplier = 1 + (enemy.difficultyLevel - 1) * 0.1;
      const moveInterval = Math.max(1, Math.floor(baseInterval / speedMultiplier));

      if (enemy.moveCounter % moveInterval !== 0) {
        return;
      }

      const directionChangeChance = 0.15;
      if (Math.random() < directionChangeChance) {
        enemy.direction = Math.floor(Math.random() * 4);
      }

      let newX = enemy.x;
      let newY = enemy.y;

      switch (enemy.direction) {
        case 0: newY--; break;
        case 1: newX++; break;
        case 2: newY++; break;
        case 3: newX--; break;
      }

      if (
        newX >= 1 &&
        newX < room.mapWidth - 1 &&
        newY >= 1 &&
        newY < room.mapHeight - 1
      ) {
        enemy.x = newX;
        enemy.y = newY;
      } else {
        enemy.direction = (enemy.direction + 2) % 4;
      }

      Object.values(room.players).forEach((player) => {
        if (player.x === enemy.x && player.y === enemy.y) {
          player.score = Math.max(0, player.score - 5);
          player.mood = "sad";
          player.lastMoodChange = Date.now();
          player.x = Math.floor(Math.random() * (room.mapWidth - 2)) + 1;
          player.y = Math.floor(Math.random() * (room.mapHeight - 2)) + 1;

          io.to(player.id).emit("playerHit", {
            playerId: player.id,
            score: player.score,
            x: player.x,
            y: player.y,
          });
        }
      });
    });

    // Single broadcast per room
    const gameStateUpdate = {
      players: room.players,
      coins: room.coins,
      bombs: room.bombs,
      enemies: room.enemies,
      mapWidth: room.mapWidth,
      mapHeight: room.mapHeight,
      difficultyLevel: room.difficultyLevel,
      winningScore: room.winningScore
    };

    Object.keys(room.players).forEach((playerId) => {
      io.to(playerId).emit("gameStateUpdate", gameStateUpdate);
    });
  });
}, 200);

// Socket handling
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);
  let playerRoom = null;

  // Handle join game request with validation
  socket.on("joinGame", wrapSocketHandler(function(playerName) {
    // Validate player name
    const validation = validateSocketData({ playerName }, {
      playerName: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9_\s]+$/
      }
    });

    if (!validation.valid) {
      socket.emit('joinError', { message: validation.errors.join(', ') });
      return;
    }

    console.log(`Player ${socket.id} attempting to join with name: ${playerName}`);
    
    if (playerRoom) {
      console.log(`Player ${socket.id} is already in room ${playerRoom.id}`);
      return;
    }

    const room = findAvailableRoom();
    playerRoom = room;
    
    console.log(`Assigned to room ${room.id}, current players: ${Object.keys(room.players).length}`);

    const uniqueCharacter = getUniqueCharacter(room);

    room.players[socket.id] = {
      id: socket.id,
      name: playerName,
      x: Math.floor(Math.random() * (room.mapWidth - 2)) + 1,
      y: Math.floor(Math.random() * (room.mapHeight - 2)) + 1,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
      character: uniqueCharacter,
      direction: "right",
      mood: "happy",
      lastMoodChange: Date.now(),
      score: 0,
    };

    const playerCount = Object.keys(room.players).length;
    console.log(`Room ${room.id} player count: ${playerCount}`);

    if (playerCount === 1) {
      console.log(`First player in room ${room.id}, waiting for opponent...`);
      socket.emit("waitingForOpponent");
    } else if (playerCount === 2) {
      console.log(`Room ${room.id} starting with 2 players`);
      room.gameStarted = true;

      Object.keys(room.players).forEach((playerId) => {
        console.log(`Sending gameReady to player ${playerId}`);
        io.to(playerId).emit("gameReady", {
          players: room.players,
          coins: room.coins,
          bombs: room.bombs,
          enemies: room.enemies,
          mapWidth: room.mapWidth,
          mapHeight: room.mapHeight,
          difficultyLevel: room.difficultyLevel,
          winningScore: room.winningScore,
        });
      });
    }

    Object.keys(room.players).forEach((playerId) => {
      if (playerId !== socket.id) {
        io.to(playerId).emit("playerJoined", room.players[socket.id]);
      }
    });
  }));

  // Handle movement with validation
  socket.on("move", wrapSocketHandler(function(direction) {
    // Validate direction
    const validDirections = ['up', 'down', 'left', 'right'];
    if (!validDirections.includes(direction)) {
      return; // Silently ignore invalid directions
    }

    if (!playerRoom) return;
    const player = playerRoom.players[socket.id];
    if (!player) return;

    let newX = player.x;
    let newY = player.y;

    switch (direction) {
      case "up": newY--; break;
      case "down": newY++; break;
      case "left":
        newX--;
        player.direction = "left";
        break;
      case "right":
        newX++;
        player.direction = "right";
        break;
    }

    if (
      newX >= 1 &&
      newX < playerRoom.mapWidth - 1 &&
      newY >= 1 &&
      newY < playerRoom.mapHeight - 1
    ) {
      let collision = false;
      Object.values(playerRoom.players).forEach((otherPlayer) => {
        if (
          otherPlayer.id !== socket.id &&
          otherPlayer.x === newX &&
          otherPlayer.y === newY
        ) {
          collision = true;
        }
      });

      if (!collision) {
        player.x = newX;
        player.y = newY;

        const coin = playerRoom.coins.find(
          (c) => c.x === newX && c.y === newY && !c.collected
        );

        const bomb = playerRoom.bombs.find(
          (b) => b.x === newX && b.y === newY && !b.exploded
        );

        if (coin) {
          coin.collected = true;
          player.score += 10;
          playerRoom.totalPointsCollected += 10;
          player.mood = "happy";
          player.lastMoodChange = Date.now();

          socket.emit("coinCollected", {
            coinId: coin.id,
            playerId: socket.id,
            score: player.score
          });

          console.log(`Player ${player.name} collected coin ${coin.id}! Score: ${player.score}`);
        }

        if (bomb) {
          bomb.exploded = true;
          player.score = Math.max(0, player.score - 20);
          player.mood = "sad";
          player.lastMoodChange = Date.now();

          socket.emit("bombHit", {
            playerId: socket.id,
            score: player.score,
            bombId: bomb.id,
            x: bomb.x,
            y: bomb.y
          });

          Object.keys(playerRoom.players).forEach((playerId) => {
            if (playerId !== socket.id) {
              io.to(playerId).emit("bombExploded", {
                bombId: bomb.id,
                x: bomb.x,
                y: bomb.y,
                playerId: socket.id
              });
            }
          });

          console.log(`Player ${player.name} hit bomb ${bomb.id}! Score: ${player.score}`);
        }

        if (coin || bomb) {
          const previousLevel = playerRoom.difficultyLevel;
          playerRoom.difficultyLevel =
            Math.floor(
              playerRoom.totalPointsCollected / playerRoom.difficultyThreshold
            ) + 1;

          if (playerRoom.difficultyLevel > previousLevel) {
            console.log(`Room ${playerRoom.id} difficulty increased to level ${playerRoom.difficultyLevel}`);

            playerRoom.enemies.forEach((enemy) => {
              enemy.difficultyLevel = playerRoom.difficultyLevel;
            });

            const newEnemiesCount = 2;
            const currentEnemyCount = playerRoom.enemies.length;

            for (let i = 0; i < newEnemiesCount; i++) {
              playerRoom.enemies.push({
                id: currentEnemyCount + i,
                x: Math.floor(Math.random() * (playerRoom.mapWidth - 4)) + 2,
                y: Math.floor(Math.random() * (playerRoom.mapHeight - 4)) + 2,
                direction: Math.floor(Math.random() * 4),
                difficultyLevel: playerRoom.difficultyLevel,
              });
            }

            playerRoom.bombs = generateBombs(playerRoom);
            console.log(`Generated ${playerRoom.bombs.length} bombs for difficulty level ${playerRoom.difficultyLevel}`);

            Object.keys(playerRoom.players).forEach((playerId) => {
              io.to(playerId).emit("difficultyIncrease", {
                level: playerRoom.difficultyLevel,
                enemyCount: playerRoom.enemies.length,
              });
            });
          }

          if (player.score >= playerRoom.winningScore) {
            console.log(`Player ${player.name} (${socket.id}) won the game in room ${playerRoom.id}!`);

            Object.keys(playerRoom.players).forEach((playerId) => {
              io.to(playerId).emit("gameWon", {
                winnerId: socket.id,
                winnerName: player.name,
                winnerScore: player.score,
              });
            });
          }

          if (playerRoom.coins.every((c) => c.collected)) {
            playerRoom.coins = generateCoins(playerRoom);
            playerRoom.bombs = generateBombs(playerRoom);
            console.log(`Respawned ${playerRoom.coins.length} coins and ${playerRoom.bombs.length} bombs`);
          }
        }

        // Single broadcast per move
        const gameStateUpdate = {
          players: playerRoom.players,
          coins: playerRoom.coins,
          bombs: playerRoom.bombs,
          enemies: playerRoom.enemies,
          mapWidth: playerRoom.mapWidth,
          mapHeight: playerRoom.mapHeight,
          difficultyLevel: playerRoom.difficultyLevel,
          winningScore: playerRoom.winningScore
        };

        Object.keys(playerRoom.players).forEach((playerId) => {
          io.to(playerId).emit("gameStateUpdate", gameStateUpdate);
        });
      }
    }
  }));

  // Handle state recovery request
  socket.on('requestStateRecovery', wrapSocketHandler(function(callback) {
    const storedData = reconnectionManager.getDisconnectedPlayer(socket.id);
    
    if (storedData && storedData.roomData) {
      const room = gameRooms.get(storedData.roomData.id);
      
      if (room) {
        // Restore player to room
        room.players[socket.id] = storedData.playerData;
        playerRoom = room;
        
        reconnectionManager.clearDisconnectedPlayer(socket.id);
        
        if (typeof callback === 'function') {
          callback({
            status: 'OK',
            gameState: {
              players: room.players,
              coins: room.coins,
              bombs: room.bombs,
              enemies: room.enemies,
              mapWidth: room.mapWidth,
              mapHeight: room.mapHeight,
              difficultyLevel: room.difficultyLevel,
              winningScore: room.winningScore
            }
          });
        }
        
        console.log(`Player ${socket.id} reconnected to room ${room.id}`);
        return;
      }
    }
    
    if (typeof callback === 'function') {
      callback({ status: 'NOT_FOUND' });
    }
  }));

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    if (playerRoom) {
      const player = playerRoom.players[socket.id];
      
      // Store player state for reconnection
      if (player) {
        reconnectionManager.storeDisconnectedPlayer(socket.id, player, {
          id: playerRoom.id
        });
        
        if (player.character) {
          playerRoom.usedCharacters.delete(player.character);
        }
      }
      
      delete playerRoom.players[socket.id];

      Object.keys(playerRoom.players).forEach((playerId) => {
        io.to(playerId).emit("playerLeft", socket.id);
      });

      if (Object.keys(playerRoom.players).length === 0) {
        safeDeleteRoom(gameRooms, playerRoom.id);
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Game settings: Max Players: ${process.env.MAX_PLAYERS || 2}, Winning Score: ${process.env.WINNING_SCORE || 500}`);
});
