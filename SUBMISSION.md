# Haunt For Gold - Kiroween Hackathon Submission

## Category: Costume Contest 🎃

> Build any app but show us a haunting user interface that's polished and unforgettable. Bring in spooky design elements that enhance your app's function.

---

## 📝 Short Description (200 characters)

Spooky multiplayer coin-grab game with haunted UI, fog effects, controller support & 3 play modes. Built entirely with Kiro specs, hooks & steering. Collect gold, dodge ghosts, avoid bombs! 🎃👻

---

## 📖 Full Description

**Haunt For Gold** is a real-time multiplayer pixel art game where players race to collect cursed coins while dodging ghostly enemies and explosive pumpkin bombs. The game transforms a classic arcade concept into an immersive Halloween experience with atmospheric visual effects and polished spooky UI.

### 🎮 Game Modes

- **Online Multiplayer**: Real-time 1v1 matches with Socket.IO matchmaking queue and rematch functionality
- **Local Multiplayer**: Couch co-op for 2-4 players using game controllers (Gamepad API)
- **Practice Mode**: Solo play against AI opponent to hone your skills

### 👻 Haunted Features

- **Atmospheric Effects**: Dynamic fog particles, flickering ambient lights, vignette overlays
- **Spooky UI**: Haunted color palette (deep purples, ghost green, pumpkin orange), glowing buttons, cobweb decorations
- **Halloween Decorations**: Floating ghosts, pumpkins, bats, and skeleton elements throughout the interface
- **Immersive Audio**: Background music with toggle control
- **Controller Vibration**: Haptic feedback for coin collection, bomb hits, enemy collisions, and victory

### 🎯 Gameplay

- Collect cursed gold coins (+10 points)
- Avoid ghostly snake enemies (-5 points)
- Don't hit pumpkin bombs (-20 points)
- Use speed boost (Spacebar/R2 trigger) for 2x movement
- First to 500 points wins!

### 🔧 Technical Highlights

- **Backend**: Node.js, Express, Socket.IO for real-time communication
- **Frontend**: HTML5 Canvas with custom pixel art renderer
- **Database**: SQLite with Sequelize ORM for persistent player names
- **Authentication**: Cookie-based player identification (no accounts needed)
- **Controllers**: Full Gamepad API integration with menu navigation and in-game controls
- **Privacy**: GDPR-compliant cookie consent and privacy policy

---

## 🎬 Video Demo
    
[YouTube/Vimeo Link Here]

**Video Contents:**
1. Home screen showcase (spooky UI, fog effects, decorations)
2. Online multiplayer match demonstration
3. Local multiplayer controller setup and gameplay
4. Practice mode with AI opponent
5. Controller navigation through menus
6. Speed boost and bomb mechanics
7. Winner screen and rematch flow

---

## 🔗 Links

- **Live Demo**: [Your deployed URL]
- **GitHub Repository**: [Your repo URL]
- **Open Source License**: MIT

---

## 🛠️ How Kiro Was Used

### Spec-Driven Development

The local multiplayer feature was built entirely using Kiro's spec-driven approach:

**Requirements Phase** (`/.kiro/specs/local-multiplayer/requirements.md`):
- Defined 8 user stories covering controller detection, player setup, game mechanics, and winner flow
- Each story included detailed acceptance criteria ensuring nothing was missed
- Example: "As a player, I want to see real-time controller detection so that I know when my controller is connected"

**Design Phase** (`/.kiro/specs/local-multiplayer/design.md`):
- Outlined technical architecture including Gamepad API integration patterns
- Defined data models for LocalPlayer, GameSettings, and LocalGameState
- Specified component interactions and state management approach

**Task Breakdown** (`/.kiro/specs/local-multiplayer/tasks.md`):
- Kiro generated granular implementation tasks from the design
- Each task was independently implementable and testable
- Systematic progression from setup screen → game logic → winner handling

**Impact**: The spec-driven approach prevented scope creep and ensured comprehensive feature coverage. Every acceptance criterion was systematically addressed, resulting in a polished local multiplayer experience.

### Steering Documents

Created `/.kiro/steering/project-context.md` to maintain consistency:

```markdown
# Haunt For Gold - Project Context

## Tech Stack
- Backend: Node.js, Express, Socket.IO
- Frontend: HTML5 Canvas, Vanilla JavaScript
- Database: SQLite with Sequelize ORM

## Design Theme: Haunted Gold Rush
- Dark purple/black color palette with ghostly green accents
- Pixel art ghosts, skeletons, and haunted elements
- Eerie animations and particle effects

## Code Style Guidelines
- Use ES6+ JavaScript features
- Follow camelCase naming conventions
- Add JSDoc comments for public functions
```

**Impact**: Every Kiro response stayed consistent with the Halloween aesthetic. When asking for new features, Kiro automatically applied the spooky theme without needing reminders. CSS variables, color choices, and UI patterns remained cohesive throughout development.

### Vibe Coding Highlights

**Fog Particle System**: Described wanting "atmospheric fog that slowly drifts across the game" - Kiro generated a complete particle system with configurable opacity, speed, and wrapping behavior.

**Controller Vibration Feedback**: Asked for "haptic feedback when collecting coins and hitting bombs" - Kiro implemented dual-rumble patterns with different intensities for each event type.

**Spooky Renderer**: Requested "haunted visual effects for the game canvas" - Kiro created cobweb drawings, flickering torch lights, vignette overlays, and pulsing glow effects for coins and bombs.

**Privacy Policy Page**: Asked for "GDPR-compliant privacy policy with controller navigation" - Kiro generated a complete themed page with gamepad scrolling and navigation support.

### Agent Hooks

Used hooks for automated workflows:
- File save triggers for running linting checks
- Test execution on code changes
- Automatic server restart during development

### Most Impressive Code Generation

The `GameRenderer` class (~1200 lines) was largely generated through iterative Kiro conversations:
- Multi-layer rendering pipeline (background → fog → walls → coins → bombs → enemies → players → effects)
- Proximity-based player rendering to handle overlapping characters
- Dynamic visual feedback system for collisions and score changes
- Spooky decorative elements (cobwebs, ambient lights, dust particles)

---

## 📋 Submission Checklist

- [x] Working software application using Kiro
- [x] Costume Contest category (haunting UI)
- [x] Text description explaining features
- [x] Demo video under 3 minutes
- [x] Public GitHub repository
- [x] Open source license (MIT)
- [x] `/.kiro` directory at repo root (not in .gitignore)
- [x] Kiro usage write-up
- [x] Testing URL provided

---

## 🏆 Why Costume Contest?

Haunt For Gold exemplifies the Costume Contest category by transforming a simple coin-collection game into a fully immersive Halloween experience:

1. **Cohesive Visual Theme**: Every UI element follows the haunted aesthetic - from glowing ghost-green buttons to pumpkin-orange accents
2. **Atmospheric Effects**: Fog particles, flickering lights, and vignette overlays create genuine spooky ambiance
3. **Thoughtful Details**: Cobwebs in corners, floating decorations, skull-faced coins, evil pumpkin bombs
4. **Polished Interactions**: Controller vibration, smooth animations, and responsive feedback
5. **Consistent Experience**: The theme extends to every screen - home, game, winner, privacy policy

The UI isn't just decorated - it's designed to enhance gameplay by creating an immersive haunted world where collecting gold feels like a ghostly adventure.

---

## 👤 Team

[Your name/team info]

---

## 📜 License

MIT License - See LICENSE file in repository
