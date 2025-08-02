import { DiagnosticPanel } from './diagnostics.js';

import { SceneBallsX } from './sceneballsx.js';
import { SceneSplash } from './scenesplash.js';
import { SceneMenu } from './scenemenu.js';
import { SceneSettings } from './scenesettings.js';

export class SceneManager {
    static GameScenes = Object.freeze({
        splash: 'splash',
        menu: 'menu',
        main: 'main',
        ballsX: 'ballsX',
        settings: 'settings',
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
            case SceneManager.GameScenes.menu:
                this.createSceneMenu();
                break;
            case SceneManager.GameScenes.main:
                break;
            case SceneManager.GameScenes.ballsX:
                this.createSceneBallsX();
                break;
            case SceneManager.GameScenes.settings:
                this.createSceneSettings();
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

    createSceneMenu() {
        if (!this.sceneMenu) {
            this.sceneMenu = new SceneMenu(this.canvas);
        }
    }

    createSceneBallsX() {
        if (!this.sceneBallsX) {
            this.sceneBallsX = new SceneBallsX(this.canvas);
        }
    }

    createSceneSettings() {
        if (!this.sceneSettings) {
            this.sceneSettings = new SceneSettings(this.canvas);
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
            case SceneManager.GameScenes.menu:
                vHtml = this.sceneMenu.getSceneStateHtml();
                break;
            case SceneManager.GameScenes.main:
                vHtml = this.getSceneMainStateHtml();
                break;
            case SceneManager.GameScenes.ballsX:
                vHtml = this.sceneBallsX.getSceneStateHtml();
                break;
            case SceneManager.GameScenes.settings:
                vHtml = this.sceneSettings.getSceneStateHtml();
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
        this.sceneMenu = null;
        this.sceneBallsX = null;
        this.sceneSettings = null;
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
        // No manual input - auto-transition handles this
    }

    inputKeyPressedMenu(code) {
        switch (code) {
            case 'ArrowUp':
            case 'ArrowDown':
                this.sceneMenu.inputKeyPressed(code, false);
                break;
            case 'Enter':
                // Handle menu selection
                if (this.sceneMenu.selectedOption === 0) {
                    // Start Game
                    this.setCurrentScene(SceneManager.GameScenes.ballsX);
                } else if (this.sceneMenu.selectedOption === 1) {
                    // Settings
                    this.setCurrentScene(SceneManager.GameScenes.settings);
                }
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

    inputKeyPressedSettings(code) {
        switch (code) {
            case 'Escape':
                this.setCurrentScene(SceneManager.GameScenes.menu);
                break;
            case 'Enter':
                // Check if Back option is selected
                if (this.sceneSettings.selectedOption === 3) {
                    this.setCurrentScene(SceneManager.GameScenes.menu);
                } else {
                    // Pass other input to the settings scene
                    this.sceneSettings.inputKeyPressed(code, false);
                }
                break;
            default:
                // Pass other input to the settings scene
                this.sceneSettings.inputKeyPressed(code, false);
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
                    case SceneManager.GameScenes.menu:
                        this.inputKeyPressedMenu(code);
                        break;
                    case SceneManager.GameScenes.main:
                        this.inputKeyPressedMain(code);
                        break;
                    case SceneManager.GameScenes.ballsX:
                        this.sceneBallsX.inputKeyPressed(code, debug);
                        break;
                    case SceneManager.GameScenes.settings:
                        this.inputKeyPressedSettings(code);
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
                    // Check for auto-transition
                    if (this.sceneSplash.shouldTransition()) {
                        this.sceneSplash.markTransitioned();
                        this.setCurrentScene(SceneManager.GameScenes.menu);
                    }
                }
                break;
            case SceneManager.GameScenes.menu:
                if (this.sceneMenu) {
                    this.sceneMenu.updateFrame();
                }
                break;
            case SceneManager.GameScenes.main:
                this.updateFrameMain();
                break;
            case SceneManager.GameScenes.ballsX:
                if (this.sceneBallsX) {
                    this.sceneBallsX.updateFrame();
                    // Check for exit to menu request
                    if (this.sceneBallsX.shouldExitToMenu()) {
                        console.log('Exit to menu requested, transitioning to menu scene');
                        this.sceneBallsX.markExitProcessed();
                        this.setCurrentScene(SceneManager.GameScenes.menu);
                    }
                }
                break;
            case SceneManager.GameScenes.settings:
                if (this.sceneSettings) {
                    this.sceneSettings.updateFrame();
                }
                break;
            default:
                break;
        }

        this.diagnosticsPanel.renderPanel();
    }
}
