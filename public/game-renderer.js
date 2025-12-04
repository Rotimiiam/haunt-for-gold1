// Game Renderer - Handles all canvas drawing and map rendering
console.log("Game renderer script loaded");

class GameRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    
    // Set canvas dimensions
    this.canvas.width = 640;  // 20 tiles * 32px
    this.canvas.height = 480; // 15 tiles * 32px
    
    // Constants
    this.TILE_SIZE = 32;
    this.COLORS = {
      BACKGROUND: "#1a0a2e", // Haunted purple instead of black
      WALL: "#2d1b4e", // Deep purple walls
      PLAYER: "#00ff41",
      COIN: "#ffd700", // Cursed gold
      BOMB: "#ff0000",
      ENEMY: "#ff4444",
    };
    
    // Textures
    this.textures = {
      grass: new Image(),
      brick: new Image(),
      coin: new Image(),
      bomb: new Image(),
      snake: new Image(),
      snakeRed: new Image(),
      loaded: {
        grass: false,
        brick: false,
        coin: false,
        bomb: false,
        snake: false,
        snakeRed: false
      }
    };
    
    // SVG images for characters
    this.svgImages = {};
    
    // Current map configuration
    this.currentMap = null;
    
    this.loadTextures();
    this.preloadSVGImages();
    
    console.log("Game renderer initialized");
  }
  
  // Load textures
  loadTextures() {
    this.textures.grass.onload = () => { this.textures.loaded.grass = true; };
    this.textures.brick.onload = () => { this.textures.loaded.brick = true; };
    this.textures.coin.onload = () => { this.textures.loaded.coin = true; };
    this.textures.bomb.onload = () => { this.textures.loaded.bomb = true; };
    this.textures.snake.onload = () => { this.textures.loaded.snake = true; };
    this.textures.snakeRed.onload = () => { this.textures.loaded.snakeRed = true; };

    this.textures.grass.src = "assets/grass.png";
    this.textures.brick.src = "assets/brick.png";
    this.textures.coin.src = "assets/coin.png";
    this.textures.bomb.src = "assets/bomb.png";
    this.textures.snake.src = "assets/snake-r.png";
    this.textures.snakeRed.src = "assets/snake-re.png";
  }
  
  // Preload SVG images
  preloadSVGImages() {
    if (typeof characterData !== 'undefined') {
      Object.keys(characterData).forEach((character) => {
        this.svgImages[character] = {};
        Object.keys(characterData[character].svgs).forEach((state) => {
          const svgString = characterData[character].svgs[state];
          const img = new Image();
          const blob = new Blob([svgString], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          img.src = url;
          this.svgImages[character][state] = img;
        });
      });
    }
  }
  
  // Set the current map
  setMap(mapConfig) {
    this.currentMap = mapConfig;
  }
  
  // Main render function
  render(gameState) {
    if (!gameState) {
      return;
    }
    
    // Clear canvas and draw background
    this.drawBackground(gameState);
    
    // Draw map elements
    this.drawWalls(gameState);
    
    // Draw game objects
    this.drawCoins(gameState);
    this.drawBombs(gameState);
    this.drawEnemies(gameState);
    
    // Use enhanced multi-player rendering
    if (Object.keys(gameState.players).length > 1) {
      this.drawPlayersWithProximityHandling(gameState);
    } else {
      this.drawPlayers(gameState);
    }
  }
  
  // Draw background
  drawBackground(gameState) {
    // Draw spooky purple gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a0a2e'); // Haunted purple
    gradient.addColorStop(0.5, '#16213e'); // Midnight blue
    gradient.addColorStop(1, '#0d0d0d'); // Spooky black
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grass texture overlay if loaded
    if (this.textures.loaded.grass) {
      this.drawPixelRect(0, 0, this.canvas.width, this.canvas.height, this.textures.grass);
    }
    
    // Draw grid
    this.ctx.strokeStyle = "rgba(34, 34, 34, 0.3)";
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += this.TILE_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += this.TILE_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
  
  // Draw walls
  drawWalls(gameState) {
    this.ctx.fillStyle = this.COLORS.WALL;
    for (let x = 0; x < gameState.mapWidth; x++) {
      for (let y = 0; y < gameState.mapHeight; y++) {
        if (x === 0 || x === gameState.mapWidth - 1 || y === 0 || y === gameState.mapHeight - 1) {
          this.drawPixelRect(x * this.TILE_SIZE, y * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE, this.textures.brick);
        }
      }
    }
  }
  
  // Draw coins (only normal coins now)
  drawCoins(gameState) {
    if (!gameState.coins) return;
    
    // Only draw coins that are explicitly not collected
    const coinsToRender = gameState.coins.filter(coin => coin.collected !== true);
    
    coinsToRender.forEach((coin) => {
      const x = coin.x * this.TILE_SIZE;
      const y = coin.y * this.TILE_SIZE;
      
      // All coins are now normal coins
      this.drawPixelRect(x, y, this.TILE_SIZE, this.TILE_SIZE, this.textures.coin);
    });
  }
  
  // Draw bombs (separate from coins)
  drawBombs(gameState) {
    if (!gameState.bombs) return;
    
    // Only draw bombs that haven't exploded
    const bombsToRender = gameState.bombs.filter(bomb => bomb.exploded !== true);
    
    bombsToRender.forEach((bomb) => {
      const x = bomb.x * this.TILE_SIZE;
      const y = bomb.y * this.TILE_SIZE;
      
      this.drawPixelRect(x, y, this.TILE_SIZE, this.TILE_SIZE, this.textures.bomb);
    });
  }
  
  // Draw enemies
  drawEnemies(gameState) {
    gameState.enemies.forEach((enemy) => {
      const x = enemy.x * this.TILE_SIZE;
      const y = enemy.y * this.TILE_SIZE;
      
      // Use snake sprite if available, otherwise fallback to red rectangle
      if (this.textures.snake && this.textures.snake.complete) {
        this.drawPixelRect(x, y, this.TILE_SIZE, this.TILE_SIZE, this.textures.snake);
      } else {
        this.ctx.fillStyle = this.COLORS.ENEMY;
        this.ctx.fillRect(x + 4, y + 4, this.TILE_SIZE - 8, this.TILE_SIZE - 8);
      }
    });
  }
  
  // Draw players with enhanced multi-player rendering
  drawPlayers(gameState) {
    const players = Object.values(gameState.players);
    
    // Sort players by y-position for proper layering
    players.sort((a, b) => a.y - b.y);
    
    players.forEach((player, index) => {
      this.drawSinglePlayer(player, index, players.length);
    });
  }

  // Draw a single player with all visual enhancements
  drawSinglePlayer(player, playerIndex, totalPlayers) {
    const x = player.x * this.TILE_SIZE;
    const y = player.y * this.TILE_SIZE;

    // Draw player indicator background (glow effect)
    if (player.visualConfig?.indicator?.glowEffect) {
      this.drawPlayerGlow(x, y, player);
    }

    // Draw unique visual indicator shape
    this.drawPlayerIndicator(x, y, player, playerIndex);

    // Get the SVG for this character state
    const svgKey = `${player.direction}_${player.mood}`;
    const img = this.svgImages[player.character]?.[svgKey] || this.svgImages["Alex"]?.["right_happy"];

    // Draw the character with color overlay if needed
    if (img && img.complete) {
      this.ctx.drawImage(img, x, y, this.TILE_SIZE, this.TILE_SIZE);
      
      // Apply color tint for better player distinction
      if (player.color && player.color !== '#00ff41') {
        this.applyColorTint(x, y, player.color, 0.3);
      }
    } else {
      // Enhanced fallback with better visual distinction
      this.drawFallbackPlayer(x, y, player, playerIndex);
    }

    // Draw collision visual feedback if player was recently hit
    if (player.recentlyHit && Date.now() - player.lastHitTime < 1000) {
      this.drawCollisionFeedback(x, y, player);
    }

    // Draw player name tag
    this.drawPlayerNameTag(x, y, player, playerIndex);

    // Draw player score display
    this.drawPlayerScore(x, y, player, playerIndex);

    // Draw additional status indicators
    this.drawPlayerStatusIndicators(x, y, player);
  }

  // Draw player glow effect
  drawPlayerGlow(x, y, player) {
    const glowRadius = this.TILE_SIZE * 0.7;
    const gradient = this.ctx.createRadialGradient(
      x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2, 0,
      x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2, glowRadius
    );
    
    const glowColor = player.color || '#00ff41';
    gradient.addColorStop(0, `${glowColor}40`); // 25% opacity
    gradient.addColorStop(1, `${glowColor}00`); // 0% opacity
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - glowRadius/2, y - glowRadius/2, 
                     this.TILE_SIZE + glowRadius, this.TILE_SIZE + glowRadius);
  }

  // Draw unique visual indicator for each player with enhanced effects
  drawPlayerIndicator(x, y, player, playerIndex) {
    const baseSize = 8;
    const centerX = x + this.TILE_SIZE / 2;
    const centerY = y + this.TILE_SIZE - 4;
    
    // Get indicator shape from visual config or default
    const shape = player.visualConfig?.indicator?.shape || 
                  ['circle', 'square', 'triangle', 'star'][playerIndex % 4];
    
    const borderColor = player.visualConfig?.indicator?.borderColor || '#ffffff';
    const fillColor = player.color || '#00ff41';
    
    // Animate indicator based on player activity
    let indicatorSize = baseSize;
    if (player.isActive && player.lastMoveTime && Date.now() - player.lastMoveTime < 300) {
      const pulseTime = Date.now() - player.lastMoveTime;
      indicatorSize = baseSize + Math.sin(pulseTime / 50) * 2;
    }
    
    // Draw indicator shadow for depth
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.drawIndicatorShape(shape, centerX + 1, centerY + 1, indicatorSize, false);
    
    // Draw main indicator
    this.ctx.strokeStyle = borderColor;
    this.ctx.fillStyle = fillColor;
    this.ctx.lineWidth = 2;
    
    this.drawIndicatorShape(shape, centerX, centerY, indicatorSize, true);
    
    // Add special effects for different player states
    if (player.isLeader) {
      this.drawLeaderIndicator(centerX, centerY, indicatorSize);
    }
    
    if (player.powerUps && player.powerUps.length > 0) {
      this.drawPowerUpIndicator(centerX, centerY, indicatorSize);
    }
  }

  // Helper method to draw different indicator shapes
  drawIndicatorShape(shape, centerX, centerY, size, withStroke) {
    switch (shape) {
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, size / 2, 0, 2 * Math.PI);
        this.ctx.fill();
        if (withStroke) this.ctx.stroke();
        break;
        
      case 'square':
        this.ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);
        if (withStroke) this.ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
        break;
        
      case 'triangle':
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - size / 2);
        this.ctx.lineTo(centerX - size / 2, centerY + size / 2);
        this.ctx.lineTo(centerX + size / 2, centerY + size / 2);
        this.ctx.closePath();
        this.ctx.fill();
        if (withStroke) this.ctx.stroke();
        break;
        
      case 'star':
        this.drawStar(centerX, centerY, size / 2, 5);
        this.ctx.fill();
        if (withStroke) this.ctx.stroke();
        break;
        
      case 'diamond':
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - size / 2);
        this.ctx.lineTo(centerX + size / 2, centerY);
        this.ctx.lineTo(centerX, centerY + size / 2);
        this.ctx.lineTo(centerX - size / 2, centerY);
        this.ctx.closePath();
        this.ctx.fill();
        if (withStroke) this.ctx.stroke();
        break;
    }
  }

  // Draw leader indicator (crown effect)
  drawLeaderIndicator(centerX, centerY, size) {
    const crownSize = size * 0.6;
    this.ctx.fillStyle = '#ffd700';
    this.ctx.strokeStyle = '#ffaa00';
    this.ctx.lineWidth = 1;
    
    // Simple crown shape
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - crownSize, centerY - size / 2 - 3);
    this.ctx.lineTo(centerX - crownSize / 2, centerY - size / 2 - 6);
    this.ctx.lineTo(centerX, centerY - size / 2 - 8);
    this.ctx.lineTo(centerX + crownSize / 2, centerY - size / 2 - 6);
    this.ctx.lineTo(centerX + crownSize, centerY - size / 2 - 3);
    this.ctx.lineTo(centerX + crownSize, centerY - size / 2 - 1);
    this.ctx.lineTo(centerX - crownSize, centerY - size / 2 - 1);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  // Draw power-up indicator (sparkle effect)
  drawPowerUpIndicator(centerX, centerY, size) {
    const sparkleCount = 4;
    const sparkleRadius = size * 0.8;
    const time = Date.now() / 200;
    
    this.ctx.fillStyle = '#00ffff';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2 + time;
      const sparkleX = centerX + Math.cos(angle) * sparkleRadius;
      const sparkleY = centerY + Math.sin(angle) * sparkleRadius;
      
      this.ctx.beginPath();
      this.ctx.arc(sparkleX, sparkleY, 1.5, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.stroke();
    }
  }

  // Draw star shape
  drawStar(centerX, centerY, radius, points) {
    const angle = Math.PI / points;
    this.ctx.beginPath();
    
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.5;
      const x = centerX + Math.cos(i * angle - Math.PI / 2) * r;
      const y = centerY + Math.sin(i * angle - Math.PI / 2) * r;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
  }

  // Apply color tint to character sprite
  applyColorTint(x, y, color, opacity) {
    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.fillStyle = color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
    this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
    this.ctx.globalCompositeOperation = 'source-over';
  }

  // Enhanced fallback player rendering
  drawFallbackPlayer(x, y, player, playerIndex) {
    const playerColor = player.color || '#00ff41';
    
    // Draw main body
    this.ctx.fillStyle = playerColor;
    this.ctx.fillRect(x + 4, y + 4, this.TILE_SIZE - 8, this.TILE_SIZE - 8);
    
    // Draw border for better distinction
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 4, y + 4, this.TILE_SIZE - 8, this.TILE_SIZE - 8);
    
    // Draw player number in center
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText((playerIndex + 1).toString(), x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2 + 5);
  }

  // Draw collision visual feedback with enhanced effects
  drawCollisionFeedback(x, y, player) {
    const timeSinceHit = Date.now() - (player.lastHitTime || 0);
    const flashDuration = 1000; // 1 second
    const flashIntensity = Math.max(0, 1 - timeSinceHit / flashDuration);
    
    if (flashIntensity > 0) {
      // Multi-layered flash effect
      const flashAlpha = Math.floor(flashIntensity * 128);
      
      // Outer glow effect
      const glowRadius = this.TILE_SIZE * 0.8;
      const gradient = this.ctx.createRadialGradient(
        x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2, 0,
        x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2, glowRadius
      );
      gradient.addColorStop(0, `rgba(255, 0, 0, ${flashAlpha / 255})`);
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x - glowRadius/4, y - glowRadius/4, 
                       this.TILE_SIZE + glowRadius/2, this.TILE_SIZE + glowRadius/2);
      
      // Inner flash effect
      this.ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha / 255})`;
      this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
      
      // Damage indicator with better animation
      if (timeSinceHit < 800) {
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        const damageY = y - 15 - (timeSinceHit / 8); // Float upward
        const damageText = '-' + (player.lastDamage || 5);
        
        // Draw text outline for better visibility
        this.ctx.strokeText(damageText, x + this.TILE_SIZE / 2, damageY);
        this.ctx.fillText(damageText, x + this.TILE_SIZE / 2, damageY);
        
        // Add impact particles effect
        if (timeSinceHit < 300) {
          this.drawImpactParticles(x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2, timeSinceHit);
        }
      }
      
      // Screen shake effect for severe hits
      if (player.lastDamage >= 15 && timeSinceHit < 200) {
        const shakeIntensity = Math.max(0, 1 - timeSinceHit / 200);
        const shakeX = (Math.random() - 0.5) * 4 * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * 4 * shakeIntensity;
        this.ctx.translate(shakeX, shakeY);
        
        // Reset translation after this frame
        setTimeout(() => {
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }, 16);
      }
    }
  }

  // Draw impact particles for collision feedback
  drawImpactParticles(centerX, centerY, timeSinceHit) {
    const particleCount = 8;
    const maxRadius = 20;
    const progress = timeSinceHit / 300;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = progress * maxRadius;
      const particleX = centerX + Math.cos(angle) * distance;
      const particleY = centerY + Math.sin(angle) * distance;
      const alpha = Math.max(0, 1 - progress);
      
      this.ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(particleX, particleY, 2, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }

  // Draw player name tag with enhanced styling and animations
  drawPlayerNameTag(x, y, player, playerIndex) {
    const nameConfig = player.visualConfig?.nameTag || {
      visible: true,
      position: 'above',
      fontSize: 12,
      color: '#ffffff'
    };
    
    if (!nameConfig.visible) return;
    
    const name = player.name || `Player ${playerIndex + 1}`;
    const fontSize = nameConfig.fontSize || 12;
    
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    
    // Position calculation with dynamic adjustment for overlapping
    let nameX = x + this.TILE_SIZE / 2;
    let nameY;
    
    switch (nameConfig.position) {
      case 'above':
        nameY = y - 8;
        break;
      case 'below':
        nameY = y + this.TILE_SIZE + 20;
        break;
      case 'side':
        nameX = x + this.TILE_SIZE + 5;
        nameY = y + this.TILE_SIZE / 2;
        this.ctx.textAlign = 'left';
        break;
      default:
        nameY = y - 8;
    }
    
    // Adjust position if player recently scored (floating animation)
    if (player.recentScore && Date.now() - player.lastScoreTime < 2000) {
      const scoreTime = Date.now() - player.lastScoreTime;
      const floatOffset = Math.sin(scoreTime / 200) * 3;
      nameY += floatOffset;
    }
    
    // Draw name background with player color accent
    const textMetrics = this.ctx.measureText(name);
    const bgWidth = textMetrics.width + 12;
    const bgHeight = fontSize + 6;
    
    // Background with rounded corners effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(nameX - bgWidth / 2, nameY - fontSize - 2, bgWidth, bgHeight);
    
    // Player color accent border
    this.ctx.strokeStyle = player.color || '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(nameX - bgWidth / 2, nameY - fontSize - 2, bgWidth, bgHeight);
    
    // Add subtle glow effect for active player
    if (player.isActive && player.lastMoveTime && Date.now() - player.lastMoveTime < 500) {
      this.ctx.shadowColor = player.color || '#ffffff';
      this.ctx.shadowBlur = 8;
    }
    
    // Draw name text with outline for better visibility
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(name, nameX, nameY);
    
    this.ctx.fillStyle = nameConfig.color || '#ffffff';
    this.ctx.fillText(name, nameX, nameY);
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
    
    // Add player status indicators next to name
    this.drawPlayerStatusBadges(nameX + bgWidth / 2 + 5, nameY - fontSize / 2, player);
  }

  // Draw status badges next to player name
  drawPlayerStatusBadges(x, y, player) {
    let badgeX = x;
    const badgeSize = 12;
    
    // Leader badge (if highest score)
    if (player.isLeader) {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = `${badgeSize}px Arial`;
      this.ctx.fillText('👑', badgeX, y);
      badgeX += badgeSize + 2;
    }
    
    // Hot streak badge (multiple recent scores)
    if (player.hotStreak && player.hotStreak >= 3) {
      this.ctx.fillStyle = '#ff4500';
      this.ctx.font = `${badgeSize}px Arial`;
      this.ctx.fillText('🔥', badgeX, y);
      badgeX += badgeSize + 2;
    }
    
    // Power-up indicator
    if (player.powerUps && player.powerUps.length > 0) {
      this.ctx.fillStyle = '#00ffff';
      this.ctx.font = `${badgeSize}px Arial`;
      this.ctx.fillText('⚡', badgeX, y);
      badgeX += badgeSize + 2;
    }
  }

  // Draw player score with enhanced styling and animations
  drawPlayerScore(x, y, player, playerIndex) {
    const score = player.score || 0;
    const scoreColor = player.color || '#ffffff';
    
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    
    let scoreX = x + this.TILE_SIZE / 2;
    let scoreY = y + this.TILE_SIZE + 38;
    
    // Animate score changes
    if (player.recentScore && Date.now() - player.lastScoreTime < 1500) {
      const scoreTime = Date.now() - player.lastScoreTime;
      const pulseScale = 1 + Math.sin(scoreTime / 100) * 0.1;
      
      this.ctx.save();
      this.ctx.translate(scoreX, scoreY);
      this.ctx.scale(pulseScale, pulseScale);
      this.ctx.translate(-scoreX, -scoreY);
    }
    
    // Draw score background with gradient
    const scoreText = score.toString();
    const textMetrics = this.ctx.measureText(scoreText);
    const bgWidth = Math.max(textMetrics.width + 16, 40);
    const bgHeight = 22;
    
    // Create gradient background
    const gradient = this.ctx.createLinearGradient(
      scoreX - bgWidth / 2, scoreY - 16,
      scoreX - bgWidth / 2, scoreY + 6
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(40, 40, 40, 0.9)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(scoreX - bgWidth / 2, scoreY - 16, bgWidth, bgHeight);
    
    // Draw score border with player color
    this.ctx.strokeStyle = scoreColor;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(scoreX - bgWidth / 2, scoreY - 16, bgWidth, bgHeight);
    
    // Add inner highlight
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(scoreX - bgWidth / 2 + 1, scoreY - 15, bgWidth - 2, bgHeight - 2);
    
    // Draw score text with outline
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 4;
    this.ctx.strokeText(scoreText, scoreX, scoreY);
    
    this.ctx.fillStyle = scoreColor;
    this.ctx.fillText(scoreText, scoreX, scoreY);
    
    // Draw score change indicator
    if (player.recentScore && Date.now() - player.lastScoreTime < 1000) {
      const changeTime = Date.now() - player.lastScoreTime;
      const changeY = scoreY - 25 - (changeTime / 20);
      const changeAlpha = Math.max(0, 1 - changeTime / 1000);
      
      const changeText = player.recentScore > 0 ? `+${player.recentScore}` : player.recentScore.toString();
      const changeColor = player.recentScore > 0 ? '#00ff00' : '#ff0000';
      
      this.ctx.fillStyle = `${changeColor}${Math.floor(changeAlpha * 255).toString(16).padStart(2, '0')}`;
      this.ctx.font = 'bold 14px Arial';
      this.ctx.fillText(changeText, scoreX, changeY);
    }
    
    // Restore context if we applied transformations
    if (player.recentScore && Date.now() - player.lastScoreTime < 1500) {
      this.ctx.restore();
    }
    
    // Draw rank indicator
    this.drawPlayerRank(scoreX + bgWidth / 2 + 15, scoreY - 8, player, playerIndex);
  }

  // Draw player rank indicator
  drawPlayerRank(x, y, player, playerIndex) {
    if (!player.rank || player.rank > 4) return;
    
    const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#4a4a4a'];
    const rankSymbols = ['1st', '2nd', '3rd', '4th'];
    
    const rankColor = rankColors[player.rank - 1] || '#666666';
    const rankText = rankSymbols[player.rank - 1] || `${player.rank}th`;
    
    // Draw rank background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.font = 'bold 10px Arial';
    const rankMetrics = this.ctx.measureText(rankText);
    const rankBgWidth = rankMetrics.width + 8;
    const rankBgHeight = 14;
    
    this.ctx.fillRect(x - rankBgWidth / 2, y - 10, rankBgWidth, rankBgHeight);
    
    // Draw rank border
    this.ctx.strokeStyle = rankColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - rankBgWidth / 2, y - 10, rankBgWidth, rankBgHeight);
    
    // Draw rank text
    this.ctx.fillStyle = rankColor;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(rankText, x, y);
  }

  // Draw additional status indicators
  drawPlayerStatusIndicators(x, y, player) {
    let indicatorY = y - 20;
    
    // Active/inactive indicator
    if (!player.isActive) {
      this.ctx.fillStyle = 'rgba(128, 128, 128, 0.8)';
      this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
      
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('INACTIVE', x + this.TILE_SIZE / 2, indicatorY);
      indicatorY -= 12;
    }
    
    // Power-up indicators (if any)
    if (player.powerUps && player.powerUps.length > 0) {
      player.powerUps.forEach((powerUp, index) => {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚡', x + this.TILE_SIZE / 2 + (index * 8), indicatorY);
      });
    }
  }

  // Enhanced method to handle close-proximity players
  drawPlayersWithProximityHandling(gameState) {
    const players = Object.values(gameState.players);
    const proximityThreshold = 1.5; // tiles
    
    // Group players by proximity
    const proximityGroups = this.groupPlayersByProximity(players, proximityThreshold);
    
    proximityGroups.forEach(group => {
      if (group.length > 1) {
        // Handle overlapping players
        this.drawOverlappingPlayers(group);
      } else {
        // Draw single player normally
        this.drawSinglePlayer(group[0], 0, 1);
      }
    });
  }

  // Group players by proximity
  groupPlayersByProximity(players, threshold) {
    const groups = [];
    const processed = new Set();
    
    players.forEach(player => {
      if (processed.has(player.id)) return;
      
      const group = [player];
      processed.add(player.id);
      
      players.forEach(otherPlayer => {
        if (processed.has(otherPlayer.id)) return;
        
        const distance = Math.sqrt(
          Math.pow(player.x - otherPlayer.x, 2) + 
          Math.pow(player.y - otherPlayer.y, 2)
        );
        
        if (distance <= threshold) {
          group.push(otherPlayer);
          processed.add(otherPlayer.id);
        }
      });
      
      groups.push(group);
    });
    
    return groups;
  }

  // Draw overlapping players with offset
  drawOverlappingPlayers(players) {
    const baseX = players[0].x * this.TILE_SIZE;
    const baseY = players[0].y * this.TILE_SIZE;
    const offsetStep = 8;
    
    players.forEach((player, index) => {
      const offsetX = (index % 2) * offsetStep;
      const offsetY = Math.floor(index / 2) * offsetStep;
      
      // Temporarily modify player position for rendering
      const originalX = player.x;
      const originalY = player.y;
      
      player.x = (baseX + offsetX) / this.TILE_SIZE;
      player.y = (baseY + offsetY) / this.TILE_SIZE;
      
      this.drawSinglePlayer(player, index, players.length);
      
      // Restore original position
      player.x = originalX;
      player.y = originalY;
    });
  }
  
  // Draw pixel rectangle with texture
  drawPixelRect(x, y, width, height, texture) {
    if (texture && texture.complete) {
      this.ctx.drawImage(texture, x, y, width, height);
    } else {
      this.ctx.fillRect(x, y, width, height);
    }
  }
  
  // Show explosion effect
  showExplosion(x, y) {
    const explosionX = x * this.TILE_SIZE;
    const explosionY = y * this.TILE_SIZE;
    
    this.ctx.fillStyle = "orange";
    this.ctx.beginPath();
    this.ctx.arc(explosionX + this.TILE_SIZE/2, explosionY + this.TILE_SIZE/2, this.TILE_SIZE, 0, 2 * Math.PI);
    this.ctx.fill();
    
    setTimeout(() => {
      // Re-render after explosion
      if (window.gameState) {
        this.render(window.gameState);
      }
    }, 200);
  }
}

// Global renderer instance
window.gameRenderer = null;

// Initialize renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gameCanvas')) {
    window.gameRenderer = new GameRenderer('gameCanvas');
  }
});

console.log("Game renderer ready");