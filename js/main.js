import { SceneManager } from './scene.js';
import { InputHandler } from './input.js';

class Main {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.running = false;

        this.inputHandler = new InputHandler();
        this.inputHandler.registerDiagnosticsPanel(this.diagnosticsPanel);

        this.sceneManager = new SceneManager(this.canvas);
        this.sceneManager.registerInputHandler(this.inputHandler);
    }

    gameLoop() {
        if (!this.running) return;

        this.sceneManager.updateFrame();

        requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        if (this.running) return;

        this.sceneManager.start();

        this.running = true;
        this.gameLoop();
    }

    destroy() {
        this.sceneManager = null;
        this.inputHandler = null;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global game instance
    window.main = new Main();

    window.main.start();

    // Add debug command to console
});

// Handle page unload cleanup
window.addEventListener('beforeunload', () => {
    if (window.main) {
        window.main.destroy();
    }
});
