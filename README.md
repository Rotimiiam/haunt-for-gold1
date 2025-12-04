# 👻 Haunt For Gold 🎃

A spooky multiplayer pixel art game where players collect cursed coins while avoiding ghostly enemies in a haunted realm. Built for Halloween with atmospheric effects and real-time multiplayer action!

## 🎮 Game Features

- **Multiple Game Modes**: Practice solo, play local multiplayer with friends, or compete online
- **Real-time Online Multiplayer**: Battle other players in real-time coin collection races
- **Local Multiplayer**: Split-screen action for 2 players on the same device
- **Spooky Atmosphere**: Animated fog, flying bats, and eerie sound effects
- **Character Selection**: Choose your ghostly avatar
- **Dynamic Difficulty**: Game gets harder as you collect more coins
- **Controller Support**: Full gamepad support for the best experience
- **Player Statistics**: Track your wins, losses, and high scores

## 🎧 Best Experienced With

- Headphones for immersive spooky sound effects
- Game controllers for smooth gameplay

## 🕹️ Game Controls

**Keyboard:**
- Arrow keys or WASD to move your character
- Navigate menus with arrow keys and Enter

**Gamepad:**
- Left stick or D-pad to move
- A button to select in menus

**Objective:**
- Collect cursed coins to earn points
- Avoid ghostly enemies and bomb coins
- First player to reach 500 points wins!

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/Rotimiiam/haunt-for-gold.git
   cd haunt-for-gold
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory (or copy from `.env.example`):

   ```bash
   PORT=3001
   MAX_PLAYERS=2
   WINNING_SCORE=500
   DIFFICULTY_THRESHOLD=200
   SESSION_SECRET=your_session_secret_here
   ```

4. Start the server

   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3001`

## 🎨 Tech Stack

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5 Canvas, CSS3, Vanilla JavaScript
- **Real-time Communication**: Socket.IO for multiplayer
- **Authentication**: Passport.js with Google OAuth (optional)
- **Database**: SQLite for user data and statistics

## 🎃 Game Modes

1. **Practice Mode**: Hone your skills solo against AI enemies
2. **Local Multiplayer**: Play with a friend on the same device
3. **Online Multiplayer**: Compete against players worldwide in real-time

## 📜 License

This project is licensed under the ISC License - see the LICENSE file for details.
