import { DiagnosticPanel } from './diagnostics.js';

import { SceneBallsX } from './sceneballsx.js';
import { SceneSplash } from './scenesplash.js';
import { SceneConfig } from './sceneconfig.js';

export class SceneManager {
    static GameScenes = Object.freeze({
        splash: 'splash',
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

        this.setCurrentScene(SceneManager.GameScenes.splash);
    }

    setCurrentScene(scene) {
        this.currentScene = scene;

        switch (scene) {
            case SceneManager.GameScenes.splash:
                this.createSceneSplash();
                break;
            case SceneManager.GameScenes.main:
                break;
            case SceneManager.GameScenes.ballsX:
                this.createSceneBallsX();
                break;
            case SceneManager.GameScenes.config:
                this.createSceneConfig();
                break;
            default:
                break;
        }
    }

    createSceneSplash() {
        if (!this.sceneSplash) {
            this.sceneSplash = new SceneSplash(this.canvas);
        }
    }

    createSceneBallsX() {
        if (!this.sceneBallsX) {
            this.sceneBallsX = new SceneBallsX(this.canvas);
        }
    }

    createSceneConfig() {
        if (!this.sceneConfig) {
            this.sceneConfig = new SceneConfig(this.canvas);
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
            case SceneManager.GameScenes.splash:
                vHtml = this.sceneSplash.getSceneStateHtml();
                break;
            case SceneManager.GameScenes.main:
                vHtml = this.getSceneMainStateHtml();
                break;
            case SceneManager.GameScenes.ballsX:
                vHtml = this.sceneBallsX.getSceneStateHtml();
                break;
            case SceneManager.GameScenes.config:
                vHtml = this.sceneConfig.getSceneStateHtml();
                break;
            default:
                break;
        }

        return vHtml;
    }

    setupEventHandlers() {}

    start() {}

    destroy() {
        this.sceneSplash = null;
        this.sceneBallsX = null;
        this.sceneConfig = null;
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

    inputKeyPressedSplash(code) {
        switch (code) {
            case 'Enter':
                this.setCurrentScene(SceneManager.GameScenes.main);
                break;
            case 'KeyC':
                this.setCurrentScene(SceneManager.GameScenes.config);
                break;
            default:
                break;
        }
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

    inputKeyPressedConfig(code) {
        switch (code) {
            case 'Escape':
                this.setCurrentScene(SceneManager.GameScenes.main);
                break;
            case 'Enter':
                // Check if Back option is selected
                if (this.sceneConfig.selectedOption === 3) {
                    this.setCurrentScene(SceneManager.GameScenes.main);
                } else {
                    // Pass other input to the config scene
                    this.sceneConfig.inputKeyPressed(code, false);
                }
                break;
            default:
                // Pass other input to the config scene
                this.sceneConfig.inputKeyPressed(code, false);
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
                    case SceneManager.GameScenes.splash:
                        this.inputKeyPressedSplash(code);
                        break;
                    case SceneManager.GameScenes.main:
                        this.inputKeyPressedMain(code);
                        break;
                    case SceneManager.GameScenes.ballsX:
                        this.sceneBallsX.inputKeyPressed(code, debug);
                        break;
                    case SceneManager.GameScenes.config:
                        this.inputKeyPressedConfig(code);
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
            case SceneManager.GameScenes.splash:
                if (this.sceneSplash) {
                    this.sceneSplash.updateFrame();
                }
                break;
            case SceneManager.GameScenes.main:
                this.updateFrameMain();
                break;
            case SceneManager.GameScenes.ballsX:
                if (this.sceneBallsX) {
                    this.sceneBallsX.updateFrame();
                }
                break;
            case SceneManager.GameScenes.config:
                if (this.sceneConfig) {
                    this.sceneConfig.updateFrame();
                }
                break;
            default:
                break;
        }

        this.diagnosticsPanel.renderPanel();
    }
}
