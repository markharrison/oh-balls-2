// Main Game Controller
import { SceneBallsX } from './sceneballsx.js';
import { InputHandler } from './input.js';
import { DiagnosticPanel } from './diagnostics.js';

class Main {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.running = false;

        this.diagnosticsPanel = new DiagnosticPanel();
        this.inputHandler = new InputHandler();
        this.inputHandler.registerDiagnosticsPanel(this.diagnosticsPanel);

        // Initialize core systems
        this.sceneBallsX = new SceneBallsX(this.canvas);
        this.sceneBallsX.registerInputHandler(this.inputHandler);
        this.sceneBallsX.registerDiagnosticsPanel(this.diagnosticsPanel);

        this.diagnosticsPanel.registerSceneBallsX(this.sceneBallsX);
        this.diagnosticsPanel.registerBallManager(this.sceneBallsX.ballManager);
    }

    start() {
        if (this.running) return;
        this.sceneBallsX.start();

        this.running = true;
        this.gameLoop();
    }

    stop() {
        this.running = false;
        this.sceneManager.stop();
    }

    gameLoop() {
        if (!this.running) return;

        this.sceneBallsX.updateFrame();

        requestAnimationFrame(() => this.gameLoop());
    }

    destroy() {
        this.stop();
        this.sceneBallsX.destroy();
        this.sceneBallsX = null; // Remove reference for GC

        this.inputHandler = null;
        this.diagnosticsPanel = null;
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
