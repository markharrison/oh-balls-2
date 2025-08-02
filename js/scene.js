import { BallManager } from './ball.js';
import { PhysicsEngine, PhysicsBodyFactory, metersToPixels } from './physics.js';
import { wallThickness } from './constants.js';
import { fixedTimeStep } from './constants.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputHandler = null;

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
        };
    }

    registerDiagnosticsPanel(diagnosticsPanel) {
        this.diagnosticsPanel = diagnosticsPanel;
    }

    registerInputHandler(inputHandler) {
        this.inputHandler = inputHandler;
        this.inputHandler.registerSceneManager(this);
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: SceneManager</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    start() {}

    stop() {}

    destroy() {}

    renderScene() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = 'Harrison Digital - Screen Manager';

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#777777';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const text = 'Screen Manager';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

        // Get all bodies and render them
    }

    inputKeyPressed(code) {
        switch (code) {
            case 'ArrowLeft':
                break;
            case 'ArrowRight':
                break;
            default:
                break;
        }
    }

    updateFrame() {
        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        this.inputHandler.getInput();

        this.renderScene();

        this.diagnosticsPanel.renderPanel();
    }
}
