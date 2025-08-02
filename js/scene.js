import { DiagnosticPanel } from './diagnostics.js';

import { SceneBallsX } from './sceneballsx.js';

export class SceneManager {
    static GameScenes = Object.freeze({
        main: 'main',
        ballsX: 'ballsX',
        config: 'config',
    });
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputHandler = null;

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
        };

        this.diagnosticsPanel = new DiagnosticPanel();
        this.diagnosticsPanel.registerSceneManager(this);

        this.setCurrentScene(SceneManager.GameScenes.main);

        this.createSceneBallsX();
    }

    setCurrentScene(scene) {
        this.currentScene = scene;

        switch (scene) {
            case SceneManager.GameScenes.main:
                break;
            case SceneManager.GameScenes.ballsX:
                this.createSceneBallsX();
                break;
            case SceneManager.GameScenes.config:
                break;
            default:
                break;
        }
    }

    createSceneBallsX() {
        if (!this.sceneBallsX) {
            this.sceneBallsX = new SceneBallsX(this.canvas);
        }
    }

    registerInputHandler(inputHandler) {
        this.inputHandler = inputHandler;
        this.inputHandler.registerSceneManager(this);
    }

    getSceneMainStateHtml() {
        const vHtml = `
            <strong>Scene: Main</strong><br>
        `;
        return vHtml;
    }

    getSceneStateHtml() {
        let vHtml = '';

        switch (this.currentScene) {
            case SceneManager.GameScenes.main:
                vHtml = this.getSceneMainStateHtml();
                break;
            case SceneManager.GameScenes.ballsX:
                vHtml = this.sceneBallsX.getSceneStateHtml();
                break;
            case SceneManager.GameScenes.config:
                break;
            default:
                break;
        }

        return vHtml;
    }

    setupEventHandlers() {}

    start() {}

    destroy() {
        this.sceneBallsX = null;
        this.diagnosticsPanel = null;
    }

    renderSceneMain() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = 'Harrison Digital - Scene Manager';

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#777777';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const text = 'Scene Manager';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

        // Get all bodies and render them
    }

    inputKeyPressedMain(code) {
        switch (code) {
            case 'ArrowLeft':
                this.setCurrentScene(SceneManager.GameScenes.ballsX);
                break;
            case 'ArrowRight':
                break;
            default:
                break;
        }
    }

    inputKeyPressed(code) {
        let debug = this.diagnosticsPanel.enabled;

        switch (code) {
            case 'KeyD':
                this.diagnosticsPanel.toggle();
                break;
            default: {
                switch (this.currentScene) {
                    case SceneManager.GameScenes.main:
                        this.inputKeyPressedMain(code);
                        break;
                    case SceneManager.GameScenes.ballsX:
                        this.sceneBallsX.inputKeyPressed(code, debug);
                        break;
                    case SceneManager.GameScenes.config:
                        break;
                    default:
                        break;
                }
            }
        }
    }

    updateFrameMain() {
        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        this.renderSceneMain();
    }

    updateFrame() {
        this.inputHandler.getInput();

        switch (this.currentScene) {
            case SceneManager.GameScenes.main:
                this.updateFrameMain();
                break;
            case SceneManager.GameScenes.ballsX:
                if (this.sceneBallsX) {
                    this.sceneBallsX.updateFrame();
                }
                break;
            case SceneManager.GameScenes.config:
                break;
            default:
                break;
        }

        this.diagnosticsPanel.renderPanel();
    }
}
