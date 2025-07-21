// Main Game Controller
import { PhysicsEngine } from './physics.js';
import { BallManager } from './ball.js';
import { InputHandler } from './input.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.running = false;
        
        // Initialize core systems
        this.physicsEngine = new PhysicsEngine(this.canvas);
        this.ballManager = new BallManager(this.physicsEngine);
        this.inputHandler = new InputHandler(this.ballManager);
        
        // Clock for consistent timing
        this.clock = {
            deltaTime: 0,
            currentTime: 0
        };
    }

    init() {
        console.log('Initializing Oh Balls 2...');
        
        // Start physics engine
        this.physicsEngine.start();
        
        // Spawn first ball
        this.ballManager.spawnBall();
        
        // Start game loop
        this.start();
        
        console.log('Game initialized successfully!');
    }

    start() {
        if (this.running) return;
        
        this.running = true;
        this.gameLoop();
    }

    stop() {
        this.running = false;
        this.physicsEngine.stop();
    }

    gameLoop() {
        if (!this.running) return;

        const currentTime = performance.now();
        this.updateClock(currentTime);
        
        // Update game systems
        this.update();
        
        // Schedule next frame
        requestAnimationFrame(() => this.gameLoop());
    }

    updateClock(currentTime) {
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;
        
        // Handle first frame or prevent large jumps
        if (this.clock.deltaTime <= 0 || this.clock.deltaTime > 16.0) {
            this.clock.deltaTime = 16.0; // Stay safely under 16.667ms limit
        }
    }

    update() {
        // Update input handling
        this.inputHandler.update();
        
        // Update physics engine with frame-rate independent timing
        this.physicsEngine.update(this.clock.deltaTime);
        
        // Update ball manager (spawning logic, UI updates, etc.)
        this.ballManager.update();
        
        // Clean up balls that have fallen off screen
        this.ballManager.cleanup();
    }

    // Debug methods
    getGameState() {
        return {
            running: this.running,
            ballCount: this.ballManager.getAllBalls().length,
            currentBall: this.ballManager.currentBall ? true : false,
            nextBallSize: this.ballManager.nextBallSize,
            deltaTime: this.clock.deltaTime
        };
    }

    // Cleanup method
    destroy() {
        this.stop();
        this.inputHandler.destroy();
        
        // Clean up all balls
        const balls = this.ballManager.getAllBalls();
        balls.forEach(ball => ball.destroy());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global game instance
    window.game = new Game();
    
    // Add some debug info to console
    console.log('Oh Balls 2 - Physics Game');
    console.log('Controls: ← → Arrow keys to move, ↓ or Space to drop');
    console.log('Access game instance via window.game');
    
    // Initialize the game
    window.game.init();
    
    // Add debug command to console
    window.gameDebug = () => {
        console.log('Game State:', window.game.getGameState());
    };
});

// Handle page unload cleanup
window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.destroy();
    }
});