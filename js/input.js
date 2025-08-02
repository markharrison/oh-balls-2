// Input Handling Module
export class InputHandler {
    constructor() {
        this.diagnosticsPanel = null;
        this.sceneManager = null;
        // keyState: true if key is currently down
        this.keyState = {};
        // gamepadState: true if gamepad button is currently down
        this.gamepadState = {};
        this.setupEventListeners();
    }

    registerDiagnosticsPanel(diagnosticsPanel) {
        this.diagnosticsPanel = diagnosticsPanel;
    }

    registerSceneManager(sceneManager) {
        this.sceneManager = sceneManager;
    }

    setupEventListeners() {
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        document.addEventListener('keydown', (event) => {
            // Prevent default for arrow keys and space
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
                event.preventDefault();
            }
            this.handleKeyDown(event);
        });
    }

    handleKeyDown(event) {
        // Arrow keys: just set state, repeat handled in getInput
        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            this.keyState[event.code] = true;
            return;
        }
        // Letter keys: only fire on new press
        if (/^Key[A-Z]$/.test(event.code)) {
            if (!this.keyState[event.code]) {
                this.keyState[event.code] = true;
                this.sceneManager.inputKeyPressed(event.code);
            }
            return;
        }
        // Space/ArrowDown: only fire on new press
        if (event.code === 'Space' || event.code === 'ArrowDown') {
            if (!this.keyState[event.code]) {
                this.keyState[event.code] = true;
                this.sceneManager.inputKeyPressed(event.code);
            }
            return;
        }
    }

    handleKeyUp(event) {
        // On keyup, clear state for all keys
        this.keyState[event.code] = false;
    }

    getInput() {
        if (this.keyState['ArrowLeft']) {
            this.sceneManager.inputKeyPressed('ArrowLeft');
        } else if (this.keyState['ArrowRight']) {
            this.sceneManager.inputKeyPressed('ArrowRight');
        }

        // Gamepad polling
        this.pollGamepad();
    }

    pollGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (!gp) return;

        // Left thumbstick X axis for left/right auto-repeat
        const axisX = gp.axes[0] || 0;
        const deadZone = 0.3;
        if (axisX < -deadZone) {
            this.sceneManager.inputKeyPressed('ArrowLeft');
        } else if (axisX > deadZone) {
            this.sceneManager.inputKeyPressed('ArrowRight');
        }
        // A button (button 0) as Space
        if (gp.buttons[0]?.pressed) {
            if (!this.gamepadState['Space']) {
                this.sceneManager.inputKeyPressed('Space');
                this.gamepadState['Space'] = true;
            }
        } else {
            this.gamepadState['Space'] = false;
        }
        // B button (button 1) as KeyD
        if (gp.buttons[1]?.pressed) {
            if (!this.gamepadState['KeyD']) {
                //   this.sceneManager.inputKeyPressed('KeyX');
                this.gamepadState['KeyD'] = true;
            }
        } else {
            this.gamepadState['KeyD'] = false;
        }
    }

    // Cleanup method
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}
