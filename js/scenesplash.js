export class SceneSplash {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputHandler = null;

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
        };
    }

    getSceneStateHtml() {
        const vHtml = `
            <strong>Scene: Splash</strong><br>
        `;
        return vHtml;
    }

    setupEventHandlers() {}

    start() {}

    destroy() {}

    renderScene() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = 'Harrison Digital - Splash Screen';

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dark blue gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Main title
        this.ctx.font = 'bold 72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('OH BALLS', this.canvas.width / 2, this.canvas.height / 2 - 100);

        // Subtitle
        this.ctx.font = '32px Arial';
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText('Physics Game', this.canvas.width / 2, this.canvas.height / 2 - 40);

        // Instructions
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#999999';
        this.ctx.fillText('Press ENTER to continue', this.canvas.width / 2, this.canvas.height / 2 + 80);
        this.ctx.fillText('Press C for Configuration', this.canvas.width / 2, this.canvas.height / 2 + 120);
    }

    inputKeyPressed(code, debug) {
        // This will be handled by SceneManager to switch scenes
        switch (code) {
            case 'Enter':
                // Switch to main scene - handled by SceneManager
                break;
            case 'KeyC':
                // Switch to config scene - handled by SceneManager
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

        this.renderScene();
    }
}