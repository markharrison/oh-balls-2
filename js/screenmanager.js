import { DiagnosticPanel } from './diagnostics.js';
import { SceneBase } from './scenebase.js';

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

        // Initialize scene instances
        this.scenes = {
            [SceneManager.GameScenes.splash]: new SceneSplash(canvas, this),
            [SceneManager.GameScenes.menu]: new SceneMenu(canvas, this),
            [SceneManager.GameScenes.ballsX]: new SceneBallsX(canvas, this),
            [SceneManager.GameScenes.settings]: new SceneSettings(canvas, this),
        };

        // Set manager reference for scenes that need it
        Object.values(this.scenes).forEach(scene => {
            if (scene.setManager) {
                scene.setManager(this);
            }
        });

        this.currentSceneKey = SceneManager.GameScenes.splash;
        this.currentScene = this.scenes[this.currentSceneKey];
        this.currentScene.enter();
    }

    setCurrentScene(sceneKey) {
        if (this.scenes[sceneKey]) {
            if (this.currentScene) {
                this.currentScene.exit();
            }
            this.currentSceneKey = sceneKey;
            this.currentScene = this.scenes[sceneKey];
            this.currentScene.enter();
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

        switch (this.currentSceneKey) {
            case SceneManager.GameScenes.splash:
                vHtml = this.scenes.splash.getSceneStateHtml();
                break;
            case SceneManager.GameScenes.menu:
                vHtml = this.scenes.menu.getSceneStateHtml();
                break;
            case SceneManager.GameScenes.main:
                vHtml = this.getSceneMainStateHtml();
                break;
            case SceneManager.GameScenes.ballsX:
                vHtml = this.scenes.ballsX.getSceneStateHtml();
                break;
            case SceneManager.GameScenes.settings:
                vHtml = this.scenes.settings.getSceneStateHtml();
                break;
            default:
                break;
        }

        return vHtml;
    }

    setupEventHandlers() {}

    destroy() {
        Object.values(this.scenes).forEach(scene => {
            if (scene.exit) {
                scene.exit();
            }
        });
        this.scenes = null;
        this.currentScene = null;
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
                this.scenes.menu.inputKeyPressed(code, false);
                break;
            case 'Enter':
                // Handle menu selection
                if (this.scenes.menu.selectedOption === 0) {
                    // Start Game
                    this.setCurrentScene(SceneManager.GameScenes.ballsX);
                } else if (this.scenes.menu.selectedOption === 1) {
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
                if (this.scenes.settings.selectedOption === 3) {
                    this.setCurrentScene(SceneManager.GameScenes.menu);
                } else {
                    // Pass other input to the settings scene
                    this.scenes.settings.inputKeyPressed(code, false);
                }
                break;
            default:
                // Pass other input to the settings scene
                this.scenes.settings.inputKeyPressed(code, false);
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
                switch (this.currentSceneKey) {
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
                        this.scenes.ballsX.inputKeyPressed(code, debug);
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

    update(dt) {
        const nextSceneKey = this.currentScene.update(dt);
        if (nextSceneKey && this.scenes[nextSceneKey]) {
            this.setCurrentScene(nextSceneKey);
        }
    }

    render(ctx) {
        this.currentScene.render(ctx);
    }

    updateFrame() {
        this.inputHandler.getInput();

        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        // Use new update/render interface
        this.update(this.clock.deltaTime);
        this.render(this.ctx);

        this.diagnosticsPanel.renderPanel();
    }
}
