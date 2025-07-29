// Input Handling Module
export class InputHandler {
    constructor() {
        this.diagnosticsPanel = null;
        this.sceneManager = null;
        this.keys = {
            left: false,
            right: false,
        };

        // Track key press state to prevent key repeat issues
        this.keyPressed = {
            drop: false,
            d: false,
            t: false,
        };

        this.setupEventListeners();
    }

    registerDiagnosticsPanel(diagnosticsPanel) {
        this.diagnosticsPanel = diagnosticsPanel;
    }

    registerSceneManager(sceneManager) {
        this.sceneManager = sceneManager;
    }

    setupEventListeners() {
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });

        document.addEventListener('keydown', (event) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space'].includes(event.code)) {
                event.preventDefault();
            }
            this.handleKeyDown(event);
        });
    }

    handleKeyDown(event) {
        switch (event.code) {
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'ArrowDown':
            case 'Space':
                // Only drop if this is a new key press (not a repeat)
                if (!this.keyPressed.drop) {
                    this.keyPressed.drop = true;
                    this.sceneManager.inputKeyPressed(event.code);
                }
                break;
            case 'KeyD':
                if (!this.keyPressed.d) {
                    this.keyPressed.d = true;
                    alert('D panel toggled');
                    this.diagnosticsPanel.toggle();
                }
                break;
            case 'KeyT':
                if (!this.keyPressed.t) {
                    this.keyPressed.t = true;
                    alert('Testing ball drop functionality');
                    this.sceneManager.inputKeyPressed(event.code);
                }
                break;
        }
    }

    handleKeyUp(event) {
        switch (event.code) {
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'ArrowDown':
            case 'Space':
                this.keyPressed.drop = false;
                break;
            case 'KeyD':
                this.keyPressed.d = false;
                break;
            case 'KeyT':
                this.keyPressed.t = false;
                break;
        }
    }

    getInput() {
        if (this.keys.left) {
            this.sceneManager.inputKeyPressed('ArrowLeft');
        } else if (this.keys.right) {
            this.sceneManager.inputKeyPressed('ArrowRight');
        }
    }

    // Cleanup method
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}
