// Main Game Controller
import { SceneManager } from './scene.js';
import { BallManager } from './ball.js';
import { InputHandler } from './input.js';
import { DiagnosticPanel } from './diagnostics.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.running = false;
        
        // Initialize core systems
        this.sceneManager = new SceneManager(this.canvas);
        this.ballManager = new BallManager(this.sceneManager);
        this.inputHandler = new InputHandler(this.ballManager);
        this.diagnostics = new DiagnosticPanel(this);
        
        // Clock for consistent timing
        this.clock = {
            deltaTime: 0,
            currentTime: 0
        };
    }

    init() {
        // Start scene manager
        this.sceneManager.start();
        
        // Spawn first ball
        this.ballManager.spawnBall();
        
        // Start game loop
        this.start();
    }

    start() {
        if (this.running) return;
        
        this.running = true;
        this.gameLoop();
    }

    stop() {
        this.running = false;
        this.sceneManager.stop();
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
        
        // Update scene manager with frame-rate independent timing
        this.sceneManager.update(this.clock.deltaTime);
        
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
        this.diagnostics.destroy();
        
        // Clean up all balls
        const balls = this.ballManager.getAllBalls();
        balls.forEach(ball => ball.destroy());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global game instance
    window.game = new Game();
    
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