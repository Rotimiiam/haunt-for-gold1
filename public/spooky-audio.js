/**
 * Spooky Audio Manager
 * Manages atmospheric Halloween sounds and music for Haunt For Gold
 */

class SpookyAudioManager {
  constructor() {
    this.sounds = {};
    this.currentAmbient = null;
    this.isMuted = this.loadMutePreference();
    this.volume = this.loadVolumePreference();
    this.initialized = false;
    
    // Sound paths (will work with existing sounds or fallback gracefully)
    this.soundPaths = {
      ambient: '/sounds/halloween-background-music-405067.mp3',
      ambientAlt: '/sounds/Haunted House.mpga',
      coinCollect: '/sounds/ui/click3.wav',
      coinMystical: '/sounds/ui/switch15.wav',
      bombExplode: '/sounds/zapsplat_explosion_short_airy_large_002_92191.mp3',
      bombGhostly: '/sounds/witch-cackle.mp4a',
      victory: '/sounds/8-bit-video-game-background-music-loop-wood-368532.mp3',
      victoryEerie: '/sounds/the-return-of-the-8-bit-era-301292.mp3',
      gameStart: '/sounds/ui/switch1.wav',
      buttonClick: '/sounds/ui/click1.wav'
    };
    
    console.log('SpookyAudioManager initialized');
  }

  /**
   * Initialize audio manager and preload sounds
   */
  async init() {
    if (this.initialized) return;
    
    try {
      // Load sounds
      await this.loadSounds();
      
      // Set up volume controls
      this.setupVolumeControls();
      
      // Add mute toggle button if it doesn't exist
      this.setupMuteToggle();
      
      this.initialized = true;
      console.log('SpookyAudioManager initialized successfully');
    } catch (error) {
      console.warn('SpookyAudioManager initialization failed:', error);
      // Fail gracefully - game will work without sound
    }
  }

  /**
   * Load all sound files
   */
  async loadSounds() {
    const loadPromises = [];
    
    for (const [key, path] of Object.entries(this.soundPaths)) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = this.volume;
      
      // Set looping for ambient sounds
      if (key.includes('ambient')) {
        audio.loop = true;
        audio.volume = this.volume * 0.3; // Lower volume for ambient
      }
      
      const loadPromise = new Promise((resolve) => {
        audio.addEventListener('canplaythrough', () => {
          this.sounds[key] = audio;
          console.log(`Loaded sound: ${key}`);
          resolve();
        });
        
        audio.addEventListener('error', () => {
          console.warn(`Failed to load sound: ${key}`);
          resolve(); // Resolve anyway to not block initialization
        });
        
        audio.src = path;
      });
      
      loadPromises.push(loadPromise);
    }
    
    await Promise.all(loadPromises);
  }

  /**
   * Play ambient haunted background sound
   */
  playAmbient() {
    if (this.isMuted) return;
    
    try {
      // Try to play the primary ambient sound
      if (this.sounds.ambient) {
        this.currentAmbient = this.sounds.ambient;
      } else if (this.sounds.ambientAlt) {
        this.currentAmbient = this.sounds.ambientAlt;
      }
      
      if (this.currentAmbient) {
        this.currentAmbient.currentTime = 0;
        this.currentAmbient.volume = this.volume * 0.3;
        
        const playPromise = this.currentAmbient.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Ambient sound play failed:', error);
          });
        }
      }
    } catch (error) {
      console.warn('Error playing ambient sound:', error);
    }
  }

  /**
   * Stop ambient background sound
   */
  stopAmbient() {
    if (this.currentAmbient) {
      this.currentAmbient.pause();
      this.currentAmbient.currentTime = 0;
    }
  }

  /**
   * Play coin collection sound with mystical echo effect
   */
  playCoinCollect() {
    if (this.isMuted) return;
    
    const sound = this.sounds.coinMystical || this.sounds.coinCollect;
    if (sound) {
      this.playSound(sound);
    }
  }

  /**
   * Play bomb explosion sound with ghostly scream
   */
  playBombExplode() {
    if (this.isMuted) return;
    
    const sound = this.sounds.bombGhostly || this.sounds.bombExplode;
    if (sound) {
      this.playSound(sound);
    }
  }

  /**
   * Play victory fanfare with eerie undertones
   */
  playVictory() {
    if (this.isMuted) return;
    
    const sound = this.sounds.victoryEerie || this.sounds.victory;
    if (sound) {
      this.playSound(sound);
    }
  }

  /**
   * Play game start sound
   */
  playGameStart() {
    if (this.isMuted) return;
    
    if (this.sounds.gameStart) {
      this.playSound(this.sounds.gameStart);
    }
  }

  /**
   * Play button click sound
   */
  playButtonClick() {
    if (this.isMuted) return;
    
    if (this.sounds.buttonClick) {
      this.playSound(this.sounds.buttonClick);
    }
  }

  /**
   * Generic sound playback helper
   */
  playSound(audio) {
    if (!audio || this.isMuted) return;
    
    try {
      // Clone the audio for overlapping sounds
      const sound = audio.cloneNode();
      sound.volume = this.volume;
      
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Sound play failed:', error);
        });
      }
      
      // Clean up after playing
      sound.addEventListener('ended', () => {
        sound.remove();
      });
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    this.saveVolumePreference();
    
    // Update all loaded sounds
    for (const sound of Object.values(this.sounds)) {
      if (sound) {
        if (sound.loop) {
          sound.volume = this.volume * 0.3; // Lower for ambient
        } else {
          sound.volume = this.volume;
        }
      }
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.saveMutePreference();
    
    if (this.isMuted) {
      this.stopAmbient();
    }
    
    this.updateMuteButton();
    return this.isMuted;
  }

  /**
   * Mute audio
   */
  mute() {
    if (!this.isMuted) {
      this.toggleMute();
    }
  }

  /**
   * Unmute audio
   */
  unmute() {
    if (this.isMuted) {
      this.toggleMute();
    }
  }

  /**
   * Get current mute state
   */
  isMutedState() {
    return this.isMuted;
  }

  /**
   * Setup volume controls UI
   */
  setupVolumeControls() {
    // Check if volume control already exists
    let volumeControl = document.getElementById('volumeControl');
    if (volumeControl) return;
    
    // Create volume control styled as a potion bottle meter
    volumeControl = document.createElement('div');
    volumeControl.id = 'volumeControl';
    volumeControl.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 80px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 15px;
      background: linear-gradient(180deg, var(--haunted-purple, #1a0a2e), var(--spooky-black, #0d0d0d));
      border: 2px solid var(--ghost-green, #00ff41);
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
      font-family: 'Creepster', cursive;
      color: var(--bone-white, #e8e8e8);
    `;
    
    const label = document.createElement('span');
    label.textContent = '🧪 Volume:';
    label.style.fontSize = '14px';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = String(this.volume * 100);
    slider.style.cssText = `
      width: 100px;
      accent-color: var(--ghost-green, #00ff41);
    `;
    
    slider.addEventListener('input', (e) => {
      this.setVolume(parseInt(e.target.value) / 100);
    });
    
    volumeControl.appendChild(label);
    volumeControl.appendChild(slider);
    document.body.appendChild(volumeControl);
  }

  /**
   * Setup mute toggle button
   */
  setupMuteToggle() {
    let muteButton = document.getElementById('muteToggle');
    if (muteButton) {
      this.updateMuteButton();
      return;
    }
    
    muteButton = document.createElement('button');
    muteButton.id = 'muteToggle';
    muteButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 2px solid var(--ghost-green, #00ff41);
      background: linear-gradient(135deg, var(--haunted-purple, #1a0a2e), var(--midnight-blue, #16213e));
      color: var(--bone-white, #e8e8e8);
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    muteButton.addEventListener('click', () => {
      this.toggleMute();
      this.playButtonClick();
    });
    
    muteButton.addEventListener('mouseenter', () => {
      muteButton.style.transform = 'scale(1.1)';
      muteButton.style.boxShadow = '0 0 30px rgba(0, 255, 65, 0.5)';
    });
    
    muteButton.addEventListener('mouseleave', () => {
      muteButton.style.transform = 'scale(1)';
      muteButton.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.3)';
    });
    
    document.body.appendChild(muteButton);
    this.updateMuteButton();
  }

  /**
   * Update mute button icon based on state
   */
  updateMuteButton() {
    const muteButton = document.getElementById('muteToggle');
    if (muteButton) {
      muteButton.textContent = this.isMuted ? '🔇' : '🔊';
      muteButton.title = this.isMuted ? 'Unmute Sounds' : 'Mute Sounds';
    }
  }

  /**
   * Load mute preference from localStorage
   */
  loadMutePreference() {
    try {
      const saved = localStorage.getItem('hauntForGold_audioMuted');
      return saved === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Save mute preference to localStorage
   */
  saveMutePreference() {
    try {
      localStorage.setItem('hauntForGold_audioMuted', String(this.isMuted));
    } catch (error) {
      console.warn('Failed to save mute preference:', error);
    }
  }

  /**
   * Load volume preference from localStorage
   */
  loadVolumePreference() {
    try {
      const saved = localStorage.getItem('hauntForGold_audioVolume');
      return saved ? parseFloat(saved) : 0.7; // Default 70%
    } catch (error) {
      return 0.7;
    }
  }

  /**
   * Save volume preference to localStorage
   */
  saveVolumePreference() {
    try {
      localStorage.setItem('hauntForGold_audioVolume', String(this.volume));
    } catch (error) {
      console.warn('Failed to save volume preference:', error);
    }
  }

  /**
   * Clean up audio resources
   */
  destroy() {
    this.stopAmbient();
    
    // Stop all sounds
    for (const sound of Object.values(this.sounds)) {
      if (sound) {
        sound.pause();
        sound.currentTime = 0;
      }
    }
    
    // Remove UI elements
    const volumeControl = document.getElementById('volumeControl');
    const muteButton = document.getElementById('muteToggle');
    
    if (volumeControl) volumeControl.remove();
    if (muteButton) muteButton.remove();
    
    this.sounds = {};
    this.initialized = false;
  }
}

// Create global instance
const spookyAudioManager = new SpookyAudioManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => spookyAudioManager.init());
} else {
  spookyAudioManager.init();
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.spookyAudioManager = spookyAudioManager;
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpookyAudioManager;
}
