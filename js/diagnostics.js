// Diagnostic Panel for debugging physics issues
export class DiagnosticPanel {
    constructor(scene) {
        this.scene = scene;
        this.enabled = false;
        this.panel = null;
        this.ballManager = null;
        this.sceneManager = null;

        this.createPanel();
    }

    createPanel() {
        // Create diagnostic panel HTML
        this.panel = document.createElement('div');
        this.panel.id = 'diagnostic-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 675px;
            height: calc(100vh - 20px);
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            border: 2px solid #00ff00;
            border-radius: 5px;
            z-index: 1000;
            overflow-y: auto;
            display: none;
        `;

        this.panel.innerHTML = `
            <h3 style="margin-top: 0; color: #00ffff;">🔧 Physics Diagnostics</h3>
            <div id="diagnostic-content"></div>
        `;

        document.body.appendChild(this.panel);
    }

    registerBallManager(ballManager) {
        this.ballManager = ballManager;
    }

    registerSceneManager(sceneManager) {
        this.sceneManager = sceneManager;
    }

    toggle() {
        this.enabled = !this.enabled;
        this.panel.style.display = this.enabled ? 'block' : 'none';
    }

    // Called by main game loop when enabled
    renderPanel() {
        if (this.enabled) {
            const content = document.getElementById('diagnostic-content');
            if (!content) return;

            content.innerHTML = ''; // Clear previous content

            if (this.sceneManager) {
                content.innerHTML += `
                    <div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
                        ${this.sceneManager.getSceneStateHtml()}
                    </div>
                `;
            }

            if (this.ballManager) {
                content.innerHTML += `
                    <div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
                        ${this.ballManager.getBallsStateHtml()}
                    </div>
                `;
            }
        }
    }

    // Cleanup method
    destroy() {
        if (this.panel) {
            document.body.removeChild(this.panel);
        }
    }
}
