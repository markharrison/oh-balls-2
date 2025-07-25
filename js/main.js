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
            currentTime: 0,
        };
    }

    start() {
        if (this.running) return;
        this.sceneManager.start();

        this.ballManager.start();
        this.running = true;
        this.gameLoop();
    }

    stop() {
        this.running = false;
        this.sceneManager.stop();
    }

    gameLoop() {
        if (!this.running) return;

        this.updateFrame();

        requestAnimationFrame(() => this.gameLoop());
    }

    updateFrame() {
        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        this.inputHandler.getInput();

        this.sceneManager.updateFrame(this.clock.deltaTime);

        this.ballManager.updateFrame();

        // Update diagnostics if enabled
        this.diagnostics.updateFrame();
    }

    // Debug methods
    getGameState() {
        return {
            running: this.running,
            ballCount: this.ballManager.balls.length,
            currentBall: this.ballManager.currentBall ? true : false,
            nextBallSize: this.ballManager.nextBallSize,
            deltaTime: this.clock.deltaTime,
        };
    }

    // Cleanup method
    destroy() {
        this.stop();
        this.inputHandler.destroy();
        this.diagnostics.destroy();

        // Clean up all balls
        const balls = this.ballManager.getAllBalls();
        balls.forEach((ball) => ball.destroy());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global game instance
    window.game = new Game();

    window.game.start();

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
