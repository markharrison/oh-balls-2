// Main Game Controller
import { SceneManager } from './scene.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.running = false;

        // Initialize core systems
        this.sceneManager = new SceneManager(this.canvas);
    }

    start() {
        if (this.running) return;
        this.sceneManager.start();

        this.running = true;
        this.gameLoop();
    }

    stop() {
        this.running = false;
        this.sceneManager.stop();
    }

    gameLoop() {
        if (!this.running) return;

        this.sceneManager.updateFrame();

        requestAnimationFrame(() => this.gameLoop());
    }

    destroy() {
        this.stop();
        this.sceneManager.destroy();
        this.sceneManager = null; // Remove reference for GC
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
