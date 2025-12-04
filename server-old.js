require('dotenv').config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport.js");
const authRoutes = require("./routes/auth");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'goldgrab_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/goldgrab',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production'
  }
});

// Share session with socket.io
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

// Socket.io authentication
io.use((socket, next) => {
  const session = socket.request.session;
  if (session && session.passport && session.passport.user) {
    // User is authenticated
    socket.userId = session.passport.user;
  }
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/goldgrab';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(sessionMiddleware);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use('/api/auth', authRoutes);

// Game API routes for saving game results
app.post('/api/game/result', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { gameId, gameMode, score, opponent, result, duration, coinsCollected, enemiesHit, bombsHit } = req.body;
    
    // Validate required fields
    if (!gameId || !gameMode || score === undefined || !result) {
      return res.status(400).json({ error: 'Missing required game data' });
    }

    // Add game result to user's history
    await req.user.addGameResult({
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

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving game result:', error);
    res.status(500).json({ error: 'Failed to save game result' });
  }
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Game rooms management
const gameRooms = new Map();
let nextRoomId = 1;

// Game room structure
function createGameRoom() {
  return {
    id: nextRoomId++,
    players: {},
    coins: [],
    bombs: [], // Separate bombs from coins
    enemies: [],
    mapWidth: 20,
    mapHeight: 15,
    gameStarted: false,
    maxPlayers: process.env.MAX_PLAYERS || 2,
    winningScore: process.env.WINNING_SCORE || 500,
    difficultyLevel: 1,
    totalPointsCollected: 0,
    difficultyThreshold: process.env.DIFFICULTY_THRESHOLD || 200,
    usedCharacters: new Set(), // Track which characters are in use in this room
  };
}

// Get an unused character for the room
function getUniqueCharacter(room) {
  const characterNames = ["Alex", "Bella", "Charlie", "Daisy"];
  const availableCharacters = characterNames.filter(
    (char) => !room.usedCharacters.has(char)
  );

  if (availableCharacters.length === 0) {
    // If all characters are used (shouldn't happen with 2 players), reset and start over
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
  
  // Only add bombs at difficulty level 2 and above
  if (room.difficultyLevel > 1) {
    // Add one bomb per difficulty level above 1, up to 5 bombs max
    const bombCount = Math.min(5, room.difficultyLevel - 1);
    console.log(`Generating ${bombCount} bombs at difficulty level ${room.difficultyLevel}`);

    for (let i = 0; i < bombCount; i++) {
      let x, y;
      let attempts = 0;
      
      // Try to place bomb in a position that doesn't overlap with coins or other bombs
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
  // Base number of enemies is 9, plus 2 more per difficulty level
  const enemyCount = 9 + (room.difficultyLevel - 1) * 2;
  console.log(
    `Generating ${enemyCount} enemies at difficulty level ${room.difficultyLevel}`
  );

  const enemies = [];
  for (let i = 0; i < enemyCount; i++) {
    // Make sure enemies are placed within bounds
    const x = Math.floor(Math.random() * (room.mapWidth - 4)) + 2; // Stay away from edges
    const y = Math.floor(Math.random() * (room.mapHeight - 4)) + 2;

    enemies.push({
      id: i,
      x: x,
      y: y,
      direction: Math.floor(Math.random() * 4), // 0: up, 1: right, 2: down, 3: left
      moveCounter: 0, // Counter for movement timing
      difficultyLevel: room.difficultyLevel,
    });
  }
  return enemies;
}

// Find or create available room
function findAvailableRoom() {
  // Look for a room with space
  for (let [roomId, room] of gameRooms) {
    if (
      Object.keys(room.players).length < room.maxPlayers &&
      !room.gameStarted
    ) {
      return room;
    }
  }

  // Create new room if none available
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
      // Increment move counter
      enemy.moveCounter = (enemy.moveCounter || 0) + 1;

      // Calculate movement frequency based on difficulty (enemies get faster)
      // Base speed: move every 3 ticks at level 1
      // Each difficulty level reduces the interval by 10%
      const baseInterval = 3;
      const speedMultiplier = 1 + (enemy.difficultyLevel - 1) * 0.1;
      const moveInterval = Math.max(
        1,
        Math.floor(baseInterval / speedMultiplier)
      );

      // Only move if it's time
      if (enemy.moveCounter % moveInterval !== 0) {
        return;
      }

      // Change direction randomly (less likely at higher difficulties)
      const directionChangeChance = 0.15;
      if (Math.random() < directionChangeChance) {
        enemy.direction = Math.floor(Math.random() * 4);
      }

      // Calculate new position
      let newX = enemy.x;
      let newY = enemy.y;

      switch (enemy.direction) {
        case 0:
          newY--;
          break; // up
        case 1:
          newX++;
          break; // right
        case 2:
          newY++;
          break; // down
        case 3:
          newX--;
          break; // left
      }

      // Bounds checking - ensure enemies stay within the play area
      if (
        newX >= 1 &&
        newX < room.mapWidth - 1 &&
        newY >= 1 &&
        newY < room.mapHeight - 1
      ) {
        // Safe to move
        enemy.x = newX;
        enemy.y = newY;
      } else {
        // Hit a wall, reverse direction
        enemy.direction = (enemy.direction + 2) % 4;
      }

      // Check for collisions with players in this room
      Object.values(room.players).forEach((player) => {
        if (player.x === enemy.x && player.y === enemy.y) {
          // Player hit enemy - lose points
          player.score = Math.max(0, player.score - 5);

          // Change mood to sad
          player.mood = "sad";
          player.lastMoodChange = Date.now();

          // Set player mood to sad
          player.mood = "sad";
          player.lastMoodChange = Date.now();

          // Respawn player
          player.x = Math.floor(Math.random() * (room.mapWidth - 2)) + 1;
          player.y = Math.floor(Math.random() * (room.mapHeight - 2)) + 1;

          // Notify player about hit
          io.to(player.id).emit("playerHit", {
            playerId: player.id,
            score: player.score,
            x: player.x,
            y: player.y,
          });

          // Broadcast complete game state to room
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
        }
      });
    });

    // Send complete game state update to room
    Object.keys(room.players).forEach((playerId) => {
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
      io.to(playerId).emit("gameStateUpdate", gameStateUpdate);
    });
  });
}, 200); // Faster update rate for smoother movement

// Socket handling
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);
  let playerRoom = null;

  // Handle join game request
  socket.on("joinGame", (playerName) => {
    console.log(`Player ${socket.id} attempting to join with name: ${playerName}`);
    
    // Check if player is already in a room
    if (playerRoom) {
      console.log(`Player ${socket.id} is already in room ${playerRoom.id}, ignoring join request`);
      return;
    }
    
    console.log(`Current rooms count: ${gameRooms.size}`);
    
    // Log existing rooms
    gameRooms.forEach((room, roomId) => {
      console.log(`Room ${roomId}: ${Object.keys(room.players).length} players, gameStarted: ${room.gameStarted}`);
    });

    // Find available room
    const room = findAvailableRoom();
    playerRoom = room;
    
    console.log(`Assigned to room ${room.id}, current players in room: ${Object.keys(room.players).length}`);

    // Get a unique character for this player
    const uniqueCharacter = getUniqueCharacter(room);

    // Create player with character
    room.players[socket.id] = {
      id: socket.id,
      name: playerName,
      x: Math.floor(Math.random() * (room.mapWidth - 2)) + 1,
      y: Math.floor(Math.random() * (room.mapHeight - 2)) + 1,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
      character: uniqueCharacter,
      direction: "right", // Initial direction
      mood: "happy", // Initial mood
      lastMoodChange: Date.now(), // Track when mood last changed
      score: 0,
    };

    // Check if we have enough players to start
    let playerCount = Object.keys(room.players).length;
    console.log(`Room ${room.id} player count after adding: ${playerCount}`);
    console.log(`Players in room ${room.id}:`, Object.keys(room.players));

    if (playerCount === 1) {
      // First player, wait for more
      console.log(`First player in room ${room.id}, waiting for opponent...`);
      socket.emit("waitingForOpponent");
    } else if (playerCount === 2) {
      // We have exactly 2 players, start the game for everyone in this room
      console.log(`Room ${room.id} starting with 2 players`);
      room.gameStarted = true;

      // Send game ready to both players in this room
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
    } else {
      console.log(`Unexpected player count in room ${room.id}: ${playerCount}`);
    }

    // Notify other players in the same room
    Object.keys(room.players).forEach((playerId) => {
      if (playerId !== socket.id) {
        io.to(playerId).emit("playerJoined", room.players[socket.id]);
      }
    });
  });

  // Handle movement
  socket.on("move", (direction) => {
    if (!playerRoom) return;
    const player = playerRoom.players[socket.id];
    if (!player) return;

    let newX = player.x;
    let newY = player.y;

    switch (direction) {
      case "up":
        newY--;
        break;
      case "down":
        newY++;
        break;
      case "left":
        newX--;
        player.direction = "left";
        break;
      case "right":
        newX++;
        player.direction = "right";
        break;
    }

    // Check bounds
    if (
      newX >= 1 &&
      newX < playerRoom.mapWidth - 1 &&
      newY >= 1 &&
      newY < playerRoom.mapHeight - 1
    ) {
      // Check for collision with other players
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

      // Only move if no collision with other players
      if (!collision) {
        player.x = newX;
        player.y = newY;

        // Check coin collection (only if player actually moved)
        const coin = playerRoom.coins.find(
          (c) => c.x === newX && c.y === newY && !c.collected
        );

        // Check bomb collision (separate from coins)
        const bomb = playerRoom.bombs.find(
          (b) => b.x === newX && b.y === newY && !b.exploded
        );

        if (coin) {
          // Normal coin collection - always gain points
          coin.collected = true;
          player.score += 10;
          playerRoom.totalPointsCollected += 10;

          // Change mood to happy
          player.mood = "happy";
          player.lastMoodChange = Date.now();

          // Notify player about coin collection
          socket.emit("coinCollected", {
            coinId: coin.id,
            playerId: socket.id,
            score: player.score
          });

          console.log(`Player ${player.name} collected coin ${coin.id}! Score: ${player.score}`);
        }

        if (bomb) {
          // Bomb explosion - lose points
          bomb.exploded = true;
          player.score = Math.max(0, player.score - 20);

          // Change mood to sad
          player.mood = "sad";
          player.lastMoodChange = Date.now();

          // Notify player about bomb
          socket.emit("bombHit", {
            playerId: socket.id,
            score: player.score,
            bombId: bomb.id,
            x: bomb.x,
            y: bomb.y
          });

          // Visual effect for other players
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

        // Only check difficulty increase and other logic if something was collected/hit
        if (coin || bomb) {
          // Check if difficulty should increase (only based on coins collected)
          const previousLevel = playerRoom.difficultyLevel;
          playerRoom.difficultyLevel =
            Math.floor(
              playerRoom.totalPointsCollected / playerRoom.difficultyThreshold
            ) + 1;

          // If difficulty level increased, update enemies
          if (playerRoom.difficultyLevel > previousLevel) {
            console.log(
              `Room ${playerRoom.id} difficulty increased to level ${playerRoom.difficultyLevel}`
            );

            // Update existing enemies with new difficulty level
            playerRoom.enemies.forEach((enemy) => {
              enemy.difficultyLevel = playerRoom.difficultyLevel;
            });

            // Add new enemies (2 per difficulty level increase)
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

            // Regenerate bombs with new difficulty level
            playerRoom.bombs = generateBombs(playerRoom);
            console.log(`Generated ${playerRoom.bombs.length} bombs for difficulty level ${playerRoom.difficultyLevel}`);

            // Notify players about difficulty increase
            Object.keys(playerRoom.players).forEach((playerId) => {
              io.to(playerId).emit("difficultyIncrease", {
                level: playerRoom.difficultyLevel,
                enemyCount: playerRoom.enemies.length,
              });
            });
          }

          // Send complete game state update to ALL players in room
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

          console.log(`Server: Broadcasting complete game state to all players in room ${playerRoom.id}`);
          Object.keys(playerRoom.players).forEach((playerId) => {
            io.to(playerId).emit("gameStateUpdate", gameStateUpdate);
          });



          // Check for winner
          if (player.score >= playerRoom.winningScore) {
            console.log(
              `Player ${player.name} (${socket.id}) won the game in room ${playerRoom.id}!`
            );

            // Notify all players about the winner
            Object.keys(playerRoom.players).forEach((playerId) => {
              io.to(playerId).emit("gameWon", {
                winnerId: socket.id,
                winnerName: player.name,
                winnerScore: player.score,
              });
            });
          }

          // Check if all coins collected
          if (playerRoom.coins.every((c) => c.collected)) {
            // Respawn coins and bombs
            playerRoom.coins = generateCoins(playerRoom);
            playerRoom.bombs = generateBombs(playerRoom);
            console.log(`Respawned ${playerRoom.coins.length} coins and ${playerRoom.bombs.length} bombs`);
            
            // Send complete game state update
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

        // Broadcast complete game state to ALL players in room
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
  }); // Close collision block and move handler

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    if (playerRoom) {
      // Remove the player's character from used characters
      const player = playerRoom.players[socket.id];
      if (player && player.character) {
        playerRoom.usedCharacters.delete(player.character);
      }
      delete playerRoom.players[socket.id];

      // Notify other players in room
      Object.keys(playerRoom.players).forEach((playerId) => {
        io.to(playerId).emit("playerLeft", socket.id);
      });

      // Clean up empty rooms
      if (Object.keys(playerRoom.players).length === 0) {
        gameRooms.delete(playerRoom.id);
        console.log(`Deleted empty room ${playerRoom.id}`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Game settings: Max Players: ${
      process.env.MAX_PLAYERS || 2
    }, Winning Score: ${process.env.WINNING_SCORE || 500}`
  );
});
